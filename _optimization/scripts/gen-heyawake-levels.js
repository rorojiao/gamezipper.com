#!/usr/bin/env node
/* heyawake level generator — 30 static levels (5 tiers x 6) + 10 daily pool puzzles,
 * every level guaranteed SOLVABLE under the engine's exact checkWin semantics
 * (heyawake/index.html:1019): numbered rooms hold exactly their clue of blacks, blacks
 * never orthogonally adjacent, whites orthogonally connected, and no 3 consecutive whites
 * in a row/col cross a room boundary (findSpanViolations). Clueless rooms (<=3 blacks)
 * are allowed by checkWin but this generator clues EVERY room to keep the win condition
 * exact-count only.
 *
 * Why: the old runtime generator's solver had a 250-400ms/80k-call budget that failed on
 * most layouts, falling through to a checkerboard 2-room fallback that is provably
 * unwinnable (19/31 boards in the 2026-08-16 sweep).
 *
 * Method per level: (1) rooms via a guillotine partition with an area floor (every room
 * both dims >= 2 wherever possible — the engine's own splitter emits 1xN strip rooms whose
 * only legal shadings are checkerboards with DISCONNECTED whites, the root defect), (2) a randomized row-major DFS finds a valid shading with
 * adjacency+span+room-cap pruning, accepting only when white-connectivity holds and the
 * black density lands in the tier band, (3) clues are derived from the found shading
 * (count per room, placed on a white cell) — solvability is then guaranteed by
 * construction, (4) the level is re-validated with an INDEPENDENT predicate copied from
 * verify_engine.js's validate(). Budgets (memory-tight machine): 20s + 500k DFS nodes
 * per level, 10min global; deterministic seeds.
 * Output: state/heyawake-levels.json {levels:[engine-format x30], daily:[engine-format x10]}.
 */
const fs = require('fs');
const path = require('path');

