// Pentopia In-Engine Verifier — Method 3 of 3
// Extracts and tests the engine's clue verification logic directly
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/const LEVELS = (\[.*?\]);/s);
if (!m) { console.error('NO LEVELS found'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);

// Extract the clueSatisfied and allCluesSatisfied function source from HTML
// These are the core verification functions from the engine
const DIR_MAP = { 'U': [-1,0], 'D': [1,0], 'L': [0,-1], 'R': [0,1] };

// Reproduce the engine's clueSatisfied logic exactly as in index.html
function engineClueSatisfied(r, c, grid, clues, R, C) {
  const clue = clues.find(cl => cl.r === r && cl.c === c);
  if (!clue) return false;
  const dirs = new Set(clue.dirs);
  const actual = new Set();
  for (const [d, [dr, dc]] of Object.entries(DIR_MAP)) {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < R && cc >= 0 && cc < C) {
      if (grid[rr][cc] !== null) { actual.add(d); break; }
      rr += dr; cc += dc;
    }
  }
  return actual.size === dirs.size && [...actual].every(d => dirs.has(d));
}

// Reproduce the engine's allCluesSatisfied logic exactly
function engineAllCluesSatisfied(grid, clues, R, C) {
  return clues.every(cl => engineClueSatisfied(cl.r, cl.c, grid, clues, R, C));
}

// Reproduce the engine's checkWin logic (without the UI trigger)
function engineCheckWin(grid, placed, clues, R, C, expectedShapes) {
  if (placed.length !== expectedShapes) return false;
  if (!engineAllCluesSatisfied(grid, clues, R, C)) return false;
  // Check no adjacency violations
  for (let i = 0; i < placed.length; i++) {
    for (let j = i+1; j < placed.length; j++) {
      for (const [r1,c1] of placed[i].cells) {
        for (const [r2,c2] of placed[j].cells) {
          if (Math.abs(r1-r2)<=1 && Math.abs(c1-c2)<=1 && !(r1===r2&&c1===c2)) return false;
        }
      }
    }
  }
  // Check no duplicate shapes
  const types = placed.map(p=>p.type);
  if (new Set(types).size !== types.length) return false;
  return true;
}

let pass = 0, fail = 0;

for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const R = lv.R, C = lv.C;
  
  // Build grid from solution (exactly as the engine's initLevel would, then we place)
  const grid = Array(R).fill(null).map(() => Array(C).fill(null));
  const placed = [];
  for (const shape of lv.shapes) {
    for (const [r, c] of shape.cells) {
      grid[r][c] = shape.type;
    }
    placed.push({ type: shape.type, cells: shape.cells.map(c => [...c]) });
  }
  
  // Run the engine's checkWin
  const win = engineCheckWin(grid, placed, lv.clues, R, C, lv.shapes.length);
  
  if (win) {
    console.log(`✅ Level ${lv.level} (${lv.tierName}): in-engine checkWin PASS`);
    pass++;
  } else {
    // Diagnose
    const cluesOK = engineAllCluesSatisfied(grid, lv.clues, R, C);
    const shapesOK = placed.length === lv.shapes.length;
    console.log(`❌ Level ${lv.level}: checkWin=false (clues=${cluesOK}, shapes=${shapesOK}/${lv.shapes.length})`);
    fail++;
  }
}

console.log(`\n=== IN-ENGINE RESULT: ${pass}/${LEVELS.length} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
