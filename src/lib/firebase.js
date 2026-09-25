import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Only `app` + `db` live here, since these are the only two things every part of the
// app needs (public forms and the admin panel alike). `auth` and `storage` are split
// into their own modules (auth.js, storage.js) — each only imported where actually
// used, so their SDK weight doesn't get bundled into the public site for visitors who
// never touch a login screen or a file upload.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
