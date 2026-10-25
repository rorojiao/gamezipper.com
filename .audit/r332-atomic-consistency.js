// R332 — Step 0 catalog atomic consistency check
// Verifies 6 sources agree on the live game set + numeric counts.
//
// R334 FIX: ROOT was a hardcoded absolute path, so the script ALWAYS audited
// /home/junze/gamezipper.com — including when run against a test copy. That
// made the mandatory negative test impossible: injecting a fault into a copy
// still produced a clean verdict because the copy was never read. Resolve the
// root from the GZ_SITE_ROOT env var, else from this file's own location
// (.audit/..), so the script audits whatever tree it ships with.
const fs = require('fs');
const path = require('path');
const ROOT = process.env.GZ_SITE_ROOT
  || path.resolve(__dirname, '..');
const R = (p) => path.join(ROOT, p);
console.log('AUDITING ROOT =', ROOT);

const src = fs.readFileSync(R('js/games-data.js'), 'utf8');
const t = src.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
const GAMES = new Function(t + '; return GAMES;')();
const live = GAMES.filter(g => g.status === 'live');
const norm = (u) => String(u || '').replace(/^\//, '').replace(/\/$/, '').trim();
const liveSlugs = live.map(g => norm(g.url));
const liveSet = new Set(liveSlugs);
console.log('live_total =', live.length, '| unique =', liveSet.size);

// 1. GAMES array internal
const dupSlugs = liveSlugs.filter((s, i) => liveSlugs.indexOf(s) !== i);
const dupNames = live.map(g => g.name).filter((n, i, a) => a.indexOf(n) !== i);
console.log('dup_slugs =', dupSlugs.length ? dupSlugs.join(',') : 'none');
console.log('dup_names =', dupNames.length ? dupNames.join(',') : 'none');

// 2. directories exist
const missingDir = liveSlugs.filter(s => !fs.existsSync(R(s + '/index.html')));
console.log('missing_index_html =', missingDir.length ? missingDir.join(',') : 'none');

// 3. itemlist-schema.js
const ils = fs.readFileSync(R('js/itemlist-schema.js'), 'utf8');
const ilN = (ils.match(/"@type":"ListItem"/g) || []).length;
const ilUrls = [...ils.matchAll(/"url":"https:\/\/gamezipper\.com\/([^/"]+)\/"/g)].map(x => x[1]);
const ilSet = new Set(ilUrls);
const ilMissing = liveSlugs.filter(s => !ilSet.has(s));
const ilExtra = [...ilSet].filter(s => !liveSet.has(s));
console.log(`itemlist: numberOfItems=${(ils.match(/"numberOfItems":(\d+)/) || [])[1]} itemListElement=${ilN} urls=${ilUrls.length}`);
console.log('  itemlist_missing =', ilMissing.length ? ilMissing.join(',') : 'none');
console.log('  itemlist_extra   =', ilExtra.length ? ilExtra.join(',') : 'none');

// 4. sitemap
const sm = fs.readFileSync(R('sitemap.xml'), 'utf8');
const smAll = [...sm.matchAll(/<loc>https:\/\/gamezipper\.com\/([^<]*)<\/loc>/g)].map(x => x[1]);
const smSet = new Set(smAll.map(norm).filter(Boolean));
const smMissing = liveSlugs.filter(s => !smSet.has(s));
// extras = sitemap entries that look like a game slug (dir exists on disk) but aren't live
// R334 FIX: the previous version flagged every LEGITIMATE STATIC PAGE whose
// directory happens to exist on disk (blog/, contact/, terms/, cookie-policy/,
// fun-web-games/, zh/) as a "sitemap extra game dir". Those are real HTTP-200
// pages that belong in the sitemap — flagging them made this gate report
// PROBLEMS on a perfectly healthy catalog (a gate that always cries wolf is
// worse than no gate; it trains the operator to ignore it).
// The real defect this check exists for is a DELETED GAME whose directory and
// sitemap entry survived the R2 dedup. That is detectable precisely: the dir
// exists, is NOT a known static page, and its URL is NOT live.
const STATIC_PAGES = new Set(['blog', 'contact', 'cookie-policy', 'terms', 'fun-web-games', 'zh',
  'sitemap', 'embed-games', 'publisher-partner', 'about', 'index', 'rss', 'sitemap.xml']);
const smExtra = [...smSet].filter(s => {
  if (liveSet.has(s)) return false;
  if (!/^[a-z0-9-]+$/.test(s)) return false;      // not a game-slug shape (category pages etc.)
  if (STATIC_PAGES.has(s)) return false;          // R334: known static pages are legit sitemap entries
  if (!fs.existsSync(R(s))) return false;         // not a dir on disk
  // it must actually look like a GAME page: a game dir carries a <canvas> or
  // a <script> block. A static page does not.
  try {
    const h = fs.readFileSync(R(s + '/index.html'), 'utf8');
    if (!/<canvas|<script/i.test(h)) return false;
  } catch (e) { return false; }
  return true;
});
console.log(`sitemap: entries=${smAll.length} game_dirs_on_disk=${smExtra.length}`);
console.log('  sitemap_missing =', smMissing.length ? smMissing.join(',') : 'none');
console.log('  sitemap_extra_dirs =', smExtra.length ? smExtra.join(',') : 'none');

// 5. test-library games-list
const tlRaw = JSON.parse(fs.readFileSync(R('test-library/games-list.json'), 'utf8'));
const tlArr = Array.isArray(tlRaw) ? tlRaw : (tlRaw.games || tlRaw.data || []);
const tlSet = new Set(tlArr.map(g => norm(g.slug)));
const tlMissing = liveSlugs.filter(s => !tlSet.has(s));
const tlExtra = [...tlSet].filter(s => !liveSet.has(s));
console.log(`test-library: entries=${tlArr.length}`);
console.log('  tl_missing =', tlMissing.length ? tlMissing.join(',') : 'none');
console.log('  tl_extra   =', tlExtra.length ? tlExtra.join(',') : 'none');

// 6. index.html numeric sources
const idx = fs.readFileSync(R('index.html'), 'utf8');
const dataCounts = [...new Set([...idx.matchAll(/data-count="(\d+)"/g)].map(m => m[1]))];
// R334 FIX: the previous version asserted that ALL cat-count spans hold ONE
// number equal to the live total. That was true when the homepage had a single
// "All" counter; it now carries PER-CATEGORY counters (Puzzle 392, Arcade 38,
// ...) plus a Blog-post counter (306) that is not a game count at all. The
// check therefore reported "cat-count drift" on a healthy catalog.
// The real invariant is: every GAME category's counter equals the number of
// live games in that category. The Blog counter is excluded by matching the
// category filter it belongs to.
const catCounts = {};
// Bound the match to ONE button: the previous pattern used a lazy [\s\S]{0,220}?
// which could cross a </button> boundary and pair the "all" filter with the
// NEXT button's number (the "all" counter is JS-filled at runtime and its
// static value is a literal backslash, not a digit).
for (const m of idx.matchAll(/<button[^>]*onclick="filter\('([a-z]+)'[^"]*"[^>]*>(?:(?!<\/button>)[\s\S])*?class="cat-count">(\d+)/g)) {
  catCounts[m[1]] = Number(m[2]);
}
const liveByCat = {};
for (const g of live) liveByCat[g.cat] = (liveByCat[g.cat] || 0) + 1;
const catDrift = [];
for (const [cat, n] of Object.entries(liveByCat)) {
  if (catCounts[cat] === undefined) { catDrift.push(`${cat}: MISSING in HTML (expected ${n})`); continue; }
  if (catCounts[cat] !== n) catDrift.push(`${cat}: HTML ${catCounts[cat]} vs GAMES ${n}`);
}
// categories present in HTML but with no live games
for (const [cat, n] of Object.entries(catCounts)) {
  if (cat === 'all') continue;
  if (!liveByCat[cat]) catDrift.push(`${cat}: HTML ${n} but 0 live games`);
}
console.log('index data-count values =', dataCounts.join(','));
console.log('index cat-counts        =', JSON.stringify(catCounts));
console.log('GAMES per cat           =', JSON.stringify(liveByCat));
console.log('cat-count drift         =', catDrift.length ? catDrift.join('; ') : 'none');
const inl = [...idx.matchAll(/"@type":"ListItem"/g)].length;
const inlN = (idx.match(/"numberOfItems":(\d+)/) || [])[1];
console.log(`index inline JSON-LD: itemListElement=${inl} numberOfItems=${inlN}`);

// verdict
const problems = [];
if (dupSlugs.length) problems.push('dup slugs');
if (dupNames.length) problems.push('dup names');
if (missingDir.length) problems.push('missing index.html');
if (ilMissing.length || ilExtra.length) problems.push('itemlist set mismatch');
if (smMissing.length) problems.push('sitemap missing');
if (smExtra.length) problems.push('sitemap extra game dirs');
if (tlMissing.length || tlExtra.length) problems.push('test-library set mismatch');
if (dataCounts.length !== 1 || dataCounts[0] !== String(live.length)) problems.push('data-count drift');
if (catDrift.length) problems.push('cat-count drift: ' + catDrift.join('; '));
if (String(inl) !== String(live.length)) problems.push('index inline itemlist count drift');
if (String(inlN) !== String(live.length)) problems.push('index inline numberOfItems drift');
console.log('\nVERDICT:', problems.length ? 'PROBLEMS: ' + problems.join(' | ') : 'ATOMIC-CONSISTENT');
process.exit(problems.length ? 1 : 0);
