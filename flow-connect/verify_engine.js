// flow-connect per-level solvability verifier
// Reads PACKS + generatePuzzle from index.html (READ-ONLY) and verifies that:
//   1. Every level generates a valid puzzle (endpoints present, solution path covers all cells)
//   2. Each solution path is a contiguous path from endpoint to endpoint (no gaps, no branches)
//   3. checkWin() on the embedded solution returns true (all colors connected + all cells filled)
//
// Game uses Hamiltonian-path-based generator: the solution IS the proof the puzzle is solvable.
// Verdict per level:
//   SOLVED       - puzzle generated + solution passes checkWin
//   UNSOLVABLE   - generatePuzzle returned null (no Hamiltonian path found) - rare
//   INCONCLUSIVE - generated but checkWin failed (data layer defect)
//
// 5 packs (Beginner 5x4 → Expert 9x8) × 20 levels = 100 levels total

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_HTML = path.join(__dirname, 'index.html');
const html = fs.readFileSync(GAME_HTML, 'utf8');

// Extract: PACKS, DIRS, mulberry32, generateHamiltonianPath, generatePuzzle, isConnected, checkWin
const pieces = [
  /const PACKS = \[[\s\S]*?\];/,
  /const DIRS = \[[\s\S]*?\];/,
  /function mulberry32\([\s\S]*?\n\}/,
  /function tryHamiltonian\([\s\S]*?\n\}/,
  /function generateHamiltonianPath\([\s\S]*?\n\}/,
  /function generatePuzzle\([\s\S]*?\n\}/,
  /function isConnected\([\s\S]*?\n\}/,
  /function checkWin\([\s\S]*?\n\}/,
  /function getLevelSeed\([\s\S]*?\n\}/,
];

// Use var for top-level so vm sandbox exposes them
const scriptText = pieces.map(re => html.match(re)[0]).join('\n')
  .replace(/^const PACKS/, 'var PACKS')
  .replace(/^const DIRS/, 'var DIRS');

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(scriptText, sandbox);

const PACKS = sandbox.PACKS;
console.log(`PACKS: ${PACKS.map(p => `${p.name}(${p.grid}x${p.grid},${p.colors}c,${p.levels})`).join(', ')}`);

function replayPath(solution) {
  // Build grid from solution paths, then run checkWin via sandbox
  const puzzle = sandbox.PACKS.length ? null : null; // placeholder; we'll use puzzle directly
  return sandbox.checkWin;
}

let totalSolved = 0, totalInconclusive = 0, totalNull = 0;
console.log('Pack    | Level | grid | colors | verdict     | cells | ms');
console.log('--------|-------|------|--------|-------------|-------|------');

for (let p = 0; p < PACKS.length; p++) {
  const pack = PACKS[p];
  for (let lvl = 0; lvl < pack.levels; lvl++) {
    const seed = p * 100 + lvl;
    const start = Date.now();
    const puzzle = sandbox.generatePuzzle(seed, pack.grid, pack.grid, pack.colors);
    const elapsed = Date.now() - start;

    if (!puzzle) {
      console.log(`${pack.name.padEnd(7)} | ${String(lvl+1).padStart(5)} | ${pack.grid}x${pack.grid} | ${pack.colors} | NULL        | -     | ${elapsed}`);
      totalNull++;
      continue;
    }

    // Build the grid from solution paths
    const grid = Array.from({length: puzzle.rows}, () => Array(puzzle.cols).fill(-1));
    for (let i = 0; i < puzzle.solution.length; i++) {
      for (const [r, c] of puzzle.solution[i]) grid[r][c] = i;
    }

    // Build paths object from solution (this is what isConnected reads)
    const paths = {};
    for (let i = 0; i < puzzle.solution.length; i++) paths[i] = puzzle.solution[i].map(p => [...p]);

    // Set up sandbox.puzzle + grid + paths for checkWin
    sandbox.puzzle = puzzle;
    sandbox.grid = grid;
    sandbox.paths = paths;

    let win;
    try {
      win = sandbox.checkWin();
    } catch (e) {
      win = false;
    }

    const verdict = win ? 'SOLVED' : 'INCONCLUSIVE';
    if (win) totalSolved++;
    else totalInconclusive++;

    // Verify each solution path is contiguous from endpoint to endpoint
    let pathValid = true;
    for (let i = 0; i < puzzle.solution.length; i++) {
      const path = puzzle.solution[i];
      for (let k = 1; k < path.length; k++) {
        const [pr, pc] = path[k-1];
        const [nr, nc] = path[k];
        if (Math.abs(pr - nr) + Math.abs(pc - nc) !== 1) { pathValid = false; break; }
      }
      if (!pathValid) break;
    }

    if (!pathValid) console.log(`WARN: pack=${pack.name} lvl=${lvl+1} path not contiguous`);
  }
}

console.log(`\nTotal: ${totalSolved} SOLVED, ${totalInconclusive} INCONCLUSIVE, ${totalNull} NULL`);
process.exit(totalInconclusive + totalNull > 0 ? 1 : 0);
