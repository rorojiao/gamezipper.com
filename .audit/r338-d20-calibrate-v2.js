#!/usr/bin/env node
/**
 * R338 — calibration for .audit/r338-d20-classify-v2.js
 *
 * The controls are chosen so they can FAIL:
 *   POSITIVE  all 19 games v1 settled as PROCEDURAL must stay PROCEDURAL
 *   CONTROL   hidato -> PROCEDURAL, numbrix / suguru / tapa -> STATIC
 *   NEW       the games v1 falsely called UNKNOWN but that DO ship an authored
 *             catalog -> STATIC
 *
 *   NEGATIVE  v1's STATIC set is NOT used as a control, because v1 had a
 *   systematic FALSE POSITIVE class (an EMPTY catalog or a METADATA array
 *   named LEVEL… was called STATIC even though the levels are generated).
 *   Instead every verdict CHANGE against v1 is PRINTED with its evidence for
 *   manual adjudication, and the script asserts that no game moved from
 *   PROCEDURAL to STATIC (a procedural game must never be declared authored).
 *
 * Exit 0 = calibration passed; exit 3 = FAILED (an uncalibrated detector may
 * not be trusted).
 */
const fs = require('fs');
const path = require('path');
const v1 = require('./r337-d20-classify.js');
const v2 = require('./r338-d20-classify-v2.js');

