// anti-knight-sudoku verify_engine.js
// Validates all 27 levels in LEVELS_DATA: 6x6 (Beginner/Easy/Medium) or 9x9 (Hard/Expert/Master)
// - Sudoku: rows/cols/boxes have 1-N exactly once
// - Anti-knight: no two cells a knight's move apart share a digit
// - Puzzle cells are subset of solution
const fs = require('fs');
const path = require('path');

const SLUG = 'anti-knight-sudoku';
const HTML = fs.readFileSync(path.join(SLUG, 'index.html'), 'utf8');

// Extract LEVELS_DATA = [...] using balanced-bracket
const idx = HTML.indexOf('const LEVELS_DATA');
if (idx < 0) { console.error('LEVELS_DATA not found'); process.exit(1); }
const arrStart = HTML.indexOf('[', idx);
if (arrStart < 0) { console.error('no [ after LEVELS_DATA'); process.exit(1); }
let depth = 0;
let inStr = false;
let esc = false;
let arrEnd = -1;
for (let i = arrStart; i < HTML.length; i++) {
  const c = HTML[i];
  if (esc) { esc = false; continue; }
  if (c === '\\') { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === '[') depth++;
  else if (c === ']') {
    depth--;
    if (depth === 0) { arrEnd = i; break; }
  }
}
if (arrEnd < 0) { console.error('unbalanced brackets in LEVELS_DATA'); process.exit(1); }
const literal = HTML.slice(arrStart, arrEnd + 1);
let levels;
try {
  levels = JSON.parse(literal);
} catch (e) { console.error('JSON parse err:', e.message); process.exit(1); }
console.log('Extracted ' + levels.length + ' levels');

function validate(L) {
  const p = L.p, s = L.s, N = L.N;
  if (!Array.isArray(p) || p.length !== N) return 'p shape != ' + N;
  if (!Array.isArray(s) || s.length !== N) return 'sol shape != ' + N;
  for (let r = 0; r < N; r++) {
    if (!Array.isArray(p[r]) || p[r].length !== N) return 'p col shape';
    if (!Array.isArray(s[r]) || s[r].length !== N) return 's col shape';
  }
  // row/col check
  for (let r = 0; r < N; r++) {
    const rs = new Set(), cs = new Set();
    for (let c = 0; c < N; c++) {
      if (s[r][c] < 1 || s[r][c] > N) return 'sol range';
      rs.add(s[r][c]); cs.add(s[c][r]);
    }
    if (rs.size !== N) return 'row ' + r + ' dup';
    if (cs.size !== N) return 'col ' + r + ' dup';
  }
  // box check (works for 6x6 with 2x3 boxes, 9x9 with 3x3)
  const boxH = N === 6 ? 2 : 3;
  const boxW = N === 6 ? 3 : 3;
  for (let br = 0; br < N / boxH; br++) for (let bc = 0; bc < N / boxW; bc++) {
    const box = new Set();
    for (let r = br * boxH; r < (br + 1) * boxH; r++) for (let c = bc * boxW; c < (bc + 1) * boxW; c++) {
      box.add(s[r][c]);
    }
    if (box.size !== N) return 'box ' + br + '-' + bc + ' dup';
  }
  // anti-knight
  const moves = [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const v = s[r][c];
    for (const [dr, dc] of moves) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && s[nr][nc] === v) {
        return 'knight conflict (' + r + ',' + c + ')-(' + nr + ',' + nc + ') both ' + v;
      }
    }
  }
  // puzzle subset of solution
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (p[r][c] !== 0 && p[r][c] !== s[r][c]) return 'given mismatch (' + r + ',' + c + ')';
  }
  return null;
}

const issues = [];
const tierCount = {};
for (let i = 0; i < levels.length; i++) {
  const L = levels[i];
  tierCount[L.tier] = (tierCount[L.tier] || 0) + 1;
  const err = validate(L);
  if (err) issues.push({ i, tier: L.tier, err });
}
console.log('Per tier:', tierCount);
console.log('Issues: ' + issues.length);
if (issues.length) for (const i of issues.slice(0, 5)) console.log('  FAIL', i);
if (issues.length === 0) {
  console.log('anti-knight-sudoku: ' + levels.length + '/' + levels.length + ' PASS');
  process.exit(0);
} else {
  console.log('anti-knight-sudoku: ' + issues.length + '/' + levels.length + ' FAIL');
  process.exit(1);
}
