#!/usr/bin/env node
/**
 * R332 — game-footer.js related-games rail audit.
 *
 * Replicates the SHIPPED selection algorithm in game-footer.js exactly:
 *   sameCat = games.filter(g => g.c === current.c && g.u !== cur)
 *   others  = games.filter(g => g.u !== cur && g.c !== current.c)
 *   sortGames(): recent-first, then hashStr(name) ascending,
 *                hash seeded by getDateSeed() = today's YYYY-MM-DD
 *   pick = sameCat.slice(0,4).concat(others.slice(0, max(0, 6 - sameCat.length)))
 *
 * Then it checks every live game page's 6-card rail for:
 *   - a card pointing at a REDIRECT page (user is bounced to a keeper)
 *   - a card pointing at a NONEXISTENT slug (hard 404)
 *   - a DUPLICATE slug in the same 6-card rail
 *
 * The date seed means the answer changes daily; we sweep a range of seeds so
 * the result is not a single-day artefact.
 */
const fs = require('fs');
const path = require('path');
const REPO = path.join(__dirname, '..');

// ---------- load rail ----------
const src = fs.readFileSync(path.join(REPO, 'game-footer.js'), 'utf8');
const pat = /\{\s*n\s*:\s*'((?:[^'\\]|\\.)*)'[^}]*?u\s*:\s*'([^']+)'[^}]*?c\s*:\s*'([^']+)'/g;
const games = [];
let m;
while ((m = pat.exec(src)) !== null) games.push({ n: m[1], u: m[2], c: m[3] });
console.log(`rail entries parsed: ${games.length}`);

// ---------- live set ----------
const gd = fs.readFileSync(path.join(REPO, 'js/games-data.js'), 'utf8');
const GAMES = new Function(gd.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=') + '; return GAMES;')()
  .filter(g => g.status === 'live');
const live = new Set(GAMES.map(g => String(g.url).replace(/^\//, '').replace(/\/$/, '')));

// ---------- redirect map ----------
const redirect = {};
for (const d of fs.readdirSync(REPO)) {
  const p = path.join(REPO, d);
  if (!fs.statSync(p).isDirectory() || d.startsWith('.')) continue;
  const idx = path.join(p, 'index.html');
  if (!fs.existsSync(idx)) continue;
  const h = fs.readFileSync(idx, 'utf8').slice(0, 4000);
  const mm = /http-equiv=["']?refresh["']?[^>]*content=["']?[^"']*url=(?:https?:\/\/[^"'\/]*\/)?([a-z0-9-]+)\//i.exec(h);
  if (mm) redirect[d] = mm[1];
}

// ---------- broken rail slugs ----------
const brokenRedirect = new Set(), brokenMissing = new Set();
for (const g of games) {
  const s = g.u.replace(/^\//, '').replace(/\/$/, '');
  if (redirect[s]) brokenRedirect.add(s);
  else if (!live.has(s)) brokenMissing.add(s);
}
console.log(`rail slugs -> redirect page: ${brokenRedirect.size}  -> nonexistent/404: ${brokenMissing.size}`);

// ---------- selection replica ----------
function hashStr(name, seed) {
  let h = seed;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
  return h & h;
}
function dateSeed(d) {
  let h = 0;
  for (let i = 0; i < d.length; i++) h = ((h << 5) - h) + d.charCodeAt(i);
  return h & h;
}
function pickFor(curSlug, seed) {
  const cur = '/' + curSlug + '/';
  const current = games.find(g => g.u === cur);
  let sameCat = games.filter(g => g && current && g.c === current.c && g.u !== cur);
  let others = games.filter(g => g && g.u !== cur && (!current || g.c !== current.c));
  const cmp = (a, b) => hashStr(a.n, seed) - hashStr(b.n, seed);
  sameCat = sameCat.slice().sort(cmp);
  others = others.slice().sort(cmp);
  return sameCat.slice(0, 4).concat(others.slice(0, Math.max(0, 6 - sameCat.length)));
}

// ---------- sweep 30 consecutive days ----------
const pageSlugs = [...live];
let pagesWithRedirect = 0, pagesWithMissing = 0, pagesWithDup = 0;
let redirectCardHits = 0, missingCardHits = 0, dupCardHits = 0;
const redirectCards = {}, missingCards = {}, dupCards = {};
const perPageRedirect = {}, perPageMissing = {};

for (let day = 0; day < 30; day++) {
  const d = new Date(Date.UTC(2026, 9, 20 + day)).toISOString().slice(0, 10);
  const seed = dateSeed(d);
  for (const slug of pageSlugs) {
    const pick = pickFor(slug, seed);
    const seen = new Set();
    let hasR = false, hasM = false, hasD = false;
    for (const g of pick) {
      const s = g.u.replace(/^\//, '').replace(/\/$/, '');
      if (redirect[s]) { hasR = true; redirectCardHits++; redirectCards[s] = (redirectCards[s] || 0) + 1; perPageRedirect[slug] = (perPageRedirect[slug] || 0) + 1; }
      else if (brokenMissing.has(s)) { hasM = true; missingCardHits++; missingCards[s] = (missingCards[s] || 0) + 1; perPageMissing[slug] = (perPageMissing[slug] || 0) + 1; }
      if (seen.has(s)) { hasD = true; dupCardHits++; dupCards[s] = (dupCards[s] || 0) + 1; }
      seen.add(s);
    }
    if (hasR) pagesWithRedirect++;
    if (hasM) pagesWithMissing++;
    if (hasD) pagesWithDup++;
  }
}

const T = pageSlugs.length * 30;
console.log(`\n=== 30-DAY x ${pageSlugs.length} PAGE SWEEP (${T.toLocaleString()} page-days) ===`);
console.log(`page-days showing >=1 REDIRECT card : ${pagesWithRedirect} (${(pagesWithRedirect / T * 100).toFixed(2)}%)`);
console.log(`page-days showing >=1 404 card      : ${pagesWithMissing} (${(pagesWithMissing / T * 100).toFixed(2)}%)`);
console.log(`page-days showing >=1 DUP slug      : ${pagesWithDup} (${(pagesWithDup / T * 100).toFixed(2)}%)`);
console.log(`total redirect cards rendered : ${redirectCardHits}`);
console.log(`total 404 cards rendered      : ${missingCardHits}`);
console.log(`total duplicate cards         : ${dupCardHits}`);

console.log('\n--- which broken slugs get rendered (card-days) ---');
for (const [s, n] of Object.entries(redirectCards).sort((a, b) => b[1] - a[1]))
  console.log(`  REDIRECT ${s.padEnd(24)} -> ${redirect[s]}   ${n} card-days`);
for (const [s, n] of Object.entries(missingCards).sort((a, b) => b[1] - a[1]))
  console.log(`  404      ${s.padEnd(24)} (no dir)             ${n} card-days`);
console.log('\n--- duplicate slugs rendered in one rail ---');
for (const [s, n] of Object.entries(dupCards).sort((a, b) => b[1] - a[1]).slice(0, 20))
  console.log(`  DUP ${s.padEnd(24)} ${n} card-days`);
