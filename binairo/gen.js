#!/usr/bin/env node
'use strict';
/* gen.js — Binairo (Binary Puzzle) level generator.
 *
 * Generates 27 levels across 6 tiers (Beginner → Master) with grid sizes
 * 6×6, 8×8, 10×10, 12×12. Every puzzle is guaranteed to have a UNIQUE
 * solution via an embedded solver.
 *
 * Output: binairo/levels.json
 */
const fs = require('fs');
const path = require('path');

// ==================== Utilities ====================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ==================== Constraint check ====================
// Returns true if placing value v at (r,c) is legal given current grid state.
function canPlace(grid, N, half, r, c, v) {
  // Count constraint: no more than `half` of any digit per row/col
  let rc = 0, cc = 0;
  for (let i = 0; i < N; i++) {
    if (grid[r][i] === v) rc++;
    if (grid[i][c] === v) cc++;
  }
  if (rc >= half || cc >= half) return false;
  // Triplet constraint: no 3 consecutive same digit in row or col.
  // Check the 3-cell windows that include (r,c).
  // Horizontal
  for (let i = c - 2; i <= c; i++) {
    if (i < 0 || i + 2 >= N) continue;
    if (grid[r][i] === v && grid[r][i + 1] === v && grid[r][i + 2] === v) return false;
  }
  // Vertical
  for (let i = r - 2; i <= r; i++) {
    if (i < 0 || i + 2 >= N) continue;
    if (grid[i][c] === v && grid[i + 1][c] === v && grid[i + 2][c] === v) return false;
  }
  return true;
}

// ==================== Solution generator ====================
// Cell-by-cell backtracking with randomised value ordering.
// Produces a full grid satisfying rules 1-3 (count + no-triplet).
// Row/col uniqueness (rule 4) verified post-hoc; retries if violated.
function generateSolution(N) {
  const half = N / 2;

  function attempt() {
    const grid = Array.from({ length: N }, () => new Array(N).fill(-1));

    function solve(pos) {
      if (pos === N * N) return true;
      const r = (pos / N) | 0, c = pos % N;
      const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
      for (let k = 0; k < 2; k++) {
        const v = order[k];
        if (canPlace(grid, N, half, r, c, v)) {
          grid[r][c] = v;
          if (solve(pos + 1)) return true;
          grid[r][c] = -1;
        }
      }
      return false;
    }

    if (!solve(0)) return null;
    return grid;
  }

  // Verify row & column uniqueness (rule 4); retry on failure.
  for (let tries = 0; tries < 50; tries++) {
    const grid = attempt();
    if (!grid) continue;
    if (rowsUnique(grid, N) && colsUnique(grid, N)) {
      return grid.map(row => row.slice());
    }
  }
  return null;
}

function rowsUnique(grid, N) {
  const seen = new Set();
  for (let r = 0; r < N; r++) {
    const s = grid[r].join('');
    if (seen.has(s)) return false;
    seen.add(s);
  }
  return true;
}
function colsUnique(grid, N) {
  const seen = new Set();
  for (let c = 0; c < N; c++) {
    let s = '';
    for (let r = 0; r < N; r++) s += grid[r][c];
    if (seen.has(s)) return false;
    seen.add(s);
  }
  return true;
}

// ==================== Solver (counts solutions up to `limit`) ====================
// Uses constraint propagation (forced moves) + MRV branching.
// Grid cells use -1 for empty, 0/1 for filled.
function countSolutions(puzzle, N, limit) {
  limit = limit || 2;
  const half = N / 2;
  let found = 0;

  // Incremental constraint check (same logic as canPlace but inline for speed)
  function legal(grid, r, c, v) {
    let rc = 0, cc = 0;
    for (let i = 0; i < N; i++) {
      if (grid[r][i] === v) rc++;
      if (grid[i][c] === v) cc++;
    }
    if (rc >= half || cc >= half) return false;
    for (let i = c - 2; i <= c; i++) {
      if (i < 0 || i + 2 >= N) continue;
      if (grid[r][i] === v && grid[r][i + 1] === v && grid[r][i + 2] === v) return false;
    }
    for (let i = r - 2; i <= r; i++) {
      if (i < 0 || i + 2 >= N) continue;
      if (grid[i][c] === v && grid[i + 1][c] === v && grid[i + 2][c] === v) return false;
    }
    return true;
  }

  // Propagation: repeatedly fill cells with only one legal value.
  // Returns "dead", "full", or "partial".
  function propagate(grid) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (grid[r][c] !== -1) continue;
          let n = 0, pick = -1;
          for (const v of [0, 1]) {
            if (legal(grid, r, c, v)) { n++; pick = v; }
          }
          if (n === 0) return 'dead';
          if (n === 1) { grid[r][c] = pick; changed = true; }
        }
      }
    }
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] === -1) return 'partial';
    return 'full';
  }

  function fullyValid(grid) {
    // Final check: row & col uniqueness (rule 4)
    if (!rowsUnique(grid, N)) return false;
    if (!colsUnique(grid, N)) return false;
    return true;
  }

  function search(grid) {
    if (found >= limit) return;
    const st = propagate(grid);
    if (st === 'dead') return;
    if (st === 'full') {
      if (fullyValid(grid)) found++;
      return;
    }
    // MRV: find the empty cell with the fewest legal values
    let br = -1, bc = -1, bestN = 3;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] !== -1) continue;
        let n = 0;
        for (const v of [0, 1]) if (legal(grid, r, c, v)) n++;
        if (n < bestN) { bestN = n; br = r; bc = c; if (n <= 1) break; }
      }
      if (bestN <= 1) break;
    }
    if (br === -1) return;
    for (const v of [0, 1]) {
      if (legal(grid, br, bc, v)) {
        const cp = grid.map(row => row.slice());
        cp[br][bc] = v;
        search(cp);
        if (found >= limit) return;
      }
    }
  }

  search(puzzle.map(row => row.slice()));
  return found;
}

