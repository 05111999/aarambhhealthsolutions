import { useEffect, useMemo, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

// One shared Firestore listener per data source, reused by every screen that needs it.
//
// Without this, each page opened its own listener (or getDocs) on the same collections,
// so moving Dashboard → Billing → Dashboard downloaded every transaction three times.
// Here the first screen to ask for a source opens its listener; later screens reuse the
// data already in memory, and the listener stays open for a grace period after the last
// screen leaves, so coming back costs nothing. While open, Firestore only bills for
// documents that actually change.
//
// Everything is dropped on sign-out (resetLiveStore), so the next person to sign in on
// the same computer never sees another account's cached data.

const GRACE_MS = 10 * 60 * 1000;

// key → { data, error, loaded, updatedAt, subscribers:Set, unsubscribe, timer }
const entries = new Map();

function notify(entry) {
  for (const cb of entry.subscribers) cb();
}

function acquire(key, spec, cb) {
  let entry = entries.get(key);
  // A listener that failed (e.g. permission denied) is closed by Firestore; once nobody
  // is showing its error any more, the next screen to ask gets a fresh attempt.
  if (entry && entry.error && entry.subscribers.size === 0) {
    entries.delete(key);
    entry = null;
  }
  if (!entry) {
    entry = { data: null, error: null, loaded: false, updatedAt: null, subscribers: new Set(), unsubscribe: null, timer: null };
    entries.set(key, entry);
    entry.unsubscribe = onSnapshot(
      spec.query(),
      (snap) => {
        entry.data = spec.map(snap);
        entry.error = null;
        entry.loaded = true;
        entry.updatedAt = new Date();
        notify(entry);
      },
      (err) => {
        console.error(`Live data: failed to load ${key}`, err);
        entry.error = err;
        entry.loaded = true;
        notify(entry);
      }
    );
  }
  clearTimeout(entry.timer);
  entry.timer = null;
  entry.subscribers.add(cb);
  return entry;
}

function release(key, entry, cb) {
  entry.subscribers.delete(cb);
  if (entry.subscribers.size > 0 || entries.get(key) !== entry) return;
  if (entry.error) {
    entries.delete(key);
    return;
  }
  entry.timer = setTimeout(() => {
    if (entry.subscribers.size === 0 && entries.get(key) === entry) {
      entry.unsubscribe?.();
      entries.delete(key);
    }
  }, GRACE_MS);
}

export function resetLiveStore() {
  for (const entry of entries.values()) {
    clearTimeout(entry.timer);
    entry.unsubscribe?.();
  }
  entries.clear();
}

const snapshotOf = (key) => {
  const e = entries.get(key);
  return e ? { data: e.data, error: e.error, loaded: e.loaded, updatedAt: e.updatedAt } : { data: null, error: null, loaded: false, updatedAt: null };
};

// Subscribes to several sources at once. `specs` is { name: spec | null }, where a spec is
// { key, query: () => Query|DocumentReference, map: (snap) => data }; null skips a source.
// Returns { name: { data, error, loaded, updatedAt } }.
export function useLiveSources(specs) {
  const signature = Object.entries(specs)
    .map(([name, spec]) => `${name}=${spec?.key ?? ''}`)
    .join('|');
  const [, setTick] = useState(0);

  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    const held = [];
    for (const spec of Object.values(specs)) {
      if (!spec) continue;
      held.push([spec.key, acquire(spec.key, spec, cb)]);
    }
    cb(); // pick up data that was already in memory
    return () => held.forEach(([key, entry]) => release(key, entry, cb));
    // specs are rebuilt every render; the signature captures what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, spec ? snapshotOf(spec.key) : { data: null, error: null, loaded: false, updatedAt: null }]));
}

// Single-source convenience wrapper. Pass null to stay unsubscribed.
export function useLiveSource(spec) {
  const specs = useMemo(() => ({ only: spec }), [spec?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  return useLiveSources(specs).only;
}
