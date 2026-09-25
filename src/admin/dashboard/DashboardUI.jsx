import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';

// Every stat on the dashboard is a real link to the list it summarises, pre-filtered.
export const StatLink = ({ to, label, value, hint, tone = 'text-text-dark', icon: Icon }) => (
  <Link
    to={to}
    aria-label={`${label}: ${value}${hint ? ` — ${hint}` : ''}`}
    className={`group block bg-white rounded-2xl border border-border p-5 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${focusRing}`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2 min-w-0">
        {Icon && <Icon size={14} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />}
        <p className="text-xs font-medium text-text-muted leading-snug">{label}</p>
      </div>
      <ArrowUpRight
        size={14}
        className="text-text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary transition-all shrink-0"
      />
    </div>
    <p className={`text-2xl font-bold mt-1.5 ${tone}`}>{value}</p>
    {hint && <p className="text-xs text-text-muted mt-1 group-hover:text-primary transition-colors">{hint}</p>}
  </Link>
);

// Section headings are links too — they go to the unfiltered list for that area.
export const Section = ({ icon: Icon, title, to, linkLabel = 'View all', error, children }) => (
  <section className="mb-10">
    <Link
      to={to}
      className={`group flex items-center justify-between gap-3 mb-4 rounded-lg -mx-2 px-2 py-1 cursor-pointer hover:bg-white transition-colors ${focusRing}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary group-hover:text-white text-primary transition-colors">
          <Icon size={16} />
        </div>
        <h3 className="text-base font-semibold text-text-dark mb-0 group-hover:text-primary transition-colors">{title}</h3>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted group-hover:text-primary transition-colors">
        {linkLabel}
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
    {error ? (
      <div className="bg-white rounded-2xl border border-red-100 p-5 text-sm text-red-600">
        Couldn&apos;t load this section. Try Refresh, or check your access with a Super Admin.
      </div>
    ) : (
      children
    )}
  </section>
);

export const CardGrid = ({ cols = 4, children }) => {
  const colClass = {
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
  }[cols];
  return <div className={`grid ${colClass} gap-4`}>{children}</div>;
};

// A summary box whose individual rows each link somewhere (e.g. top services).
export const LinkListBox = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-border p-5 mt-4">
    <p className="text-sm font-semibold text-text-dark mb-2">{title}</p>
    <div className="divide-y divide-border">{children}</div>
  </div>
);

export const LinkListRow = ({ to, left, right }) => (
  <Link
    to={to}
    className={`group flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-md text-sm cursor-pointer hover:bg-bg transition-colors ${focusRing}`}
  >
    <span className="text-text-muted group-hover:text-primary transition-colors truncate">{left}</span>
    <span className="flex items-center gap-1.5 font-semibold text-text-dark shrink-0">
      {right}
      <ChevronRight size={14} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </span>
  </Link>
);
