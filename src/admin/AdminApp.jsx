import React, { useLayoutEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './auth/Login';
import AdminLayout from './layout/AdminLayout';
import AdminDashboard from './dashboard/AdminDashboard';
import UserManagement from './users/UserManagement';
import PatientList from './patients/PatientList';
import PatientProfile from './patients/PatientProfile';
import DepartmentTree from './departments/DepartmentTree';
import BillingEntry from './billing/BillingEntry';
import ReceiptView from './billing/ReceiptView';
import IpdHome from './ipd/IpdHome';
import IpdAccount from './ipd/IpdAccount';
import HelpCenter from './help/HelpCenter';
import HelpArticlePage from './help/HelpArticlePage';
import HelpCategoryPage from './help/HelpCategoryPage';
import HelpWorkflowPage from './help/HelpWorkflowPage';
import HospitalSettlementPage from './hospitalSettlement/HospitalSettlementPage';
import InquiriesPage from './inquiries/InquiriesPage';
import SessionsPage from './sessions/SessionsPage';
import TrashPage from './trash/TrashPage';
import BillsList from './bills/BillsList';
import BillEditor from './bills/BillEditor';
import BillView from './bills/BillView';
import SettingsPage from './settings/SettingsPage';

// Switches the page to the admin's denser type scale (see html.admin-ui in index.css)
// while the admin is open, and back to the website's scale when leaving it.
function useAdminScale() {
  // Layout effect: applied before the first paint, so the page never flashes at the big scale.
  useLayoutEffect(() => {
    document.documentElement.classList.add('admin-ui');
    return () => document.documentElement.classList.remove('admin-ui');
  }, []);
}

const AdminApp = () => {
  useAdminScale();
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            {/* Help & How It Works — every signed-in role; content is filtered per role. */}
            <Route path="help" element={<HelpCenter />} />
            <Route path="help/category/:categoryId" element={<HelpCategoryPage />} />
            <Route path="help/workflow/:workflowId" element={<HelpWorkflowPage />} />
            <Route path="help/:articleId" element={<HelpArticlePage />} />

            <Route element={<ProtectedRoute module="users" action="view" />}>
              <Route path="users" element={<UserManagement />} />
            </Route>

            <Route element={<ProtectedRoute module="patients" action="view" />}>
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/:patientId" element={<PatientProfile />} />
            </Route>

            <Route element={<ProtectedRoute superAdminOnly />}>
              <Route path="trash" element={<TrashPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route element={<ProtectedRoute module="bills" action="view" />}>
              <Route path="bills" element={<BillsList />} />
              <Route path="bills/:billId" element={<BillView />} />
            </Route>
            <Route element={<ProtectedRoute module="bills" action="create" />}>
              <Route path="bills/new" element={<BillEditor />} />
            </Route>
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="bills/:billId/edit" element={<BillEditor />} />
            </Route>

            <Route element={<ProtectedRoute module="sessionLogs" action="view" />}>
              <Route path="sessions" element={<SessionsPage />} />
            </Route>

            <Route element={<ProtectedRoute module="departments" action="view" />}>
              <Route path="departments" element={<DepartmentTree />} />
            </Route>

            <Route element={<ProtectedRoute module="billing" action="view" />}>
              <Route path="billing" element={<BillingEntry />} />
              <Route path="patients/:patientId/receipts/:transactionId" element={<ReceiptView />} />
              <Route path="billing/ipd" element={<IpdHome />} />
              <Route path="billing/ipd/:patientId/:encounterId" element={<IpdAccount />} />
            </Route>

            <Route element={<ProtectedRoute module="hospitalSettlement" action="view" />}>
              <Route path="hospital-settlement" element={<HospitalSettlementPage />} />
            </Route>

            <Route element={<ProtectedRoute module="inquiries" action="view" />}>
              <Route path="inquiries" element={<InquiriesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AdminApp;
