#!/usr/bin/env node
// Kurodoko level generator v4 — constraint-propagation solver for fast uniqueness.
//
// Each cell domain: {white, black} represented as bitmask 0b11 = both possible.
// Propagation rules:
//   1. Row r: if #known-white == rowHint[r], remove white from remaining unknown cells in row.
//      If #known-white + #unknown == rowHint[r], remove black (force white) from unknowns.
//   2. Same for columns.
//   3. No-2x2-black: if 3 of a 2x2 are black and 4th unknown, force 4th white.
//   4. Connectivity: skip during propagation (too expensive); verify at end.
// Then DFS with MRV (pick unknown cell in row/col with fewest remaining unknowns).
//
// This is MUCH faster than naive backtracking because propagation eliminates branches early.
'use strict';

const WHITE = 1, BLACK = 2, BOTH = 3; // bitmasks

function solveCount(rows, cols, rowHints, colHints, limit, deadlineMs) {
  // domain[r*cols+c] = bitmask
  const dom = new Uint8Array(rows*cols).fill(BOTH);
  const tStart = Date.now();
  let timedOut = false;
  let count = 0;

  function propagate() {
    // returns false on contradiction
    let changed = true;
    while (changed) {
      changed = false;
      // Row constraints
      for (let r = 0; r < rows; r++) {
        let knownW = 0, knownB = 0, unknowns = [];
        for (let c = 0; c < cols; c++) {
          const d = dom[r*cols+c];
          if (d === WHITE) knownW++;
          else if (d === BLACK) knownB++;
          else unknowns.push(c);
        }
        const target = rowHints[r];
        if (knownW > target) return false;
        if (knownW === target && unknowns.length > 0) {
          // remaining must be BLACK
          for (const c of unknowns) { if (dom[r*cols+c] & BLACK) { dom[r*cols+c] = BLACK; changed = true; } else return false; }
        }
        if (knownW + unknowns.length === target && unknowns.length > 0) {
          // remaining must be WHITE
          for (const c of unknowns) { if (dom[r*cols+c] & WHITE) { dom[r*cols+c] = WHITE; changed = true; } else return false; }
        }
      }
      // Col constraints
      for (let c = 0; c < cols; c++) {
        let knownW = 0, knownB = 0, unknowns = [];
        for (let r = 0; r < rows; r++) {
          const d = dom[r*cols+c];
          if (d === WHITE) knownW++;
          else if (d === BLACK) knownB++;
          else unknowns.push(r);
        }
        const target = colHints[c];
        if (knownW > target) return false;
        if (knownW === target && unknowns.length > 0) {
          for (const r of unknowns) { if (dom[r*cols+c] & BLACK) { dom[r*cols+c] = BLACK; changed = true; } else return false; }
        }
        if (knownW + unknowns.length === target && unknowns.length > 0) {
          for (const r of unknowns) { if (dom[r*cols+c] & WHITE) { dom[r*cols+c] = WHITE; changed = true; } else return false; }
        }
      }
      // No-2x2-black
      for (let r = 0; r < rows-1; r++) {
        for (let c = 0; c < cols-1; c++) {
          const a = dom[r*cols+c], b = dom[r*cols+c+1], cc = dom[(r+1)*cols+c], d = dom[(r+1)*cols+c+1];
          // count blacks among known
          const cells = [[r,c,a],[r,c+1,b],[r+1,c,cc],[r+1,c+1,d]];
          let blacks = 0, unknownIdx = -1;
          for (let i = 0; i < 4; i++) {
            if (cells[i][2] === BLACK) blacks++;
            else if (cells[i][2] === BOTH) { if (unknownIdx !== -1) { unknownIdx = -2; break; } unknownIdx = i; }
          }
          if (blacks === 3 && unknownIdx >= 0) {
            // force the 4th to WHITE
            const [rr, cc2] = cells[unknownIdx];
            if (dom[rr*cols+cc2] & WHITE) { dom[rr*cols+cc2] = WHITE; changed = true; } else return false;
          }
        }
      }
    }
    return true;
  }

  function isFullyAssigned() {
    for (let i = 0; i < dom.length; i++) if (dom[i] === BOTH) return false;
    return true;
  }

  function verifySolution() {
    // build grid, check all constraints
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push(dom[r*cols+c] === BLACK);
      grid.push(row);
    }
    // row/col counts
    for (let r = 0; r < rows; r++) {
      let w = 0; for (let c = 0; c < cols; c++) if (!grid[r][c]) w++;
      if (w !== rowHints[r]) return false;
    }
    for (let c = 0; c < cols; c++) {
      let w = 0; for (let r = 0; r < rows; r++) if (!grid[r][c]) w++;
      if (w !== colHints[c]) return false;
    }
    // no 2x2
    for (let r = 0; r < rows-1; r++)
      for (let c = 0; c < cols-1; c++)
        if (grid[r][c]&&grid[r+1][c]&&grid[r][c+1]&&grid[r+1][c+1]) return false;
    // connected
    return whiteConnected(grid, rows, cols);
  }

  function whiteConnected(grid, rows, cols) {
    let start = null;
    for (let r = 0; r < rows && !start; r++)
      for (let c = 0; c < cols && !start; c++) if (!grid[r][c]) start = [r, c];
    if (!start) return false;
    const seen = new Uint8Array(rows*cols);
    const stack = [start[0]*cols+start[1]];
    seen[stack[0]] = 1;
    let wt = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!grid[r][c]) wt++;
    let vis = 0;
    while (stack.length) {
      const k = stack.pop(); vis++;
      const r = (k/cols)|0, c = k%cols;
      if (r>0&&!grid[r-1][c]&&!seen[k-cols]){seen[k-cols]=1;stack.push(k-cols);}
      if (r<rows-1&&!grid[r+1][c]&&!seen[k+cols]){seen[k+cols]=1;stack.push(k+cols);}
      if (c>0&&!grid[r][c-1]&&!seen[k-1]){seen[k-1]=1;stack.push(k-1);}
      if (c<cols-1&&!grid[r][c+1]&&!seen[k+1]){seen[k+1]=1;stack.push(k+1);}
    }
    return vis === wt;
  }

  function search() {
    if (count >= limit || timedOut) return;
    if (Date.now() - tStart > deadlineMs) { timedOut = true; return; }
    const saved = new Uint8Array(dom);
    if (!propagate()) { dom.set(saved); return; }
    if (count >= limit) { dom.set(saved); return; }
    if (isFullyAssigned()) {
      if (verifySolution()) count++;
      dom.set(saved);
      return;
    }
    // MRV: find unknown cell in the row with fewest unknowns (most constrained)
    let bestIdx = -1, bestScore = Infinity;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (dom[r*cols+c] === BOTH) {
          // score: prefer cells where row or col has many knowns
          let rk = 0; for (let cc2 = 0; cc2 < cols; cc2++) if (dom[r*cols+cc2] !== BOTH) rk++;
          let ck = 0; for (let rr = 0; rr < rows; rr++) if (dom[rr*cols+c] !== BOTH) ck++;
          const score = -(rk + ck);
          if (score < bestScore) { bestScore = score; bestIdx = r*cols+c; }
        }
      }
    }
    if (bestIdx === -1) { dom.set(saved); return; }
    // try WHITE then BLACK
    dom[bestIdx] = WHITE;
    search();
    if (count >= limit) { dom.set(saved); return; }
    dom[bestIdx] = BLACK;
    search();
    dom.set(saved);
  }

  search();
  return { count, timedOut };
}

