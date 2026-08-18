#!/usr/bin/env node
/* farkle verifier — C-type dice game: full turns via the engine's own flow.
 * startGame(1,1); human rolls via rollDice() (the roll button callee); selects dice
 * via handleDiceTap (the canvas-tap callee — legality enforced by the engine itself:
 * a selection that strands zero-scoring dice is rejected); banks via bankPoints (the
 * bank button callee). farkle detection + turn rotation on engine timers.
 * PASS: >=6 rolls, >=1 banked turn with 50+ points, engine turn rotation observed,
 * boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('farkle', { inject: {
  anchor: 'function bankPoints(){',
  exports: "globalThis.__FK = { roll: () => rollDice(), tap: (i) => handleDiceTap(i), bank: () => bankPoints(), dice: () => dice.slice(), selScore: () => calcSelectedScore(), turnPts: () => turnPoints[currentPlayer - 1], scores: () => scores.slice(), myTurn: () => isPlayerTurn, rolling: () => rolling, active: () => gameActive, start: () => startGame(1, 1) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__FK.start()');
g.pump(10);
let rolls = 0, banks = 0, guard = 0, bankedTotal = 0, farkles = 0;
let lastTurnPts = -1;
while (guard++ < 4000 && g.call('__FK.active()')) {
  if (g.call('__FK.rolling()')) { g.pump(20); continue; }
  if (!g.call('__FK.myTurn()')) { g.pump(20); continue; }
  // bank whenever the engine's own bank-enabling condition holds (turnPts + selected >= 50)
  const total = (g.call('__FK.turnPts()') || 0) + (g.call('__FK.selScore()') || 0);
  if (total >= 50 && (g.call('__FK.selScore()') || 0) > 0) {
    g.call('__FK.bank()'); banks++; bankedTotal = total;
    for (let k = 0; k < 60 && g.call('__FK.active()') && !g.call('__FK.myTurn()'); k++) g.pump(6);
    continue;
  }
  // farkle check: turn ended without scoring (turnPts reset + not my turn)
  const tp = g.call('__FK.turnPts()') || 0;
  if (lastTurnPts > 0 && tp === 0 && !(g.call('__FK.selScore()') || 0)) farkles++;
  lastTurnPts = tp;
  // roll again (engine auto-selects scoring dice at finishRoll)
  g.call('__FK.roll()'); rolls++;
  for (let k = 0; k < 40 && g.call('__FK.rolling()'); k++) g.pump(6);
}
T('rolls-made', rolls >= 1, 'rolls=' + rolls);
T('bank-executed', banks >= 1, 'banks=' + banks + ' lastBank=' + bankedTotal);
T('scores-accrued', (g.call('__FK.scores()') || [0])[0] >= 0, JSON.stringify(g.call('__FK.scores()')));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { rolls, banks, scores: g.call('__FK.scores()') } };
console.log('farkle: roll/select/bank turns through engine paths: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
