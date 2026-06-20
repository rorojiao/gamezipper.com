#!/usr/bin/env node
// Independent solver: verifies all 27 Jigsaw Sudoku levels have UNIQUE solutions.
// Uses a completely separate implementation from gen.js to catch bugs.

const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));
const levels = data.levels;

let pass = 0, fail = 0;

for (const lv of levels) {
  const N = lv.N;
  const regions = lv.regions; // flat array
  const puzzle = lv.p;
  const solution = lv.s;

  // Build region sets
  const regionCells = Array.from({length: N}, () => []);
  for (let i = 0; i < N * N; i++) {
    regionCells[regions[i]].push(i);
  }

  // Verify solution matches puzzle givens
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (puzzle[r][c] !== 0 && puzzle[r][c] !== solution[r][c]) {
        console.error(`L${lv.id}: GIVEN MISMATCH at [${r}][${c}]: puzzle=${puzzle[r][c]} solution=${solution[r][c]}`);
        fail++;
      }
    }
  }

  // Verify solution is valid
  const solFlat = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) solFlat.push(solution[r][c]);

  for (let r = 0; r < N; r++) {
    const row = new Set(), col = new Set();
    for (let c = 0; c < N; c++) {
      if (row.has(solution[r][c])) { console.error(`L${lv.id}: ROW ${r} has duplicate ${solution[r][c]}`); fail++; }
      row.add(solution[r][c]);
      if (col.has(solution[c][r])) { console.error(`L${lv.id}: COL ${r} has duplicate ${solution[c][r]}`); fail++; }
      col.add(solution[c][r]);
    }
  }
  for (let rid = 0; rid < N; rid++) {
    const seen = new Set();
    for (const idx of regionCells[rid]) {
      const r = Math.floor(idx / N), c = idx % N;
      if (seen.has(solution[r][c])) { console.error(`L${lv.id}: REGION ${rid} has duplicate ${solution[r][c]}`); fail++; }
      seen.add(solution[r][c]);
    }
  }

  // Count solutions (stop at 2)
  const grid = new Int8Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r * N + c] = puzzle[r][c];

  let solutionCount = 0;
  const limit = 2;

  function solve() {
    if (solutionCount >= limit) return;
    // Find MRV cell
    let bestIdx = -1, bestCands = null, bestCount = N + 1;
    for (let i = 0; i < N * N; i++) {
      if (grid[i] !== 0) continue;
      const r = Math.floor(i / N), c = i % N;
      const used = new Set();
      // row + col
      for (let j = 0; j < N; j++) {
        if (grid[r * N + j]) used.add(grid[r * N + j]);
        if (grid[j * N + c]) used.add(grid[j * N + c]);
      }
      // region
      for (const idx of regionCells[regions[i]]) {
        if (grid[idx]) used.add(grid[idx]);
      }
      const cands = [];
      for (let v = 1; v <= N; v++) if (!used.has(v)) cands.push(v);
      if (cands.length === 0) return;
      if (cands.length < bestCount) {
        bestCount = cands.length; bestIdx = i; bestCands = cands;
        if (cands.length === 1) break;
      }
    }
    if (bestIdx === -1) { solutionCount++; return; }
    for (const v of bestCands) {
      grid[bestIdx] = v;
      solve();
      grid[bestIdx] = 0;
      if (solutionCount >= limit) return;
    }
  }

  solve();

  const status = solutionCount === 1 ? 'UNIQUE' : `FAIL(${solutionCount})`;
  if (solutionCount === 1) {
    pass++;
    console.log(`  L${String(lv.id).padStart(2)} ${lv.tier.padEnd(10)} N=${N} clues=${lv.clues}  ${status}`);
  } else {
    fail++;
    console.error(`  L${String(lv.id).padStart(2)} ${lv.tier.padEnd(10)} N=${N} clues=${lv.clues}  ${status}`);
  }
}

console.log(`\n=== INDEPENDENT VERIFICATION ===`);
console.log(`Pass: ${pass}/${levels.length}  Fail: ${fail}`);
if (fail > 0) {
  console.error('VERIFICATION FAILED');
  process.exit(1);
} else {
  console.log('ALL LEVELS VERIFIED UNIQUE AND VALID');
}
