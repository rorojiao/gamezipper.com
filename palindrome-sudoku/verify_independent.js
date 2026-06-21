#!/usr/bin/env node
'use strict';
// ============================================================================
// INDEPENDENT verifier for Palindrome Sudoku levels.
// ----------------------------------------------------------------------------
// This file shares NO solving code with gen.js. It re-implements the rules from
// scratch and brute-checks every level in levels.json:
//   * The supplied `solution` is a valid completed grid (Sudoku + palindrome).
//   * Every given digit matches the solution.
//   * The puzzle has EXACTLY ONE solution under Sudoku + palindrome rules
//     (a from-scratch backtracking solver with naked-singles propagation,
//     counting solutions and stopping at 2).
//
// Usage:  node verify_independent.js [levels.json]
// Exit code 0 if every level is UNIQUE+VALID, 1 otherwise.
// ============================================================================

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = process.argv[2] || path.join(__dirname, 'levels.json');
const raw = fs.readFileSync(LEVELS_PATH, 'utf8');
const data = JSON.parse(raw);

// ---- box geometry ----
function boxDims(N){ return N === 6 ? [2,3] : N === 4 ? [2,2] : [3,3]; }
function boxOf(r, c, N){ const [br, bc] = boxDims(N); return Math.floor(r / br) * (N / bc) + Math.floor(c / bc); }

// ---- independent constraint model ----
// Equality pairs derived from palindromes: cellA must equal cellB.
function buildEquality(N, palindromes){
  // union-find
  const parent = new Array(N * N);
  for (let i = 0; i < N * N; i++) parent[i] = i;
  const find = x => { while (parent[x] !== x){ parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; };
  for (const path_ of palindromes){
    const L = path_.length;
    for (let i = 0; i < Math.floor(L / 2); i++){
      const A = path_[i], B = path_[L - 1 - i];
      union(A[0] * N + A[1], B[0] * N + B[1]);
    }
  }
  // map each cell -> list of equal cells (its class)
  const groups = new Map();
  for (let i = 0; i < N * N; i++){ const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); }
  const eqClass = new Array(N * N);
  for (const [, mem] of groups){ for (const m of mem) eqClass[m] = mem; }
  return { eqClass };
}

// Validate a FULL grid: sudoku peers + palindrome reading.
function validFull(grid, N, palindromes){
  // rows / cols / boxes
  for (let r = 0; r < N; r++){
    const seen = new Set();
    for (let c = 0; c < N; c++){ const v = grid[r][c]; if (v < 1 || v > N || seen.has(v)) return false; seen.add(v); }
  }
  for (let c = 0; c < N; c++){
    const seen = new Set();
    for (let r = 0; r < N; r++){ const v = grid[r][c]; if (seen.has(v)) return false; seen.add(v); }
  }
  const [br, bc] = boxDims(N);
  for (let br0 = 0; br0 < N; br0 += br) for (let bc0 = 0; bc0 < N; bc0 += bc){
    const seen = new Set();
    for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++){ const v = grid[br0 + i][bc0 + j]; if (seen.has(v)) return false; seen.add(v); }
  }
  // palindrome regions
  for (const p of palindromes){
    const L = p.length;
    for (let i = 0; i < Math.floor(L / 2); i++){
      const a = p[i], b = p[L - 1 - i];
      if (grid[a[0]][a[1]] !== grid[b[0]][b[1]]) return false;
    }
  }
  return true;
}

