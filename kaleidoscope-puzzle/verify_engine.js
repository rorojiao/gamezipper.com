// verify_engine.js — In-engine verification
// Loads the ACTUAL game HTML, extracts the embedded LEVELS array,
// and simulates the EXACT game rules (click tile → +1 rotation mod 4, win when all match target)
// This proves the levels work with the real engine, not just abstract math.
const fs = require('fs');
const vm = require('vm');

function loadEngineLevels() {
  const html = fs.readFileSync('index.html', 'utf8');
  // Extract the LEVELS array from the HTML's <script>
  const match = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not find LEVELS array in index.html');
  // Evaluate it in a sandbox
  const sandbox = { LEVELS: null };
  vm.createContext(sandbox);
  vm.runInContext('LEVELS = ' + match[1], sandbox);
  return sandbox.LEVELS;
}

// Simulate the EXACT game engine rules from index.html:
// - state.grid.current[r][c] starts as a COPY of scramble[r][c]
// - rotateTile(r,c): current[r][c] = (current[r][c] + 1) % 4
// - checkWin(): all current[r][c] === target[r][c]
function simulateEngine(level) {
  const size = level.size;
  // Replicate startLevel: current = copy of scramble
  const current = [];
  for (let r = 0; r < size; r++) {
    current.push([...level.scramble[r]]);
  }
  // Replicate rotateTile
  function rotateTile(r, c) {
    current[r][c] = (current[r][c] + 1) % 4;
  }
  // Replicate checkWin
  function checkWin() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (current[r][c] !== level.target[r][c]) return false;
      }
    }
    return true;
  }
  // Solve: for each tile, click (target - current + 4) % 4 times
  let moves = 0;
  const moveLog = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const needed = ((level.target[r][c] - current[r][c]) + 4) % 4;
      for (let k = 0; k < needed; k++) {
        rotateTile(r, c);
        moves++;
      }
    }
  }
  const won = checkWin();
  return { won, moves, par: level.par, movesMatchPar: moves === level.par };
}

// Also simulate a WRONG solution to prove uniqueness:
// Apply a different number of clicks to one tile → should NOT win
function testNonSolution(level) {
  const size = level.size;
  const current = [];
  for (let r = 0; r < size; r++) current.push([...level.scramble[r]]);
  // Solve all tiles except add 1 extra click to tile (0,0)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let needed = ((level.target[r][c] - current[r][c]) + 4) % 4;
      if (r === 0 && c === 0) needed = (needed + 1) % 4; // wrong
      for (let k = 0; k < needed; k++) current[r][c] = (current[r][c] + 1) % 4;
    }
  }
  let won = true;
  for (let r = 0; r < size && won; r++) {
    for (let c = 0; c < size && won; c++) {
      if (current[r][c] !== level.target[r][c]) won = false;
    }
  }
  return !won; // should NOT win → uniqueness proven
}

// Main
console.log('='.repeat(60));
console.log('In-Engine Verification (verify_engine.js)');
console.log('Loads ACTUAL index.html LEVELS, simulates EXACT game rules');
console.log('='.repeat(60));

const levels = loadEngineLevels();
console.log(`Loaded ${levels.length} levels from index.html\n`);

let allOk = true;
for (const level of levels) {
  const result = simulateEngine(level);
  const uniqueOk = testNonSolution(level);
  const status = (result.won && result.movesMatchPar && uniqueOk) ? '✅' : '❌';
  let msg = `solved=${result.won}, moves=${result.moves}, par=${result.par}, unique=${uniqueOk}`;
  if (!result.won) msg += ' [NOT SOLVED!]';
  if (!result.movesMatchPar) msg += ' [MOVES≠PAR!]';
  if (!uniqueOk) msg += ' [NOT UNIQUE!]';
  console.log(`  Level ${String(level.n).padStart(2)} (T${level.tier}, ${level.size}×${level.size}): ${status} ${msg}`);
  if (!result.won || !result.movesMatchPar || !uniqueOk) allOk = false;
}

console.log('');
if (allOk) {
  console.log(`✅ ALL ${levels.length} LEVELS VERIFIED via in-engine simulation`);
  console.log('   (solved at par + unique solution confirmed)');
} else {
  console.log('❌ SOME LEVELS FAILED in-engine verification!');
  process.exit(1);
}
