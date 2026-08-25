#!/usr/bin/env node
/* schulte-table verifier — real input: canvas pointerdown at true grid-cell centers
 * (engine's own getCellAt hit-test), mode cards via selectMode (with a synthetic event,
 * like the inline onclick provides), size cards (real closures), START/tutorial, inline
 * buttons via window-exposed functions. Covers: classic 3x3 + 5x5 + 7x7 (49 cells,
 * speedDemon/eagleEye achievements), reverse 3x3 DESCENDING order (was P1: played
 * ascending like classic), letters 3x3 A..I (was P0: charCode-vs-1 compare = never
 * correct), colors 5x5 full color cycle + used-cell-is-wrong regression (was P0: froze
 * at target 5), wrong-tap error counting, results/record badge, best times persisted,
 * streak/totalGames, stats + achievements screen, playAgain, confirmExit, resetStats. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('schulte-table', { inject: {
  anchor: 'function initGame() {',
  exports: `window.__ST = { grid: () => grid, tgt: () => currentTarget, max: () => maxTarget,
    mode: () => selectedMode, size: () => selectedSize, st: () => gameState, errs: () => errorCount,
    off: () => ({ x: gridOffsetX, y: gridOffsetY, cs: cellSize }), data: () => gameData,
    used: () => usedColorCells, letter: (n) => letterFor(n) };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const t0 = Date.now();
const E = (id) => g.sandbox.document.getElementById(id);

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

g.call("showScreen('mode-select')");
g.sandbox.event = { currentTarget: { classList: { add() {}, remove() {} } } }; // inline onclick supplies `event`
const pickMode = (m) => { g.call("selectMode('" + m + "')"); g.pump(12); }; // 150ms screen switch
const pickSize = (sz) => {
  const cards = E('size-list').children; // renderSizeSelect order: SIZES [3,4,5,6,7]
  const card = cards[sz - 3];
  card.onclick(); g.pump(2);
};
const tapIdx = (idx) => {
  const o = g.call('__ST.off()'), sz = g.call('__ST.size()');
  E('game-canvas').dispatch('pointerdown', {
    clientX: o.x + (idx % sz) * o.cs + o.cs / 2,
    clientY: o.y + Math.floor(idx / sz) * o.cs + o.cs / 2, preventDefault() {} });
};
const solve = () => { // taps the correct next cell until complete; returns targets done
  let done = 0, guard = 0;
  while (g.call('__ST.st()') === 'playing' && guard++ < 200) {
    const grid = g.call('__ST.grid()'), mode = g.call('__ST.mode()'), tgt = g.call('__ST.tgt()'),
      used = mode === 'colors' ? g.call('Array.from(__ST.used())') : [];
    let want;
    if (mode === 'letters') { const L = g.call('__ST.letter(' + tgt + ')'); want = grid.indexOf(L); }
    else if (mode === 'colors') { want = grid.findIndex((v, i) => v === (tgt - 1) % 5 && !used.includes(i)); }
    else { want = grid.indexOf(tgt); }
    if (want < 0) return -1;
    tapIdx(want); g.pump(1); done++;
  }
  return g.call('__ST.st()') === 'complete' ? done : -1;
};
const startRun = (mode, size) => {
  g.call("showScreen('mode-select')");
  pickMode(mode);
  pickSize(size);
  g.call('startGame()'); g.pump(2);
  if ((E('tutorial-overlay').style.display || '') !== 'none' && E('tutorial-overlay').style.display !== 'none') {
    g.call('closeTutorial()'); g.pump(2); // first visit only
  }
};

// ---- classic 3x3 with one deliberate wrong tap ----
startRun('classic', 3);
T('classic-live', g.call('__ST.mode()') === 'classic' && g.call('__ST.size()') === 3 &&
  g.call('__ST.st()') === 'playing' && g.call('__ST.tgt()') === 1, 'tgt=' + g.call('__ST.tgt()'));
{
  const grid = g.call('__ST.grid()');
  const wrongIdx = grid.findIndex(v => v !== 1);
  const errs0 = g.call('__ST.errs()');
  tapIdx(wrongIdx); g.pump(1);
  T('wrong-tap-counted', g.call('__ST.errs()') === errs0 + 1 && g.call('__ST.tgt()') === 1,
    'errs=' + g.call('__ST.errs()'));
}
T('classic-3-done', solve() === 9, 'stuck');
T('results-shown', E('results-screen').classList.contains('active') &&
  E('new-record-badge').style.display !== 'none', 'record=' + E('new-record-badge').style.display);
T('errors-reported', Number(E('final-errors').textContent) === 1, E('final-errors').textContent);

// ---- reverse 3x3 must play N down to 1 (P1 regression) ----
startRun('reverse', 3);
T('reverse-starts-N', g.call('__ST.tgt()') === 9, 'tgt=' + g.call('__ST.tgt()'));
{
  let ok = true, note = '';
  for (let expect = 9; expect >= 1; expect--) {
    if (g.call('__ST.tgt()') !== expect) { ok = false; note = 'expected ' + expect + ' got ' + g.call('__ST.tgt()'); break; }
    const grid = g.call('__ST.grid()');
    tapIdx(grid.indexOf(expect)); g.pump(1);
  }
  T('reverse-descends', ok, note);
}
T('reverse-done', g.call('__ST.st()') === 'complete' && E('results-screen').classList.contains('active'),
  'st=' + g.call('__ST.st()'));

// ---- letters 3x3: A..I (P0 regression) ----
startRun('letters', 3);
T('letters-target-display', /Find:\s*A/.test(E('target-display').textContent || ''), E('target-display').textContent);
T('letters-done', solve() === 9, 'stuck at tgt=' + g.call('__ST.tgt()'));

// ---- colors 5x5: full 25-target cycle + used-cell-wrong (P0 regression) ----
startRun('colors', 5);
T('colors-display', /Find:\s*Red\s*\(1\/25\)/.test(E('target-display').textContent || ''), E('target-display').textContent);
{
  // consume the first red cell, then re-tap it at the next red target -> must count wrong
  const grid = g.call('__ST.grid()');
  const firstRed = grid.findIndex(v => v === 0);
  tapIdx(firstRed); g.pump(1); // target 1 was red
  while (g.call('__ST.tgt()') !== 6) { const gi = g.call('__ST.grid()'); const t = g.call('__ST.tgt()');
    const u = g.call('Array.from(__ST.used())');
    tapIdx(gi.findIndex((v, i) => v === (t - 1) % 5 && !u.includes(i))); g.pump(1); } // targets 2..5, next red at 6
  const errs0 = g.call('__ST.errs()');
  tapIdx(firstRed); g.pump(1); // used cell of the right color at target 6
  T('colors-used-cell-wrong', g.call('__ST.errs()') === errs0 + 1 && g.call('__ST.tgt()') === 6,
    'errs=' + g.call('__ST.errs()'));
}
T('colors-done', solve() === 20, 'remaining targets from 6'); // targets 1-5 consumed pre-check, 6..25 = 20 taps

// ---- classic 5x5 + 7x7 for achievements (virtual clock = instant times) ----
startRun('classic', 5);
T('classic-5-done', solve() === 25, 'stuck');
g.call('playAgain()'); g.pump(2);
T('play-again-restarts', g.call('__ST.st()') === 'playing' && g.call('__ST.tgt()') === 1, g.call('__ST.st()'));
T('classic-5-again', solve() === 25, 'stuck');
startRun('classic', 7);
T('classic-7-done', solve() === 49, 'stuck');
const d = g.call('__ST.data()');
T('achievements', d.achievements.speedDemon === true && d.achievements.eagleEye === true,
  JSON.stringify(d.achievements));
T('best-times', Object.keys(d.bestTimes).filter(k => /classic_5|reverse_3|letters_3|colors_5/.test(k)).length === 4,
  JSON.stringify(Object.keys(d.bestTimes)));
T('total-games', d.totalGames >= 6, 'games=' + d.totalGames);

// ---- confirmExit mid-game + stats screen + resetStats ----
startRun('classic', 3);
g.call('confirmExit()'); g.pump(2);
T('confirm-exit', E('mode-select-screen').classList.contains('active') && g.call('__ST.st()') === 'idle',
  g.call('__ST.st()'));
g.call("showScreen('stats')");
T('stats-screen', Number(E('stat-total').textContent) >= 6 && E('achievements-list').children.length >= 3,
  'total=' + E('stat-total').textContent + ' ach=' + E('achievements-list').children.length);
g.call('resetStats()'); g.pump(1);
T('reset-stats', g.ls.getItem('schulte_v1') && JSON.parse(g.ls.getItem('schulte_v1')).totalGames === 0,
  'after reset');

T('under-time-budget', (Date.now() - t0) / 1000 < 100, ((Date.now() - t0) / 1000).toFixed(1) + 's');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { modes: 'classic 3/5/7 + reverse(descending) + letters + colors', fixes: 'letters/colors P0 unwinnable, reverse P1 ascending',
    achievements: 'speedDemon+eagleEye', durS: +((Date.now() - t0) / 1000).toFixed(1) } };
console.log('schulte-table: all 4 modes x sizes via real taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
