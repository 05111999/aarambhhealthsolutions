import { useEffect, useMemo, useState } from 'react';
import { collection, collectionGroup, doc, onSnapshot, query, where, updateDoc, Timestamp } from 'firebase/firestore';
import {
  CalendarClock, MessageSquare, Briefcase, UserPlus, UserCog, AlertTriangle, HandCoins, Tag, ClipboardList,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { formatMoney } from '../billing/money';
import { balancesByPatient, isSameDay } from '../dashboard/dashboardStats';
import { matchesDepartmentFilter } from '../departments/departmentFilters';

// Which notification types each role cares about. A type still only appears if the
// user also holds the permission behind it, so nothing ever links to a page they
// can't open.
const TYPES_BY_ROLE = {
  superadmin: ['booking', 'message', 'application', 'newPatient', 'accountRequest', 'dues', 'settlement', 'pricing'],
  admin: ['booking', 'message', 'application', 'newPatient', 'dues', 'settlement', 'pricing'],
  receptionist: ['booking', 'message', 'dues'],
  therapist: ['newPatient', 'noSessionsToday'],
};

const NEW_PATIENT_WINDOW_DAYS = 7;
const MAX_EVENTS = 25;

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const at = (ts) => (ts?.toDate ? ts.toDate() : null);

// Subscribes only while `enabled`; returns null until the first snapshot arrives.
function useLive(enabled, buildQuery, mapSnap = rows) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled) {
      setData(null);
      return undefined;
    }
    return onSnapshot(buildQuery(), (snap) => setData(mapSnap(snap)), () => setData(null));
    // buildQuery/mapSnap are stable module-level functions at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return data;
}

const patientRows = (snap) => snap.docs.map((d) => ({ id: d.id, patientId: d.ref.parent.parent.id, ...d.data() }));
const qInquiries = () => query(collection(db, 'inquiries'), where('status', '==', 'new'));
const qApplications = () => query(collection(db, 'jobApplications'), where('status', '==', 'new'));
const qRequests = () => query(collection(db, 'userRequests'), where('status', '==', 'pending'));
const qSettlements = () => query(collection(db, 'hospitalSettlements'), where('status', '==', 'pending'));
const qDepartments = () => collection(db, 'departments');
const qTransactions = () => collectionGroup(db, 'transactions');
const qSessionLogs = () => collectionGroup(db, 'sessionLogs');
const qRecentPatients = () => {
  const since = new Date();
  since.setDate(since.getDate() - NEW_PATIENT_WINDOW_DAYS);
  return query(collection(db, 'patients'), where('createdAt', '>=', Timestamp.fromDate(since)));
};

