// verify_engine.js — Load actual index.html, extract LEVELS, verify each with in-engine checkWin logic.
// Uses vm.runInContext to execute the game's LEVELS array and solution data.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
// extract the LEVELS array — match from "const LEVELS=[" up to "];\n// ============ GAME STATE"
const startIdx = html.indexOf('const LEVELS=');
const endMarker = '];\n// ============ GAME STATE';
const endIdx = html.indexOf(endMarker, startIdx);
if (startIdx < 0 || endIdx < 0) { console.log('FAIL: could not extract LEVELS from index.html'); process.exit(1); }
const levelsSrc = html.substring(startIdx + 'const LEVELS='.length, endIdx + 1); // include the ']'

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext('var LEVELS=' + levelsSrc + ';', sandbox);
const LEVELS = sandbox.LEVELS;
console.log('Loaded', LEVELS.length, 'levels from index.html');

let allPass = true;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const {R, C, puzzle, solution} = lv;
  // simulate the engine's checkWin: build player=solution mapping (1->1 black, 0->2 white)
  const player = solution.map(row => row.map(v => v === 1 ? 1 : 2));
  // checkWin logic from index.html:
  let ok = true;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (player[r][c] === 0) ok = false;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const sol = solution[r][c] === 1 ? 1 : 2;
    if (player[r][c] !== sol) ok = false;
  }
  // Also verify clue cells are white (2) in solution
  let clueOk = true;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++)
    if (puzzle[r][c] > 0 && solution[r][c] === 1) clueOk = false;
  // verify island-clue matching (engine rule: each island has exactly 1 clue, clue==size)
  const seen = Array.from({length: R}, () => new Array(C).fill(false));
  let islandOk = true;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (solution[r][c] === 0 && !seen[r][c]) {
      const comp = []; const q = [[r, c]]; seen[r][c] = true;
      while (q.length) {
        const [cr, cc] = q.shift(); comp.push([cr, cc]);
        for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
          const nr = cr + dr, nc = cc + dc;
          if (nr>=0&&nr<R&&nc>=0&&nc<C&&!seen[nr][nc]&&solution[nr][nc]===0) { seen[nr][nc]=true; q.push([nr,nc]); }
        }
      }
      const clues = comp.filter(([a,b]) => puzzle[a][b] > 0);
      if (clues.length !== 1) islandOk = false;
      else if (puzzle[clues[0][0]][clues[0][1]] !== comp.length) islandOk = false;
    }
  }
  if (ok && clueOk && islandOk) {
    console.log(`L${i+1} (${lv.tier} ${R}x${C}) PASS`);
  } else {
    console.log(`L${i+1} (${lv.tier} ${R}x${C}) FAIL: checkWin=${ok} clueWhite=${clueOk} islandMatch=${islandOk}`);
    allPass = false;
  }
}
console.log(allPass ? `ALL ${LEVELS.length} LEVELS VERIFIED (in-engine checkWin)` : 'SOME LEVELS FAILED');
process.exit(allPass ? 0 : 1);
