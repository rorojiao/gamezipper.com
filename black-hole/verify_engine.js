// Static + dynamic verifier for black-hole (sweep 45, 2026-08-08).
// Catches the P0 bug where hole radius at mass=1 was smaller than the
// smallest orb radius (preventing any growth).
//
// Usage: node black-hole/verify_engine.js
// Exit 0 = all levels solvable from initial state, exit 1 = blocked.

'use strict';
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract MASS_RADIUS_SCALE
const m = HTML.match(/const MASS_RADIUS_SCALE\s*=\s*(\d+)/);
if (!m) { console.error('ERR: cannot find MASS_RADIUS_SCALE'); process.exit(1); }
const MASS_RADIUS_SCALE = parseInt(m[1], 10);
console.log(`MASS_RADIUS_SCALE = ${MASS_RADIUS_SCALE}`);

// Orb radius formula from black-hole/index.html (~line 655)
//   radius: md.s * 3 + 2
function orbRadius(s) { return s * 3 + 2; }

// Hole radius formula
function holeRadius(m) { return Math.sqrt(Math.max(1, m)) * MASS_RADIUS_SCALE; }

// Parse LEVELS via eval
const m2 = HTML.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (!m2) { console.error('ERR: cannot find LEVELS'); process.exit(1); }
const LEVELS = eval(m2[1]);
console.log(`Loaded ${LEVELS.length} levels`);

// Find min orb size
const allSizes = [];
LEVELS.forEach(lv => {
  (lv.orbs || []).forEach(o => allSizes.push(o.s));
  (lv.moving || []).forEach(o => allSizes.push(o.s));
});
const minOrbSize = Math.min(...allSizes);
const minOrbR = orbRadius(minOrbSize);
console.log(`smallest orb: size=${minOrbSize}, radius=${minOrbR}`);
console.log(`initial hole: mass=1, radius=${holeRadius(1).toFixed(2)}`);

// P0 check
if (holeRadius(1) < minOrbR) {
  console.log(`\n❌ P0 FAIL: hole radius at mass=1 (${holeRadius(1).toFixed(2)}) < smallest orb radius (${minOrbR})`);
  console.log('  Player cannot consume any orb → game is unsolvable from the start.');
  process.exit(1);
}
console.log(`✅ hole radius (${holeRadius(1).toFixed(2)}) ≥ smallest orb radius (${minOrbR})`);

// ── All-level chain solvability sweep (R1129: was level-1 only) ──
// Greedy model mirrors index.html runtime:
//   consume: o.radius <= hole.radius && dist < hole.radius * CONSUME_LENIENCY(1.0)
//   growth:  mass += obj.size * 0.5 + 0.5
//   win:     mass >= target (1★), target*1.1 (2★), target*1.3 (3★)
// Greedy eats smallest-first = maximally permissive chain order; if this
// fails, no order works. Walls: hole must pass wall gaps with radius <= gap/2;
// check target mass is reachable while radius still fits the narrowest gap.
const ARENA_W = 800, ARENA_H = 800;
let fails = 0;
LEVELS.forEach((def, i) => {
  const n = i + 1;
  const items = [];
  (def.orbs || []).forEach(o => { for (let k = 0; k < o.n; k++) items.push(o.s); });
  (def.moving || []).forEach(o => { for (let k = 0; k < o.n; k++) items.push(o.s); });
  items.sort((a, b) => a - b);
  let mass = 1;
  let idx = 0;
  // chain: eat smallest edible repeatedly
  while (idx < items.length && orbRadius(items[idx]) <= holeRadius(mass)) {
    mass += items[idx] * 0.5 + 0.5;
    idx++;
  }
  const totalMass = 1 + items.reduce((a, s) => a + s * 0.5 + 0.5, 0);
  const oneStar = mass >= def.target;
  // wall-gap guard: narrowest horizontal gap the hole must cross
  let narrowestGap = Infinity;
  for (const w of (def.walls || [])) {
    // gaps between wall segments and arena borders on the same y-band
    const segs = (def.walls || []).filter(o => Math.abs(o.y - w.y) < w.h);
    let gaps = [];
    let prev = 0;
    for (const s2 of segs.sort((a, b) => a.x - b.x)) { gaps.push(s2.x - prev); prev = s2.x + s2.w; }
    gaps.push(ARENA_W - prev);
    gaps = gaps.filter(g => g > 0);
    if (gaps.length) narrowestGap = Math.min(narrowestGap, Math.min(...gaps));
  }
  const gapRadiusLimit = narrowestGap === Infinity ? Infinity : narrowestGap / 2;
  const gapMassLimit = gapRadiusLimit === Infinity ? Infinity : (gapRadiusLimit / MASS_RADIUS_SCALE) ** 2;
  const gapOk = def.target <= gapMassLimit; // can win before outgrowing gaps
  if (!oneStar || !gapOk) {
    fails++;
    console.log(`❌ FAIL level ${n}: chainMass=${mass.toFixed(1)} target=${def.target} total=${totalMass.toFixed(1)} gapMassLimit=${gapMassLimit === Infinity ? '∞' : gapMassLimit.toFixed(0)} wallGapOk=${gapOk}`);
  } else if (n <= 3 || n === LEVELS.length) {
    console.log(`✓ level ${n}: chain reaches ${mass.toFixed(1)} ≥ target ${def.target}${totalMass >= def.target * 1.3 ? ' (3★-capable)' : ''}`);
  }
});
if (fails) {
  console.log(`\n=== FAIL: ${fails}/${LEVELS.length} levels unsolvable ===`);
  process.exit(1);
}
console.log(`\n=== PASS: ${LEVELS.length}/${LEVELS.length} levels chain-solvable (greedy smallest-first) + wall-gap guard ===`);
process.exit(0);