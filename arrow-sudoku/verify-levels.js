#!/usr/bin/env node
/**
 * Independent Arrow Sudoku solver — cross-verifies puzzle uniqueness.
 * Reads arrow-sudoku/levels.json, solves each puzzle from scratch,
 * and confirms exactly 1 solution that matches the stored solution.
 *
 * Rules: standard Sudoku (rows/cols/boxes = 1..N) + arrow sum constraints
 * (circle digit = sum of path digits).
 *
 * Usage: node verify-levels.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.dirname(__filename);
const levelsPath = path.join(DIR, 'levels.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));

let pass = 0, fail = 0;
const errors = [];

function boxIndex(r, c, boxR, boxC, n) {
  return Math.floor(r / boxR) * Math.floor(n / boxC) + Math.floor(c / boxC);
}

/**
 * Count solutions up to `limit` using MRV backtracking with arrow bounds.
 * Independent implementation (no shared code with Python generator).
 */
function countSolutions(puzzle, n, boxR, boxC, arrows, limit = 2, timeBudgetMs = 5000) {
  const grid = puzzle.map(row => row.slice());
  const fullMask = (1 << (n + 1)) - 2; // bits 1..n
  const startTime = Date.now();
  let counter = 0;
  let nodes = 0;
  let timedOut = false;

  // Build arrow index
  const cellArrows = {};
  const arrowSpecs = arrows.map((a, aid) => {
    const spec = {
      circle: [a.circle[0], a.circle[1]],
      path: a.path.map(p => [p[0], p[1]]),
      nPath: a.path.length,
      id: aid
    };
    const key = `${a.circle[0]},${a.circle[1]}`;
    if (!cellArrows[key]) cellArrows[key] = [];
    cellArrows[key].push(aid);
    for (const p of a.path) {
      const pk = `${p[0]},${p[1]}`;
      if (!cellArrows[pk]) cellArrows[pk] = [];
      cellArrows[pk].push(aid);
    }
    return spec;
  });

  function candidatesFor(r, c) {
    let avail = fullMask;
    // Row/col/box
    for (let i = 0; i < n; i++) {
      if (grid[r][i]) avail &= ~(1 << grid[r][i]);
      if (grid[i][c]) avail &= ~(1 << grid[i][c]);
    }
    const br = Math.floor(r / boxR) * boxR;
    const bc = Math.floor(c / boxC) * boxC;
    for (let i = 0; i < boxR; i++) {
      for (let j = 0; j < boxC; j++) {
        if (grid[br + i][bc + j]) avail &= ~(1 << grid[br + i][bc + j]);
      }
    }
    // Arrow bounds
    const key = `${r},${c}`;
    if (cellArrows[key]) {
      for (const aid of cellArrows[key]) {
        const spec = arrowSpecs[aid];
        if (r === spec.circle[0] && c === spec.circle[1]) continue;
        const cv = grid[spec.circle[0]][spec.circle[1]];
        if (!cv) continue;
        let sum = 0, unfilled = 0;
        for (const [pr, pc] of spec.path) {
          if (pr === r && pc === c) continue; // exclude self
          if (grid[pr][pc]) sum += grid[pr][pc];
          else unfilled++;
        }
        const remaining = cv - sum;
        const lo = Math.max(1, remaining - unfilled * n);
        const hi = Math.min(n, remaining - unfilled);
        let allowed = 0;
        for (let v = lo; v <= hi; v++) allowed |= (1 << v);
        avail &= allowed;
      }
    }
    return avail;
  }

  function bt() {
    if (counter >= limit) return;
    nodes++;
    if ((nodes & 4095) === 0 && Date.now() - startTime > timeBudgetMs) {
      timedOut = true;
      return;
    }
    // MRV
    let bestR = -1, bestC = -1, bestCands = 0, bestCount = n + 2;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c]) continue;
        const avail = candidatesFor(r, c);
        const cnt = popcount(avail);
        if (cnt < bestCount) {
          bestCount = cnt;
          bestR = r; bestC = c;
          bestCands = avail;
          if (cnt <= 1) break;
        }
      }
      if (bestCount <= 1) break;
    }
    if (bestR === -1) {
      // All filled — verify arrow sums
      for (const spec of arrowSpecs) {
        const cv = grid[spec.circle[0]][spec.circle[1]];
        let s = 0;
        for (const [pr, pc] of spec.path) s += grid[pr][pc];
        if (cv !== s) return;
      }
      counter++;
      return;
    }
    if (bestCount === 0) return;
    let v = 1;
    let avail = bestCands;
    while (avail) {
      if (avail & 1) {
        grid[bestR][bestC] = v;
        bt();
        grid[bestR][bestC] = 0;
        if (counter >= limit) return;
      }
      avail >>>= 1;
      v++;
    }
  }

  bt();
  return { count: counter, timedOut };
}

