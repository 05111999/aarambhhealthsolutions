import { useAuth } from '../auth/AuthContext';

// usePermission('billing', 'discount') -> boolean
export const usePermission = (moduleKey, action) => {
  const { hasPermission } = useAuth();
  return hasPermission(moduleKey, action);
};
