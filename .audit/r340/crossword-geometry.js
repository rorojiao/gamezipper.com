#!/usr/bin/env node
/**
 * R340 crossword ground-truth probe.
 * Dumps every puzzle's full geometry, clue structure, word coverage and
 * cross-reference to the engine's buildGrid() so we know the EXACT contract
 * a replacement puzzle must satisfy.
 */
const fs = require('fs');
const path = require('path');

const GAME = path.join(__dirname, '..', '..', 'crossword');
const src = fs.readFileSync(path.join(GAME, 'game.js'), 'utf8');

// Balanced-bracket extraction of `const PUZZLES = [...]`
function extract() {
  const i = src.indexOf('const PUZZLES =');
  const a = src.indexOf('[', i);
  let d = 0, q = null, e = 0;
  for (let j = a; j < src.length; j++) {
    const c = src[j];
    if (q) { if (e) e = 0; else if (c === '\\') e = 1; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '[') d++;
    else if (c === ']' && --d === 0) return src.slice(a, j + 1);
  }
  throw new Error('PUZZLES not found');
}
const P = new Function('return ' + extract())();

// --- engine replica: buildGrid ---
function buildGrid(p) {
  const { rows, cols, words } = p;
  const g = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (!g[r][c]) g[r][c] = { wordIds: [w.id], letter: w.answer[i], number: null };
      else g[r][c].wordIds.push(w.id);
    }
  }
  return g;
}

const out = [];
out.push(`TOTAL PUZZLES: ${P.length}`);

// duplicate detection on gameplay identity
const byId = new Map();
P.forEach((p, i) => {
  const key = JSON.stringify(p.words.map(w => [w.dir, w.row, w.col, w.answer]));
  if (!byId.has(key)) byId.set(key, []);
  byId.get(key).push(i);
});
out.push(`\n=== EXACT WORD-SET DUPLICATE GROUPS ===`);
for (const [k, v] of byId) if (v.length > 1) out.push(`  dup group indices: ${JSON.stringify(v)}`);

out.push(`\n=== PER-PUZZLE GEOMETRY ===`);
P.forEach((p, i) => {
  const g = buildGrid(p);
  let cells = 0, single = 0, cross = 0;
  const singles = [];
  for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
    const cd = g[r][c];
    if (!cd) continue;
    cells++;
    if (cd.wordIds.length === 1) { single++; singles.push(`${r},${c}=${cd.letter}`); }
    else cross++;
  }
  const across = p.words.filter(w => w.dir === 'across');
  const down = p.words.filter(w => w.dir === 'down');
  out.push(`\nP${i} (index ${i})  ${p.rows}x${p.cols}  words=${p.words.length} across=${across.length} down=${down.length}`);
  out.push(`   gridcells=${cells} singleWordCells=${single} crossingCells=${cross}`);
  out.push(`   ACROSS: ${across.map(w => `(r${w.row}c${w.col},${w.answer.length},${JSON.stringify(w.answer)})`).join(' ')}`);
  out.push(`   DOWN  : ${down.map(w => `(r${w.row}c${w.col},${w.answer.length},${JSON.stringify(w.answer)})`).join(' ')}`);
  out.push(`   ACROSS CLUES: ${JSON.stringify(across.map(w => w.clue))}`);
  out.push(`   DOWN CLUES  : ${JSON.stringify(down.map(w => w.clue))}`);
  out.push(`   SINGLE-WORD CELLS (only 1 word covers): ${JSON.stringify(singles)}`);
  // how many down words are FULLY determined by crossings (every cell shared with an across word)
  const fullyDetermined = down.filter(w => {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.row + i, c = w.col;
      if (!g[r][c] || g[r][c].wordIds.length < 2) return false;
    }
    return true;
  }).length;
  out.push(`   down words fully crossing-derived: ${fullyDetermined}/${down.length}`);
  out.push(`   grid letters row-major: ${p.rows} rows`);
  for (let r = 0; r < p.rows; r++) {
    let row = '';
    for (let c = 0; c < p.cols; c++) row += g[r][c] ? g[r][c].letter : '.';
    out.push(`     |${row}|`);
  }
});

fs.writeFileSync(path.join(__dirname, 'crossword-geometry.txt'), out.join('\n') + '\n');
console.log('WROTE .audit/r340/crossword-geometry.txt');
console.log(out.slice(0, 40).join('\n'));
