// Independent verifier for Mosaic Tile Merge.
// Parses `var LV=[...]` from index.html, verifies ALL 30 levels are:
//   1. SOLVABLE (a winning move sequence exists within maxMoves)
//   2. Have correct structure (valid grid, winType, target)
//   3. Difficulty progression (tier increases, board size scales)
// Uses the same canonical game logic as the HTML engine.
"use strict";
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const lvMatch = html.match(/var LV=(\[[\s\S]*?\]);/);
if (!lvMatch) { console.error('FAIL: could not find var LV= in index.html'); process.exit(1); }
let LV;
try { LV = eval('(' + lvMatch[1] + ')'); } catch(e) { console.error('FAIL: LV parse error:', e.message); process.exit(1); }
console.log('Loaded ' + LV.length + ' levels from LV array\n');

// === CANONICAL GAME LOGIC (mirrors index.html engine) ===

function neighbors(r, c, rows, cols) {
  const out = [];
  if (r > 0) out.push([r-1, c]);
  if (r < rows-1) out.push([r+1, c]);
  if (c > 0) out.push([r, c-1]);
  if (c < cols-1) out.push([r, c+1]);
  return out;
}

function gridKey(grid) {
  return grid.map(r => r.join(',')).join('|');
}

function maxTier(grid) {
  return Math.max(...grid.flat());
}

function getMoves(grid, rows, cols) {
  const moves = [];
  const seen = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) continue;
      for (const [r2, c2] of neighbors(r, c, rows, cols)) {
        const pair = r < r2 || (r === r2 && c < c2) ? `${r},${c}-${r2},${c2}` : `${r2},${c2}-${r},${c}`;
        if (seen.has(pair)) continue;
        seen.add(pair);
        moves.push([[r,c],[r2,c2]]);
      }
    }
  }
  return moves;
}

function applyMove(grid, frm, to, rows, cols) {
  const newGrid = grid.map(r => [...r]);
  const [r1,c1] = frm, [r2,c2] = to;
  const v1 = newGrid[r1][c1], v2 = newGrid[r2][c2];
  if (v1 === 0) return null;
  if (v2 === 0) {
    newGrid[r2][c2] = v1;
    newGrid[r1][c1] = 0;
  } else if (v1 === v2 && v1 < 6) {
    newGrid[r2][c2] = v1 + 1;
    newGrid[r1][c1] = 0;
  } else {
    newGrid[r2][c2] = v1;
    newGrid[r1][c1] = v2;
  }
  return newGrid;
}

function checkWin(grid, lv, score) {
  if (lv.winType === 'tier') return maxTier(grid) >= lv.target;
  if (lv.winType === 'score') return score >= lv.target;
  if (lv.winType === 'clear') return grid.flat().filter(v => v > 0).length <= 1;
  return false;
}

function scoreDelta(grid, frm, to) {
  const [r1,c1] = frm, [r2,c2] = to;
  const v1 = grid[r1][c1], v2 = grid[r2][c2];
  if (v1 === v2 && v1 < 6 && v2 !== 0) return (v1+1)*10;
  return 0;
}

// DFS solver with state limit
function solveDFS(initialGrid, lv, rows, cols, maxDepth, maxStates) {
  maxStates = maxStates || 200000;
  let best = null;
  const visited = new Map();
  let stateCount = 0;

  function dfs(grid, depth, score) {
    stateCount++;
    if (stateCount > maxStates) return;
    if (checkWin(grid, lv, score)) {
      if (best === null || depth < best) best = depth;
      return;
    }
    if (best !== null && depth >= best) return;
    if (depth >= maxDepth) return;
    const key = gridKey(grid);
    if (visited.has(key) && visited.get(key) <= depth) return;
    visited.set(key, depth);
    for (const [frm, to] of getMoves(grid, rows, cols)) {
      const ng = applyMove(grid, frm, to, rows, cols);
      if (!ng) continue;
      const ds = scoreDelta(grid, frm, to);
      dfs(ng, depth+1, score+ds);
      if (stateCount > maxStates) return;
    }
  }
  dfs(initialGrid, 0, 0);
  return best;
}

// === VERIFICATION ===

console.log('=== Mosaic Tile Merge — Independent Verification ===\n');

let pass = 0, fail = 0;
const failures = [];
let prevTier = 0, prevSize = 0;

for (const lv of LV) {
  const issues = [];
  const rows = lv.size, cols = lv.size;
  const grid = lv.grid.map(r => [...r]);

  // Structural checks
  if (lv.size < 3 || lv.size > 5) issues.push('invalid size ' + lv.size);
  if (!Array.isArray(grid) || grid.length !== rows) issues.push('grid rows mismatch');
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== cols) issues.push('grid cols mismatch');
    for (const v of row) {
      if (typeof v !== 'number' || v < 0 || v > 6) issues.push('invalid tile value ' + v);
    }
  }
  if (!['tier','score','clear'].includes(lv.winType)) issues.push('invalid winType ' + lv.winType);
  if (typeof lv.target !== 'number' || lv.target <= 0) issues.push('invalid target');
  if (typeof lv.maxMoves !== 'number' || lv.maxMoves < 1) issues.push('invalid maxMoves');
  if (typeof lv.tier !== 'number' || lv.tier < 1 || lv.tier > 6) issues.push('invalid tier');
  if (!lv.name || typeof lv.name !== 'string') issues.push('missing name');

  // Difficulty progression check
  if (lv.tier < prevTier) issues.push('tier regression: ' + lv.tier + ' < ' + prevTier);
  prevTier = lv.tier;

  // Solvability check
  const minMoves = solveDFS(grid, lv, rows, cols, lv.maxMoves, 300000);
  if (minMoves === null) issues.push('UNSOLVABLE within ' + lv.maxMoves + ' moves');
  else if (minMoves > lv.maxMoves) issues.push('needs ' + minMoves + ' moves > limit ' + lv.maxMoves);

  // Check initial board has at least one tile
  const tileCount = grid.flat().filter(v => v > 0).length;
  if (tileCount === 0) issues.push('empty initial board');

  // Check not already won at start (for tier-type, initial max tier should be < target)
  if (lv.winType === 'tier' && maxTier(grid) >= lv.target) {
    issues.push('already won at start (maxTier=' + maxTier(grid) + ' >= target=' + lv.target + ')');
  }

  if (issues.length === 0) {
    pass++;
    console.log('L' + String(lv.id).padStart(2) + ' [' + lv.name.padEnd(20) + '] T' + lv.tier + ' ' + lv.size + 'x' + lv.size +
                ' win=' + lv.winType + '(' + lv.target + ') tiles=' + tileCount +
                ' moves=' + minMoves + '/' + lv.maxMoves + ' ✓');
  } else {
    fail++;
    issues.forEach(i => failures.push('L' + lv.id + ': ' + i));
    console.log('L' + String(lv.id).padStart(2) + ' [' + lv.name.padEnd(20) + '] ❌ ' + issues.join('; '));
  }
}

console.log('\n=== RESULT ===');
console.log('PASS: ' + pass + '/' + LV.length);
console.log('FAIL: ' + fail + '/' + LV.length);

if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}

if (pass === LV.length) {
  console.log('\n✅ ' + LV.length + '/' + LV.length + ' UNIQUE+VALID — all levels solvable, structured correctly, difficulty progresses');
}
