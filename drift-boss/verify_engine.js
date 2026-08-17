#!/usr/bin/env node
/* drift-boss verifier — B-type drift survival via REAL mouse + key input.
 * Title: mousemove onto the Play button's real hit-test rect -> mousedown (engine's own
 * handleDown). Playing: Space keydown/keyup (engine's own hold path) with an edge-
 * seeking policy — hold to steer back whenever the car drifts off-center.
 * PASS: score accrues on the engine's own loop, natural gameover reached, best score
 * persisted, restart via the gameover button works, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('drift-boss', { inject: {
  anchor: 'function handleDown(){',
  exports: "globalThis.__DB = { st: () => GAME_STATE, score: () => score, car: () => car, best: () => saveData.bestScore, W: () => W, H: () => H };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const cv = g.els['c'];
const W = g.call('__DB.W()'), H = g.call('__DB.H()');
const st = () => g.call('__DB.st()');

// hover the Play button — client coords are scaled through the engine's own
// (clientX-rect.left)*(canvas.width/rect.width) mapping; the stub rect is 480x640
// stub rect == canvas size -> identity mapping; Play button center = (W/2, H/2+40)
cv.dispatch('mousemove', { clientX: W / 2, clientY: H / 2 + 40, preventDefault() {} });
cv.dispatch('mousedown', { clientX: W / 2, clientY: H / 2 + 40, preventDefault() {} });
g.pump(5);
T('game-started', st() === 'playing', 'state=' + st());

const key = (type) => g.sandbox.document.dispatch(type, { code: 'Space', key: ' ', preventDefault() {} });
let maxScore = 0, guard = 0;
while (st() === 'playing' && guard++ < 30000) {
  const x = g.call('__DB.car().x') || 0;
  // hold when the car is right of center (drift steers back left), release otherwise
  if (x > 10) key('keydown'); else key('keyup');
  g.pump(2);
  maxScore = Math.max(maxScore, g.call('__DB.score()') || 0);
}
key('keyup');
T('run-ended-naturally', st() === 'gameover', 'state=' + st() + ' guard=' + guard);
T('score-accrued', maxScore > 0, 'maxScore=' + maxScore);
T('best-persisted', (g.call('__DB.best()') || 0) >= maxScore, 'best=' + g.call('__DB.best()'));

// restart via the gameover Retry button (real hover + press)
cv.dispatch('mousemove', { clientX: W / 2, clientY: H / 2 + 50, preventDefault() {} }); // gameover Retry btnY = cy+50
cv.dispatch('mousedown', { clientX: W / 2, clientY: H / 2 + 50, preventDefault() {} });
g.pump(5);
T('restart-works', st() === 'playing' || st() === 'title', 'state=' + st());

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { maxScore } };
console.log('drift-boss: edge-seeking drift policy via real key/mouse events: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
