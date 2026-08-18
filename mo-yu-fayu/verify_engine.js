#!/usr/bin/env node
/* mo-yu-fayu (SlackOff Defense) verifier — B/C-type tower defense via the engine loop.
 * startGame() (Play callee); towers placed via buildTower (the build-mode tap callee)
 * at engine grid slots; waves auto-advance on the engine's own update; win = survive
 * MAXWAVE (engine endGame(true)), lose = 3 leaks (engine endGame(false)).
 * Policy: build 2 towers immediately, then one per affordable wave; pump the engine loop.
 * PASS: >=2 towers built through the engine path, waves progress (>=2), a terminal
 * state reached via the engine's own endGame, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('mo-yu-fayu', { inject: {
  anchor: 'function endGame(win){',
  exports: "globalThis.__MY = { st: () => gameState, wave: () => wave, coins: () => coins, towers: () => towers.length, leaked: () => leaked, build: (x, y) => buildTower(x, y), start: () => startGame(), bosses: () => bosses.length };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__MY.start()');
g.pump(10);
T('game-started', g.call('__MY.st()') === 'playing', 'st=' + g.call('__MY.st()'));

let built = 0, guard = 0, maxWave = 0;
const slots = [[120, 200], [200, 300], [100, 350], [260, 220], [180, 140], [320, 320], [60, 260], [300, 120]];
while (guard++ < 80000) {
  const st = g.call('__MY.st()');
  if (st === 'win' || st === 'lose') break;
  maxWave = Math.max(maxWave, g.call('__MY.wave()') || 0);
  // keep buying towers while affordable (engine's own 40-coin check applies)
  if (built < slots.length && (g.call('__MY.coins()') || 0) >= 40) {
    const s2 = slots[built % slots.length];
    if (g.call(`__MY.build(${s2[0]}, ${s2[1]})`) !== false) built++;
    g.pump(4);
    continue;
  }
  g.pump(6);
}
const endState = g.call('__MY.st()');
T('towers-built', built >= 2, 'built=' + built);
T('waves-progressed', maxWave >= 2, 'maxWave=' + maxWave);
T('terminal-reached', endState === 'win' || endState === 'lose', 'end=' + endState + ' wave=' + g.call('__MY.wave()') + ' leaked=' + g.call('__MY.leaked()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { built, maxWave, endState, leaked: g.call('__MY.leaked()') } };
console.log('mo-yu-fayu: tower-defense run through the engine loop: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
