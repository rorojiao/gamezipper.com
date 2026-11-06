#!/usr/bin/env node
// R340: authoritative pentomino level audit.
// Extracts the ENGINE's own PENTOMINOES_LOCAL table + allOrientationsLocal
// from pentomino/index.html (no re-implementation -- Pitfall #74) and then:
//   1. reports whether each named piece's orientation set is DISTINCT
//      (two names with the same orientation set are the same free shape:
//       the game cannot tell them apart)
//   2. exact-cover solvability for every level in levels.json (audit source)
//      and levels-data.js (runtime source)
//   3. duplicate detection on the CONTENT identity (region + piece multiset)
//
// Usage: node .audit/r340-pentomino-audit.js [SITE_ROOT]

const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'pentomino');

function extractBalanced(src, openIdx) {
  const open = src[openIdx];
  const close = open === '[' ? ']' : '}';
  let depth = 0, instr = null, esc = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (instr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === instr) instr = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { instr = ch; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return null;
}

const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');

// --- extract PENTOMINOES_LOCAL ---
const shapesMatch = html.match(/PENTOMINOES_LOCAL\s*=\s*\{/);
if (!shapesMatch) { console.error('FATAL: PENTOMINOES_LOCAL not found'); process.exit(2); }
const shapesStart = shapesMatch.index + shapesMatch[0].length - 1;
const SHAPES = eval('(' + extractBalanced(html, shapesStart) + ')');

// --- extract PIECE_ORDER ---
const orderMatch = html.match(/PIECE_ORDER\s*=\s*\[([^\]]*)\]/);
const PIECE_ORDER = eval('[' + orderMatch[1] + ']');

// --- engine orientation logic, copied VERBATIM from index.html ---
function normalizePiece(piece) {
  let minR = Infinity, minC = Infinity;
  for (const [r, c] of piece) { if (r < minR) minR = r; if (c < minC) minC = c; }
  const out = [];
  for (const [r, c] of piece) out.push([r - minR, c - minC]);
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return JSON.stringify(out);
}
function rotateCW(piece) { return piece.map(([r, c]) => [-c, r]); }
function reflect(piece) { return piece.map(([r, c]) => [r, -c]); }
function allOrientationsLocal(name) {
  const base = SHAPES[name];
  const seen = new Set(); const orientations = []; let cur = base.slice();
  for (let i = 0; i < 4; i++) {
    const normed = normalizePiece(cur);
    if (!seen.has(normed)) { seen.add(normed); orientations.push(JSON.parse(normed)); }
    cur = rotateCW(cur);
  }
  cur = reflect(base);
  for (let i = 0; i < 4; i++) {
    const normed = normalizePiece(cur);
    if (!seen.has(normed)) { seen.add(normed); orientations.push(JSON.parse(normed)); }
    cur = rotateCW(cur);
  }
  return orientations;
}
const ORI = {};
for (const n of PIECE_ORDER) ORI[n] = allOrientationsLocal(n);

// ---------- 1. shape-table distinctness ----------
console.log('=== 1. piece orientation sets (engine allOrientationsLocal) ===');
const sig = {};
for (const n of PIECE_ORDER) {
  const s = ORI[n].map(o => JSON.stringify(o)).sort().join('|');
  (sig[s] = sig[s] || []).push(n);
}
for (const n of PIECE_ORDER) console.log(`  ${n}: ${ORI[n].length} orientations  ${JSON.stringify(SHAPES[n])}`);
console.log('\n  groups of names with IDENTICAL orientation sets (=> same free shape):');
let shapeCollisions = 0;
for (const [s, names] of Object.entries(sig)) {
  if (names.length > 1) { shapeCollisions++; console.log('    COLLISION: ' + names.join(' === ')); }
}
if (!shapeCollisions) console.log('    (none - all 12 shapes distinct)');

// ---------- helpers ----------
function cellsOf(outline) {
  const cells = [];
  outline.forEach((row, r) => row.split('').forEach((ch, c) => { if (ch === '#') cells.push([r, c]); }));
  return cells;
}
function placementsFor(name, region) {
  // all placements of piece `name` (any orientation) fully inside region
  const regionSet = new Set(region.map(([r, c]) => r + ',' + c));
  const out = [];
  for (const o of ORI[name]) {
    const or = o.map(([r, c]) => [r, c]);
    const minR = Math.min(...or.map(x => x[0])), minC = Math.min(...or.map(x => x[1]));
    const cells = or.map(([r, c]) => [r - minR + 0, c - minC + 0]);
    const h = Math.max(...cells.map(x => x[0])) + 1;
    const w = Math.max(...cells.map(x => x[1])) + 1;
    const maxR = Math.max(...region.map(x => x[0])), maxC = Math.max(...region.map(x => x[1]));
    for (let br = 0; br + h - 1 <= maxR; br++) {
      for (let bc = 0; bc + w - 1 <= maxC; bc++) {
        const placed = cells.map(([r, c]) => [r + br, c + bc]);
        if (placed.every(([r, c]) => regionSet.has(r + ',' + c))) out.push(placed);
      }
    }
  }
  return out;
}
function exactCover(region, pieces) {
  // pieces: array of piece names (multiset). Return true if tileable.
  const target = region.slice().sort().map(x => x[0] + ',' + x[1]).join(';');
  const used = new Set();
  function rec(idx) {
    if (idx === pieces.length) {
      return used.size === region.length;
    }
    const name = pieces[idx];
    for (const pl of placementsFor(name, region)) {
      const keys = pl.map(([r, c]) => r + ',' + c);
      if (keys.some(k => used.has(k))) continue;
      keys.forEach(k => used.add(k));
      if (rec(idx + 1)) return true;
      keys.forEach(k => used.delete(k));
    }
    return false;
  }
  return rec(0);
}

// ---------- load sources ----------
function loadAudit() {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, 'levels.json'), 'utf8'));
  return j.levels || j;
}
function loadRuntime() {
  const s = fs.readFileSync(path.join(DIR, 'levels-data.js'), 'utf8');
  const i = s.indexOf('[');
  const L = eval('(' + s.slice(i).replace(/;\s*$/, '') + ')');
  return L;
}
function auditToCommon(lv) {
  return { rows: lv.rows, cols: lv.cols, outline: lv.outline, pieces: lv.pieces, tier: lv.tier };
}
function runtimeToCommon(lv) {
  const outline = [];
  for (let r = 0; r < lv.r; r++) {
    let row = '';
    for (let c = 0; c < lv.c; c++) row += (lv.o[r * lv.c + c] === 1 ? '#' : '.');
    outline.push(row);
  }
  return { rows: lv.r, cols: lv.c, outline, pieces: lv.p, tier: lv.t };
}

