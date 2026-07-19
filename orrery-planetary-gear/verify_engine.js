// In-engine Node.js BFS verifier — uses EXACT game rules from index.html
// Extracts LEVELS and applies the same state transitions the game uses.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
// Pull LEVELS and OPTIMAL out of the embedded JS
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('orrery-planetary-gear');
const OPTIMAL = eval(optMatch[1]);
console.log(`Extracted ${LEVELS.length} levels and ${OPTIMAL.length} optima from index.html`);

// Replicate EXACT game state transition (from pressDial):
//   state=[(state[0]+d[0])%N,(state[1]+d[1])%N,(state[2]+d[2])%N]
// Win condition (from checkAutoWin): state[0]===state[1] && state[1]===state[2]
function applyDial(state, dial, N) {
  return [(state[0]+dial[0])%N, (state[1]+dial[1])%N, (state[2]+dial[2])%N];
}
function isWin(state) { return state[0]===state[1] && state[1]===state[2]; }

// BFS to find min presses to win (ordered sequence; but since commutative, min = min multiset size)
function bfsMin(N, dials, start) {
  const seen = new Map(); // state -> min presses
  const key = s => s.join(',');
  const sq = key(start);
  seen.set(sq, 0);
  let frontier = [start];
  const CAP = 12;
  for (let step = 1; step <= CAP; step++) {
    const nxt = [];
    for (const st of frontier) {
      for (const d of dials) {
        const ns = applyDial(st, d, N);
        const k = key(ns);
        if (!seen.has(k)) { seen.set(k, step); nxt.push(ns); }
      }
    }
    // check any win in nxt
    for (const st of nxt) if (isWin(st)) return step;
    frontier = nxt;
    if (frontier.length === 0) break;
  }
  return -1; // unsolvable within cap
}

let allPass = true;
LEVELS.forEach((L, i) => {
  const minPresses = bfsMin(L.n, L.d, L.s);
  const opt = OPTIMAL[i];
  const solvable = minPresses > 0;
  const optMatch = minPresses === opt;
  const status = solvable && optMatch ? 'OK' : 'FAIL';
  if (!solvable || !optMatch) allPass = false;
  console.log(`L${(i+1).toString().padStart(2)} N=${L.n} K=${L.d.length} start=[${L.s}] engineMin=${minPresses} opt=${opt} ${status}`);
});
console.log('\n' + (allPass ? '✅ ALL 30 LEVELS SOLVABLE IN-ENGINE (Node BFS, exact game rules)' : '❌ SOME LEVELS FAILED IN-ENGINE'));
process.exit(allPass ? 0 : 1);
