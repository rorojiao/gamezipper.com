#!/usr/bin/env node
/* hidden-object verifier (type A): all 30 levels must be completed through the real input
 * path — canvas pointerdown taps at object coordinates (the engine's own handleCanvasClick
 * hit test: dist <= obj.size+10). Complete/star/unlock/achievement/save logic all fire from
 * the engine's own checkLevelComplete(). Also exercises: the daily-puzzle dialog (real
 * daily-start-btn click, which after the P1 fix calls startDailyPuzzle), level-select card
 * click, wrong click (combo reset), pause/resume (timer frozen while paused), hint (3->2,
 * flash interval runs out), timeout modal -> restartLevel, quit-to-menu, all-complete modal,
 * and save persistence including the carried-through daily marker. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('hidden-object', {
  inject: {
    anchor: 'function startLevel(idx){',
    exports: `globalThis.__R = {
      st: () => gameState, lv: () => currentLevel, n: () => LEVELS.length,
      score: () => score, found: () => foundCount, wrong: () => wrongClicks, hints: () => hintsLeft,
      foundList: () => foundObjects.slice(),
      objs: () => LEVELS[currentLevel].objects.map(function(o){ return { x: o.x, y: o.y, size: o.size, name: o.name }; }),
      stars: (i) => LEVELS[i].stars, best: (i) => LEVELS[i].bestScore,
      unlocked: (i) => !!LEVELS[i].unlocked, unlockedN: () => { var c = 0; for (var i = 0; i < 30; i++) if (LEVELS[i].unlocked) c++; return c; },
      timeLeft: () => timeLeft, lvlTimer: () => LEVELS[currentLevel].timer,
      ach: () => Object.keys(achievementData),
      paused: () => isPaused,
      cvs: () => canvas,
      daily: () => { try { var d = JSON.parse(localStorage.getItem('hoz_v1')); return d ? (d.daily || null) : null; } catch (e) { return 'err'; } },
      ls: () => { try { return localStorage.getItem('hoz_v1'); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));
T('levels-exist', g.call('__R.n()') === 30, 'n=' + g.call('__R.n()'));

const cv = g.call('__R.cvs()');
// exact inverse of the engine's handleCanvasClick: cx=(clientX-rect.left)*CW/rect.width
const rect = () => cv.getBoundingClientRect();
const tapGame = (gx, gy) => cv.dispatch('pointerdown', {
  clientX: rect().left + gx * rect().width / 800, clientY: rect().top + gy * rect().height / 600,
  pointerId: 7, button: 0, isPrimary: true, preventDefault() {},
});
const st = () => g.call('__R.st()');
const modal = (id) => g.els[id].classList.contains('show');

// ---------- daily puzzle dialog: real button click must start the seeded level ----------
T('menu-state', st() === 'menu', 'st=' + st());
g.call('showDailyPuzzle()');
T('daily-modal-opens', modal('daily-modal'), 'modal hidden');
g.els['daily-start-btn'].click(); // threw ReferenceError startDaily before the P1 fix
T('daily-starts-level', st() === 'playing' && g.call('__R.lv()') >= 0 && g.call('__R.lv()') < 30,
  'st=' + st() + ' lv=' + g.call('__R.lv()'));
T('daily-marker-saved', (() => { const d = g.call('__R.daily()'); return d && d.done === true && typeof d.level === 'number'; })(),
  'daily=' + JSON.stringify(g.call('__R.daily()')));
g.call('quitToMenu()');
T('quit-to-menu', st() === 'menu' && !modal('daily-modal'), 'st=' + st());

// ---------- level select: real card click starts L1 ----------
g.call('showLevelSelect()');
g.els['levels-grid'].children[0].click();
T('card1-starts-L1', st() === 'playing' && g.call('__R.lv()') === 0, 'st=' + st() + ' lv=' + g.call('__R.lv()'));

// ---------- wrong click: combo/score stay 0 ----------
function emptySpot() { // a coordinate that hits no object (engine only hit-tests lvl.objects)
  const objs = g.call('__R.objs()');
  for (let y = 20; y < 600; y += 17) for (let x = 20; x < 800; x += 23) {
    if (objs.every(o => Math.hypot(x - o.x, y - o.y) > o.size + 14)) return { x, y };
  }
  return { x: -50, y: -50 };
}
{
  const e = emptySpot();
  tapGame(e.x, e.y);
  T('wrong-click-counted', g.call('__R.wrong()') === 1 && g.call('__R.score()') === 0 && g.call('__R.found()') === 0,
    'wrong=' + g.call('__R.wrong()') + ' score=' + g.call('__R.score()'));
}

// ---------- pause freezes the timer; resume continues ----------
{
  g.call('pauseGame()');
  T('pause-opens-modal', g.call('__R.paused()') === true && modal('pause-modal'), 'paused=' + g.call('__R.paused()'));
  const before = g.call('__R.timeLeft()');
  g.pump(20);
  T('timer-frozen-paused', Math.abs(g.call('__R.timeLeft()') - before) < 0.001, 't=' + g.call('__R.timeLeft()') + '/' + before);
  g.call('resumeGame()');
  T('resume-works', g.call('__R.paused()') === false && !modal('pause-modal'), 'resume');
}

// ---------- hint: 3 -> 2, flash runs out via its own 200ms interval ----------
g.els['hint-btn'].click();
T('hint-used', g.call('__R.hints()') === 2 && g.els['hint-btn'].textContent.indexOf('2') >= 0, 'hints=' + g.call('__R.hints()'));
g.pump(80); // 6 flashes x 200ms
T('hint-flash-ends', g.call('__R.hints()') === 2, 'hints=' + g.call('__R.hints()'));

// ---------- solve L1: tap every object at its data coordinate ----------
function solveHere() {
  const objs = g.call('__R.objs()');
  for (const o of objs) tapGame(o.x, o.y);
  return g.call('__R.found()') === objs.length && modal('complete-modal');
}
T('L1-complete', solveHere(), 'found=' + g.call('__R.found()') + '/' + g.call('__R.objs()').length);
T('L1-3stars', g.call('__R.stars(0)') === 3, 'stars=' + g.call('__R.stars(0)'));
T('L2-unlocked', g.call('__R.unlocked(1)') === true, 'locked');
T('ach-first-find', g.call('__R.ach()').indexOf('first_find') >= 0, JSON.stringify(g.call('__R.ach()')));
T('ach-speed-demon', g.call('__R.ach()').indexOf('speed_demon') >= 0, 'no speed_demon');

// ---------- chain L2..L30 through the win modal's Next Level button ----------
const solved = [1]; const notes = [];
const T0 = Date.now();
for (let li = 1; li < 30 && Date.now() - T0 < 90000; li++) {
  g.call('nextLevel()'); // the Next Level button's own handler
  if (g.call('__R.lv()') !== li || st() !== 'playing') { notes.push('chain broken at L' + (li + 1)); fails.push('chain broken at L' + (li + 1)); break; }
  if (!solveHere()) { notes.push('L' + (li + 1) + ' found=' + g.call('__R.found()') + '/' + g.call('__R.objs()').length); fails.push('L' + (li + 1) + ' not completed'); break; }
  if (g.call(`__R.stars(${li})`) !== 3) { notes.push('L' + (li + 1) + ' stars=' + g.call(`__R.stars(${li})`)); }
  solved.push(li + 1);
  if (li === 29) { /* loop guard */ }
}
T('all-30-solved', solved.length === 30, 'solved=' + solved.length + '/30 ' + notes.slice(0, 4).join('|'));
g.call('nextLevel()'); // from L30 -> showAllComplete
T('all-complete-modal', modal('all-complete-modal'), 'modal missing');
const ach = g.call('__R.ach()');
T('ach-10-of-10', ach.length === 10, 'ach=' + ach.length + ':' + ach.join(','));
T('ach-combo-master', ach.indexOf('combo_master') >= 0, 'no combo_master (10x on a 10-object level)');
T('ach-master-detective', ach.indexOf('master_detective') >= 0, 'no master_detective');
T('ach-perfect-eye', ach.indexOf('perfect_eye') >= 0 && ach.indexOf('hint_free') >= 0, 'clean-run achievements missing');

