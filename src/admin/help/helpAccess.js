import { ARTICLES, CATEGORIES, FAQS, QUICK_GUIDES, WORKFLOWS } from './helpContent';

// Who may see a guide: the same permission the feature itself needs (so a Super Admin
// granting someone extra access automatically gives them the matching guides).
// The app's server-side rules still decide what each person can actually do.
export function canSee(item, { role, hasPermission }) {
  if (item.audience && !item.audience.includes(role) && role !== 'superadmin') return false;
  const reqs = item.requires ? (Array.isArray(item.requires) ? item.requires : [item.requires]) : [];
  return reqs.every((r) => {
    if (r === 'superadmin') return role === 'superadmin';
    if (r === 'adminOrAbove') return role === 'superadmin' || role === 'admin';
    const [moduleKey, action] = r.split('.');
    return hasPermission(moduleKey, action);
  });
}

// Everything the viewer can see, prepared once per render of the help pages.
export function helpFor(viewer) {
  const articles = ARTICLES.filter((a) => canSee(a, viewer));
  const byId = new Map(articles.map((a) => [a.id, a]));
  const categories = CATEGORIES.map((c) => ({ ...c, articles: articles.filter((a) => a.category === c.id) })).filter((c) => c.articles.length);
  return {
    articles,
    byId,
    categories,
    // Articles in reading order (category order, then as written) for Previous/Next.
    ordered: categories.flatMap((c) => c.articles),
    quick: QUICK_GUIDES.map((id) => byId.get(id)).filter(Boolean),
    workflows: WORKFLOWS.filter((w) => canSee(w, viewer)).map((w) => ({ ...w, steps: w.steps.map((s) => ({ ...s, article: byId.has(s.article) ? s.article : null })) })),
    faqs: FAQS.filter((f) => canSee(f, viewer)).map((f) => ({ ...f, article: byId.has(f.article) ? f.article : null })),
  };
}

const norm = (s) => (s || '').toLowerCase();
const STOP = new Set(['how', 'to', 'do', 'i', 'a', 'an', 'the', 'can', 'my', 'in', 'of', 'for', 'is', 'what', 'where', 'why']);

export const searchTerms = (query) =>
  norm(query)
    .split(/[^a-z0-9₹]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

// Ranked search over title, description, keywords, category, steps and fixes.
export function searchArticles(articles, query) {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const categoryTitle = new Map(CATEGORIES.map((c) => [c.id, c.title]));
  return articles
    .map((a) => {
      const fields = [
        [norm(a.title), 6],
        [norm((a.keywords || []).join(' ')), 4],
        [norm(a.description), 3],
        [norm(categoryTitle.get(a.category)), 2],
        [norm((a.steps || []).map((s) => `${s.title} ${s.text}`).join(' ') + (a.fixes || []).map((f) => `${f.cause} ${f.solution}`).join(' ') + (a.tips || []).join(' ')), 1],
      ];
      let score = 0;
      for (const t of terms) {
        // A word matches its plural/singular form too (bill ↔ bills).
        const stem = t.replace(/s$/, '');
        const hit = fields.reduce((best, [text, w]) => (text.includes(stem) ? Math.max(best, w) : best), 0);
        if (!hit) return null; // every word must match somewhere
        score += hit;
      }
      return { article: a, score };
    })
    .filter(Boolean)
    .sort((x, y) => y.score - x.score)
    .filter((r, _, all) => {
      // Guides that only mention the words somewhere in their steps are dropped when
      // there are already enough guides actually about them (title/keywords/description).
      const strong = all.filter((x) => x.score >= terms.length * 3).length;
      return strong < 5 || r.score > terms.length;
    })
    .map((r) => r.article);
}
