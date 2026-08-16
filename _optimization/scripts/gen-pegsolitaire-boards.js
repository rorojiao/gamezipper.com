#!/usr/bin/env node
/* peg-solitaire board generator — all 8 BOARDS end-to-end solvable by construction.
 *
 * Problem (2026-08-16 sweep): 6 of 8 shipped boards are proven UNSOLVABLE to the engine's
 * win condition (checkGameState fires onWin only at pegCount===1): B1/B2/B4 exhausted by
 * memoized DFS, B3/B6/B7 fail the 3-color parity invariant, B8 inconclusive at the cap.
 *
 * Method: REVERSE-JUMP CONSTRUCTION. Start from the terminal state the engine requires
 * (exactly 1 peg) and walk BACKWARDS: a forward jump (from=peg, mid=peg, to=empty) is
 * inverted as (from=empty, mid=empty, to=peg) -> (from=peg, mid=peg, to=empty), net +1 peg.
 * Any position reached by k reverse jumps is solvable to that 1 peg by playing the k forward
 * jumps in reverse order — a constructive proof. B5 (classic English Cross, 32 pegs,
 * center empty) is kept exactly as shipped: it was the one board already proven solvable.
 *
 * Every generated board is then re-proven with the SAME independent memoized DFS the
 * verifier uses (forward search, engine getValidMoves semantics), so verify_engine.js
 * cannot disagree. Budgets: 60s + 40M nodes per board (memory-tight machine: caps enforced).
 * Output: state/pegsolitaire-boards.json {boards:[{name,desc,tier,rows,cols,grid,startEmpty}],
 *   proof:{constructive:boolean, dfsNodes:number, dfsMs:number, jumps:number}}.
 */
const fs = require('fs');
const path = require('path');

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const PER_BOARD_MS = parseInt(process.env.PS_BUDGET_MS || '60000', 10);
const NODE_CAP = 40000000;
/* Memory-tight machine: memo insert-capped (a memo only prunes, capping inserts is sound);
 * ACCEPT caps keep every shipped board provable far inside verify_engine.js's own
 * 40M-node/95s budget so the verifier re-proves each board cheaply. */
const ACCEPT_NODES = 6000000, ACCEPT_MS = 20000, MEMO_CAP = 3000000;

/* ---- masks (r,c sets) ---- */
function square(n) { const s = new Set(); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.add(r + ',' + c); return s; }
function rect(r0, c0, r1, c1) { const s = new Set(); for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) s.add(r + ',' + c); return s; }
function cross5x7() { /* English cross: 3-wide cross on 7x7 */
  return new Set([...rect(0, 2, 1, 4), ...rect(2, 0, 4, 6), ...rect(5, 2, 6, 4)]);
}
function diamond(n) { /* manhattan diamond radius k on (2k+1)^2 */
  const k = (n - 1) / 2, s = new Set();
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (Math.abs(r - k) + Math.abs(c - k) <= k) s.add(r + ',' + c);
  return s;
}
function superCross9() { /* 5-wide arms on 9x9 */
  return new Set([...rect(0, 3, 2, 5), ...rect(3, 0, 5, 8), ...rect(6, 3, 8, 5)]);
}
function plus5x5() { return new Set([...rect(0, 2, 4, 2), ...rect(2, 0, 2, 4)]); }

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/* ---- reverse-jump random walk from a 1-peg terminal state ---- */
function reverseWalk(mask, targetPegs, seed, finalCell) {
  const rnd = mulberry32(seed);
  const inMask = (r, c) => mask.has(r + ',' + c);
  let pegs = new Set([finalCell[0] + ',' + finalCell[1]]);
  const moves = []; /* reverse moves in order applied */
  let guard = 0;
  while (pegs.size < targetPegs) {
    if (++guard > 5000) return null;
    /* enumerate all reverse jumps: peg at 'to', empty from=to-2d, mid=to-d, both in mask */
    const opts = [];
    for (const p of pegs) {
      const [tr, tc] = p.split(',').map(Number);
      for (const [dr, dc] of DIRS) {
        const mr = tr - dr, mc = tc - dc, fr = tr - 2 * dr, fc = tc - 2 * dc;
        if (!inMask(fr, fc) || !inMask(mr, mc)) continue;
        if (pegs.has(fr + ',' + fc) || pegs.has(mr + ',' + mc)) continue;
        opts.push({ to: [tr, tc], mid: [mr, mc], from: [fr, fc] });
      }
    }
    if (!opts.length) return null; /* dead end below target — restart attempt */
    const m = opts[Math.floor(rnd() * opts.length)];
    pegs.delete(m.to[0] + ',' + m.to[1]);
    pegs.add(m.from[0] + ',' + m.from[1]);
    pegs.add(m.mid[0] + ',' + m.mid[1]);
    moves.push(m);
  }
  return { pegs, moves };
}

