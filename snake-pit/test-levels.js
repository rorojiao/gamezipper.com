#!/usr/bin/env node

const LEVELS = [
  { cols:5, rows:5, solution: [3,5,5,2,2,3,3,5,3,3,4,5,5,6,3,4,4,4,6,2,6,6,6,6,2] },
  { cols:5, rows:5, solution: [4,4,5,5,2,4,5,5,3,3,6,5,5,3,2,6,4,4,6,6,6,6,6,6,2] },
  { cols:5, rows:5, solution: [3,5,5,2,2,3,5,5,3,3,4,5,5,6,3,4,4,4,6,2,6,6,6,6,2] },
  { cols:5, rows:5, solution: [3,5,5,2,2,3,5,5,3,3,4,5,5,6,3,4,4,4,6,2,6,6,6,6,2] },
  { cols:5, rows:5, solution: [3,5,5,2,2,3,5,5,3,3,4,5,5,6,3,4,4,4,6,2,6,6,6,6,2] }
];

console.log('=== Snake Pit Level Verification (Sample 5) ===\n');

let passed = 0, failed = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const level = LEVELS[i];
  const totalCells = level.cols * level.rows;
  
  if (level.solution.length !== totalCells) {
    console.log(`L${i + 1} FAIL: Solution length mismatch`);
    failed++;
    continue;
  }
  
  let valid = true;
  for (let j = 0; j < level.solution.length; j++) {
    if (level.solution[j] < 2) {
      valid = false;
      break;
    }
  }
  
  if (!valid) {
    console.log(`L${i + 1} FAIL: Cell value < 2`);
    failed++;
  } else {
    console.log(`L${i + 1} PASS`);
    passed++;
  }
}

console.log(`\n=== Summary: ${passed}/${LEVELS.length} passed ===`);
process.exit(failed > 0 ? 1 : 0);