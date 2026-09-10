#!/usr/bin/env node
/**
 * Magnets independent uniqueness solver (Node.js).
 *
 * Reads levels.json and verifies each level has EXACTLY ONE solution
 * using a CSP-based solver. Independent implementation from gen_levels.py.
 *
 * Constraints:
 *   - Fill each cell with +1 (+) or -1 (-).
 *   - Fixed cells have given pole.
 *   - X constraints: adjacent cells have different poles.
 *   - Row clue: total + count per row.
 *   - Col clue: total + count per col.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

function solveUnique(n, m, fixed, xCons, eqCons, rowClues, colClues, cap) {
  cap = cap || 2;
  let solutions = 0;
  const assign = Array.from({ length: n }, () => new Array(m).fill(0));
  const fixedMap = fixed;

  function backtrack() {
    if (solutions >= cap) return;
    let first = null;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (assign[r][c] === 0) { first = [r, c]; break; }
      }
      if (first) break;
    }
    if (!first) { solutions++; return; }
    const [r, c] = first;
    for (const v of [1, -1]) {
      const key = r + ',' + c;
      if (fixedMap.has(key) && fixedMap.get(key) !== v) continue;
      let ok = true;
      for (const [r1, c1, r2, c2] of xCons) {
        if (r1 === r && c1 === c && assign[r2][c2] !== 0 && assign[r2][c2] === v) { ok = false; break; }
        if (r2 === r && c2 === c && assign[r1][c1] !== 0 && assign[r1][c1] === v) { ok = false; break; }
      }
      if (!ok) continue;
      for (const [r1, c1, r2, c2] of eqCons) {
        if (r1 === r && c1 === c && assign[r2][c2] !== 0 && assign[r2][c2] !== v) { ok = false; break; }
        if (r2 === r && c2 === c && assign[r1][c1] !== 0 && assign[r1][c1] !== v) { ok = false; break; }
      }
      if (!ok) continue;
      assign[r][c] = v;
      let rowPlus = 0, rowTotal = 0;
      for (let cc = 0; cc < m; cc++) {
        if (assign[r][cc] !== 0) { rowTotal++; if (assign[r][cc] === 1) rowPlus++; }
      }
      if (rowPlus > rowClues[r]) { assign[r][c] = 0; continue; }
      if (rowTotal === m && rowPlus !== rowClues[r]) { assign[r][c] = 0; continue; }
      let colPlus = 0, colTotal = 0;
      for (let rr = 0; rr < n; rr++) {
        if (assign[rr][c] !== 0) { colTotal++; if (assign[rr][c] === 1) colPlus++; }
      }
      if (colPlus > colClues[c]) { assign[r][c] = 0; continue; }
      if (colTotal === n && colPlus !== colClues[c]) { assign[r][c] = 0; continue; }
      backtrack();
      assign[r][c] = 0;
      if (solutions >= cap) return;
    }
  }
  backtrack();
  return solutions;
}

function main() {
  const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const levels = data.levels;
  console.log(`Verifying ${levels.length} Magnets levels (independent Node.js solver)...`);
  let allPass = true;
  for (let i = 0; i < levels.length; i++) {
    const lev = levels[i];
    const n = lev.n, m = lev.m;
    const fixedMap = new Map();
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (lev.fixed[r][c] !== 0) fixedMap.set(r + ',' + c, lev.fixed[r][c]);
      }
    }
    const xCons = lev.x;
    const solCount = solveUnique(n, m, fixedMap, xCons, [], lev.row_clues, lev.col_clues, 2);
    if (solCount !== 1) {
      console.log(`  L${String(i).padStart(2, '0')} ${lev.tier} (${n}x${m}): FAIL — ${solCount} solutions`);
      allPass = false;
    } else {
      console.log(`  L${String(i).padStart(2, '0')} ${lev.tier} (${n}x${m}): PASS (unique)`);
    }
  }
  if (allPass) {
    console.log(`\nAll ${levels.length}/30 levels UNIQUE per independent Node.js solver`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();