function seededRNG(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---- room partition: randomized guillotine split with an AREA FLOOR.
 * The engine's own generateRooms (index.html:326) admits 1xN/2x1 strip rooms; on small
 * grids those layouts force near-checkerboard shadings (the span rule leaves no other
 * choice) whose whites are orthogonally DISCONNECTED — the root cause of the 19/31
 * unwinnable boards. This splitter guarantees every room has both dims >= 2 wherever the
 * area floor permits, so balanced shadings with connected whites exist. */
function partitionRooms(rng, rows, cols, minArea) {
  const rooms = [];
  function split(r1, c1, r2, c2) {
    const h = r2 - r1 + 1, w = c2 - c1 + 1, area = h * w;
    /* candidate horizontal cuts p (rows r1..p | p+1..r2): both halves must clear the
     * area floor; flag cuts that keep both halves' min dimension >= 2 */
    const canH = [], canH2 = [];
    for (let p = r1; p < r2; p++) {
      if ((p - r1 + 1) * w < minArea || (r2 - p) * w < minArea) continue;
      const e = p;
      canH.push(e);
      if (p - r1 + 1 >= 2 && r2 - p >= 2) canH2.push(e);
    }
    const canV = [], canV2 = [];
    for (let p = c1; p < c2; p++) {
      if (h * (p - c1 + 1) < minArea || h * (c2 - p) < minArea) continue;
      canV.push(p);
      if (p - c1 + 1 >= 2 && c2 - p >= 2) canV2.push(p);
    }
    const anyCut = canH.length || canV.length;
    const stop = !anyCut || (area <= minArea * 2 && rng() < 0.55) || rng() < 0.15;
    if (stop) { rooms.push([r1, c1, r2, c2]); return; }
    let useH, pool;
    if (canH2.length && canV2.length) { useH = rng() < 0.5; pool = useH ? canH2 : canV2; }
    else if (canH2.length) { useH = true; pool = canH2; }
    else if (canV2.length) { useH = false; pool = canV2; }
    else if (canH.length && canV.length) { useH = rng() < 0.5; pool = useH ? canH : canV; }
    else { useH = canH.length > 0; pool = useH ? canH : canV; }
    const p = pool[Math.floor(rng() * pool.length)];
    if (useH) { split(r1, c1, p, c2); split(p + 1, c1, r2, c2); }
    else { split(r1, c1, r2, p); split(r1, p + 1, r2, c2); }
  }
  split(0, 0, rows - 1, cols - 1);
  return rooms;
}

/* ---- randomized shading DFS with the engine's exact rule pruning.
 * White connectivity is the expensive constraint: checking it only at completion lets the
 * DFS spend the whole budget on branches whose whites sealed off long ago. So each black
 * placement flood-fills its white neighbors — if any white component just lost its last
 * unassigned neighbor while other components exist, the branch is dead immediately. */
function findShading(rows, cols, rooms, rng, opts) {
  const roomOf = [];
  for (let r = 0; r < rows; r++) { roomOf.push([]); for (let c = 0; c < cols; c++) roomOf[r].push(-1); }
  rooms.forEach((rm, i) => { for (let r = rm[0]; r <= rm[2]; r++) for (let c = rm[1]; c <= rm[3]; c++) roomOf[r][c] = i; });
  const roomSize = rooms.map(rm => (rm[2] - rm[0] + 1) * (rm[3] - rm[1] + 1));
  const cap = roomSize.map(sz => Math.max(0, Math.min(sz - 1, opts.roomCap)));
  const grid = [];
  for (let r = 0; r < rows; r++) { grid.push([]); for (let c = 0; c < cols; c++) grid[r].push(-1); }
  const blacks = rooms.map(() => 0);
  let blackTotal = 0;
  let nodes = 0;
  const NODE_CAP = opts.nodeCap, DL = Date.now() + opts.ms;
  const N = rows * cols;
  const ID = (r, c) => r * cols + c;

  function spanOk(r, c) { /* triples fully assigned ending at (r,c) — engine findSpanViolations semantics */
    if (c >= 2 && grid[r][c - 2] === 0 && grid[r][c - 1] === 0 && grid[r][c] === 0) {
      if (!(roomOf[r][c - 2] === roomOf[r][c - 1] && roomOf[r][c - 1] === roomOf[r][c])) return false;
    }
    if (r >= 2 && grid[r - 2][c] === 0 && grid[r - 1][c] === 0 && grid[r][c] === 0) {
      if (!(roomOf[r - 2][c] === roomOf[r - 1][c] && roomOf[r - 1][c] === roomOf[r][c])) return false;
    }
    return true;
  }
  function canBlack(r, c) {
    if (r > 0 && grid[r - 1][c] === 1) return false;
    if (c > 0 && grid[r][c - 1] === 1) return false;
    return blacks[roomOf[r][c]] < cap[roomOf[r][c]];
  }
  /* flood one white component; returns {cells, open} where open = # unassigned orthogonal
   * neighbors the component can still expand through */
  function flood(r0, c0, vis) {
    const st = [[r0, c0]]; vis.add(ID(r0, c0)); let open = 0;
    while (st.length) {
      const [r, c] = st.pop();
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] === 0) { if (!vis.has(ID(nr, nc))) { vis.add(ID(nr, nc)); st.push([nr, nc]); } }
        else if (grid[nr][nc] === -1) open++;
      }
    }
    return open;
  }
  function whitesConnected() {
    let start = null, total = 0;
    for (let r = 0; r < rows && !start; r++) for (let c = 0; c < cols && !start; c++) if (grid[r][c] === 0) start = [r, c];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === 0) total++;
    if (!start) return false;
    const vis = new Set([ID(start[0], start[1])]); const st = [start]; let cnt = 0;
    while (st.length) {
      const p = st.pop(); cnt++;
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = p[0] + dr, nc = p[1] + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0 && !vis.has(ID(nr, nc))) { vis.add(ID(nr, nc)); st.push([nr, nc]); }
      }
    }
    return cnt === total;
  }
  /* placing a black at (r,c): every white neighbor's component must still have an opening
   * (unassigned neighbor) unless it is the ONLY white component on the board */
  function sealsComponent(r, c) {
    let comps = 0;
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) if (grid[rr][cc] === 0) { comps++; rr = rows; break; }
    if (comps === 0) return false; /* no whites at all yet */
    const done = new Set();
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] !== 0) continue;
      if (done.has(ID(nr, nc))) continue;
      const vis = new Set();
      const open = flood(nr, nc, vis);
      for (const id of vis) done.add(id);
      if (open === 0) {
        /* sealed forever (no unassigned neighbor can ever join it). Only fatal if another
         * white component already exists — if this is the sole component the remaining
         * unassigned cells may still all become black, which is a valid completion. */
        let whites = 0;
        for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) if (grid[rr][cc] === 0) whites++;
        if (whites === vis.size) return false;
        return true;
      }
    }
    return false;
  }
  function rec(idx) {
    if (++nodes > NODE_CAP || ((nodes & 4095) === 0 && Date.now() > DL)) return null;
    if (idx === N) {
      if (blackTotal < opts.minBlacks || blackTotal > opts.maxBlacks) return null;
      if (!whitesConnected()) return null;
      return grid.map(row => row.slice());
    }
    const r = (idx / cols) | 0, c = idx % cols, rid = roomOf[r][c];
    /* density pruning: can't exceed the band, and must still be able to reach its floor */
    const remaining = N - idx - 1;
    if (blackTotal + remaining < opts.minBlacks) return null;
    /* value-order heuristic: blacks belong on room boundaries (each boundary row/col needs
     * a black every ~3 cells or the span rule breaks), interior cells rarely black */
    let onBoundary = false;
    if (c > 0 && roomOf[r][c - 1] !== rid) onBoundary = true;
    else if (c + 1 < cols && roomOf[r][c + 1] !== rid) onBoundary = true;
    else if (r > 0 && roomOf[r - 1][c] !== rid) onBoundary = true;
    else if (r + 1 < rows && roomOf[r + 1][c] !== rid) onBoundary = true;
    let p = onBoundary ? 0.8 : 0.05;
    const projLo = opts.minBlacks * (idx / N), projHi = opts.maxBlacks * (idx / N);
    if (blackTotal < projLo) p = Math.min(0.9, p * 1.6);
    else if (blackTotal > projHi) p *= 0.35;
    const blackFirst = rng() < p;
    const order = [];
    const allowBlack = canBlack(r, c) && blackTotal + 1 <= opts.maxBlacks;
    if (blackFirst) { if (allowBlack) order.push(1); order.push(0); }
    else { order.push(0); if (allowBlack) order.push(1); }
    for (const v of order) {
      grid[r][c] = v;
      if (v === 1) { blacks[rid]++; blackTotal++; }
      if (spanOk(r, c) && (v === 0 || !sealsComponent(r, c))) {
        const res = rec(idx + 1);
        if (res) return res;
      }
      if (v === 1) { blacks[rid]--; blackTotal--; }
      grid[r][c] = -1;
    }
    return null;
  }
  const sol = rec(0);
  const why = sol ? 'ok' : (nodes > NODE_CAP ? 'nodecap' : (Date.now() > DL ? 'timecap' : 'exhausted'));
  return sol ? { sol, roomOf, nodes, why } : { why, nodes };
}

