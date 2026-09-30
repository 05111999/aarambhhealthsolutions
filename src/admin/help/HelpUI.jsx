import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, LayoutDashboard, ClipboardList, Activity, FileText, Wallet, BedDouble, Building2, HandCoins, Inbox, Users, Settings,
  Trash2, Printer, Wrench, Menu, Bell, LogOut, RefreshCw, UserPlus, Pencil, Save, Plus, CreditCard, Check, FilePlus, Download,
  UserCheck, LifeBuoy, Globe, ChevronRight, ChevronDown, MousePointerClick, Lightbulb, AlertTriangle, CheckCircle2, ArrowRight, BookOpen,
} from 'lucide-react';
import { visibleNavItems } from '../layout/navItems';
import { searchTerms } from './helpAccess';

const ICONS = {
  Rocket, LayoutDashboard, ClipboardList, Activity, FileText, Wallet, BedDouble, Building2, HandCoins, Inbox, Users, Settings,
  Trash2, Printer, Wrench, Menu, Bell, LogOut, RefreshCw, UserPlus, Pencil, Save, Plus, CreditCard, Check, FilePlus, Download,
  UserCheck, LifeBuoy, Globe,
};
export const HelpIcon = ({ name, ...props }) => {
  const Icon = ICONS[name] || BookOpen;
  return <Icon {...props} />;
};

// Marks the words of the search query inside a piece of text.
export const Highlight = ({ text, query }) => {
  const terms = query ? searchTerms(query).map((t) => t.replace(/s$/, '')) : [];
  if (!terms.length || !text) return text || null;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) =>
    i % 2 ? <mark key={i} className="bg-amber-100 text-text-dark rounded px-0.5">{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>
  );
};