// ---- build solution (same random approach) ----
function no2x2Black(grid, rows, cols) {
  for (let r = 0; r < rows-1; r++)
    for (let c = 0; c < cols-1; c++)
      if (grid[r][c]&&grid[r+1][c]&&grid[r][c+1]&&grid[r+1][c+1]) return false;
  return true;
}
function rowCounts(grid, rows, cols) {
  const o = new Array(rows);
  for (let r = 0; r < rows; r++) { let n=0; for (let c=0;c<cols;c++) if(!grid[r][c]) n++; o[r]=n; }
  return o;
}
function colCounts(grid, rows, cols) {
  const o = new Array(cols);
  for (let c = 0; c < cols; c++) { let n=0; for (let r=0;r<rows;r++) if(!grid[r][c]) n++; o[c]=n; }
  return o;
}
function whiteConnected(grid, rows, cols) {
  let start = null;
  for (let r = 0; r < rows && !start; r++)
    for (let c = 0; c < cols && !start; c++) if (!grid[r][c]) start = [r, c];
  if (!start) return false;
  const seen = new Uint8Array(rows*cols);
  const stack = [start[0]*cols+start[1]]; seen[stack[0]] = 1;
  let wt = 0; for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) if(!grid[r][c]) wt++;
  let vis = 0;
  while (stack.length) {
    const k = stack.pop(); vis++;
    const r=(k/cols)|0, c=k%cols;
    if (r>0&&!grid[r-1][c]&&!seen[k-cols]){seen[k-cols]=1;stack.push(k-cols);}
    if (r<rows-1&&!grid[r+1][c]&&!seen[k+cols]){seen[k+cols]=1;stack.push(k+cols);}
    if (c>0&&!grid[r][c-1]&&!seen[k-1]){seen[k-1]=1;stack.push(k-1);}
    if (c<cols-1&&!grid[r][c+1]&&!seen[k+1]){seen[k+1]=1;stack.push(k+1);}
  }
  return vis === wt;
}
function buildSolution(rows, cols, blackRatio, rng) {
  const targetBlack = Math.max(1, Math.floor(rows*cols*blackRatio*(0.7+rng()*0.6)));
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r,c]);
  for (let i = cells.length-1; i > 0; i--) { const j=(rng()*(i+1))|0; const t=cells[i];cells[i]=cells[j];cells[j]=t; }
  const grid = Array.from({length:rows},()=>new Array(cols).fill(false));
  let placed = 0;
  for (const [r,c] of cells) {
    if (placed >= targetBlack) break;
    grid[r][c] = true;
    if (!no2x2Black(grid, rows, cols)) { grid[r][c]=false; continue; }
    placed++;
  }
  if (whiteConnected(grid, rows, cols) && no2x2Black(grid, rows, cols)) return grid;
  return null;
}
function generateUnique(rows, cols, blackRatio, maxAttempts, rng, budgetMs) {
  for (let a = 0; a < maxAttempts; a++) {
    const sol = buildSolution(rows, cols, blackRatio, rng);
    if (!sol) continue;
    const rh = rowCounts(sol, rows, cols);
    const ch = colCounts(sol, rows, cols);
    const t0 = Date.now();
    const { count, timedOut } = solveCount(rows, cols, rh, ch, 2, budgetMs);
    const dt = Date.now() - t0;
    if (!timedOut && count === 1) {
      const solInt = sol.map(row => row.map(v => v ? 1 : 0));
      return { rows, cols, row_hints: rh, col_hints: ch, solution_grid: solInt, solve_ms: dt };
    }
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

const TIERS = [
  { name: 'Beginner', size: 5, count: 6, ratio: 0.26, budget: 500,  attempts: 50 },
  { name: 'Easy',     size: 6, count: 6, ratio: 0.32, budget: 800,  attempts: 60 },
  { name: 'Medium',   size: 7, count: 6, ratio: 0.36, budget: 1500, attempts: 80 },
  { name: 'Hard',     size: 8, count: 6, ratio: 0.40, budget: 3000, attempts: 100 },
  { name: 'Master',   size: 9, count: 6, ratio: 0.42, budget: 5000, attempts: 150 },
];

const rng = mulberry32(20260702);
const allLevels = [];
let tierIdx = 0;
const t0total = Date.now();

for (const tier of TIERS) {
  process.stderr.write(`\nGenerating ${tier.name} (${tier.size}x${tier.size}, ratio=${tier.ratio}, budget=${tier.budget}ms, attempts=${tier.attempts})...\n`);
  let made = 0, rounds = 0;
  const tierT0 = Date.now();
  while (made < tier.count && rounds < 5) {
    rounds++;
    const lvl = generateUnique(tier.size, tier.size, tier.ratio, tier.attempts, rng, tier.budget);
    if (!lvl) {
      process.stderr.write(`  (round ${rounds} produced nothing in ${((Date.now()-tierT0)/1000).toFixed(1)}s)\n`);
      continue;
    }
    lvl.tier = tier.name; lvl.tier_idx = tierIdx; lvl.id = `${tier.name.toLowerCase()}_${made+1}`;
    const base = tier.size*tier.size*4; lvl.stars = [base, base*2, base*3];
    allLevels.push(lvl); made++;
    process.stderr.write(`  [${made}/${tier.count}] ${lvl.id} solve=${lvl.solve_ms}ms\n`);
  }
  if (made < tier.count) process.stderr.write(`  WARNING: only made ${made}/${tier.count} for ${tier.name}\n`);
  tierIdx++;
}
const dtTotal = ((Date.now()-t0total)/1000).toFixed(2);
process.stderr.write(`\n=== Total: ${allLevels.length} levels in ${dtTotal}s ===\n`);
process.stdout.write(JSON.stringify(allLevels));
