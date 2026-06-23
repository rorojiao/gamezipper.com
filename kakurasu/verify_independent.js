#!/usr/bin/env node
/**
 * INDEPENDENT Kakurasu verifier (separate implementation from gen.py).
 *
 * Reads ./levels.json. For each level:
 *   1. Validates clues (in range 0..N(N+1)/2).
 *   2. Counts solutions with a CELL-BY-CELL backtracking solver
 *      (different algorithm than gen.py's row-by-row approach).
 *   3. Requires EXACTLY ONE solution per level.
 *
 * Prints "27/27 UNIQUE" on success. Exits nonzero on any failure.
 *
 * Solver algorithm: cell-by-cell DFS, processing cells in column-major order.
 * For each cell, try {0,1}. Track partial row sums and column sums. Prune
 * when any row sum exceeds its clue or any column sum exceeds its clue,
 * and verify each row/col achieves exactly its clue when the row/col is
 * complete (i.e., all cells in that row/col have been assigned).
 */
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, 'levels.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));

// Cell-by-cell solver. Different algorithm from gen.py (which is row-by-row).
// fixed[r][c] in {0,1,undefined}.
function countSolutions(n, rc, cc, fixed, limit) {
  const N2 = n * n;
  const rowSum = new Int32Array(n);    // current accumulated row sum (col indices)
  const colSum = new Int32Array(n);    // current accumulated col sum (row indices)
  const rowDone = new Uint8Array(n);   // row fully assigned?
  const colDone = new Uint8Array(n);   // col fully assigned?

  // Apply fixed cells.
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = fixed[r][c];
      if (v === 1) {
        rowSum[r] += (c + 1);
        colSum[c] += (r + 1);
      }
    }
  }

  // Order cells: column-major (different from row-major) so the algorithm
  // differs from gen.py in spirit too.
  const order = [];
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) {
      order.push([r, c]);
    }
  }

  let count = 0;

  function prune(i) {
    // Row overflow check
    for (let r = 0; r < n; r++) {
      if (rowSum[r] > rc[r]) return false;
    }
    for (let c = 0; c < n; c++) {
      if (colSum[c] > cc[c]) return false;
    }
    return true;
  }

  function checkCompleted() {
    // After all N*N cells assigned, verify every row & col clue matches.
    for (let r = 0; r < n; r++) {
      if (rowSum[r] !== rc[r]) return false;
    }
    for (let c = 0; c < n; c++) {
      if (colSum[c] !== cc[c]) return false;
    }
    return true;
  }

  function isRowComplete(r, i) {
    // Row r is fully assigned when all n cells of row r have been assigned.
    // In column-major order, cells in row r are at positions r, r+n, r+2n, ...
    // so we need to know how many cells remain AFTER index i.
    // Simpler: check by counting remaining free cells in row r.
    // But that's expensive. Use column-major positional info instead.
    // Remaining cells in row r are those with col in 0..n-1 whose position > i.
    // Since column-major, row r positions are: r + col*n for col in 0..n-1.
    // Position i corresponds to col = Math.floor(i/n), row = i - col*n.
    const curCol = Math.floor(i / n);
    const remainingInRow = n - 1 - curCol;
    return remainingInRow === 0;
  }
  function isColComplete(c, i) {
    const curRow = i - Math.floor(i / n) * n;
    const remainingInCol = n - 1 - curRow;
    return remainingInCol === 0;
  }

  function bt(i) {
    if (count >= limit) return;
    if (i === N2) {
      if (checkCompleted()) count++;
      return;
    }
    const [r, c] = order[i];
    const isFixed = (fixed[r][c] !== undefined);

    if (isFixed) {
      const v = fixed[r][c];
      // Apply
      if (v === 1) {
        rowSum[r] += 0; // already added in init
        colSum[c] += 0;
      }
      if (!prune(i)) return;
      // Check completed rows/cols
      if (isRowComplete(r, i) && rowSum[r] !== rc[r]) return;
      if (isColComplete(c, i) && colSum[c] !== cc[c]) return;
      bt(i + 1);
      return;
    }

    // Try 0 then 1.
    // v=0: nothing added
    if (true) {
      // We need to know row/col completion after this choice.
      const nextRowComplete = isRowComplete(r, i);
      const nextColComplete = isColComplete(c, i);
      if (nextRowComplete && rowSum[r] !== rc[r]) {
        // skip v=0
      } else if (nextColComplete && colSum[c] !== cc[c]) {
        // skip v=0
      } else {
        bt(i + 1);
        if (count >= limit) return;
      }
    }

    // v=1
    rowSum[r] += (c + 1);
    colSum[c] += (r + 1);
    if (prune(i)) {
      const nextRowComplete = isRowComplete(r, i);
      const nextColComplete = isColComplete(c, i);
      if (!(nextRowComplete && rowSum[r] !== rc[r]) &&
          !(nextColComplete && colSum[c] !== cc[c])) {
        bt(i + 1);
      }
    }
    rowSum[r] -= (c + 1);
    colSum[c] -= (r + 1);
  }

  bt(0);
  return count;
}

// Validate a single level. Returns null if OK, error string otherwise.
function validateLevel(lv) {
  const n = lv.n;
  if (!Number.isInteger(n) || n < 2 || n > 9) return `bad grid size ${n}`;
  const fullSum = n * (n + 1) / 2;
  if (!Array.isArray(lv.rc) || lv.rc.length !== n) return 'rc wrong length';
  if (!Array.isArray(lv.cc) || lv.cc.length !== n) return 'cc wrong length';
  for (const v of lv.rc) {
    if (!Number.isInteger(v) || v < 0 || v > fullSum) return `bad rc ${v}`;
  }
  for (const v of lv.cc) {
    if (!Number.isInteger(v) || v < 0 || v > fullSum) return `bad cc ${v}`;
  }
  if (!Array.isArray(lv.given)) return 'given not array';
  for (const g of lv.given) {
    if (!Array.isArray(g) || g.length !== 2) return 'bad given pair';
    const [r, c] = g;
    if (!Number.isInteger(r) || r < 0 || r >= n) return 'bad given r';
    if (!Number.isInteger(c) || c < 0 || c >= n) return 'bad given c';
  }
  return null;
}

let ok = 0;
let fail = 0;
for (const lv of levels) {
  const n = lv.n;
  const err = validateLevel(lv);
  if (err) {
    console.log(`x  level n=${n}: INVALID: ${err}`);
    fail++;
    continue;
  }
  const fixed = Array.from({length: n}, () => new Array(n).fill(undefined));
  for (const [r, c] of lv.given) fixed[r][c] = 1;
  const cnt = countSolutions(n, lv.rc, lv.cc, fixed, 2);
  if (cnt === 1) {
    ok++;
  } else {
    console.log(`x  n=${n} rc=${JSON.stringify(lv.rc)} cc=${JSON.stringify(lv.cc)} given=${lv.given.length}: ${cnt} solutions (NOT UNIQUE)`);
    fail++;
  }
}

console.log(`${ok}/${levels.length} UNIQUE` + (fail ? ` (${fail} FAILED)` : ''));
process.exit(fail ? 1 : 0);