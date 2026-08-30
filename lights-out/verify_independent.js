#!/usr/bin/env node
// Method 2: Independent Node.js solver for Lights Out.
// Verifies that:
//   1. Each level's solution s solves the givens (residual = 0)
//   2. The solution is the canonical (smallest-int) form among 4 cosets
//
// Kernel of Lights Out 5x5 toggle matrix: rank=23, kernel dim=2
// (computed via Gaussian elimination over GF(2))
// Kernel basis vectors (in flat-index form, 0..24):
//   k1: [1, 2, 3, 5, 7, 9, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23]
//   k2: [0, 2, 4, 5, 7, 9, 15, 17, 19, 20, 22, 24]

const fs = require('fs');

const LEVELS = JSON.parse(fs.readFileSync(require('path').join(__dirname,'levels.json'), 'utf8')).LEVELS;
const N = 5;
const SIZE = N * N;

const K1 = new Set([1, 2, 3, 5, 7, 9, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23]);
const K2 = new Set([0, 2, 4, 5, 7, 9, 15, 17, 19, 20, 22, 24]);

function applyPress(state, r, c) {
  const s = state.slice();
  for (const [dr, dc] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
      s[nr * N + nc] ^= 1;
    }
  }
  return s;
}

function applyPresses(givens, presses) {
  let s = givens.slice();
  for (const idx of presses) {
    const r = Math.floor(idx / N), c = idx % N;
    s = applyPress(s, r, c);
  }
  return s;
}

function xorSet(base, kvec) {
  const r = new Set(base);
  for (const i of kvec) {
    if (r.has(i)) r.delete(i); else r.add(i);
  }
  return r;
}

function setToInt(s) {
  let v = 0n;
  for (const i of s) v |= 1n << BigInt(i);
  return v;
}

function allZero(state) {
  return state.every(v => v === 0);
}

let pass = 0;
const fail = [];

for (const lv of LEVELS) {
  const g = lv.g;
  const solIdx = new Set();
  for (let i = 0; i < SIZE; i++) if (lv.s[i] === 1) solIdx.add(i);

  // Check 1: canonical solution -> all zero
  const afterS = applyPresses(g, [...solIdx]);
  if (!allZero(afterS)) {
    fail.push(`L${lv.i+1}: canonical solution doesn't solve (residual=${afterS.filter(v=>v).length})`);
    continue;
  }

  // Check 2: try all 4 coset variants, count how many solve.
  // For Lights Out, every solvable state has exactly 4 solutions (1 per coset).
  let solveCount = 0;
  for (const x of [false, true]) {
    for (const y of [false, true]) {
      let test = new Set(solIdx);
      if (x) test = xorSet(test, K1);
      if (y) test = xorSet(test, K2);
      const r = applyPresses(g, [...test]);
      if (allZero(r)) solveCount++;
    }
  }

  if (solveCount !== 4) {
    fail.push(`L${lv.i+1}: solve count=${solveCount}, expected 4`);
    continue;
  }

  // Check 3: canonical form (smallest integer representation)
  let bestInt = null;
  for (const x of [false, true]) {
    for (const y of [false, true]) {
      let test = new Set(solIdx);
      if (x) test = xorSet(test, K1);
      if (y) test = xorSet(test, K2);
      const i = setToInt(test);
      if (bestInt === null || i < bestInt) bestInt = i;
    }
  }
  const baseInt = setToInt(solIdx);
  if (baseInt !== bestInt) {
    fail.push(`L${lv.i+1}: not canonical (base=${baseInt}, canon=${bestInt})`);
    continue;
  }

  pass++;
}

console.log(`${pass}/${LEVELS.length} levels PASS independent solve check`);
if (fail.length) {
  console.log('Failures:');
  for (const f of fail) console.log('  ' + f);
  process.exit(1);
}
process.exit(0);