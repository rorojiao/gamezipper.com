// verify_independent.js — Independent Node.js verification of Ichimaga levels
// Reads levels.json, independently validates each level's solution

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/ichimaga/levels.json','utf8'));

let pass = 0, fail = 0;

data.levels.forEach(function(lv, idx) {
  const rows = lv.rows, cols = lv.cols;
  const grid = lv.grid;
  const solution = lv.solution;
  const n = rows * cols;
  
  function cellIdx(r,c) { return r*cols+c; }
  
  // Build adjacency from solution edges
  const adj = {};
  for (let i = 0; i < n; i++) adj[i] = [];
  
  for (const [r1,c1,r2,c2] of solution) {
    const i1 = cellIdx(r1,c1), i2 = cellIdx(r2,c2);
    adj[i1].push(i2);
    adj[i2].push(i1);
  }
  
  const issues = [];
  
  // 1. Degree check
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = cellIdx(r,c);
      if (grid[r][c] !== adj[i].length) {
        issues.push(`Degree mismatch at (${r},${c}): grid=${grid[r][c]}, actual=${adj[i].length}`);
      }
    }
  }
  
  // 2. Connectivity (BFS)
  const nonZero = [];
  for (let i = 0; i < n; i++) {
    if (adj[i].length > 0) nonZero.push(i);
  }
  
  if (nonZero.length > 0) {
    const visited = new Set();
    const queue = [nonZero[0]];
    visited.add(nonZero[0]);
    while (queue.length > 0) {
      const node = queue.shift();
      for (const nb of adj[node]) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    for (const i of nonZero) {
      if (!visited.has(i)) {
        const r = Math.floor(i/cols), c = i%cols;
        issues.push(`Node (${r},${c}) is disconnected`);
      }
    }
  }
  
  // 3. Edge validity (adjacent cells only)
  for (const [r1,c1,r2,c2] of solution) {
    const dr = Math.abs(r1-r2), dc = Math.abs(c1-c2);
    if (dr + dc !== 1) {
      issues.push(`Invalid edge (${r1},${c1})-(${r2},${c2}): not adjacent`);
    }
    if (r1 < 0 || r1 >= rows || c1 < 0 || c1 >= cols || r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols) {
      issues.push(`Out of bounds edge (${r1},${c1})-(${r2},${c2})`);
    }
  }
  
  // 4. Degree range (0-4)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] < 0 || grid[r][c] > 4) {
        issues.push(`Invalid degree ${grid[r][c]} at (${r},${c})`);
      }
    }
  }
  
  if (issues.length === 0) {
    pass++;
    console.log(`  Level ${idx+1} (${lv.tierName}): ${rows}x${cols}, ${solution.length} edges - PASS`);
  } else {
    fail++;
    console.log(`  Level ${idx+1}: FAIL - ${issues.slice(0,3).join('; ')}`);
  }
});

console.log(`\n${pass}/${pass+fail} levels passed independent verification`);
if (fail === 0) console.log('ALL PASS!');