/* ---- INDEPENDENT validation predicate: copy of verify_engine.js validate() semantics ---- */
function validateLevel(rows, cols, sol, rooms, clues) {
  const black = (r, c) => sol[r][c] === 1;
  const roomOf = [];
  for (let r = 0; r < rows; r++) { roomOf.push([]); for (let c = 0; c < cols; c++) roomOf[r].push(-1); }
  rooms.forEach((rs, i) => {
    const q = rs;
    for (let r = q[0]; r <= q[2]; r++) for (let c = q[1]; c <= q[3]; c++) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) throw new Error('room out of grid');
      if (roomOf[r][c] !== -1) throw new Error('rooms overlap at ' + r + ',' + c);
      roomOf[r][c] = i;
    }
  });
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (roomOf[r][c] === -1) throw new Error('rooms do not tile grid');
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (!black(r, c)) continue;
    if (c + 1 < cols && black(r, c + 1)) throw new Error('adjacent blacks at ' + r + ',' + c);
    if (r + 1 < rows && black(r + 1, c)) throw new Error('adjacent blacks at ' + r + ',' + c);
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c + 2 < cols; c++) {
    if (!black(r, c) && !black(r, c + 1) && !black(r, c + 2)) {
      if (!(roomOf[r][c] === roomOf[r][c + 1] && roomOf[r][c + 1] === roomOf[r][c + 2])) throw new Error('span violation row ' + r + ',' + c);
    }
  }
  for (let c = 0; c < cols; c++) for (let r = 0; r + 2 < rows; r++) {
    if (!black(r, c) && !black(r + 1, c) && !black(r + 2, c)) {
      if (!(roomOf[r][c] === roomOf[r + 1][c] && roomOf[r + 1][c] === roomOf[r + 2][c])) throw new Error('span violation col ' + r + ',' + c);
    }
  }
  let start = null;
  for (let r = 0; r < rows && !start; r++) for (let c = 0; c < cols && !start; c++) if (!black(r, c)) start = [r, c];
  if (start) {
    const vis = new Set([start.join(',')]); const st = [start]; let cnt = 0;
    while (st.length) { const q = st.pop(); cnt++; for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const nr = q[0] + dr, nc = q[1] + dc; if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !black(nr, nc) && !vis.has(nr + ',' + nc)) { vis.add(nr + ',' + nc); st.push([nr, nc]); } } }
    let whites = 0; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!black(r, c)) whites++;
    if (cnt !== whites) throw new Error('whites not connected (' + cnt + '/' + whites + ')');
  }
  rooms.forEach((rm, i) => {
    let cnt = 0, target = null;
    for (let r = rm[0]; r <= rm[2]; r++) for (let c = rm[1]; c <= rm[3]; c++) { if (black(r, c)) cnt++; const k = r + ',' + c; if (clues[k] !== undefined) { if (target !== null) throw new Error('two clues in room ' + i); target = clues[k]; } }
    if (target === null) throw new Error('room ' + i + ' has no clue');
    if (cnt !== target) throw new Error('room ' + i + ' has ' + cnt + ' blacks, clue says ' + target);
  });
  return true;
}

