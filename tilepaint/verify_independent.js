// verify_independent.js - Independent Node.js verifier for Tilepaint levels
// Reimplements the game rules from scratch and checks uniqueness
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function computeClueValue(tileColors, tiles, r, c, dir, rows, cols) {
  let count = 0;
  if (dir === 'right') {
    for (let cc = c; cc < cols; cc++) {
      if (tileColors[tiles[r][cc]] === 1) count++;
    }
  } else {
    for (let rr = r; rr < rows; rr++) {
      if (tileColors[tiles[rr][c]] === 1) count++;
    }
  }
  return count;
}

function checkSolution(tileColors, tiles, clues, rows, cols) {
  for (const cl of clues) {
    if (computeClueValue(tileColors, tiles, cl.r, cl.c, cl.dir, rows, cols) !== cl.val) {
      return false;
    }
  }
  return true;
}

function solvePuzzle(level, maxSolutions = 2, nodeLimit = 5000000) {
  const { rows, cols, tiles, clues } = level;
  const maxTile = Math.max(...tiles.flat()) + 1;
  const solutions = [];
  let nodeCount = 0;

  // Precompute clue tile contributions
  const clueContrib = clues.map(cl => {
    const contrib = {};
    if (cl.dir === 'right') {
      for (let c = cl.c; c < cols; c++) {
        const tid = tiles[cl.r][c];
        contrib[tid] = (contrib[tid] || 0) + 1;
      }
    } else {
      for (let r = cl.r; r < rows; r++) {
        const tid = tiles[r][cl.c];
        contrib[tid] = (contrib[tid] || 0) + 1;
      }
    }
    return { contrib, value: cl.val };
  });

  function backtrack(tileIdx, colors) {
    if (solutions.length >= maxSolutions) return;
    nodeCount++;
    if (nodeCount > nodeLimit) return;

    if (tileIdx === maxTile) {
      // Check all clues
      for (const { contrib, value } of clueContrib) {
        let total = 0;
        for (const [tid, cells] of Object.entries(contrib)) {
          if (colors[parseInt(tid)] === 1) total += cells;
        }
        if (total !== value) return;
      }
      solutions.push([...colors]);
      return;
    }

    for (const color of [0, 1]) {
      colors[tileIdx] = color;
      // Prune: check clues where all involved tiles are assigned
      let valid = true;
      for (const { contrib, value } of clueContrib) {
        const allAssigned = Object.keys(contrib).every(tid => parseInt(tid) <= tileIdx);
        if (allAssigned) {
          let total = 0;
          for (const [tid, cells] of Object.entries(contrib)) {
            if (colors[parseInt(tid)] === 1) total += cells;
          }
          if (total !== value) { valid = false; break; }
        }
      }
      if (valid) backtrack(tileIdx + 1, colors);
    }
    colors[tileIdx] = null;
  }

  const colors = new Array(maxTile).fill(null);
  backtrack(0, colors);
  return solutions;
}

let allValid = true;
let uniqueCount = 0;

for (let i = 0; i < levels.length; i++) {
  const level = levels[i];
  const sols = solvePuzzle(level, 2, 5000000);
  
  // Also verify the embedded solution is valid
  const embeddedValid = checkSolution(level.tileColors.map(c => c === 1 ? 1 : 0), level.tiles, level.clues, level.rows, level.cols);
  
  if (sols.length === 1 && embeddedValid) {
    console.log(`✅ Level ${i + 1} (${level.tier}): UNIQUE — ${sols.length} solution, embedded valid`);
    uniqueCount++;
  } else if (sols.length === 0) {
    console.log(`❌ Level ${i + 1} (${level.tier}): NO SOLUTION`);
    allValid = false;
  } else if (sols.length > 1) {
    console.log(`⚠️ Level ${i + 1} (${level.tier}): ${sols.length} solutions (NOT UNIQUE)`);
    allValid = false;
  } else {
    console.log(`❌ Level ${i + 1} (${level.tier}): embedded solution INVALID`);
    allValid = false;
  }
}

console.log(`\n=== RESULT: ${uniqueCount}/${levels.length} unique ===`);
if (allValid && uniqueCount === levels.length) {
  console.log('🎉 ALL LEVELS VERIFIED UNIQUE');
  process.exit(0);
} else {
  console.log('💥 VERIFICATION FAILED');
  process.exit(1);
}