/* ---- independent forward solver: identical semantics to verify_engine.js solveBoard ---- */
function solveForward(rows, cols, grid0, pegs0, budgetMs) {
  const grid = grid0.map(r => r.slice());
  const memo = new Set();
  const path = [];
  let nodes = 0, hit = false;
  const DL = Date.now() + budgetMs;
  function key() { let s = ''; for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { const v = grid[r][c]; s += (v === 1 ? '1' : (v === 0 ? '0' : '.')); } s += '|'; } return s; }
  function rec(pegs) {
    if (pegs === 1) return true;
    if (++nodes > NODE_CAP) { hit = true; return false; }
    if ((nodes & 8191) === 0 && Date.now() > DL) { hit = true; return false; }
    const k = key();
    if (memo.has(k)) return false;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 1) continue;
      for (let d = 0; d < 4; d++) {
        const mr = r + DIRS[d][0], mc = c + DIRS[d][1], dr = r + DIRS[d][0] * 2, dc = c + DIRS[d][1] * 2;
        if (mr < 0 || mr >= rows || mc < 0 || mc >= cols || dr < 0 || dr >= rows || dc < 0 || dc >= cols) continue;
        if (grid[mr][mc] !== 1 || grid[dr][dc] !== 0) continue;
        grid[r][c] = 0; grid[mr][mc] = 0; grid[dr][dc] = 1;
        path.push({ fromR: r, fromC: c, toR: dr, toC: dc, midR: mr, midC: mc });
        if (rec(pegs - 1)) return true;
        path.pop();
        grid[dr][dc] = 0; grid[mr][mc] = 1; grid[r][c] = 1;
      }
    }
    if (memo.size < MEMO_CAP) memo.add(k);
    return false;
  }
  const ok = rec(pegs0);
  return { ok, path, hit, nodes, memoSize: memo.size };
}

/* ---- constructive forward replay of the reverse sequence (sanity proof) ---- */
function constructiveReplay(rows, cols, grid0, movesRev) {
  const grid = grid0.map(r => r.slice());
  for (const m of movesRev) { /* m is a reverse move {from,mid,to}; forward play jumps from->to over mid */
    if (grid[m.from[0]][m.from[1]] !== 1 || grid[m.mid[0]][m.mid[1]] !== 1 || grid[m.to[0]][m.to[1]] !== 0) return false;
    grid[m.from[0]][m.from[1]] = 0; grid[m.mid[0]][m.mid[1]] = 0; grid[m.to[0]][m.to[1]] = 1;
  }
  let pegs = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === 1) pegs++;
  return pegs === 1;
}

/* ---- board specs: masks sized for an 8-board tier gradient ---- */
const SPECS = [
  { name: 'Mini Square', desc: '5 pegs - Tutorial', tier: 1, mask: square(3), target: 5, final: [0, 0], seedBase: 110 },
  { name: 'Small Cross', desc: '7 pegs - Easy', tier: 1, mask: plus5x5(), target: 7, final: [2, 2], seedBase: 220 },
  { name: 'Corner Square', desc: '9 pegs - Medium', tier: 2, mask: square(4), target: 9, final: [1, 2], seedBase: 330 },
  { name: 'Diamond', desc: '13 pegs - Medium', tier: 2, mask: diamond(7), target: 13, final: [3, 3], seedBase: 440 },
  { name: 'English Cross', desc: '32 pegs - Hard', tier: 3, classic: 'english-cross', seedBase: 0 },
  { name: 'Cross Drill', desc: '24 pegs - Hard', tier: 3, mask: cross5x7(), target: 24, final: [3, 3], seedBase: 660 },
  { name: 'Large Diamond', desc: '26 pegs - Expert', tier: 4, mask: diamond(9), target: 26, final: [4, 4], seedBase: 770 },
  { name: 'Super Cross', desc: '30 pegs - Expert', tier: 4, mask: superCross9(), target: [30, 28, 26], final: [4, 4], seedBase: 880 },
];

