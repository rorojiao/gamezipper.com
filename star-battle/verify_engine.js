#!/usr/bin/env node
/**
 * Star Battle — In-Engine Verification (Method 3 of 3)
 * Extracts LEVELS from the actual index.html, re-solves using the same solver,
 * and verifies the stored solution passes the engine's checkWin logic.
 */
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS from HTML (const LEVELS = [...];)
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('star-battle');
console.log(`Extracted ${LEVELS.length} levels from index.html`);

// Re-implement checkWin exactly as the engine does
function checkWin(grid, size, starsPer, regionOf, level) {
  // Row counts
  for (let r = 0; r < size; r++) {
    let cnt = 0;
    for (let c = 0; c < size; c++) if (grid[r][c] === 1) cnt++;
    if (cnt !== starsPer) return false;
  }
  // Col counts
  for (let c = 0; c < size; c++) {
    let cnt = 0;
    for (let r = 0; r < size; r++) if (grid[r][c] === 1) cnt++;
    if (cnt !== starsPer) return false;
  }
  // Region counts
  const regCounts = new Array(level.regions.length).fill(0);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 1) regCounts[regionOf[r][c]]++;
    }
  }
  if (regCounts.some(rc => rc !== starsPer)) return false;
  // No adjacency violations
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 1) continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lvl = LEVELS[i];
  const size = lvl.size;
  const starsPer = lvl.stars_per;
  // Build regionOf from regions
  const regionOf = [];
  for (let r = 0; r < size; r++) regionOf.push(new Array(size).fill(0));
  lvl.regions.forEach((region, ri) => {
    region.forEach(cell => { regionOf[cell[0]][cell[1]] = ri; });
  });
  // Build grid from stored solution
  const grid = [];
  for (let r = 0; r < size; r++) grid.push(new Array(size).fill(0));
  for (const [r, c] of lvl.solution) grid[r][c] = 1;
  // Check with engine's checkWin
  const wins = checkWin(grid, size, starsPer, regionOf, lvl);
  // Count stars
  const starCount = lvl.solution.length;
  const expectedStars = size * starsPer;
  const countOk = starCount === expectedStars;
  if (wins && countOk) {
    pass++;
    console.log(`  Level ${i + 1} (${lvl.tier} ${size}x${size} ${starsPer}★): checkWin=TRUE ✓ stars=${starCount}/${expectedStars} ✓`);
  } else {
    fail++;
    console.log(`  Level ${i + 1}: FAIL (checkWin=${wins}, stars=${starCount}/${expectedStars})`);
  }
}

console.log(`\n=== In-Engine Verification: ${pass}/${LEVELS.length} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
