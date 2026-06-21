#!/usr/bin/env node
/**
 * Independent verifier for Samurai Sudoku levels.
 *
 * Uses a DIFFERENT solver implementation than gen.py to cross-check:
 *   - bitmask-based DFS with MRV (minimum remaining values) heuristic
 *   - solution-counting capped at 2
 *
 * Checks per level:
 *   1. Each grid's puzzle has a UNIQUE solution (count == 1).
 *   2. The puzzle's solution matches gen.py's recorded solution.
 *   3. Each shared 3x3 corner box is consistent across the 5 grids:
 *      center[TL] == TL[BR], center[TR] == TR[BL],
 *      center[BL] == BL[TR], center[BR] == BR[TL]
 *   4. Each grid's solution is a valid Sudoku (rows/cols/boxes = 1..9).
 *
 * Exit non-zero if any check fails.
 */

const fs = require('fs');
const path = require('path');

const lvPath = process.argv[2] || path.join(__dirname, 'levels.json');
const raw = fs.readFileSync(lvPath, 'utf8');
const levels = JSON.parse(raw);

// ---------- Independent bitmask Sudoku solver ----------
function countSolutions(grid, limit = 2) {
  // grid: 9x9 of 0..9
  const rows = new Int32Array(9);
  const cols = new Int32Array(9);
  const boxes = new Int32Array(9);
  const empties = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v === 0) {
        empties.push([r, c]);
      } else {
        const bit = 1 << v;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[Math.floor(r/3)*3 + Math.floor(c/3)] |= bit;
      }
    }
  }
  let count = 0;
  const work = grid.map(row => row.slice());

  function dfs() {
    if (count >= limit) return;
    // MRV: pick empty cell with fewest candidates
    let bestIdx = -1, bestMask = 0, bestCount = 10;
    for (let i = 0; i < empties.length; i++) {
      const [r, c] = empties[i];
      if (work[r][c] !== 0) continue;
      const b = Math.floor(r/3)*3 + Math.floor(c/3);
      const used = rows[r] | cols[c] | boxes[b];
      let cnt = 0;
      for (let n = 1; n <= 9; n++) {
        if (!(used & (1 << n))) cnt++;
      }
      if (cnt < bestCount) {
        bestCount = cnt;
        bestIdx = i;
        bestMask = used;
        if (cnt === 0) break;       // dead-end
        if (cnt === 1) break;       // forced, take immediately
      }
    }
    if (bestIdx === -1) {
      // no empty cells left
      count++;
      return;
    }
    if (bestCount === 0) return;     // dead-end
    const [r, c] = empties[bestIdx];
    const b = Math.floor(r/3)*3 + Math.floor(c/3);
    for (let n = 1; n <= 9 && count < limit; n++) {
      if (bestMask & (1 << n)) continue;
      work[r][c] = n;
      rows[r] |= (1 << n);
      cols[c] |= (1 << n);
      boxes[b] |= (1 << n);
      dfs();
      work[r][c] = 0;
      rows[r] &= ~(1 << n);
      cols[c] &= ~(1 << n);
      boxes[b] &= ~(1 << n);
    }
  }
  dfs();
  return count;
}

function isValidSolution(grid) {
  // each row, col, box contains 1..9 exactly once
  for (let i = 0; i < 9; i++) {
    const rowSeen = new Set();
    const colSeen = new Set();
    const boxSeen = new Set();
    for (let j = 0; j < 9; j++) {
      rowSeen.add(grid[i][j]);
      colSeen.add(grid[j][i]);
      const br = Math.floor(i/3)*3 + Math.floor(j/3);
      const bc = (i%3)*3 + (j%3);
      boxSeen.add(grid[br][bc]);
    }
    if (rowSeen.size !== 9 || colSeen.size !== 9 || boxSeen.size !== 9) return false;
    for (const s of [rowSeen, colSeen, boxSeen]) {
      for (let n = 1; n <= 9; n++) if (!s.has(n)) return false;
    }
  }
  return true;
}

function getBox(grid, r0, c0) {
  const out = [];
  for (let r = r0; r < r0+3; r++) {
    out.push(grid[r].slice(c0, c0+3));
  }
  return out;
}

function boxesEqual(a, b) {
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      if (a[r][c] !== b[r][c]) return false;
  return true;
}

// ---------- Run checks ----------
let failures = 0;
const t0 = Date.now();

for (const lvl of levels) {
  const grids = [
    ['C',  lvl.center],
    ['TL', lvl.corners.TL],
    ['TR', lvl.corners.TR],
    ['BL', lvl.corners.BL],
    ['BR', lvl.corners.BR],
  ];

  // Check 1+2+4: per-grid uniqueness + validity + solution match
  for (const [tag, g] of grids) {
    if (!isValidSolution(g.solution)) {
      console.log(`L${lvl.id} ${tag}: ❌ solution not a valid Sudoku`);
      failures++;
      continue;
    }
    // Verify puzzle is consistent with solution (givens match)
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g.puzzle[r][c] !== 0 && g.puzzle[r][c] !== g.solution[r][c]) {
          console.log(`L${lvl.id} ${tag}: ❌ puzzle (${r},${c})=${g.puzzle[r][c]} ≠ solution ${g.solution[r][c]}`);
          failures++;
        }
      }
    }
    // Count solutions
    const n = countSolutions(g.puzzle.map(row => row.slice()), 2);
    if (n !== 1) {
      console.log(`L${lvl.id} ${tag}: ❌ expected unique solution, got ${n}`);
      failures++;
    }
  }

  // Check 3: shared corner box consistency
  const C = lvl.center.solution;
  const TL = lvl.corners.TL.solution;
  const TR = lvl.corners.TR.solution;
  const BL = lvl.corners.BL.solution;
  const BR = lvl.corners.BR.solution;

  const checks = [
    ['C.TL == TL.BR', getBox(C, 0, 0), getBox(TL, 6, 6)],
    ['C.TR == TR.BL', getBox(C, 0, 6), getBox(TR, 6, 0)],
    ['C.BL == BL.TR', getBox(C, 6, 0), getBox(BL, 0, 6)],
    ['C.BR == BR.TL', getBox(C, 6, 6), getBox(BR, 0, 0)],
  ];
  for (const [label, a, b] of checks) {
    if (!boxesEqual(a, b)) {
      console.log(`L${lvl.id}: ❌ shared-corner mismatch ${label}`);
      failures++;
    }
  }

  // Live progress
  if (lvl.id % 5 === 0 || lvl.id === levels.length) {
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write(`  L${lvl.id}/${levels.length} checked (${dt}s)\n`);
  }
}

const dt = ((Date.now() - t0) / 1000).toFixed(2);
console.log(`\nVerified ${levels.length} levels in ${dt}s`);
if (failures === 0) {
  console.log('✅ ALL CHECKS PASSED — every grid has unique solution, shared corners consistent');
} else {
  console.log(`❌ ${failures} FAILURE(S) — see above`);
  process.exit(1);
}
