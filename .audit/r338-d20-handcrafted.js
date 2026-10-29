#!/usr/bin/env node
/**
 * R338 — D20 gate (canonical): live games that claim "handcrafted" levels but
 * GENERATE their catalog at runtime.
 *
 * Supersedes .audit/r337-d20-handcrafted.js, whose v1 classifier was a
 * two-sided P1 test-gate defect:
 *   FALSE NEGATIVE  the v1 scanner only read the page's INLINE script and
 *                   accepted a handful of variable names, so a catalog in an
 *                   external game.js / data.js, under an ALIAS (var LV=,
 *                   var LVLS=), behind a builder function, or inside a
 *                   direct IIFE was invisible -> 14 claiming games sat at
 *                   UNKNOWN instead of being decided.
 *   FALSE POSITIVE  an EMPTY catalog (var LEVELS=[]) or a METADATA array
 *                   (CONFIG, puzzles) was called STATIC even though the
 *                   levels are generated at runtime.
 * The v2 classifier (.audit/r338-d20-classify-v2.js) resolves the catalog
 * declaration across every source the page actually ships, distinguishes an
 * authored catalog from a metadata object by the SHAPE of its entries, and
 * only calls a game PROCEDURAL when the generator writes the SAME catalog
 * the game selects levels from.
 *
 * THIS SCRIPT IS A GATE: it exits NON-ZERO when a live game claims
 * "handcrafted" levels but ships a runtime-generated catalog. A detector
 * that prints a finding and still exits 0 is not a gate (Pitfall #62).
 *
 * CALIBRATION (mandatory — a detector that cannot fail is not a detector):
 *   POSITIVE  hidato            -> PROCEDURAL  (seeded RNG)
 *   POSITIVE  conveyor-sort     -> PROCEDURAL  (empty catalog + genLevel)
 *   POSITIVE  glyph-quest       -> PROCEDURAL  (inline LCG)
 *   NEGATIVE  numbrix           -> STATIC      (authored catalog)
 *   NEGATIVE  suguru            -> STATIC      (authored catalog)
 *   NEGATIVE  tapa              -> STATIC      (authored catalog)
 *   NEGATIVE  shape-fold        -> STATIC      (authored builder)
 *   NEGATIVE  teleport-jumper   -> STATIC      (direct IIFE of literals)
 *   NEGATIVE  blumgi-slime      -> STATIC      (buildLevels() of literals)
 *   NEGATIVE  hex-haven         -> PROCEDURAL  (CONFIG is metadata)
 *   NEGATIVE  killer-sudoku     -> PROCEDURAL  (puzzles is metadata)
 */
const fs = require('fs');
const path = require('path');
const v2 = require('./r338-d20-classify-v2.js');
const { classify, liveGames, ROOT } = v2;

// A game "claims" handcrafted levels when its page says so. The word has
// several synonym forms on this site, and missing one is a FALSE NEGATIVE:
//   "hand-crafted"  (x-sudoku, kropki-sudoku, ...)
//   "handcrafted"   (balls-vs-bricks)
//   "hand-built"    (unpuzzle — "104 hand-built levels across 6 tiers")
//   "hand-designed" / "hand-authored"
// The matcher must NOT fire on an incidental use ("boggle" ships a
// word-list containing the word "handmade"), so it requires the claim to be
// attached to LEVELS in a short window.
const CLAIM_RE = /hand-?\s?(?:crafted|built|designed|authored)\b[^.<>]{0,40}\b(?:level|puzzle|board|course|stage|grid|challenge|maze|track)s?\b|\b(?:level|puzzle|board|course|stage|grid|challenge|maze|track)s?\b[^.<>]{0,40}hand-?\s?(?:crafted|built|designed|authored)\b/i;

function claimsHandcrafted(slug) {
  let h;
  try { h = fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8'); } catch (e) { return false; }
  return CLAIM_RE.test(h);
}

const res = [];
for (const g of liveGames()) {
  const slug = g.url.replace(/^\//, '').replace(/\/$/, '');
  let c;
  try { c = classify(slug); } catch (e) { c = { kind: 'ERROR', why: String(e.message) }; }
  const claims = claimsHandcrafted(slug);
  res.push({ slug, name: g.name, claimsHandcrafted: claims, ...c });
}
const by = Object.fromEntries(res.map(r => [r.slug, r]));

console.log('=== CALIBRATION ===');
const cal = [
  ['hidato', 'PROCEDURAL'],
  ['conveyor-sort', 'PROCEDURAL'],
  ['glyph-quest', 'PROCEDURAL'],
  ['killer-sudoku', 'PROCEDURAL'],
  ['hex-haven', 'PROCEDURAL'],
  ['numbrix', 'STATIC'],
  ['suguru', 'STATIC'],
  ['tapa', 'STATIC'],
  ['shape-fold', 'STATIC'],
  ['teleport-jumper', 'STATIC'],
  ['blumgi-slime', 'STATIC'],
  ['yajilin', 'STATIC'],
  ['tangram', 'STATIC'],
  ['bus-traffic-fever', 'STATIC'],
  ['number-maze', 'STATIC'],
  ['labyrinth', 'STATIC'],
];
let calFail = 0;
for (const [slug, want] of cal) {
  const r = by[slug];
  const ok = r && r.kind === want;
  if (!ok) calFail++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + slug.padEnd(22) +
    'expected ' + want.padEnd(10) + 'got ' + (r ? r.kind : 'missing'));
}
if (calFail) {
  console.log('CALIBRATION FAILED — an uncalibrated detector may not be trusted');
  process.exit(3);
}

const claiming = res.filter(r => r.claimsHandcrafted);
const procClaiming = claiming.filter(r => r.kind === 'PROCEDURAL');
const statClaiming = claiming.filter(r => r.kind === 'STATIC');
const unknown = claiming.filter(r => r.kind === 'UNKNOWN');
const errors = res.filter(r => r.kind === 'ERROR');

console.log('\nlive games claiming "handcrafted": ' + claiming.length +
  '  (STATIC ' + statClaiming.length + ', PROCEDURAL ' + procClaiming.length +
  ', UNKNOWN ' + unknown.length + ')');
console.log('live games whose classification ERRORED: ' + errors.length);
for (const r of errors) console.log('  ERROR ' + r.slug.padEnd(24) + r.why);

console.log('\n=== D20 findings: claims "handcrafted" but GENERATES the catalog at runtime ===');
for (const r of procClaiming) console.log('  ' + r.slug.padEnd(24) + r.name.padEnd(24) + r.why);
if (!procClaiming.length) console.log('  (none)');

console.log('\n=== UNKNOWN (not flagged — the detector does not guess) ===');
console.log('  ' + (unknown.map(r => r.slug).join(', ') || '(none)'));

fs.writeFileSync(path.join(ROOT, '.audit/r338-d20-handcrafted.json'),
  JSON.stringify({ res, procClaiming }, null, 1));
console.log('\nWROTE .audit/r338-d20-handcrafted.json');

// ---- the gate itself -----------------------------------------------------
// Any UNKNOWN claiming game is also a failure: a detector that cannot decide
// a claiming game is an undecided gate, and every one of those is a latent
// defect. (R338 drove this from 14 to 0.)
if (procClaiming.length || unknown.length || errors.length) {
  console.log('\nD20 GATE FAILED — ' + procClaiming.length + ' copy defect(s), ' +
    unknown.length + ' undecided, ' + errors.length + ' errored');
  process.exit(1);
}
console.log('\nD20 GATE PASSED — 0 copy defects, 0 undecided claiming games');
