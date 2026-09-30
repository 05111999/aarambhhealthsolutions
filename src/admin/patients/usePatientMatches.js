import { useMemo } from 'react';
import { useLiveSource } from '../data/liveStore';
import { SOURCES } from '../data/sources';

const digitsOf = (s) => (s || '').replace(/\D/g, '');
const millis = (ts) => ts?.toMillis?.() ?? 0;

// Instant patient search for pickers, over the shared live patients list (the Patients,
// Dashboard and Sessions screens keep the same listener, so typing costs no reads).
// Forgiving: every typed word may appear anywhere in the name or patient code
// ("kumar" finds "Ravi Kumar", "0012" finds ARCS00120926), and 3+ digits match
// anywhere in either phone number. Best matches first; active patients before
// discharged. An empty search returns the most recently added patients.
export function usePatientMatches(term, { max = 8 } = {}) {
  const { data, loaded } = useLiveSource(SOURCES.patients);

  const matches = useMemo(() => {
    const patients = (data || []).filter((p) => !p.isDeleted);
    const q = term.trim().toLowerCase();
    if (!q) return [...patients].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, max);

    const words = q.split(/\s+/);
    const digits = digitsOf(q);
    const scored = [];
    for (const p of patients) {
      const name = (p.nameLower || p.name || '').toLowerCase();
      const code = (p.patientCode || '').toLowerCase();
      const text = `${name} ${code}`;
      const byText = words.every((w) => text.includes(w));
      const byPhone = digits.length >= 3 && digits.length === q.replace(/[\s+()-]/g, '').length
        && [p.contact1Digits, p.contact2Digits, p.attenderContactDigits].some((d) => d && d.includes(digits));
      if (!byText && !byPhone) continue;
      let score = 3;
      if (code === q) score = 0;
      else if (name.startsWith(q) || code.startsWith(q)) score = 1;
      else if (name.split(/\s+/).some((part) => part.startsWith(words[0]))) score = 2;
      scored.push({ p, score });
    }
    scored.sort(
      (a, b) =>
        a.score - b.score
        || (a.p.currentStatus === 'active' ? 0 : 1) - (b.p.currentStatus === 'active' ? 0 : 1)
        || millis(b.p.createdAt) - millis(a.p.createdAt)
    );
    return scored.slice(0, max).map((s) => s.p);
  }, [data, term, max]);

  return { matches, loading: !loaded };
}
