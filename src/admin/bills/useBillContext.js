import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLiveSources } from '../data/liveStore';
import { patientDocSource, patientEncountersSource, patientTransactionsSource } from '../data/sources';
import { admissionEndDay, admissionStartDay, buildStatement, dayKey } from '../ipd/ipdMath';
import { roundMoney } from '../billing/money';

// Extra context the detailed-bill layout shows around a bill — nothing here changes the
// bill itself:
//   patient   — age/gender from the patient record
//   encounter — the visit/admission the bill date falls in (admission date, IPD no, room)
//   account   — that visit's payments and balance, from the same logic as the IPD running
//               bill (only for staff allowed to see billing; therapists get null)
// All three are shared live sources, usually already loaded by the patient's profile.
export function useBillContext({ patientId, bill }) {
  const { hasPermission, profile } = useAuth();
  const canSeeAccount = hasPermission('billing', 'view');
  const live = useLiveSources({
    patient: patientDocSource(patientId),
    encounters: patientEncountersSource(patientId),
    ledger: canSeeAccount ? patientTransactionsSource(patientId) : null,
  });
  const patientDoc = live.patient.data;
  const encounters = live.encounters.data;
  const ledger = live.ledger.data;

  const billDay = dayKey(typeof bill.invoiceDate === 'string' ? new Date(`${bill.invoiceDate}T12:00:00`) : bill.invoiceDate) || dayKey(new Date());

  const encounter = useMemo(() => {
    const list = (encounters || []).filter((e) => e.startedAt);
    const covering = list.filter((e) => admissionStartDay(e) <= billDay && billDay <= admissionEndDay(e));
    const pick = (arr) => [...arr].sort((a, b) => (b.startedAt?.toMillis?.() ?? 0) - (a.startedAt?.toMillis?.() ?? 0))[0];
    return pick(covering.filter((e) => e.type === 'inpatient')) || pick(covering) || null;
  }, [encounters, billDay]);

  const account = useMemo(() => {
    if (!canSeeAccount || !ledger || !encounter) return null;
    const statement = buildStatement(ledger, encounter, admissionStartDay(encounter), admissionEndDay(encounter));
    // A saved bill's own charge is already in the ledger; an unsaved (or edited) one is
    // counted at its current total so the preview shows what the account will be.
    const own = bill.transactionId ? statement.charges.find((t) => t.id === bill.transactionId) : null;
    const balance = roundMoney(statement.balance + (own ? Number(own.netAmount) || 0 : 0) - (Number(bill.total) || 0));
    return { payments: statement.payments, totalPayments: statement.totalPayments, balance, discharged: encounter.status !== 'active' };
  }, [canSeeAccount, ledger, encounter, bill.transactionId, bill.total]);

  return { patient: patientDoc, encounter, account, printedBy: profile?.name || '' };
}
