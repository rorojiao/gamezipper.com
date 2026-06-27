#!/usr/bin/env node
// Futoshiki level verification — validates solution correctness, givens consistency,
// constraint satisfaction, Latin-square validity, and uniqueness for all 30 levels.
const fs = require('fs');

// Re-use the solver from gen.js
const gen = fs.readFileSync(__dirname + '/gen.js', 'utf8');
// Extract solver functions by eval in a sandbox-like scope
const solverSrc = gen.split('// ---- Tier config ----')[0]; // everything before tier config = helpers + solver
const sandbox = {};
eval(solverSrc); // defines mulberry32, shuffle, randomLatin, buildConstraints, countSolutions, isUnique in this scope
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

let allOk = true;
const report = [];
for (const L of data.levels) {
  const N = L.N;
  const sol = L.solution;
  const givens = L.givens;
  const cons = L.constraints;
  const errs = [];

  // 1. Latin square: each row & col has 1..N exactly once
  for (let r = 0; r < N; r++) {
    const seen = new Set(sol[r]);
    if (seen.size !== N || [...seen].some(v => v < 1 || v > N)) errs.push('row ' + r + ' not a permutation of 1..N');
  }
  for (let c = 0; c < N; c++) {
    const col = sol.map(row => row[c]);
    const seen = new Set(col);
    if (seen.size !== N || [...seen].some(v => v < 1 || v > N)) errs.push('col ' + c + ' not a permutation of 1..N');
  }

  // 2. Givens match solution
  for (const g of givens) {
    if (sol[g[0]][g[1]] !== g[2]) errs.push('given [' + g[0] + ',' + g[1] + ']=' + g[2] + ' != sol ' + sol[g[0]][g[1]]);
  }

  // 3. Constraints satisfied by solution
  for (const cn of cons) {
    const va = sol[cn[0]][cn[1]], vb = sol[cn[2]][cn[3]], op = cn[4];
    const ok = op === '<' ? (va < vb) : (va > vb);
    if (!ok) errs.push('constraint [' + cn[0] + ',' + cn[1] + ']' + op + '[' + cn[2] + ',' + cn[3] + '] violated: ' + va + op + vb);
  }

  // 4. Adjacency sanity: each constraint must be between orthogonally adjacent cells
  for (const cn of cons) {
    const dr = Math.abs(cn[0] - cn[2]), dc = Math.abs(cn[1] - cn[3]);
    if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) errs.push('non-adjacent constraint ' + cn);
  }

  // 5. Uniqueness (re-verify via solver)
  const givenObjs = givens.map(g => ({ r: g[0], c: g[1], v: g[2] }));
  const consObjs = cons.map(c => ({ a: [c[0], c[1]], b: [c[2], c[3]], op: c[4] }));
  const nSol = countSolutions(N, givenObjs, consObjs, 2);
  if (nSol !== 1) errs.push('NOT UNIQUE: ' + nSol + ' solutions');

  const status = errs.length === 0 ? 'PASS' : 'FAIL';
  if (errs.length > 0) allOk = false;
  report.push('Level ' + L.id + ' [' + L.tierName + ' ' + N + 'x' + N + '] clues=' + givens.length + ' cons=' + cons.length + ' solutions=' + nSol + ' -> ' + status + (errs.length ? ' :: ' + errs.join('; ') : ''));
}

console.log(report.join('\n'));
console.log('\n==== VERIFICATION ' + (allOk ? 'PASSED (30/30 levels valid & unique)' : 'FAILED') + ' ====');
process.exit(allOk ? 0 : 1);
