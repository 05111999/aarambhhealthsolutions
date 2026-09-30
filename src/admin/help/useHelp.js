import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { helpFor } from './helpAccess';

// The guides the signed-in user can see (role and permissions come from their
// /users profile, the same source the security rules use).
export function useHelp() {
  const { profile, hasPermission } = useAuth();
  const role = profile?.role;
  const help = useMemo(() => helpFor({ role, hasPermission }), [role, hasPermission]);
  return { ...help, role, profile, hasPermission };
}
