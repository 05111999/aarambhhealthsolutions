// Checks the Help Center content against the real app:
//  - every article/workflow/FAQ link and category points somewhere that exists
//  - every permission a guide requires exists in the permission catalog
//  - every button, tab, field, chip and menu label a guide shows actually appears in
//    the app's source — so guides can't describe buttons that don't exist.
// Run after changing the app or the guides:  node scripts/check-help.mjs
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { ARTICLES, CATEGORIES, WORKFLOWS, FAQS, QUICK_GUIDES } from '../src/admin/help/helpContent.js';
import { PERMISSION_CATALOG } from '../src/admin/permissions/permissionCatalog.js';

const files = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|js)$/.test(f) && !p.includes(join('admin', 'help'))) files.push(readFileSync(p, 'utf8'));
  }
};
walk('src/admin');
const source = files.join('\n').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const inApp = (label) => source.includes(label);

const problems = [];
const ids = new Set(ARTICLES.map((a) => a.id));
const cats = new Set(CATEGORIES.map((c) => c.id));
const validReq = (r) => r === 'superadmin' || r === 'adminOrAbove' || (() => { const [m, a] = r.split('.'); return !!PERMISSION_CATALOG[m]?.actions?.[a]; })();
const reqs = (x) => (x ? (Array.isArray(x) ? x : [x]) : []);

if (ids.size !== ARTICLES.length) problems.push('duplicate article ids');
// Labels drawn on purpose that are icons/tooltips rather than visible text.
const ALLOW = new Set(['Open menu', 'Notifications', 'Add sub-item', 'Delete hospital', 'Delete therapist', 'Import therapist logins', '%', '₹']);
for (const a of ARTICLES) {
  if (!cats.has(a.category)) problems.push(`${a.id}: unknown category ${a.category}`);
  for (const r of reqs(a.requires)) if (!validReq(r)) problems.push(`${a.id}: unknown permission ${r}`);
  if (a.action) for (const r of reqs(a.action.requires)) if (!validReq(r)) problems.push(`${a.id}: action permission ${r}`);
  for (const r of a.related || []) if (!ids.has(r)) problems.push(`${a.id}: related → missing ${r}`);
  for (const s of a.steps || []) {
    const v = s.visual || {};
    const labels = [v.button, v.nav, ...(v.tabs || []), ...(v.chips || []), ...(v.fields || []).map((f) => f.label)].filter(Boolean);
    for (const l of labels) if (!ALLOW.has(l) && !inApp(l)) problems.push(`${a.id}: “${l}” not found in the app`);
  }
}
for (const w of WORKFLOWS) for (const s of w.steps) if (s.article && !ids.has(s.article)) problems.push(`workflow ${w.id} → missing ${s.article}`);
for (const f of FAQS) if (f.article && !ids.has(f.article)) problems.push(`faq “${f.q}” → missing ${f.article}`);
for (const q of QUICK_GUIDES) if (!ids.has(q)) problems.push(`quick guide missing ${q}`);

console.log(`${ARTICLES.length} articles, ${WORKFLOWS.length} workflows, ${FAQS.length} FAQs checked.`);
if (problems.length) {
  console.log(problems.map((p) => `  ✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('  ✓ all links, permissions and on-screen labels match the app');
