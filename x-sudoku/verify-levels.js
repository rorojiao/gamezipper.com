#!/usr/bin/env node
/**
 * Independent verifier for x-sudoku/levels.json.
 * Re-solves each puzzle from scratch using a different algorithm (constraint propagation +
 * DPLL-style search) and confirms:
 *   1. Puzzle has EXACTLY ONE solution (count up to 2).
 *   2. Solution matches the one stored in levels.json.
 *   3. Stored solution satisfies ALL constraints (rows, cols, boxes, both diagonals).
 *   4. Puzzle's given clues all match the stored solution.
 * Exit non-zero on any failure.
 */
const fs = require('fs');
const path = require('path');

const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
let failures = 0;
let checked = 0;

function candidatesAt(grid, r, c, n, boxR, boxC) {
  if (grid[r][c] !== 0) return new Set([grid[r][c]]);
  const used = new Set();
  for (let i = 0; i < n; i++) {
    used.add(grid[r][i]);
    used.add(grid[i][c]);
  }
  const br = Math.floor(r / boxR) * boxR, bc = Math.floor(c / boxC) * boxC;
  for (let i = 0; i < boxR; i++)
    for (let j = 0; j < boxC; j++)
      used.add(grid[br + i][bc + j]);
  if (r === c) for (let i = 0; i < n; i++) used.add(grid[i][i]);
  if (r + c === n - 1) for (let i = 0; i < n; i++) used.add(grid[i][n - 1 - i]);
  const out = new Set();
  for (let v = 1; v <= n; v++) if (!used.has(v)) out.add(v);
  return out;
}

function cloneGrid(g) { return g.map(row => row.slice()); }

function findMRV(grid, n, boxR, boxC) {
  let best = null, bestSize = n + 2, bestCands = null;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 0) continue;
      const cands = candidatesAt(grid, r, c, n, boxR, boxC);
      if (cands.size < bestSize) {
        bestSize = cands.size;
        best = [r, c];
        bestCands = cands;
        if (bestSize === 0) return { cell: best, cands: bestCands };
      }
    }
  }
  return best ? { cell: best, cands: bestCands } : null;
}

function countSolutions(grid, n, boxR, boxC, limit) {
  let count = 0;
  function bt() {
    if (count >= limit) return;
    const mrv = findMRV(grid, n, boxR, boxC);
    if (!mrv) { count++; return; }
    if (mrv.cands.size === 0) return;
    const [r, c] = mrv.cell;
    for (const v of mrv.cands) {
      grid[r][c] = v;
      bt();
      grid[r][c] = 0;
      if (count >= limit) return;
    }
  }
  bt();
  return count;
}

function isValidSolution(sol, n, boxR, boxC) {
  for (let r = 0; r < n; r++) {
    const row = new Set(), col = new Set();
    for (let c = 0; c < n; c++) {
      if (sol[r][c] < 1 || sol[r][c] > n) return false;
      row.add(sol[r][c]);
      col.add(sol[c][r]);
    }
    if (row.size !== n || col.size !== n) return false;
  }
  for (let br = 0; br < n; br += boxR) {
    for (let bc = 0; bc < n; bc += boxC) {
      const s = new Set();
      for (let i = 0; i < boxR; i++)
        for (let j = 0; j < boxC; j++) s.add(sol[br + i][bc + j]);
      if (s.size !== n) return false;
    }
  }
  const d1 = new Set(), d2 = new Set();
  for (let i = 0; i < n; i++) {
    d1.add(sol[i][i]);
    d2.add(sol[i][n - 1 - i]);
  }
  return d1.size === n && d2.size === n;
}

for (const L of levels) {
  const n = L.n, boxR = L.box_r, boxC = L.box_c;
  const issues = [];
  // 1. Stored solution valid?
  if (!isValidSolution(L.solution, n, boxR, boxC))
    issues.push('stored solution invalid (rows/cols/boxes/diagonals)');
  // 2. Puzzle clues match solution?
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (L.puzzle[r][c] !== 0 && L.puzzle[r][c] !== L.solution[r][c])
        issues.push(`clue mismatch at (${r},${c})`);
  // 3. Uniqueness
  const cnt = countSolutions(cloneGrid(L.puzzle), n, boxR, boxC, 2);
  if (cnt !== 1) issues.push(`non-unique: ${cnt} solutions (expected 1)`);
  // 4. Counts clues
  let clues = 0;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (L.puzzle[r][c] !== 0) clues++;
  if (clues !== L.clues) issues.push(`clue count ${clues} != stored ${L.clues}`);

  if (issues.length) {
    console.log(`❌ L${L.id} ${L.tier}: ${issues.join('; ')}`);
    failures++;
  } else {
    console.log(`✅ L${L.id} ${L.tier} n=${n} clues=${clues} — unique, solution valid`);
    checked++;
  }
}

console.log(`\n${checked}/${levels.length} verified OK, ${failures} failures`);
process.exit(failures ? 1 : 0);
