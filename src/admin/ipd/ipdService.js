import { collection, doc, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { roundMoney } from '../billing/money';
import { dateInputToTimestamp } from '../../lib/dateInput';

// IPD admission = an inpatient encounter (/patients/{id}/encounters/{encounterId}).
// IPD charges live in the patient's normal ledger (/patients/{id}/transactions) with
// ipd: true and the encounterId, so balances, dues and the discharge check see them.

const encounterRef = (patientId, encounterId) => doc(db, 'patients', patientId, 'encounters', encounterId);

// Gives an admission its IPD bill number (<patient code>-IP1, -IP2 …) the first time its
// account is opened. Safe to call repeatedly; returns the number.
export async function ensureAdmissionNumber(patient, encounterId) {
  const encRef = encounterRef(patient.id, encounterId);
  const counterRef = doc(db, 'counters', `admissions_${patient.id}`);
  return runTransaction(db, async (tx) => {
    const [encSnap, counterSnap] = await Promise.all([tx.get(encRef), tx.get(counterRef)]);
    if (!encSnap.exists()) throw new Error('Admission not found.');
    if (encSnap.data().admissionNumber) return encSnap.data().admissionNumber;
    const seq = (counterSnap.exists() ? counterSnap.data().seq : 0) + 1;
    const admissionNumber = `${patient.patientCode}-IP${seq}`;
    tx.set(counterRef, { seq }, { merge: true });
    tx.update(encRef, { admissionNumber, chargeSeq: 0 });
    return admissionNumber;
  });
}

export async function saveAdmissionDetails(patientId, encounterId, details, uid) {
  const batch = writeBatch(db);
  batch.update(encounterRef(patientId, encounterId), {
    ward: details.ward.trim(),
    roomBed: details.roomBed.trim(),
    treatingDoctor: details.treatingDoctor.trim(),
    expectedDischargeDate: details.expectedDischargeDate ? dateInputToTimestamp(details.expectedDischargeDate) : null,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

const chargeFields = (line) => {
  const quantity = roundMoney(line.quantity);
  const rate = roundMoney(line.rate);
  const amount = roundMoney(quantity * rate);
  return {
    serviceDate: dateInputToTimestamp(line.serviceDate),
    category: line.category,
    serviceName: line.serviceName.trim() || line.category,
    departmentName: line.category, // shown by the existing ledger / transactions views
    description: (line.description || '').trim(),
    quantity,
    rate,
    amount,
    discountAmount: 0,
    netAmount: amount, // = amount − discountAmount, as the ledger rules require
  };
};

// Adds one or more charges (e.g. room rent for several days) in a single transaction,
// numbering them <admission no.>/C001, C002 … from the admission's own counter.
export async function addIpdCharges(patientId, encounterId, lines, uid) {
  const encRef = encounterRef(patientId, encounterId);
  return runTransaction(db, async (tx) => {
    const encSnap = await tx.get(encRef);
    if (!encSnap.exists()) throw new Error('Admission not found.');
    const { admissionNumber, chargeSeq = 0 } = encSnap.data();
    if (!admissionNumber) throw new Error('This admission has no IPD bill number yet — reload and try again.');
    lines.forEach((line, i) => {
      tx.set(doc(collection(db, 'patients', patientId, 'transactions')), {
        type: 'charge',
        ipd: true,
        encounterId,
        chargeNumber: `${admissionNumber}/C${String(chargeSeq + i + 1).padStart(3, '0')}`,
        ...chargeFields(line),
        date: serverTimestamp(), // when it was entered; serviceDate is when it was provided
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
    });
    tx.update(encRef, { chargeSeq: chargeSeq + lines.length });
    return lines.length;
  });
}

const auditEntry = (batch, action, patientId, targetId, uid, before, after) =>
  batch.set(doc(collection(db, 'auditLogs')), {
    action, targetType: 'transaction', targetId, patientId, performedBy: uid, performedAt: serverTimestamp(), before, after,
  });

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? null]));

// Admin+: corrects an IPD charge. The old values are kept in the audit log.
export async function updateIpdCharge(patientId, charge, line, uid) {
  const next = chargeFields(line);
  const keys = ['serviceDate', 'category', 'serviceName', 'description', 'quantity', 'rate', 'amount', 'netAmount'];
  const batch = writeBatch(db);
  batch.update(doc(db, 'patients', patientId, 'transactions', charge.id), { ...next, updatedBy: uid, updatedAt: serverTimestamp() });
  auditEntry(batch, 'updateIpdCharge', patientId, charge.id, uid, pick(charge, keys), pick(next, keys));
  await batch.commit();
}

// Admin+: corrects a payment's details. Its receipt number never changes.
export async function correctPayment(patientId, payment, form, uid) {
  const next = {
    amount: roundMoney(form.amount),
    method: form.method,
    reference: form.reference.trim(),
    remarks: form.remarks.trim(),
  };
  const keys = ['amount', 'method', 'reference', 'remarks'];
  const batch = writeBatch(db);
  batch.update(doc(db, 'patients', patientId, 'transactions', payment.id), { ...next, updatedBy: uid, updatedAt: serverTimestamp() });
  auditEntry(batch, 'correctPayment', patientId, payment.id, uid, pick(payment, keys), next);
  await batch.commit();
}
