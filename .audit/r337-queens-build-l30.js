#!/usr/bin/env node
/* R337 queens — targeted builder for the single hardest level (L30, n=11).
 * Runs the same generator as build3 but with a DIFFERENT seed base and a
 * wider band, so it can finish what the main build is still grinding on.
 */
const G = require('./r337-queens-gen11.js');
const fs = require('fs');
const path = require('path');

const n = 11;
const id = 30;
const band = { min: 3, max: 18 };
const SEEDS = 400;

function bruteCount(n, regions, limit) {
  let count = 0;
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (count >= limit) return;
    if (row === n) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) <= 1 && Math.abs(placed[i] - placed[j]) <= 1) return;
      }
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(placed[row - 1] - c) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}

const t0 = Date.now();
let best = null, bestScore = Infinity;
for (let s = 0; s < SEEDS; s++) {
  const seed = 9000000 + s * 7919;
  const sol = G.ctx.__pq(n, G.mulberry32(seed * 31 + n));
  if (!sol) continue;
  const grid = G.buildUniqueFast(n, sol, G.mulberry32(seed * 7919 + n * 104729), 400000);
  if (!grid) continue;
  G.balanceRegions(n, grid, sol, 400);
  const sizes = new Array(n).fill(0);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] >= 0) sizes[grid[r][c]]++;
  const mn = Math.min(...sizes), mx = Math.max(...sizes);
  const score = Math.max(0, band.min - mn) + Math.max(0, mx - band.max);
  if (score < bestScore) {
    bestScore = score; best = { sol, grid, mn, mx };
    console.log('  seed=' + s + ' candidate sizes ' + mn + '..' + mx + ' score=' + score + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
  }
  if (score === 0) break;
}
if (!best) { console.error('NO MAP'); process.exit(1); }
const exact = G.exactCount(n, best.grid, 5);
const page = G.ctx.__cs(n, best.grid, 5);
const brute = bruteCount(n, best.grid, 5);
const err = G.validate(n, best.grid, best.sol);
const conn = G.connectedOK(n, best.grid);
console.log('FINAL exact=' + exact + ' page=' + page + ' brute=' + brute + ' err=' + err + ' conn=' + conn + ' sizes=' + best.mn + '..' + best.mx);
if (exact === 1 && page === 1 && brute === 1 && err === null && conn) {
  fs.writeFileSync(path.join(__dirname, 'queens-l30.js'),
    'var PUZZLE_DATA_L30=' + JSON.stringify([{ id, n, solution: best.sol, regions: best.grid }]) + ';');
  console.log('wrote queens-l30.js');
} else { console.error('VERIFY FAILED'); process.exit(1); }
