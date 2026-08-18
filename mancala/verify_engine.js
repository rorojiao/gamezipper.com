#!/usr/bin/env node
/* mancala verifier — C-type: play a real game through the game instance's own methods.
 * window.__mancalaGame (the load-time instance, now named) — human P1 moves via
 * _executeMove(1, pit), the exact callee of the canvas-click path; the depth-3 AI
 * responds on engine timers. The move engine is ASYNC (real awaits on timers), so the
 * driver yields real microtasks between vm pumps.
 * PASS: >=8 moves executed, stores fill (>4 seeds), gameOver OR 40+ moves, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('mancala');
const yieldTick = () => new Promise(r => setImmediate(r));
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const gm = g.sandbox.__mancalaGame;
T('instance-exists', !!gm);

(async () => {
  if (!gm) return;
  let moves = 0, guard = 0;
  while (guard++ < 20000) {
    const st = gm.state;
    if (st.gameOver) break;
    if (gm.animating || gm.aiThinking) { g.pump(4); await yieldTick(); continue; }
    if (st.currentPlayer === 1) {
      let pit = -1;
      for (let i = 0; i < 6; i++) if (st.board[i] > 0) { pit = i; break; }
      if (pit < 0) { g.pump(10); await yieldTick(); continue; }
      gm._executeMove(1, pit); // the canvas-click callee (async)
      moves++;
      g.pump(20);
      await yieldTick();
    } else {
      g.pump(10);
      await yieldTick(); // AI on engine timers
    }
  }
  const seeds = gm.state.board[6] + gm.state.board[13];
  T('moves-executed', moves >= 8, 'moves=' + moves);
  T('stores-filled', seeds > 4, 'seeds=' + seeds);
  T('game-concluded', gm.state.gameOver === true || moves >= 40, 'over=' + gm.state.gameOver + ' moves=' + moves);
  T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
    JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));
  const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
    extra: { moves, seeds, over: gm.state.gameOver } };
  console.log('mancala: pit-move turns through the instance click callee: ' + out.verdict);
  console.log(JSON.stringify(out));
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERR', e.stack || e.message); process.exit(1); });
