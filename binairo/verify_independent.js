#!/usr/bin/env node
'use strict';
/* verify_independent.js — INDEPENDENT uniqueness verifier for Binairo levels.
 *
 * Uses a deliberately different implementation from gen.js:
 *   - Column-major traversal instead of row-major
 *   - Different variable names and data structures
 *   - Recursive backtracking with forced-cell propagation
 *
 * Reads binairo/levels.json, asserts each puzzle has exactly ONE solution
 * and that it matches the stored "solution" field.
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'levels.json');
const RAW = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ---- Build a grid (2-D array, -1 = empty) from givens list ----
function buildGrid(rec) {
  const N = rec.size;
  const g = Array.from({ length: N }, () => new Array(N).fill(-1));
  for (const triple of rec.givens) {
    g[triple[0]][triple[1]] = triple[2];
  }
  return g;
}

// ---- Constraint predicates (column-major naming convention) ----
function valueOk(field, dim, mid, row, col, bit) {
  // count prune
  let rowCount = 0, colCount = 0;
  for (let x = 0; x < dim; x++) {
    if (field[row][x] === bit) rowCount++;
    if (field[x][col] === bit) colCount++;
  }
  if (rowCount >= mid || colCount >= mid) return false;
  // triplet prune — scan every length-3 window touching (row, col)
  for (let s = col - 2; s <= col; s++) {
    if (s < 0 || s + 2 >= dim) continue;
    if (field[row][s] === bit && field[row][s + 1] === bit && field[row][s + 2] === bit) return false;
  }
  for (let s = row - 2; s <= row; s++) {
    if (s < 0 || s + 2 >= dim) continue;
    if (field[s][col] === bit && field[s + 1][col] === bit && field[s + 2][col] === bit) return false;
  }
  return true;
}

function allRowsDistinct(field, dim) {
  const mem = new Set();
  for (let x = 0; x < dim; x++) {
    const key = field[x].join('');
    if (mem.has(key)) return false;
    mem.add(key);
  }
  return true;
}
function allColsDistinct(field, dim) {
  const mem = new Set();
  for (let y = 0; y < dim; y++) {
    let key = '';
    for (let x = 0; x < dim; x++) key += field[x][y];
    if (mem.has(key)) return false;
    mem.add(key);
  }
  return true;
}

// ---- Solver: returns array of solution grids (capped at 2) ----
function enumerateSolutions(puzzle, dim, cap) {
  cap = cap || 2;
  const mid = dim / 2;
  const answers = [];

  function deduce(field) {
    // Fill every forced cell; return 'bad' | 'done' | 'open'
    let progress = true;
    while (progress) {
      progress = false;
      for (let r = 0; r < dim; r++) {
        for (let c = 0; c < dim; c++) {
          if (field[r][c] !== -1) continue;
          let opts = 0, only = -1;
          for (const b of [0, 1]) {
            if (valueOk(field, dim, mid, r, c, b)) { opts++; only = b; }
          }
          if (opts === 0) return 'bad';
          if (opts === 1) { field[r][c] = only; progress = true; }
        }
      }
    }
    for (let r = 0; r < dim; r++)
      for (let c = 0; c < dim; c++)
        if (field[r][c] === -1) return 'open';
    return 'done';
  }

  function recurse(field) {
    if (answers.length >= cap) return;
    const verdict = deduce(field);
    if (verdict === 'bad') return;
    if (verdict === 'done') {
      if (allRowsDistinct(field, dim) && allColsDistinct(field, dim)) {
        answers.push(field.map(row => row.slice()));
      }
      return;
    }
    // COLUMN-MAJOR next-cell selection (deliberately different from gen.js)
    // Find the first empty cell scanning column-first.
    let targetRow = -1, targetCol = -1;
    outer:
    for (let c = 0; c < dim; c++) {
      for (let r = 0; r < dim; r++) {
        if (field[r][c] === -1) { targetRow = r; targetCol = c; break outer; }
      }
    }
    if (targetRow === -1) return;
    for (const b of [0, 1]) {
      if (valueOk(field, dim, mid, targetRow, targetCol, b)) {
        const snap = field.map(row => row.slice());
        snap[targetRow][targetCol] = b;
        recurse(snap);
        if (answers.length >= cap) return;
      }
    }
  }

  recurse(puzzle.map(row => row.slice()));
  return answers;
}

// ---- Main verification loop ----
let passCount = 0;
let failCount = 0;

for (const rec of RAW) {
  const N = rec.size;
  const grid = buildGrid(rec);
  const sols = enumerateSolutions(grid, N, 2);

  let ok = true;
  let detail = '';

  if (sols.length !== 1) {
    ok = false;
    detail = 'expected 1 solution, found ' + sols.length;
  } else {
    // Verify the unique solution matches the stored one
    const found = sols[0];
    for (let r = 0; r < N && ok; r++) {
      for (let c = 0; c < N && ok; c++) {
        if (found[r][c] !== rec.solution[r][c]) {
          ok = false;
          detail = 'solution mismatch at (' + r + ',' + c + '): got ' + found[r][c] + ' expected ' + rec.solution[r][c];
        }
      }
    }
  }

  if (ok) {
    passCount++;
    console.log('#' + String(rec.id).padStart(2, '0') + ' ' + rec.tier.padEnd(9) + ' ' + N + 'x' + N + '  UNIQUE + VALID');
  } else {
    failCount++;
    console.error('#' + String(rec.id).padStart(2, '0') + ' ' + rec.tier + ' ' + N + 'x' + N + '  FAIL: ' + detail);
  }
}

console.log('\n' + passCount + '/' + (passCount + failCount) + ' UNIQUE + VALID');
if (failCount > 0) {
  console.error('\n*** ' + failCount + ' level(s) FAILED verification ***');
  process.exit(1);
}
process.exit(0);