/* ---- assemble engine-format level ---- */
/* density bands tried in order — the span rule (no 3 whites crossing a boundary) sets a
 * floor on blacks that depends on room geometry; wide ascending bands make every tier
 * solvable while keeping the FIRST (sparsest) band as the difficulty target. */
/* Density ladder in ABSOLUTE black counts: a quad-tiled n x n board forces ~2n blacks
 * (every boundary row/col needs a black every <=3 cells or the span rule breaks), i.e.
 * density ~2/n — fraction bands are meaningless across sizes. The ladder starts just under
 * that fence floor and escalates; more rooms add boundaries, so hi keeps headroom. */
const ROOM_TARGET = { 1: 4, 2: 5, 3: 6, 4: 8, 5: 9 };
const usedLayouts = new Set(); /* layout diversity: no repeated room partitions across the set */
function buildLevel(seed, size, tier) {
  const base = 2 * size;
  const MAX_ATTEMPTS = size >= 12 ? 120 : 75;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt % 15 === 14) console.error(`  PROGRESS size=${size} tier=${tier} attempt=${attempt + 1}`);
    /* band ladder tried WITHIN each attempt (fractions of the 2n fence floor): tight sparse
     * window first (quad-like layouts), then wide (strip-ish layouts need ~1.2-1.4n extra
     * boundaries), then dense fallback */
    const BANDLADDER = [[1.0, 1.12], [0.95, 1.4], [1.3, 1.75]];
    const roomRng = seededRNG(seed + attempt * 104729);
    const roomTarget = ROOM_TARGET[tier] || 8;
    const minArea = Math.max(4, Math.ceil(size * size / roomTarget));
    let rooms = null;
    for (let tries = 0; tries < 24; tries++) {
      const cand = partitionRooms(seededRNG(seed + attempt * 104729 + tries * 7717), size, size, minArea);
      if (cand.length >= 4 && cand.length <= roomTarget + 3) { rooms = cand; break; }
    }
    if (!rooms) continue; /* partition almost always degenerates for this seed — next attempt */
    const layoutKey = rooms.map(rm => rm.join(',')).join(';');
    if (usedLayouts.has(layoutKey) && attempt < 20) continue; /* prefer fresh layouts early */
    let res = null;
    for (let bi = 0; bi < BANDLADDER.length && !res; bi++) {
      const lo = Math.max(4, Math.round(base * BANDLADDER[bi][0]));
      const hi = Math.max(lo + 2, Math.round(base * BANDLADDER[bi][1]));
      for (let rs = 0; rs < 2 && !res; rs++) { /* 2 shading rng restarts per band */
        const r2 = findShading(size, size, rooms, seededRNG(seed + attempt * 7919 + bi * 613 + rs * 1043 + 13), {
          roomCap: 6,
          minBlacks: lo,
          maxBlacks: hi,
          nodeCap: 500000,
          ms: 20000,
        });
        if (r2 && r2.why === 'ok') res = r2;
        else if (r2 && r2.why !== 'exhausted') break; /* nodecap/timecap: budget gone, next attempt */
      }
    }
    if (!res) continue;
    if (res.why && res.why !== 'ok') { if (process.env.HY_DEBUG) console.error(`  dbg size=${size} att=${attempt} lo=${lo} hi=${hi} rooms=${rooms.length} ${res.why} nodes=${res.nodes}`); continue; }
    const { sol } = res;
    /* clues: exact black count per room, placed on its first white cell */
    const clues = {};
    const numbers = [];
    let ok = true;
    rooms.forEach((rm, i) => {
      let cnt = 0, pick = null;
      for (let r = rm[0]; r <= rm[2]; r++) for (let c = rm[1]; c <= rm[3]; c++) { if (sol[r][c] === 1) cnt++; else if (!pick) pick = [r, c]; }
      if (!pick) pick = [rm[0], rm[1]]; /* all-black room impossible under adjacency for size>=2, safety */
      clues[pick[0] + ',' + pick[1]] = cnt;
      numbers.push(pick[0] + ',' + pick[1] + ',' + cnt);
    });
    if (!ok) continue;
    let solStr = '';
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) solStr += sol[r][c];
    try { validateLevel(size, size, sol, rooms, clues); } catch (e) { console.error(`  VALIDATION FAIL size=${size} seed=${seed} attempt=${attempt}: ${e.message}`); process.exit(1); }
    let blacks = 0; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (sol[r][c] === 1) blacks++;
    let blackCount = 0; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (sol[r][c] === 1) blackCount++;
    usedLayouts.add(layoutKey);
    return [{
      r: size, c: size, s: solStr,
      rooms: rooms.map(rm => rm.join(',')).join(';'),
      n: numbers.join(';'),
      p: 60 + tier * 30,
    }, { rooms: rooms.length, blacks: blackCount, nodes: res.nodes, attempts: attempt + 1 }];
  }
  return null;
}

