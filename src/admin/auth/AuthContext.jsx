import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth } from '../../lib/auth';
import { db } from '../../lib/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roleDefaults, setRoleDefaults] = useState({});
  const [authResolved, setAuthResolved] = useState(false);
  // The uid whose profile snapshot has actually arrived. A plain "resolved" boolean
  // isn't enough: right after login it can still be left over from the logged-out
  // state, which would make a real account look like it has no profile.
  const [profileUid, setProfileUid] = useState(null);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthResolved(true);
      if (!firebaseUser) {
        setProfile(null);
        setProfileUid(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setProfileUid(user.uid);
    });
    return unsubscribe;
  }, [user]);

  const profileResolved = !!user && profileUid === user.uid;

  useEffect(() => {
    // The security rules already deny every request from a non-active account; this
    // just signs them out of the UI and tells them why, instead of a blank screen.
    if (!user || !profileResolved) return;
    if (!profile || profile.status === 'deleted') {
      setAccessError('This account no longer has access. Contact your Super Admin.');
      signOut(auth);
    } else if (profile.status !== 'active') {
      setAccessError('Your account has been deactivated. Contact your Super Admin.');
      signOut(auth);
    }
  }, [user, profile, profileResolved]);

  useEffect(() => {
    // Gated on `user` — the rules require sign-in, and subscribing while logged out
    // just produces a permission-denied round trip with nothing to show for it.
    if (!user) return undefined;
    const unsubscribe = onSnapshot(collection(db, 'roleDefaults'), (snap) => {
      const next = {};
      snap.forEach((d) => {
        next[d.id] = d.data();
      });
      setRoleDefaults(next);
    });
    return unsubscribe;
  }, [user]);

  const hasPermission = useMemo(() => {
    return (moduleKey, action) => {
      if (!profile || profile.status !== 'active') return false;
      if (profile.role === 'superadmin') return true;
      const override = profile.permissions?.[moduleKey]?.[action];
      if (override !== undefined) return override;
      return roleDefaults?.[profile.role]?.[moduleKey]?.[action] ?? false;
    };
  }, [profile, roleDefaults]);

  const login = (email, password) => {
    setAccessError('');
    return signInWithEmailAndPassword(auth, email.trim(), password);
  };
  const logout = () => signOut(auth);
  const resetPassword = async (email) => {
    const normalized = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, normalized, { url: `${window.location.origin}/admin/login` });
    } catch (err) {
      // Domain not on Firebase Auth's Authorized domains list — send without the return link.
      if (err.code !== 'auth/unauthorized-continue-uri' && err.code !== 'auth/invalid-continue-uri') throw err;
      await sendPasswordResetEmail(auth, normalized);
    }
  };

  const loading = !authResolved || (!!user && !profileResolved);

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user && !!profile && profile.status === 'active',
    hasPermission,
    login,
    logout,
    resetPassword,
    accessError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
