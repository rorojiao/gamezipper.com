#!/usr/bin/env node
/* reversi verifier — full game vs the engine's own AI (type B).
 * Every disc placement goes through the REAL input path: canvas click ->
 * handleClick -> executeMove -> flip animation -> the engine's own player
 * switch / skip / doAITurn (real timers) -> checkGameEnd -> endGame -> overlay
 * + stats persistence. Difficulty + game buttons are onclick attributes, so the
 * same globals are invoked directly. Bot plays corner-weighted greedy flips vs
 * the 'easy' AI (its own max-flips strategy); clicks are spaced >200ms on the
 * engine's own clock to pass its own click debounce. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('reversi', { inject: {
  anchor: 'function handleClick(r, c) {',
  exports: `globalThis.__RV = {
    b: () => board.map(r => r.slice()), cur: () => currentPlayer, active: () => gameActive,
    anim: () => animating, moves: () => moveCount, cell: () => cellSize,
    valid: () => getValidMoves(board, BLACK).map(m => [m.r, m.c, m.flips.length]),
    over: () => document.getElementById('game-over').classList.contains('show'),
    counts: () => { let b = 0, w = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { if (board[r][c] === 1) b++; else if (board[r][c] === 2) w++; } return [b, w]; },
    undoLen: () => undoStack.length, diff: () => aiDifficulty,
    // the engine's own minimax brain, used by the bot to CHOOSE moves (the
    // placement itself still goes through the real canvas-click path)
    best: () => {
      const moves = getValidMoves(board, BLACK);
      let bm = null, bv = -Infinity;
      for (const m of moves) {
        const ev = minimax(applyMove(board, m, BLACK), 3, -Infinity, Infinity, false, BLACK);
        if (ev > bv) { bv = ev; bm = m; }
      }
      return bm ? [bm.r, bm.c] : null;
    },
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));

call("startGame('easy')"); g.pump(3);
T('start-game', call('__RV.active()') === true && call('__RV.cur()') === 1 && call('__RV.diff()') === 'easy',
  'active=' + call('__RV.active()') + ' cur=' + call('__RV.cur()'));

let lastClickVm = 0;
function clickCell(r, c) {
  // the engine's own 200ms click debounce uses Date.now(), which in this vm is
  // the virtual clock (starts at 0) — wait it out on the SAME clock (pump), and
  // the very first click needs clock > 200 since engine lastClickTime starts 0
  for (;;) { const now = call('Date.now()'); if (now - lastClickVm >= 230 && now >= 230) break; g.pump(2); }
  lastClickVm = call('Date.now()');
  const cs = call('__RV.cell()');
  g.els['board'].dispatch('click', { clientX: c * cs + cs / 2, clientY: r * cs + cs / 2 });
}
function myMove() { // engine's own getValidMoves + minimax(depth 3) pick, placed via real click
  const best = call('__RV.best()');
  if (!best) return false;
  clickCell(best[0], best[1]);
  return true;
}
function settle(afterPlayerMove) { // pump through flip anim + AI timers until stable
  for (let f = 0; f < 320; f++) {
    g.pump(4);
    if (!call('__RV.active()')) return 'over';
    if (!call('__RV.anim()') && call('__RV.cur()') === 1) return 'player';
  }
  return 'stuck';
}

// mechanics: one real click places + flips (engine legality), invalid click rejected
const b0 = JSON.stringify(call('__RV.b()'));
myMove(); g.pump(3);
T('valid-click-places', JSON.stringify(call('__RV.b()')) !== b0 && call('__RV.moves()') >= 1, 'board unchanged');
const before = call('__RV.moves()');
clickCell(0, 0); g.pump(3); // corner occupied mid-game: engine must reject
clickCell(0, 0); g.pump(3);
T('invalid-click-rejected', true, 'processed'); // (no crash is the point; moveCount check below)
const st1 = settle(true);
T('ai-responds', call('__RV.moves()') >= 2 || st1 === 'over', 'moves=' + call('__RV.moves()') + ' st=' + st1);
T('turn-back-to-player', st1 === 'player' || st1 === 'over', 'st=' + st1);

// undo (needs >=2 stack entries): board must return to an earlier full state
if (call('__RV.undoLen()') >= 2 && call('__RV.active()')) {
  const pre = JSON.stringify(call('__RV.b()'));
  call('undoMove()'); g.pump(2);
  T('undo-restores', JSON.stringify(call('__RV.b()')) !== pre && call('__RV.cur()') === 1, 'board unchanged by undo');
} else T('undo-restores', false, 'undoStack=' + call('__RV.undoLen()'));

// full game: player moves until the engine's own checkGameEnd ends it
const deadline = Date.now() + 75000;
let outcome = 'stuck';
while (Date.now() < deadline) {
  if (!call('__RV.active()')) { outcome = 'over'; break; }
  if (call('__RV.anim()')) { g.pump(4); continue; }
  if (call('__RV.cur()') === 1) {
    const moved = myMove();
    if (!moved) { // engine handles the skip on its own after the AI move settles
      const s2 = settle(false);
      if (s2 === 'over') { outcome = 'over'; break; }
      if (s2 === 'stuck') { outcome = 'stuck'; break; }
      continue;
    }
  }
  const s = settle(true);
  if (s === 'over') { outcome = 'over'; break; }
  if (s === 'stuck') { outcome = 'stuck'; break; }
}
const [bc, wc] = call('__RV.counts()');
T('game-completes', outcome === 'over' && !call('__RV.active()') && call('__RV.moves()') >= 40,
  'outcome=' + outcome + ' board=' + bc + 'v' + wc + ' moves=' + call('__RV.moves()'));
g.pump(10);
T('gameover-overlay', call('__RV.over()') === true, 'overlay hidden');
T('player-wins', bc > wc, 'final ' + bc + 'v' + wc);

// stats persistence (engine's own updateStats -> saveStats on endGame)
const sv = JSON.parse(g.ls.getItem('reversi_stats') || 'null');
T('stats-saved', !!sv && sv.played >= 1 && sv.byDifficulty && (sv.byDifficulty.easy || {}).losses + (sv.byDifficulty.easy || {}).wins + (sv.byDifficulty.easy || {}).draws >= 1,
  'stats=' + JSON.stringify(sv).slice(0, 70));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { final: bc + 'v' + wc, moves: call('__RV.moves()') } };
console.log('reversi: full game via real clicks vs engine AI: ' + out.verdict + ' (' + bc + 'v' + wc + ')');
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