// ---------- persistence: 30 unlocked, 90 stars, daily marker survived every save ----------
T('save-persisted', (() => {
  const d = JSON.parse(g.call('__R.ls()') || '{}');
  let stars = 0, unl = 0;
  (d.levels || []).forEach(l => { stars += l.stars || 0; if (l.unlocked) unl++; });
  const daily = g.call('__R.daily()');
  return d.v === 1 && (d.levels || []).length === 30 && unl === 30 && stars === 90 &&
    (d.ach ? Object.keys(d.ach).length : 0) === 10 && daily && daily.done === true;
})(), 'ls=' + String(g.call('__R.ls()')).slice(0, 100) + ' daily=' + JSON.stringify(g.call('__R.daily()')));

// ---------- timeout path: let the clock run out on a replay, then restart ----------
g.call('closeModal(\'all-complete-modal\')');
g.call('showLevelSelect()');
g.els['levels-grid'].children[0].click(); // replay L1 (real card click)
{
  let frames = 0;
  while (!modal('timeout-modal') && frames < 9500) { g.pump(30); frames += 30; }
  T('timeout-modal-opens', modal('timeout-modal'), 'frames=' + frames + ' t=' + g.call('__R.timeLeft()'));
  g.call('restartLevel()'); // the Try Again button's own handler
  T('restart-works', st() === 'playing' && Math.abs(g.call('__R.timeLeft()') - g.call('__R.lvlTimer()')) < 0.01 && !modal('timeout-modal'),
    'st=' + st() + ' t=' + g.call('__R.timeLeft()'));
  g.call('quitToMenu()');
  T('quit-again', st() === 'menu', 'st=' + st());
}

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/30', achievements: g.call('__R.ach()').length + '/10', notes: notes.slice(0, 6) } };
console.log('hidden-object: ' + solved.length + '/30 levels found via real canvas clicks: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
