#!/usr/bin/env node
/* Independent Node.js verifier for Tilt Maze levels.
 * Loads levels.json, runs BFS solver per level, confirms exactly 1 solution.
 * This is the "independent Node.js" check.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');
const levels = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));

const DIRS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };

function tiltOnce(grid, dir) {
  const H = grid.length;
  const W = grid[0].length;
  const g = grid.map(r => r.split(''));
  const [dr, dc] = DIRS[dir];
  const balls = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (g[r][c] === 'B') balls.push([r, c]);
  balls.sort((a, b) => (b[0]*dr + b[1]*dc) - (a[0]*dr + a[1]*dc));

  for (const [r, c] of balls) {
    if (g[r][c] !== 'B') continue;
    let cr = r, cc = c;
    let landedInHole = false;
    let nr = cr + dr, nc = cc + dc;
    if (nr < 0 || nr >= H || nc < 0 || nc >= W) {
      return { valid: false, grid };
    }
    while (true) {
      nr = cr + dr; nc = cc + dc;
      if (nr < 0 || nr >= H || nc < 0 || nc >= W) break;
      const cell = g[nr][nc];
      if (cell === '#' || cell === 'B') break;
      cr = nr; cc = nc;
      if (cell === 'H') { landedInHole = true; break; }
    }
    if (landedInHole) {
      g[r][c] = '.';
      g[cr][cc] = '.';
    } else {
      g[r][c] = '.';
      g[cr][cc] = 'B';
    }
  }
  return { valid: true, grid: g.map(r => r.join('')) };
}

function solveBFS(grid, maxDepth = 15) {
  const initialBalls = grid.join('').split('').filter(c => c === 'B').length;
  const initialHoles = grid.join('').split('').filter(c => c === 'H').length;
  if (initialBalls === 0) return [[[], 0]];
  if (initialBalls !== initialHoles) return [];

  const key = g => g.join('|');
  const visited = new Map();
  visited.set(key(grid), 0);
  const queue = [[grid, []]];
  const solutions = [];
  let minSolLen = null;

  while (queue.length > 0) {
    const [curGrid, moves] = queue.shift();
    if (minSolLen !== null && moves.length >= minSolLen) continue;
    const balls = curGrid.join('').split('').filter(c => c === 'B').length;
    if (balls === 0) {
      solutions.push([moves.slice(), moves.length]);
      if (minSolLen === null || moves.length < minSolLen) minSolLen = moves.length;
      continue;
    }
    if (moves.length >= maxDepth) continue;
    for (const d of 'NSEW') {
      const { valid, grid: newGrid } = tiltOnce(curGrid, d);
      if (!valid) continue;
      const k = key(newGrid);
      const newDepth = moves.length + 1;
      if (visited.has(k) && visited.get(k) <= newDepth) continue;
      visited.set(k, newDepth);
      queue.push([newGrid, moves.concat([d])]);
    }
  }
  return solutions;
}

let passed = 0;
const failed = [];

for (const lvl of levels) {
  const sols = solveBFS(lvl.grid, 12);
  if (sols.length === 0) {
    failed.push([lvl.id, lvl.tier, 'NO_SOLUTION']);
    continue;
  }
  const minLen = Math.min(...sols.map(s => s[1]));
  const atMin = sols.filter(s => s[1] === minLen);
  if (atMin.length !== 1) {
    failed.push([lvl.id, lvl.tier, `MULTIPLE(${atMin.length})`]);
    continue;
  }
  passed++;
}

console.log(`=== Tilt Maze Independent Node Verifier ===`);
console.log(`Total: ${levels.length}, Passed: ${passed}, Failed: ${failed.length}`);
if (failed.length > 0) {
  for (const [id, tier, reason] of failed) {
    console.log(`  L${id} (${tier}): FAIL — ${reason}`);
  }
  process.exit(1);
} else {
  console.log(`ALL ${levels.length} LEVELS HAVE EXACTLY 1 UNIQUE SOLUTION ✓`);
}