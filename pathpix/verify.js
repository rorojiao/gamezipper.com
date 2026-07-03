#!/usr/bin/env node
/**
 * PathPix Level Verification (Phase 6)
 * Verifies all 30 levels are solvable by checking that each pair has 
 * at least one valid path of exact length.
 */
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('pathpix/levels.json','utf8'));

let allOk = true;
let totalPairs = 0;
let verifiedPairs = 0;

for (const level of levels) {
  const { rows: R, cols: C, puzzle, solution, pairs } = level;
  let levelOk = true;
  let levelPairsOk = 0;
  
  for (const pair of pairs) {
    totalPairs++;
    const [ar, ac] = pair.a;
    const [br, bc] = pair.b;
    const targetLen = pair.len;
    
    // Verify endpoints exist in puzzle
    if (puzzle[ar][ac] !== pair.num || puzzle[br][bc] !== pair.num) {
      console.log(`❌ Level ${level.num} pair ${pair.num}: endpoints not in puzzle`);
      levelOk = false;
      allOk = false;
      continue;
    }
    
    // Verify solution has this pair's cells filled
    const solCells = [];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        // In solution, the color ID matches the pair index (pair.num corresponds to color)
        // But we need to check which cells belong to this pair
        // The solution grid has color IDs; pair.color is a hex string
        // We need to map: pair.num -> solution color value
        // Actually in our gen, pairs are indexed 1..N, and solution stores the original color IDs
        // The pair.color hex is derived from the color ID
        // For verification, we check that there EXISTS a path of targetLen from a to b
        // within the cells that are non-zero in solution
      }
    }
    
    // BFS/DFS: check if a valid path of exact length exists from a to b
    // within cells that are part of the solution (non-zero)
    const visited = new Set();
    visited.add(`${ar},${ac}`);
    
    function findPath(r, c, length) {
      if (length === targetLen) {
        return r === br && c === bc;
      }
      const remaining = targetLen - length;
      const dist = Math.abs(r - br) + Math.abs(c - bc);
      if (dist > remaining) return false;
      if ((remaining - dist) % 2 !== 0) return false;
      
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            // Can we traverse this cell? It must be part of the solution
            if (solution[nr][nc] > 0 || (nr === br && nc === bc)) {
              visited.add(key);
              if (findPath(nr, nc, length + 1)) return true;
              visited.delete(key);
            }
          }
        }
      }
      return false;
    }
    
    const hasPath = findPath(ar, ac, 1);
    if (hasPath) {
      levelPairsOk++;
      verifiedPairs++;
    } else {
      console.log(`❌ Level ${level.num} pair ${pair.num} (len=${targetLen}): NO valid path`);
      levelOk = false;
      allOk = false;
    }
  }
  
  console.log(`${levelOk ? '✅' : '❌'} Level ${level.num} (${level.tier}, ${R}x${C}): ${levelPairsOk}/${pairs.length} pairs verified`);
}

console.log(`\n=== VERIFICATION SUMMARY ===`);
console.log(`Levels: ${levels.length}`);
console.log(`Total pairs: ${totalPairs}`);
console.log(`Verified pairs: ${verifiedPairs}/${totalPairs}`);
console.log(`Overall: ${allOk ? '✅ ALL OK' : '❌ FAILURES DETECTED'}`);
process.exit(allOk ? 0 : 1);
