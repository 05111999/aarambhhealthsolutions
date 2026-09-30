import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Star, Clock, Route, ArrowRight, Sparkles } from 'lucide-react';
import { useUrlFilters } from '../useUrlFilters';
import { ROLE_LABELS } from '../permissions/permissionCatalog';
import { ROLE_INTRO } from './helpContent';
import { searchArticles } from './helpAccess';
import { getHelpPrefs } from './helpPrefs';
import { useHelp } from './useHelp';
import { ArticleRow, FaqList, HelpIcon, StillNeedHelp } from './HelpUI';

const SectionTitle = ({ icon: Icon, children }) => (
  <h2 className="flex items-center gap-2 text-lg font-bold text-text-dark mb-3">
    {Icon && <Icon size={18} className="text-primary" />}
    {children}
  </h2>
);

// /admin/help — "How can we help you?"
const HelpCenter = () => {
  const help = useHelp();
  const [{ q }, setFilters] = useUrlFilters({ q: '' });
  const [prefs] = useState(getHelpPrefs);
  const results = useMemo(() => searchArticles(help.articles, q), [help.articles, q]);
  const bookmarks = prefs.bookmarks.map((id) => help.byId.get(id)).filter(Boolean);
  const recent = prefs.recent.map((id) => help.byId.get(id)).filter(Boolean);
  const roleLabel = ROLE_LABELS[help.role] || 'there';

  return (
    <div className="max-w-5xl">
      <div className="bg-gradient-to-br from-primary to-teal rounded-2xl p-5 sm:p-8 text-white mb-8">
        <p className="text-sm font-medium opacity-90 mb-1">Help &amp; How It Works</p>
        <h1 className="!text-white text-3xl sm:text-4xl mb-2">How can we help you?</h1>
        <p className="text-sm opacity-90 mb-5 max-w-2xl">
          Welcome, {roleLabel}. Here are the guides most relevant to your role. {ROLE_INTRO[help.role] || ''}
        </p>
        <div className="relative max-w-2xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setFilters({ q: e.target.value })}
            placeholder="Search help articles… e.g. “add patient”, “print bill”"
            aria-label="Search help articles"
            className="w-full pl-11 pr-11 py-3.5 rounded-xl text-text-dark text-base outline-none focus:ring-4 focus:ring-white/30"
          />
          {q && (
            <button onClick={() => setFilters({ q: '' })} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-dark">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {q.trim() ? (
        <section className="mb-10">
          <SectionTitle icon={Search}>
            {results.length} result{results.length === 1 ? '' : 's'} for “{q.trim()}”
          </SectionTitle>
          {results.length > 0 ? (
            <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden" data-testid="help-results">
              {results.map((a) => (
                <ArticleRow key={a.id} article={a} query={q} meta={help.categories.find((c) => c.id === a.category)?.title} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-6 text-sm text-text-muted">
              No guides match. Try a simpler word like “bill”, “patient”, “payment” or “print” — or browse the categories below.
            </div>
          )}
        </section>
      ) : (
        <>
          {bookmarks.length > 0 && (
            <section className="mb-8">
              <SectionTitle icon={Star}>Your bookmarks</SectionTitle>
              <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {bookmarks.map((a) => <ArticleRow key={a.id} article={a} />)}
              </div>
            </section>
          )}
          {recent.length > 0 && (
            <section className="mb-8">
              <SectionTitle icon={Clock}>Recently viewed</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {recent.map((a) => (
                  <Link key={a.id} to={`/admin/help/${a.id}`} className="text-sm bg-white border border-border rounded-full px-3.5 py-1.5 text-text-dark hover:border-primary/40 hover:text-primary">
                    {a.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <SectionTitle icon={Sparkles}>Quick guides</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {help.quick.map((a) => (
                <Link
                  key={a.id}
                  to={`/admin/help/${a.id}`}
                  className="group bg-white rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
                  data-testid="help-quick"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-text-dark group-hover:text-primary">
                    <HelpIcon name={help.categories.find((c) => c.id === a.category)?.icon} size={16} className="text-primary shrink-0" />
                    {a.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {help.workflows.length > 0 && (
            <section className="mb-10">
              <SectionTitle icon={Route}>How it works — complete workflows</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {help.workflows.map((w) => (
                  <Link
                    key={w.id}
                    to={`/admin/help/workflow/${w.id}`}
                    className="group bg-white rounded-xl border border-border p-4 hover:border-teal/40 transition-colors"
                    data-testid="help-workflow"
                  >
                    <p className="text-sm font-semibold text-text-dark group-hover:text-teal mb-1">{w.title}</p>
                    <p className="text-xs text-text-muted mb-2">{w.description}</p>
                    <p className="text-xs text-text-muted mb-0">
                      {w.steps.length} steps · {w.steps.slice(0, 3).map((s) => s.title).join(' → ')} →…
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <SectionTitle>Browse by topic</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {help.categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/admin/help/category/${c.id}`}
                  className="group bg-white rounded-xl border border-border p-4 hover:border-primary/40 transition-colors"
                  data-testid="help-category"
                >
                  <span className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary p-2 rounded-lg shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <HelpIcon name={c.icon} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-text-dark">{c.title}</span>
                      <span className="block text-xs text-text-muted">{c.description}</span>
                      <span className="block text-[11px] text-text-muted mt-1">{c.articles.length} guide{c.articles.length === 1 ? '' : 's'}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {help.faqs.length > 0 && (
            <section className="mb-10">
              <SectionTitle>Frequently asked questions</SectionTitle>
              <FaqList faqs={help.faqs} />
            </section>
          )}
        </>
      )}

      <StillNeedHelp role={help.role} />
      {q.trim() && (
        <button onClick={() => setFilters({ q: '' })} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Back to all guides <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export default HelpCenter;
