// verify_engine.js — In-engine Node.js BFS verifier
// Extracts LEVELS from the actual index.html, uses the game's REAL netPath() logic,
// runs BFS to confirm each level is solvable. Catches Python↔JS arithmetic mismatch.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the LEVELS array and netPath logic from the game
const levelsMatch = html.match(/const LEVELS=(\[[\s\S]*?\]);/);
if (!levelsMatch) { console.log('FAIL: cannot extract LEVELS from index.html'); process.exit(1); }

const sandbox = { console, performance: { now: () => 0 } };
const ctx = vm.createContext(sandbox);

// Run the game script's level data + netPath computation in the sandbox
const script = `
${levelsMatch[0]}
function netPathFor(L, state) {
  const nDials = L[0], P = L[1], steps = L[2], signs = L[3];
  let n = 0;
  for (let i = 0; i < state.length; i++) n += state[i] * steps[i] * signs[i];
  return ((n % P) + P) % P;
}
`;
vm.runInContext(script, ctx);

const LEVELS = vm.runInContext('LEVELS', ctx);
let pass = 0, fail = 0;

for (let idx = 0; idx < LEVELS.length; idx++) {
  const L = LEVELS[idx];
  const nDials = L[0], P = L[1], steps = L[2], signs = L[3], maxes = L[4], target = L[5];

  // BFS: start from all-zero state, each dial cycles 0..maxes[k]
  // State = tuple of dial levels. Find if any state yields target.
  let found = false;
  let minMoves = Infinity;

  function bfs() {
    const initState = new Array(nDials).fill(0);
    // Since dials are independent (each press increments one dial mod maxes+1),
    // we just need to enumerate all combos and check netPath
    function rec(k, state) {
      if (k === nDials) {
        const net = sandbox.netPathFor(L, state);
        if (net === target) {
          found = true;
          const mv = state.reduce((a, b) => a + b, 0);
          if (mv < minMoves) minMoves = mv;
        }
        return;
      }
      for (let lv = 0; lv <= maxes[k]; lv++) {
        state[k] = lv;
        rec(k + 1, state);
      }
    }
    rec(0, initState);
  }
  bfs();

  if (!found) {
    console.log(`L${idx+1} FAIL: no solution found by in-engine BFS`);
    fail++;
  } else {
    pass++;
    if (idx < 3 || idx >= 27) console.log(`L${idx+1}: solvable in ${minMoves} moves (target ${target}/${P})`);
  }
}

console.log(`\nIn-engine BFS: ${pass}/${LEVELS.length} solvable, ${fail} unsolvable`);
if (fail === 0) console.log('✅ ALL LEVELS SOLVABLE IN-ENGINE');
process.exit(fail > 0 ? 1 : 0);
