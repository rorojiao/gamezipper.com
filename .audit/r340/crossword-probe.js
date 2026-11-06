#!/usr/bin/env node
// R340 crossword structure probe: determine how down answers relate to across answers.
const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join(__dirname, '..', '..', 'crossword', 'game.js'), 'utf8');
function ext() {
  const i = s.indexOf('const PUZZLES =');
  const a = s.indexOf('[', i);
  let d = 0, q = null, e = 0;
  for (let j = a; j < s.length; j++) {
    const c = s[j];
    if (q) { if (e) e = 0; else if (c === '\\') e = 1; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '[') d++;
    else if (c === ']' && --d === 0) return s.slice(a, j + 1);
  }
}
const P = new Function('return ' + ext())();

for (const pi of [0, 1, 12, 17]) {
  const p = P[pi];
  console.log(`\n=== P${pi} ${p.title} ${p.rows}x${p.cols} (${p.words.length} words) ===`);
  const across = p.words.filter(w => w.dir === 'across');
  const down = p.words.filter(w => w.dir === 'down');
  console.log('ACROSS:');
  across.forEach(w => console.log(`   ${w.id} row${w.row} col${w.col} len${w.answer.length} ${w.answer}`));
  console.log('DOWN:');
  for (const w of down) {
    // which across words intersect this down word?
    const inter = [];
    for (const a of across) {
      if (a.row >= w.row && a.row < w.row + w.answer.length &&
          a.col <= w.col && a.col + a.answer.length > w.col) {
        const li = w.col - a.col;
        inter.push(`${a.id}[r${a.row}]=${a.answer[li]}(pos${w.row - w.row})`);
      }
    }
    console.log(`   ${w.id} row${w.row} col${w.col} len${w.answer.length} ${w.answer}  <- ${inter.join(' ')}`);
    // Does the down answer's letters at the intersecting rows match?
    let allMatch = true;
    for (const a of across) {
      if (a.row >= w.row && a.row < w.row + w.answer.length &&
          a.col <= w.col && a.col + a.answer.length > w.col) {
        const li = w.col - a.col;
        const want = a.answer[li];
        const got = w.answer[a.row - w.row];
        if (want !== got) { allMatch = false; console.log(`      MISMATCH at row${a.row}: across=${want} down=${got}`); }
      }
    }
    if (allMatch) console.log('      => intersections consistent');
  }
}
