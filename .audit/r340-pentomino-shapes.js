#!/usr/bin/env node
// Enumerate all 12 FREE pentominoes from scratch and compare with the engine's
// PENTOMINOES_LOCAL table.  Answers: which shape is the engine's "N" really,
// and which canonical pentomino is MISSING from the engine.
//
// A free polyomino = an equivalence class under rotation AND reflection, so
// the canonical key is the sorted set of all (rotation, reflection) variants.

function normalize(cells) {
  let minR = Infinity, minC = Infinity;
  for (const [r, c] of cells) { if (r < minR) minR = r; if (c < minC) minC = c; }
  const out = cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return JSON.stringify(out);
}
function rot(cells) { return cells.map(([r, c]) => [-c, r]); }
function refl(cells) { return cells.map(([r, c]) => [r, -c]); }
function variants(cells) {
  const seen = new Set(); const out = [];
  for (const base of [cells, refl(cells)]) {
    let cur = base.slice();
    for (let i = 0; i < 4; i++) { const k = normalize(cur); if (!seen.has(k)) { seen.add(k); out.push(JSON.parse(k)); } cur = rot(cur); }
  }
  return out;
}
function key(cells) {
  return variants(cells).map(v => JSON.stringify(v)).sort().join('|');
}

// --- generate all fixed polyominoes of size 5 ---
function grow(cells) {
  const set = new Set(cells.map(([r, c]) => r + ',' + c));
  const out = new Map();
  for (const [r, c] of cells) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (r + dr) + ',' + (c + dc);
      if (set.has(k)) continue;
      const nc = cells.concat([[r + dr, c + dc]]);
      const nk = normalize(nc);
      if (!out.has(nk)) out.set(nk, nc);
    }
  }
  return [...out.values()];
}
let poly = [[[0, 0]]];
for (let n = 1; n < 5; n++) { const next = []; for (const p of poly) for (const g of grow(p)) next.push(g); poly = next; }
console.log('fixed pentominoes generated:', poly.length);

// group by free key
const freeGroups = new Map();
for (const p of poly) {
  const k = key(p);
  if (!freeGroups.has(k)) freeGroups.set(k, []);
  freeGroups.get(k).push(p);
}
console.log('FREE pentomino classes:', freeGroups.size);
const classList = [...freeGroups.entries()].map(([k, members]) => ({ k, n: members.length, members }));
classList.sort((a, b) => b.n - a.n);

// --- engine table ---
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(process.argv[2] || '.', 'pentomino', 'index.html'), 'utf8');
function extractBalanced(src, openIdx) {
  const open = src[openIdx]; const close = open === '[' ? ']' : '}';
  let depth = 0, instr = null, esc = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (instr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === instr) instr = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { instr = ch; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; continue; }
    if (ch === open) depth++; else if (ch === close) { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return null;
}
const m = html.match(/PENTOMINOES_LOCAL\s*=\s*\{/);
const SHAPES = eval('(' + extractBalanced(html, m.index + m[0].length - 1) + ')');
const ORDER = eval('[' + html.match(/PIECE_ORDER\s*=\s*\[([^\]]*)\]/)[1] + ']');

console.log('\n=== engine piece -> free class ===');
const engineKeys = new Map();
for (const name of ORDER) {
  const k = key(SHAPES[name]);
  const cls = classList.find(c => c.k === k);
  engineKeys.set(name, k);
  console.log(`  ${name}: orientations=${variants(SHAPES[name]).length} classSize=${cls ? cls.n : 'NOT-A-PENTOMINO'}`);
}
// collisions
const byKey = new Map();
for (const [name, k] of engineKeys) { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(name); }
console.log('\n=== engine name collisions (same free shape under 2 names) ===');
let coll = 0;
for (const [k, names] of byKey) if (names.length > 1) { coll++; console.log('  COLLISION: ' + names.join(' === ')); }
if (!coll) console.log('  (none)');

// which canonical class is unrepresented?
const used = new Set(engineKeys.values());
console.log('\n=== canonical free pentominoes NOT present in the engine table ===');
for (const c of classList) {
  if (!used.has(c.k)) {
    console.log('  MISSING class, orientation count =', variants(c.members[0]).length, ' representative cells =', JSON.stringify(c.members[0]));
  }
}
