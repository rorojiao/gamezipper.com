#!/usr/bin/env node
/**
 * Star Battle — Independent Node.js BFS Solver + Uniqueness Verifier
 * Method 2 of 3: completely independent reimplementation of the solver in JS.
 * Loads levels.json, re-solves each, verifies exactly 1 solution.
 */
const fs = require('fs');

function solve(size, starsPer, regions, maxSolutions = 2) {
  const regionOf = {};
  for (let ri = 0; ri < regions.length; ri++) {
    for (const cell of regions[ri]) {
      regionOf[cell[0] + ',' + cell[1]] = ri;
    }
  }
  const solutions = [];
  const colCount = new Array(size).fill(0);
  const regCount = new Array(regions.length).fill(0);

  function combinations(arr, k) {
    const result = [];
    function helper(start, combo) {
      if (combo.length === k) { result.push([...combo]); return; }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    }
    helper(0, []);
    return result;
  }

  function dfs(row, placed) {
    if (solutions.length >= maxSolutions) return;
    if (row === size) {
      if (colCount.every(c => c === starsPer) && regCount.every(r => r === starsPer)) {
        solutions.push(placed.map(p => [...p]));
      }
      return;
    }
    const availCols = [];
    for (let c = 0; c < size; c++) {
      if (colCount[c] < starsPer) availCols.push(c);
    }
    if (availCols.length < starsPer) return;

    for (const combo of combinations(availCols, starsPer)) {
      // Same-row adjacency check
      let bad = false;
      const sorted = [...combo].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length && !bad; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          if (Math.abs(sorted[i] - sorted[j]) <= 1) { bad = true; break; }
        }
      }
      if (bad) continue;
      // Region count check
      const regDelta = {};
      for (const c of combo) {
        const ri = regionOf[row + ',' + c];
        regDelta[ri] = (regDelta[ri] || 0) + 1;
        if (regCount[ri] + regDelta[ri] > starsPer) { bad = true; break; }
      }
      if (bad) continue;
      // Previous row adjacency
      if (row > 0) {
        for (const c of combo) {
          for (const [pr, pc] of placed) {
            if (pr === row - 1 && Math.abs(c - pc) <= 1) { bad = true; break; }
          }
          if (bad) break;
        }
      }
      if (bad) continue;
      // Apply
      for (const c of combo) {
        colCount[c]++;
        regCount[regionOf[row + ',' + c]]++;
        placed.push([row, c]);
      }
      dfs(row + 1, placed);
      // Undo
      for (let i = 0; i < starsPer; i++) placed.pop();
      for (const c of combo) {
        colCount[c]--;
        regCount[regionOf[row + ',' + c]]--;
      }
      if (solutions.length >= maxSolutions) return;
    }
  }

  dfs(0, []);
  return solutions;
}

function main() {
  const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
  const levels = data.levels;
  let pass = 0, fail = 0;
  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    const sols = solve(lvl.size, lvl.stars_per, lvl.regions, 2);
    const unique = sols.length === 1;
    // Also verify stored solution matches
    const storedSol = lvl.solution.map(s => s.join(',')).sort().join(';');
    const solverSol = unique ? sols[0].map(s => s.join(',')).sort().join(';') : '';
    const matches = unique && storedSol === solverSol;
    if (unique && matches) {
      pass++;
      console.log(`  Level ${i + 1} (${lvl.tier} ${lvl.size}x${lvl.size} ${lvl.stars_per}★): UNIQUE ✓ solution matches ✓`);
    } else {
      fail++;
      console.log(`  Level ${i + 1}: FAIL (solutions=${sols.length}, matches=${matches})`);
    }
  }
  console.log(`\n=== Independent Node.js BFS: ${pass}/${levels.length} PASS, ${fail} FAIL ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
