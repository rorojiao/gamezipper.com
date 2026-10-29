#!/usr/bin/env node
/* hexxagon save/restore regression gate (R339, 2026-10-29).
 *
 * PROVEN PRODUCTION DEFECT (R339):
 *   `doMove()` mutated `board` but never called `saveState()`, so the persisted blob in
 *   localStorage stayed at the INITIAL board. "Continue Saved Game" therefore restored the
 *   game to Move 1 / red=2 even after the player had moved (Move 3 / red=3).
 *   A SECOND, LATENT defect sat inside the same function: `saveState()` serialised
 *   `history[i].board` — a Map — and `JSON.stringify(Map)` yields `{}`. The old
 *   `loadState()` then did `new Map(h.board)` on that `{}`, which THREW, was swallowed by
 *   the try/catch, and returned false. So once history was non-empty, restoring failed
 *   entirely. Fixing only the missing saveState() call would have shipped that second bug.
 *
 * WHAT THIS GATE PROVES (and what it deliberately does NOT):
 *   1. after a real move, the persisted blob's board DIFFERS from the initial board
 *      (the pre-fix behaviour kept the initial board);
 *   2. loadState() returns TRUE and restores the moved board (pre-fix it returned false
 *      once history was non-empty);
 *   3. the restored history is a usable Map, not the `{}` that broke new Map();
 *   4. the move counter survives the round trip;
 *   5. undo also persists;
 *   6. a NEGATIVE CONTROL: a genuinely broken save implementation must still FAIL here
 *      (so this gate can never be satisfied by a no-op).
 *
 * The engine is driven through its OWN entry points (doMove via handleBoardClick's move
 * list, saveState/loadState directly) — the board maths is never re-implemented here
 * (Pitfall #74). The game is booted with the repo's own VM harness.
 */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

let pass = 0, fail = 0; const fails = [];
const T = (name, ok, info) => {
  if (ok) { pass++; console.log('  PASS  ' + name); }
  else { fail++; fails.push(name + ' :: ' + info); console.log('  FAIL  ' + name + '  ->  ' + info); }
};

function boot() {
  const g = bootGame('hexxagon', {
    inject: {
      anchor: 'function startGame(level){',
      exports: `globalThis.__S = {
        board: () => Array.from(board.entries()),
        counts: () => countPieces(board),
        turn: () => turn,
        over: () => gameOver,
        think: () => aiThinking,
        hist: () => history.length,
        moveCount: () => (typeof moveCount==='undefined' ? null : moveCount),
        diff: () => difficulty,
        moves: () => genMoves(board, HUMAN).map(function(m){ return { fq:m.from.q, fr:m.from.r, tq:m.to.q, tr:m.to.r, type:m.type }; }),
        start: (d) => startGame(d),
        save: () => saveState(),
        load: () => loadState(),
        raw: () => { try { return localStorage.getItem('hexxagon_save_v1'); } catch (e) { return null; } },
        histShape: () => history.map(function(h){ return { isMap: h.board instanceof Map, size: h.board && h.board.size }; }),
      };`,
    },
  });
  return g;
}

// ── drive real moves through the engine's own move list ────────────────────
// undo() requires history.length>=2 (it pops 2 plies: AI move + human move), and
// pushHistory() runs at the START of doMove, so N doMove calls give history.length===N.
function playMoves(g, n) {
  g.call('__S.start(0)');
  for (let i = 0; i < 40; i++) { if (g.call('__S.turn()') === 'R' && !g.call('__S.think()')) break; g.pump(20); }
  const before = g.call('__S.board()');
  const played = [];
  for (let k = 0; k < n; k++) {
    const moves = g.call('__S.moves()');
    if (!moves || !moves.length) break;
    const m = moves[0];
    g.call(`(function(){ doMove({ from:{q:${m.fq},r:${m.fr}}, to:{q:${m.tq},r:${m.tr}}, type:'${m.type}', converts:[] }, HUMAN); })()`);
    played.push(m);
  }
  return { ok: played.length > 0, before, played, hist: g.call('__S.hist()') };
}

console.log('\n=== hexxagon save/restore regression gate (R339) ===\n');

const g = boot();
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 160));