// From-scratch solver. Counts solutions up to `limit`. Enforces Sudoku + equality.
// Uses naked-single propagation + MRV backtracking. NOT shared with gen.js logic
// (gen.js uses typed-array masks + leader-based branching; this uses sets/maps).
function countSolutions(N, givens, palindromes, limit){
  const { eqClass } = buildEquality(N, palindromes);

  const cell = new Array(N * N).fill(0); // 0 = empty
  const rowUsed = Array.from({ length: N }, () => new Set());
  const colUsed = Array.from({ length: N }, () => new Set());
  const boxUsed = Array.from({ length: N }, () => new Set());

  const place = (idx, v) => { cell[idx] = v; const r = idx / N | 0, c = idx % N; rowUsed[r].add(v); colUsed[c].add(v); boxUsed[boxOf(r, c, N)].add(v); };
  const unplace = (idx, v) => { cell[idx] = 0; const r = idx / N | 0, c = idx % N; rowUsed[r].delete(v); colUsed[c].delete(v); boxUsed[boxOf(r, c, N)].delete(v); };
  const allowed = (idx, v) => { const r = idx / N | 0, c = idx % N; return !rowUsed[r].has(v) && !colUsed[c].has(v) && !boxUsed[boxOf(r, c, N)].has(v); };

  // install givens, propagating equality classes. If a given pins a class, the
  // whole class adopts that value; contradictions => 0 solutions.
  for (let i = 0; i < N * N; i++){
    if (cell[i] !== 0) continue;
    // find if any classmate has a given
    let forced = 0;
    for (const g of givens){ const gi = g[0] * N + g[1]; if (eqClass[gi] === eqClass[i] && g[2]) { if (forced && forced !== g[2]) return 0; forced = g[2]; } }
    // is THIS cell a given?
    for (const g of givens){ if (g[0] * N + g[1] === i){ if (forced && forced !== g[2]) return 0; forced = g[2]; } }
    if (forced){ if (!allowed(i, forced)) return 0; for (const m of eqClass[i]){ if (cell[m] !== 0) continue; if (!allowed(m, forced)) return 0; place(m, forced); } }
  }

  let count = 0;
  function recurse(){
    if (count >= limit) return;
    // find empty cell with fewest candidates (MRV). Equality: placing a value in
    // a cell forces its whole class, so feasibility must hold for every classmate.
    let best = -1, bestVals = null;
    for (let i = 0; i < N * N; i++){
      if (cell[i] !== 0) continue;
      const vals = [];
      for (let v = 1; v <= N; v++){
        if (!allowed(i, v)) continue;
        let ok = true;
        for (const m of eqClass[i]){ if (m === i) continue; if (!allowed(m, v)){ ok = false; break; } }
        if (ok) vals.push(v);
      }
      if (vals.length === 0) return; // dead end
      if (bestVals === null || vals.length < bestVals.length){ bestVals = vals; best = i; if (vals.length === 1) break; }
    }
    if (best === -1){ count++; return; } // complete
    for (const v of bestVals){
      // place whole class
      const placed = [];
      let ok = true;
      for (const m of eqClass[best]){ if (cell[m] === 0){ if (!allowed(m, v)){ ok = false; break; } place(m, v); placed.push(m); } }
      if (ok) recurse();
      for (const m of placed) unplace(m, v);
      if (count >= limit) return;
    }
  }
  recurse();
  return count;
}

// ---- run verification ----
let allGood = true;
const rows = [];
for (const lv of data.levels){
  const N = lv.size;
  const sol = lv.solution;
  // 1) solution validity
  let solOk = Array.isArray(sol) && sol.length === N && validFull(sol, N, lv.palindromes);
  // 2) givens match solution
  let givensOk = true;
  for (const g of lv.givens){ if (!sol || sol[g[0]][g[1]] !== g[2]){ givensOk = false; break; } }
  // 3) palindrome geometry sanity: mirror pairs in distinct row/col/box
  let geoOk = true;
  for (const p of lv.palindromes){
    const L = p.length;
    for (let i = 0; i < Math.floor(L / 2); i++){
      const a = p[i], b = p[L - 1 - i];
      if (a[0] === b[0] || a[1] === b[1] || boxOf(a[0], a[1], N) === boxOf(b[0], b[1], N)){ geoOk = false; }
    }
  }
  // 4) uniqueness (independent solver)
  const cnt = countSolutions(N, lv.givens, lv.palindromes, 2);
  const status = cnt === 1 ? 'UNIQUE' : cnt === 0 ? 'INVALID(0sol)' : 'NOT_UNIQUE(' + cnt + ')';
  const pass = solOk && givensOk && geoOk && cnt === 1;
  if (!pass) allGood = false;
  rows.push({
    id: lv.id, tier: lv.tier, size: N, clues: lv.givens.length,
    solOk, givensOk, geoOk, solutions: cnt, status, pass
  });
}

// ---- report ----
console.log('=== PALINDROME SUDOKU — INDEPENDENT VERIFICATION ===');
console.log('Source: ' + LEVELS_PATH);
console.log('');
console.log('#   tier        N  clues  sol    givens  geo    sols  status         pass');
console.log('--- ----------  -  -----  -----  ------  -----  ----  -------------  ----');
for (const r of rows){
  console.log(
    String(r.id).padStart(2) + '  ' +
    r.tier.padEnd(10) + '  ' +
    r.size + '  ' +
    String(r.clues).padStart(5) + '  ' +
    (r.solOk ? 'ok' : 'BAD').padEnd(5) + '  ' +
    (r.givensOk ? 'ok' : 'BAD').padEnd(6) + '  ' +
    (r.geoOk ? 'ok' : 'BAD').padEnd(5) + '  ' +
    String(r.solutions).padStart(4) + '  ' +
    r.status.padEnd(13) + '  ' +
    (r.pass ? 'PASS' : 'FAIL')
  );
}
console.log('');
const passed = rows.filter(r => r.pass).length;
console.log('Passed ' + passed + '/' + rows.length + ' levels.');
console.log(allGood ? 'RESULT: ALL LEVELS UNIQUE & VALID ✓' : 'RESULT: FAILURES DETECTED ✗');
process.exit(allGood ? 0 : 1);