function hasUniqueSolution(puzzle, N) {
  return countSolutions(puzzle, N, 2) === 1;
}

// ==================== Hole digging ====================
function digHoles(solution, N, targetGivens) {
  const puzzle = solution.map(row => row.slice());
  let givens = N * N;
  const order = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      order.push([r, c]);
  shuffle(order);

  for (let idx = 0; idx < order.length; idx++) {
    if (givens <= targetGivens) break;
    const [r, c] = order[idx];
    if (puzzle[r][c] === -1) continue;
    const backup = puzzle[r][c];
    puzzle[r][c] = -1;
    if (hasUniqueSolution(puzzle, N)) {
      givens--;
    } else {
      puzzle[r][c] = backup;
    }
  }
  return puzzle;
}

// ==================== Level spec ====================
const LEVELS_SPEC = [
  { tier: 'Beginner', size: 6,  count: 4, lo: 16, hi: 20 },
  { tier: 'Easy',     size: 6,  count: 4, lo: 12, hi: 14 },
  { tier: 'Medium',   size: 8,  count: 5, lo: 24, hi: 28 },
  { tier: 'Hard',     size: 8,  count: 5, lo: 20, hi: 22 },
  { tier: 'Expert',   size: 10, count: 5, lo: 36, hi: 40 },
  { tier: 'Master',   size: 12, count: 4, lo: 56, hi: 60 },
];

// ==================== Main ====================
function main() {
  const levels = [];
  let id = 1;
  const t0 = Date.now();

  for (const spec of LEVELS_SPEC) {
    for (let i = 0; i < spec.count; i++) {
      const target = spec.lo + Math.floor(Math.random() * (spec.hi - spec.lo + 1));
      let solution = null, puzzle = null;
      let attempts = 0;
      while (attempts < 30) {
        attempts++;
        solution = generateSolution(spec.size);
        if (!solution) continue;
        puzzle = digHoles(solution, spec.size, target);
        // Verify uniqueness of the final puzzle
        if (hasUniqueSolution(puzzle, spec.size)) break;
      }
      if (!solution || !puzzle) {
        console.error('FAILED to generate level ' + id + ' (' + spec.tier + ' ' + spec.size + 'x' + spec.size + ')');
        process.exit(1);
      }

      // Build givens list [[r,c,val],...]
      const givensList = [];
      let givensCount = 0;
      for (let r = 0; r < spec.size; r++) {
        for (let c = 0; c < spec.size; c++) {
          if (puzzle[r][c] !== -1) {
            givensList.push([r, c, puzzle[r][c]]);
            givensCount++;
          }
        }
      }

      levels.push({
        id: id,
        tier: spec.tier,
        size: spec.size,
        givens: givensList,
        solution: solution,
      });

      console.log('  #' + String(id).padStart(2, '0') + ' ' + spec.tier.padEnd(9) +
        spec.size + 'x' + spec.size + '  givens=' + String(givensCount).padStart(3) +
        '  unique=OK  (attempt ' + attempts + ')');
      id++;
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const outPath = path.join(__dirname, 'levels.json');
  fs.writeFileSync(outPath, JSON.stringify(levels));
  console.log('\n' + levels.length + '/' + levels.length + ' levels generated, all unique (' + elapsed + 's)');
  console.log('Written to ' + outPath);
}

main();
