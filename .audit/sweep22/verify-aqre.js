// Independent verifier for aqre
// Tests: 24 LEVELS, all solutions validate against INDEX-based clues (engine-style)
const fs = require('fs');
const html = fs.readFileSync('aqre/index.html', 'utf8');

// Extract LEVELS via balanced bracket
const startToken = 'var LEVELS=[';
const startIdx = html.indexOf(startToken);
const arrStart = startIdx + 'var LEVELS='.length;
let depth = 0, end = arrStart;
for (let i = arrStart; i < html.length; i++) {
  const c = html[i];
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const LEVELS = (new Function('return ' + html.slice(arrStart, end) + ';'))();
console.log(`LEVELS count: ${LEVELS.length}`);

function validate(level) {
  const { rows, cols, rooms, clues, solution, nBlack } = level;
  const errs = [];
  if (solution.length !== rows * cols) {
    errs.push(`solution len ${solution.length} != ${rows * cols}`);
  }
  // Engine-style check: for each k in clues, rooms[k] is a rect [r0,c0,r1,c1]
  for (const k in clues) {
    const i = +k;
    const rm = rooms[i];
    if (!rm) { errs.push(`clue[${k}] → rooms[${i}] undef`); continue; }
    const [r0, c0, r1, c1] = rm;
    let cnt = 0;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (solution[r * cols + c] === 1) cnt++;
      }
    }
    if (cnt !== clues[k]) errs.push(`clue[${k}]: exp ${clues[k]} got ${cnt}`);
  }
  // No 3-in-a-row
  for (let r = 0; r < rows; r++) {
    let run = 0;
    for (let c = 0; c < cols; c++) {
      run = solution[r * cols + c] === 1 ? run + 1 : 0;
      if (run >= 3) errs.push(`row ${r} 3-in-row`);
    }
  }
  for (let c = 0; c < cols; c++) {
    let run = 0;
    for (let r = 0; r < rows; r++) {
      run = solution[r * cols + c] === 1 ? run + 1 : 0;
      if (run >= 3) errs.push(`col ${c} 3-in-col`);
    }
  }
  return errs;
}

let pass = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const errs = validate(LEVELS[i]);
  if (errs.length === 0) pass++;
  else console.log(`  L${i+1} ${LEVELS[i].tier}: ${errs.join('; ')}`);
}
console.log(`\n${pass}/${LEVELS.length} solvable`);

const checks = {
  'h1': html.match(/<h1[^>]*>/i),
  'monetag-manager': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  'canvas#board': html.includes('id="board"'),
  'btnPlay': html.includes('id="btnPlay"'),
  'levelList': html.includes('id="levelList"'),
  'function checkWin': html.includes('function checkWin'),
  'computeViolations': html.includes('computeViolations'),
  'isRoomSatisfied': html.includes('isRoomSatisfied'),
  'FAQ shading rules': html.includes('no three black cells'),
  'tut 24 levels': LEVELS.length === 24
};
console.log('\n--- chrome/feature checks ---');
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${k}: ${v ? 'OK' : 'MISS'}`);
}
const allOk = pass === LEVELS.length && Object.values(checks).every(Boolean);
console.log(`\nVERDICT: ${allOk ? 'PASS' : 'FAIL'}`);
process.exit(allOk ? 0 : 1);
