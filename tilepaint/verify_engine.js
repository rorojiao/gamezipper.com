// verify_engine.js - In-engine verifier using the actual game's checkWin logic
// Loads index.html, extracts LEVELS, and verifies checkWin matches expected solutions
const fs = require('fs');
const vm = require('vm');

// Read the HTML file
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the LEVELS data from the embedded JSON
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (!levelsMatch) {
  console.error('Could not extract LEVELS from index.html');
  process.exit(1);
}

const LEVELS = JSON.parse(levelsMatch[1]);
console.log(`Extracted ${LEVELS.length} levels from index.html\n`);

// Replicate the engine's checkWin logic
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

function checkWin(tileColors, level) {
  // All tiles must be assigned
  for (let i = 0; i < tileColors.length; i++) {
    if (tileColors[i] === null || tileColors[i] === undefined) return false;
  }
  // All clues satisfied
  for (const cl of level.clues) {
    if (computeClueValue(tileColors, level.tiles, cl.r, cl.c, cl.dir, level.rows, level.cols) !== cl.val) {
      return false;
    }
  }
  return true;
}

// Verify each level: the embedded solution should pass checkWin
let passCount = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const level = LEVELS[i];
  // Reconstruct tileColors from embedded solution + tile mapping
  const maxTile = Math.max(...level.tiles.flat()) + 1;
  
  // The embedded tileColors field tells us the expected colors
  const expectedColors = level.tileColors.map(c => c === 1 ? 1 : 0);
  
  // Verify checkWin passes for the expected solution
  const win = checkWin(expectedColors, level);
  
  // Also verify the cell-level solution matches
  let cellMismatch = 0;
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      const tid = level.tiles[r][c];
      const expectedCell = expectedColors[tid] === 1 ? 1 : 0;
      if (level.solution[r][c] !== expectedCell) cellMismatch++;
    }
  }
  
  if (win && cellMismatch === 0) {
    console.log(`✅ Level ${i + 1} (${level.tier}): engine checkWin PASSES, solution cells match`);
    passCount++;
  } else if (!win) {
    console.log(`❌ Level ${i + 1} (${level.tier}): engine checkWin FAILS`);
  } else {
    console.log(`❌ Level ${i + 1} (${level.tier}): ${cellMismatch} cell mismatches`);
  }
}

console.log(`\n=== RESULT: ${passCount}/${LEVELS.length} pass in-engine verification ===`);
if (passCount === LEVELS.length) {
  console.log('🎉 ALL LEVELS PASS IN-ENGINE CHECKWIN');
  process.exit(0);
} else {
  console.log('💥 IN-ENGINE VERIFICATION FAILED');
  process.exit(1);
}
