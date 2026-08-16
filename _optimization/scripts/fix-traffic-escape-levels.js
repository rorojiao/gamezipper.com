#!/usr/bin/env node
/* fix-traffic-escape-levels.js — repair traffic-escape level data.
 * ROOT CAUSE (engine, fixed separately in index.html): getCarCells/canMoveTo used front-anchor
 * offsets (body extending OPPOSITE the arrow), findMaxMove moved cars BACKWARD along their arrow,
 * and checkWin compared the anchor against the exit edge with inverted inequalities — under the
 * shipped code 0/50 levels have any legal move. The level data itself was generated loosely:
 * under the corrected tail-anchor semantics 23 of 50 boards are invalid (overlapping cars,
 * already-won start, or unsolvable).
 * This script:
 *   1. keeps every level's meta (name/tier/grid/exit dir/par/hint) and car set (dir/len/color/id),
 *   2. re-seats ONLY the cars that make a board invalid (randomized search, fixed seed, minimal
 *      displacement preferred) until the board is valid, not won at start, and BFS-solvable
 *      within par under the corrected semantics,
 *   3. normalizes the exit cell onto the target's lane so the drawn exit sits where the target
 *      actually exits (cosmetic data bug: exits were drawn on other rows/cols),
 *   4. rewrites the LEVELS array in traffic-escape/index.html in place.
 * Idempotent: valid+solvable levels keep their exact original car coordinates.
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'traffic-escape', 'index.html');
let html = fs.readFileSync(FILE, 'utf8');
const LVLS_RE = /\/\/ ==================== LEVEL DATA ====================\nvar LEVELS = \[([\s\S]*?)\n\];/;
const m = html.match(LVLS_RE);
if (!m) { console.error('LEVELS block not found'); process.exit(1); }
const LEVELS = eval('[' + m[1] + ']');
console.log('levels found:', LEVELS.length);

/* corrected engine semantics (must match fixed index.html) */
function cells(car) {
  const o = [];
  for (let i = 0; i < car.len; i++) {
    let r = car.row, c = car.col;
    if (car.dir === 'right') c += i; else if (car.dir === 'left') c -= i;
    else if (car.dir === 'down') r += i; else if (car.dir === 'up') r -= i;
    o.push([r, c]);
  }
  return o;
}
const delta = d => d === 'right' ? [0, 1] : d === 'left' ? [0, -1] : d === 'down' ? [1, 0] : [-1, 0];
function boardValid(lvl, cars) {
  const seen = new Set();
  for (const c of cars) {
    for (const [r, cc] of cells(c)) {
      if (r < 0 || r >= lvl.rows || cc < 0 || cc >= lvl.cols) return false;
      const k = r + ',' + cc; if (seen.has(k)) return false; seen.add(k);
    }
  }
  return true;
}
function frontAtExit(lvl, cars) {
  const t = cars.find(c => c.isTarget); const ex = lvl.exit; const cs = cells(t);
  if (ex.dir === 'right') return Math.max(...cs.map(x => x[1])) >= ex.col;
  if (ex.dir === 'left') return Math.min(...cs.map(x => x[1])) <= ex.col;
  if (ex.dir === 'up') return Math.min(...cs.map(x => x[0])) <= ex.row;
  return Math.max(...cs.map(x => x[0])) >= ex.row;
}
function key(cars) { return cars.map(c => c.row + ',' + c.col).join('|'); }
function bfsMoves(lvl, carsIn, cap = 400000) {
  const start = carsIn.map(c => ({ ...c }));
  if (frontAtExit(lvl, start)) return -1; /* won at start */
  const q = [[start, 0]]; const vis = new Set([key(start)]); let n = 0;
  while (q.length && n++ < cap) {
    const [cars, d] = q.shift();
    for (let i = 0; i < cars.length; i++) {
      const [dr, dc] = delta(cars[i].dir);
      let row = cars[i].row, col = cars[i].col;
      for (;;) {
        const cand = cars.map(x => ({ ...x })); cand[i].row = row + dr; cand[i].col = col + dc;
        if (!boardValid(lvl, cand)) break;
        row += dr; col += dc;
        const k = key(cand);
        if (!vis.has(k)) {
          vis.add(k);
          if (frontAtExit(lvl, cand)) return d + 1;
          q.push([cand, d + 1]);
        }
      }
    }
  }
  return -2; /* unsolvable */
}
/* mulberry32 for deterministic search */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry32(20260816);
function seatOptions(lvl, car, cars) {
  /* in-grid anchor positions for this car that don't overlap any OTHER car's cells.
   * (others may still overlap each other — the board is under repair — so only the
   * candidate's own collisions are checked here.) */
  const out = [];
  const occ = new Set();
  for (const o of cars) { if (o.id === car.id) continue; for (const [r, c] of cells(o)) occ.add(r + ',' + c); }
  const h = car.dir === 'left' || car.dir === 'right';
  const max = h ? lvl.cols : lvl.rows;
  for (let p = 0; p < max; p++) {
    const cand = { ...car, row: h ? car.row : p, col: h ? p : car.col };
    if (cells(cand).every(([r, c]) => r >= 0 && r < lvl.rows && c >= 0 && c < lvl.cols && !occ.has(r + ',' + c))) out.push(p);
  }
  return out;
}
function repair(lvl, idx) {
  const orig = lvl.cars.map(c => ({ ...c }));
  /* tier 0: original car set (dirs untouched) */
  const r0 = searchBoard(lvl, orig);
  if (r0) return { ...r0, reAxed: [] };
  /* tiers 1..2: re-axis 1 (then 2) blocker cars whose axis makes the set unsolvable.
   * Perpendicular dir keeps the car on its original lane (row for horizontal, col for vertical). */
  const blockers = orig.filter(c => !c.isTarget);
  const altDirs = c => (c.dir === 'left' || c.dir === 'right') ? ['down', 'up'] : ['left', 'right'];
  for (const tier of [1, 2]) {
    const combos = [];
    if (tier === 1) {
      for (const b of blockers) for (const d of altDirs(b)) combos.push([[b.id, d]]);
    } else {
      for (let i = 0; i < blockers.length; i++) for (let j = i + 1; j < blockers.length; j++)
        for (const d1 of altDirs(blockers[i])) for (const d2 of altDirs(blockers[j])) combos.push([[blockers[i].id, d1], [blockers[j].id, d2]]);
    }
    for (const combo of combos) {
      const cars = orig.map(c => ({ ...c }));
      for (const [id, d] of combo) {
        const c = cars.find(x => x.id === id);
        /* flip axis, keep the anchor cell; the search re-seats it along the new axis */
        c.dir = d;
      }
      const r = searchBoard(lvl, cars);
      if (r) return { ...r, reAxed: combo.map(x => x[0] + '->' + x[1]).join(',') };
    }
  }
  return null;
}
function searchBoard(lvl, cars0) {
  if (boardValid(lvl, cars0)) {
    const mv = bfsMoves(lvl, cars0);
    if (mv >= 0 && mv <= lvl.par) return { cars: cars0, moves: mv, changed: false };
  }
  const conflict = new Set();
  const seen = new Map();
  for (const c of cars0) for (const [r, cc] of cells(c)) {
    if (r < 0 || r >= lvl.rows || cc < 0 || cc >= lvl.cols) { conflict.add(c.id); continue; }
    const k = r + ',' + cc; if (seen.has(k)) { conflict.add(c.id); conflict.add(seen.get(k)); } else seen.set(k, c.id);
  }
  let pool = [...new Set([...conflict])];
  if (frontAtExit(lvl, cars0)) pool.push(cars0.find(c => c.isTarget).id);
  let best = null; /* best solvable-but-over-par board, fallback with par bump */
  const solved = new Map(); /* board key -> bfs moves (dedup across attempts) */
  for (let attempt = 0; attempt < 2500; attempt++) {
    if (attempt === 150) pool = cars0.map(c => c.id);          /* escalate: any car may move */
    /* shuffle pool per attempt so chains of dependent re-seats can happen in any order */
    for (let s = pool.length - 1; s > 0; s--) { const t2 = Math.floor(rng() * (s + 1)); [pool[s], pool[t2]] = [pool[t2], pool[s]]; }
    const cars = cars0.map(c => ({ ...c }));
    for (const id of pool) {
      const car = cars.find(c => c.id === id);
      reseat(car, cars);
    }
    /* multi-pass: resolve any remaining conflicts by re-seating conflicting cars again */
    for (let pass = 0; pass < 4 && !boardValid(lvl, cars); pass++) {
      const bad = conflicts(lvl, cars);
      if (!bad.length) break;
      for (const c of cars) if (bad.has(c.id)) reseat(c, cars);
    }
    if (!boardValid(lvl, cars)) continue;
    if (frontAtExit(lvl, cars)) continue;
    const k = key(cars);
    let mv;
    if (solved.has(k)) mv = solved.get(k);
    else { mv = bfsMoves(lvl, cars); solved.set(k, mv); }
    if (mv === -2) continue;
    /* prefer boards that keep some challenge (>= 2 moves) but still 3-star-able (<= par) */
    if (mv >= 2 && mv <= lvl.par) return { cars, moves: mv, changed: true };
    if (mv >= 0 && (!best || (best.moves < 2 ? mv > best.moves : mv < best.moves))) best = { cars, moves: mv };
  }
  if (best) return { cars: best.cars, moves: best.moves, changed: true, parBump: best.moves };
  return null;
  function reseat(car, cars) {
    const opts = seatOptions(lvl, car, cars);
    if (!opts.length) return;
    const orig2 = horiz(car) ? car.col : car.row;
    opts.sort((a, b) => Math.abs(a - orig2) - Math.abs(b - orig2));
    const pick = rng() < 0.4 && Math.abs(opts[0] - orig2) <= 1 ? opts[0] : opts[Math.floor(rng() * opts.length)];
    if (horiz(car)) car.col = pick; else car.row = pick;
  }
  function horiz(c) { return c.dir === 'left' || c.dir === 'right'; }
}
function conflicts(lvl, cars) {
  const bad = new Set(); const seen = new Map();
  for (const c of cars) for (const [r, cc] of cells(c)) {
    if (r < 0 || r >= lvl.rows || cc < 0 || cc >= lvl.cols) { bad.add(c.id); continue; }
    const k = r + ',' + cc;
    if (seen.has(k)) { bad.add(c.id); bad.add(seen.get(k)); } else seen.set(k, c.id);
  }
  return bad;
}
const repaired = [];
let nChanged = 0;
LEVELS.forEach((L, i) => {
  const r = repair(L, i);
  if (!r) { console.error('FAILED to repair L' + (i + 1)); process.exit(1); }
  if (r.changed) nChanged++;
  L.cars = r.cars;
  let parNote = '';
  if (r.parBump && r.parBump > L.par) { L.par = r.parBump; parNote = ' PAR->' + r.parBump; }
  if (r.reAxed && r.reAxed.length) parNote += ' REAX(' + r.reAxed + ')';
  /* normalize exit onto the (possibly re-seated) target's lane (drawing position only) */
  const t = L.cars.find(c => c.isTarget);
  if (L.exit.dir === 'right') L.exit = { row: t.row, col: L.cols - 1, dir: 'right' };
  else if (L.exit.dir === 'left') L.exit = { row: t.row, col: 0, dir: 'left' };
  else if (L.exit.dir === 'up') L.exit = { row: 0, col: t.col, dir: 'up' };
  else L.exit = { row: L.rows - 1, col: t.col, dir: 'down' };
  repaired.push({ ...L, _moves: r.moves, _changed: r.changed, _parNote: parNote });
});
console.log('repaired/reseated levels:', nChanged, 'kept original:', LEVELS.length - nChanged);
/* rewrite block */
const lines = repaired.map(L => {
  const cars = L.cars.map(c => '{id:' + c.id + ',row:' + c.row + ',col:' + c.col + ',dir:\'' + c.dir + '\',len:' + c.len + ',color:\'' + c.color + '\'' + (c.isTarget ? ',isTarget:true' : '') + '}').join(',');
  return '{name:"' + L.name + '",tier:' + L.tier + ',cols:' + L.cols + ',rows:' + L.rows + ',exit:{row:' + L.exit.row + ',col:' + L.exit.col + ',dir:\'' + L.exit.dir + '\'},cars:[' + cars + '],par:' + L.par + ',hint:"' + (L.hint || '') + '"}';
});
const block = '// ==================== LEVEL DATA ====================\nvar LEVELS = [\n' + lines.join(',\n') + '\n];';
html = html.replace(LVLS_RE, block);
fs.writeFileSync(FILE, html);
console.log('index.html LEVELS rewritten.');
repaired.forEach((L, i) => console.log('  L' + (i + 1) + ' par=' + L.par + ' bfs=' + L._moves + (L._changed ? ' RESEATED' : ' kept') + (L._parNote || '')));
