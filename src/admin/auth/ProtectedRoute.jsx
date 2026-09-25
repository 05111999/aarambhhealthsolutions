import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const FullScreenMessage = ({ title, message }) => (
  <div className="min-h-screen flex items-center justify-center bg-bg px-4">
    <div className="text-center max-w-sm">
      <h2 className="mb-2">{title}</h2>
      <p className="text-text-muted">{message}</p>
    </div>
  </div>
);

// Optionally gate on a specific permission via `module`/`action` props. Without them,
// this only checks that the user is signed in and active.
const ProtectedRoute = ({ module, action, superAdminOnly = false }) => {
  const { loading, isAuthenticated, hasPermission, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenMessage title="Loading…" message="Checking your session." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if ((module && action && !hasPermission(module, action)) || (superAdminOnly && profile?.role !== 'superadmin')) {
    return (
      <FullScreenMessage
        title="Unauthorized"
        message="You don't have permission to view this page. Contact your Super Admin if you believe this is a mistake."
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
