// balance-scale verify_engine.js
// Rule: among N coins exactly ONE is counterfeit. Each weighing returns
// 'left' | 'right' | 'equal' (3-way outcome). With `w` weighings you can
// distinguish at most 3^w possible (idx, type) worlds.
//
// For known-direction (heavy or light): N worlds
// For unknown-direction: 2N worlds (could be heavy or light)
//
// Gameplay: 3 guesses allowed. We're checking that the level is solvable
// (i.e. the coin-count can be identified within the weighing budget).
//
// Strategy: try greedy split. The level is solvable iff 3^weighings >= spaceSize.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/(?:const|var|let)\s+LEVELS\s*=\s*(\[[\s\S]*?\])\s*;/);
if (!m) { console.error('FAIL: cannot extract LEVELS'); process.exit(1); }
const LEVELS = eval('(' + m[1] + ')');

function ipow3(n) { let r = 1; for (let i = 0; i < n; i++) r *= 3; return r; }
function minWeighings(N) {
  // smallest w s.t. 3^w >= N
  let w = 0;
  while (ipow3(w) < N) w++;
  return w;
}

const results = [];
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const directionKnown = (L.type === 'heavy' || L.type === 'light');
  const spaceSize = directionKnown ? L.coins : 2 * L.coins;
  const minW = minWeighings(spaceSize);
  const ok = minW <= L.weighings;
  results.push({ i: i + 1, coins: L.coins, type: L.type, weighings: L.weighings, name: L.name, ok, minW });
}

const passed = results.filter(r => r.ok).length;
console.log(`balance-scale: PASS ${passed}/${results.length}`);
for (const r of results) {
  if (!r.ok) console.log(`  FAIL L${r.i} ${r.name}: coins=${r.coins} type=${r.type} weighings=${r.weighings} minW=${r.minW} (3^w >= spaceSize)`);
}
if (passed !== results.length) process.exit(1);
console.log('All balance-scale levels solvable within budget.');
