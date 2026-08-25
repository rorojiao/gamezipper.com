#!/usr/bin/env node
/* fifteen verifier — 27 levels (3x3..6x6 sliding puzzle). The engine shuffles by K random
 * slides from the solved grid; we patch Math.random during initLevel to record the exact
 * shuffle choices, mirror the engine's shuffle loop to get the moved-tile list, and undo
 * the shuffle by clicking those tiles in reverse order through the real canvas click path.
 * Win = engine checkWin -> handleWin -> completedLevels includes level. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('fifteen', { inject: {
  anchor: 'function initLevel(',
  exports: `globalThis.__T = {
    n: () => CONFIG.totalLevels,
    start: (i) => initLevel(i),
    tiles: () => state.tiles,
    size: () => state.gridSize,
    done: (i) => state.completedLevels.includes(i),
    cs: () => cellSize,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

// mirror of engine shuffleGrid's move selection using the recorded rand sequence
function mirrorShuffle(n, steps, rands) {
  let er = n - 1, ec = n - 1, lastMove = null;
  const clicks = [];
  for (let s = 0; s < steps && s < rands.length; s++) {
    const moves = [];
    if (er > 0 && lastMove !== 'down') moves.push({ r: -1, c: 0, dir: 'up' });
    if (er < n - 1 && lastMove !== 'up') moves.push({ r: 1, c: 0, dir: 'down' });
    if (ec > 0 && lastMove !== 'right') moves.push({ r: 0, c: -1, dir: 'left' });
    if (ec < n - 1 && lastMove !== 'left') moves.push({ r: 0, c: 1, dir: 'right' });
    if (!moves.length) break;
    const move = moves[Math.floor(rands[s] * moves.length)];
    clicks.push([er, ec]); // tile slid INTO the old-empty cell; clicking it back undoes this step
    er += move.r; ec += move.c; lastMove = move.dir;
  }
  return clicks;
}

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 27, 'n=' + N);
const cv = g.els['gameCanvas'];
T('canvas-found', !!cv, 'no gameCanvas');
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });

const solved = [];
for (let i = 1; i <= N; i++) {
  // instrument Math.random around initLevel so the shuffle is exactly reproducible
  g.call('(function(){ globalThis.__rl = []; globalThis.__mr = Math.random; Math.random = function(){ var v = __mr(); __rl.push(v); return v; }; })()');
  g.call(`__T.start(${i})`);
  g.call('Math.random = globalThis.__mr');
  g.pump(2);
  const rands = g.call('globalThis.__rl');
  const n = g.call('__T.size()');
  const tierSteps = (() => { // shuffle counts per tier, matching CONFIG.tiers
    const tiers = [[3, 20], [3, 50], [4, 30], [4, 80], [5, 40], [6, 50]];
    const lvl = i, idx = lvl <= 5 ? 0 : lvl <= 10 ? 1 : lvl <= 15 ? 2 : lvl <= 20 ? 3 : lvl <= 24 ? 4 : 5;
    return tiers[idx][1];
  })();
  const clicks = mirrorShuffle(n, tierSteps, rands).reverse();
  for (const [r, c] of clicks) {
    const cs = g.call('__T.cs()');
    cv.dispatch('click', { clientX: c * cs + cs / 2, clientY: r * cs + cs / 2 });
    g.pump(1);
  }
  g.pump(90); // moveTile schedules handleWin on a 300ms setTimeout
  if (g.call(`__T.done(${i})`)) solved.push(i); else fails.push('L' + i + ' not won after ' + clicks.length + ' undo moves');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('fifteen: ' + solved.length + '/' + N + ' levels solved via real tile clicks (shuffle-reversal replay): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
