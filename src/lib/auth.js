import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { app, useEmulators } from './firebase';

// Split out from firebase.js so Firebase Auth's SDK weight only ships to whichever
// bundle actually imports this — the admin panel (already lazy-loaded), never the
// public site, since public visitors submit forms without ever logging in.
export const auth = getAuth(app);

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
