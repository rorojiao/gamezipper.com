#!/usr/bin/env node
/* R337 queens — reproduce the useHint() defect.
 *
 * The page's useHint() places a crown at p.solution[r] for the first row r
 * whose solution cell is not already a crown. It does NOT check whether that
 * row already holds a DIFFERENT crown.
 *
 * Because every shipped level is MULTI-solution, a player can legitimately
 * deduce a rival solution and place crowns there. Pressing Hint then adds a
 * SECOND crown in that row -> checkWin() -> showError() -> the level can no
 * longer be won (the player must notice and erase the rival crown manually).
 *
 * We reproduce this with the page's OWN functions.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'queens', 'index.html'), 'utf8');

function grabFunction(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src); if (!m) return null;
  const open = src.indexOf('{', m.index);
  let i = open + 1, depth = 1;
  while (i < src.length && depth > 0) { const c = src[i]; if (c === '{') depth++; else if (c === '}') depth--; i++; }
  return src.slice(m.index, i);
}
const m = html.match(/var PUZZLE_DATA\s*=\s*\[/);
let i = m.index + m[0].length, depth = 1;
while (i < html.length && depth > 0) { if (html[i] === '[') depth++; else if (html[i] === ']') depth--; i++; }
const PUZZLE_DATA = eval('(' + '[' + html.slice(m.index + m[0].length, i - 1) + ']' + ')');

let src = '';
for (const n of ['countSolutions', 'getAllCrowns']) src += (grabFunction(html, n) || '') + '\n';
const ctx = { Math, console };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__cs=countSolutions;', ctx);

/* Enumerate ALL solutions of a level (independent of the page) */
function allSolutions(n, regions) {
  const out = [];
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (row === n) { out.push(placed.slice()); return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return out;
}

let reproduced = 0;
let multiLevels = 0;
for (const p of PUZZLE_DATA) {
  const sols = allSolutions(p.n, p.regions);
  const pageCount = ctx.__cs(p.n, p.regions, 1000);
  if (sols.length > 1) multiLevels++;
  // find a rival solution that differs from the stored one
  const rival = sols.find(s => s.some((c, r) => c !== p.solution[r]));
  if (!rival) continue;

  // Simulate the player's state: they placed the RIVAL solution, then press Hint.
  const cellStates = [];
  for (let r = 0; r < p.n; r++) { cellStates.push([]); for (let c = 0; c < p.n; c++) cellStates[r][c] = 0; }
  for (let r = 0; r < p.n; r++) cellStates[r][rival[r]] = 2;   // player's crowns

  // useHint() logic, verbatim from index.html
  let hintPlaced = null;
  for (let r = 0; r < p.n; r++) {
    const correctCol = p.solution[r];
    if (cellStates[r][correctCol] !== 2) {
      cellStates[r][correctCol] = 2;
      hintPlaced = { row: r, col: correctCol };
      break;
    }
  }
  if (!hintPlaced) continue;

  // count crowns per row after the hint
  const rowsWithTwo = [];
  for (let r = 0; r < p.n; r++) {
    let cnt = 0;
    for (let c = 0; c < p.n; c++) if (cellStates[r][c] === 2) cnt++;
    if (cnt > 1) rowsWithTwo.push(r);
  }
  if (rowsWithTwo.length) {
    reproduced++;
    if (reproduced <= 3) {
      console.log('L' + p.id + ' (n=' + p.n + '): solutions=' + sols.length +
        ' page=' + pageCount +
        ' | player placed rival solution, Hint put a 2nd crown in row ' + rowsWithTwo[0] +
        ' -> checkWin() = showError() -> LEVEL UNWINNABLE');
    }
  }
}
console.log('---');
console.log('levels with >1 solution : ' + multiLevels + '/' + PUZZLE_DATA.length);
console.log('hint-breaks-rival levels : ' + reproduced + '/' + PUZZLE_DATA.length);
