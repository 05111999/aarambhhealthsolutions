import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogOut, Users, ClipboardList, Building2, Receipt, HandCoins, Inbox, Activity, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { ROLE_LABELS } from '../permissions/permissionCatalog';
import { useNotifications } from '../notifications/useNotifications';
import { useTrashedPatients, useTrashedBills, useTrashedStaff } from '../patients/trash';
import NotificationBell from '../notifications/NotificationBell';

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg hover:text-text-dark'
  }`;

const AdminLayout = () => {
  const { profile, logout } = useAuth();
  const canViewUsers = usePermission('users', 'view');
  const canViewPatients = usePermission('patients', 'view');
  const canViewDepartments = usePermission('departments', 'view');
  const canViewBilling = usePermission('billing', 'view');
  const canViewHospitalSettlement = usePermission('hospitalSettlement', 'view');
  const canViewInquiries = usePermission('inquiries', 'view');
  const canViewSessions = usePermission('sessionLogs', 'view');
  const isSuperAdmin = profile?.role === 'superadmin';
  const { ids: trashedIds } = useTrashedPatients();
  const { bills: trashedBills } = useTrashedBills(isSuperAdmin);
  const { staff: trashedStaff } = useTrashedStaff(isSuperAdmin);
  const trashCount = trashedIds.size + trashedBills.length + trashedStaff.length;
  const notifications = useNotifications(trashedIds);
  const newCount = notifications.newInquiryCount;

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-64 bg-white border-r border-border flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-border">
          <p className="font-bold text-text-dark leading-none">AArambh</p>
          <p className="text-xs text-text-muted mt-1">Billing &amp; Therapy Management</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/admin" end className={navLinkClasses}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          {canViewPatients && (
            <NavLink to="/admin/patients" className={navLinkClasses}>
              <ClipboardList size={18} />
              Patients
            </NavLink>
          )}
          {canViewSessions && (
            <NavLink to="/admin/sessions" className={navLinkClasses}>
              <Activity size={18} />
              Therapy Sessions
            </NavLink>
          )}
          {canViewBilling && (
            <NavLink to="/admin/billing" className={navLinkClasses}>
              <Receipt size={18} />
              Billing
            </NavLink>
          )}
          {canViewDepartments && (
            <NavLink to="/admin/departments" className={navLinkClasses}>
              <Building2 size={18} />
              Departments
            </NavLink>
          )}
          {canViewHospitalSettlement && (
            <NavLink to="/admin/hospital-settlement" className={navLinkClasses}>
              <HandCoins size={18} />
              Hospital Settlement
            </NavLink>
          )}
          {canViewInquiries && (
            <NavLink to="/admin/inquiries" className={navLinkClasses}>
              <Inbox size={18} />
              <span className="flex-1">Inquiries</span>
              {newCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {newCount}
                </span>
              )}
            </NavLink>
          )}
          {canViewUsers && (
            <NavLink to="/admin/users" className={navLinkClasses}>
              <Users size={18} />
              User Management
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/trash" className={navLinkClasses}>
              <Trash2 size={18} />
              <span className="flex-1">Trash</span>
              {trashCount > 0 && (
                <span className="bg-bg text-text-muted text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border border-border">
                  {trashCount}
                </span>
              )}
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <NotificationBell notifications={notifications} />
            <span className="w-px h-8 bg-border" />
            <div className="text-right">
              <p className="text-sm font-semibold text-text-dark leading-none">{profile?.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{ROLE_LABELS[profile?.role] || profile?.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