const CLASSIC_ENGLISH = {
  name: 'English Cross', desc: '32 pegs - Hard', tier: 3, rows: 7, cols: 7,
  grid: [
    [-1, -1, 1, 1, 1, -1, -1],
    [-1, -1, 1, 1, 1, -1, -1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [-1, -1, 1, 1, 1, -1, -1],
    [-1, -1, 1, 1, 1, -1, -1],
  ],
  startEmpty: [[3, 3]],
};

const out = { generated: new Date().toISOString(), boards: [], proof: [] };
const T0 = Date.now();

for (let bi = 0; bi < SPECS.length; bi++) {
  const spec = SPECS[bi];
  if (spec.classic) {
    /* shipped B5: already proven solvable by the existing verifier; re-prove here */
    const t0 = Date.now();
    let pegs0 = 0;
    for (const row of CLASSIC_ENGLISH.grid) for (const v of row) if (v === 1) pegs0++;
    const res = solveForward(CLASSIC_ENGLISH.rows, CLASSIC_ENGLISH.cols, CLASSIC_ENGLISH.grid, pegs0, PER_BOARD_MS);
    if (!res.ok) { console.error(`B5 classic English Cross FAILED forward DFS (hit=${res.hit}) — aborting, will not ship an unproven classic`); process.exit(1); }
    out.boards.push(CLASSIC_ENGLISH);
    out.proof.push({ board: 5, pegs: pegs0, method: 'classic+DFS', dfsNodes: res.nodes, dfsMemo: res.memoSize, dfsMs: Date.now() - t0, jumps: res.path.length, capHit: res.hit });
    console.log(`B5 English Cross (classic): DFS re-proved ${res.path.length}-jump win in ${res.nodes} nodes / ${Date.now() - t0}ms`);
    continue;
  }
  /* reverse-walk attempts with different seeds until DFS-provable within ACCEPT caps
   * (accept only cheap-to-prove boards so verify_engine.js re-proves them cheaply);
   * spec.target may be a fallback list (large masks walk down if 30 pegs proves expensive) */
  const targets = Array.isArray(spec.target) ? spec.target : [spec.target];
  let done = false;
  for (let attempt = 0; attempt < 60 && !done; attempt++) {
    if (Date.now() - T0 > 8 * PER_BOARD_MS) { console.error(`B${bi + 1} global board budget exceeded`); process.exit(1); }
    const target = targets[Math.min(targets.length - 1, Math.floor(attempt / 20))];
    const seed = spec.seedBase + attempt * 7919;
    const walk = reverseWalk(spec.mask, target, seed, spec.final);
    if (!walk) continue;
    /* build grid: mask bounds -> rows/cols */
    let maxR = 0, maxC = 0;
    for (const k of spec.mask) { const [r, c] = k.split(',').map(Number); if (r > maxR) maxR = r; if (c > maxC) maxC = c; }
    const rows = maxR + 1, cols = maxC + 1;
    const grid = [];
    for (let r = 0; r < rows; r++) { grid.push([]); for (let c = 0; c < cols; c++) grid[r].push(spec.mask.has(r + ',' + c) ? (walk.pegs.has(r + ',' + c) ? 1 : 0) : -1); }
    let pegs0 = 0; for (const row of grid) for (const v of row) if (v === 1) pegs0++;
    if (pegs0 !== target) continue; /* safety */
    /* constructive proof: replay reversed walk forward */
    const fwd = [...walk.moves].reverse();
    if (!constructiveReplay(rows, cols, grid, fwd)) { console.error(`B${bi + 1} constructive replay FAILED (logic bug)`); process.exit(1); }
    /* independent proof: same memoized DFS the verifier runs, within ACCEPT caps only */
    const t0 = Date.now();
    const res = solveForward(rows, cols, grid, pegs0, ACCEPT_MS);
    if (!res.ok || res.nodes > ACCEPT_NODES) {
      console.error(`B${bi + 1} attempt ${attempt} (${target} pegs): constructive OK but DFS ${res.ok ? 'too expensive' : (res.hit ? 'hit cap' : 'no path')} (${res.nodes} nodes) — regenerating`);
      continue;
    }
    const startEmpty = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === 0) startEmpty.push([r, c]);
    out.boards.push({ name: spec.name, desc: spec.desc.replace(/^\d+/, String(target)), tier: spec.tier, rows, cols, grid, startEmpty });
    out.proof.push({ board: bi + 1, pegs: pegs0, method: 'reverse-jump constructive + DFS', dfsNodes: res.nodes, dfsMemo: res.memoSize, dfsMs: Date.now() - t0, jumps: res.path.length, attempts: attempt + 1, capHit: false });
    console.log(`B${bi + 1} ${spec.name} ${rows}x${cols} ${pegs0} pegs: ${res.path.length}-jump DFS solution in ${res.nodes} nodes / ${Date.now() - t0}ms (attempt ${attempt + 1})`);
    done = true;
  }
  if (!done) { console.error(`B${bi + 1} (${spec.name}) FAILED all attempts`); process.exit(1); }
}

fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'state', 'pegsolitaire-boards.json'), JSON.stringify(out, null, 1));
console.log(`OK: 8 boards written to state/pegsolitaire-boards.json (total ${((Date.now() - T0) / 1000).toFixed(1)}s). All proven by constructive reverse-jump replay + independent memoized DFS.`);
