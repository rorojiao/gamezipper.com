#!/usr/bin/env node
/* gomoku verifier — 15x15 five-in-a-row vs engine AI + 2P (type B board game).
 * Every stone goes through the REAL input path: canvas pointerdown ->
 * getGridPos (grid snap + half-cell radius) -> placeStone legality ->
 * the engine's own checkWin (5 in a row) -> showVictory overlay -> stats ->
 * localStorage. The AI answers through the engine's own startAI -> fallbackAI
 * (its designed no-Worker path). Buttons are the real parsed buttons; the
 * difficulty/board-size selects are driven through their real change events. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('gomoku', { inject: {
  anchor: 'function placeStone(row,col){',
  exports: `globalThis.__GM = {
    size: () => G.boardSize, mode: () => G.mode, diff: () => G.difficulty,
    board: () => G.board.map(r => r.slice()), moves: () => G.moves.length,
    cur: () => G.currentPlayer, over: () => G.gameOver, winner: () => G.winner,
    winStones: () => G.winningStones, ai: () => G.aiThinking, hover: () => G.hoverPos,
    stats: () => G.stats, saved: () => { try { return JSON.parse(localStorage.getItem('gomoku-stats-v1')) } catch (e) { return null } },
    ov: (id) => document.getElementById(id).classList.contains('visible'),
    geo: () => { const rc = canvas.getBoundingClientRect(); return [G.cellSize, G.padding, rc.left, rc.top]; },
    undoOn: () => !document.getElementById('btn-undo').disabled,
    turn: () => document.getElementById('turn-text').textContent,
    title: () => document.getElementById('victory-title').textContent,
    sub: () => document.getElementById('victory-subtitle').textContent,
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));

// harness fires boot DOMContentLoaded from the window bag only; gomoku wires
// init() on the document — replay that exact event so init() runs as in a browser
((g.sandbox.document.__dls || {})['DOMContentLoaded'] || [])
  .forEach(f => f.call(g.sandbox.document, { type: 'DOMContentLoaded' }));

function tap(r, c) { // real canvas pointerdown at the grid intersection
  const [cs, pad, rl, rt] = call('__GM.geo()');
  g.els['board'].dispatch('pointerdown', { clientX: rl + pad + c * cs, clientY: rt + pad + r * cs, preventDefault() {} });
}
function settleAI() { for (let f = 0; f < 40 && call('__GM.ai()'); f++) g.pump(4); g.pump(4); }
function tapSeq(seq) { for (const [r, c] of seq) { tap(r, c); g.pump(10); settleAI(); } }

// first-run tutorial auto-shows at 600ms (its own timer) -> close via real button
for (let f = 0; f < 40 && !call('__GM.ov("tutorial-overlay")'); f++) g.pump(4);
T('tutorial-auto-shows', call('__GM.ov("tutorial-overlay")') === true, 'ov=' + call('__GM.ov("tutorial-overlay")'));
g.els['btn-tutorial-close'].click();
T('tutorial-closes-saves', call('__GM.ov("tutorial-overlay")') === false &&
  g.ls.getItem('gomoku-tutorial-seen') === '1', 'still open');

T('board-15-fresh', call('__GM.size()') === 15 && call('__GM.moves()') === 0 &&
  call('__GM.board()').length === 15 && call('__GM.cur()') === 1,
  'size=' + call('__GM.size()') + ' moves=' + call('__GM.moves()'));

// hover tracking (pointermove -> getGridPos)
(function () {
  const [cs, pad, rl, rt] = call('__GM.geo()');
  g.els['board'].dispatch('pointermove', { clientX: rl + pad + 7 * cs, clientY: rt + pad + 8 * cs, preventDefault() {} });
})();
const hv = call('__GM.hover()');
T('hover-tracks-grid', hv && hv.row === 8 && hv.col === 7, 'hover=' + JSON.stringify(hv));

// ---- real tap mechanics vs the engine AI ----
tap(7, 7);
const turnWhileThinking = call('__GM.turn()'), movesWhileThinking = call('__GM.moves()');
g.pump(10);
T('tap-places-black', call('__GM.board()[7][7]') === 1 && movesWhileThinking === 1 &&
  turnWhileThinking === 'AI Thinking', 'b77=' + call('__GM.board()[7][7]') + ' moves=' + movesWhileThinking + ' turn=' + turnWhileThinking);
settleAI();
const whites = call('__GM.board()').flat().filter(v => v === 2).length;
T('ai-responds', whites === 1 && call('__GM.cur()') === 1 && call('__GM.moves()') === 2, 'whites=' + whites);
tap(7, 7); g.pump(6);
T('occupied-tap-rejected', call('__GM.moves()') === 2, 'moves=' + call('__GM.moves()'));
(function () { // far off-grid point (between cells) -> getGridPos null
  const [cs, pad, rl, rt] = call('__GM.geo()');
  g.els['board'].dispatch('pointerdown', { clientX: rl + 3, clientY: rt + 3, preventDefault() {} });
})();
g.pump(6);
T('offgrid-tap-rejected', call('__GM.moves()') === 2, 'moves=' + call('__GM.moves()'));
g.els['btn-undo'].click(); g.pump(4);
T('undo-removes-pair', call('__GM.moves()') === 0 && call('__GM.board()')[7][7] === 0 &&
  call('__GM.cur()') === 1 && call('__GM.undoOn()') === false,
  'moves=' + call('__GM.moves()') + ' b77=' + call('__GM.board()')[7][7]);

// ---- 2P mode through the real mode button: black five-in-a-row ----
g.els['btn-2p'].click(); g.pump(2);
T('mode-2p-switch', call('__GM.mode()') === '2p' && call('__GM.moves()') === 0 &&
  g.els['diff-group'].style.display === 'none', 'mode=' + call('__GM.mode()'));
tapSeq([[7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [0, 2], [7, 6], [0, 3], [7, 7]]);
for (let f = 0; f < 50 && !call('__GM.ov("victory-overlay")'); f++) g.pump(4);
T('black-5-wins-2p', call('__GM.over()') === true && call('__GM.winner()') === 1 &&
  call('__GM.winStones()').length === 5 && call('__GM.ov("victory-overlay")') === true &&
  call('__GM.title()') === 'Black Wins!' && call('__GM.sub()').includes('takes the game'),
  'over=' + call('__GM.over()') + ' w=' + call('__GM.winner()') + ' t=' + call('__GM.title()'));
g.pump(8);
T('win-stat-recorded', call('__GM.stats().wins') === 1 &&
  (call('__GM.saved()') || {}).wins === 1, 'stats=' + JSON.stringify(call('__GM.stats()')).slice(0, 60));
g.els['btn-play-again'].click(); g.pump(4);
T('play-again-resets', call('__GM.ov("victory-overlay")') === false && call('__GM.moves()') === 0 &&
  call('__GM.over()') === false && call('__GM.cur()') === 1, 'moves=' + call('__GM.moves()'));

// white five-in-a-row in 2P -> loss stat
tapSeq([[0, 0], [7, 3], [0, 1], [7, 4], [1, 0], [7, 5], [1, 1], [7, 6], [2, 0], [7, 7]]);
for (let f = 0; f < 50 && !call('__GM.ov("victory-overlay")'); f++) g.pump(4);
T('white-5-wins-2p', call('__GM.winner()') === 2 && call('__GM.title()') === 'White Wins!' &&
  call('__GM.stats().losses') === 1, 'w=' + call('__GM.winner()') + ' t=' + call('__GM.title()'));

// ---- back to VS AI (easy) through the real controls, then beat the AI ----
g.els['btn-victory-close'].click(); g.pump(2);
g.els['btn-vs-ai'].click(); g.pump(2);
T('mode-ai-switch', call('__GM.mode()') === 'ai' && g.els['diff-group'].style.display === '', 'mode=' + call('__GM.mode()'));
g.els['difficulty'].value = 'easy'; g.els['difficulty'].dispatch('change'); g.pump(2);
T('difficulty-easy', call('__GM.diff()') === 'easy', 'diff=' + call('__GM.diff()'));

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
function runInfo(bd, r, c, pl) { // best run + open ends if pl sat at (r,c)
  let best = { cnt: 0, open: 0 };
  for (const [dr, dc] of DIRS) {
    let cnt = 1, open = 0;
    let i = 1; for (; r + dr * i >= 0 && r + dr * i < 15 && c + dc * i >= 0 && c + dc * i < 15 && bd[r + dr * i][c + dc * i] === pl; i++) cnt++;
    if (r + dr * i >= 0 && r + dr * i < 15 && c + dc * i >= 0 && c + dc * i < 15 && bd[r + dr * i][c + dc * i] === 0) open++;
    i = 1; for (; r - dr * i >= 0 && r - dr * i < 15 && c - dc * i >= 0 && c - dc * i < 15 && bd[r - dr * i][c - dc * i] === pl; i++) cnt++;
    if (r - dr * i >= 0 && r - dr * i < 15 && c - dc * i >= 0 && c - dc * i < 15 && bd[r - dr * i][c - dc * i] === 0) open++;
    if (cnt > best.cnt || (cnt === best.cnt && open > best.open)) best = { cnt, open };
  }
  return best;
}
function cands(bd) { // empties within 2 of any stone (mirrors the engine's own idea)
  const set = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) {
    if (bd[r][c] === 0) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && bd[nr][nc] === 0 && !set.some(s => s[0] === nr && s[1] === nc)) set.push([nr, nc]);
    }
  }
  if (!set.length) set.push([7, 7]);
  return set;
}
function winCell(bd, pl) { // a cell where placing pl makes 5 (engine checks the real win)
  for (const [r, c] of cands(bd)) if (runInfo(bd, r, c, pl).cnt >= 5) return [r, c];
  return null;
}
let aiResult = '';
(function playAI() {
  for (let ply = 0; ply < 120; ply++) {
    if (call('__GM.over()')) break;
    const bd = call('__GM.board()');
    let mv = winCell(bd, 1);                    // 1) take my five
    if (!mv) { const w = winCell(bd, 2); if (w) mv = w; } // 2) block AI's five
    if (!mv) {                                  // 3) block any forming white four
      for (const [r, c] of cands(bd)) {
        const ri = runInfo(bd, r, c, 2);
        if (ri.cnt >= 4 && ri.open >= 1) { mv = [r, c]; break; }
      }
    }
    if (!mv) {                                  // 4) best double-threat build
      let bs = -1;
      for (const [r, c] of cands(bd)) {
        const mine = runInfo(bd, r, c, 1), theirs = runInfo(bd, r, c, 2);
        let s = 0;
        if (mine.cnt >= 4) s += mine.open >= 1 ? 100000 : 9000;
        if (mine.cnt === 3 && mine.open === 2) s += 3000; else if (mine.cnt === 3) s += 600;
        if (mine.cnt === 2 && mine.open === 2) s += 150;
        if (theirs.cnt >= 3) s += theirs.cnt * 350; // disrupt
        s -= (Math.abs(r - 7) + Math.abs(c - 7)) * 2;
        if (s > bs) { bs = s; mv = [r, c]; }
      }
    }
    if (!mv) { aiResult = 'no-move'; return; }
    tap(mv[0], mv[1]); g.pump(10); settleAI();
  }
  aiResult = call('__GM.over()') ? 'done' : 'plies';
})();
for (let f = 0; f < 50 && !call('__GM.ov("victory-overlay")'); f++) g.pump(4);
T('ai-game-beaten', call('__GM.over()') === true && call('__GM.winner()') === 1 &&
  call('__GM.sub()') === 'You defeated the AI!' && aiResult === 'done',
  'winner=' + call('__GM.winner()') + ' sub=' + call('__GM.sub()') + ' end=' + aiResult);
g.pump(8);
const stAI = call('__GM.stats');
T('ai-stats-persist', call('__GM.stats().wins') === 2 &&
  call('__GM.stats().perDifficulty.easy.w') === 1 &&
  (call('__GM.saved()') || {}).perDifficulty.easy.w === 1,
  'stats=' + JSON.stringify(call('__GM.stats().perDifficulty')).slice(0, 60));

// board-size select through its real change event -> 9x9 re-init
g.els['btn-victory-close'].click(); g.pump(2);
g.els['btn-settings'].click(); g.pump(2);
g.els['board-size'].value = '9'; g.els['board-size'].dispatch('change'); g.pump(2);
T('board-size-9', call('__GM.size()') === 9 && call('__GM.board()').length === 9 &&
  call('__GM.moves()') === 0, 'size=' + call('__GM.size()'));
g.els['board'].dispatch('pointerdown', { clientX: 2, clientY: 2, preventDefault() {} }); // still sane on 9x9
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { modes: 'ai-easy-win + 2p-both-colors', aiEnd: aiResult, stats: 'w2 l1', secs: 0 } };
console.log('gomoku: 15x15 real-tap mechanics, 2P both-color wins, AI(easy) defeated through engine checkWin: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
