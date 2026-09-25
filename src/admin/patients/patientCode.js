import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { roundMoney } from '../billing/money';

function getMMYY(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear() % 100).padStart(2, '0');
  return `${mm}${yy}`;
}

// Atomically assigns the next patient code for the current month and creates the
// patient + its first encounter in one Firestore transaction, so code assignment can
// never collide or duplicate under concurrent onboarding (Firestore retries the
// transaction automatically on contention).
export async function createPatient(db, formData, uid) {
  const mmyy = getMMYY();
  const counterRef = doc(db, 'counters', `patientCode_${mmyy}`);
  const patientRef = doc(collection(db, 'patients'));
  const encounterRef = doc(collection(db, 'patients', patientRef.id, 'encounters'));
  const advanceAmount = roundMoney(formData.advanceAmount || 0);
  const advanceTxnRef = advanceAmount > 0 ? doc(collection(db, 'patients', patientRef.id, 'transactions')) : null;

  const patientData = await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextSeq = (counterSnap.exists() ? counterSnap.data().seq : 0) + 1;
    const patientCode = `ARCS${String(nextSeq).padStart(4, '0')}${mmyy}`;

    tx.set(counterRef, { seq: nextSeq }, { merge: true });

    const data = {
      patientCode,
      name: formData.name.trim(),
      nameLower: formData.name.trim().toLowerCase(),
      age: Number(formData.age),
      gender: formData.gender,
      address: formData.address,
      contact1: formData.contact1,
      contact1Digits: formData.contact1.replace(/\D/g, ''),
      contact2: formData.contact2 || '',
      contact2Digits: (formData.contact2 || '').replace(/\D/g, ''),
      primaryDiagnosis: formData.primaryDiagnosis,
      currentPatientType: formData.patientType,
      currentStatus: 'active',
      advanceAmount,
      attenderName: formData.attenderName || '',
      attenderContact: formData.attenderContact || '',
      attenderContactDigits: (formData.attenderContact || '').replace(/\D/g, ''),
      sessionFrequency: formData.sessionFrequency || '',
      referredFromHospital: !!formData.referredFromHospital,
      referringHospitalName: formData.referredFromHospital ? formData.referringHospitalName || '' : '',
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    };
    tx.set(patientRef, data);

    tx.set(encounterRef, {
      type: formData.patientType,
      status: 'active',
      startedAt: serverTimestamp(),
      closedAt: null,
      createdBy: uid,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });

    if (advanceTxnRef) {
      tx.set(advanceTxnRef, {
        type: 'payment',
        amount: advanceAmount,
        method: 'advance',
        reference: '',
        encounterId: encounterRef.id,
        date: serverTimestamp(),
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
    }

    return data;
  });

  // Server timestamp sentinels aren't real values until the write is acknowledged —
  // swap in client-side Dates so the caller can render the result immediately.
  return { id: patientRef.id, ...patientData, createdAt: new Date(), updatedAt: new Date() };
}
