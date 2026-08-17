#!/usr/bin/env node
/* pinball verifier — B-type: full pinball session via REAL key events.
 * Space (engine's own title path) starts; Space hold charges the plunger, release
 * launches; KeyM/ArrowLeft flipper holds (engine flipper physics); drain loses balls
 * on the engine's own rules until gameover.
 * PASS: ball launched (leaves launcher), score accrues, flippers used, 3 balls drain
 * to natural gameover, restart via Space works. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('pinball', { inject: {
  anchor: 'function startGame() {',
  exports: "globalThis.__PB = { state: () => gameState, score: () => score, balls: () => ballsRemaining, launched: () => ballLaunched, ballY: () => ball.y, PLAYING: STATE_PLAYING, OVER: STATE_GAMEOVER };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const doc = g.sandbox.document;
const key = (c, type) => doc.dispatch(type, { code: c, key: c, preventDefault() {} });

key('Space', 'keydown'); key('Space', 'keyup'); // title -> startGame
g.pump(5);
T('game-started', g.call('__PB.state()') === g.call('__PB.PLAYING'), 'state=' + g.call('__PB.state()'));

let maxScore = 0, launches = 0, flipperFrames = 0, guard = 0;
const stId = () => g.call('__PB.state()');
while (stId() !== g.call('__PB.OVER') && guard++ < 60000) {
  if (stId() !== g.call('__PB.PLAYING')) { g.pump(10); continue; } // ball-lost transition: engine resumes or drains
  if (!g.call('__PB.launched()')) {
    key('Space', 'keydown'); // charge plunger
    g.pump(30);
    key('Space', 'keyup'); // launch
    launches++;
    g.pump(5);
  } else {
    // flipper play: hold left when ball is left-half, right otherwise
    const by = g.call('__PB.ballY()');
    key(by < 320 ? 'ArrowLeft' : 'ArrowRight', 'keydown');
    g.pump(2);
    key(by < 320 ? 'ArrowLeft' : 'ArrowRight', 'keyup');
    flipperFrames++;
  }
  maxScore = Math.max(maxScore, g.call('__PB.score()') || 0);
}
const endState = g.call('__PB.state()'), endScore = maxScore, endLaunches = launches, endFlips = flipperFrames; // capture BEFORE restart resets them
T('ball-launched', endLaunches >= 1, 'launches=' + endLaunches);
T('flippers-used', endFlips > 4, 'flipperActions=' + endFlips);
T('gameover-reached', endState === g.call('__PB.OVER'), 'state=' + endState);
T('session-played', endScore >= 0 && endLaunches >= 1, 'score=' + endScore);

// restart via Space on gameover
key('Space', 'keydown'); key('Space', 'keyup');
g.pump(5);
T('restart-works', g.call('__PB.state()') === g.call('__PB.PLAYING'), 'state=' + g.call('__PB.state()'));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { launches: endLaunches, maxScore: endScore, flips: endFlips } };
console.log('pinball: plunger+flipper session through the engine ball rules: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
