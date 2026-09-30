import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Star, CheckCircle2, XCircle, UserCog, ExternalLink } from 'lucide-react';
import { PERMISSION_CATALOG } from '../permissions/permissionCatalog';
import { CATEGORIES } from './helpContent';
import { canSee } from './helpAccess';
import { getHelpPrefs, markViewed, toggleBookmark } from './helpPrefs';
import { useHelp } from './useHelp';
import { Callout, HelpBreadcrumb, HelpStep, RelatedArticles, StillNeedHelp } from './HelpUI';

// "What can I do with my account?" — read live from the viewer's permissions.
const MyAccess = ({ role, hasPermission }) => {
  if (role === 'superadmin') {
    return <Callout kind="result" title="Super Admin">You have full access to every part of the system.</Callout>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(PERMISSION_CATALOG).map(([moduleKey, mod]) => (
        <div key={moduleKey} className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-dark mb-2">{mod.label}</p>
          <ul className="space-y-1.5">
            {Object.entries(mod.actions).map(([action, label]) => {
              const ok = hasPermission(moduleKey, action);
              return (
                <li key={action} className={`flex items-start gap-2 text-sm ${ok ? 'text-text-dark' : 'text-text-muted'}`}>
                  {ok ? <CheckCircle2 size={15} className="text-teal shrink-0 mt-0.5" /> : <XCircle size={15} className="text-text-muted/60 shrink-0 mt-0.5" />}
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

const HelpArticlePage = () => {
  const { articleId } = useParams();
  const help = useHelp();
  const article = help.byId.get(articleId);
  const [bookmarked, setBookmarked] = useState(() => getHelpPrefs().bookmarks.includes(articleId));

  useEffect(() => {
    if (article) markViewed(article.id);
    setBookmarked(getHelpPrefs().bookmarks.includes(articleId));
    window.scrollTo?.(0, 0);
  }, [article, articleId]);

  if (!article) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">This guide doesn’t exist, or isn’t part of your role.</p>
        <Link to="/admin/help" className="text-primary font-semibold">Back to Help Center</Link>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === article.category);
  const index = help.ordered.findIndex((a) => a.id === article.id);
  const prev = help.ordered[index - 1];
  const next = help.ordered[index + 1];
  const viewer = { role: help.role, hasPermission: help.hasPermission };
  const action = article.action && canSee({ requires: article.action.requires }, viewer) ? article.action : null;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/help" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-3 transition-colors">
        <ArrowLeft size={16} />
        Back to Help Center
      </Link>
      <HelpBreadcrumb
        items={[{ label: 'Help Center', to: '/admin/help' }, { label: category?.title, to: `/admin/help/category/${category?.id}` }, { label: article.title }]}
      />

      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="mb-0 text-3xl sm:text-4xl">{article.title}</h1>
        <button
          onClick={() => setBookmarked(toggleBookmark(article.id).bookmarks.includes(article.id))}
          aria-pressed={bookmarked}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark this guide'}
          className={`shrink-0 p-2.5 rounded-lg border transition-colors ${bookmarked ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-border text-text-muted hover:text-amber-600'}`}
        >
          <Star size={18} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="text-text-muted text-base mb-5">{article.description}</p>

      {article.when && (
        <div className="bg-white rounded-xl border border-border px-4 py-3 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">When to use this</p>
          <p className="text-sm text-text-dark mb-0">{article.when}</p>
        </div>
      )}

      {article.special === 'myAccess' && (
        <div className="mb-6">
          <MyAccess role={help.role} hasPermission={help.hasPermission} />
        </div>
      )}

      {article.steps?.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold text-text-dark mb-4">Step by step</h2>
          <ol>
            {article.steps.map((step, i) => (
              <HelpStep key={step.title} number={i + 1} step={step} viewer={viewer} />
            ))}
          </ol>
        </div>
      )}

      {article.fixes?.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-bold text-text-dark mb-1">Possible causes and solutions</h2>
          {article.fixes.map((f) => (
            <div key={f.cause} className="bg-white rounded-xl border border-border p-4" data-testid="help-fix">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Possible cause</p>
              <p className="text-sm text-text-dark mb-2">{f.cause}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal mb-1">Solution</p>
              <p className="text-sm text-text-dark mb-0">{f.solution}</p>
              {f.needsAdmin && (
                <p className="inline-flex items-center gap-1.5 mt-2 mb-0 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  <UserCog size={13} />
                  Contact your administrator
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {article.result && <Callout kind="result">{article.result}</Callout>}
        {article.tips?.length > 0 && (
          <Callout kind="tip">
            <ul className="list-disc pl-5 space-y-1 mb-0">
              {article.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Callout>
        )}
        {article.important?.length > 0 && (
          <Callout kind="important">
            <ul className="list-disc pl-5 space-y-1 mb-0">
              {article.important.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Callout>
        )}
      </div>

      {action && (
        <Link to={action.to} className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-3 rounded-lg hover:bg-light-blue transition-colors mb-6">
          <ExternalLink size={16} />
          {action.label}
        </Link>
      )}

      <div className="mb-6">
        <RelatedArticles ids={article.related} byId={help.byId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {prev ? (
          <Link to={`/admin/help/${prev.id}`} className="group bg-white rounded-xl border border-border p-4 hover:border-primary/40">
            <span className="flex items-center gap-1 text-xs text-text-muted mb-1"><ArrowLeft size={12} /> Previous</span>
            <span className="text-sm font-semibold text-text-dark group-hover:text-primary">{prev.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/admin/help/${next.id}`} className="group bg-white rounded-xl border border-border p-4 hover:border-primary/40 sm:text-right">
            <span className="flex items-center gap-1 sm:justify-end text-xs text-text-muted mb-1">Next <ArrowRight size={12} /></span>
            <span className="text-sm font-semibold text-text-dark group-hover:text-primary">{next.title}</span>
          </Link>
        )}
      </div>

      <StillNeedHelp role={help.role} />
    </div>
  );
};

export default HelpArticlePage;
