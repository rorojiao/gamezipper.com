#!/usr/bin/env node
/**
 * R332 — regenerate the homepage inline JSON-LD ItemList from the live catalog.
 *
 * WHY
 * ---
 * index.html carried a hand-maintained inline ItemList:
 *
 *   { "@type":"ItemList", "name":"Popular GameZipper Games",
 *     "numberOfItems": 466, "itemListElement":[ ...22 entries... ] }
 *
 * Three defects in one block:
 *   1. numberOfItems (466) != itemListElement.length (22)
 *   2. position values are non-contiguous (1..12, 14, 458..466) — a gap at 13
 *      and a jump to 458, so the list is not a valid ordered enumeration
 *   3. one entry advertised /nut-sort/ — a `noindex,follow` canonical REDIRECT
 *      page, not a live game. Advertising a redirect target in structured data
 *      is a defect (the R2 dedup protocol requires redirect targets to be
 *      removed from catalog/schema/internal links).
 *
 * WHY A GENERATOR, NOT A HAND EDIT
 * --------------------------------
 * A hand-edited list is exactly what produced the drift. js/itemlist-schema.js
 * is ALSO a 466-entry ItemList with contiguous positions and no redirect URLs,
 * but it is a plain .js file (`const ITEMLIST_SCHEMA = {...}`) with NO runtime
 * consumer — so crawlers never see it, and it cannot keep the inline block in
 * sync. This script derives the inline block from the SAME single source of
 * truth (js/games-data.js, status==="live"), so the two always agree.
 *
 * The block is written as the site's canonical ItemList (name "GameZipper Free
 * HTML5 Games", description "<N> free browser games you can play instantly"),
 * matching js/itemlist-schema.js exactly.
 *
 * Usage:
 *   node scripts/build-itemlist-inline.js          # dry run (report diff)
 *   node scripts/build-itemlist-inline.js --apply  # write index.html
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

// ---------- load the live catalog ----------
const raw = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8');
const code = raw.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1 =');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(code + '\n;globalThis.__GAMES = GAMES;', ctx);
const games = ctx.__GAMES || [];
const live = games.filter(g => g && g.url && g.status === 'live');

// ---------- detect redirect pages (must NOT be advertised) ----------
const redirectSlugs = new Set();
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
  const idx = path.join(ROOT, entry.name, 'index.html');
  if (!fs.existsSync(idx)) continue;
  const head = fs.readFileSync(idx, 'utf8').slice(0, 4000);
  if (/http-equiv=["']?refresh/i.test(head)) redirectSlugs.add(entry.name);
}

const items = live.map((g, i) => {
  const url = String(g.url).replace(/^\//, '').replace(/\/$/, '');
  const name = String(g.name).replace(/"/g, '\\"');
  return { position: i + 1, name, slug: url };
});

const leaked = items.filter(it => redirectSlugs.has(it.slug));
if (leaked.length) {
  console.error('❌ live catalog contains redirect slugs — refusing to build:',
    leaked.map(i => i.slug).join(', '));
  process.exit(2);
}

const N = items.length;
const schema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'GameZipper Free HTML5 Games',
  itemListElement: items.map(it => ({
    '@type': 'ListItem',
    position: it.position,
    name: it.name,
    url: `https://gamezipper.com/${it.slug}/`,
  })),
  numberOfItems: N,
  description: `${N} free browser games you can play instantly`,
};

// ---------- replace the inline ItemList block in index.html ----------
const idxPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(idxPath, 'utf8');

const BLOCK_RE = /<script type="application\/ld\+json">\s*\{[^{}]*"@type"\s*:\s*"ItemList"[\s\S]*?<\/script>/;
const m = html.match(BLOCK_RE);
if (!m) {
  console.error('❌ inline ItemList block not found in index.html');
  process.exit(3);
}
const oldBlock = m[0];
const newBlock = '<script type="application/ld+json">' +
  JSON.stringify(schema) + '</script>';

console.log(`live games           : ${N}`);
console.log(`redirect slugs in cat: ${leaked.length}`);
console.log(`old block bytes      : ${oldBlock.length}`);
console.log(`new block bytes      : ${newBlock.length}`);

// Guard: a game name containing "</script" would terminate the JSON-LD block
// early and break the whole page. JSON.stringify does NOT escape it.
// Check the JSON PAYLOAD only — the wrapper's own closing </script> is expected.
const jsonPayload = newBlock.slice(newBlock.indexOf('>') + 1, newBlock.lastIndexOf('</script>'));
if (/<\/script/i.test(jsonPayload)) {
  console.error('❌ generated block contains "</script" — refusing to write');
  process.exit(7);
}

if (oldBlock === newBlock) {
  console.log('✅ inline ItemList already matches the live catalog — no change.');
  process.exit(0);
}

// sanity: the new block must parse and satisfy the invariants
const parsed = JSON.parse(newBlock.slice(
  newBlock.indexOf('>') + 1, newBlock.lastIndexOf('</script>')));
if (parsed.numberOfItems !== parsed.itemListElement.length) {
  console.error('❌ numberOfItems != itemListElement.length'); process.exit(4);
}
const positions = parsed.itemListElement.map(i => i.position);
if (positions.some((p, i) => p !== i + 1)) {
  console.error('❌ positions are not contiguous 1..N'); process.exit(5);
}
if (parsed.itemListElement.some(i => /https?:\/\/[^/]+\/(nut-sort|ball-sort|color-sort|coin-sort|wool-sort|sand-sort|hexa-2048|atomas|emoji-merge)\//.test(i.url))) {
  console.error('❌ redirect target present in generated block'); process.exit(6);
}
console.log('✅ new block passes: count match, contiguous positions, no redirect URLs');

if (!APPLY) {
  console.log('(dry run — pass --apply to write index.html)');
  process.exit(0);
}

html = html.replace(oldBlock, newBlock);

// The site also loaded js/itemlist-schema.js as <script src> on the homepage.
// That file is a plain .js module (`const ITEMLIST_SCHEMA = {...}`) — it is
// NOT valid JSON-LD, so crawlers never saw it, and NO runtime code reads
// ITEMLIST_SCHEMA (verified: zero consumers outside its own generator). It
// was a 47KB dead download on every homepage view that ALSO could not keep
// the inline block in sync — which is precisely how the inline block drifted.
// Now that the inline block is generated from js/games-data.js directly, the
// dead tag is removed.
const DEAD_TAG = /<script src="\/js\/itemlist-schema\.js[^"]*"[^>]*><\/script>/;
if (DEAD_TAG.test(html)) {
  html = html.replace(DEAD_TAG, '');
  console.log('✅ removed dead <script src="/js/itemlist-schema.js"> tag '
    + '(no runtime consumer; never valid JSON-LD for crawlers)');
}

fs.writeFileSync(idxPath, html);
console.log(`✅ wrote index.html (${oldBlock.length} → ${newBlock.length} bytes)`);
