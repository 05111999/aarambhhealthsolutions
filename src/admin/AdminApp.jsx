import React from 'react';
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
import HospitalSettlementPage from './hospitalSettlement/HospitalSettlementPage';
import InquiriesPage from './inquiries/InquiriesPage';
import SessionsPage from './sessions/SessionsPage';
import TrashPage from './trash/TrashPage';

const AdminApp = () => (
  <AuthProvider>
    <Routes>
      <Route path="login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />

          <Route element={<ProtectedRoute module="users" action="view" />}>
            <Route path="users" element={<UserManagement />} />
          </Route>

          <Route element={<ProtectedRoute module="patients" action="view" />}>
            <Route path="patients" element={<PatientList />} />
            <Route path="patients/:patientId" element={<PatientProfile />} />
          </Route>

          <Route element={<ProtectedRoute superAdminOnly />}>
            <Route path="trash" element={<TrashPage />} />
          </Route>

          <Route element={<ProtectedRoute module="sessionLogs" action="view" />}>
            <Route path="sessions" element={<SessionsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="departments" action="view" />}>
            <Route path="departments" element={<DepartmentTree />} />
          </Route>

          <Route element={<ProtectedRoute module="billing" action="view" />}>
            <Route path="billing" element={<BillingEntry />} />
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

export default AdminApp;