// ---- 1. the move must change the PERSISTED blob ----
const res = playMoves(g, 3);
T('move-playable', res.ok && res.played.length >= 2, 'played=' + (res.played || []).length + ' history=' + res.hist);
if (res.ok) {
  const rawAfterMove = g.call('__S.raw()');
  T('save-blob-exists', !!rawAfterMove, 'raw=' + String(rawAfterMove).slice(0, 120));

  let parsed = null;
  try { parsed = JSON.parse(rawAfterMove); } catch (e) { /* handled below */ }
  T('save-blob-parses', !!parsed, 'raw=' + String(rawAfterMove).slice(0, 160));

  if (parsed) {
    const persisted = JSON.stringify(parsed.board);
    const initial = JSON.stringify(res.before);
    T('PERSISTED-BOARD-ADVANCED', persisted !== initial,
      'persisted board still equals the INITIAL board (pre-fix behaviour: saveState() never called on move)');
    T('PERSISTED-HAS-HISTORY-ENTRIES', Array.isArray(parsed.history) && parsed.history.length > 0,
      'history.length=' + (Array.isArray(parsed.history) ? parsed.history.length : 'not-an-array'));
    const badHistory = (parsed.history || []).filter(h => !Array.isArray(h.board));
    T('PERSISTED-HISTORY-SERIALISABLE', badHistory.length === 0,
      'history entries whose .board is not an array: ' + badHistory.length + ' (JSON.stringify(Map) yields {} -> new Map({}) throws -> loadState() returns false)');
  }

  // ---- 2. loadState() must succeed and restore the MOVED board ----
  const liveBoard = g.call('__S.board()');
  const liveCounts = g.call('__S.counts()');
  const liveMoveCount = g.call('__S.moveCount()');
  const loaded = g.call('__S.load()');
  T('LOADSTATE-RETURNS-TRUE', loaded === true, 'loadState() returned ' + JSON.stringify(loaded));

  const restoredBoard = g.call('__S.board()');
  const restoredCounts = g.call('__S.counts()');
  T('RESTORED-BOARD-EQUALS-MOVED-BOARD', JSON.stringify(restoredBoard) === JSON.stringify(liveBoard),
    'restored=' + JSON.stringify(restoredBoard).slice(0, 160) + ' live=' + JSON.stringify(liveBoard).slice(0, 160));
  T('RESTORED-COUNTS-PRESERVE-RED', restoredCounts.red === liveCounts.red,
    'restored red=' + restoredCounts.red + ' live red=' + liveCounts.red);
  T('RESTORED-MOVECOUNTER', g.call('__S.moveCount()') === liveMoveCount,
    'restored moveCount=' + g.call('__S.moveCount()') + ' live=' + liveMoveCount);

  // ---- 3. restored history must be usable Maps ----
  const shapes = g.call('__S.histShape()');
  const notMaps = (shapes || []).filter(s => !s.isMap);
  T('RESTORED-HISTORY-ARE-MAPS', notMaps.length === 0,
    'history entries that are not Maps after restore: ' + notMaps.length + ' of ' + (shapes || []).length);

  // ---- 4. undo must also persist ----
  const rawBeforeUndo = g.call('__S.raw()');
  g.call('(function(){ undo(); })()');
  const rawAfterUndo = g.call('__S.raw()');
  T('UNDO-PERSISTS', rawAfterUndo !== rawBeforeUndo && !!rawAfterUndo,
    'blob unchanged after undo (pre-fix: undo() never called saveState())');
}

// ---- 5. NEGATIVE CONTROL: a broken save must still fail this gate ----
// The pre-fix defect was that doMove() NEVER CALLED saveState() — so the blob kept the
// board written by startGame(). Emulate exactly that: replace saveState with a NO-OP
// (after startGame has already written the initial blob). The gate's core predicate
// ("persisted board advanced") must then FAIL, proving the gate can still fail.
{
  const g2 = boot();
  g2.call('__S.start(0)');           // writes the initial board to localStorage
  const initial = JSON.stringify(g2.call('__S.board()'));
  const moves = g2.call('__S.moves()');
  if (moves && moves.length) {
    const m = moves[0];
    g2.call('(function(){ saveState = function(){}; })()');   // <- the pre-fix behaviour
    g2.call(`(function(){ doMove({ from:{q:${m.fq},r:${m.fr}}, to:{q:${m.tq},r:${m.tr}}, type:'${m.type}', converts:[] }, HUMAN); })()`);
    const raw = g2.call('__S.raw()');
    let p = null; try { p = JSON.parse(raw); } catch (e) {}
    const persisted = p ? JSON.stringify(p.board) : '';
    T('NEGATIVE-CONTROL-BROKEN-SAVE-FAILS', persisted === initial,
      'the broken (pre-fix) save implementation unexpectedly ADVANCED the persisted board — the gate would be a no-op');
  } else {
    T('NEGATIVE-CONTROL-BROKEN-SAVE-FAILS', false, 'could not set up the negative control (no legal move)');
  }
}

console.log('\n----------------------------------------');
console.log('PASS ' + pass + '  FAIL ' + fail);
if (fail) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); }
console.log(fail === 0 ? 'VERDICT: PASS' : 'VERDICT: FAIL');
process.exit(fail === 0 ? 0 : 1);
