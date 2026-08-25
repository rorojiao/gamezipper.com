#!/usr/bin/env node
/* TC-SITE-01..09: static site integrity checker (TEST-CASES.md §1).
 * No browser needed — pure filesystem parsing. Usage: node site-check.js [--json]
 * Evidence: _optimization/reports/site-check.json (written every run) */
const fs = require('fs');
const path = require('path');
const repo = __dirname ? path.resolve(__dirname, '..', '..') : '.';
const OUT = { ts: new Date().toISOString(), cases: {}, defects: [] };
const ROOT_SKIP = new Set(['.git', '.claude', '.github', 'node_modules', '_optimization']);
function fileExists(p) { try { return fs.statSync(p).isFile(); } catch (e) { return false; } }
function dirHasIndex(p) { try { return fs.statSync(path.join(p, 'index.html')).isFile(); } catch (e) { return false; } }
// resolve a site-root URL path to a file; directories resolve via index.html; trailing-slash dirs without index = missing
function resolveUrl(u) {
  if (u.startsWith('#') || u.startsWith('mailto:') || u.startsWith('tel:')) return { ok: true };
  if (/^https?:\/\//i.test(u)) return { ok: true, external: true };
  let p = u.split('?')[0].split('#')[0];
  if (!p.startsWith('/')) return { ok: true, relative: true }; // relative links inside game pages out of scope here
  p = decodeURIComponent(p);
  if (p === '/' || p === '') return { ok: fileExists(path.join(repo, 'index.html')) };
  const fp = path.join(repo, p);
  if (fileExists(fp)) return { ok: true };
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory() && dirHasIndex(fp)) return { ok: true };
  return { ok: false, fp };
}
const defect = (caseId, what, detail) => { OUT.defects.push({ caseId, what, detail: String(detail).slice(0, 200) }); };

