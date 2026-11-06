#!/usr/bin/env node
/* R337 queens — how far from unique are the shipped levels? */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'queens', 'index.html'), 'utf8');
function extractArray(src, marker) {
  const m = src.match(marker); if (!m) return null;
  let i = m.index + m[0].length; const start = i; let depth = 1;
  while (i < src.length && depth > 0) { const c = src[i]; if (c === '[') depth++; else if (c === ']') depth--; i++; }
  return src.slice(start, i - 1);
}
const raw = extractArray(html, /var PUZZLE_DATA\s*=\s*\[/);
const PUZZLE_DATA = eval('(' + '[' + raw + ']' + ')');
function countExact(n, regions) {
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  let count = 0;
  (function bt(row) {
    if (row === n) { count++; return; }
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
  return count;
}
let tot = 0, list = [];
for (const p of PUZZLE_DATA) {
  const c = countExact(p.n, p.regions);
  tot += c;
  list.push({ id: p.id, n: p.n, solutions: c });
  console.log('  level ' + String(p.id).padStart(2) + ' n=' + p.n + '  solutions=' + c);
}
console.log('TOTAL solutions across 30 levels: ' + tot);
console.log(JSON.stringify(list));