function popcount(x) {
  let c = 0;
  while (x) { c += x & 1; x >>>= 1; }
  return c;
}

console.log(`Verifying ${levels.length} Arrow Sudoku levels...\n`);

for (const L of levels) {
  const { n, box_r, box_c, puzzle, solution, arrows, id, tier } = L;
  const clues = puzzle.flat().filter(v => v !== 0).length;

  // 1. Verify solution satisfies standard Sudoku
  let sudokuValid = true;
  for (let r = 0; r < n && sudokuValid; r++) {
    const rowSet = new Set();
    for (let c = 0; c < n; c++) {
      if (rowSet.has(solution[r][c])) { sudokuValid = false; break; }
      rowSet.add(solution[r][c]);
    }
  }
  for (let c = 0; c < n && sudokuValid; c++) {
    const colSet = new Set();
    for (let r = 0; r < n; r++) {
      if (colSet.has(solution[r][c])) { sudokuValid = false; break; }
      colSet.add(solution[r][c]);
    }
  }
  for (let br = 0; br < n && sudokuValid; br += box_r) {
    for (let bc = 0; bc < n && sudokuValid; bc += box_c) {
      const boxSet = new Set();
      for (let i = 0; i < box_r && sudokuValid; i++) {
        for (let j = 0; j < box_c && sudokuValid; j++) {
          if (boxSet.has(solution[br + i][bc + j])) { sudokuValid = false; break; }
          boxSet.add(solution[br + i][bc + j]);
        }
      }
    }
  }

  // 2. Verify arrow constraints
  let arrowsValid = true;
  for (const a of arrows) {
    const cv = solution[a.circle[0]][a.circle[1]];
    let s = 0;
    for (const [pr, pc] of a.path) s += solution[pr][pc];
    if (cv !== s) { arrowsValid = false; break; }
  }

  // 3. Verify puzzle clues match solution
  let cluesMatch = true;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (puzzle[r][c] !== 0 && puzzle[r][c] !== solution[r][c]) {
        cluesMatch = false;
      }
    }
  }

  // 4. Verify uniqueness (independent solver)
  const result = countSolutions(puzzle, n, box_r, box_c, arrows, 2, 5000);
  const unique = result.count === 1 && !result.timedOut;

  const ok = sudokuValid && arrowsValid && cluesMatch && unique;
  if (ok) {
    pass++;
    console.log(`✅ L${id} ${tier} n=${n} clues=${clues} arrows=${arrows.length} unique=${result.count}`);
  } else {
    fail++;
    const issues = [];
    if (!sudokuValid) issues.push('SUDOKU_INVALID');
    if (!arrowsValid) issues.push('ARROW_INVALID');
    if (!cluesMatch) issues.push('CLUES_MISMATCH');
    if (!unique) issues.push(`NOT_UNIQUE(count=${result.count},timeout=${result.timedOut})`);
    errors.push(`L${id} ${tier}: ${issues.join(', ')}`);
    console.log(`❌ L${id} ${tier} n=${n} clues=${clues} arrows=${arrows.length} → ${issues.join(', ')}`);
  }
}

console.log(`\n=== RESULT ===`);
console.log(`Pass: ${pass}/${levels.length}`);
console.log(`Fail: ${fail}/${levels.length}`);
if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(`  ${e}`));
  process.exit(1);
} else {
  console.log('✅ ALL LEVELS VERIFIED UNIQUE AND VALID');
}
