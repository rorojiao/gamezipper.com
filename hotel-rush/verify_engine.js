#!/usr/bin/env node
/* hotel-rush verifier (type A): all 30 levels must be completed through the real input path —
 * canvas pointerdown taps select queue guests / assign rooms / clean dirty rooms; HTML buttons
 * hire maid + receptionist and buy floors/speed (the exact bottombar buttons a player uses).
 * Serving, checkout, levelComplete stars, levelFail and saves all fire from the engine's own
 * update()/checkoutGuest()/checkLevelComplete(). Also exercises: tutorial skip, MANUAL room
 * cleaning before hiring the maid, a deliberately failed level (3 angry leaves -> levelFail
 * overlay -> Try Again retry), and save persistence. The bot reacts every ~0.5 virtual second.
 * Note: handleTap debounces taps with a 150ms real Date.now() window; the sandbox clock is
 * offset +160ms per call so consecutive taps land like real human taps. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('hotel-rush', {
  inject: {
    anchor: 'function startLevel(lvl) {',
    exports: `globalThis.__R = {
      st: () => G.state, lv: () => G.level, cash: () => G.cash,
      served: () => G.guestsServed, left: () => G.guestsLeft, target: () => LEVELS[G.level - 1].targetGuests,
      starsTotal: () => G.totalStars, starsOf: (l) => G.levelStars[l] || 0, starKeys: () => Object.keys(G.levelStars).length,
      queue: () => G.queue.map(function(q){ return { id: q.id, x: q.x, y: q.y }; }),
      selId: () => (G.selectedGuest ? G.selectedGuest.id : null),
      emptyRooms: function () { var out = []; for (var f = 0; f < G.floors.length; f++) for (var r = 0; r < G.floors[f].rooms.length; r++) { var rm = G.floors[f].rooms[r]; if (rm.state === 'empty') { var rc = getRoomRect(f, r); out.push({ f: f, r: r, cx: rc.x + rc.w / 2, cy: rc.y + rc.h / 2 }); } } return out; },
      dirtyRooms: function () { var out = []; for (var f = 0; f < G.floors.length; f++) for (var r = 0; r < G.floors[f].rooms.length; r++) { var rm = G.floors[f].rooms[r]; if (rm.state === 'dirty' || rm.state === 'cleaning') { var rc = getRoomRect(f, r); out.push({ f: f, r: r, st: rm.state, cx: rc.x + rc.w / 2, cy: rc.y + rc.h / 2 }); } } return out; },
      roomState: (f, r) => G.floors[f].rooms[r].state,
      floorsN: () => G.floors.length, maid: () => G.maidHired, rec: () => G.recHired, spd: () => G.speedLevel,
      costs: () => ({ floor: G.floorCost, rec: G.recCost, maid: G.maidCost, spd: G.spdCost }),
      cvs: () => canvas,
      ls: () => { try { return localStorage.getItem('hotelRushSave_v1'); } catch (e) { return null; } },
    };`,
  },
});

let pass = 0, fail = 0; const fails = [];
const realNow = Date.now.bind(Date); let fakeNow = realNow();
g.sandbox.Date.now = () => (fakeNow += 160); // tap debounce sees human-cadence gaps
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 140));

const cv = g.call('__R.cvs()');
const rect = () => cv.getBoundingClientRect();
const tapGame = (gx, gy) => cv.dispatch('pointerdown', {
  clientX: rect().left + gx * rect().width / cv.width, clientY: rect().top + gy * rect().height / cv.height,
  pointerId: 4, button: 0, isPrimary: true, preventDefault() {},
});
const st = () => g.call('__R.st()');

// --- start: menu -> Play -> tutorial overlay -> skip ---
T('menu-state', st() === 'menu', 'st=' + st());
g.els['btnStart'].click();
T('L1-starts', st() === 'playing' && g.call('__R.lv()') === 1, 'st=' + st() + ' lv=' + g.call('__R.lv()'));
T('tutorial-shows', !g.els['tutorialScreen'].classList.contains('hidden'), 'overlay hidden');
g.els['btnTutSkip'].click();
T('tutorial-skips', g.els['tutorialScreen'].classList.contains('hidden') && st() === 'playing', 'skip');

// --- deliberately fail L1: assign nobody, let 3 guests storm out ---
{
  let frames = 0;
  while (st() === 'playing' && frames < 6000) { g.pump(30); frames += 30; }
  T('L1-fails-on-leaves', st() === 'levelFail' && g.call('__R.left()') >= 3,
    'st=' + st() + ' left=' + g.call('__R.left()'));
  T('fail-overlay', !g.els['levelFail'].classList.contains('hidden'), 'hidden');
  g.els['btnRetry'].click();
  T('retry-recovers', st() === 'playing' && g.call('__R.served()') === 0 && g.call('__R.left()') === 0, 'retry');
}

// --- manual play on L1: assign by tapping guest then room; clean one room BY HAND ---
function manualAssign() {
  const q = g.call('__R.queue()');
  if (!q.length) return false;
  const emp = g.call('__R.emptyRooms()');
  if (!emp.length) return false;
  tapGame(q[0].x, q[0].y); // select the front (longest-waiting) guest
  tapGame(emp[0].cx, emp[0].cy); // assign to the first empty room
  return true;
}
{
  let assigned = false;
  for (let i = 0; i < 40 && !assigned; i++) { g.pump(10); assigned = manualAssign(); }
  T('manual-assign', assigned && g.call('__R.queue()').length >= 0 && g.call('__R.emptyRooms()').length < 3, 'assign');
  // pump until a room turns dirty, then clean it manually (no maid yet)
  let cleaned = false;
  for (let i = 0; i < 700 && !cleaned; i++) {
    g.pump(15);
    if (!assigned) assigned = manualAssign() || assigned;
    const dirty = g.call('__R.dirtyRooms()').filter(d => d.st === 'dirty');
    if (dirty.length) { tapGame(dirty[0].cx, dirty[0].cy); cleaned = true; }
  }
  T('manual-clean-starts', cleaned, 'no dirty room seen');
  let emptyAgain = false;
  for (let i = 0; i < 600 && !emptyAgain; i++) {
    g.pump(15);
    if (manualAssign()) assigned = true;
    emptyAgain = g.call('__R.dirtyRooms()').length === 0 && g.call('__R.served()') > 0;
  }
  T('manual-clean-finishes', emptyAgain, 'room stayed dirty; served=' + g.call('__R.served()'));
}

// --- generic level player: hire staff, assign while no receptionist, upgrade ---
function playLevel(li) {
  let guard = 0, fails_ = 0;
  while (st() === 'playing' && guard++ < 5000) {
    g.pump(30);
    const c = g.call('__R.costs()'), cash = g.call('__R.cash()');
    if (!g.call('__R.maid()') && cash >= c.maid) g.els['btnMaid'].click();
    if (!g.call('__R.rec()') && cash >= c.rec) g.els['btnReceptionist'].click();
    if (!g.call('__R.rec()')) manualAssign();
    if (g.call('__R.floorsN()') < 5 && cash > c.floor * 1.6) g.els['btnFloor'].click();
    if (g.call('__R.spd()') < 5 && cash > c.spd * 2.5) g.els['btnUpgrade'].click();
    if (st() === 'levelFail') { g.els['btnRetry'].click(); fails_++; if (fails_ > 3) return 'retries'; }
  }
  return st() === 'levelComplete' ? true : 'st=' + st();
}

{
  const res = playLevel(1); // finish L1 (already partly played manually)
  T('L1-complete', res === true, 'res=' + res);
  T('L1-3stars', g.call('__R.starsOf(1)') === 3, 'stars=' + g.call('__R.starsOf(1)'));
}

// --- chain L2..L30 through the win overlay's Next Level button ---
const solved = [], notes = [];
const T0 = realNow();
for (let li = 2; li <= 30 && realNow() - T0 < 92000; li++) {
  g.els['btnNextLevel'].click();
  if (g.call('__R.lv()') !== li || st() !== 'playing') { notes.push('chain broken at L' + li); fails.push('chain broken at L' + li); break; }
  const res = playLevel(li);
  if (res !== true) { notes.push('L' + li + ' ' + res); fails.push('L' + li + ' not completed (' + res + ')'); break; }
  T('L' + li + '-stars>=1', g.call(`__R.starsOf(${li})`) >= 1, 'stars=' + g.call(`__R.starsOf(${li})`));
  solved.push(li);
}
T('all-30-solved', solved.length === 29, 'solved=' + (solved.length + 1) + '/30 ' + notes.slice(0, 4).join('|'));
T('win-title', String(g.els['lcTitle'].textContent).indexOf('You Win') >= 0, 'title=' + g.els['lcTitle'].textContent);
T('total-stars', g.call('__R.starsTotal()') >= 30, 'stars=' + g.call('__R.starsTotal()'));

// --- persistence ---
T('save-persisted', (() => {
  const d = JSON.parse(g.call('__R.ls()') || '{}');
  return d.level === 30 && Object.keys(d.levelStars || {}).length === 30 && d.tutorialDone === true;
})(), 'ls=' + String(g.call('__R.ls()')).slice(0, 80));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 140));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: (solved.length + 1) + '/30', notes: notes.slice(0, 6) } };
console.log('hotel-rush: ' + (solved.length + 1) + '/30 levels completed via real taps: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