const TIERS = [
  { size: 8, tier: 1 }, { size: 9, tier: 2 }, { size: 10, tier: 3 }, { size: 11, tier: 4 }, { size: 12, tier: 5 },
];
const LEVEL_SEED_BASE = 421337;
const DAILY_SEED_BASE = 970031;

const out = { generated: new Date().toISOString(), levels: [], daily: [], meta: [] };
const T0 = Date.now();
const GLOBAL_MS = 10 * 60 * 1000;

for (let t = 0; t < TIERS.length; t++) {
  for (let i = 0; i < 6; i++) {
    if (Date.now() - T0 > GLOBAL_MS) { console.error('global budget exceeded'); process.exit(1); }
    const seed = LEVEL_SEED_BASE + (t * 6 + i) * 31337;
    const lv = buildLevel(seed, TIERS[t].size, TIERS[t].tier);
    if (!lv) { console.error(`tier ${t + 1} #${i + 1} FAILED`); process.exit(1); }
    out.levels.push(lv[0]);
    out.meta.push({ level: out.levels.length, size: TIERS[t].size, tier: TIERS[t].tier, rooms: lv[1].rooms, blacks: lv[1].blacks, dfsNodes: lv[1].nodes, attempts: lv[1].attempts });
    console.log(`L${out.levels.length} (${TIERS[t].size}x${TIERS[t].size} tier ${TIERS[t].tier}): ${lv[1].rooms} rooms, ${lv[1].blacks} blacks (${lv[1].nodes} nodes, attempt ${lv[1].attempts})`);
  }
}
for (let i = 0; i < 10; i++) {
  if (Date.now() - T0 > GLOBAL_MS) { console.error('global budget exceeded'); process.exit(1); }
  const seed = DAILY_SEED_BASE + i * 1511;
  const lv = buildLevel(seed, 10, 3);
  if (!lv) { console.error(`daily #${i + 1} FAILED`); process.exit(1); }
  out.daily.push(lv[0]);
  console.log(`D${i + 1} (10x10): ${lv[1].rooms} rooms, ${lv[1].blacks} blacks`);
}

fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'state', 'heyawake-levels.json'), JSON.stringify(out, null, 1));
console.log(`OK: 30 levels + 10 dailies written to state/heyawake-levels.json (total ${((Date.now() - T0) / 1000).toFixed(1)}s). Every level validated by the independent checkWin predicate.`);
