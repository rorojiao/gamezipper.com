#!/usr/bin/env node
/* shogi verifier — full game vs the engine's own AI through the real input path:
 * board moves via real #board cell clicks (dataset.r/c → the engine's onCellClick
 * selection → legal target click → doSelectedMoveTo), drops via the engine's own
 * onHandClick, promotion via the real promoYes button, AI replies via the engine's
 * own doAI timer chain. Human moves chosen by the engine's own findBest at depth 2
 * (deeper once material is won) vs Easy AI. Win signal = the engine's own
 * finalizeResult/humanWon + record.wins. Undo/hint/mode/difficulty exercised via
 * their real buttons and the real select change event. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('shogi', { inject: {
  anchor: 'function doAI(){',
  exports: `
globalThis.__result = null;
const __sgFin = finalizeResult;
finalizeResult = function(w, s){ globalThis.__result = { winner: state.winner, humanWon: mode === 'computer' ? state.winner === 0 : null, wasCheck: w, sennichite: s }; return __sgFin.apply(this, arguments); };
globalThis.__SG = {
  over: () => state.over, winner: () => state.winner, turn: () => state.turn, mode: () => mode, diff: () => difficulty,
  moveCount: () => state.moveCount, hist: () => state.history.length,
  aiPieces: () => { let n = 0; for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const p = state.board[r][c]; if (p && p.s === 1) n++; } return n; },
  best: (d) => findBest(state, d, 0),
  hand: (side, type) => onHandClick(side, type),
  record: () => ({ w: record.wins, l: record.losses }),
  hint: () => !!hintMove,
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const T0 = Date.now();

function cell(r, c) { // the real board cell (engine writes dataset.r/c on each render)
  for (const el of g.els['board'].children) if (Number(el.dataset.r) === r && Number(el.dataset.c) === c) return el;
  return null;
}
const clickRC = (r, c) => cell(r, c).click();

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('fresh-game', C('__SG.turn()') === 0 && !C('__SG.over()') && C('__SG.mode()') === 'computer', 'turn=' + C('__SG.turn()') + ' mode=' + C('__SG.mode()'));

// real difficulty select: change event → setDiff
g.els['btnNew'].click(); g.pump(2);
const sel = g.els['selDiff'];
sel.value = '1'; sel.dispatch('change', { target: sel, value: '1' }); g.pump(2);
T('difficulty-set', C('__SG.diff()') === 1, 'diff=' + C('__SG.diff()'));

// --- real-move sanity + undo probe: one human move + one AI reply, then undo ---
clickRC(6, 4); g.pump(2); clickRC(5, 4); g.pump(12); // ▲P 5g→5f ... AI replies on its timer
let guard = 0; while (C('__SG.turn()') !== 0 && !C('__SG.over()') && guard++ < 60) g.pump(4);
T('moves-execute', C('__SG.hist()') === 2 && C('__SG.turn()') === 0, 'hist=' + C('__SG.hist()') + ' turn=' + C('__SG.turn()'));
g.els['btnUndo'].click(); g.pump(2);
T('undo-restore', C('__SG.turn()') === 0 && C('__SG.hist()') === 0, 'hist=' + C('__SG.hist()') + ' turn=' + C('__SG.turn()'));

// --- hint via the real button (20ms engine timer computes it) ---
g.els['btnHint'].click(); g.pump(5);
T('hint-computes', C('__SG.hint()') === true, 'hint=' + C('__SG.hint()'));

// --- 2-player mode via the real toggle: both sides play through cell clicks ---
g.els['btnMode'].click(); g.pump(2);
T('two-player-mode', C('__SG.mode()') === 'twoplayer', 'mode=' + C('__SG.mode()'));
clickRC(6, 2); g.pump(1); clickRC(5, 2); g.pump(2); // sente pawn (6,2)->(5,2)
T('twoplayer-sente-moved', C('__SG.turn()') === 1 && C('__SG.hist()') === 1, 'turn=' + C('__SG.turn()') + ' hist=' + C('__SG.hist()'));
clickRC(2, 7); g.pump(1); clickRC(3, 7); g.pump(2); // gote pawn (2,7)->(3,7)
T('twoplayer-gote-moved', C('__SG.turn()') === 0 && C('__SG.hist()') === 2, 'turn=' + C('__SG.turn()') + ' hist=' + C('__SG.hist()'));
g.els['btnMode'].click(); g.pump(2); // back to computer

// --- main game: engine findBest(2+) for sente vs Easy AI, executed via real cells ---
g.els['btnNew'].click(); g.pump(2);
sel.value = '1'; sel.dispatch('change', { target: sel, value: '1' }); g.pump(1);
let plies = 0, reason = 'unknown';
while (!C('__SG.over()')) {
  if (Date.now() > T0 + 95000) { reason = 'time-budget'; break; }
  if (plies > 400) { reason = 'move-budget'; break; }
  if (C('__SG.turn()') === 0) {
    const depth = C('__SG.aiPieces()') <= 8 ? 3 : 2; // endgame: deeper + cheap (few pieces)
    const m = C('__SG.best(' + depth + ')');
    if (!m) { reason = 'no-move'; break; }
    const mc0 = C('__SG.moveCount()');
    if (m.drop) g.call("__SG.hand(0,'" + m.type + "')"); // same handler the hand tile's listener runs
    else clickRC(m.fr, m.fc); // real select click
    g.pump(2);
    clickRC(m.tr, m.tc); // real destination click
    if (g.els['promoOverlay'].classList.contains('show')) g.els['promoYes'].click(); // real promote button
    g.pump(4);
    if (C('__SG.moveCount()') === mc0) { reason = 'move-rejected'; break; }
    plies++;
  } else {
    let k = 0; while (C('__SG.turn()') === 1 && !C('__SG.over()') && k++ < 40) g.pump(4); // doAI 120ms + 30ms timers
    if (C('__SG.turn()') === 1 && !C('__SG.over()')) { reason = 'ai-stuck'; break; }
    plies++;
  }
}
const res = C('__result');
T('game-ended', !!res, 'reason=' + reason + ' plies=' + plies);
T('beat-the-ai', !!res && res.humanWon === true, 'winner=' + (res && res.winner) + ' reason=' + reason + ' plies=' + plies);
T('result-overlay-shown', g.els['resultOverlay'].classList.contains('show'), 'overlay missing');
T('record-win-saved', C('__SG.record().w') >= 1, 'record=' + JSON.stringify(C('__SG.record()')));
const rec = JSON.parse(g.ls.getItem('shogi_record_v1') || '{}');
T('record-persisted', (rec.wins || 0) >= 1, 'ls=' + JSON.stringify(rec));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: res && res.humanWon === true ? 'yes' : 'no', plies, reason, durS: Math.round((Date.now() - T0) / 1000) } };
console.log('shogi: beat Easy AI in ' + plies + ' plies via real cell clicks (winner=' + (res && res.winner) + '): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
