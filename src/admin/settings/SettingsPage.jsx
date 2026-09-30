import React from 'react';
import { Building2, Stethoscope, Percent } from 'lucide-react';
import { useUrlFilters } from '../useUrlFilters';
import HospitalsTab from './HospitalsTab';
import TherapistsTab from './TherapistsTab';
import BillSettingsTab from './BillSettingsTab';
import HelpLink from '../help/HelpLink';

const TABS = [
  { key: 'hospitals', label: 'Hospitals', icon: Building2 },
  { key: 'therapists', label: 'Therapists', icon: Stethoscope },
  { key: 'billing', label: 'Bill Settings', icon: Percent },
];

// Super Admin settings used by the bill generator.
const SettingsPage = () => {
  const [{ tab }, setFilters] = useUrlFilters({ tab: 'hospitals' });
  const active = TABS.some((t) => t.key === tab) ? tab : 'hospitals';

  return (
    <div>
      <h1 className="mb-1">Settings</h1>
      <p className="text-text-muted text-sm mb-1">Hospitals, therapists and tax used on bills.</p>
      <HelpLink article={active === 'therapists' ? 'settings-therapists' : active === 'billing' ? 'settings-bill' : 'settings-hospitals'} className="mb-6" />

      <div className="flex items-center gap-1 sm:gap-2 mb-6 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilters({ tab: t.key })}
            className={`inline-flex items-center gap-2 shrink-0 whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              active === t.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-dark'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {active === 'hospitals' && <HospitalsTab />}
      {active === 'therapists' && <TherapistsTab />}
      {active === 'billing' && <BillSettingsTab />}
    </div>
  );
};

export default SettingsPage;