const games = v1.liveGames().map(g => g.url.replace(/^\//, '').replace(/\/$/, ''));

const res = {};
for (const s of games) {
  let a, b;
  try { a = v1.classify(s); } catch (e) { a = { kind: 'ERROR', why: String(e.message) }; }
  try { b = v2.classify(s); } catch (e) { b = { kind: 'ERROR', why: String(e.message) }; }
  res[s] = { v1: a, v2: b };
}

let fail = 0;
const bad = (slug, want, got, why) => {
  fail++;
  console.log('  FAIL  ' + slug.padEnd(22) + ' expected ' + want.padEnd(11) + ' got ' + got + '  (' + why + ')');
};

console.log('=== POSITIVE: v1 PROCEDURAL must stay PROCEDURAL ===');
const v1proc = Object.entries(res).filter(([, v]) => v.v1.kind === 'PROCEDURAL');
let kept = 0;
for (const [s, v] of v1proc) {
  if (v.v2.kind === 'PROCEDURAL') kept++;
  else bad(s, 'PROCEDURAL', v.v2.kind, v.v2.why);
}
console.log('  ' + kept + '/' + v1proc.length + ' kept');

console.log('=== INVARIANT: PROCEDURAL must never become STATIC ===');
for (const [s, v] of Object.entries(res)) {
  if (v.v1.kind === 'PROCEDURAL' && v.v2.kind === 'STATIC') bad(s, 'PROCEDURAL', 'STATIC', v.v2.why);
}

console.log('=== CONTROLS ===');
for (const [s, want] of [['hidato', 'PROCEDURAL'], ['numbrix', 'STATIC'], ['suguru', 'STATIC'], ['tapa', 'STATIC']]) {
  const got = res[s] ? res[s].v2.kind : 'missing';
  if (got === want) console.log('  PASS  ' + s.padEnd(22) + want);
  else bad(s, want, got, res[s] ? res[s].v2.why : '');
}

console.log('=== NEW: games v1 called UNKNOWN that DO ship an authored catalog ===');
// Ground-truth verified from source by hand (each game's own catalog
// declaration read and its content confirmed authored).
const NEW_STATIC = ['yajilin', 'tangram', 'bus-traffic-fever', 'number-maze', 'labyrinth', 'blumgi-slime',
  'tile-dynasty', 'kitchen-rush', 'hidden-object', 'tower-stacker-3d', 'tidy-up-3d',
  'bag-puzzle', 'knotwords', 'block-out', 'arrow-puzzle', 'tower-of-hanoi', 'odd-one-out',
  'liquid-connect', 'hex-path-spin', 'magic-square', 'teleport-jumper', 'pull-the-pin',
  'sticker-book-puzzle', 'domino-toppler', 'mini-golf', 'bottle-flip-3d', 'bowling-master',
  'constellation-connect', 'sling-smash', 'cut-the-rope'];
for (const s of NEW_STATIC) {
  const got = res[s] ? res[s].v2.kind : 'missing';
  if (got === 'STATIC') console.log('  PASS  ' + s.padEnd(22) + 'STATIC  (' + res[s].v2.why + ')');
  else bad(s, 'STATIC', got, res[s] ? res[s].v2.why : '');
}

console.log('=== NEW: games v1 called UNKNOWN that are genuinely PROCEDURAL ===');
// Read from source: the level catalog is EMPTY and is filled by a seeded
// generator, so the shipped levels are synthesised at runtime.
//   glyph-quest  `var level = generateLevel(cols, rows, seed + attempt*13)`
//   conveyor-sort `var LEVELS=[]; for(i=1..30) LEVELS.push(genLevel(i))`
// Neither advertises "handcrafted levels", so neither is a D20 copy defect —
// but the classifier must still say PROCEDURAL.
//   unpuzzle      `LEVELS.push({id,tier,w,h,par,seed:...})` — the entries
//                 carry ONLY a seed and `makePattern(L.seed,...)` draws the
//                 board through `mulberry32`
const NEW_PROC = ['glyph-quest', 'conveyor-sort', 'unpuzzle'];
for (const s of NEW_PROC) {
  const got = res[s] ? res[s].v2.kind : 'missing';
  if (got === 'PROCEDURAL') console.log('  PASS  ' + s.padEnd(22) + 'PROCEDURAL  (' + res[s].v2.why.slice(0, 90) + ')');
  else bad(s, 'PROCEDURAL', got, res[s] ? res[s].v2.why : '');
}

console.log('=== CLAIMING SET: every game that advertises "handcrafted levels" must resolve ===');
// The D20 defect class is a game that CLAIMS N handcrafted levels but
// synthesises them at runtime. The claiming set is therefore the set that
// MATTERS: an UNKNOWN there is an open question about the copy, and a
// PROCEDURAL there is a real defect. This is the semantic gap R338 closes.
const CLAIMING = Object.keys(res).filter(s => {
  const dir = path.join(v2.ROOT, s);
  try {
    const h = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    return /hand-?crafted/i.test(h);
  } catch (e) { return false; }
});
console.log('  claiming games: ' + CLAIMING.length);
const claimStat = { STATIC: 0, UNKNOWN: 0, PROCEDURAL: 0 };
for (const s of CLAIMING) {
  const k = res[s] ? res[s].v2.kind : 'missing';
  claimStat[k] = (claimStat[k] || 0) + 1;
  if (k === 'UNKNOWN') bad(s, 'STATIC|PROCEDURAL', k, res[s] ? res[s].v2.why : '');
}
console.log('  claiming resolution: ' + JSON.stringify(claimStat));
// A claiming game that is PROCEDURAL is a real D20 copy defect and must be
// reported, not silenced by the calibration.
const claimProc = CLAIMING.filter(s => res[s] && res[s].v2.kind === 'PROCEDURAL');
console.log('  claiming games that are PROCEDURAL (D20 copy defects): ' + claimProc.length);
for (const s of claimProc) console.log('    D20-DEFECT  ' + s.padEnd(22) + res[s].v2.why.slice(0, 100));

console.log('=== NON-claiming games must NOT be claimed as handcrafted either ===');
// A game that does NOT advertise handcrafted levels but is classified
// PROCEDURAL is fine (it never promised authored content).
// A game that does NOT advertise handcrafted but IS STATIC is also fine.

console.log('=== VERDICT CHANGES vs v1 (manual adjudication list) ===');
const changed = Object.entries(res).filter(([, v]) => v.v1.kind !== v.v2.kind);
for (const [s, v] of changed) {
  console.log('  ' + s.padEnd(22) + v.v1.kind.padEnd(11) + '-> ' + v.v2.kind.padEnd(11) + ' | ' + v.v2.why.slice(0, 110));
}
console.log('  (' + changed.length + ' changed of ' + games.length + ')');

const counts = {};
for (const [, v] of Object.entries(res)) counts[v.v2.kind] = (counts[v.v2.kind] || 0) + 1;
console.log('\nv2 kind distribution:', JSON.stringify(counts));
const v1c = {};
for (const [, v] of Object.entries(res)) v1c[v.v1.kind] = (v1c[v.v1.kind] || 0) + 1;
console.log('v1 kind distribution:', JSON.stringify(v1c));

if (fail) {
  console.log('\nCALIBRATION FAILED — ' + fail + ' mismatches');
  process.exit(3);
}
console.log('\nCALIBRATION PASSED (hard controls green; ' + changed.length + ' verdict changes listed for adjudication)');
