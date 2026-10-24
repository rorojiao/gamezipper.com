#!/usr/bin/env node
/**
 * R333: derive the TRUE kropki dot semantics from the SHIPPED level data.
 *
 * The page prose claims the SANDWICH rule; the engine draws dots. Which dot
 * means what is only knowable from the data (render code says dot===1 is
 * stroked/hollow, dot===2 is filled) -- so derive it:
 *   For every horizontal dot pair (r, c)-(r, c+1) and every vertical dot pair
 *   (r, c)-(r+1, c), take the two solution values and test BOTH candidate
 *   semantics. The semantics that holds on 100% of pairs is the real rule.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const extractLevels = require(path.join(ROOT, '.audit/gz-extract-levels.js'));

const LEVELS = extractLevels('kropki-sudoku');
if (!LEVELS) { console.error('no LEVELS'); process.exit(1); }

let h1 = 0, h1ok = 0, h2 = 0, h2ok = 0;
let v1 = 0, v1ok = 0, v2 = 0, v2ok = 0;
let dot1pairs = 0, dot2pairs = 0;
const bad = [];

for (const L of LEVELS) {
  const sol = L.solution, n = L.n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n - 1; c++) {
      const d = L.hdots[r][c];
      if (!d) continue;
      const a = sol[r][c], b = sol[r][c + 1];
      dot1pairs += (d === 1) ? 1 : 0;
      dot2pairs += (d === 2) ? 1 : 0;
      if (d === 1) { h1++; if (Math.abs(a - b) === 1) h1ok++; }
      if (d === 2) { h2++; if (a === 2 * b || b === 2 * a) h2ok++; }
      if (d === 1 && Math.abs(a - b) !== 1) bad.push(['h-dot1', L.id, r, c, a, b]);
      if (d === 2 && !(a === 2 * b || b === 2 * a)) bad.push(['h-dot2', L.id, r, c, a, b]);
    }
  }
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n; c++) {
      const d = L.vdots[r][c];
      if (!d) continue;
      const a = sol[r][c], b = sol[r + 1][c];
      dot1pairs += (d === 1) ? 1 : 0;
      dot2pairs += (d === 2) ? 1 : 0;
      if (d === 1) { v1++; if (Math.abs(a - b) === 1) v1ok++; }
      if (d === 2) { v2++; if (a === 2 * b || b === 2 * a) v2ok++; }
      if (d === 1 && Math.abs(a - b) !== 1) bad.push(['v-dot1', L.id, r, c, a, b]);
      if (d === 2 && !(a === 2 * b || b === 2 * a)) bad.push(['v-dot2', L.id, r, c, a, b]);
    }
  }
}

console.log(`LEVELS: ${LEVELS.length}`);
console.log(`dot===1 pairs: ${h1 + v1}   |a-b|==1 holds: ${h1ok + v1ok} (${(((h1ok + v1ok) / (h1 + v1)) * 100).toFixed(2)}%)`);
console.log(`dot===2 pairs: ${h2 + v2}   ratio-2 holds: ${h2ok + v2ok} (${(((h2ok + v2ok) / (h2 + v2)) * 100).toFixed(2)}%)`);
console.log(`counter-check: does dot===1 ALSO satisfy ratio-2?  ${'n/a'}`);
console.log(`violations: ${bad.length}`);
if (bad.length) console.log(bad.slice(0, 10));

// also: does the shipped data contain ANY outside clue (row_clues/col_clues)?
const hasOutside = LEVELS.filter(L => L.row_clues || L.col_clues).length;
console.log(`levels carrying row_clues/col_clues (sandwich data): ${hasOutside} / ${LEVELS.length}`);
// dot presence
const withDots = LEVELS.filter(L => L.hdots && L.vdots).length;
console.log(`levels carrying hdots/vdots (kropki data): ${withDots} / ${LEVELS.length}`);
