#!/usr/bin/env node
/**
 * Independent Node.js solver for Strimko levels.
 * Verifies that each level has EXACTLY ONE valid Latin square solution
 * respecting row, column, and stream constraints.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

function isValid(grid, r, c, num, streams, cellToStream, streamCells, n) {
  // Check row
  for (let cc = 0; cc < n; cc++) {
    if (grid[r][cc] === num) return false;
  }
  // Check col
  for (let rr = 0; rr < n; rr++) {
    if (grid[rr][c] === num) return false;
  }
  // Check stream
  const sIdx = cellToStream[`${r},${c}`];
  for (const [sr, sc] of streamCells[sIdx]) {
    if (grid[sr][sc] === num) return false;
  }
  return true;
}

function countSolutions(clues, streams, n, cap = 2, timeLimitMs = 2000) {
  const start = Date.now();
  const grid = clues.map(row => row.slice());

  const cellToStream = {};
  streams.forEach((s, sIdx) => {
    s.forEach(([r, c]) => {
      cellToStream[`${r},${c}`] = sIdx;
    });
  });
  const streamCells = streams.map(s => s.slice());

  const allMask = (1 << n) - 1;

  function initCandidates() {
    const cands = Array.from({length: n}, () => new Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] !== 0) continue;
        let used = 0;
        for (let cc = 0; cc < n; cc++) {
          if (grid[r][cc] !== 0) used |= 1 << (grid[r][cc] - 1);
        }
        for (let rr = 0; rr < n; rr++) {
          if (grid[rr][c] !== 0) used |= 1 << (grid[rr][c] - 1);
        }
        const sIdx = cellToStream[`${r},${c}`];
        for (const [sr, sc] of streamCells[sIdx]) {
          if (grid[sr][sc] !== 0) used |= 1 << (grid[sr][sc] - 1);
        }
        cands[r][c] = allMask & ~used;
      }
    }
    return cands;
  }

  function findMrv(cands) {
    let best = null;
    let bestCount = n + 1;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] !== 0) continue;
        // popcount
        let m = cands[r][c];
        let cnt = 0;
        while (m) { cnt += m & 1; m >>>= 1; }
        if (cnt === 0) return null;
        if (cnt < bestCount) {
          bestCount = cnt;
          best = [r, c];
          if (cnt === 1) return best;
        }
      }
    }
    return best;
  }

  function verifyCompleteGrid() {
    for (let r = 0; r < n; r++) {
      const sorted = grid[r].slice().sort((a, b) => a - b);
      for (let i = 0; i < n; i++) {
        if (sorted[i] !== i + 1) return false;
      }
    }
    for (let c = 0; c < n; c++) {
      const col = [];
      for (let r = 0; r < n; r++) col.push(grid[r][c]);
      col.sort((a, b) => a - b);
      for (let i = 0; i < n; i++) {
        if (col[i] !== i + 1) return false;
      }
    }
    for (let s = 0; s < streamCells.length; s++) {
      const vals = streamCells[s].map(([r, c]) => grid[r][c]);
      vals.sort((a, b) => a - b);
      for (let i = 0; i < n; i++) {
        if (vals[i] !== i + 1) return false;
      }
    }
    return true;
  }

  function solveRecursive(cands, count) {
    if (Date.now() - start > timeLimitMs) return cap;
    if (count >= cap) return count;
    const mrv = findMrv(cands);
    if (mrv === null) {
      const full = grid.every(row => row.every(v => v !== 0));
      if (!full) return count;
      if (!verifyCompleteGrid()) return count;
      return count + 1;
    }
    const [r, c] = mrv;
    const candsMask = cands[r][c];
    for (let d = 1; d <= n; d++) {
      if (!(candsMask & (1 << (d - 1)))) continue;
      grid[r][c] = d;
      const newCands = cands.map(row => row.slice());
      for (let cc = 0; cc < n; cc++) {
        if (grid[r][cc] === 0) newCands[r][cc] &= ~(1 << (d - 1));
      }
      for (let rr = 0; rr < n; rr++) {
        if (grid[rr][c] === 0) newCands[rr][c] &= ~(1 << (d - 1));
      }
      const sIdx = cellToStream[`${r},${c}`];
      for (const [sr, sc] of streamCells[sIdx]) {
        if (grid[sr][sc] === 0) newCands[sr][sc] &= ~(1 << (d - 1));
      }
      const newCount = solveRecursive(newCands, count);
      if (newCount >= cap) {
        grid[r][c] = 0;
        return newCount;
      }
      grid[r][c] = 0;
      count = newCount;
    }
    return count;
  }

  const cands = initCandidates();
  return solveRecursive(cands, 0);
}

function main() {
  const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const levels = data.levels;
  console.log(`Independent Strimko verifier: ${levels.length} levels`);

  let passed = 0;
  let failed = 0;
  for (const lvl of levels) {
    const n = lvl.n;
    // Convert streams to [[r,c],...] tuples
    const streams = lvl.streams.map(s => s.map(c => [c[0], c[1]]));
    const clues = lvl.clues;

    const cnt = countSolutions(clues, streams, n, 2);
    if (cnt === 1) {
      const clueCount = clues.reduce((acc, row) => acc + row.filter(v => v !== 0).length, 0);
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}] ${n}x${n}: PASS (1 unique solution, clues=${clueCount}/${n*n})`);
      passed++;
    } else {
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}] ${n}x${n}: FAIL (${cnt} solutions found)`);
      failed++;
    }
  }

  console.log('');
  console.log(`Result: ${passed}/${levels.length} UNIQUE, ${failed}/${levels.length} NON-UNIQUE`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
