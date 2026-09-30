import {
  LayoutDashboard, Users, ClipboardList, Building2, Receipt, HandCoins, Inbox, Activity, Trash2, FileText, Settings, LifeBuoy,
} from 'lucide-react';

// The admin sidebar, in order. Used by AdminLayout and by the Help Center's step
// visuals, so a guide always shows exactly the menu the viewer has.
// show(ctx): ctx = { hasPermission(module, action), isSuperAdmin }.
export const NAV_ITEMS = [
  { key: 'dashboard', to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard, show: () => true },
  { key: 'patients', to: '/admin/patients', label: 'Patients', icon: ClipboardList, show: (c) => c.hasPermission('patients', 'view') },
  { key: 'sessions', to: '/admin/sessions', label: 'Therapy Sessions', icon: Activity, show: (c) => c.hasPermission('sessionLogs', 'view') },
  { key: 'bills', to: '/admin/bills', label: 'Bills', icon: FileText, show: (c) => c.hasPermission('bills', 'view') },
  { key: 'billing', to: '/admin/billing', label: 'Billing', icon: Receipt, show: (c) => c.hasPermission('billing', 'view') },
  { key: 'departments', to: '/admin/departments', label: 'Departments', icon: Building2, show: (c) => c.hasPermission('departments', 'view') },
  { key: 'settlement', to: '/admin/hospital-settlement', label: 'Hospital Settlement', icon: HandCoins, show: (c) => c.hasPermission('hospitalSettlement', 'view') },
  { key: 'inquiries', to: '/admin/inquiries', label: 'Inquiries', icon: Inbox, show: (c) => c.hasPermission('inquiries', 'view') },
  { key: 'users', to: '/admin/users', label: 'User Management', icon: Users, show: (c) => c.hasPermission('users', 'view') },
  { key: 'settings', to: '/admin/settings', label: 'Settings', icon: Settings, show: (c) => c.isSuperAdmin },
  { key: 'trash', to: '/admin/trash', label: 'Trash', icon: Trash2, show: (c) => c.isSuperAdmin },
  { key: 'help', to: '/admin/help', label: 'Help & How It Works', icon: LifeBuoy, show: () => true },
];

export const visibleNavItems = (ctx) => NAV_ITEMS.filter((item) => item.show(ctx));
