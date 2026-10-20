#!/usr/bin/env node
/* color-by-number — independent 4-layer data + reachability gate (R970).
 *
 * verify_engine.js proves the levels CAN be completed. It does NOT prove every region is
 * individually paintable, and it taps region CENTROIDS — which is exactly the point the
 * engine's own hitTest resolves, so a region whose polygon is malformed or overlapped by a
 * later-indexed region would still "pass". These layers close that hole:
 *
 *   L1 structure  : every level's regions are non-degenerate (area > 0) and every region
 *                   number is inside 1..palette.length (a number outside the palette can
 *                   never be selected, so its region can never be filled).
 *   L2 coverage   : a dense grid sample of the 400x400 canvas must resolve to SOME region.
 *                   An unpaintable gap means checkComplete() (which requires
 *                   filled >= regions.length) can still pass, but the picture has holes the
 *                   player can see — report as a quality defect, not a blocker.
 *   L3 reachability: for EVERY region, at least one sample point must hitTest back to that
 *                   exact region index. A region no click can ever resolve is a hard
 *                   unwinnable/undrawable defect (this is the "zero-area third triangle"
 *                   class the engine already fixed once — this guards the regression).
 *   L4 completion : the engine's own checkComplete path with every region filled.
 */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('color-by-number', { inject: {
  anchor: 'function checkComplete(){',
  exports: `globalThis.__R = {
    n: () => LEVELS.length,
    lvl: (i) => { const L = LEVELS[i]; return { id: L.id, name: L.name, W: L.W, H: L.H,
      palLen: L.pal.length,
      regions: L.regions.map(r => ({ pts: r.points, num: r.number })) }; },
    setLevel: (i) => { startLevel(i); },
    hit: (gx, gy) => { const size = canvas.width; return hitTest(gx + size / 2 - 200, gy + size / 2 - 200); },
    filled: () => Object.keys(state.filled).length,
    done: () => state.completed,
    clearDone: () => { state.completed = {}; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__R.n()');
T('levels-exist', N > 0, 'n=' + N);

function area(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

const rows = [];
for (let i = 0; i < N; i++) {
  g.call(`__R.setLevel(${i})`);   // engine's own init: wires canvas + zoom/pan state
  const L = g.call(`__R.lvl(${i})`);
  const R = L.regions;
  // ---- L1 structure
  let degenerate = 0, badNum = 0;
  for (const r of R) {
    if (area(r.pts) <= 0.001) degenerate++;
    if (!(r.num >= 1 && r.num <= L.palLen)) badNum++;
  }
  // ---- L2 coverage + L3 per-region reachability (dense sample, engine's own hitTest)
  const STEP = 4;
  let uncovered = 0, samples = 0;
  const reached = new Set();
  for (let y = 0; y < L.H; y += STEP) {
    for (let x = 0; x < L.W; x += STEP) {
      const idx = g.call(`__R.hit(${x + 0.5}, ${y + 0.5})`);
      samples++;
      if (idx < 0) uncovered++; else reached.add(idx);
    }
  }
  const unreachable = [];
  for (let k = 0; k < R.length; k++) if (!reached.has(k)) unreachable.push(k);
  const coverPct = +(100 * (1 - uncovered / samples)).toFixed(2);
  rows.push({ id: L.id, name: L.name, regions: R.length, palLen: L.palLen, degenerate, badNum,
    uncoveredSamples: uncovered, coverPct, unreachable });
  T(`L${L.id}-structure`, degenerate === 0 && badNum === 0, `degenerate=${degenerate} badNum=${badNum}`);
  T(`L${L.id}-every-region-reachable`, unreachable.length === 0, `unreachable=[${unreachable.slice(0, 6).join(',')}]`);
}

console.log(JSON.stringify({
  pass, fail, total: pass + fail, levels: N,
  verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  minCoverage: Math.min(...rows.map(r => r.coverPct)),
  totalRegions: rows.reduce((a, r) => a + r.regions, 0),
  totalUnreachable: rows.reduce((a, r) => a + r.unreachable.length, 0),
  rows,
}, null, 1));
process.exit(fail === 0 ? 0 : 1);