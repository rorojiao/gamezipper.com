#!/usr/bin/env node
/**
 * Independent Node.js verifier for Balance Loop levels.
 * Re-reads levels.json and independently validates each solution.
 */
const fs = require('fs');

const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];
const OPP = [2, 3, 0, 1];

const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

let allPass = true;
let passCount = 0;

for (const level of data.levels) {
  const { rows, cols, clues, solution } = level;
  const errors = [];
  const n = solution.length;
  
  // 1. Length check
  if (n < 4) errors.push(`Solution too short: ${n}`);
  
  // 2. Unique cells
  const solSet = new Set(solution.map(c => c.join(',')));
  if (solSet.size !== n) errors.push(`Duplicates: ${n} cells, ${solSet.size} unique`);
  
  // 3. Adjacency check
  for (let i = 0; i < n; i++) {
    const cur = solution[i];
    const nxt = solution[(i + 1) % n];
    if (Math.abs(cur[0] - nxt[0]) + Math.abs(cur[1] - nxt[1]) !== 1) {
      errors.push(`Non-adjacent: [${cur}] -> [${nxt}]`);
      break;
    }
  }
  
  // 4. Cycle closes
  const last = solution[n - 1];
  const first = solution[0];
  if (Math.abs(last[0] - first[0]) + Math.abs(last[1] - first[1]) !== 1) {
    errors.push(`Cycle not closed`);
  }
  
  // 5. All clues on loop
  for (const clue of clues) {
    if (!solSet.has(`${clue.r},${clue.c}`)) {
      errors.push(`Clue not on loop: (${clue.r},${clue.c})`);
    }
  }
  
  // 6. Clue shapes
  const pathIdx = {};
  solution.forEach((cell, i) => { pathIdx[cell.join(',')] = i; });
  
  for (const clue of clues) {
    const cell = [clue.r, clue.c];
    const idx = pathIdx[cell.join(',')];
    const prev = solution[(idx - 1 + n) % n];
    const nxt = solution[(idx + 1) % n];
    
    let dPrev = -1, dNext = -1;
    for (let d = 0; d < 4; d++) {
      if (cell[0] + DR[d] === prev[0] && cell[1] + DC[d] === prev[1]) dPrev = d;
      if (cell[0] + DR[d] === nxt[0] && cell[1] + DC[d] === nxt[1]) dNext = d;
    }
    
    if (dPrev < 0 || dNext < 0) {
      errors.push(`Shape error at (${clue.r},${clue.c})`);
      continue;
    }
    
    const straight = OPP[dPrev] === dNext;
    if (clue.shape === 'circle' && !straight) {
      errors.push(`Clue (${clue.r},${clue.c}): expected circle but is turn`);
    }
    if (clue.shape === 'square' && straight) {
      errors.push(`Clue (${clue.r},${clue.c}): expected square but is straight`);
    }
  }
  
  // 7. Visibility numbers
  for (const clue of clues) {
    let vis = 1;
    for (let d = 0; d < 4; d++) {
      let nr = clue.r + DR[d], nc = clue.c + DC[d];
      while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (solSet.has(`${nr},${nc}`)) { vis++; nr += DR[d]; nc += DC[d]; }
        else break;
      }
    }
    if (vis !== clue.number) {
      errors.push(`Clue (${clue.r},${clue.c}): expected ${clue.number} but vis=${vis}`);
    }
  }
  
  if (errors.length > 0) {
    allPass = false;
    console.log(`❌ Level ${level.level} (${level.tier}): ${errors.length} errors`);
    errors.slice(0, 3).forEach(e => console.log(`    ${e}`));
  } else {
    passCount++;
    console.log(`✅ Level ${level.level} (${level.tier}): VALID — ${n} cells, ${clues.length} clues`);
  }
}

console.log('\n' + '='.repeat(50));
console.log(`Node.js independent verification: ${allPass ? 'ALL ' + passCount + ' PASS ✅' : 'FAILURES ❌'}`);
process.exit(allPass ? 0 : 1);
