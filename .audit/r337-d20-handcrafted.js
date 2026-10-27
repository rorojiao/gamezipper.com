#!/usr/bin/env node
/**
 * R337 — D20 detector: which live games claim "handcrafted" levels but
 * GENERATE their catalog at runtime?
 *
 * The classifier itself lives in .audit/r337-d20-classify.js (single source
 * of truth, shared with the fixer). This script is the reporting layer.
 *
 * WHY: 105-162 of the 466 live games say "N handcrafted levels".
 * "Handcrafted" means a human authored the levels. A game that synthesizes
 * its catalog at load time from a seeded RNG cannot honestly claim that —
 * the copy describes a different product from the one that ships. Same class
 * as R336's D18 (advertised count vs shipped catalog).
 *
 * CALIBRATION (mandatory, Pitfall #62 — a detector that cannot fail is not
 * a detector):
 *   POSITIVE: hidato (generatePuzzle + seeded RNG) -> PROCEDURAL
 *   NEGATIVE: numbrix (ships levels.json)          -> STATIC
 *   NEGATIVE: suguru (inline literal catalog)      -> STATIC
 *   NEGATIVE: tapa  (ships levels.json)            -> STATIC
 *   NEGATIVE: blumgi-slime (buildLevels() pushes AUTHORED literals) -> NOT PROCEDURAL
 */
const fs = require('fs');
const path = require('path');
const { classify, liveGames, ROOT } = require('./r337-d20-classify.js');

const res = [];
for (const g of liveGames()) {
  const slug = g.url.replace(/^\//, '').replace(/\/$/, '');
  let c;
  try { c = classify(slug); } catch (e) { c = { kind: 'ERROR', why: String(e.message) }; }
  let claims = false;
  try {
    claims = /hand-?crafted/i.test(fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8'));
  } catch (e) { /* no index.html */ }
  res.push({ slug, name: g.name, claimsHandcrafted: claims, ...c });
}

console.log('=== CALIBRATION ===');
const cal = [
  ['hidato', 'PROCEDURAL'],
  ['numbrix', 'STATIC'],
  ['suguru', 'STATIC'],
  ['tapa', 'STATIC'],
  ['blumgi-slime', 'UNKNOWN'],   // authored literals in a builder function
];
let calFail = 0;
for (const [slug, want] of cal) {
  const r = res.find(x => x.slug === slug);
  const ok = r && r.kind === want;
  if (!ok) calFail++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + slug + ' expected ' + want + ' got ' + (r ? r.kind : 'missing') + ' (' + (r ? r.why : '') + ')');
}
if (calFail) {
  console.log('CALIBRATION FAILED — an uncalibrated detector may not be trusted');
  process.exit(3);
}

const claiming = res.filter(r => r.claimsHandcrafted);
const procClaiming = claiming.filter(r => r.kind === 'PROCEDURAL');
const statClaiming = claiming.filter(r => r.kind === 'STATIC');
const unknown = claiming.filter(r => r.kind === 'UNKNOWN');
console.log('\nlive games claiming "handcrafted": ' + claiming.length +
  '  (STATIC ' + statClaiming.length + ', PROCEDURAL ' + procClaiming.length + ', UNKNOWN ' + unknown.length + ')');
console.log('\n=== D20 findings: claims "handcrafted" but GENERATES the catalog at runtime ===');
for (const r of procClaiming) console.log('  ' + r.slug.padEnd(24) + r.name.padEnd(24) + r.why);
if (!procClaiming.length) console.log('  (none)');
console.log('\n=== UNKNOWN (not flagged — the detector does not guess) ===');
console.log('  ' + (unknown.map(r => r.slug).join(', ') || '(none)'));
fs.writeFileSync(path.join(ROOT, '.audit/r337-d20-handcrafted.json'), JSON.stringify({ res, procClaiming }, null, 1));
console.log('\nWROTE .audit/r337-d20-handcrafted.json');
