// tests/lib/suite-b-consistency.mjs — site-level consistency checks (cases.md Suite B).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, read, exists, loadGames, listRootPages, findZombies, SuiteResult } from './common.mjs';

export default function suiteB() {
  const R = new SuiteResult('B:consistency');
  let games = [];
  // B1 games-data parses
  try { games = loadGames(); R.record('B1', 'js/games-data.js', true); }
  catch (e) { R.record('B1', 'js/games-data.js', false, e.message); return R; }

  const slugs = games.map(g => (g.url || '').replace(/^\//, '').replace(/\/$/, ''));

  // B2 unique slugs
  const seen = new Set(), dup = new Set();
  for (const s of slugs) { if (seen.has(s)) dup.add(s); seen.add(s); }
  R.record('B2', 'games-data urls', dup.size === 0, [...dup].join(','));

  // B3 every registered game dir exists (orphan registration check)
  for (const s of slugs) {
    R.record('B3', s, exists(path.join(s, 'index.html')), 'registered but index.html missing');
  }

  // B4 count consistency in index.html: data-count, "N free browser games", JSON-LD description number
  const idx = read('index.html');
  const counts = [];
  for (const m of idx.matchAll(/data-count="(\d+)"/g)) counts.push({ where: 'data-count', n: +m[1] });
  for (const m of idx.matchAll(/(\d+)\s+free browser games/gi)) counts.push({ where: 'text:"N free browser games"', n: +m[1] });
  for (const m of idx.matchAll(/(\d+)\s+(?:free\s+)?(?:online\s+)?games\s+you\s+can\s+play/gi)) counts.push({ where: 'jsonld-desc', n: +m[1] });
  const uniqCounts = new Map();
  for (const c of counts) uniqCounts.set(`${c.where}=${c.n}`, c);
  for (const c of uniqCounts.values()) {
    R.record('B4', c.where, c.n === games.length, `claims ${c.n}, games-data has ${games.length}`);
  }

  // B5 sitemap.xml covers all registered games
  const sm = read('sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const locSet = new Set(locs);
  for (const s of slugs) {
    R.record('B5', s, locSet.has(`https://gamezipper.com/${s}/`), 'missing from sitemap.xml');
  }

  // B6 every sitemap loc maps to an existing file/dir
  for (const loc of locs) {
    const p = loc.replace(/^https:\/\/gamezipper\.com\/?/, '');
    if (p === '') { R.record('B6', loc, true); continue; }
    const rel = p.endsWith('/') ? path.join(p, 'index.html') : p;
    R.record('B6', loc, exists(rel), 'no matching file');
  }

  // B7 sitemap.html covers all registered games
  const smh = read('sitemap.html');
  for (const s of slugs) {
    R.record('B7', s, smh.includes(`/${s}/`), 'missing from sitemap.html');
  }

  // B8 categories json parse + slugs exist; B9 game cats have category files
  const catFiles = fs.readdirSync(path.join(ROOT, 'js', 'categories')).filter(f => f.endsWith('.json'));
  const catNames = new Set(catFiles.map(f => f.replace(/\.json$/, '')));
  for (const f of catFiles) {
    let arr;
    try { arr = JSON.parse(read(path.join('js', 'categories', f))); }
    catch (e) { R.record('B8', f, false, 'JSON parse: ' + e.message); continue; }
    if (!Array.isArray(arr)) { R.record('B8', f, false, 'not an array'); continue; }
    for (const entry of arr) {
      const slug = entry.slug || entry.url && entry.url.replace(/^\//, '').replace(/\/$/, '');
      R.record('B8', `${f}:${slug}`, !!(slug && exists(path.join(slug, 'index.html'))), 'slug dir missing');
    }
  }
  for (const g of games) {
    R.record('B9', `${g.cat}:${g.url}`, catNames.has(g.cat), `no js/categories/${g.cat}.json`);
  }

  // B10 root pages have non-empty titles (search-engine verification files exempt)
  for (const f of listRootPages()) {
    if (/^google[a-f0-9]+\.html$/.test(f)) { R.note(`${f}: search-engine verification file, title check skipped`); continue; }
    const html = read(f);
    const t = html.match(/<title>([\s\S]*?)<\/title>/i);
    R.record('B10', f, !!(t && t[1].trim()), t ? 'title empty' : 'no <title>');
  }

  // B11 index.html internal /<slug>/ links resolve
  const linkSlugs = new Set([...idx.matchAll(/href="\/([a-z0-9-]+)\/"/g)].map(m => m[1]));
  for (const s of linkSlugs) {
    R.record('B11', `/${s}/`, exists(path.join(s, 'index.html')), 'dead internal link on index.html');
  }

  // B12 zombie domains in root pages + shared root JS
  const sharedJs = fs.readdirSync(ROOT).filter(f => f.endsWith('.js') && !f.startsWith('test-') && f !== 'playwright.config.js' && f !== 'rebuild_schema.js' && f !== 'qa-tetra-fit.js');
  for (const f of [...listRootPages(), ...sharedJs]) {
    const z = findZombies(read(f));
    R.record('B12', f, z.length === 0, z.join(','));
  }
  return R;
}
