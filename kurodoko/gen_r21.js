#!/usr/bin/env node
// Kurodoko level generator for R21 upgrade — Node.js, strong pruning solver
// Row-major order + aggressive running-count pruning makes this tractable for 9x9.
'use strict';

function whiteConnected(grid, rows, cols) {
  let start = null;
  for (let r = 0; r < rows && !start; r++) {
    for (let c = 0; c < cols && !start; c++) if (!grid[r][c]) start = [r, c];
  }
  if (!start) return false;
  const seen = new Uint8Array(rows*cols);
  const stack = [start[0]*cols + start[1]];
  seen[stack[0]] = 1;
  let whiteTotal = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!grid[r][c]) whiteTotal++;
  let visited = 0;
  while (stack.length) {
    const k = stack.pop();
    visited++;
    const r = Math.floor(k/cols), c = k%cols;
    if (r > 0 && !grid[r-1][c] && !seen[k-cols]) { seen[k-cols]=1; stack.push(k-cols); }
    if (r < rows-1 && !grid[r+1][c] && !seen[k+cols]) { seen[k+cols]=1; stack.push(k+cols); }
    if (c > 0 && !grid[r][c-1] && !seen[k-1]) { seen[k-1]=1; stack.push(k-1); }
    if (c < cols-1 && !grid[r][c+1] && !seen[k+1]) { seen[k+1]=1; stack.push(k+1); }
  }
  return visited === whiteTotal;
}

function no2x2Black(grid, rows, cols) {
  for (let r = 0; r < rows-1; r++)
    for (let c = 0; c < cols-1; c++)
      if (grid[r][c] && grid[r+1][c] && grid[r][c+1] && grid[r+1][c+1]) return false;
  return true;
}

function rowCounts(grid, rows, cols) {
  const out = new Array(rows);
  for (let r = 0; r < rows; r++) { let n=0; for (let c=0;c<cols;c++) if(!grid[r][c]) n++; out[r]=n; }
  return out;
}
function colCounts(grid, rows, cols) {
  const out = new Array(cols);
  for (let c = 0; c < cols; c++) { let n=0; for (let r=0;r<rows;r++) if(!grid[r][c]) n++; out[c]=n; }
  return out;
}

// Row-major solver: fill row-by-row, cell-by-cell.
// Pruning at each placement:
//  - no 2x2 black (check 2x2 ending at this cell if black)
//  - running row white count <= rowHint[r]
//  - running col white count <= colHint[c]
//  - when finishing a row: row white count == rowHint[r]
//  - when finishing a column (bottom row): col white count == colHint[c]
//  - connectivity check only at end (too expensive per-step)
function countSolutions(rows, cols, rowHints, colHints, limit, timeLimitMs) {
  const grid = Array.from({length: rows}, () => new Array(cols).fill(false));
  const rowWhiteSoFar = new Array(rows).fill(0);  // whites in completed cells of row r
  const colWhiteSoFar = new Array(cols).fill(0);  // whites in completed cells of col c
  let count = 0;
  const tStart = Date.now();

  function place(idx) {
    if (count >= limit) return;
    if (Date.now() - tStart > timeLimitMs) return; // time budget exhausted
    if (idx === rows * cols) {
      // full check
      for (let r = 0; r < rows; r++) if (rowWhiteSoFar[r] !== rowHints[r]) return;
      for (let c = 0; c < cols; c++) if (colWhiteSoFar[c] !== colHints[c]) return;
      if (!whiteConnected(grid, rows, cols)) return;
      // no2x2 already enforced incrementally
      count++;
      return;
    }
    const r = Math.floor(idx/cols), c = idx%cols;
    const isLastInRow = (c === cols-1);
    const isLastInCol = (r === rows-1);

    // Try WHITE first
    grid[r][c] = false;
    rowWhiteSoFar[r]++;
    colWhiteSoFar[c]++;
    // prune: row white count
    let okRow = rowWhiteSoFar[r] <= rowHints[r];
    let okCol = colWhiteSoFar[c] <= colHints[c];
    if (okRow && isLastInRow) okRow = rowWhiteSoFar[r] === rowHints[r];
    if (okCol && isLastInCol) okCol = colWhiteSoFar[c] === colHints[c];
    if (okRow && okCol) {
      place(idx+1);
    }
    rowWhiteSoFar[r]--;
    colWhiteSoFar[c]--;

    if (count >= limit) return;

    // Try BLACK
    grid[r][c] = true;
    // prune: no 2x2 black — check the 2x2 ending at (r,c) [upper-left at (r-1,c-1)]
    let blackOk = true;
    if (r > 0 && c > 0 && grid[r-1][c-1] && grid[r-1][c] && grid[r][c-1] && grid[r][c]) blackOk = false;
    // Also need to check 2x2 that has this cell as upper-left (will be caught when its bottom-right is placed later,
    // but we can also check 2x2 with this as top-left now — only meaningful if r+1,c+1 already... no, they're not placed yet)
    // We rely on the bottom-right check. Good.
    if (blackOk && isLastInRow && rowWhiteSoFar[r] !== rowHints[r]) blackOk = false;
    if (blackOk && isLastInCol && colWhiteSoFar[c] !== colHints[c]) blackOk = false;
    // row/col hint feasibility: even if all remaining cells in this row are white, can we reach the hint?
    if (blackOk) {
      const remRow = cols - c - 1;
      if (rowWhiteSoFar[r] + remRow < rowHints[r]) blackOk = false;
    }
    if (blackOk) {
      const remCol = rows - r - 1;
      if (colWhiteSoFar[c] + remCol < colHints[c]) blackOk = false;
    }
    if (blackOk) {
      place(idx+1);
    }
    grid[r][c] = false;
  }
  place(0);
  return count;
}

