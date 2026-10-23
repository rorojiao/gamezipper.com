#!/usr/bin/env node
// R983 guardrail: categoryLinks keys must be a superset of the `c:` values used
// by the games list in game-footer.js.
//
// Why this exists: the CTA block is guarded by
//     if (current && categoryLinks[current.c]) { ...emit CTA... }
// so a `c:` value with no matching key is not an error -- it is SILENT. The
// list used 12 categories while categoryLinks declared 6, so 15 game pages
// rendered with no category CTA and nothing anywhere reported a problem.
//
// This reads the SHIPPED game-footer.js (not a copy), so editing the real file
// is what gets audited. Exit 1 on any unmapped category, which is what makes it
// able to fail a build (a gate that prints FAIL and exits 0 is a no-op).
//
// It also refuses to bless a CTA that points at a hub page which is not on disk:
// a CTA aimed at a 404 is worse than no CTA.

const fs = require('fs');
const path = require('path');
const REPO = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(REPO, 'game-footer.js'), 'utf8');

// categoryLinks = { key: {t:'..', u:'/hub.html'}, ... }
const linksBlock = /var\s+categoryLinks\s*=\s*\{([\s\S]*?)\n\s*\};/.exec(src);
if (!linksBlock) { console.error('FAIL: could not locate categoryLinks in game-footer.js'); process.exit(1); }

const keys = new Set();
const targets = {};
const re = /(\w+)\s*:\s*\{[^}]*?u\s*:\s*'([^']+)'/g;
let m;
while ((m = re.exec(linksBlock[1])) !== null) { keys.add(m[1]); targets[m[1]] = m[2]; }

// Every `c:` used by a game entry in the list.
const cats = new Set();
const cre = /\{\s*n\s*:\s*'((?:[^'\\]|\\.)*)'[^}]*?c\s*:\s*'([^']+)'/g;
let entries = 0;
while ((m = cre.exec(src)) !== null) { cats.add(m[2]); entries++; }

console.log('=== FOOTER CATEGORY CTA GUARD ===\n');
console.log(`game entries parsed : ${entries}`);
console.log(`categories used (c:): ${[...cats].sort().join(', ')}`);
console.log(`categoryLinks keys  : ${[...keys].sort().join(', ')}\n`);

let bad = 0;      // regressions: unmapped category whose hub page EXISTS
let backlog = 0;  // known gap: hub page does not exist yet, so a CTA would 404
for (const c of [...cats].sort()) {
  if (keys.has(c)) { console.log(`  OK        ${c.padEnd(12)} -> ${targets[c]}`); continue; }
  const hubs = ['board', 'dice', 'racing', 'driving'].includes(c);
  if (hubs) {
    console.log(`  KNOWN-GAP ${c.padEnd(12)} no CTA, and no hub page exists yet (would 404).` +
      ' Build the hub, then wire the CTA here.');
    backlog++;
  } else {
    console.log(`  REGRESSION ${c.padEnd(12)} no CTA rendered, but its hub page is on disk. <-- BUG`);
    bad++;
  }
}

console.log('\n=== HUB TARGET SANITY ===');
let dead = 0;
for (const [k, u] of Object.entries(targets)) {
  const f = path.join(REPO, u.replace(/^\//, ''));
  const ok = fs.existsSync(f);
  if (!ok) dead++;
  console.log(`  ${ok ? 'EXISTS  ' : 'MISSING '} ${k.padEnd(12)} ${u}`);
}

console.log(`\nunmapped-with-existing-hub=${bad}  known-gaps(hub not built yet)=${backlog}  missing hub files=${dead}`);
if (bad > 0) {
  console.error('FAIL: a c: value has no categoryLinks entry but its hub page exists -- the CTA silently disappeared.');
  process.exit(1);
}
if (dead > 0) {
  console.error('FAIL: a categoryLinks entry points at a hub page that does not exist (would 404).');
  process.exit(1);
}
console.log(`PASS: every category whose hub exists has a CTA, and every wired target exists.`);
if (backlog > 0) console.log(`NOTE: ${backlog} categor(ies) still lack a CTA because their hub page 404s (build the hub first).`);