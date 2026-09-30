import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { hospitalSnapshot } from '../bills/billingHospital';

// Every payment (including an advance at onboarding) gets a receipt number unique to
// the patient: <patient code>-R0001, -R0002… The counter is advanced in the same
// transaction as the payment, so two people recording at once never share a number.

export const receiptCounterRef = (patientId) => doc(db, 'counters', `receipts_${patientId}`);
export const formatReceiptNumber = (patientCode, seq) => `${patientCode}-R${String(seq).padStart(4, '0')}`;

// Receipt fields stored on the payment itself (who received it, which hospital brands
// the receipt — as a text snapshot, so it prints the same later).
export const receiptFields = ({ receiptNumber, hospital, receivedBy, receivedByName }) => ({
  receiptNumber,
  hospitalId: hospital?.id || null,
  hospital: hospital ? hospitalSnapshot(hospital) : null,
  receivedBy,
  receivedByName: receivedByName || '',
});

// Records a payment and assigns its receipt number. `hospitalFor(patient)` picks the
// hospital that brands the receipt. Returns { id, receiptNumber }.
export async function recordPayment({ patientId, payment, hospitalFor, user, profile }) {
  const patientRef = doc(db, 'patients', patientId);
  const paymentRef = doc(collection(db, 'patients', patientId, 'transactions'));
  const counterRef = receiptCounterRef(patientId);

  const receiptNumber = await runTransaction(db, async (tx) => {
    const [patientSnap, counterSnap] = await Promise.all([tx.get(patientRef), tx.get(counterRef)]);
    if (!patientSnap.exists()) throw new Error('Patient not found.');
    const next = (counterSnap.exists() ? counterSnap.data().seq : 0) + 1;
    const number = formatReceiptNumber(patientSnap.data().patientCode, next);
    const hospital = hospitalFor(patientSnap.data());
    tx.set(counterRef, { seq: next }, { merge: true });
    tx.set(paymentRef, {
      ...payment,
      type: 'payment',
      ...receiptFields({ receiptNumber: number, hospital, receivedBy: user.uid, receivedByName: profile?.name }),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return number;
  });
  return { id: paymentRef.id, receiptNumber };
}

// Payments recorded before receipts existed have no number; they still get a receipt,
// labelled from the payment's own ID.
export const receiptNumberOf = (payment) => payment.receiptNumber || `PAY-${payment.id.slice(0, 8).toUpperCase()}`;
