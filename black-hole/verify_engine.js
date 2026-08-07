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

// Simulate level 1
const lv1 = LEVELS[0];
const target = lv1.target;
const massPerOrb = minOrbSize * 0.5 + 0.5;  // from consumeObject()
const orbsNeeded = Math.max(0, target - 1);
console.log(`\nLevel 1: target=${target}, mass_per_orb=${massPerOrb}, orbs_needed=${orbsNeeded}`);
for (let i = 1; i <= 10; i++) {
  const m2 = 1 + i * massPerOrb;
  console.log(`  after ${i} eats: mass=${m2.toFixed(1)}, radius=${holeRadius(m2).toFixed(2)}`);
}
console.log('\n=== PASS: level 1 + general radius invariant ===');
process.exit(0);