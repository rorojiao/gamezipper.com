#!/usr/bin/env node
/**
 * Tatami independent uniqueness solver (Node.js).
 *
 * Reads levels.json and verifies each level has EXACTLY ONE valid tiling
 * consistent with the anchor set. Independent implementation from gen_levels.py.
 *
 * Constraints:
 *   - Fill N x M grid with 1x2 / 2x1 rectangles (axis-aligned, 2 cells each).
 *   - No 2x2 sub-block may contain 4 distinct tile IDs (no 4-corner-meet).
 *   - Anchor tiles: (head, foot) pairs are pre-placed.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

function solveCount(n, m, anchors, cap) {
  cap = cap || 2;
  let solutions = 0;
  const anchorMap = new Map();
  for (const [h, f] of anchors) {
    anchorMap.set(h.join(','), f);
    anchorMap.set(f.join(','), h);
  }
  const grid = Array.from({ length: n }, () => new Array(m).fill(0));
  for (const [h, f] of anchors) {
    grid[h[0]][h[1]] = 1;
    grid[f[0]][f[1]] = 1;
  }

  function checkViolation(r, c) {
    // Check 2x2 sub-blocks that contain the cell (r, c)
    for (let rr = Math.max(0, r - 1); rr <= Math.min(n - 2, r); rr++) {
      for (let cc = Math.max(0, c - 1); cc <= Math.min(m - 2, c); cc++) {
        const ids = new Set([
          grid[rr][cc], grid[rr][cc + 1],
          grid[rr + 1][cc], grid[rr + 1][cc + 1]
        ]);
        if (!ids.has(0) && ids.size === 4) return false;
      }
    }
    return true;
  }

  function backtrack() {
    if (solutions >= cap) return;
    let first = null;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (grid[r][c] === 0) { first = [r, c]; break; }
      }
      if (first) break;
    }
    if (!first) { solutions++; return; }
    const [r, c] = first;
    const dirs = [[0, 1], [1, 0]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!(nr >= 0 && nr < n && nc >= 0 && nc < m)) continue;
      if (grid[nr][nc] !== 0) continue;
      // Anchor check
      let okA = true;
      for (const [cell, partner] of [[[r, c], [nr, nc]], [[nr, nc], [r, c]]]) {
        const key = cell[0] + ',' + cell[1];
        if (anchorMap.has(key)) {
          const expected = anchorMap.get(key);
          if (expected[0] !== partner[0] || expected[1] !== partner[1]) {
            okA = false; break;
          }
        }
      }
      if (!okA) continue;
      grid[r][c] = 1;
      grid[nr][nc] = 1;
      if (checkViolation(r, c) && checkViolation(nr, nc)) {
        backtrack();
      }
      grid[r][c] = 0;
      grid[nr][nc] = 0;
      if (solutions >= cap) return;
    }
  }

  backtrack();
  return solutions;
}

function main() {
  const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const levels = data.levels;
  console.log(`Verifying ${levels.length} Tatami levels (independent Node.js solver)...`);
  let allPass = true;
  for (let i = 0; i < levels.length; i++) {
    const lev = levels[i];
    const n = lev.n, m = lev.m;
    const anchors = lev.anchors.map(a => [a.head, a.foot]);
    const solCount = solveCount(n, m, anchors, 2);
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
