// fill-fridge per-level solvability verifier
// Reads LEVELS + SHAPES from index.html (READ-ONLY) and exhaustively
// solves each level using a backtracking bin-packing solver.
// Each level has a fridge grid (cols × rows) + a set of polyomino items.
// Win condition: place every item (no overlap, all cells filled).
// Verdict per level:
//   SOLVED       - backtracking found a valid placement
//   UNSOLVABLE   - state space fully exhausted (proof)
//   INCONCLUSIVE - exceeded budget (default 30s or 5M placements)

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_HTML = path.join(__dirname, 'index.html');
const html = fs.readFileSync(GAME_HTML, 'utf8');

// Extract SHAPES and LEVELS via vm
const sandbox = {};
vm.createContext(sandbox);
// Extract SHAPES, ITEM_STYLES, makeLevel, LEVELS via vm (use var so they attach to sandbox)
const scriptText = [
  html.match(/const SHAPES\s*=\{[\s\S]*?\};/)[0].replace(/^const SHAPES/, 'var SHAPES'),
  html.match(/const ITEM_STYLES\s*=\[[\s\S]*?\];/)[0].replace(/^const ITEM_STYLES/, 'var ITEM_STYLES'),
  html.match(/function makeLevel\([\s\S]*?\n\}/)[0],
  html.match(/const LEVELS\s*=\[[\s\S]*?\];/)[0].replace(/^const LEVELS/, 'var LEVELS'),
].join('\n');
vm.runInContext(scriptText, sandbox);

const SHAPES = sandbox.SHAPES;
const LEVELS = sandbox.LEVELS;
console.log(`Extracted SHAPES (${Object.keys(SHAPES).length} types) and LEVELS (${LEVELS.length} levels)`);

// Solve one level with backtracking (only requirement: place every item without overlap)
function solveLevel(level, timeBudgetMs, placementBudget) {
  const cols = level.cols;
  const rows = level.rows;
  const items = level.items.map((it, idx) => ({ ...it, origIdx: idx, placed: false }));
  const totalCells = cols * rows;
  const itemCells = items.reduce((s, it) => s + it.cells.length, 0);
  if (itemCells > totalCells) {
    return { verdict: 'BAD_DATA', totalCells, itemCells };
  }
  // Sort items by descending cell count (largest first - better pruning)
  const sorted = [...items].sort((a, b) => b.cells.length - a.cells.length);
  const grid = new Int8Array(totalCells); // 0=empty, >0=itemIdx+1
  const startTime = Date.now();
  let placements = 0;

  function canPlace(item, r, c) {
    const cells = item.cells;
    for (let i = 0; i < cells.length; i++) {
      const rr = r + cells[i][0];
      const cc = c + cells[i][1];
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) return false;
      if (grid[rr * cols + cc] !== 0) return false;
    }
    return true;
  }

  function place(item, r, c, val) {
    const cells = item.cells;
    for (let i = 0; i < cells.length; i++) {
      grid[(r + cells[i][0]) * cols + (c + cells[i][1])] = val;
    }
  }

  function recurse(depth) {
    if (Date.now() - startTime > timeBudgetMs) return 'TIMEOUT';
    if (placements++ > placementBudget) return 'BUDGET';
    if (depth === sorted.length) return 'SOLVED';
    const item = sorted[depth];
    const cells = item.cells;
    // Try every (r,c) position that fits the bounding box of this item
    // Bounding box from cells
    let minR = 99, maxR = -1, minC = 99, maxC = -1;
    for (const [dr, dc] of cells) {
      if (dr < minR) minR = dr;
      if (dr > maxR) maxR = dr;
      if (dc < minC) minC = dc;
      if (dc > maxC) maxC = dc;
    }
    const hh = maxR - minR;
    const ww = maxC - minC;
    for (let r = -minR; r <= rows - 1 - hh; r++) {
      for (let c = -minC; c <= cols - 1 - ww; c++) {
        if (canPlace(item, r, c)) {
          place(item, r, c, depth + 1);
          const res = recurse(depth + 1);
          if (res === 'SOLVED') return 'SOLVED';
          if (res === 'TIMEOUT' || res === 'BUDGET') {
            place(item, r, c, 0);
            return res;
          }
          place(item, r, c, 0);
        }
      }
    }
    return 'DEAD';
  }

  const verdict = recurse(0);
  return {
    verdict: verdict === 'SOLVED' ? 'SOLVED' : (verdict === 'TIMEOUT' || verdict === 'BUDGET') ? 'INCONCLUSIVE' : 'UNSOLVABLE',
    placements,
    elapsedMs: Date.now() - startTime,
    rawVerdict: verdict,
  };
}

console.log('Level | grid  | items | cells | verdict      | placements | ms');
console.log('------|-------|-------|-------|--------------|------------|------');
let solved = 0, unsolvable = 0, inconclusive = 0, bad = 0;
const TIME_BUDGET_MS = 30000;
const PLACEMENT_BUDGET = 5000000;

for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const totalCells = lv.cols * lv.rows;
  const itemCells = lv.items.reduce((s, it) => s + it.cells.length, 0);
  const r = solveLevel(lv, TIME_BUDGET_MS, PLACEMENT_BUDGET);
  console.log(`L${String(i+1).padStart(2)}   | ${lv.cols}x${String(lv.rows).padStart(2)} | ${String(lv.items.length).padStart(5)} | ${String(totalCells).padStart(5)} | ${r.verdict.padEnd(12)} | ${String(r.placements).padStart(10)} | ${String(r.elapsedMs).padStart(5)}`);
  if (r.verdict === 'SOLVED') solved++;
  else if (r.verdict === 'UNSOLVABLE') unsolvable++;
  else if (r.verdict === 'INCONCLUSIVE') inconclusive++;
  else bad++;
}

console.log(`\n${LEVELS.length} levels: ${solved} SOLVED, ${unsolvable} UNSOLVABLE, ${inconclusive} INCONCLUSIVE, ${bad} BAD_DATA`);
process.exit(unsolvable + inconclusive + bad > 0 ? 1 : 0);
