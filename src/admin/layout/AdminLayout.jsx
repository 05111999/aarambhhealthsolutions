import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../permissions/permissionCatalog';
import { useNotifications } from '../notifications/useNotifications';
import { useTrashedPatients, useTrashedBills, useTrashedStaff } from '../patients/trash';
import NotificationBell from '../notifications/NotificationBell';
import { visibleNavItems } from './navItems';
import InstallAppButton from './InstallAppButton';
import { STAFF_RETURN_KEY } from '../../components/common/BackToDashboardButton';

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg hover:text-text-dark'
  }`;

const AdminLayout = () => {
  const { profile, logout, hasPermission } = useAuth();
  const isSuperAdmin = profile?.role === 'superadmin';
  const { ids: trashedIds } = useTrashedPatients();
  const { bills: trashedBills } = useTrashedBills(isSuperAdmin);
  const { staff: trashedStaff } = useTrashedStaff(isSuperAdmin);
  const trashCount = trashedIds.size + trashedBills.length + trashedStaff.length;
  const notifications = useNotifications(trashedIds);
  const newCount = notifications.newInquiryCount;

  // Below lg the sidebar is an off-canvas drawer opened from the header's menu button.
  // It closes on navigation, on the backdrop, and on Escape.
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Open the public website in this tab, remembering this page so the website can show
  // a "Back to Dashboard" button that returns here.
  const visitWebsite = () => {
    try {
      sessionStorage.setItem(STAFF_RETURN_KEY, `${location.pathname}${location.search}`);
    } catch {
      // storage unavailable — the website simply won't show the back button
    }
    navigate('/');
  };
  useEffect(() => setNavOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className="min-h-screen flex bg-bg">
      {navOpen && <div className="fixed inset-0 bg-text-dark/40 z-40 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden="true" />}
      <aside
        className={`w-64 max-w-[85vw] bg-white border-r border-border flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0 lg:z-auto ${
          navOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="px-6 py-5 lg:py-6 border-b border-border flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-text-dark leading-none">AArambh</p>
            <p className="text-xs text-text-muted mt-1">Billing &amp; Therapy Management</p>
          </div>
          <button onClick={() => setNavOpen(false)} aria-label="Close menu" className="lg:hidden p-2 -m-2 text-text-muted hover:text-text-dark">
            <X size={20} />
          </button>
        </div>

        <div className="sm:hidden px-6 py-3 border-b border-border">
          <p className="text-sm font-semibold text-text-dark mb-0 truncate">{profile?.name}</p>
          <p className="text-xs text-text-muted mb-0">{ROLE_LABELS[profile?.role] || profile?.role}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems({ hasPermission, isSuperAdmin }).map((item) => {
            const badge = item.key === 'inquiries' ? newCount : item.key === 'trash' ? trashCount : 0;
            return (
              <NavLink key={item.key} to={item.to} end={item.end} className={navLinkClasses}>
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span
                    className={
                      item.key === 'trash'
                        ? 'bg-bg text-text-muted text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border border-border'
                        : 'bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center'
                    }
                  >
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sm:h-16 bg-white border-b border-border flex items-center justify-between gap-3 px-3 sm:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              aria-expanded={navOpen}
              className="lg:hidden p-2 rounded-lg text-text-dark hover:bg-bg transition-colors"
            >
              <Menu size={22} />
            </button>
            <p className="lg:hidden font-bold text-text-dark truncate mb-0">AArambh</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <InstallAppButton />
            <button
              onClick={visitWebsite}
              title="Open the public website (a button there brings you back)"
              aria-label="Website"
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors p-2 sm:p-0 shrink-0"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">Website</span>
            </button>
            <NotificationBell notifications={notifications} />
            <span className="w-px h-8 bg-border hidden sm:block" />
            <div className="text-right min-w-0 hidden sm:block">
              <p className="text-sm font-semibold text-text-dark leading-none truncate max-w-[180px]">{profile?.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{ROLE_LABELS[profile?.role] || profile?.role}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Logout"
              title="Logout"
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors p-2 sm:p-0 shrink-0"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="admin-main flex-1 p-4 sm:p-6 lg:p-8 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
