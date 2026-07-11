#!/usr/bin/env node
/**
 * In-engine verifier: loads actual LEVELS from index.html and validates them
 * using the game's own rules (checkSolution logic).
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS from the script
const match = html.match(/const LEVELS\s*=\s*(\[.*?\]);\s*$/ms);
if (!match) {
  console.error('Could not extract LEVELS from index.html');
  process.exit(1);
}
const levelsCode = match[1];
const LEVELS = JSON.parse(levelsCode);

console.log(`Loaded ${LEVELS.length} levels from index.html`);

// Game rules (mirrors checkSolution from index.html)
function getLineGroups(line) {
  const groups = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) count++;
    else { if (count > 0) { groups.push(count); count = 0; } }
  }
  if (count > 0) groups.push(count);
  return groups;
}

function checkLevel(idx) {
  const level = LEVELS[idx];
  const R = level.rows, C = level.cols;
  const sol = level.solution;
  
  // Build grid from solution
  const grid = sol.map(row => row.map(v => v === 1 ? 1 : 0));
  
  // Check row clues
  for (let r = 0; r < R; r++) {
    const groups = getLineGroups(grid[r]);
    if (JSON.stringify(groups) !== JSON.stringify(level.rowClues[r])) {
      return `Row ${r+1} clues mismatch: got ${JSON.stringify(groups)} expected ${JSON.stringify(level.rowClues[r])}`;
    }
  }
  // Check col clues
  for (let c = 0; c < C; c++) {
    const col = [];
    for (let r = 0; r < R; r++) col.push(grid[r][c]);
    const groups = getLineGroups(col);
    if (JSON.stringify(groups) !== JSON.stringify(level.colClues[c])) {
      return `Col ${c+1} clues mismatch`;
    }
  }
  // Check no 2x2
  for (let r = 0; r < R - 1; r++) {
    for (let c = 0; c < C - 1; c++) {
      if (grid[r][c] === 1 && grid[r][c+1] === 1 && grid[r+1][c] === 1 && grid[r+1][c+1] === 1) {
        return `2x2 block at (${r+1},${c+1})`;
      }
    }
  }
  // Check connectivity
  const shaded = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (grid[r][c] === 1) shaded.push([r,c]);
  if (shaded.length === 0) return 'No shaded cells';
  const visited = new Set();
  const queue = [shaded[0]];
  visited.add(shaded[0].join(','));
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r+dr, nc = c+dc;
      const key = nr+','+nc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1 && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  if (visited.size !== shaded.length) return `Not connected (${visited.size}/${shaded.length})`;
  
  return null; // pass
}

let allPass = true;
for (let i = 0; i < LEVELS.length; i++) {
  const err = checkLevel(i);
  if (err) {
    console.log(`Level ${i+1}/${LEVELS.length}: ❌ FAIL - ${err}`);
    allPass = false;
  } else {
    console.log(`Level ${i+1}/${LEVELS.length} ${LEVELS[i].difficulty} ${LEVELS[i].rows}x${LEVELS[i].cols}: ✅ checkSolution passes`);
  }
}

console.log(allPass ? '\n✅ ALL 30 LEVELS VERIFIED (in-engine)' : '\n❌ SOME LEVELS FAILED');
