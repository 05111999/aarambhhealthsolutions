import { UserPlus, Receipt, CreditCard, ClipboardList, Inbox, Briefcase } from 'lucide-react';
import { formatMoney } from '../billing/money';
import { SESSION_TYPE_LABELS } from '../patients/sessionTypes';

const when = (ts) => (ts?.toDate ? ts.toDate() : null);

// Builds a single time-ordered feed from whichever sources the viewer can read.
// `patients` is always used as a name lookup; `includePatientEvents` controls whether
// onboarding events themselves appear in the feed.
export function buildActivity({ patients, includePatientEvents, transactions, sessionLogs, inquiries, applications }) {
  const nameOf = new Map((patients || []).map((p) => [p.id, p.name]));
  const patientName = (id) => nameOf.get(id) || 'a patient';
  const events = [];

  for (const p of includePatientEvents ? patients || [] : []) {
    events.push({
      id: `p-${p.id}`, kind: 'patients', at: when(p.createdAt), icon: UserPlus, tone: 'text-primary bg-primary/10',
      title: 'New patient onboarded', detail: `${p.name} · ${p.patientCode}`, to: `/admin/patients/${p.id}`,
    });
  }
  for (const t of transactions || []) {
    const isPayment = t.type === 'payment';
    events.push({
      id: `t-${t.patientId}-${t.id}`, kind: 'billing', at: when(t.createdAt),
      icon: isPayment ? CreditCard : Receipt,
      tone: isPayment ? 'text-teal bg-teal/10' : 'text-amber-600 bg-amber-50',
      title: isPayment ? `Payment received · ${formatMoney(t.amount)}` : `Charge added · ${formatMoney(t.netAmount)}`,
      detail: isPayment ? patientName(t.patientId) : `${t.serviceName} · ${patientName(t.patientId)}`,
      to: `/admin/patients/${t.patientId}`,
    });
  }
  for (const log of sessionLogs || []) {
    events.push({
      id: `s-${log.patientId}-${log.id}`, kind: 'sessions', at: when(log.createdAt), icon: ClipboardList,
      tone: 'text-teal bg-teal/10',
      title: `Session logged · ${SESSION_TYPE_LABELS[log.sessionType] || log.sessionType}`,
      detail: patientName(log.patientId), to: `/admin/patients/${log.patientId}`,
    });
  }
  for (const i of inquiries || []) {
    const isBooking = i.type === 'booking';
    events.push({
      id: `i-${i.id}`, kind: 'inquiries', at: when(i.createdAt), icon: Inbox, tone: 'text-primary bg-primary/10',
      title: isBooking ? 'New consultation request' : 'New contact message', detail: i.name,
      to: `/admin/inquiries?tab=inquiries&type=${i.type}&status=${i.status}`,
    });
  }
  for (const a of applications || []) {
    events.push({
      id: `a-${a.id}`, kind: 'inquiries', at: when(a.createdAt), icon: Briefcase, tone: 'text-primary bg-primary/10',
      title: 'New job application', detail: `${a.name} · ${a.roleAppliedFor}`,
      to: `/admin/inquiries?tab=applications&status=${a.status}`,
    });
  }

  return events.filter((e) => e.at).sort((a, b) => b.at - a.at);
}
