// verify_engine.js — In-engine verification for Kuroshuto
// Loads index.html, extracts LEVELS via vm.runInContext, runs checkWin-equivalent
// logic on the stored solution for each level.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the script block that defines LEVELS
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
let levelsCode = '';
for (const block of scriptMatch || []) {
  if (block.includes('const LEVELS')) {
    // Extract just the LEVELS definition
    const m = block.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
    if (m) levelsCode = `var LEVELS = ${m[1]};`;
    break;
  }
}

if (!levelsCode) {
  console.error('❌ Could not extract LEVELS from index.html');
  process.exit(1);
}

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(levelsCode, sandbox);
const LEVELS = sandbox.LEVELS;

console.log(`Loaded ${LEVELS.length} levels from engine\n`);

function neighbors4(r, c, R, C) {
  const res = [];
  if (r > 0) res.push([r-1, c]);
  if (r < R-1) res.push([r+1, c]);
  if (c > 0) res.push([r, c-1]);
  if (c < C-1) res.push([r, c+1]);
  return res;
}

function cellsAtDistance(r, c, d, R, C) {
  const res = [];
  if (r-d >= 0) res.push([r-d, c]);
  if (r+d < R) res.push([r+d, c]);
  if (c-d >= 0) res.push([r, c-d]);
  if (c+d < C) res.push([r, c+d]);
  return res;
}

// checkWin equivalent — mimics the doCheck() function from index.html
function checkWin(level, testGrid) {
  const { R, C, clues } = level;

  // Check clue cells not black
  for (const k of Object.keys(clues)) {
    const [r, c] = k.split(',').map(Number);
    if (testGrid[r][c] === 1) return false;
  }

  // Check no adjacent blacks
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (testGrid[r][c] === 1) {
        for (const [nr, nc] of neighbors4(r, c, R, C)) {
          if (testGrid[nr][nc] === 1) return false;
        }
      }
    }
  }

  // Check all clues: exactly 1 black at distance d
  for (const [k, d] of Object.entries(clues)) {
    const [r, c] = k.split(',').map(Number);
    const cands = cellsAtDistance(r, c, d, R, C);
    const blackCount = cands.filter(([br, bc]) => testGrid[br][bc] === 1).length;
    if (blackCount !== 1) return false;
  }

  // Check connectivity of white cells
  const whiteCells = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (testGrid[r][c] !== 1) whiteCells.push([r, c]);
  if (whiteCells.length === 0) return false;

  const visited = new Set([whiteCells[0].join(',')]);
  const q = [whiteCells[0]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r+dr, nc = c+dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && testGrid[nr][nc] !== 1) {
        const key = nr+','+nc;
        if (!visited.has(key)) { visited.add(key); q.push([nr, nc]); }
      }
    }
  }
  if (visited.size !== whiteCells.length) return false;

  return true; // WIN
}

// Run verification
let allPass = true;
for (let i = 0; i < LEVELS.length; i++) {
  const lvl = LEVELS[i];
  const { R, C, clues, solution } = lvl;

  // Build test grid from stored solution
  const testGrid = Array(R).fill(0).map(() => Array(C).fill(0));
  for (const s of solution) {
    const [r, c] = s.split(',').map(Number);
    testGrid[r][c] = 1;
  }

  const win = checkWin(lvl, testGrid);
  if (win) {
    console.log(`✅ L${lvl.level_num} (${R}x${C}, ${Object.keys(clues).length} clues): checkWin PASSES`);
  } else {
    console.log(`❌ L${lvl.level_num} (${R}x${C}): checkWin FAILS`);
    allPass = false;
  }
}

console.log(`\n${allPass ? '✅ All 30 levels pass in-engine checkWin' : '❌ Some levels FAILED'}`);