// build a valid solution (same as before)
function buildSolution(rows, cols, blackRatio, rng) {
  const nCells = rows * cols;
  const targetBlack = Math.max(1, Math.floor(nCells * blackRatio * (0.7 + rng()*0.6)));
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
  for (let i = cells.length-1; i > 0; i--) {
    const j = Math.floor(rng()*(i+1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const grid = Array.from({length: rows}, () => new Array(cols).fill(false));
  let placed = 0;
  for (const [r, c] of cells) {
    if (placed >= targetBlack) break;
    grid[r][c] = true;
    if (!no2x2Black(grid, rows, cols)) { grid[r][c] = false; continue; }
    placed++;
  }
  if (whiteConnected(grid, rows, cols) && no2x2Black(grid, rows, cols)) return grid;
  return null;
}

function generateUnique(rows, cols, blackRatio, maxAttempts, rng, timeBudgetMs) {
  for (let a = 0; a < maxAttempts; a++) {
    const sol = buildSolution(rows, cols, blackRatio, rng);
    if (!sol) continue;
    const rh = rowCounts(sol, rows, cols);
    const ch = colCounts(sol, rows, cols);
    // uniqueness check with time budget
    const t0 = Date.now();
    const n = countSolutions(rows, cols, rh, ch, 2, timeBudgetMs);
    const dt = Date.now() - t0;
    if (n === 1) {
      const solInt = sol.map(row => row.map(v => v ? 1 : 0));
      return { rows, cols, row_hints: rh, col_hints: ch, solution_grid: solInt, solve_ms: dt };
    }
    // if timed out (n===0 because we bailed), treat as non-unique and retry
  }
  return null;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tier config: grid, count, blackRatio, solver time budget per uniqueness check (ms)
const TIERS = [
  { name: 'Beginner', size: 5, count: 6, ratio: 0.22, budget: 500 },
  { name: 'Easy',     size: 6, count: 6, ratio: 0.26, budget: 1000 },
  { name: 'Medium',   size: 7, count: 6, ratio: 0.30, budget: 2500 },
  { name: 'Hard',     size: 8, count: 6, ratio: 0.32, budget: 5000 },
  { name: 'Master',   size: 9, count: 6, ratio: 0.34, budget: 8000 },
];

const rng = mulberry32(20260702);
const allLevels = [];
let tierIdx = 0;
const t0 = Date.now();

for (const tier of TIERS) {
  process.stderr.write(`Generating ${tier.name} (${tier.size}x${tier.size}, budget=${tier.budget}ms/uniqueness)...\n`);
  let made = 0, attempts = 0;
  while (made < tier.count && attempts < tier.count * 40) {
    attempts++;
    const lvl = generateUnique(tier.size, tier.size, tier.ratio, 30, rng, tier.budget);
    if (!lvl) continue;
    lvl.tier = tier.name;
    lvl.tier_idx = tierIdx;
    lvl.id = `${tier.name.toLowerCase()}_${made+1}`;
    const base = tier.size * tier.size * 4;
    lvl.stars = [base, base*2, base*3];
    allLevels.push(lvl);
    made++;
    process.stderr.write(`  [${made}/${tier.count}] ${lvl.id} rh=[${lvl.row_hints.join(',')}] solve=${lvl.solve_ms}ms\n`);
  }
  if (made < tier.count) process.stderr.write(`  WARNING: only made ${made}/${tier.count} for ${tier.name}\n`);
  tierIdx++;
}
const dt = ((Date.now()-t0)/1000).toFixed(2);
process.stderr.write(`\nTotal: ${allLevels.length} levels in ${dt}s\n`);
process.stdout.write(JSON.stringify(allLevels));
