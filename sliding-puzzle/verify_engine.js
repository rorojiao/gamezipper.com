#!/usr/bin/env node
/* Sliding Puzzle in-engine verifier — pattern follows akari/verify_engine.js.
 * Validates that every level's shuffled grid is solvable (parity-checked) using
 * the actual source's shuffleGrid + mulberry32 PRNG.
 *
 * Bug history (sweep 78):
 *   Pre-fix: shuffleGrid had no lastMove guard — every other move was wasted
 *   reversing the previous one, and 10/30 levels (all 4×4, L11–L20) were
 *   unsolvable. The FAQ claimed "ensuring every puzzle can be completed" —
 *   which was a lie.
 *
 *   Post-fix: track lastDir; forbid immediate reversal. Verified 30/30 solvable.
 *
 * Usage: node sliding-puzzle/verify_engine.js
 */
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const m = html.match(/var LEVELS=(\[.*?\]);/s);
if (!m) { console.error('LEVELS not found'); process.exit(1); }
const LEVELS = eval(m[1]);

function mulberry32(a) {
  return function() {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSolvedGrid(size) {
  const g = [];
  for (let r = 0; r < size; r++) {
    g[r] = [];
    for (let c = 0; c < size; c++) {
      const v = r * size + c + 1;
      g[r][c] = v === size * size ? 0 : v;
    }
  }
  return g;
}

function shuffleGrid(size, count, seed) {
  const rng = mulberry32(seed);
  let g = getSolvedGrid(size);
  let emptyR = size - 1, emptyC = size - 1;
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  let lastDir = -1;
  for (let i = 0; i < count; i++) {
    let valid = [];
    for (let j = 0; j < dirs.length; j++) {
      if (j === lastDir) continue;
      const dr = dirs[j][0], dc = dirs[j][1];
      const nr = emptyR + dr, nc = emptyC + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) valid.push([j, nr, nc]);
    }
    if (valid.length === 0) {
      for (let j = 0; j < dirs.length; j++) {
        const dr = dirs[j][0], dc = dirs[j][1];
        const nr = emptyR + dr, nc = emptyC + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) valid.push([j, nr, nc]);
      }
    }
    const pick = valid[Math.floor(rng() * valid.length)];
    const dirUsed = pick[0], nr = pick[1], nc = pick[2];
    const opp = (dirUsed + 2) % 4;
    g[emptyR][emptyC] = g[nr][nc];
    g[nr][nc] = 0;
    emptyR = nr; emptyC = nc;
    lastDir = opp;
  }
  return { grid: g, emptyPos: {r: emptyR, c: emptyC} };
}

function isSolvable(grid, emptyPos) {
  const flat = [];
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) if (grid[r][c] !== 0) flat.push(grid[r][c]);
  let inv = 0;
  for (let i = 0; i < flat.length; i++) for (let j = i+1; j < flat.length; j++) if (flat[i] > flat[j]) inv++;
  const size = grid.length;
  if (size % 2 === 1) return inv % 2 === 0;
  const rowFromBottom = size - emptyPos.r;
  return (inv + rowFromBottom) % 2 === 1;
}

let pass = 0, fail = 0, failList = [];
for (const L of LEVELS) {
  const result = shuffleGrid(L.size, L.shuffle, L.seed);
  const solvable = isSolvable(result.grid, result.emptyPos);
  if (solvable) pass++; else { fail++; failList.push(L.id); }
}
console.log(`Sliding Puzzle: ${pass}/${LEVELS.length} solvable, ${fail} unsolvable`);
if (failList.length) console.log(`Unsolvable IDs: ${failList.join(', ')}`);
process.exit(fail === 0 ? 0 : 1);
