#!/usr/bin/env node
// Independent Node.js verifier for Nuranaito levels.
// Reads the in-page LEVELS array from index.html and verifies each puzzle.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KN = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];

function knightCount(blacks, r, c, N) {
  let cnt = 0;
  for (const [dr, dc] of KN) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
      if (blacks.has(nr + ',' + nc)) cnt++;
    }
  }
  return cnt;
}

function has2x2Black(blacks, N) {
  for (let r = 0; r < N - 1; r++) {
    for (let c = 0; c < N - 1; c++) {
      if (blacks.has(r + ',' + c) && blacks.has(r + ',' + (c+1)) &&
          blacks.has((r+1) + ',' + c) && blacks.has((r+1) + ',' + (c+1))) {
        return true;
      }
    }
  }
  return false;
}

function isConnected(blacks, N) {
  if (blacks.size === 0) return false;
  const seen = new Set();
  const queue = [];
  // Find first black
  for (const k of blacks) { queue.push(k); seen.add(k); break; }
  while (queue.length) {
    const [r, c] = queue.shift().split(',').map(Number);
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      const k = nr + ',' + nc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
        if (blacks.has(k) && !seen.has(k)) {
          seen.add(k);
          queue.push(k);
        }
      }
    }
  }
  return seen.size === blacks.size;
}

function validateLevel(level) {
  const N = level.N;
  const blacks = new Set();
  for (const idx of level.b) {
    const r = Math.floor(idx / N), c = idx % N;
    blacks.add(r + ',' + c);
  }
  // Whites: givens + qmarks
  const whites = new Set();
  for (const [idx] of level.g) {
    const r = Math.floor(idx / N), c = idx % N;
    whites.add(r + ',' + c);
  }
  for (const idx of level.q) {
    const r = Math.floor(idx / N), c = idx % N;
    whites.add(r + ',' + c);
  }
  const errors = [];
  for (const w of whites) {
    if (blacks.has(w)) errors.push(`White cell ${w} is also black`);
  }
  for (const [idx, expected] of level.g) {
    const r = Math.floor(idx / N), c = idx % N;
    const actual = knightCount(blacks, r, c, N);
    if (actual !== expected) errors.push(`Clue at (${r},${c}): expected ${expected}, got ${actual}`);
  }
  if (has2x2Black(blacks, N)) errors.push(`2x2 all-black area found`);
  if (!isConnected(blacks, N)) errors.push(`Black cells not all connected`);
  if (blacks.size < 4) errors.push(`Only ${blacks.size} black cells (too few)`);
  return { ok: errors.length === 0, errors };
}

// Extract LEVELS array from index.html
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
// Find "const LEVELS = [...];" within a <script> block
const m = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (!m) {
  console.error('Could not find LEVELS array in index.html');
  process.exit(1);
}
const LEVELS = JSON.parse(m[1]);

let pass = 0;
for (const level of LEVELS) {
  const { ok, errors } = validateLevel(level);
  console.log(`Level ${level.i + 1} (${level.t}, ${level.N}x${level.N}): ${ok ? 'PASS' : 'FAIL'}${!ok ? ' — ' + errors.join('; ') : ''}`);
  if (ok) pass++;
}
console.log(`\nResult: ${pass}/${LEVELS.length} PASS`);
process.exit(pass === LEVELS.length ? 0 : 1);