export const HelpBreadcrumb = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-text-muted mb-4">
    {items.map((item, i) => (
      <React.Fragment key={item.label}>
        {i > 0 && <ChevronRight size={14} className="shrink-0" />}
        {item.to ? (
          <Link to={item.to} className="hover:text-primary transition-colors">{item.label}</Link>
        ) : (
          <span className="text-text-dark font-medium">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

// ── Step visuals ─────────────────────────────────────────────────────────────
// Drawn from the app's real labels (and the real sidebar for this user), with the thing
// to click highlighted. They never go stale the way screenshots do; a step can still
// use an `image` instead.

const ClickHere = () => (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
    <MousePointerClick size={12} />
    Click here
  </span>
);
const ring = 'ring-4 ring-amber-300/70 ring-offset-2';

const NavVisual = ({ target, viewer }) => {
  const items = visibleNavItems({ hasPermission: viewer.hasPermission, isSuperAdmin: viewer.role === 'superadmin' });
  const list = items.some((i) => i.label === target) ? items : [...items, { key: 'x', label: target, icon: BookOpen }];
  return (
    <div className="w-full max-w-[260px] bg-white border border-border rounded-xl p-2 space-y-0.5" aria-hidden="true">
      <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-0">Menu</p>
      {list.map((item) => {
        const active = item.label === target;
        return (
          <div
            key={item.key}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] ${active ? `bg-primary/10 text-primary font-semibold ${ring}` : 'text-text-muted'}`}
          >
            <item.icon size={15} className="shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {active && <MousePointerClick size={14} className="text-amber-600 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
};

const BUTTON_STYLES = {
  primary: 'bg-primary text-white',
  ghost: 'bg-white border border-border text-text-dark',
  danger: 'bg-white border border-red-200 text-red-600',
  link: 'bg-transparent text-primary',
};
const ButtonVisual = ({ label, icon, variant = 'primary' }) => (
  <div className="flex items-center gap-3 flex-wrap" aria-hidden="true">
    <span className={`inline-flex items-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-lg ${BUTTON_STYLES[variant] || BUTTON_STYLES.primary} ${ring}`}>
      {icon && <HelpIcon name={icon} size={16} />}
      {label}
    </span>
    <ClickHere />
  </div>
);

const TabsVisual = ({ tabs, active }) => (
  <div className="flex items-center gap-1 border-b border-border overflow-x-auto max-w-full" aria-hidden="true">
    {tabs.map((t) => (
      <span
        key={t}
        className={`shrink-0 whitespace-nowrap px-3 py-2 text-sm font-semibold border-b-2 ${t === active ? `border-primary text-primary bg-amber-50 rounded-t-md` : 'border-transparent text-text-muted'}`}
      >
        {t}
      </span>
    ))}
  </div>
);

const FieldsVisual = ({ fields }) => (
  <div className="w-full max-w-md bg-white border border-border rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2" aria-hidden="true">
    {fields.map((f) => (
      <div key={f.label} className="min-w-0">
        <p className="text-[11px] font-medium text-text-dark mb-0.5 truncate">
          {f.label}
          {f.required && <span className="text-red-500"> *</span>}
        </p>
        <div className={`h-7 rounded-md border ${f.required ? 'border-amber-300 bg-amber-50/60' : 'border-border bg-bg'}`} />
      </div>
    ))}
    {fields.some((f) => f.required) && <p className="sm:col-span-2 text-[11px] text-text-muted mb-0">* required</p>}
  </div>
);

const ChipsVisual = ({ chips, active = [] }) => (
  <div className="flex flex-wrap gap-1.5" aria-hidden="true">
    {chips.map((c) => (
      <span key={c} className={`px-3 py-1 rounded-full text-xs font-medium ${active.includes(c) ? 'bg-primary text-white' : 'bg-white border border-border text-text-muted'}`}>
        {c}
      </span>
    ))}
  </div>
);

export const StepVisual = ({ step, viewer }) => {
  if (step.image) {
    return <img src={step.image} alt={step.title} loading="lazy" className="max-w-full h-auto rounded-xl border border-border" />;
  }
  const v = step.visual;
  if (!v) return null;
  if (v.nav) return <NavVisual target={v.nav} viewer={viewer} />;
  if (v.button) return <ButtonVisual label={v.button} icon={v.icon} variant={v.variant} />;
  if (v.tabs) return <TabsVisual tabs={v.tabs} active={v.active} />;
  if (v.fields) return <FieldsVisual fields={v.fields} />;
  if (v.chips) return <ChipsVisual chips={v.chips} active={v.active} />;
  return null;
};

export const HelpStep = ({ number, step, viewer, query }) => (
  <li className="relative pl-12 pb-6 last:pb-0" data-testid="help-step">
    <span className="absolute left-0 top-0 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">{number}</span>
    <span className="absolute left-4 top-9 bottom-0 w-px bg-border" aria-hidden="true" />
    <p className="text-base font-semibold text-text-dark mb-1">
      <Highlight text={step.title} query={query} />
    </p>
    {step.text && (
      <p className="text-sm text-text-muted mb-3 leading-relaxed">
        <Highlight text={step.text} query={query} />
      </p>
    )}
    <StepVisual step={step} viewer={viewer} />
  </li>
);

// ── Callout boxes ─────────────────────────────────────────────────────────────
const CALLOUTS = {
  result: { icon: CheckCircle2, cls: 'bg-teal/5 border-teal/20 text-teal', title: 'What happens' },
  tip: { icon: Lightbulb, cls: 'bg-primary/5 border-primary/15 text-primary', title: 'Tips' },
  important: { icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-700', title: 'Important' },
};
export const Callout = ({ kind, children, title }) => {
  const c = CALLOUTS[kind];
  return (
    <div className={`border rounded-xl px-4 py-3 ${c.cls}`}>
      <p className="flex items-center gap-2 text-sm font-semibold mb-1">
        <c.icon size={16} className="shrink-0" />
        {title || c.title}
      </p>
      <div className="text-sm text-text-dark">{children}</div>
    </div>
  );
};

// ── Lists and cards ──────────────────────────────────────────────────────────
export const ArticleRow = ({ article, query, meta }) => (
  <Link
    to={`/admin/help/${article.id}`}
    className="group flex items-start justify-between gap-3 px-4 py-3 hover:bg-bg transition-colors"
    data-testid="help-article-link"
  >
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-text-dark group-hover:text-primary transition-colors">
        <Highlight text={article.title} query={query} />
      </span>
      <span className="block text-xs text-text-muted mt-0.5">
        <Highlight text={article.description} query={query} />
      </span>
      {meta && <span className="block text-[11px] text-text-muted mt-1">{meta}</span>}
    </span>
    <ChevronRight size={16} className="text-text-muted group-hover:text-primary shrink-0 mt-0.5" />
  </Link>
);

export const RelatedArticles = ({ ids, byId, title = 'Related guides' }) => {
  const list = (ids || []).map((id) => byId.get(id)).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <p className="text-sm font-semibold text-text-dark px-4 pt-4 pb-2 mb-0">{title}</p>
      <div className="divide-y divide-border">
        {list.map((a) => <ArticleRow key={a.id} article={a} />)}
      </div>
    </div>
  );
};

export const WorkflowTimeline = ({ workflow }) => (
  <ol className="space-y-0">
    {workflow.steps.map((s, i) => (
      <li key={s.title} className="relative pl-12 pb-5 last:pb-0" data-testid="workflow-step">
        <span className="absolute left-0 top-0 w-8 h-8 rounded-full bg-teal text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
        {i < workflow.steps.length - 1 && <span className="absolute left-4 top-9 bottom-0 w-px bg-teal/30" aria-hidden="true" />}
        <p className="text-sm font-semibold text-text-dark mb-0.5">{s.title}</p>
        <p className="text-sm text-text-muted mb-1">{s.text}</p>
        {s.article && (
          <Link to={`/admin/help/${s.article}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-teal">
            Show me how <ArrowRight size={12} />
          </Link>
        )}
      </li>
    ))}
  </ol>
);

export const FaqList = ({ faqs }) => {
  const [open, setOpen] = useState(null);
  return (
    <div className="bg-white rounded-2xl border border-border divide-y divide-border">
      {faqs.map((f, i) => (
        <div key={f.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 text-sm font-semibold text-text-dark hover:text-primary cursor-pointer"
          >
            {f.q}
            <ChevronDown size={16} className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-text-muted">
              <p className="mb-2">{f.a}</p>
              {f.article && (
                <Link to={`/admin/help/${f.article}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-teal">
                  Read the full guide <ArrowRight size={12} />
                </Link>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// No support phone or email is configured in the app, so this points to the people who
// can actually help: the Super Admin (who manages access) or, for them, Troubleshooting.
export const StillNeedHelp = ({ role }) => (
  <div className="bg-white rounded-2xl border border-border p-5 flex items-start gap-3">
    <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
      <LifeBuoy size={18} className="text-primary" />
    </div>
    <div>
      <p className="text-base font-semibold text-text-dark mb-1">Still need help?</p>
      {role === 'superadmin' ? (
        <p className="text-sm text-text-muted mb-0">
          Check Troubleshooting first. For problems with the system itself, contact the person who maintains the application for your clinic.
        </p>
      ) : (
        <p className="text-sm text-text-muted mb-0">
          Contact your administrator. Your Super Admin can change your access, fix account problems, and restore anything deleted by mistake.
        </p>
      )}
    </div>
  </div>
);
