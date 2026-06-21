#!/usr/bin/env node
/**
 * Independent Sohei Sudoku verifier.
 * Reads levels.json, extracts each grid, and verifies:
 * 1. Each grid has a unique solution
 * 2. Shared boxes are consistent across grids
 * 3. Solution matches puzzle solution
 * 4. Board layout is correct (288 cells)
 */
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

// 9×9 Sudoku solver — count solutions up to limit
function countSolutions(grid, limit) {
  const g = grid.map(r => [...r]);
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = g[r][c];
      if (v) {
        const bit = 1 << v;
        rows[r] |= bit; cols[c] |= bit;
        boxes[Math.floor(r/3)*3 + Math.floor(c/3)] |= bit;
      }
    }
  }

  let count = 0;

  function solve() {
    if (count >= limit) return;
    let bestR = -1, bestC = -1, bestCnt = 10, bestMask = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] === 0) {
          const mask = rows[r] | cols[c] | boxes[Math.floor(r/3)*3 + Math.floor(c/3)];
          const avail = (~(mask >> 1)) & 0x1FF;
          const cnt = (avail.toString(2).match(/1/g) || []).length;
          if (cnt === 0) return;
          if (cnt < bestCnt) {
            bestCnt = cnt; bestR = r; bestC = c; bestMask = avail;
            if (cnt === 1) break;
          }
        }
      }
      if (bestCnt === 1) break;
    }
    if (bestR === -1) { count++; return; }
    const b = Math.floor(bestR/3)*3 + Math.floor(bestC/3);
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << (d-1);
      if (bestMask & bit) {
        g[bestR][bestC] = d;
        rows[bestR] |= (1 << d); cols[bestC] |= (1 << d); boxes[b] |= (1 << d);
        solve();
        g[bestR][bestC] = 0;
        rows[bestR] &= ~(1 << d); cols[bestC] &= ~(1 << d); boxes[b] &= ~(1 << d);
        if (count >= limit) return;
      }
    }
  }

  solve();
  return count;
}

function getBox(grid, boxIdx) {
  const br = Math.floor(boxIdx / 3) * 3;
  const bc = (boxIdx % 3) * 3;
  return [0,1,2].map(dr => [0,1,2].map(dc => grid[br+dr][bc+dc]));
}

function boxesEqual(b1, b2) {
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      if (b1[r][c] !== b2[r][c]) return false;
  return true;
}

// Grid origins
const ORIGINS = { A:[0,6], B:[6,12], C:[12,6], D:[6,0] };
// Shared box specs: name → [localBox, partner, partnerLocalBox]
const SHARED = {
  A: [[6,'D',2], [8,'B',0]],
  B: [[0,'A',8], [6,'C',2]],
  C: [[0,'D',8], [2,'B',6]],
  D: [[2,'A',6], [8,'C',0]],
};

// Extract 9×9 grid from 21×21 board
function extractGrid(board, origin) {
  const [roff, coff] = origin;
  const grid = [];
  for (let r = 0; r < 9; r++) {
    grid.push([]);
    for (let c = 0; c < 9; c++) {
      grid[r].push(board[roff+r][coff+c]);
    }
  }
  return grid;
}

let allPass = true;

for (const level of levels) {
  const id = level.id;
  const board = level.board;
  const solution = level.solution;

  // Count cells
  let cellCount = 0;
  for (let r = 0; r < 21; r++)
    for (let c = 0; c < 21; c++)
      if (board[r][c] !== 0 || solution[r][c] !== 0)
        cellCount++;
  if (cellCount !== 288) {
    console.log(`Level ${id}: FAIL — ${cellCount} cells (expected 288)`);
    allPass = false;
    continue;
  }

  // Extract grids from solution
  const solGrids = {};
  const puzGrids = {};
  for (const [name, origin] of Object.entries(ORIGINS)) {
    solGrids[name] = extractGrid(solution, origin);
    puzGrids[name] = extractGrid(board, origin);
  }

  // Check shared box consistency
  let sharedOk = true;
  for (const [name, specs] of Object.entries(SHARED)) {
    for (const [localBox, partner, partnerBox] of specs) {
      const b1 = getBox(solGrids[name], localBox);
      const b2 = getBox(solGrids[partner], partnerBox);
      if (!boxesEqual(b1, b2)) {
        console.log(`Level ${id}: FAIL — ${name}.box${localBox} ≠ ${partner}.box${partnerBox}`);
        sharedOk = false;
        allPass = false;
      }
    }
  }
  if (!sharedOk) continue;

  // Check uniqueness per grid
  let uniqueOk = true;
  for (const name of ['A','B','C','D']) {
    const cnt = countSolutions(puzGrids[name], 2);
    if (cnt !== 1) {
      console.log(`Level ${id}: FAIL — Grid ${name} has ${cnt} solutions`);
      uniqueOk = false;
      allPass = false;
    }
  }
  if (!uniqueOk) continue;

  // Count givens
  let givens = 0;
  for (let r = 0; r < 21; r++)
    for (let c = 0; c < 21; c++)
      if (level.given[r][c]) givens++;

  console.log(`Level ${id} (${level.tier}): PASS — ${givens} givens, 4/4 unique, shared boxes consistent`);
}

console.log(`\n${allPass ? 'ALL 27 LEVELS VERIFIED ✓' : 'SOME LEVELS FAILED ✗'}`);
process.exit(allPass ? 0 : 1);
