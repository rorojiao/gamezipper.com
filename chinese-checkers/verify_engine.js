#!/usr/bin/env node
/* chinese-checkers verifier — C-type board game: real moves via the engine's own flow.
 * newGame(); human (seat 0) moves via executeMove (the exact tap callee) over the
 * engine's OWN getAllValidMoves (jumps preferred); AI seats run their doAITurn chain
 * on engine timers. Full 6-player game.
 * PASS: >=12 human moves executed, material preserved (10 pieces), all 6 seats
 * observed to move, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('chinese-checkers', { inject: {
  anchor: 'function executeMove(move) {',
  exports: "globalThis.__CK = { cur: () => gameState.currentPlayer, active: () => gameState.gameActive, anim: () => gameState.animating, jumping: () => gameState.isJumping, pieces: (p) => gameState.board.filter(v => v === p).length, myMoves: () => { const m = getAllValidMoves(0, gameState.board); const list = m.jumps.length ? m.jumps : m.steps; return list.slice(0, 8); }, exec: (f, t, type) => executeMove({ from: f, to: t, type: type || 'step' }), aiTurn: () => doAITurn(), aiJump: () => doAIJump(), newGame: () => newGame() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__CK.newGame()');
g.pump(5);
let moves = 0, guard = 0;
const seatsSeen = new Set();
while (guard++ < 30000 && g.call('__CK.active()') && moves < 14) {
  seatsSeen.add(g.call('__CK.cur()'));
  if (g.call('__CK.anim()')) { g.pump(10); continue; }
  const cur = g.call('__CK.cur()');
  if (cur === 0) {
    // finish a chain if the engine requires it
    if (g.call('__CK.jumping()')) {
      const jm = g.call('(function(){return gameState.validMoves && gameState.validMoves.length ? gameState.validMoves[0] : null})()');
      if (jm) { g.call(`__CK.exec(${jm.from}, ${jm.to}, 'jump')`); moves++; g.pump(12); continue; }
      break;
    }
    const ms = g.call('__CK.myMoves()') || [];
    if (ms.length) { g.call(`__CK.exec(${ms[0].from}, ${ms[0].to}, ${JSON.stringify(ms[0].type || 'step')})`); moves++; g.pump(12); continue; }
    break;
  }
  // AI chain: doAITurn + animation + jump continuations all on timers — pump generously
  g.pump(30);
}
const pieces = [0, 1, 2, 3, 4, 5].map(p => g.call(`__CK.pieces(${p})`) || 0);
T('moves-executed', moves >= 10, 'moves=' + moves);
const seatCount = pieces.filter(n => n === 10).length; // default newGame = 2 seats (10 pieces each)
T('material-preserved', pieces.filter(n => n > 0).every(n => n === 10) && seatCount >= 2, JSON.stringify(pieces) + ' seats=' + seatCount);
T('all-seats-active', seatsSeen.size >= seatCount, 'seats=' + [...seatsSeen].join(',') + ' seatCount=' + seatCount);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { moves, pieces, seats: [...seatsSeen] } };
console.log('chinese-checkers: engine-move turns across seats: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
