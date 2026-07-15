#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read LEVELS from index.html
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const match = html.match(/const LEVELS = (\[.*?\]);/s);

if (!match) {
  console.error('ERROR: Cannot find LEVELS array in index.html');
  process.exit(1);
}

const LEVELS = JSON.parse(match[1]);

console.log('=== Galaxies Level Verification ===\n');
console.log(`Loaded ${LEVELS.length} levels from index.html\n`);

let passed = 0, failed = 0;

for (let i = 0; i < LEVELS.length; i++) {
  const level = LEVELS[i];
  const totalCells = level.rows * level.cols;
  
  // Check 1: Solution length matches grid size
  if (level.solution.length !== totalCells) {
    console.log(`L${i+1} FAIL: Solution length mismatch (${level.solution.length} vs ${totalCells})`);
    failed++;
    continue;
  }
  
  // Check 2: All cells have valid galaxy ID (0 to centers.length-1)
  let valid = true;
  for (let j = 0; j < level.solution.length; j++) {
    if (level.solution[j] < 0 || level.solution[j] >= level.centers.length) {
      valid = false;
      break;
    }
  }
  
  if (!valid) {
    console.log(`L${i+1} FAIL: Invalid galaxy ID in solution`);
    failed++;
  } else {
    console.log(`L${i+1} (${level.rows}x${level.cols}, ${level.centers.length} centers) PASS`);
    passed++;
  }
}

console.log(`\n=== Summary: ${passed}/${LEVELS.length} levels verified ===`);
process.exit(failed > 0 ? 1 : 0);