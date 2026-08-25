#!/usr/bin/env node
/* plug-master verifier — A-type: all 30 levels solved by an independent flow solver
 * (full-fill DFS with connectivity/degree pruning, connect-only fallback), then each
 * solution REPLAYED through the engine's real pointer path (canvas pointerdown on the
 * plug, pointermove cell-by-cell, pointerup). Win = the engine's own checkWin() ->
 * showWinOverlay() firing. Level data integrity (unique endpoints) also asserted. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('plug-master', { inject: {
  anchor: 'function checkWin(){',
  exports: `draw = function(){}; // draw-only
globalThis.__winCount = 0;
const __ow = showWinOverlay;
showWinOverlay = function(){ globalThis.__winCount++; return __ow.apply(this, arguments); }; // engine win signal
globalThis.__S = {
  n: () => LEVELS.length,
  lv: (i) => LEVELS[i],
  load: (i) => initLevel(i),
  geo: () => ({ cs: state.cellSize, gap: CELL_GAP }),
  wins: () => globalThis.__winCount,
  done: () => Object.keys(state.completed).length,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const N = g.call('__S.n()');
T('levels-exist', N === 30, 'n=' + N);

// ---- data integrity: endpoints unique and not on walls (the shipped P0) ----
const dup = [];
for (let i = 0; i < N; i++) {
  const lv = g.call(`__S.lv(${i})`);
  const walls = new Set(lv.walls.map(w => w.join(',')));
  const seen = new Set();
  outer: for (const p of lv.pairs) for (const cc of [p.plug, p.socket]) {
    const k = cc.join(',');
    if (walls.has(k) || seen.has(k)) { dup.push('L' + (i + 1)); break outer; }
    seen.add(k);
  }
}
T('endpoint-integrity', dup.length === 0, dup.join(','));

// ---- independent solver ----
function solveLevel(lv, deadline) {
  const size = lv.size, K = lv.pairs.length;
  const wall = new Set(lv.walls.map(w => w[0] * 100 + w[1]));
  const cellKey = (r, c) => r * 100 + c;
  const inGrid = (r, c) => r >= 0 && r < size && c >= 0 && c < size;
  const nbrs = (k) => { const r = Math.floor(k / 100), c = k % 100, out = [];
    if (inGrid(r - 1, c)) out.push(cellKey(r - 1, c)); if (inGrid(r + 1, c)) out.push(cellKey(r + 1, c));
    if (inGrid(r, c - 1)) out.push(cellKey(r, c - 1)); if (inGrid(r, c + 1)) out.push(cellKey(r, c + 1));
    return out; };
  const total = size * size - wall.size;
  const used = new Set(); // cells covered so far (incl placed endpoints)
  const paths = [];

  function prunable(k) {
    if (k >= K) return true; // all pairs placed — coverage checked by caller
    const endpointsOf = (j) => [lv.pairs[j].plug, lv.pairs[j].socket].map(cc => cellKey(cc[0], cc[1]));
    const freeOk = (k2) => !wall.has(k2) && !used.has(k2);
    for (let j = k; j < K; j++) {
      const [a, b] = endpointsOf(j);
      const seen = new Set([a]); const q = [a];
      while (q.length) { const u = q.pop(); for (const m of nbrs(u)) if (freeOk(m) && !seen.has(m)) { seen.add(m); q.push(m); } }
      if (!seen.has(b)) return false;
    }
    const endCells = new Set();
    for (let j = k; j < K; j++) endpointsOf(j).forEach(e => endCells.add(e));
    let freeCount = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const k2 = cellKey(r, c);
      if (wall.has(k2) || used.has(k2)) continue;
      freeCount++;
      if (endCells.has(k2)) continue;
      let d = 0; for (const m of nbrs(k2)) if (freeOk(m)) d++;
      if (d < 2) return false;
    }
    // every remaining cell must be reachable: single connected free region OR components each
    // containing endpoints is too lax; require full connectivity when non-endpoint cells exist
    // simple: count free cells reachable from first remaining endpoint's plug
    const [a0] = endpointsOf(k);
    const seen = new Set([a0]); const q = [a0];
    while (q.length) { const u = q.pop(); for (const m of nbrs(u)) if (freeOk(m) && !seen.has(m)) { seen.add(m); q.push(m); } }
    if (seen.size !== freeCount) return false;
    return true;
  }

  let work = 0;
  function enumPaths(j, cb) { // enumerate simple plug->socket paths for pair j over free cells
    const p = lv.pairs[j];
    const plug = cellKey(p.plug[0], p.plug[1]), socket = cellKey(p.socket[0], p.socket[1]);
    const pathCells = [plug];
    const visited = new Set([plug]);
    const dfs = (cur) => {
      if (++work > 400000 || Date.now() > deadline) return true; // budget out
      if (cur === socket) { if (cb(pathCells.slice())) return true; return false; }
      for (const m of nbrs(cur)) {
        if (visited.has(m) || wall.has(m) || used.has(m)) continue;
        if (m !== socket) { // can't cross foreign endpoints: they're not `used` yet
          let foreign = false;
          for (let t = j + 1; t < K; t++) {
            const [fa, fb] = [lv.pairs[t].plug, lv.pairs[t].socket].map(cc => cellKey(cc[0], cc[1]));
            if (m === fa || m === fb) { foreign = true; break; }
          }
          if (foreign) continue;
        }
        visited.add(m); pathCells.push(m);
        if (dfs(m)) return true;
        visited.delete(m); pathCells.pop();
      }
      return false;
    };
    dfs(plug);
  }

  function fillSolve(j) {
    if (Date.now() > deadline) return false;
    if (j === K) return [...used].length === total;
    let done = false;
    enumPaths(j, (pathCells) => {
      pathCells.forEach(k2 => used.add(k2));
      paths[j] = pathCells;
      if (prunable(j + 1) && fillSolve(j + 1)) { done = true; return true; }
      pathCells.forEach(k2 => used.delete(k2));
      paths[j] = null;
      return false;
    });
    return done;
  }
  if (fillSolve(0)) return { fill: true, paths: paths.map(p => p.map(k2 => [Math.floor(k2 / 100), k2 % 100])) };
  // fallback: connect-only backtracking search (win = isAllConnected; fill is only the 3rd star)
  used.clear(); work = 0;
  const pairOK = (j) => { // every remaining pair's endpoints still connected through free cells
    for (let t = j; t < K; t++) {
      const a = cellKey(lv.pairs[t].plug[0], lv.pairs[t].plug[1]);
      const b = cellKey(lv.pairs[t].socket[0], lv.pairs[t].socket[1]);
      const seen = new Set([a]); const q = [a];
      while (q.length) { const u = q.pop(); for (const m of nbrs(u)) if (!wall.has(m) && !used.has(m) && !seen.has(m)) { seen.add(m); q.push(m); } }
      if (!seen.has(b)) return false;
    }
    return true;
  };
  function connSolve(j) {
    if (Date.now() > deadline) return false;
    if (j === K) return true;
    let done = false;
    enumPaths(j, (pathCells) => {
      pathCells.forEach(k2 => used.add(k2));
      paths[j] = pathCells;
      if (pairOK(j + 1) && connSolve(j + 1)) { done = true; return true; }
      pathCells.forEach(k2 => used.delete(k2));
      paths[j] = null;
      return false;
    });
    return done;
  }
  if (connSolve(0)) return { fill: false, paths: paths.map(p => p.map(k2 => [Math.floor(k2 / 100), k2 % 100])) };
  return null;
}

// ---- replay through real pointer input ----
let geo = null;
const cellXY = (r, c) => ({ x: geo.gap + c * (geo.cs + geo.gap) + geo.cs / 2, y: geo.gap + r * (geo.cs + geo.gap) + geo.cs / 2 });
const canvas = g.els['game-canvas'];
const ptr = (type, r, c) => { const p = cellXY(r, c); canvas.dispatch(type, { clientX: p.x, clientY: p.y, pointerId: 1, button: 0, preventDefault() {} }); };
g.els['btn-play'].click(); // real menu flow

const DEADLINE0 = Date.now() + 90000;
const solved = [], fillStars = [];
for (let i = 0; i < N && Date.now() < DEADLINE0; i++) {
  const lv = g.call(`__S.lv(${i})`);
  const sol = solveLevel(lv, Date.now() + 8000);
  if (!sol) { fails.push('L' + (i + 1) + ' no solution found'); continue; }
  g.call(`__S.load(${i})`);
  geo = g.call('__S.geo()'); // cellSize depends on the level's grid size
  const wins0 = g.call('__S.wins()');
  for (const path of sol.paths) {
    ptr('pointerdown', path[0][0], path[0][1]);
    for (let s = 1; s < path.length; s++) ptr('pointermove', path[s][0], path[s][1]);
    ptr('pointerup', path[0][0], path[0][1]);
  }
  g.pump(2);
  if (g.call('__S.wins()') > wins0) { solved.push(i + 1); if (sol.fill) fillStars.push(i + 1); }
  else fails.push('L' + (i + 1) + ' engine did not win');
}
T('levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' + Array.from({ length: N }, (_, x) => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('save-progress', g.call('__S.done()') >= solved.length, 'completed=' + g.call('__S.done()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { solved: solved.length + '/' + N, perfectFill: fillStars.length + '/' + N } };
console.log('plug-master: ' + solved.length + '/' + N + ' levels replayed via pointer input to engine win (' + fillStars.length + ' perfect-fill): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
