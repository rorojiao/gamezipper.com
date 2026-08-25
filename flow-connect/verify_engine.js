#!/usr/bin/env node
/* flow-connect verifier — 100 seeded pipe-flow levels across 5 packs + daily (type A).
 * Every stroke goes through the REAL input path: canvas pointerdown/pointermove/
 * pointerup -> getCellFromEvent -> the engine's own adjacency / other-color blocking
 * / own-path truncation rules -> reachedEnd -> its own checkWin (all colors connected
 * + every cell covered) -> onWin -> the real win modal -> the real Next Level button
 * chains all 100 levels (pack transitions included). Undo / Reset / Hint via their
 * real buttons, level select via the real generated buttons. The bot replays
 * puzzle.solution — the engine's OWN generator output (move selection only); every
 * single cell is a real pointer event at real canvas coordinates. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('flow-connect', { inject: {
  anchor: 'function getCellFromEvent(e) {',
  exports: `globalThis.__FC = {
    packs: () => PACKS.length, per: () => PACKS[0].levels,
    rows: () => puzzle.rows, cols: () => puzzle.cols, ncol: () => puzzle.numColors,
    sol: (i) => puzzle.solution[i],
    conn: (i) => isConnected(i), won: () => gameWon,
    modal: () => !document.getElementById('win-modal').classList.contains('hidden'),
    nextHidden: () => document.getElementById('btn-next').classList.contains('hidden'),
    title: () => document.getElementById('win-title').textContent,
    drawing: () => !!drawing, dlen: () => drawing ? drawing.path.length : -1,
    grid: () => grid.map(r => r.slice()),
    hints: () => progress.hints, hintN: () => hintCells.length,
    prog: () => Object.keys(progress.completedLevels).map(k => k + ':' + progress.completedLevels[k].stars),
    pack: () => currentPack, lvl: () => currentLevel, daily: () => isDaily,
    screen: (id) => !document.getElementById(id).classList.contains('hidden'),
    tut: () => !document.getElementById('tutorial-overlay').classList.contains('hidden'),
    cell: () => calcCellSize(),
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('packs-5x20', call('__FC.packs()') === 5 && call('__FC.per()') === 20, call('__FC.packs()') + 'x' + call('__FC.per()'));

// geometry cache (cell size + canvas backing size fixed within a level)
let CS = 1, CW = 1, CH = 1, RL = 0, RT = 0;
function refreshGeom() {
  CS = call('__FC.cell()');
  CW = call("document.getElementById('game-canvas').width");
  CH = call("document.getElementById('game-canvas').height");
  const rc = call("document.getElementById('game-canvas').getBoundingClientRect()");
  RL = rc.left; RT = rc.top; RW = rc.width; RH = rc.height;
}
let RW = 480, RH = 640;
function px(r, c) {
  return [RL + (c * CS + CS / 2) * (RW / CW), RT + (r * CS + CS / 2) * (RH / CH)];
}
const pd = (r, c) => { const [x, y] = px(r, c); g.els['game-canvas'].dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} }); };
const pm = (r, c) => { const [x, y] = px(r, c); g.els['game-canvas'].dispatch('pointermove', { clientX: x, clientY: y, preventDefault() {} }); };
const pu = () => g.els['game-canvas'].dispatch('pointerup', { preventDefault() {} });
function drawSeg(i) { // real pointer stroke along the engine's own solution segment
  const seg = call('__FC.sol(' + i + ')');
  pd(seg[0][0], seg[0][1]);
  for (let k = 1; k < seg.length; k++) pm(seg[k][0], seg[k][1]);
  pu();
}
function winCur() { // draw every segment; win fires inside the engine's own onPointerMove
  refreshGeom();
  const n = call('__FC.ncol()');
  for (let i = 0; i < n; i++) drawSeg(i);
  return call('__FC.won()') === true && call('__FC.modal()') === true;
}

// tutorial (first-run) -> close via its real button
T('tutorial-shown', call('__FC.tut()') === true, 'not shown');
g.els['btn-tutorial-ok'].click();
T('tutorial-closes', call('__FC.tut()') === false && g.ls.getItem('flow-connect-tutorial') === '1', 'still open');

// title -> level select; generated buttons + lock state
g.els['btn-play'].click();
T('level-select-renders', call('__FC.screen("level-select")') === true &&
  call('document.querySelectorAll(".level-btn").length') === 20,
  'btns=' + call('document.querySelectorAll(".level-btn").length'));
T('locked-levels-disabled', call('document.querySelectorAll(".level-btn")[1].disabled') === true &&
  call('document.querySelectorAll(".level-btn")[19].disabled') === true, 'unlocked before any win');
call('document.querySelectorAll(".level-btn")[0].click()');
refreshGeom();
T('start-l1', call('__FC.screen("game-screen")') === true && call('__FC.rows()') === 5 &&
  call('__FC.cols()') === 5 && call('__FC.ncol()') === 4 &&
  JSON.stringify(call('__FC.grid()')).split('-1').length === 26, // 25 cells +1 leading
  'r=' + call('__FC.rows()') + ' c=' + call('__FC.cols()') + ' n=' + call('__FC.ncol()'));

// ---- pointer mechanics on level 1 (5x5, 4 colors) ----
const s0 = call('__FC.sol(0)'); // 6 cells: endpoints s0[0], s0[5]
pd(s0[0][0], s0[0][1]);
T('pointerdown-starts-draw', call('__FC.drawing()') === true && call('__FC.dlen()') === 1 &&
  call('__FC.grid()[' + s0[0][0] + '][' + s0[0][1] + ']') === 0, 'dlen=' + call('__FC.dlen()'));
const g0 = JSON.stringify(call('__FC.grid()'));
pm(s0[2][0], s0[2][1]); // 2 steps away: engine must ignore non-adjacent jumps
T('nonadjacent-ignored', call('__FC.dlen()') === 1 && JSON.stringify(call('__FC.grid()')) === g0, 'dlen=' + call('__FC.dlen()'));
pm(s0[1][0], s0[1][1]);
T('adjacent-move-extends', call('__FC.dlen()') === 2 &&
  call('__FC.grid()[' + s0[1][0] + '][' + s0[1][1] + ']') === 0, 'dlen=' + call('__FC.dlen()'));
pm(s0[0][0], s0[0][1]); // step back onto own path -> truncate
T('stepback-truncates', call('__FC.dlen()') === 1 &&
  call('__FC.grid()[' + s0[1][0] + '][' + s0[1][1] + ']') === -1, 'dlen=' + call('__FC.dlen()'));
for (let k = 1; k < s0.length; k++) pm(s0[k][0], s0[k][1]); // finish segment 0
pu();
T('segment-connects', call('__FC.conn(0)') === true && call('__FC.drawing()') === false,
  'conn0=' + call('__FC.conn(0)'));

// other color blocked: seg1's start neighbors seg0's end; stepping there is rejected
const s1 = call('__FC.sol(1)');
pd(s1[0][0], s1[0][1]);
let blk = null;
for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
  const r = s1[0][0] + dr, c = s1[0][1] + dc;
  if (r >= 0 && r < 5 && c >= 0 && c < 5 && call('__FC.grid()[' + r + '][' + c + ']') === 0) { blk = [r, c]; break; }
}
if (blk) {
  pm(blk[0], blk[1]);
  T('other-color-blocked', call('__FC.dlen()') === 1 && call('__FC.grid()[' + blk[0] + '][' + blk[1] + ']') === 0,
    'dlen=' + call('__FC.dlen()'));
} else T('other-color-blocked', false, 'no adjacent color-0 cell');
pm(s1[1][0], s1[1][1]); pm(s1[2][0], s1[2][1]); // legit steps into empty cells
pu();
T('second-stroke-draws', call('__FC.grid()[' + s1[1][0] + '][' + s1[1][1] + ']') === 1, 'cell not claimed');
g.els['btn-undo'].click();
T('undo-restores', call('__FC.grid()[' + s1[1][0] + '][' + s1[1][1] + ']') === -1 &&
  call('__FC.conn(1)') === false, 'color-1 cells survived undo');
g.els['btn-hint'].click();
T('hint-reveals-cell', call('__FC.hints()') === 2 && call('__FC.hintN()') === 1,
  'hints=' + call('__FC.hints()') + ' hintCells=' + call('__FC.hintN()'));
g.els['btn-restart'].click();
T('restart-resets', JSON.stringify(call('__FC.grid()')).split('-1').length === 26, 'grid not empty');

// ---- win level 1 via pure pointer strokes, engine's own checkWin ----
T('l1-win-via-pointer', winCur() === true && !JSON.stringify(call('__FC.grid()')).includes('-1') &&
  call('__FC.nextHidden()') === false, 'won=' + call('__FC.won()'));
const prog1 = call('__FC.prog()');
const l1entry = (prog1.find(k => k.startsWith('0-0:')) || '');
T('win-recorded', /^0-0:[1-3]$/.test(l1entry), 'prog=' + l1entry);

// back to level select: L2 unlocked by the L1 win, L4+ still locked
g.els['btn-win-levels'].click();
T('unlock-chain', call('__FC.screen("level-select")') === true &&
  call('document.querySelectorAll(".level-btn")[1].disabled') === false &&
  call('document.querySelectorAll(".level-btn")[3].disabled') === true,
  'l2=' + call('document.querySelectorAll(".level-btn")[1].disabled'));

// ---- chain levels 2..100 (packs 0-4) through the real Next Level button ----
call('document.querySelectorAll(".level-btn")[1].click()');
const t0 = Date.now();
const done = 1; const won = [1]; let stuck = '';
for (let p = 1; p <= 99; p++) {
  if (Date.now() - t0 > 92000) { stuck = 'budget@p' + p; break; }
  if (call('__FC.pack()') !== Math.floor(p / 20) || call('__FC.lvl()') !== p % 20) {
    stuck = 'pos@p' + p + '=' + call('__FC.pack()') + '-' + call('__FC.lvl()'); break;
  }
  if (!winCur()) { stuck = 'nowin@p' + p; break; }
  won.push(p + 1);
  if (p < 99) {
    if (call('__FC.nextHidden()')) { stuck = 'nonext@p' + p; break; }
    g.els['btn-next'].click();
  }
}
T('levels-complete', stuck === '' && won.length === 100, won.length + '/100 ' + stuck);
T('final-level-no-next', call('__FC.modal()') === true && call('__FC.nextHidden()') === true,
  'modal=' + call('__FC.modal()') + ' nextHidden=' + call('__FC.nextHidden()'));
T('progress-all-100', call('__FC.prog()').filter(k => !k.startsWith('daily')).length === 100,
  'n=' + call('__FC.prog()').length);

// ---- daily puzzle (real Date-seeded) via its real Daily button ----
g.els['btn-win-levels'].click(); g.pump(1);
g.els['btn-levels-back'].click(); g.pump(1);
g.els['btn-daily'].click();
T('daily-starts', call('__FC.daily()') === true && call('__FC.rows()') === 7 && call('__FC.ncol()') === 6,
  'r=' + call('__FC.rows()') + ' n=' + call('__FC.ncol()'));
T('daily-completes', winCur() === true && call('__FC.title()') === 'Daily Complete!' &&
  call('__FC.nextHidden()') === true && call('__FC.prog()').some(k => k.startsWith('daily-')),
  'title=' + call('__FC.title()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: won.length + '/100', stuck, secs: Math.round((Date.now() - t0) / 1000) } };
console.log('flow-connect: ' + won.length + '/100 levels + daily via real pointer strokes -> engine checkWin: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
