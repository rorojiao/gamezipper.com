#!/usr/bin/env node
// INDEPENDENT verifier for outside-sudoku levels.
// Separate solver implementation (plain first-empty-cell DFS, NOT MRV) to
// cross-check uniqueness + validity — different from gen.js's MRV backtracking.
//
// Verifies:
//   1. The stored SOLUTION satisfies all Sudoku + outside-clue constraints.
//   2. The PUZZLE (givens + outside clues) has EXACTLY ONE solution.
//   3. That unique solution matches the stored solution.

const fs = require('fs');
const path = require('path');

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// Plain DFS solver — first empty cell, tries 1..N in order
function solveCount(grid, N, outside, limit) {
  const [br, bc] = boxSize(N);
  const g = new Array(N * N);
  for (let i = 0; i < N * N; i++) g[i] = grid[i] || 0;

  // Build outside clue masks
  function makeMask(arr) { let m = 0; for (const d of arr) m |= (1 << d); return m; }
  const Lmask = outside.L.map(makeMask);
  const Rmask = outside.R.map(makeMask);
  const Tmask = outside.T.map(makeMask);
  const Bmask = outside.B.map(makeMask);
  const allBits = (1 << (N + 1)) - 2;

  function valid(r, c, v) {
    // Row check
    for (let i = 0; i < N; i++) if (i !== c && g[r * N + i] === v) return false;
    // Col check
    for (let i = 0; i < N; i++) if (i !== r && g[i * N + c] === v) return false;
    // Box check
    const br0 = Math.floor(r / br) * br, bc0 = Math.floor(c / bc) * bc;
    for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) {
      const rr = br0 + i, cc = bc0 + j;
      if ((rr !== r || cc !== c) && g[rr * N + cc] === v) return false;
    }
    // Outside zone check
    if (c < bc && !(Lmask[r] & (1 << v))) return false;
    if (c >= N - bc && !(Rmask[r] & (1 << v))) return false;
    if (r < br && !(Tmask[c] & (1 << v))) return false;
    if (r >= N - br && !(Bmask[c] & (1 << v))) return false;
    return true;
  }

  let count = 0;
  let solution = null;

  function dfs() {
    if (count >= limit) return;
    // Find first empty cell
    let idx = -1;
    for (let i = 0; i < N * N; i++) { if (g[i] === 0) { idx = i; break; } }
    if (idx === -1) { count++; if (count === 1) solution = [...g]; return; }
    const r = Math.floor(idx / N), c = idx % N;
    for (let v = 1; v <= N; v++) {
      if (valid(r, c, v)) {
        g[idx] = v;
        dfs();
        g[idx] = 0;
        if (count >= limit) return;
      }
    }
  }
  dfs();
  return { count, solution };
}

function verifySolution(grid, N, outside) {
  const [br, bc] = boxSize(N);
  // Check rows
  for (let r = 0; r < N; r++) {
    const seen = new Set();
    for (let c = 0; c < N; c++) { const v = grid[r * N + c]; if (v < 1 || v > N || seen.has(v)) return false; seen.add(v); }
  }
  // Check cols
  for (let c = 0; c < N; c++) {
    const seen = new Set();
    for (let r = 0; r < N; r++) { const v = grid[r * N + c]; if (seen.has(v)) return false; seen.add(v); }
  }
  // Check boxes
  for (let br0 = 0; br0 < N; br0 += br) {
    for (let bc0 = 0; bc0 < N; bc0 += bc) {
      const seen = new Set();
      for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) { const v = grid[(br0 + i) * N + (bc0 + j)]; if (seen.has(v)) return false; seen.add(v); }
    }
  }
  // Check outside clues
  for (let r = 0; r < N; r++) {
    const left = new Set(); for (let c = 0; c < bc; c++) left.add(grid[r * N + c]);
    const lexpected = new Set(outside.L[r]);
    if (left.size !== lexpected.size || ![...left].every(d => lexpected.has(d))) return false;
    const right = new Set(); for (let c = N - bc; c < N; c++) right.add(grid[r * N + c]);
    const rexpected = new Set(outside.R[r]);
    if (right.size !== rexpected.size || ![...right].every(d => rexpected.has(d))) return false;
  }
  for (let c = 0; c < N; c++) {
    const top = new Set(); for (let r = 0; r < br; r++) top.add(grid[r * N + c]);
    const texpected = new Set(outside.T[c]);
    if (top.size !== texpected.size || ![...top].every(d => texpected.has(d))) return false;
    const bottom = new Set(); for (let r = N - br; r < N; r++) bottom.add(grid[r * N + c]);
    const bexpected = new Set(outside.B[c]);
    if (bottom.size !== bexpected.size || ![...bottom].every(d => bexpected.has(d))) return false;
  }
  return true;
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
  let allOK = true;
  console.log('=== OUTSIDE SUDOKU — INDEPENDENT VERIFICATION ===');
  console.log(`Total levels: ${data.levels.length}\n`);
  for (const lv of data.levels) {
    const N = lv.N;
    const flat = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) flat.push(lv.p[r][c]);
    const flatSol = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) flatSol.push(lv.s[r][c]);

    // 1. Verify solution
    const solOK = verifySolution(flatSol, N, lv.out);

    // 2. Verify uniqueness
    const { count, solution } = solveCount(flat, N, lv.out, 2);
    const uniq = count === 1;

    // 3. Verify solution matches
    let match = false;
    if (solution) {
      match = solution.every((v, i) => v === flatSol[i]);
    }

    const ok = solOK && uniq && match;
    if (!ok) allOK = false;
    console.log(`  #${String(lv.id).padStart(2)} ${lv.tier.padEnd(10)} N=${N}  sol=${solOK ? 'OK' : 'BAD'}  unique=${uniq ? 'YES' : 'NO(' + count + ')'}  match=${match ? 'YES' : 'NO'}  ${ok ? '✓' : '✗ FAIL'}`);
  }
  console.log(`\nAll ${data.levels.length} levels verified: ${allOK ? 'ALL OK ✓' : 'FAILURES DETECTED ✗'}`);
  process.exit(allOK ? 0 : 1);
}
main();
