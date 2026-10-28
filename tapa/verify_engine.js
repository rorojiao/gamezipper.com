#!/usr/bin/env node
/* tapa verifier — 30 levels: replay embedded sol via real canvas mousedown toggles
 * (shade tool) on playable cells; win = engine checkWin -> onWin -> G.completed. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tapa', { inject: {
  anchor: 'function startLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    ids: () => LEVELS.map(l => l.id),
    start: (id) => startLevel(id, false),
    sol: () => G.level.sol,
    clue: () => G.level.clue,
    size: () => G.level.size,
    playable: (r, c) => isPlayable(r, c),
    done: () => G.completed,
    geo: () => [gridOffX, gridOffY, cellSize],
    all: () => LEVELS.map(l => ({ id: l.id, size: l.size, sol: l.sol, clue: l.clue })),
  };`,
} });

/* ---------------------------------------------------------------------------
 * LAYER 2 — CLUE/SOLUTION CONSISTENCY (added R338).
 *
 * WHY: the verifier above only REPLAYS the stored solution. It can therefore
 * never notice that the CLUE GRID does not describe that solution — a
 * solution-compare win predicate (checkWin) accepts the stored grid no
 * matter how nonsensical the clues are. On the R336-corrupt catalog this
 * verifier reported 30/30 PASS while 24 of 30 levels were UNSATISFIABLE
 * as Tapa puzzles (120 clue cells demanded more shaded neighbours than the
 * cell physically has). That is the no-op-gate shape: a gate that cannot
 * fail.
 *
 * The check below is written from the RULE (standard Tapa, 8-neighbour ring
 * read clockwise from NW), not from the level's key names, and is
 * self-contained so it cannot inherit a bug from the engine.
 * ------------------------------------------------------------------------- */
const RING = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];
function ringRuns(sol, n, r, c) {
  const ring = [];
  for (const [dr, dc] of RING) {
    const rr = r + dr, cc = c + dc;
    ring.push(rr >= 0 && rr < n && cc >= 0 && cc < n && sol[rr][cc] === 1 ? 1 : 0);
  }
  if (!ring.some(v => v)) return [];
  if (ring.every(v => v)) return [8];
  const start = ring.indexOf(0);
  const seq = [];
  for (let k = 0; k < 8; k++) seq.push(ring[(start + k) % 8]);
  const runs = []; let cur = 0;
  for (const v of seq) {
    if (v) cur++;
    else { if (cur) runs.push(cur); cur = 0; }
  }
  if (cur) runs.push(cur);
  return runs.slice().sort((a, b) => a - b);
}
function clueDigits(cl) {
  if (String(cl).trim() === '0') return [];
  return String(cl).split('').map(Number).filter(x => !isNaN(x)).sort((a, b) => a - b);
}
function checkClueConsistency(lv) {
  const errs = [];
  const n = lv.size, sol = lv.sol, clue = lv.clue;
  if (!Array.isArray(sol) || sol.length !== n) return ['sol not ' + n + 'x' + n];
  if (!Array.isArray(clue) || clue.length !== n) return ['clue not ' + n + 'x' + n];
  let impossible = 0, mismatched = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cl = clue[r][c];
      if (cl === '.' || cl === '#') continue;
      const want = clueDigits(cl), got = ringRuns(sol, n, r, c);
      if (got.length !== want.length || got.some((v, i) => v !== want[i])) mismatched++;
      // convention-independent necessary condition: a clue can never demand
      // more shaded neighbours than the cell physically has
      const phys = RING.filter(([dr, dc]) => {
        const rr = r + dr, cc = c + dc;
        return rr >= 0 && rr < n && cc >= 0 && cc < n;
      }).length;
      if (want.reduce((a, b) => a + b, 0) > phys) impossible++;
    }
  }
  if (impossible) errs.push(impossible + ' arithmetically impossible clue cell(s)');
  if (mismatched) errs.push(mismatched + ' clue cell(s) do not describe the stored solution');
  // degeneracy: "shade every blank" must not win
  let bw = 0, bs = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (clue[r][c] !== '.') continue;
    if (sol[r][c] === 1) bs++; else bw++;
  }
  if (bw < 2 || bs < 2) errs.push('degenerate: ' + bw + ' white / ' + bs + ' shaded blank cells');
  // no 2x2 shaded block
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
    if (sol[r][c] === 1 && sol[r][c + 1] === 1 && sol[r + 1][c] === 1 && sol[r + 1][c + 1] === 1) {
      errs.push('2x2 shaded block at (' + r + ',' + c + ')'); r = n; break;
    }
  }
  return errs;
}

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['canvas'] || g.els['gameCanvas'] || g.els['board'];
const tap = (r, c) => { const [ox, oy, cs] = g.call('__T.geo()');
  cv().dispatch('mousedown', { clientX: ox + c * cs + cs / 2, clientY: oy + r * cs + cs / 2, button: 0, preventDefault() {} }); };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 30, 'n=' + N);
T('canvas-found', !!cv(), 'ids=' + Object.keys(g.els).filter(k => /canvas|board/i.test(k)).join(','));

const ids = g.call('__T.ids()');
const solved = [];

/* LAYER 2 — check EVERY level's clue grid against its own solution.
 * This runs over the WHOLE catalog, not a sample, and it is the layer that
 * catches the R336 corruption. A level that fails here is reported by name
 * and makes the process exit non-zero. */
const allLevels = g.call('__T.all()');
const badLevels = [];
for (const lv of allLevels) {
  const e = checkClueConsistency(lv);
  if (e.length) badLevels.push(lv.id + ' [' + e.join('; ') + ']');
}
T('clue-consistency', badLevels.length === 0,
  badLevels.length + '/' + allLevels.length + ' levels inconsistent: ' + badLevels.slice(0, 3).join(' | '));

for (let i = 0; i < N; i++) {
  g.call(`__T.start(${JSON.stringify(ids[i])})`);
  g.pump(2);
  const sol = g.call('__T.sol()'), n = g.call('__T.size()');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (g.call(`__T.playable(${r}, ${c})`) && sol[r][c] === 1) tap(r, c); // shade exactly the solution cells
  }
  // checkWin only fires on a value change; degenerate levels (all sol cells pre-shaded)
  // need one real toggle on/off to trigger the engine's own check — exactly what a player does
  if (!g.call('__T.done()')) {
    outer: for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (g.call(`__T.playable(${r}, ${c})`)) { tap(r, c); tap(r, c); break outer; }
    }
  }
  g.pump(3);
  if (g.call('__T.done()')) solved.push(i + 1); else fails.push('L' + ids[i] + ' not completed');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' + ids.filter((x, k) => !solved.includes(k + 1)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('tapa: ' + solved.length + '/' + N + ' levels solved via real canvas shade toggles: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