// trashedIds: patients in the Trash, whose bills, settlements and sessions must not
// raise notifications.
export function useNotifications(trashedIds = new Set()) {
  const { user, profile, hasPermission } = useAuth();
  const role = profile?.role;
  const isSuperAdmin = role === 'superadmin';

  const enabledTypes = (TYPES_BY_ROLE[role] || []).filter((type) => {
    switch (type) {
      case 'booking':
      case 'message':
      case 'application':
        return hasPermission('inquiries', 'view');
      case 'newPatient':
        return hasPermission('patients', 'view');
      case 'accountRequest':
        return isSuperAdmin;
      case 'dues':
        return hasPermission('billing', 'view');
      case 'settlement':
        return hasPermission('hospitalSettlement', 'view');
      case 'pricing':
        return hasPermission('departments', 'manage');
      case 'noSessionsToday':
        return hasPermission('sessionLogs', 'create');
      default:
        return false;
    }
  });
  const has = (t) => enabledTypes.includes(t);
  const canViewInquiries = hasPermission('inquiries', 'view');

  // Inquiry listeners also feed the sidebar's Inquiries badge, so they run for anyone
  // who can view inquiries — even a role that doesn't get inquiry notifications.
  const inquiries = useLive(canViewInquiries, qInquiries);
  const applications = useLive(canViewInquiries, qApplications);
  const requests = useLive(has('accountRequest'), qRequests);
  const recentPatientsRaw = useLive(has('newPatient'), qRecentPatients);
  const transactionsRaw = useLive(has('dues'), qTransactions, patientRows);
  const settlementsRaw = useLive(has('settlement'), qSettlements);
  const departments = useLive(has('pricing'), qDepartments);
  const sessionLogsRaw = useLive(has('noSessionsToday'), qSessionLogs, patientRows);

  const trashKey = [...trashedIds].sort().join(',');
  const { recentPatients, transactions, settlements, sessionLogs } = useMemo(() => {
    const live = (rowsList, key = 'patientId') => rowsList && rowsList.filter((r) => !trashedIds.has(r[key]));
    return {
      recentPatients: recentPatientsRaw && recentPatientsRaw.filter((p) => !p.isDeleted),
      transactions: live(transactionsRaw)?.filter((t) => !t.isDeleted), // trashed bills don't count as dues
      settlements: live(settlementsRaw),
      sessionLogs: live(sessionLogsRaw),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentPatientsRaw, transactionsRaw, settlementsRaw, sessionLogsRaw, trashKey]);

  const items = useMemo(() => {
    const alerts = [];
    const events = [];

    if (has('dues') && transactions) {
      let total = 0;
      let count = 0;
      for (const balance of balancesByPatient(transactions).values()) {
        if (balance < 0) {
          total += -balance;
          count += 1;
        }
      }
      if (count > 0) {
        alerts.push({
          id: `dues:${count}:${Math.round(total)}`, icon: AlertTriangle, tone: 'text-red-600 bg-red-50',
          title: `${count} patient${count === 1 ? ' has' : 's have'} outstanding dues`,
          detail: `${formatMoney(total)} to collect`, to: '/admin/billing?view=outstanding',
        });
      }
    }
    if (has('settlement') && settlements?.length) {
      const total = settlements.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      alerts.push({
        id: `settlement:${settlements.length}:${Math.round(total)}`, icon: HandCoins, tone: 'text-amber-600 bg-amber-50',
        title: `${formatMoney(total)} hospital settlement pending`,
        detail: `${settlements.length} entr${settlements.length === 1 ? 'y' : 'ies'} awaiting collection`,
        to: '/admin/hospital-settlement?status=pending',
      });
    }
    if (has('pricing') && departments) {
      const count = departments.filter((n) => matchesDepartmentFilter(n, departments, 'unpriced')).length;
      if (count > 0) {
        alerts.push({
          id: `pricing:${count}`, icon: Tag, tone: 'text-amber-600 bg-amber-50',
          title: `${count} service${count === 1 ? ' needs' : 's need'} pricing`,
          detail: 'They can’t be billed until a price is set', to: '/admin/departments?filter=unpriced',
        });
      }
    }
    if (has('noSessionsToday') && sessionLogs) {
      const today = new Date();
      const mine = sessionLogs.filter((l) => l.recordedBy === user?.uid && isSameDay(at(l.date), today)).length;
      if (mine === 0) {
        alerts.push({
          id: `nosession:${today.toDateString()}`, icon: ClipboardList, tone: 'text-teal bg-teal/10',
          title: 'You haven’t logged any sessions today',
          detail: 'Open a patient to add today’s treatment progress', to: '/admin/patients?status=active',
        });
      }
    }

    for (const i of inquiries || []) {
      if (i.type === 'booking' && has('booking')) {
        events.push({
          id: `booking:${i.id}`, at: at(i.createdAt), icon: CalendarClock, tone: 'text-primary bg-primary/10',
          title: `New consultation request from ${i.name}`, detail: i.service ? `Interested in ${i.service}` : i.phone,
          to: '/admin/inquiries?tab=inquiries&type=booking&status=new',
        });
      } else if (i.type === 'contact' && has('message')) {
        events.push({
          id: `message:${i.id}`, at: at(i.createdAt), icon: MessageSquare, tone: 'text-primary bg-primary/10',
          title: `New message from ${i.name}`, detail: i.message?.slice(0, 80) || i.phone,
          to: '/admin/inquiries?tab=inquiries&type=contact&status=new',
        });
      }
    }
    if (has('application')) {
      for (const a of applications || []) {
        events.push({
          id: `application:${a.id}`, at: at(a.createdAt), icon: Briefcase, tone: 'text-primary bg-primary/10',
          title: `New job application: ${a.name}`, detail: a.roleAppliedFor,
          to: '/admin/inquiries?tab=applications&status=new',
        });
      }
    }
    for (const r of requests || []) {
      events.push({
        id: `request:${r.id}`, at: at(r.requestedAt), icon: UserCog, tone: 'text-amber-600 bg-amber-50',
        title: `Pending account request: ${r.name}`, detail: r.email, to: '/admin/users?show=requests',
      });
    }
    for (const p of recentPatients || []) {
      events.push({
        id: `patient:${p.id}`, at: at(p.createdAt), icon: UserPlus, tone: 'text-teal bg-teal/10',
        title: `New patient onboarded: ${p.name}`, detail: p.patientCode, to: `/admin/patients/${p.id}`,
      });
    }

    events.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
    return [...alerts.map((a) => ({ ...a, kind: 'alert' })), ...events.slice(0, MAX_EVENTS).map((e) => ({ ...e, kind: 'event' }))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledTypes.join(','), inquiries, applications, requests, recentPatients, transactions, settlements, departments, sessionLogs, user?.uid]);

  const readIds = profile?.notificationState?.readIds || [];
  const withRead = items.map((n) => ({ ...n, unread: !readIds.includes(n.id) }));
  const unreadCount = withRead.filter((n) => n.unread).length;

  // Only ids still on screen are kept, so the stored list never grows without bound.
  const saveReadIds = (ids) =>
    updateDoc(doc(db, 'users', user.uid), { 'notificationState.readIds': [...new Set(ids)] }).catch(() => {});

  const markRead = (id) => saveReadIds([...readIds.filter((r) => items.some((n) => n.id === r)), id]);
  const markAllRead = () => saveReadIds(items.map((n) => n.id));

  const newInquiryCount = (inquiries?.length || 0) + (applications?.length || 0);

  return { items: withRead, unreadCount, markRead, markAllRead, newInquiryCount };
}
