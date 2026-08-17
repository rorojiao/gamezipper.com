// Aqre solvability verifier (sweep 79, 2026-08-17)
// Validates embedded solutions against room-tiling + clue-count + no-3-in-line.
// All 24 levels passed as of 2026-08-17.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const startIdx = html.indexOf('var LEVELS=');
if (startIdx < 0) { console.error('LEVELS not found'); process.exit(2); }
const arrayStart = html.indexOf('[', startIdx);
let depth = 0, inStr = false, esc = false;
let arrStr = null;
for (let i = arrayStart; i < html.length; i++) {
  const c = html[i];
  if (inStr) { if (c === '\\') esc = !esc; else if (c === '"' && !esc) inStr = false; continue; }
  if (c === '"') { inStr = true; continue; }
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { arrStr = html.substring(arrayStart, i + 1); break; } }
}
const LEVELS = eval('(' + arrStr + ')');
let pass = 0, fail = 0;
const fails = [];
LEVELS.forEach((L, idx) => {
  const rg = Array(L.rows).fill().map(() => Array(L.cols).fill(-1));
  L.rooms.forEach((rm, i) => { for (let r = rm[0]; r <= rm[2]; r++) for (let c = rm[1]; c <= rm[3]; c++) rg[r][c] = i; });
  let three = false;
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols - 2; c++)
    if (L.solution[r*L.cols+c]===1 && L.solution[r*L.cols+c+1]===1 && L.solution[r*L.cols+c+2]===1) three = true;
  for (let c = 0; c < L.cols; c++) for (let r = 0; r < L.rows - 2; r++)
    if (L.solution[r*L.cols+c]===1 && L.solution[(r+1)*L.cols+c]===1 && L.solution[(r+2)*L.cols+c]===1) three = true;
  let clueOk = true;
  for (const k in L.clues) {
    const rm = L.rooms[+k];
    let cnt = 0;
    for (let r = rm[0]; r <= rm[2]; r++) for (let c = rm[1]; c <= rm[3]; c++)
      if (L.solution[r*L.cols+c] === 1) cnt++;
    if (cnt !== L.clues[k]) { clueOk = false; break; }
  }
  let unalloc = 0;
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) if (rg[r][c] === -1) unalloc++;
  if (!three && clueOk && unalloc === 0) pass++;
  else { fail++; fails.push({ idx, tier: L.tier, three, clueOk, unalloc }); }
});
console.log(`Aqre: ${pass}/${LEVELS.length} levels have valid stored solutions`);
if (fail) console.log('Failed:', JSON.stringify(fails));
process.exit(pass === LEVELS.length ? 0 : 1);