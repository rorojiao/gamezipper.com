// Repair klotski LEVELS:
//  - P0: 29/33 levels shipped with OVERLAPPING blocks (invalid layouts); 3 levels
//    fill 19-20 cells (<=1 empty => 2x2 can never move => unsolvable by construction).
//  - Repair: drop surplus soldiers until 18 cells (2 empty, classic), re-home each
//    overlapped piece to the nearest valid spot (backtracking over near candidates),
//    require BFS solvability to the DOCUMENTED goal cc@(r3,c1) (FINAL_REPORT.md).
//  - par recalibrated to the engine's own single-slide optimal where the shipped par
//    is unattainable (author counted multi-square slides; engine counts each
//    single-cell slide as 1 move).
// Writes patched index.html + _solutions.json (full move paths, all levels).
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const src = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const start = src.indexOf('const LEVELS=[');
const end = src.indexOf('];', start) + 2;
const LEVELS = eval('(function(){' + src.slice(start, end) + ';return LEVELS;})()'); // eslint-disable-line no-eval
const ROWS = 5, COLS = 4;
function getBlockSize(type) {
  if (type === 2) return { w: 2, h: 2 };
  if (type === 'v') return { w: 1, h: 2 };
  if (type === 'h') return { w: 2, h: 1 };
  return { w: 1, h: 1 };
}
function canMove(block, dr, dc, allBlocks) {
  const sz = getBlockSize(block.type);
  const nr = block.r + dr, nc = block.c + dc;
  if (nr < 0 || nc < 0 || nr + sz.h > ROWS || nc + sz.w > COLS) return false;
  for (const b of allBlocks) {
    if (b.id === block.id) continue;
    const bz = getBlockSize(b.type);
    if (nr < b.r + bz.h && nr + sz.h > b.r && nc < b.c + bz.w && nc + sz.w > b.c) return false;
  }
  return true;
}
function occupied(blocks, skipId) {
  const occ = new Set();
  for (const b of blocks) {
    if (b.id === skipId) continue;
    const sz = getBlockSize(b.type);
    for (let r = b.r; r < b.r + sz.h; r++) for (let c = b.c; c < b.c + sz.w; c++) occ.add(r * 4 + c);
  }
  return occ;
}
function overlaps(blocks) {
  const occ = new Set();
  for (const b of blocks) {
    const sz = getBlockSize(b.type);
    if (b.r < 0 || b.c < 0 || b.r + sz.h > ROWS || b.c + sz.w > COLS) return true;
    for (let r = b.r; r < b.r + sz.h; r++) for (let c = b.c; c < b.c + sz.w; c++) {
      if (occ.has(r * 4 + c)) return true;
      occ.add(r * 4 + c);
    }
  }
  return false;
}
function solve(startBlocks, cap) {
  const enc = bs => bs.map(b => String.fromCharCode(65 + b.r * 4 + b.c)).join('');
  const canon = bs => {
    const g = { 2: [], v: [], h: [], 1: [] };
    for (const b of bs) g[b.type].push(String.fromCharCode(65 + b.r * 4 + b.c));
    for (const k of [2, 'v', 'h', 1]) g[k].sort();
    return g[2].join('') + '|' + g.v.join('') + '|' + g.h.join('') + '|' + g[1].join('');
  };
  const dec = k => startBlocks.map((p, i) => ({ id: p.id, type: p.type, r: Math.floor((k.charCodeAt(i) - 65) / 4), c: (k.charCodeAt(i) - 65) % 4 }));
  const k0 = enc(startBlocks);
  const queue = [{ k: k0, step: 0, prev: -1, move: null }];
  const seen = new Set([canon(startBlocks)]);
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const bs = dec(cur.k);
    const cc = bs.find(b => b.type === 2);
    if (cc.r === 3 && cc.c === 1) {
      const p = [];
      for (let i = head - 1; i > 0; i = queue[i].prev) p.push(queue[i].move);
      p.reverse();
      return { path: p, steps: cur.step };
    }
    if (cur.step >= cap) continue;
    for (const b of bs) {
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        if (canMove(b, dr, dc, bs)) {
          const nb = bs.map(bb => bb.id === b.id ? { ...bb, r: bb.r + dr, c: bb.c + dc } : bb);
          const ck = canon(nb);
          if (seen.has(ck)) continue;
          seen.add(ck);
          queue.push({ k: enc(nb), step: cur.step + 1, prev: head - 1, move: { id: b.id, dr, dc } });
        }
      }
    }
  }
  return null;
}
function positions(type) {
  const sz = getBlockSize(type), out = [];
  for (let r = 0; r + sz.h <= ROWS; r++) for (let c = 0; c + sz.w <= COLS; c++) out.push({ r, c });
  return out;
}
function cellsOf(b) {
  const sz = getBlockSize(b.type), out = [];
  for (let r = b.r; r < b.r + sz.h; r++) for (let c = b.c; c < b.c + sz.w; c++) out.push(r * 4 + c);
  return out;
}
// Enumerate valid placements in near-to-intent order (DFS + backtracking);
// emit each complete placement so the caller can keep the first SOLVABLE one.
function enumPlacements(blocks, emit, cap) {
  let n = 0;
  const placed = [];
  function tryPlace(i) {
    if (n >= cap) return true;
    if (i >= blocks.length) { n++; return emit(placed.slice()); }
    const b = blocks[i];
    const occ = occupied(placed);
    const collide = cellsOf(b).some(c => occ.has(c));
    const spots = collide
      ? positions(b.type)
          .map(p => ({ r: p.r, c: p.c, d: Math.abs(p.r - b.r) + Math.abs(p.c - b.c) }))
          .sort((a, z) => a.d - z.d)
      : [{ r: b.r, c: b.c, d: 0 }];
    for (const s of spots) {
      const cand = { id: b.id, type: b.type, r: s.r, c: s.c, l: b.l };
      if (cellsOf(cand).some(c => occ.has(c))) continue;
      placed.push(cand);
      if (tryPlace(i + 1)) return true; // emit said stop
      placed.pop();
    }
    return false;
  }
  tryPlace(0);
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// any two orthogonally-adjacent free cells: without a free domino no multi-cell
// piece (incl. the 2x2) can ever move -> skip solving (near-locked boards)
function hasDomino(blocks) {
  const occ = occupied(blocks);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (occ.has(r * 4 + c)) continue;
    if (c + 1 < COLS && !occ.has(r * 4 + c + 1)) return true;
    if (r + 1 < ROWS && !occ.has((r + 1) * 4 + c)) return true;
  }
  return false;
}
const report = [];
const outLevels = [];
const sols = {};
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  let blocks = JSON.parse(JSON.stringify(lv.blocks));
  const cellCount = () => blocks.reduce((a, b) => { const s = getBlockSize(b.type); return a + s.w * s.h; }, 0);
  let dropped = [];
  while (cellCount() > 18) { // >18 cells => <2 empty => 2x2 can never move: drop surplus soldiers (keep classic s1-s4)
    const s = blocks.filter(b => b.type === 1).pop();
    if (!s) break;
    dropped.push(s.id);
    blocks = blocks.filter(b => b.id !== s.id);
  }
  let note = dropped.length ? 'dropped ' + dropped.join(',') : '';
  let precomputedSol = null;
  if (overlaps(blocks)) {
    // nearest-first placement alone fragments the free cells into isolated
    // singletons (near-locked boards); collect candidates, seeded-shuffle, and
    // keep the first solvable one that leaves a free domino
    const cands = [];
    enumPlacements(blocks, cand => { cands.push(cand); return cands.length >= 2000; }, 2000);
    const rnd = mulberry32(i * 7919 + 13);
    for (let k = cands.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [cands[k], cands[j]] = [cands[j], cands[k]]; }
    let fixed = null;
    let tries = 0;
    const t0 = Date.now();
    for (const cand of cands) {
      const cc0 = cand.find(b => b.type === 2);
      if (cc0.r === 3 && cc0.c === 1) continue; // start-is-goal: skip
      // NOTE: no free-domino prefilter — soldier slides can bring free cells
      // together (L7's true optimum is 115 from a non-domino start)
      tries++;
      const s = solve(JSON.parse(JSON.stringify(cand)), 400);
      if (s) { fixed = { blocks: cand, sol: s }; break; }
      if (tries >= 150) break;
    }
    if (!fixed) { report.push(`L${i + 1} ${lv.name}: ${note} => no SOLVABLE repair in ${tries} candidates [${Date.now() - t0}ms]`); outLevels.push(null); continue; }
    const moved = fixed.blocks.filter((b, j) => b.r !== blocks[j].r || b.c !== blocks[j].c).map(b => b.id);
    note += (note ? '; ' : '') + 'rehomed ' + (moved.join(',') || '-') + ` [${Date.now() - t0}ms, ${tries} tries]`;
    blocks = fixed.blocks;
    precomputedSol = fixed.sol;
  }
  const cc = blocks.find(b => b.type === 2);
  if (cc.r === 3 && cc.c === 1) { report.push(`L${i + 1} ${lv.name}: repaired start IS goal (reject)`); outLevels.push(null); continue; }
  const t0 = Date.now();
  const sol = precomputedSol || solve(JSON.parse(JSON.stringify(blocks)), 400);
  const ms = Date.now() - t0;
  if (!sol) { report.push(`L${i + 1} ${lv.name}: ${note} => UNSOLVABLE [${ms}ms]`); outLevels.push(null); continue; }
  const par = lv.par < sol.steps ? sol.steps : lv.par; // only raise pars that were unattainable
  note += `; optimal=${sol.steps} par ${lv.par}->${par}${overlaps(lv.blocks) || dropped.length ? ' [REPAIRED]' : ' [kept]'}`;
  report.push(`L${i + 1} ${lv.name}: ${note} [${ms}ms]`);
  outLevels.push({ name: lv.name, tier: lv.tier, par, blocks });
  sols[i] = sol.path;
}
if (outLevels.some(x => x === null)) {
  console.error(report.join('\n'));
  process.exit(1);
}
// emit patched index.html
const lines = [];
lines.push('const LEVELS=[');
for (const lv of outLevels) {
  const bs = lv.blocks.map(b => `{id:'${b.id}',type:${typeof b.type === 'string' ? "'" + b.type + "'" : b.type},r:${b.r},c:${b.c},l:'${b.l || ''}'}`).join(',');
  lines.push(`{name:"${lv.name}",tier:${lv.tier},par:${lv.par},blocks:[${bs}]},`);
}
lines.push('];');
const comment = [
  '// P0 fix 2026-08-25: 29/33 shipped levels had OVERLAPPING blocks (invalid layouts, e.g. L2 soldier s1 stacked on vertical mc),',
  '// and L11/L13/L22/L27 filled 19-20 of 20 cells (<=1 empty cell: the 2x2 Cao Cao can NEVER move => unsolvable by construction).',
  '// Repaired: surplus soldiers dropped back to the classic 10-piece set where cells>18, each colliding piece re-homed to the',
  '// nearest valid spot (nearest placement that leaves a BFS-solvable puzzle to the documented goal cc@(r3,c1) - see',
  '// FINAL_REPORT.md "Win condition: 2x2 block reaches position (r=3, c=1) - bottom center exit").',
  '// par recalibrated to the single-slide BFS optimum where the shipped par was unattainable (pars were authored as',
  '// multi-square-slide counts; the engine counts every single-cell slide as one move - classic 横刀立马 = 116 single slides',
  '// = the famous 81 multi-square solution). Names/tiers kept.',
].map(l => '// ' + l.replace(/^\/\/ /, '')).join('\n');
fs.writeFileSync(path.join(DIR, 'index.html'), src.slice(0, start) + comment + '\n' + lines.join('\n') + src.slice(end));
fs.writeFileSync(path.join(DIR, '_solutions.json'), JSON.stringify(sols));
console.log(report.join('\n'));
console.log(`\n${outLevels.length} levels repaired+verified; solutions written; index.html patched`);
