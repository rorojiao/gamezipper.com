#!/usr/bin/env node
/* threes verifier — endless 4x4 merge puzzle (type B/C: scripted real-input play).
 * Every move goes through the REAL input paths: document keydown listeners ->
 * doMove -> slideRowLeft merges (the engine's own rules: 1+2=3, then n+n) ->
 * score/spawn -> the engine's own canMove game-over detection -> game-over
 * overlay -> Play Again -> newGame. Also the real canvas pointer-swipe path and
 * the real Undo button (prevState restore). Seeded rng (424242) makes the run
 * deterministic. Corner-strategy bot (down/left/right/up priority) plays until
 * the engine declares game over itself.
 * Engine P0 found & fixed (see index.html FIX comment): slideRowLeft read .v off
 * the numeric rows every caller passes — all tiles collapsed to v=undefined,
 * merges never matched, score stayed 0 forever (game shipped unplayable). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('threes', { inject: {
  anchor: 'function doMove(dir){',
  exports: `globalThis.__TH = {
    g: () => grid.map(r => r.map(c => c ? c.v : 0)),
    score: () => score, moves: () => moveNum, merges: () => sessionMerges,
    over: () => gameOver, hi: () => highestTile(), can: () => canMove(),
    next: () => nextTile,
    go: () => document.getElementById('gameOverOverlay').classList.contains('active'),
    tut: () => document.getElementById('tutorialOverlay').classList.contains('active'),
  };`,
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const call = (e) => g.call(e);
const key = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));

// first visit shows the tutorial; the real Got It button closes it
T('tutorial-on-first-visit', call('__TH.tut()') === true, 'tut hidden on boot');
g.els['btnCloseTutorial'].click();
T('tutorial-closes', call('__TH.tut()') === false, 'still active');

// real keydown moves (engine's own doMove path)
const m0 = call('__TH.moves()');
key('ArrowLeft'); key('ArrowDown');
T('key-input-moves', call('__TH.moves()') === m0 + 2, 'moves=' + call('__TH.moves()'));

// real pointer-swipe path: pointerdown/up pair on the canvas (|dx|or|dy|>25 -> doMove)
const ms = call('__TH.moves()');
const cv = g.els['gameCanvas'];
let swiped = false;
for (const [x0, y0, x1, y1] of [[100, 100, 100, 170], [100, 100, 170, 100], [100, 100, 30, 100], [100, 100, 100, 30]]) {
  g.pump(10); // advance the engine's DEBOUNCE_MS clock past the last key move
  cv.dispatch('pointerdown', { clientX: x0, clientY: y0 });
  cv.dispatch('pointerup', { clientX: x1, clientY: y1 });
  if (call('__TH.moves()') > ms) { swiped = true; break; }
}
T('swipe-input-moves', swiped, 'moves=' + call('__TH.moves()'));

// real Undo button: one moving key, then prevState restore puts the exact grid+score back
const preG = JSON.stringify(call('__TH.g()')), preS = call('__TH.score()'), preM = call('__TH.moves()');
for (const k of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
  key(k);
  if (call('__TH.moves()') > preM) break;
}
g.els['btnUndo'].click();
T('undo-restores', JSON.stringify(call('__TH.g()')) === preG && call('__TH.score()') === preS,
  'grid/score after undo');

// strategy play: down/left/right/up priority until the engine itself ends the game
const seq = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'];
const t0 = Date.now();
let i = 0, guard = 0;
while (!call('__TH.over()') && guard++ < 1200 && Date.now() - t0 < 45000) key(seq[i++ % 4]);
const moves = call('__TH.moves()'), score = call('__TH.score()'), hi = call('__TH.hi()'), merges = call('__TH.merges()');
T('game-plays', moves >= 30 && guard < 1200, 'moves=' + moves + ' guard=' + guard);
T('merges-work', merges >= 10 && score >= 50, 'merges=' + merges + ' score=' + score);
T('merge-chain', hi >= 12, 'highest tile=' + hi); // 12 proves 1+2 -> 3 -> 6 -> 12 chain
T('natural-game-over', call('__TH.over()') === true && call('__TH.can()') === false, 'over=' + call('__TH.over()'));
g.pump(35); // 400ms game-over overlay reveal timer
T('gameover-overlay', call('__TH.go()') === true, 'overlay hidden');

// real Play Again button -> newGame resets everything
g.els['btnRetry'].click(); g.pump(2);
T('play-again-resets', call('__TH.moves()') === 0 && call('__TH.score()') === 0 && call('__TH.over()') === false,
  'moves=' + call('__TH.moves()') + ' score=' + call('__TH.score()'));

// a second full game must also merge (fix holds beyond one seed run)
let j = 0, gd = 0;
while (!call('__TH.over()') && gd++ < 1200) key(seq[j++ % 4]);
T('second-game-merges', call('__TH.merges()') > 0 && call('__TH.hi()') >= 6, 'merges=' + call('__TH.merges()'));

// engine's own persistence (written on game over)
const sv = JSON.parse(g.ls.getItem('threes_save_v2') || '{}');
T('save-written', sv && sv.stats && sv.stats.games >= 1 && sv.stats.bestTile >= 12 && sv.best >= 100,
  'save=' + JSON.stringify(sv).slice(0, 60));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { score, highest: hi, merges, moves } };
console.log('threes: real keys+swipes -> engine merges/score/game-over: ' + out.verdict + ' (score ' + score + ', best tile ' + hi + ')');
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
