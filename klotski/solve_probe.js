// Offline BFS solver for klotski: replicate getBlockSize/canMove, solve every
// LEVELS entry to the DOCUMENTED win condition cc@(r=3,c=1) (FINAL_REPORT.md:
// "2×2 block reaches position (r=3, c=1) — bottom center exit").
// Emits _solutions.json {idx:[{id,dr,dc}...]} + solvability report.
'use strict';
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/index.html', 'utf8');
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
// validate: in-bounds + no overlap + one cc
function validate(lv) {
  const occ = new Set();
  let cc = 0, cells = 0;
  for (const b of lv.blocks) {
    const sz = getBlockSize(b.type);
    if (b.r < 0 || b.c < 0 || b.r + sz.h > ROWS || b.c + sz.w > COLS) return 'OOB ' + b.id;
    for (let r = b.r; r < b.r + sz.h; r++) for (let c = b.c; c < b.c + sz.w; c++) {
      if (occ.has(r + ',' + c)) return 'OVERLAP ' + b.id;
      occ.add(r + ',' + c); cells++;
    }
    if (b.type === 2) cc++;
  }
  if (cc !== 1) return 'CC=' + cc;
  return null;
}
function solve(startBlocks, cap) {
  // compact real-state encoding: one char per piece (fixed order), 'A'+r*4+c.
  // seen-set canonicalizes by identical-piece symmetry (same-type pieces sorted),
  // collapsing e.g. 4!x4! interchangeable vertical/soldier permutations (~576x).
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
      const path = [];
      for (let i = head - 1; i > 0; i = queue[i].prev) path.push(queue[i].move);
      path.reverse();
      return { path, steps: cur.step };
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
const sols = {};
const report = [];
let bad = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const v = validate(lv);
  if (v) { report.push(`L${i + 1} ${lv.name} INVALID: ${v}`); bad++; continue; }
  const cells = lv.blocks.reduce((a, b) => { const s = getBlockSize(b.type); return a + s.w * s.h; }, 0);
  const empt = 20 - cells;
  const ccStart = lv.blocks.find(b => b.type === 2);
  const t0 = Date.now();
  const sol = solve(JSON.parse(JSON.stringify(lv.blocks)), 400);
  const ms = Date.now() - t0;
  if (!sol) {
    report.push(`L${i + 1} ${lv.name} tier${lv.tier} par${lv.par} empty=${empt} ccStart=(${ccStart.r},${ccStart.c}) UNSOLVABLE-to-(3,1) [${ms}ms]`);
    bad++;
  } else {
    sols[i] = sol.path;
    report.push(`L${i + 1} ${lv.name} tier${lv.tier} par${lv.par} empty=${empt} ccStart=(${ccStart.r},${ccStart.c}) optimal=${sol.steps}${sol.steps <= lv.par ? '' : ' >PAR!'}`);
  }
}
console.log(report.join('\n'));
console.log(`\n${LEVELS.length} levels, ${bad} bad`);
fs.writeFileSync(__dirname + '/_solutions.json', JSON.stringify(sols));
console.log('solutions for ' + Object.keys(sols).length + ' levels written');
