import { roundMoney } from '../billing/money';
import { matchesDepartmentFilter } from '../departments/departmentFilters';

// Pure functions over raw Firestore rows. Every number here must match what the
// destination page shows after applying the same filter — keep definitions in sync.

const toDate = (ts) => (ts?.toDate ? ts.toDate() : null);

export function isSameDay(a, b) {
  return !!a && !!b && a.toDateString() === b.toDateString();
}

export function isWithinLastDays(date, days) {
  if (!date) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return date >= start;
}

export function isThisMonth(date) {
  if (!date) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function patientStats(patients) {
  const activeByType = { inpatient: 0, outpatient: 0, homeVisit: 0, virtual: 0 };
  let active = 0;
  let discharged = 0;
  let newThisMonth = 0;
  let hospitalReferred = 0;

  for (const p of patients) {
    if (p.currentStatus === 'active') {
      active += 1;
      if (activeByType[p.currentPatientType] !== undefined) activeByType[p.currentPatientType] += 1;
    } else if (p.currentStatus === 'discharged') {
      discharged += 1;
    }
    if (isThisMonth(toDate(p.createdAt))) newThisMonth += 1;
    if (p.referredFromHospital) hospitalReferred += 1;
  }

  return { total: patients.length, active, discharged, newThisMonth, hospitalReferred, activeByType };
}

// Per-patient balance = payments − net charges. Outstanding is the sum of only the
// negative balances — one patient's credit must never offset another's debt.
export function balancesByPatient(transactions) {
  const map = new Map();
  for (const t of transactions) {
    const prev = map.get(t.patientId) || 0;
    if (t.type === 'payment') map.set(t.patientId, prev + roundMoney(t.amount));
    else if (t.type === 'charge') map.set(t.patientId, prev - roundMoney(t.netAmount));
  }
  return map;
}

export function billingStats(transactions) {
  let totalCharged = 0;
  let totalCollected = 0;
  let totalDiscounts = 0;
  let chargeCount = 0;
  let paymentCount = 0;
  let discountCount = 0;
  let collectedToday = 0;
  const byService = new Map();
  const today = new Date();

  for (const t of transactions) {
    if (t.type === 'payment') {
      const amount = roundMoney(t.amount);
      totalCollected += amount;
      paymentCount += 1;
      if (isSameDay(toDate(t.date), today)) collectedToday += amount;
    } else if (t.type === 'charge') {
      const net = roundMoney(t.netAmount);
      totalCharged += net;
      chargeCount += 1;
      if (roundMoney(t.discountAmount) > 0) {
        totalDiscounts += roundMoney(t.discountAmount);
        discountCount += 1;
      }
      byService.set(t.serviceName, roundMoney((byService.get(t.serviceName) || 0) + net));
    }
  }

  let outstanding = 0;
  let patientsWithDues = 0;
  for (const balance of balancesByPatient(transactions).values()) {
    if (balance < 0) {
      outstanding += -balance;
      patientsWithDues += 1;
    }
  }

  const topServices = [...byService.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue: roundMoney(revenue) }));

  return {
    totalCharged: roundMoney(totalCharged),
    totalCollected: roundMoney(totalCollected),
    totalDiscounts: roundMoney(totalDiscounts),
    outstanding: roundMoney(outstanding),
    collectedToday: roundMoney(collectedToday),
    chargeCount,
    paymentCount,
    discountCount,
    patientsWithDues,
    topServices,
  };
}

export function sessionStats(logs, uid) {
  const today = new Date();
  const todayByType = { free: 0, physioMorning: 0, physioAfternoon: 0, ot: 0 };
  let todayCount = 0;
  let weekCount = 0;
  let mineToday = 0;

  for (const log of logs) {
    const date = toDate(log.date);
    if (isSameDay(date, today)) {
      todayCount += 1;
      if (todayByType[log.sessionType] !== undefined) todayByType[log.sessionType] += 1;
      if (log.recordedBy === uid) mineToday += 1;
    }
    if (isWithinLastDays(date, 7)) weekCount += 1;
  }

  return { total: logs.length, todayCount, weekCount, mineToday, todayByType };
}

export function settlementStats(entries) {
  let accrued = 0;
  let collected = 0;
  let pending = 0;
  let pendingCount = 0;
  for (const e of entries) {
    const amount = roundMoney(e.amount);
    accrued += amount;
    if (e.status === 'collected') collected += amount;
    else {
      pending += amount;
      pendingCount += 1;
    }
  }
  return { accrued: roundMoney(accrued), collected: roundMoney(collected), pending: roundMoney(pending), pendingCount };
}

export function departmentStats(nodes) {
  const count = (filter) => nodes.filter((n) => matchesDepartmentFilter(n, nodes, filter)).length;
  return {
    total: nodes.length,
    active: count('active'),
    inactive: count('inactive'),
    priced: count('priced'),
    unpriced: count('unpriced'),
  };
}

export function staffStats(allUsers, pendingRequests) {
  const users = allUsers.filter((u) => u.status !== 'deleted');
  const byRole = { superadmin: 0, admin: 0, receptionist: 0, therapist: 0 };
  let active = 0;
  let disabled = 0;
  for (const u of users) {
    if (byRole[u.role] !== undefined) byRole[u.role] += 1;
    if (u.status === 'active') active += 1;
    else if (u.status === 'disabled') disabled += 1;
  }
  return { total: users.length, active, disabled, byRole, pendingRequests: pendingRequests?.length ?? null };
}

export function inquiryStats(inquiries, applications) {
  const isNew = (i) => i.status === 'new';
  return {
    newBookings: inquiries.filter((i) => isNew(i) && i.type === 'booking').length,
    newMessages: inquiries.filter((i) => isNew(i) && i.type === 'contact').length,
    awaitingFollowUp: inquiries.filter((i) => i.status === 'contacted').length,
    newApplications: applications.filter(isNew).length,
  };
}
