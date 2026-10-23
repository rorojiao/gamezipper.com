// R332 — Step 0 catalog atomic consistency check
// Verifies 6 sources agree on the live game set + numeric counts.
const fs = require('fs');
const path = require('path');
const ROOT = '/home/junze/gamezipper.com';
const R = (p) => path.join(ROOT, p);

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
const smExtra = [...smSet].filter(s => {
  if (liveSet.has(s)) return false;
  if (!/^[a-z0-9-]+$/.test(s)) return false;      // not a game-slug shape (category pages etc.)
  return fs.existsSync(R(s));                        // a real dir on disk
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
const catCounts = [...new Set([...idx.matchAll(/cat-count[^>]*>(\d+)</g)].map(m => m[1]))];
console.log('index data-count values =', dataCounts.join(','));
console.log('index cat-count values  =', catCounts.join(','));
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
if (catCounts.length !== 1 || catCounts[0] !== String(live.length)) problems.push('cat-count drift');
if (String(inl) !== String(live.length)) problems.push('index inline itemlist count drift');
if (String(inlN) !== String(live.length)) problems.push('index inline numberOfItems drift');
console.log('\nVERDICT:', problems.length ? 'PROBLEMS: ' + problems.join(' | ') : 'ATOMIC-CONSISTENT');
process.exit(problems.length ? 1 : 0);
