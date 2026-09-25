import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, startAt, endAt, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const looksLikeCode = (s) => /^arcs/i.test(s.trim());
const looksLikePhone = (s) => /^\d{6,}$/.test(s.replace(/\D/g, ''));

function dedupe(docs) {
  const seen = new Map();
  for (const d of docs) seen.set(d.id, d);
  return [...seen.values()];
}

// Reusable across the Patients list and (later) the billing "Select Patient" flow —
// decides whether a query looks like a patient code, phone number, or name, and issues
// the matching Firestore query. No full-text search infra needed at this data scale.
export function usePatientSearch(searchTerm) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      const patientsRef = collection(db, 'patients');
      let docs = [];

      if (looksLikeCode(term)) {
        const snap = await getDocs(query(patientsRef, where('patientCode', '==', term.toUpperCase()), limit(10)));
        docs = snap.docs;
      } else if (looksLikePhone(term)) {
        const digits = term.replace(/\D/g, '');
        const [snap1, snap2] = await Promise.all([
          getDocs(query(patientsRef, where('contact1Digits', '==', digits), limit(10))),
          getDocs(query(patientsRef, where('contact2Digits', '==', digits), limit(10))),
        ]);
        docs = [...snap1.docs, ...snap2.docs];
      } else {
        const lower = term.toLowerCase();
        const snap = await getDocs(
          query(patientsRef, orderBy('nameLower'), startAt(lower), endAt(`${lower}`), limit(20))
        );
        docs = snap.docs;
      }

      if (!cancelled) {
        // Patients in the Trash never show up in search.
        setResults(dedupe(docs).map((d) => ({ id: d.id, ...d.data() })).filter((p) => !p.isDeleted));
        setLoading(false);
      }
    };

    const timeout = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  return { results, loading };
}