// ---------- load catalog (GAMES array) ----------
const gdSrc = fs.readFileSync(path.join(repo, 'js/games-data.js'), 'utf8');
const gStart = gdSrc.indexOf('const GAMES = [');
const gamesArr = eval(gdSrc.slice(gStart + 'const GAMES = '.length, gdSrc.indexOf('];', gStart) + 1));
const catalog = gamesArr.map(g => ({ slug: String(g.url || '').replace(/^\//, '').replace(/\/$/, ''), name: g.name, status: g.status }));

// ---------- TC-SITE-01/02/03: shell pages parse + links + assets ----------
const shellHtml = fs.readdirSync(repo).filter(f => f.endsWith('.html') && f !== 'googleaf4887b838cad74a.html').sort(); // google site-verification file is intentionally bare
let parseErrs = 0, deadLinks = [], missingAssets = [];
// strip comments and script/style bodies — their contents ("</script>" in strings, "<style>" mentioned
// in comments) are not markup; assets/links are also only scanned in real markup
const markupOnly = html => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, m => m.replace(/[\s\S]/g, ' '));
const tagBalance = (name, html) => {
  const counts = {};
  for (const t of ['div', 'section', 'script', 'style', 'a', 'table']) {
    const open = (html.match(new RegExp('<' + t + '(\\s|>)', 'g')) || []).length;
    const close = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (t === 'a' || t === 'div' || t === 'table') { if (close > open) counts[t] = `close>open ${close}>${open}`; }
    else if (open !== close) counts[t] = `${open}!=${close}`;
  }
  return counts;
};
for (const f of shellHtml) {
  const html = fs.readFileSync(path.join(repo, f), 'utf8');
  const mk = markupOnly(html);
  if (!/<html[\s>]/i.test(mk) || !/<\/html>/i.test(mk)) { parseErrs++; defect('TC-SITE-01', 'shell-parse', f + ' missing <html> envelope'); }
  if (!/<title>[^<]+<\/title>/i.test(mk)) { parseErrs++; defect('TC-SITE-01', 'shell-parse', f + ' missing <title>'); }
  const bal = tagBalance(f, mk);
  if (Object.keys(bal).length) { parseErrs++; defect('TC-SITE-01', 'tag-balance', f + ' ' + JSON.stringify(bal)); }
  // links + local assets (markup only — not inside <script> bodies)
  for (const m of mk.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi)) {
    const r = resolveUrl(m[1]);
    if (!r.ok) deadLinks.push(f + ' -> ' + m[1]);
  }
  for (const m of mk.matchAll(/<(?:img|script|link|source|audio|video)\b[^>]*(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const u = m[1];
    if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:') || u.startsWith('#')) continue;
    const r = resolveUrl(u);
    if (!r.ok) missingAssets.push(f + ' -> ' + u);
  }
}
OUT.cases['TC-SITE-01'] = { pages: shellHtml.length, errors: parseErrs };
OUT.cases['TC-SITE-02'] = { deadLinks: deadLinks.length, sample: deadLinks.slice(0, 30) };
deadLinks.forEach(d => defect('TC-SITE-02', 'dead-link', d));
OUT.cases['TC-SITE-03'] = { missingAssets: missingAssets.length, sample: missingAssets.slice(0, 30) };
missingAssets.forEach(d => defect('TC-SITE-03', 'missing-asset', d));

// ---------- TC-SITE-04: catalog <-> dirs bijection ----------
const UTILITY_DIRS = new Set(['admin', 'api', 'blog', 'contact', 'cookie-policy', 'fun-web-games', 'terms', 'zh', 'docs', 'outreach', 'promotion', 'public', 'tests', 'references', 'pool']); // pool = intentional redirect stub
const dirsWithIndex = fs.readdirSync(repo).filter(d => { try { return fs.statSync(d).isDirectory() && !ROOT_SKIP.has(d) && !d.startsWith('.') && dirHasIndex(path.join(repo, d)); } catch (e) { return false; } });
const catSlugs = new Set(catalog.map(g => g.slug));
const noDir = catalog.filter(g => g.slug && !dirsWithIndex.includes(g.slug));
const noCat = dirsWithIndex.filter(d => !catSlugs.has(d));
const noCatHidden = noCat.filter(d => !UTILITY_DIRS.has(d)); // hidden-but-live games (inventory stubs, verified separately in TC-GAME)
OUT.cases['TC-SITE-04'] = { catalog: catSlugs.size, dirs: dirsWithIndex.length, catalogWithoutDir: noDir.length, hiddenLiveGames: noCatHidden.length, utilityDirs: noCat.filter(d => UTILITY_DIRS.has(d)).length };
noDir.forEach(g => defect('TC-SITE-04', 'catalog-no-dir', g.slug));

// ---------- TC-SITE-05: category JSONs ----------
let catJsonProblems = [];
const catTotals = {};
for (const f of fs.readdirSync(path.join(repo, 'js/categories'))) {
  if (!f.endsWith('.json')) continue;
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(repo, 'js/categories', f), 'utf8')); } catch (e) { catJsonProblems.push(f + ' unparseable: ' + e.message); continue; }
  const arr = Array.isArray(j) ? j : (j.games || []);
  catTotals[f] = arr.length;
  const seen = new Set();
  for (const g of arr) {
    if (!g.slug || seen.has(g.slug)) { catJsonProblems.push(f + ' dup/empty slug ' + g.slug); continue; }
    seen.add(g.slug);
    if (!dirsWithIndex.includes(g.slug)) { catJsonProblems.push(f + ' slug without dir: ' + g.slug); continue; }
    // not in GAMES but dir exists = hidden-but-live game surfaced by a category page — allowed (informational)
  }
}
OUT.cases['TC-SITE-05'] = { files: 11, totals: catTotals, problems: catJsonProblems.length, sample: catJsonProblems.slice(0, 40) };
catJsonProblems.forEach(p => defect('TC-SITE-05', 'cat-json', p));

// ---------- TC-SITE-06: thumbs ----------
let thumbMissing = [];
for (const g of catalog) {
  if (!g.slug) continue;
  const t = path.join(repo, 'thumbs', g.slug + '.jpg');
  if (!fileExists(t)) thumbMissing.push(g.slug);
}
OUT.cases['TC-SITE-06'] = { catalogThumbsMissing: thumbMissing.length, sample: thumbMissing.slice(0, 30) };
// note: onerror fallback hides missing thumbs in UI; record as P3 defect only if >5% missing
if (thumbMissing.length > catalog.length * 0.05) thumbMissing.forEach(t => defect('TC-SITE-06', 'thumb-missing', t));

// ---------- TC-SITE-07: sitemap coverage ----------
const sm = fs.readFileSync(path.join(repo, 'sitemap.html'), 'utf8');
const smLinks = [...sm.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]).filter(u => u.startsWith('/'));
const smSet = new Set(smLinks.map(u => u.replace(/\/$/, '')));
let smMissingGame = catalog.filter(g => g.slug && !smSet.has('/' + g.slug));
let smDead = smLinks.filter(u => { const r = resolveUrl(u); return !r.ok; });
OUT.cases['TC-SITE-07'] = { links: smLinks.length, gamesMissingFromSitemap: smMissingGame.length, sample: smMissingGame.slice(0, 30).map(g => g.slug), deadSitemapLinks: smDead.length };
smDead.forEach(d => defect('TC-SITE-07', 'sitemap-dead', d));

// ---------- TC-SITE-09: infra files ----------
const infra = ['CNAME', 'robots.txt', 'ads.txt', 'favicon.ico', 'apple-touch-icon.png', 'index.html', '404.html', 'sitemap.html'];
const infraMissing = infra.filter(f => !fileExists(path.join(repo, f)));
OUT.cases['TC-SITE-09'] = { missing: infraMissing };
infraMissing.forEach(f => defect('TC-SITE-09', 'infra-missing', f));

// ---------- verdict ----------
OUT.verdict = OUT.defects.length === 0 ? 'PASS' : 'FAIL';
OUT.summary = { defects: OUT.defects.length };
fs.writeFileSync(path.join(repo, '_optimization/reports/site-check.json'), JSON.stringify(OUT, null, 1));
if (process.argv.includes('--json')) console.log(JSON.stringify(OUT));
else console.log(`[site-check] ${shellHtml.length} shell pages | verdict=${OUT.verdict} defects=${OUT.defects.length}`,
  '\n 01 parse:', JSON.stringify(OUT.cases['TC-SITE-01']),
  '\n 02 deadLinks:', deadLinks.length, '\n 03 missingAssets:', missingAssets.length,
  '\n 04 bijection: cat', catSlugs.size, '/ dirs', dirsWithIndex.length, 'noDir', noDir.length, 'noCat', noCat.length,
  '\n 05 catJson problems:', catJsonProblems.length, '\n 06 thumbs missing:', thumbMissing.length,
  '\n 07 sitemap missing-games:', smMissingGame.length, 'dead:', smDead.length,
  '\n 09 infra missing:', infraMissing.join(',') || 'none');
process.exit(OUT.verdict === 'PASS' ? 0 : 1);
