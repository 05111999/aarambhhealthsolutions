import {
  collection, query, where, getDocs, getDoc, doc, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';

function toDateKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD, UTC-based — consistent regardless of viewer's timezone
}

function dateRange(start, end) {
  const dates = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor <= last) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export async function getDailyRate(db) {
  const snap = await getDoc(doc(db, 'settings', 'hospitalDailyRate'));
  return snap.exists() ? snap.data().amount || 0 : 0;
}

// Fills in any missing daily hospital-settlement entries for every currently-admitted
// inpatient, from their admission date through today (or their discharge date if that
// already happened). Deterministic doc IDs + a per-day transaction make this safe to
// call repeatedly — already-accrued days are always a no-op, even under concurrency.
//
// `existingIds` is the set of settlement doc IDs the caller already has loaded (the
// Hospital Settlement page keeps them live). Days already in it are skipped without a
// read, so a repeat visit costs nothing instead of one read per day of every stay.
// Missing days still go through the transaction, so concurrent callers stay safe.
// One run at a time per browser tab: revisiting the page while a run is still going
// joins it instead of starting a second run that would contend for the same days.
let inFlight = null;
export function runAccrual(db, uid, options) {
  if (!inFlight) inFlight = accrue(db, uid, options).finally(() => { inFlight = null; });
  return inFlight;
}

async function accrue(db, uid, { dailyRate, existingIds = new Set() } = {}) {
  if (dailyRate === undefined) dailyRate = await getDailyRate(db);
  if (dailyRate <= 0) return { created: 0 };

  const patientsSnap = await getDocs(
    query(collection(db, 'patients'), where('currentPatientType', '==', 'inpatient'), where('currentStatus', '==', 'active'))
  );

  let created = 0;
  for (const patientDoc of patientsSnap.docs) {
    const patient = patientDoc.data();
    if (patient.isDeleted) continue; // no new hospital charges for a patient in the Trash
    const encountersSnap = await getDocs(
      query(
        collection(db, 'patients', patientDoc.id, 'encounters'),
        where('status', '==', 'active'),
        where('type', '==', 'inpatient')
      )
    );

    for (const encounterDoc of encountersSnap.docs) {
      const encounter = encounterDoc.data();
      if (!encounter.startedAt) continue;
      const start = encounter.startedAt.toDate();
      const end = encounter.closedAt ? encounter.closedAt.toDate() : new Date();

      for (const day of dateRange(start, end)) {
        const dateKey = toDateKey(day);
        const settlementId = `${patientDoc.id}_${encounterDoc.id}_${dateKey}`;
        if (existingIds.has(settlementId)) continue;
        const settlementRef = doc(db, 'hospitalSettlements', settlementId);

        const wasCreated = await runTransaction(db, async (tx) => {
          const snap = await tx.get(settlementRef);
          if (snap.exists()) return false;
          tx.set(settlementRef, {
            patientId: patientDoc.id,
            patientName: patient.name,
            encounterId: encounterDoc.id,
            dateKey,
            date: Timestamp.fromDate(day),
            amount: dailyRate,
            status: 'pending',
            collectedAt: null,
            collectedBy: null,
            reference: '',
            createdBy: uid,
            createdAt: serverTimestamp(),
          });
          return true;
        });

        if (wasCreated) created += 1;
      }
    }
  }

  return { created };
}
