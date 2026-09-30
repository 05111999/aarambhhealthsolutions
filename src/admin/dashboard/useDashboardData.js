import { useCallback, useMemo, useState } from 'react';
import { useLiveSources } from '../data/liveStore';
import { SOURCES } from '../data/sources';

// Loads only the sources the caller asks for — the caller derives that list from the
// viewer's own permissions, so nobody triggers a read their rules don't allow. Each
// source fails independently: one denied/failed read shows an error on its own
// section instead of blanking the whole dashboard.
//
// Sources come from the shared live store, so data another screen (or the notification
// bell) already holds is reused instead of downloaded again on every dashboard visit,
// and the figures stay current on their own.
export function useDashboardData(sources) {
  const key = [...sources].sort().join(',');
  const specs = useMemo(
    () => Object.fromEntries((key ? key.split(',') : []).map((s) => [s, SOURCES[s]])),
    [key]
  );
  const live = useLiveSources(specs);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const names = Object.keys(specs);
  const loading = names.some((s) => !live[s].loaded);
  const data = {};
  const errors = {};
  let latest = null;
  for (const s of names) {
    data[s] = live[s].data;
    if (live[s].error) errors[s] = true;
    if (live[s].updatedAt && (!latest || live[s].updatedAt > latest)) latest = live[s].updatedAt;
  }

  // The data is already live; Refresh just confirms that to the viewer.
  const refresh = useCallback(async () => setRefreshedAt(new Date()), []);
  const updatedAt = loading ? null : refreshedAt && refreshedAt > latest ? refreshedAt : latest || (names.length ? null : new Date());

  // Stable object identity while nothing changed, so derived stats aren't recomputed.
  const dataKey = names.map((s) => `${s}:${live[s].updatedAt?.getTime() ?? 0}:${live[s].error ? 1 : 0}`).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableData = useMemo(() => data, [dataKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableErrors = useMemo(() => errors, [dataKey]);

  return { data: stableData, errors: stableErrors, loading, refresh, updatedAt };
}
