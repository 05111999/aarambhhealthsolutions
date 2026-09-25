import React, { useMemo } from 'react';
import {
  RefreshCw, Users, Receipt, HandCoins, Building2, Inbox, ClipboardList, CalendarCheck, UserCog, Activity,
  BedDouble, Stethoscope, Home, Video, CalendarClock,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../permissions/permissionCatalog';
import { formatMoney } from '../billing/money';
import { SESSION_TYPE_OPTIONS } from '../patients/sessionTypes';
import { useDashboardData } from './useDashboardData';
import {
  patientStats, billingStats, sessionStats, settlementStats, departmentStats, staffStats, inquiryStats,
} from './dashboardStats';
import { StatLink, Section, CardGrid, LinkListBox, LinkListRow } from './DashboardUI';
import ActivityFeed from './ActivityFeed';
import { buildActivity } from './activity';

// Which sections each role sees, in the order that role cares about them. A section
// still only renders if the viewer also holds the matching permission — so a card can
// never link to a page the viewer would be turned away from.
const ROLE_LAYOUTS = {
  superadmin: ['patients', 'billing', 'hospitalSettlement', 'visits', 'sessions', 'staff', 'departments', 'inquiries', 'activity'],
  admin: ['patients', 'billing', 'visits', 'sessions', 'hospitalSettlement', 'inquiries', 'departments', 'staff', 'activity'],
  receptionist: ['visits', 'patients', 'billing', 'sessions', 'inquiries', 'activity'],
  therapist: ['sessions', 'patients', 'activity'],
};

const ACTIVITY_KINDS_BY_ROLE = {
  superadmin: ['patients', 'billing', 'sessions', 'inquiries'],
  admin: ['patients', 'billing', 'sessions', 'inquiries'],
  receptionist: ['patients', 'billing', 'sessions', 'inquiries'],
  therapist: ['sessions', 'patients'],
};

const ROLE_SUBTITLES = {
  superadmin: 'Organisation-wide overview',
  admin: 'Operations overview',
  receptionist: 'Front desk overview',
  therapist: 'Your therapy overview',
};

const SOURCES_BY_ACTIVITY_KIND = {
  patients: ['patients'],
  billing: ['transactions', 'patients'],
  sessions: ['sessionLogs', 'patients'],
  inquiries: ['inquiries', 'applications'],
};

const SkeletonSection = () => (
  <div className="mb-10 animate-pulse">
    <div className="h-8 w-48 bg-white rounded-lg mb-4" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-28 bg-white rounded-2xl border border-border" />
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user, profile, hasPermission } = useAuth();
  const role = profile?.role;
  const isSuperAdmin = role === 'superadmin';

  const can = {
    patients: hasPermission('patients', 'view'),
    billing: hasPermission('billing', 'view'),
    sessions: hasPermission('sessionLogs', 'view'),
    hospitalSettlement: hasPermission('hospitalSettlement', 'view'),
    departments: hasPermission('departments', 'view'),
    inquiries: hasPermission('inquiries', 'view'),
    staff: hasPermission('users', 'view'),
  };

  const activityKinds = (ACTIVITY_KINDS_BY_ROLE[role] || []).filter((k) => can[k]);

  const sections = (ROLE_LAYOUTS[role] || []).filter((key) => {
    if (key === 'visits') return can.patients;
    if (key === 'activity') return activityKinds.length > 0;
    return can[key];
  });

  const sources = useMemo(() => {
    const set = new Set();
    for (const key of sections) {
      if (key === 'patients') set.add('patients');
      if (key === 'visits') {
        set.add('patients');
        if (can.inquiries) set.add('inquiries');
      }
      if (key === 'sessions') set.add('sessionLogs');
      if (key === 'billing') set.add('transactions');
      if (key === 'hospitalSettlement') set.add('settlements');
      if (key === 'departments') set.add('departments');
      if (key === 'inquiries') ['inquiries', 'applications'].forEach((s) => set.add(s));
      if (key === 'staff') {
        set.add('users');
        if (isSuperAdmin) set.add('userRequests');
      }
      if (key === 'activity') {
        for (const kind of activityKinds) {
          SOURCES_BY_ACTIVITY_KIND[kind].filter((s) => s !== 'patients' || can.patients).forEach((s) => set.add(s));
        }
      }
    }
    // Anything patient-linked needs the Trash list, so trashed patients stay out of totals.
    if (['patients', 'transactions', 'sessionLogs', 'settlements'].some((s) => set.has(s))) set.add('trashedPatients');
    return [...set];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.join(','), activityKinds.join(','), isSuperAdmin, can.patients, can.inquiries]);

  const { data: rawData, errors, loading, refresh, updatedAt } = useDashboardData(sources);

  // Same data with every trashed patient — and their bills, sessions and settlements —
  // removed, so no card counts or links to a patient that's in the Trash.
  const data = useMemo(() => {
    const trashed = new Set((rawData.trashedPatients || []).map((p) => p.id));
    const live = (list) => list && list.filter((r) => !trashed.has(r.patientId));
    return {
      ...rawData,
      patients: rawData.patients && rawData.patients.filter((p) => !p.isDeleted),
      transactions: live(rawData.transactions)?.filter((t) => !t.isDeleted), // and trashed bills
      sessionLogs: live(rawData.sessionLogs),
      settlements: live(rawData.settlements),
    };
  }, [rawData]);

  const stats = useMemo(
    () => ({
      patients: data.patients ? patientStats(data.patients) : null,
      billing: data.transactions ? billingStats(data.transactions) : null,
      sessions: data.sessionLogs ? sessionStats(data.sessionLogs, user?.uid) : null,
      settlements: data.settlements ? settlementStats(data.settlements) : null,
      departments: data.departments ? departmentStats(data.departments) : null,
      staff: data.users ? staffStats(data.users, data.userRequests) : null,
      inquiries: data.inquiries && data.applications ? inquiryStats(data.inquiries, data.applications) : null,
      bookingRequests: data.inquiries ? data.inquiries.filter((i) => i.status === 'new' && i.type === 'booking').length : null,
    }),
    [data, user?.uid]
  );

  const activityKey = activityKinds.join(',');
  const activityEvents = useMemo(() => {
    const kinds = activityKey.split(',');
    return buildActivity({
      patients: data.patients,
      includePatientEvents: kinds.includes('patients'),
      transactions: kinds.includes('billing') ? data.transactions : null,
      sessionLogs: kinds.includes('sessions') ? data.sessionLogs : null,
      inquiries: kinds.includes('inquiries') ? data.inquiries : null,
      applications: kinds.includes('inquiries') ? data.applications : null,
    });
  }, [data, activityKey]);

  const firstLoad = loading && !updatedAt;

  const renderSection = (key) => {
    switch (key) {
      case 'patients': {
        const s = stats.patients;
        return (
          <Section key={key} icon={Users} title="Patients" to="/admin/patients?status=all" error={errors.patients}>
            {s && (
              <CardGrid cols={isSuperAdmin ? 6 : 5}>
                <StatLink to="/admin/patients?status=all" label="Total Patients" value={s.total} hint="View all patients" />
                <StatLink to="/admin/patients?status=active" label="Active Patients" value={s.active} tone="text-teal" hint="View active patients" />
                <StatLink to="/admin/patients?status=discharged" label="Discharged" value={s.discharged} hint="View discharged patients" />
                <StatLink to="/admin/patients?status=all&since=month" label="New This Month" value={s.newThisMonth} hint="View this month's patients" />
                <StatLink to="/admin/patients?status=all&hospital=1" label="Hospital-Referred" value={s.hospitalReferred} tone="text-primary" hint="View hospital referrals" />
                {isSuperAdmin && (
                  <StatLink to="/admin/trash" label="In Trash" value={rawData.trashedPatients?.length ?? 0} hint="View deleted patients" />
                )}
              </CardGrid>
            )}
          </Section>
        );
      }

      case 'visits': {
        const s = stats.patients;
        return (
          <Section key={key} icon={CalendarCheck} title="Appointments & Visits" to="/admin/patients?status=active" linkLabel="View active visits" error={errors.patients}>
            {s && (
              <CardGrid cols={can.inquiries ? 5 : 4}>
                {can.inquiries && stats.bookingRequests !== null && (
                  <StatLink
                    to="/admin/inquiries?tab=inquiries&type=booking&status=new"
                    icon={CalendarClock}
                    label="Booking Requests"
                    value={stats.bookingRequests}
                    tone={stats.bookingRequests > 0 ? 'text-amber-600' : 'text-text-dark'}
                    hint="Review consultation requests"
                  />
                )}
                <StatLink to="/admin/patients?status=active&type=inpatient" icon={BedDouble} label="Inpatients (Admitted)" value={s.activeByType.inpatient} hint="View admitted patients" />
                <StatLink to="/admin/patients?status=active&type=outpatient" icon={Stethoscope} label="Outpatient Visits" value={s.activeByType.outpatient} hint="View outpatients" />
                <StatLink to="/admin/patients?status=active&type=homeVisit" icon={Home} label="Home Visits" value={s.activeByType.homeVisit} hint="View home-visit patients" />
                <StatLink to="/admin/patients?status=active&type=virtual" icon={Video} label="Virtual Consultations" value={s.activeByType.virtual} hint="View virtual patients" />
              </CardGrid>
            )}
          </Section>
        );
      }

      case 'sessions': {
        const s = stats.sessions;
        return (
          <Section key={key} icon={ClipboardList} title="Therapy Sessions" to="/admin/sessions?range=today" linkLabel="View sessions" error={errors.sessionLogs}>
            {s && (
              <>
                <CardGrid cols={4}>
                  <StatLink to="/admin/sessions?range=today" label="Today's Sessions" value={s.todayCount} tone="text-teal" hint="View today's sessions" />
                  <StatLink to="/admin/sessions?range=today&mine=1" label="Logged by Me Today" value={s.mineToday} hint="View my sessions" />
                  <StatLink to="/admin/sessions?range=week" label="Last 7 Days" value={s.weekCount} hint="View this week's sessions" />
                  <StatLink to="/admin/sessions?range=all" label="All Sessions" value={s.total} hint="View full session log" />
                </CardGrid>
                <LinkListBox title="Today by session type">
                  {SESSION_TYPE_OPTIONS.map((o) => (
                    <LinkListRow key={o.value} to={`/admin/sessions?range=today&type=${o.value}`} left={o.label} right={s.todayByType[o.value]} />
                  ))}
                </LinkListBox>
              </>
            )}
          </Section>
        );
      }

      case 'billing': {
        const s = stats.billing;
        return (
          <Section key={key} icon={Receipt} title="Billing" to="/admin/billing?view=transactions" linkLabel="View transactions" error={errors.transactions}>
            {s && (
              <>
                <CardGrid cols={5}>
                  <StatLink to="/admin/billing?view=transactions&type=charge" label="Total Charged" value={formatMoney(s.totalCharged)} hint={`${s.chargeCount} charges`} />
                  <StatLink to="/admin/billing?view=transactions&type=payment" label="Total Collected" value={formatMoney(s.totalCollected)} tone="text-teal" hint={`${s.paymentCount} payments`} />
                  <StatLink to="/admin/billing?view=transactions&type=payment&range=today" label="Collected Today" value={formatMoney(s.collectedToday)} tone="text-teal" hint="View today's payments" />
                  <StatLink
                    to="/admin/billing?view=outstanding"
                    label="Outstanding"
                    value={formatMoney(s.outstanding)}
                    tone={s.outstanding > 0 ? 'text-red-600' : 'text-text-dark'}
                    hint={`${s.patientsWithDues} patient${s.patientsWithDues === 1 ? '' : 's'} with dues`}
                  />
                  <StatLink to="/admin/billing?view=transactions&type=discount" label="Discounts Given" value={formatMoney(s.totalDiscounts)} hint={`${s.discountCount} discounted charges`} />
                </CardGrid>
                {s.topServices.length > 0 && (
                  <LinkListBox title="Top services by revenue">
                    {s.topServices.map((svc) => (
                      <LinkListRow
                        key={svc.name}
                        to={`/admin/billing?view=transactions&type=charge&service=${encodeURIComponent(svc.name)}`}
                        left={svc.name}
                        right={formatMoney(svc.revenue)}
                      />
                    ))}
                  </LinkListBox>
                )}
              </>
            )}
          </Section>
        );
      }

      case 'hospitalSettlement': {
        const s = stats.settlements;
        return (
          <Section key={key} icon={HandCoins} title="Hospital Settlement" to="/admin/hospital-settlement" error={errors.settlements}>
            {s && (
              <CardGrid cols={3}>
                <StatLink to="/admin/hospital-settlement?status=all" label="Total Accrued" value={formatMoney(s.accrued)} hint="View all entries" />
                <StatLink to="/admin/hospital-settlement?status=collected" label="Collected" value={formatMoney(s.collected)} tone="text-teal" hint="View collected entries" />
                <StatLink
                  to="/admin/hospital-settlement?status=pending"
                  label="Pending Collection"
                  value={formatMoney(s.pending)}
                  tone={s.pending > 0 ? 'text-red-600' : 'text-text-dark'}
                  hint={`${s.pendingCount} pending entr${s.pendingCount === 1 ? 'y' : 'ies'}`}
                />
              </CardGrid>
            )}
          </Section>
        );
      }

      case 'departments': {
        const s = stats.departments;
        return (
          <Section key={key} icon={Building2} title="Departments & Services" to="/admin/departments" error={errors.departments}>
            {s && (
              <CardGrid cols={5}>
                <StatLink to="/admin/departments" label="Total Items" value={s.total} hint="View full catalog" />
                <StatLink to="/admin/departments?filter=active" label="Active" value={s.active} tone="text-teal" hint="View active items" />
                <StatLink to="/admin/departments?filter=inactive" label="Inactive" value={s.inactive} hint="View inactive items" />
                <StatLink to="/admin/departments?filter=priced" label="Priced Services" value={s.priced} hint="View priced items" />
                <StatLink
                  to="/admin/departments?filter=unpriced"
                  label="Needs Pricing"
                  value={s.unpriced}
                  tone={s.unpriced > 0 ? 'text-amber-600' : 'text-text-dark'}
                  hint="Services with no price yet"
                />
              </CardGrid>
            )}
          </Section>
        );
      }

      case 'inquiries': {
        const s = stats.inquiries;
        return (
          <Section key={key} icon={Inbox} title="Inquiries" to="/admin/inquiries" error={errors.inquiries || errors.applications}>
            {s && (
              <CardGrid cols={4}>
                <StatLink
                  to="/admin/inquiries?tab=inquiries&type=booking&status=new"
                  label="New Consultation Requests"
                  value={s.newBookings}
                  tone={s.newBookings > 0 ? 'text-amber-600' : 'text-text-dark'}
                  hint="View new bookings"
                />
                <StatLink
                  to="/admin/inquiries?tab=inquiries&type=contact&status=new"
                  label="New Messages"
                  value={s.newMessages}
                  tone={s.newMessages > 0 ? 'text-amber-600' : 'text-text-dark'}
                  hint="View new messages"
                />
                <StatLink to="/admin/inquiries?tab=inquiries&status=contacted" label="Awaiting Follow-up" value={s.awaitingFollowUp} hint="Contacted, not yet closed" />
                <StatLink
                  to="/admin/inquiries?tab=applications&status=new"
                  label="New Job Applications"
                  value={s.newApplications}
                  tone={s.newApplications > 0 ? 'text-amber-600' : 'text-text-dark'}
                  hint="View new applications"
                />
              </CardGrid>
            )}
          </Section>
        );
      }

      case 'staff': {
        const s = stats.staff;
        return (
          <Section key={key} icon={UserCog} title="Therapists & Staff" to="/admin/users" error={errors.users}>
            {s && (
              <CardGrid cols={s.pendingRequests !== null ? 6 : 5}>
                <StatLink to="/admin/users?status=active" label="Active Staff" value={s.active} tone="text-teal" hint="View active staff" />
                <StatLink to="/admin/users?role=therapist" label="Therapists" value={s.byRole.therapist} hint="View therapist list" />
                <StatLink to="/admin/users?role=receptionist" label="Receptionists" value={s.byRole.receptionist} hint="View receptionists" />
                <StatLink to="/admin/users?role=admin" label="Admins" value={s.byRole.admin} hint="View admins" />
                <StatLink to="/admin/users?status=disabled" label="Deactivated Accounts" value={s.disabled} hint="View deactivated staff" />
                {s.pendingRequests !== null && (
                  <StatLink
                    to="/admin/users?show=requests"
                    label="Pending Requests"
                    value={s.pendingRequests}
                    tone={s.pendingRequests > 0 ? 'text-amber-600' : 'text-text-dark'}
                    hint="View account requests"
                  />
                )}
              </CardGrid>
            )}
          </Section>
        );
      }

      case 'activity': {
        let target = { to: '/admin/patients?status=all', label: 'View patients' };
        if (role === 'therapist' && can.sessions) target = { to: '/admin/sessions?range=week', label: 'View sessions' };
        else if (can.billing) target = { to: '/admin/billing?view=transactions', label: 'View transactions' };
        return (
          <Section key={key} icon={Activity} title="Recent Activity" to={target.to} linkLabel={target.label}>
            <ActivityFeed events={activityEvents} kinds={activityKinds} />
          </Section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="mb-1">Welcome, {profile?.name}</h1>
          <p className="text-text-muted">
            <span className="font-semibold text-text-dark">{ROLE_LABELS[role] || role}</span>
            {ROLE_SUBTITLES[role] && ` · ${ROLE_SUBTITLES[role]}`}
            {' · '}
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {sections.length > 0 && (
          <div className="flex items-center gap-3">
            {updatedAt && <span className="text-xs text-text-muted">Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2.5 rounded-lg cursor-pointer hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        )}
      </div>

      {sections.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-8 text-center text-text-muted">
          Nothing to show here yet — check with your Super Admin if you think you should have access to more.
        </div>
      )}

      {firstLoad ? sections.slice(0, 3).map((key) => <SkeletonSection key={key} />) : sections.map(renderSection)}
    </div>
  );
};

export default AdminDashboard;
