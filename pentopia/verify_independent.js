// Pentopia Independent Verifier — verifies all 30 levels
// Method 2 of 3: independent Node.js reimplementation of the rules
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/const LEVELS = (\[.*?\]);/s);
if (!m) { console.error('NO LEVELS found'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);

const DIR_MAP = { 'U': [-1,0], 'D': [1,0], 'L': [0,-1], 'R': [0,1] };

let pass = 0, fail = 0;

for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  let errors = [];
  
  // 1. Check grid dimensions
  const R = lv.R, C = lv.C;
  
  // 2. Build occupied set from solution shapes
  const occupied = new Set();
  const shapeTypes = new Set();
  for (const shape of lv.shapes) {
    // Check each cell is in bounds
    for (const [r, c] of shape.cells) {
      if (r < 0 || r >= R || c < 0 || c >= C) {
        errors.push(`Shape ${shape.type} cell (${r},${c}) out of bounds`);
      }
      const key = `${r},${c}`;
      if (occupied.has(key)) {
        errors.push(`Cell (${r},${c}) occupied by multiple shapes`);
      }
      occupied.add(key);
    }
    if (shapeTypes.has(shape.type)) {
      errors.push(`Duplicate shape type: ${shape.type}`);
    }
    shapeTypes.add(shape.type);
  }
  
  // 3. Check no two shapes touch (8-neighbor)
  for (let si = 0; si < lv.shapes.length; si++) {
    for (let sj = si + 1; sj < lv.shapes.length; sj++) {
      for (const [r1, c1] of lv.shapes[si].cells) {
        for (const [r2, c2] of lv.shapes[sj].cells) {
          if (Math.abs(r1-r2) <= 1 && Math.abs(c1-c2) <= 1 && !(r1===r2 && c1===c2)) {
            errors.push(`Shapes ${lv.shapes[si].type} and ${lv.shapes[sj].type} touch at (${r1},${c1})-(${r2},${c2})`);
          }
        }
      }
    }
  }
  
  // 4. Check each shape has exactly 5 cells
  for (const shape of lv.shapes) {
    if (shape.cells.length !== 5) {
      errors.push(`Shape ${shape.type} has ${shape.cells.length} cells (expected 5)`);
    }
  }
  
  // 5. Check arrow clues match solution
  for (const clue of lv.clues) {
    const { r, c, dirs } = clue;
    if (r < 0 || r >= R || c < 0 || c >= C) {
      errors.push(`Clue (${r},${c}) out of bounds`);
      continue;
    }
    if (occupied.has(`${r},${c}`)) {
      errors.push(`Clue cell (${r},${c}) overlaps a shape`);
      continue;
    }
    // Compute actual directions
    const expected = new Set(dirs);
    const actual = new Set();
    for (const [label, [dr, dc]] of Object.entries(DIR_MAP)) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < R && cc >= 0 && cc < C) {
        if (occupied.has(`${rr},${cc}`)) {
          actual.add(label);
          break;
        }
        rr += dr; cc += dc;
      }
    }
    // Compare
    if (actual.size !== expected.size || ![...actual].every(d => expected.has(d))) {
      errors.push(`Clue (${r},${c}): expected ${[...expected].join(',')}, got ${[...actual].join(',')}`);
    }
  }
  
  if (errors.length === 0) {
    console.log(`✅ Level ${lv.level} (${lv.tierName}): ${R}x${C}, ${lv.shapes.length} shapes, ${lv.clues.length} clues — VALID`);
    pass++;
  } else {
    console.log(`❌ Level ${lv.level} (${lv.tierName}): ${errors.length} errors`);
    errors.forEach(e => console.log(`   ${e}`));
    fail++;
  }
}

console.log(`\n=== RESULT: ${pass}/${LEVELS.length} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
