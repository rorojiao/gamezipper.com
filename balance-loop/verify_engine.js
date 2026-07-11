#!/usr/bin/env node
/**
 * In-engine verifier: loads the actual index.html, extracts LEVELS array,
 * and validates each level's solution using engine-equivalent logic.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract LEVELS array from HTML - match from "const LEVELS = [" to the first "];\n" after the array
const levelsStart = html.indexOf('const LEVELS = [', 0);
const levelsStartIdx = html.indexOf('[', levelsStart);
if (levelsStartIdx < 0) {
  console.error('Could not find LEVELS array in index.html');
  process.exit(1);
}

// Find matching ] — count brackets
let depth = 0;
let levelsEnd = -1;
for (let i = levelsStartIdx; i < html.length; i++) {
  if (html[i] === '[') depth++;
  if (html[i] === ']') { depth--; if (depth === 0) { levelsEnd = i + 1; break; } }
}

if (levelsEnd < 0) {
  console.error('Could not find end of LEVELS array');
  process.exit(1);
}

const levelsCode = html.substring(levelsStartIdx, levelsEnd);
let LEVELS;
try {
  LEVELS = JSON.parse(levelsCode);
} catch(e) {
  console.error('JSON parse error:', e.message);
  console.error('First 200 chars:', levelsCode.substring(0, 200));
  process.exit(1);
}

console.log(`Loaded ${LEVELS.length} levels from index.html`);

// Constants
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];
const OPP = [2, 3, 0, 1];

let allPass = true;
let passCount = 0;

for (let li = 0; li < LEVELS.length; li++) {
  const level = LEVELS[li];
  const { rows, cols, clues, solution } = level;
  const errors = [];
  
  // Build edge set from solution
  const edges = new Set();
  const edgeKey = (r1, c1, r2, c2) => {
    if (r1 < r2 || (r1 === r2 && c1 < c2)) return `${r1},${c1},${r2},${c2}`;
    return `${r2},${c2},${r1},${c1}`;
  };
  
  const n = solution.length;
  for (let i = 0; i < n; i++) {
    const [r1, c1] = solution[i];
    const [r2, c2] = solution[(i + 1) % n];
    edges.add(edgeKey(r1, c1, r2, c2));
  }
  
  // Check loop cells (cells with exactly 2 edges)
  const loopCells = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let count = 0;
      for (let d = 0; d < 4; d++) {
        const nr = r + DR[d], nc = c + DC[d];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (edges.has(edgeKey(r, c, nr, nc))) count++;
        }
      }
      if (count === 2) loopCells.add(`${r},${c}`);
    }
  }
  
  // Check all clues on loop
  for (const clue of clues) {
    if (!loopCells.has(`${clue.r},${clue.c}`)) {
      errors.push(`Clue (${clue.r},${clue.c}) not on loop`);
    }
  }
  
  // Check single cycle: trace from first loop cell
  if (loopCells.size > 0) {
    const startStr = loopCells.values().next().value;
    const [sr, sc] = startStr.split(',').map(Number);
    const visited = new Set();
    let cr = sr, cc = sc, pr = -1, pc = -1;
    let stuck = false;
    
    while (!visited.has(`${cr},${cc}`)) {
      visited.add(`${cr},${cc}`);
      const cellEdges = [];
      for (let d = 0; d < 4; d++) {
        const nr = cr + DR[d], nc = cc + DC[d];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (edges.has(edgeKey(cr, cc, nr, nc))) cellEdges.push(d);
        }
      }
      if (cellEdges.length !== 2) { errors.push(`Cell (${cr},${cc}) has ${cellEdges.length} edges`); break; }
      
      let next = null;
      for (const d of cellEdges) {
        const nr = cr + DR[d], nc = cc + DC[d];
        if (nr !== pr || nc !== pc) {
          if (!visited.has(`${nr},${nc}`) || (nr === sr && nc === sc && visited.size > 1)) {
            next = [nr, nc];
            break;
          }
        }
      }
      if (!next) { stuck = true; break; }
      pr = cr; pc = cc;
      cr = next[0]; cc = next[1];
    }
    
    if (!stuck && (cr !== sr || cc !== sc)) {
      errors.push(`Cycle not closed at (${cr},${cc})`);
    }
    if (visited.size !== loopCells.size) {
      errors.push(`Multiple loops: visited=${visited.size} loopCells=${loopCells.size}`);
    }
  }
  
  // Check clue shapes
  for (const clue of clues) {
    const dirs = [];
    for (let d = 0; d < 4; d++) {
      const nr = clue.r + DR[d], nc = clue.c + DC[d];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (edges.has(edgeKey(clue.r, clue.c, nr, nc))) dirs.push(d);
      }
    }
    if (dirs.length !== 2) { errors.push(`Clue (${clue.r},${clue.c}) has ${dirs.length} edges`); continue; }
    const straight = OPP[dirs[0]] === dirs[1];
    if (clue.shape === 'circle' && !straight) errors.push(`Clue (${clue.r},${clue.c}) wrong shape: expected circle`);
    if (clue.shape === 'square' && straight) errors.push(`Clue (${clue.r},${clue.c}) wrong shape: expected square`);
    
    // Visibility
    let vis = 1;
    for (let d = 0; d < 4; d++) {
      let nr = clue.r + DR[d], nc = clue.c + DC[d];
      while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (loopCells.has(`${nr},${nc}`)) { vis++; nr += DR[d]; nc += DC[d]; }
        else break;
      }
    }
    if (vis !== clue.number) errors.push(`Clue (${clue.r},${clue.c}) vis=${vis} expected=${clue.number}`);
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
console.log(`In-engine verification: ${allPass ? 'ALL ' + passCount + ' PASS ✅' : 'FAILURES ❌'}`);
process.exit(allPass ? 0 : 1);
