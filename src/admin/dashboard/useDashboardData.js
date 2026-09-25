import { useCallback, useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
// Collection-group rows also carry their owning patient's ID.
const patientRows = (snap) => snap.docs.map((d) => ({ id: d.id, patientId: d.ref.parent.parent.id, ...d.data() }));

const LOADERS = {
  patients: async () => rows(await getDocs(collection(db, 'patients'))),
  trashedPatients: async () => rows(await getDocs(query(collection(db, 'patients'), where('isDeleted', '==', true)))),
  transactions: async () => patientRows(await getDocs(collectionGroup(db, 'transactions'))),
  sessionLogs: async () => patientRows(await getDocs(collectionGroup(db, 'sessionLogs'))),
  settlements: async () => rows(await getDocs(collection(db, 'hospitalSettlements'))),
  departments: async () => rows(await getDocs(collection(db, 'departments'))),
  users: async () => rows(await getDocs(collection(db, 'users'))),
  userRequests: async () => rows(await getDocs(query(collection(db, 'userRequests'), where('status', '==', 'pending')))),
  inquiries: async () => rows(await getDocs(collection(db, 'inquiries'))),
  applications: async () => rows(await getDocs(collection(db, 'jobApplications'))),
};

// Loads only the sources the caller asks for — the caller derives that list from the
// viewer's own permissions, so nobody triggers a read their rules don't allow. Each
// source fails independently: one denied/failed read shows an error on its own
// section instead of blanking the whole dashboard.
export function useDashboardData(sources) {
  const key = [...sources].sort().join(',');
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    const wanted = key ? key.split(',') : [];
    setLoading(true);
    const results = await Promise.all(
      wanted.map(async (source) => {
        try {
          return [source, await LOADERS[source](), null];
        } catch (err) {
          console.error(`Dashboard: failed to load ${source}`, err);
          return [source, null, err];
        }
      })
    );
    setData(Object.fromEntries(results.map(([s, d]) => [s, d])));
    setErrors(Object.fromEntries(results.filter(([, , e]) => e).map(([s]) => [s, true])));
    setUpdatedAt(new Date());
    setLoading(false);
  }, [key]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, errors, loading, refresh, updatedAt };
}
