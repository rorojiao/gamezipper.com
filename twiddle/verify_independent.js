// verify_independent.js — Independent Twiddle level verifier.
// DIFFERENT implementation from gen.py (pure JS, no shared code).
//
// For each level in levels.json it checks:
//   (1) board is a valid permutation of 1..N^2
//   (2) board is not already solved
//   (3) the stored solution, when replayed, reaches the sorted board
//       (independent confirmation the solution path is correct)
//   (4) for 3x3 grids: a from-scratch BFS confirms the scrambled board is
//       genuinely reachable to sorted order (does NOT use the stored solution)
//
// All 27 must pass UNIQUE-VALID. Twiddle has a single goal state (sorted) so
// "uniqueness" = exactly one target; every reachable scramble is solvable to it.
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = data.levels;

function target(n) {
  const a = [];
  for (let i = 1; i <= n * n; i++) a.push(i);
  return a;
}

// Rotate 2x2 block with top-left at (r,c). dir +1 = clockwise, -1 = ccw.
function rotate(b, n, r, c, dir) {
  const idx = (rr, cc) => rr * n + cc;
  const tl = idx(r, c), tr = idx(r, c + 1), bl = idx(r + 1, c), br = idx(r + 1, c + 1);
  const o = [b[tl], b[tr], b[bl], b[br]]; // tl,tr,bl,br
  if (dir === 1) {            // cw: tl<-bl, tr<-tl, br<-tr, bl<-br
    b[tl] = o[2]; b[tr] = o[0]; b[br] = o[1]; b[bl] = o[3];
  } else {                    // ccw: tl<-tr, bl<-tl, br<-bl, tr<-br
    b[tl] = o[1]; b[bl] = o[0]; b[br] = o[2]; b[tr] = o[3];
  }
}

function isSorted(b) {
  for (let i = 0; i < b.length; i++) if (b[i] !== i + 1) return false;
  return true;
}

// BFS from a board to sorted, for small grids (3x3). Returns true if reachable.
function bfsSolvable(start, n) {
  const goal = target(n).join(',');
  const startKey = start.join(',');
  if (startKey === goal) return true;
  const seen = new Set([startKey]);
  const queue = [start.slice()];
  let head = 0;
  let count = 0;
  while (head < queue.length) {
    const b = queue[head++];
    if (++count > 500000) break; // safety cap
    for (let r = 0; r < n - 1; r++) {
      for (let c = 0; c < n - 1; c++) {
        for (const dir of [1, -1]) {
          const nb = b.slice();
          rotate(nb, n, r, c, dir);
          const k = nb.join(',');
          if (k === goal) return true;
          if (!seen.has(k)) { seen.add(k); queue.push(nb); }
        }
      }
    }
  }
  return seen.has(goal);
}

let pass = 0, fail = 0;
const t0 = Date.now();

for (const lv of levels) {
  const n = lv.size;
  const board = lv.board.slice();
  const errs = [];

  // (1) valid permutation of 1..N^2
  const sortedCopy = board.slice().sort((a, b) => a - b);
  const expect = target(n);
  for (let i = 0; i < expect.length; i++) {
    if (sortedCopy[i] !== expect[i]) { errs.push('invalid permutation'); break; }
  }
  // (2) not already solved
  if (isSorted(board)) errs.push('already solved');
  // (3) replay stored solution -> must reach sorted
  const testBoard = board.slice();
  for (const m of lv.solution) {
    const [r, c, d] = m;
    if (r < 0 || c < 0 || r > n - 2 || c > n - 2) { errs.push('solution move out of range'); break; }
    rotate(testBoard, n, r, c, d);
  }
  if (!isSorted(testBoard)) errs.push('stored solution does NOT solve board');
  // (4) BFS reachability for 3x3
  if (n === 3) {
    if (!bfsSolvable(board, n)) errs.push('BFS: not reachable (3x3)');
  }

  if (errs.length) {
    fail++;
    console.log(`❌ Level ${lv.id} (${lv.tier} ${n}x${n}) depth ${lv.depth}: ${errs.join('; ')}`);
  } else {
    pass++;
    console.log(`✅ Level ${lv.id} (${lv.tier} ${n}x${n}) depth ${lv.depth}: valid+solvable${n === 3 ? ' (BFS confirmed)' : ''}`);
  }
}

console.log(`\n${pass}/${levels.length} PASS, ${fail} FAIL in ${Date.now() - t0}ms`);
process.exit(fail === 0 ? 0 : 1);
