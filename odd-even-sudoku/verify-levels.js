#!/usr/bin/env node
/**
 * Independent verifier for odd-even-sudoku/levels.json.
 * Re-solves each puzzle from scratch using constraint propagation + DPLL-style
 * search, applying BOTH standard Sudoku rules AND per-cell parity markers.
 * Confirms:
 *   1. Puzzle has EXACTLY ONE solution (count up to 2).
 *   2. Solution matches the one stored in levels.json.
 *   3. Stored solution satisfies ALL constraints (rows, cols, boxes, parity).
 *   4. Puzzle's given clues all match the stored solution.
 *   5. Parity markers in the stored solution are consistent (odd cell -> odd digit).
 * Exit non-zero on any failure.
 */
const fs = require('fs');
const path = require('path');

const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
let failures = 0;
let checked = 0;

const isOdd = (v) => v % 2 === 1;

function candidatesAt(grid, r, c, n, boxR, boxC, parity) {
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
  const out = new Set();
  for (let v = 1; v <= n; v++) {
    if (used.has(v)) continue;
    // parity marker
    const p = parity[r][c];
    if (p === 1 && !isOdd(v)) continue;
    if (p === 2 && isOdd(v)) continue;
    out.add(v);
  }
  return out;
}

function cloneGrid(g) { return g.map(row => row.slice()); }

function findMRV(grid, n, boxR, boxC, parity) {
  let best = null, bestSize = n + 2, bestCands = null;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 0) continue;
      const cands = candidatesAt(grid, r, c, n, boxR, boxC, parity);
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

function countSolutions(grid, n, boxR, boxC, parity, limit) {
  let count = 0;
  function bt() {
    if (count >= limit) return;
    const mrv = findMRV(grid, n, boxR, boxC, parity);
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

function isValidSolution(sol, n, boxR, boxC, parity) {
  // rows / cols
  for (let r = 0; r < n; r++) {
    const row = new Set(), col = new Set();
    for (let c = 0; c < n; c++) {
      if (sol[r][c] < 1 || sol[r][c] > n) return false;
      row.add(sol[r][c]);
      col.add(sol[c][r]);
    }
    if (row.size !== n || col.size !== n) return false;
  }
  // boxes
  for (let br = 0; br < n; br += boxR) {
    for (let bc = 0; bc < n; bc += boxC) {
      const s = new Set();
      for (let i = 0; i < boxR; i++)
        for (let j = 0; j < boxC; j++) s.add(sol[br + i][bc + j]);
      if (s.size !== n) return false;
    }
  }
  // parity markers
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = parity[r][c];
      if (p === 1 && !isOdd(sol[r][c])) return false;
      if (p === 2 && isOdd(sol[r][c])) return false;
    }
  }
  return true;
}

for (const L of levels) {
  const n = L.n, boxR = L.box_r, boxC = L.box_c;
  const parity = L.parity;
  const issues = [];
  if (!isValidSolution(L.solution, n, boxR, boxC, parity))
    issues.push('stored solution invalid (rows/cols/boxes/parity)');
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (L.puzzle[r][c] !== 0 && L.puzzle[r][c] !== L.solution[r][c])
        issues.push(`clue mismatch at (${r},${c})`);
  const cnt = countSolutions(cloneGrid(L.puzzle), n, boxR, boxC, parity, 2);
  if (cnt !== 1) issues.push(`non-unique: ${cnt} solutions (expected 1)`);
  let clues = 0;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (L.puzzle[r][c] !== 0) clues++;
  if (clues !== L.clues) issues.push(`clue count ${clues} != stored ${L.clues}`);
  let markers = 0;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (parity[r][c] !== 0) markers++;
  if (markers !== L.markers) issues.push(`marker count ${markers} != stored ${L.markers}`);

  if (issues.length) {
    console.log(`❌ L${L.id} ${L.tier}: ${issues.join('; ')}`);
    failures++;
  } else {
    console.log(`✅ L${L.id} ${L.tier} n=${n} clues=${clues} markers=${markers} — unique, solution valid`);
    checked++;
  }
}

console.log(`\n${checked}/${levels.length} verified OK, ${failures} failures`);
process.exit(failures ? 1 : 0);