// ---------- 2 + 3 ----------
function auditSource(label, levels, toCommon) {
  console.log(`\n=== ${label} (${levels.length} levels) ===`);
  const unsolved = [];
  const groups = new Map();
  levels.forEach((lv, i) => {
    const cm = toCommon(lv);
    const region = cellsOf(cm.outline);
    const area = region.length;
    const sumPieces = cm.pieces.reduce((a, p) => a + (SHAPES[p] ? SHAPES[p].length : 0), 0);
    if (sumPieces !== area) {
      unsolved.push({ i, why: `area ${area} != pieces area ${sumPieces} (${JSON.stringify(cm.pieces)})`, cm });
      return;
    }
    if (!exactCover(region, cm.pieces)) {
      unsolved.push({ i, why: `no exact cover for ${JSON.stringify(cm.pieces)} in ${JSON.stringify(cm.outline)}`, cm });
      return;
    }
    const key = JSON.stringify([cm.outline, cm.pieces.slice().sort()]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  if (unsolved.length) {
    console.log(`  UNSOLVABLE: ${unsolved.length}`);
    unsolved.forEach(u => console.log(`    idx ${u.i} tier=${u.cm.tier} pieces=${JSON.stringify(u.cm.pieces)} area=${u.cells ? '' : ''}${u.why}`));
  } else {
    console.log('  UNSOLVABLE: 0');
  }
  const dups = [...groups.values()].filter(g => g.length > 1);
  console.log(`  DUPLICATE level groups (region+pieces): ${dups.length}`);
  dups.forEach(g => console.log(`    ${JSON.stringify(g)}  name=${JSON.stringify(g.map(i => levels[i].name))}`));
  return { unsolved, dups };
}

const audit = auditSource('AUDIT levels.json', loadAudit(), auditToCommon);
const runtime = auditSource('RUNTIME levels-data.js', loadRuntime(), runtimeToCommon);

console.log('\n=== CROSS-SOURCE ===');
console.log('  audit unsolved idx   :', audit.unsolved.map(u => u.i).join(',') || '(none)');
console.log('  runtime unsolved idx :', runtime.unsolved.map(u => u.i).join(',') || '(none)');
const aKeys = loadAudit().map(auditToCommon).map(cm => JSON.stringify([cm.outline, cm.pieces.slice().sort()]));
const rKeys = loadRuntime().map(runtimeToCommon).map(cm => JSON.stringify([cm.outline, cm.pieces.slice().sort()]));
const onlyA = aKeys.map((k, i) => [k, i]).filter(([k]) => !rKeys.includes(k)).map(([, i]) => i);
const onlyR = rKeys.map((k, i) => [k, i]).filter(([k]) => !aKeys.includes(k)).map(([, i]) => i);
console.log('  levels only in AUDIT  :', onlyA.join(',') || '(none)');
console.log('  levels only in RUNTIME:', onlyR.join(',') || '(none)');
if (onlyA.length || onlyR.length) {
  console.log('\n  >>> DIVERGENT: the runtime file and the audit file describe different puzzles.');
  onlyA.forEach(i => console.log(`      audit   idx ${i}: ${aKeys[i].slice(0, 120)}`));
  onlyR.forEach(i => console.log(`      runtime idx ${i}: ${rKeys[i].slice(0, 120)}`));
}

const bad = audit.unsolved.length + runtime.unsolved.length + onlyA.length + onlyR.length;
console.log(`\nVERDICT: ${bad === 0 ? 'CONSISTENT' : 'DEFECTIVE (' + bad + ' issues)'}`);
process.exit(bad === 0 ? 0 : 1);
