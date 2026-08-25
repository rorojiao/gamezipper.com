#!/usr/bin/env node
/* jigpic-solitaire verifier — all 30 levels solved through the engine's real input
 * path: real canvas pointerdown taps (engine pointer handler -> rect-scaled coords
 * -> handleTap select+swap) executing the provably-minimal swap sequence (cycle
 * decomposition, n - #cycles), driving each level to the engine's OWN win check
 * (gameLoop -> checkSolved -> onWin -> progress save + 800ms win overlay).
 * Hint/undo/restart probes, tier achievements, level select, daily challenge and
 * the quit-midway-daily state-leak regression all through real buttons.
 *
 * Bugs fixed in index.html before this run (verified reproducible pre-fix):
 *  P0 onWin: first completion of any level threw TypeError (S.progress[lvKey]
 *     dereferenced before creation) inside the rAF loop — win never registered,
 *     overlay never shown, game unwinnable from a fresh save.
 *  P1 startLevel never cleared S.isDaily — quitting a daily mid-level routed the
 *     next regular win down the daily branch (progress lost, +3 phantom stars). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('jigpic-solitaire', { inject: {
  anchor: '// ==================== UTILITIES ====================',
  exports: `
globalThis.__win = null;
var __oW2 = onWin;
onWin = function(){ globalThis.__win = { lvl: S.levelIdx + 1, daily: !!S.isDaily, moves: S.moves,
  solvedTiles: S.tiles.every(function(v, i){ return v === i; }) }; return __oW2.apply(this, arguments); };
renderGame = function(){}; // draw-only (procedural gradients/particles) — stubbed to keep the rAF loop cheap; no game logic
globalThis.__JP = {
  n: function(){ return LEVELS.length; },
  lv: function(i){ return { grid: LEVELS[i].grid, tiles: LEVELS[i].tiles.slice(), par: LEVELS[i].par, optimal: LEVELS[i].optimal, level: LEVELS[i].level }; },
  st: function(){ return { lvl: S.levelIdx, grid: S.grid, tiles: S.tiles.slice(), sel: S.selected, moves: S.moves,
    hints: S.hintsLeft, undo: S.undoStack.length, solved: S.solved, daily: !!S.isDaily, screen: S.screen,
    hintPair: S.hintPair ? S.hintPair.slice() : null, done: S.completedCount, stars: S.totalStars, dailyDone: S.dailyDone }; },
  geo: function(){ var r = S.canvas.getBoundingClientRect(); return { cw: S.canvas.width, ch: S.canvas.height, rw: r.width, rh: r.height, ts: S.tileSize }; },
  prog: function(){ return JSON.parse(JSON.stringify(S.progress)); },
  ach: function(){ return JSON.parse(JSON.stringify(S.achievements)); },
  save: function(){ return JSON.parse(localStorage.getItem('jigpic_save') || 'null'); },
  cards: function(){ var out = []; var c = document.getElementById('tier-sections');
    var walk = function(el){ for (var i = 0; i < el.children.length; i++){ var ch = el.children[i];
      if (String(ch.className).indexOf('level-card') >= 0 || ch.classList.contains('level-card'))
        out.push({ completed: ch.classList.contains('completed'), locked: ch.classList.contains('locked') }); walk(ch); } };
    walk(c); return out; },
};`
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game-canvas'];
const T0 = Date.now();

// ---------- boot + level data integrity ----------
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-30', C('__JP.n()') === 30, 'n=' + C('__JP.n()'));
const LV = [];
for (let i = 0; i < 30; i++) LV.push(C('__JP.lv(' + i + ')'));
function optimalSwaps(t0) { // minimal transpositions: greedy cycle closing = n - #cycles
  const t = t0.slice(); const out = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] === i) continue;
    const j = t.indexOf(i);
    out.push([i, j]);
    const tmp = t[i]; t[i] = t[j]; t[j] = tmp;
  }
  return out;
}
let integ = [];
LV.forEach((l, i) => {
  const n = l.grid * l.grid;
  if (l.tiles.length !== n) integ.push('L' + (i + 1) + ':len');
  const sorted = l.tiles.slice().sort((a, b) => a - b);
  if (sorted.some((v, k) => v !== k)) integ.push('L' + (i + 1) + ':not-permutation');
  if (l.grid < 3 || l.grid > 6) integ.push('L' + (i + 1) + ':grid' + l.grid);
  const opt = optimalSwaps(l.tiles).length;
  if (opt !== l.optimal) integ.push('L' + (i + 1) + ':optimal' + l.optimal + '!=' + opt);
  if (l.par < opt) integ.push('L' + (i + 1) + ':par<optimal');
});
T('level-data-integrity', integ.length === 0, integ.join(',').slice(0, 150));

// ---------- first-visit tutorial -> menu -> level 1 (real buttons) ----------
T('first-visit-tutorial', C('__JP.st().screen') === 'tutorial', 'screen=' + C('__JP.st().screen'));
g.els['btn-tutorial-done'].click(); g.pump(2);
T('menu-after-tutorial', C('__JP.st().screen') === 'menu', 'screen=' + C('__JP.st().screen'));
g.els['btn-play'].click(); g.pump(4);
T('play-starts-l1', C('__JP.st().lvl') === 0 && C('__JP.st().screen') === 'game' && C('__JP.st().moves') === 0,
  'lvl=' + C('__JP.st().lvl') + ' screen=' + C('__JP.st().screen'));

// ---------- real taps (engine's own rect-scaled pointer math, inverted exactly) ----------
function tap(pos) {
  const st = C('__JP.st()'); const geo = C('__JP.geo()');
  const col = pos % st.grid, row = Math.floor(pos / st.grid);
  const ex = (col + 0.5) * geo.ts, ey = (row + 0.5) * geo.ts;
  cv.dispatch('pointerdown', { clientX: ex * geo.rw / geo.cw, clientY: ey * geo.rh / geo.ch, pointerId: 1, button: 0, preventDefault() {} });
}
function solveLive() { // minimal swaps on LIVE engine state, each swap = 2 real taps
  const swaps = optimalSwaps(C('__JP.st().tiles'));
  for (const [a, b] of swaps) { tap(a); tap(b); }
  return swaps.length;
}
function pumpWin() { g.pump(3); g.pump(70); } // rAF checkSolved -> onWin -> 800ms overlay timer

// ---------- hint probe (real Hint button, engine's random pick is seeded) ----------
g.els['btn-hint'].click(); g.pump(2);
let st = C('__JP.st()');
const hp = st.hintPair;
T('hint-consumed', st.hints === 2 && hp && hp.length === 2, 'hints=' + st.hints + ' pair=' + JSON.stringify(hp));
if (hp) {
  const tiles = C('__JP.st().tiles');
  const pick = hp[0], partner = hp[1];
  T('hint-pair-valid', tiles[pick] !== pick && tiles[partner] === pick,
    'tiles[' + partner + ']=' + tiles[partner] + ' pick=' + pick);
}

// ---------- level 1: optimal solve via real taps -> engine's own win ----------
C('__win = null');
const opt1 = solveLive();
pumpWin();
let w = C('__win');
let prog = C('__JP.prog()');
T('level-1-optimal', opt1 === LV[0].optimal, 'swaps=' + opt1 + '/' + LV[0].optimal);
T('level-1-won', w && w.lvl === 1 && !w.daily && w.solvedTiles && prog['0'] && prog['0'].stars === 3 && prog['0'].bestMoves === opt1,
  'win=' + JSON.stringify(w) + ' prog=' + JSON.stringify(prog['0']));
T('l1-overlay-shown', !g.els['overlay-win'].classList.contains('hidden'), 'overlay still hidden');
T('stat-moves-dom', String(g.els['stat-moves'].textContent) === String(opt1), 'stat=' + g.els['stat-moves'].textContent);
T('ach-first', C('__JP.ach().first') === true && C('__JP.ach().perfect3') === true, JSON.stringify(C('__JP.ach()')));
T('l1-progress-counted', C('__JP.st().done') === 1 && C('__JP.st().stars') === 3, 'done=' + C('__JP.st().done') + ' stars=' + C('__JP.st().stars'));

// ---------- level 2: undo + restart probes (real buttons), then win ----------
g.els['btn-win-next'].click(); g.pump(4);
T('next-loads-2', C('__JP.st().lvl') === 1 && C('__JP.st().moves') === 0, 'lvl=' + C('__JP.st().lvl'));
const scramble2 = C('__JP.lv(1).tiles');
tap(0); tap(2); // one deliberate swap
let st2 = C('__JP.st()');
T('swap-counted', st2.moves === 1 && st2.undo === 1, 'moves=' + st2.moves + ' undo=' + st2.undo);
g.els['btn-undo'].click(); g.pump(2);
st2 = C('__JP.st()');
T('undo-restores', JSON.stringify(st2.tiles) === JSON.stringify(scramble2) && st2.moves === 2 && st2.undo === 0,
  'moves=' + st2.moves); // undo counts as a move by design
g.els['btn-restart'].click(); g.pump(2);
st2 = C('__JP.st()');
T('restart-works', JSON.stringify(st2.tiles) === JSON.stringify(scramble2) && st2.moves === 0 && st2.hints === 3, 'moves=' + st2.moves);
C('__win = null');
const opt2 = solveLive();
pumpWin();
w = C('__win'); prog = C('__JP.prog()');
T('level-2-won', w && w.lvl === 2 && prog['1'] && prog['1'].stars === 3 && w.moves === opt2,
  'win=' + JSON.stringify(w) + ' prog=' + JSON.stringify(prog['1']));

// ---------- levels 3..30 chained through the real Next Level button ----------
const chain = ['1', '2'];
for (let id = 3; id <= 30; id++) {
  if (Date.now() > T0 + 100000) { chain.push(id + ':deadline'); T('level-' + id + '-won', false, 'deadline'); break; }
  g.els['btn-win-next'].click(); g.pump(4);
  if (C('__JP.st().lvl') !== id - 1) { chain.push(id + ':bad-load'); T('level-' + id + '-won', false, 'lvl=' + C('__JP.st().lvl')); break; }
  C('__win = null');
  const used = solveLive();
  pumpWin();
  w = C('__win'); prog = C('__JP.prog()');
  const ok = w && w.lvl === id && prog[String(id - 1)] && prog[String(id - 1)].stars === 3 && w.moves === LV[id - 1].optimal;
  chain.push(ok ? '' + id : id + ':w' + JSON.stringify(w));
  T('level-' + id + '-won', ok, 'win=' + JSON.stringify(w) + ' prog=' + JSON.stringify(prog[String(id - 1)]));
  if (id === 5) T('ach-streak5', C('__JP.ach().streak5') === true, 'streak5=' + C('__JP.ach().streak5'));
  if (id === 6) T('ach-tier1', C('__JP.ach().tier1') === true, 'tier1=' + C('__JP.ach().tier1'));
  if (id === 12) T('ach-tier2', C('__JP.ach().tier2') === true, 'tier2=' + C('__JP.ach().tier2'));
  if (id === 18) T('ach-tier3', C('__JP.ach().tier3') === true, 'tier3=' + C('__JP.ach().tier3'));
  if (id === 24) T('ach-tier4', C('__JP.ach().tier4') === true, 'tier4=' + C('__JP.ach().tier4'));
  if (!ok) break;
}
T('all-30-levels', chain.length === 30 && chain.every(x => !x.includes(':')),
  chain.filter(x => x.includes(':')).join(',').slice(0, 200) || 'all');

// ---------- after the last win: Next goes to menu; progress persisted ----------
g.els['btn-win-next'].click(); g.pump(4);
T('last-next-menu', C('__JP.st().screen') === 'menu', 'screen=' + C('__JP.st().screen'));
const achAll = C('__JP.ach()');
T('ach-tier5-all30', achAll.tier5 === true && achAll.all30 === true, JSON.stringify(achAll));
const sv = C('__JP.save()');
T('progress-persisted', sv && Object.keys(sv.progress).length === 30 && sv.completedCount === 30 && sv.totalStars === 90,
  'keys=' + (sv ? Object.keys(sv.progress).length : 0) + ' done=' + (sv && sv.completedCount) + ' stars=' + (sv && sv.totalStars));

// ---------- level select (real bottom-nav button) ----------
C("document.querySelectorAll('.nav-btn')[1].click()"); g.pump(2);
T('level-select-open', C('__JP.st().screen') === 'levels', 'screen=' + C('__JP.st().screen'));
const cardsInfo = C('__JP.cards()');
T('level-select-complete', cardsInfo.length === 30 && cardsInfo.every(c => c.completed) && cardsInfo.every(c => !c.locked),
  'n=' + cardsInfo.length + ' locked=' + cardsInfo.filter(c => c.locked).length);

// ---------- P1 regression: quit midway through a daily, next regular win must stay regular ----------
g.els['btn-daily'].click(); g.pump(2);
T('daily-overlay', !g.els['overlay-daily'].classList.contains('hidden'), 'daily overlay hidden');
g.els['btn-daily-start'].click(); g.pump(4);
st = C('__JP.st()');
T('daily-started', st.daily === true && st.grid === 5, 'daily=' + st.daily + ' grid=' + st.grid);
tap(0); tap(1); // one swap, then quit without winning (the old leak scenario)
g.els['btn-quit'].click(); g.pump(2);
T('quit-to-menu', C('__JP.st().screen') === 'menu' && C('__JP.st().dailyDone') === false, 'screen=' + C('__JP.st().screen'));
g.els['btn-play'].click(); g.pump(4); // all completed -> replays level 1
C('__win = null');
solveLive();
pumpWin();
w = C('__win');
T('daily-leak-fixed', w && w.daily === false && w.lvl === 1 && C('__JP.st().dailyDone') === false && C('__JP.prog()[\'0\'].stars') === 3,
  'win=' + JSON.stringify(w) + ' dailyDone=' + C('__JP.st().dailyDone'));
g.els['btn-win-next'].click(); g.pump(4); // advance to L2 so replay doesn't disturb further checks

// ---------- real daily challenge: solve -> +3 bonus stars ----------
g.els['btn-daily'].click(); g.pump(2);
g.els['btn-daily-start'].click(); g.pump(4);
const dTiles = C('__JP.st().tiles');
T('daily-unsolved-start', dTiles.some((v, i) => v !== i) && dTiles.length === 25, 'n=' + dTiles.length);
C('__win = null');
const dOpt = solveLive();
pumpWin();
w = C('__win');
T('daily-won', w && w.daily === true && w.solvedTiles && g.els['win-stats'].textContent.indexOf('Daily') >= 0,
  'win=' + JSON.stringify(w) + ' stats=' + g.els['win-stats'].textContent);
T('daily-persisted', C('__JP.st().dailyDone') === true && C('__JP.ach().daily1') === true && C('__JP.st().stars') === 93,
  'done=' + C('__JP.st().dailyDone') + ' ach=' + C('__JP.ach().daily1') + ' stars=' + C('__JP.st().stars'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const wonN = chain.filter(x => !x.includes(':')).length;
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: wonN + '/30', durS: Math.round((Date.now() - T0) / 1000),
    notes: 'P0 fixed in onWin (first-completion TypeError — game was unwinnable from fresh save, reproduced pre-fix via real taps: solved L1 in 3 moves, progress stayed {}, raf error "Cannot set properties of undefined (setting stars)"); ' +
      'P1 fixed in startLevel (S.isDaily leak after quitting a daily mid-level — next regular win was misrouted to the daily branch); ' +
      'all levels solved in provably-minimal swaps (n-cycles, verified === level.optimal data) -> 3 stars x30 = 90 + daily bonus 3; hint/undo/restart/tier achievements/level select/daily all exercised through real buttons' } };
console.log('jigpic-solitaire: ' + wonN + '/30 levels via real taps (minimal swaps): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
