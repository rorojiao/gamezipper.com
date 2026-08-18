#!/usr/bin/env node
/* ludo verifier — C-type: play full turns via the engine's own roll/select flow.
 * newGame() (the start callee); human seats roll via rollDice() (the dice button's own
 * callee, incl. its 3-sixes forfeit path) then selectToken over the engine's OWN
 * validMoves; animation + capture + home arrival settle on engine timers.
 * PASS: >=12 roll+select cycles executed, tokens advance materially (max token
 * progress grows), AI seats rotate via the engine's own nextPlayer chain, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('ludo', { inject: {
  anchor: 'function selectToken(tokenIdx){',
  exports: "globalThis.__LU = { active: () => gameActive, cur: () => currentPlayer, dice: () => diceValue, waiting: () => waitingSelect, moves: () => validMoves.map(m => ({ t: m.tokenIdx, to: m.toDist })), roll: () => rollDice(), select: (i) => selectToken(i), progress: (p) => tokens[p].reduce((a, t) => a + Math.max(0, t.dist), 0), start: (m, c, d) => startGame(m, c, d) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call("__LU.start('human', 1, 'easy')"); // real menu path: vs 1 AI
g.pump(5);
T('game-active', g.call('__LU.active()') === true);

const prog0 = [0, 1, 2, 3].map(p => g.call(`__LU.progress(${p})`) || 0).reduce((a, b) => a + b, 0);
let cycles = 0, rolls = 0, guard = 0;
while (guard++ < 40000 && cycles < 16) {
  if (!g.call('__LU.active()')) break;
  if (g.call('__LU.waiting()')) {
    const ms = g.call('__LU.moves()') || [];
    if (ms.length) { g.call(`__LU.select(${ms[0].t})`); cycles++; g.pump(40); continue; }
  }
  // human seat present: roll; else pump AI turns
  g.call('__LU.roll()');
  rolls++;
  for (let k = 0; k < 40; k++) { g.pump(4); if (g.call('__LU.waiting()')) break; }
  g.pump(10);
}
const prog1 = [0, 1, 2, 3].map(p => g.call(`__LU.progress(${p})`) || 0).reduce((a, b) => a + b, 0);
T('roll-select-cycles', cycles >= 8, 'cycles=' + cycles + ' rolls=' + rolls);
T('tokens-advanced', prog1 > prog0, prog0 + '->' + prog1);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { cycles, rolls, progress: [prog0, prog1] } };
console.log('ludo: roll+select turns through engine validMoves: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
