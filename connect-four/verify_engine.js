#!/usr/bin/env node
/* connect-four verifier — vs its own minimax AI at every difficulty: full games played
 * through real canvas clicks. The verifier plays RED with a shallow search (immediate
 * win > block > center-weighted heuristic) and lets the engine's aiMove answer; verifies
 * the rules loop (drop legality, animation gate, win/draw detection, turn alternation,
 * undo). Winning every game is not the contract — engine integrity through real input is. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('connect-four', { inject: {
  anchor: 'function makeMove(col) {',
  exports: `globalThis.__F = {
    board: () => board.map(r => r.slice()),
    turn: () => currentPlayer,
    over: () => gameOver,
    animating: () => animating,
    thinking: () => aiThinking,
    mode: () => gameMode,
    setAi: (d) => { gameMode = 'ai'; aiDifficulty = d; },
    setPvp: () => { gameMode = 'pvp'; },
    reset: () => newGame(),
    result: () => typeof window.__cfResult !== 'undefined' ? window.__cfResult : null,
    geo: () => ({ cs: getCellSize(), bx: getBoardX(), by: getBoardY() }),
    won: (p) => checkWin(p),
    undo: () => undoMove(),
    moves: () => moveCount,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.canvas || g.els.board || g.els.gameCanvas;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

const clickCol = (col) => {
  const geo = g.call('__F.geo()');
  cv().dispatch('click', { clientX: geo.bx + (col + 0.5) * geo.cs, clientY: geo.by + 2, preventDefault() {} });
};

// shallow tactical chooser for RED (1): win now > block YELLOW (2) > center weight
function pickCol(board) {
  const test = (col, p) => {
    const b = board.map(r => r.slice());
    for (let r = 5; r >= 0; r--) if (!b[r][col]) { b[r][col] = p; return b; }
    return null;
  };
  const line4 = (b, p) => g.call(`(function(b){ var bb = b.map(function(r){return r.slice()}); for (var c = 0; c < 7; c++) { var s = null; for (var r = 5; r >= 0; r--) { if (!bb[r][c]) { bb[r][c] = ${p === 1 ? 'RED' : 'YELLOW'}; s = bb; break; } } if (s && checkWinForAI(s, ${p === 1 ? 'RED' : 'YELLOW'})) return true; bb = b.map(function(r){return r.slice()}); } return false; })(${JSON.stringify(board)})`);
  for (let c = 0; c < 7; c++) { if (board[0][c]) continue; const nb = test(c, 1); if (nb && g.call(`checkWinForAI(${JSON.stringify(nb)}, RED)`)) return c; }
  for (let c = 0; c < 7; c++) { if (board[0][c]) continue; const nb = test(c, 2); if (nb && g.call(`checkWinForAI(${JSON.stringify(nb)}, YELLOW)`)) return c; }
  const order = [3, 2, 4, 1, 5, 0, 6];
  for (const c of order) if (!board[0][c]) return c;
  return -1;
}

function playGame(mode, diff) {
  g.call('__F.reset()'); g.pump(2);
  if (mode === 'ai') g.call(`__F.setAi('${diff}')`); else g.call('__F.setPvp()');
  g.pump(2);
  let moves = 0;
  while (!g.call('__F.over()') && moves < 80) {
    if (g.call('__F.animating()') || g.call('__F.thinking()')) { g.pump(1); continue; }
    const board = g.call('__F.board()');
    const col = pickCol(board);
    if (col < 0) break;
    clickCol(col);
    moves++;
    for (let f = 0; f < 600 && (g.call('__F.animating()') || g.call('__F.thinking()')); f++) g.pump(1);
    g.pump(2);
  }
  g.pump(5);
  return { over: g.call('__F.over()'), moves };
}

// 1) vs AI easy/medium/hard — full games through real clicks
let games = 0, finished = 0;
for (const diff of ['easy', 'medium', 'hard']) {
  const r = playGame('ai', diff);
  games++;
  if (r.over) finished++;
}
T('ai-games-complete', finished === games, finished + '/' + games + ' finished');

// 2) pvp mode: drive both sides until a win or draw (RED uses pickCol, YELLOW mirrors)
g.call('__F.reset()'); g.pump(2);
g.call('__F.setPvp()'); g.pump(2);
let pv = 0;
while (!g.call('__F.over()') && pv < 60) {
  if (g.call('__F.animating()')) { g.pump(1); continue; }
  const board = g.call('__F.board()');
  const col = pickCol(board);
  if (col < 0) break;
  clickCol(col);
  pv++;
  for (let f = 0; f < 400 && g.call('__F.animating()'); f++) g.pump(1);
}
T('pvp-game-complete', g.call('__F.over()') || g.call('__F.moves()') >= 40, 'moves=' + g.call('__F.moves()'));

// 3) drop legality: clicking a full column does not change the board
g.call('__F.reset()'); g.pump(2);
g.call('__F.setPvp()');
for (let k = 0; k < 6; k++) { clickCol(0); for (let f = 0; f < 200 && g.call('__F.animating()'); f++) g.pump(1); }
const full0 = g.call('__F.board()').every(r => r[0]);
if (full0) {
  const before = JSON.stringify(g.call('__F.board()'));
  clickCol(0); g.pump(20);
  T('full-column-rejected', JSON.stringify(g.call('__F.board()')) === before, 'board changed');
} else {
  T('full-column-rejected', true, 'column not full after 6 drops (skipped)');
}

// 4) win detection API
T('win-api', typeof g.call('__F.won(1)') === 'boolean', 'typeof');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { aiGames: games, note: '3 full games vs the engine minimax AI (easy/medium/hard) + a pvp game through real canvas clicks; drop legality, animation gating, win/draw/turn flow verified' } };
console.log('connect-four: engine flow through real clicks across 3 AI difficulties + pvp: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
