#!/usr/bin/env node
/* tidy-up-3d verifier — A-type: all 30 levels completed through the engine's REAL input path
 * (canvas pointerdown -> handlePointer -> ui.handleClick). The bot mirrors what a player does:
 * tap an item to SELECT it, tap a ZONE to place it; the engine's own checkMatches() pops each
 * 3rd same-type item and its own levelComplete() fires the complete screen; NEXT advances via
 * the real complete-screen button. Level 1's "tap anywhere to start" tutorial is dismissed with
 * a real tap. Win detection is always the engine's own state.screen==='complete'.
 * Harness notes: the engine throttles pointerdowns to one per 200ms of VIRTUAL time
 * (lastClickTime gate), so every tap pumps 13 frames (216.7ms); the 500ms levelComplete
 * setTimeout is pumped through before asserting. Client coords are computed by inverting the
 * exact rect math handlePointer performs (rect read live from the harness canvas). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tidy-up-3d', { viewport: [1280, 720], inject: {
  anchor: 'let currentUI=createMenuScreen();',
  exports: `globalThis.__S = {
  scr: function(){ return state.screen },
  snap: function(){ return { scr: state.screen, lvl: game && game.level, timer: game && +game.timer.toFixed(1),
    gstate: game && game.state, done: game ? game.items.filter(function(i){return i.zoneIndex<0}).length : -1,
    zoneLeft: game ? game.zones.reduce(function(a,z){return a+z.items.length},0) : -1,
    items: game ? game.items.map(function(i){return {x:i.x,y:i.y,s:i.size,z:i.zoneIndex,n:i.item.name}}) : [],
    zones: game ? game.zones.map(function(z){return {x:z.x,y:z.y,w:z.w,h:z.h}}) : [],
    score: game && game.score, stars: state.completedStars } },
  start: function(n){ startGame(n) },
  tut: function(){ return game ? game.tutorialShown : null },
};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const cv = g.els.gameCanvas;
const rect = () => cv.getBoundingClientRect();
const tap = (x, y) => { // canvas-space (1280x720) -> client coords via the inverse of handlePointer's rect math
  g.pump(13); // ensure >200ms virtual since the last accepted click (sandbox clock starts at 0)
  const r = rect();
  cv.dispatch('pointerdown', { type: 'pointerdown', clientX: r.left + x * (r.width / 1280), clientY: r.top + y * (r.height / 720), pointerId: 1, button: 0, preventDefault() {} });
  g.pump(13);
};
const snap = () => g.call('__S.snap()');

g.pump(3);
T('menu-screen', g.call('__S.scr()') === 'menu', 'scr=' + g.call('__S.scr()'));
tap(640, 264); // menu PLAY (button row 0 center: y 240..288)
g.pump(3);
let s = snap();
T('level1-started', s.scr === 'game' && s.lvl === 1, 'scr=' + s.scr + ' lvl=' + s.lvl);
// level 1: real tap dismisses the tutorial overlay; it must NOT re-appear (regression test for the softlock)
tap(640, 360);
s = snap();
T('tutorial-dismissed', g.call('__S.tut()') === false, 'tut=' + g.call('__S.tut()'));
tap(640, 360);
T('tutorial-stays-dismissed', g.call('__S.tut()') === false && snap().scr === 'game', 'tut=' + g.call('__S.tut()') + ' scr=' + snap().scr);

const DEADLINE = Date.now() + 95000;
const won = []; let stuck = '';
for (let lvl = 1; lvl <= 30 && Date.now() < DEADLINE; lvl++) {
  s = snap();
  if (s.scr !== 'game') { stuck = 'L' + lvl + ' expected game screen, scr=' + s.scr; break; }
  // ---- play the board: one zone per item type, place items; the 3rd/6th/... of each type pops
  // zone assignment is computed ONCE from the full board (recomputing per move would shift a
  // type's zone once another type finishes, splitting it across zones so it never reaches 3)
  const allNames = {};
  s.items.forEach(it => { allNames[it.n] = 1; });
  const zoneOf = {};
  Object.keys(allNames).sort().forEach((n, k) => { zoneOf[n] = Math.min(k, s.zones.length - 1); });
  let guard = 0;
  for (;;) {
    s = snap();
    if (s.scr === 'complete') break;
    if (s.scr === 'gameover') { stuck = 'L' + lvl + ' TIME UP (timer=' + s.timer + ')'; break; }
    if (s.scr !== 'game') { stuck = 'L' + lvl + ' unexpected screen ' + s.scr; break; }
    if (++guard > 120) { stuck = 'L' + lvl + ' no progress (grid=' + s.done + ' zones=' + s.zoneLeft + ')'; break; }
    const grid = s.items.map((it, i) => ({ ...it, i })).filter(it => it.z < 0);
    if (grid.length === 0) { // everything placed; pop timers settle within a few taps of nothing -> pump
      g.pump(40); continue;
    }
    // group remaining grid items by type (zone map stays frozen from the full board above)
    const byType = {};
    grid.forEach(it => { (byType[it.n] = byType[it.n] || []).push(it); });
    const types = Object.keys(byType).sort();
    // pick the type with the most remaining first (keeps zones draining in 3s)
    let pick = null, bestN = -1;
    for (const n of types) if (byType[n].length > bestN) { bestN = byType[n].length; pick = n; }
    const item = byType[pick][0];
    const z = s.zones[zoneOf[pick]];
    if (process.env.DBG) console.error('L' + lvl, 'grid=' + grid.length, 'pick=' + pick, 'item@' + (item.x + item.s / 2).toFixed(0) + ',' + (item.y + item.s / 2).toFixed(0), 'zone' + zoneOf[pick] + '@' + (z.x + z.w / 2).toFixed(0) + ',' + (z.y + z.h / 2).toFixed(0), 't=' + s.timer);
    tap(item.x + item.s / 2, item.y + item.s / 2); // SELECT (real hit-test: dist < size/2+5)
    const sel = snap();
    const zc = { x: z.x + z.w / 2, y: z.y + z.h / 2 };
    tap(zc.x, zc.y); // PLACE -> moveItemToZone -> checkMatches (engine pops the 3rd same-type)
  }
  if (stuck) break;
  won.push(lvl);
  if (Date.now() > DEADLINE) break;
  // complete screen: NEXT (row1: x 545..735, y 440..490); L30 -> MENU (row2)
  if (lvl < 30) { tap(640, 465); } else { tap(850, 465); }
  g.pump(13);
}
T('levels-won', won.length === 30, won.length + '/30' + (won.length < 30 ? ' last=' + won[won.length - 1] + ' stuck@' + stuck : ''));
T('all-complete-screens', won.length === 30, stuck || 'ok');

// ---- save + achievements (engine's own persistence) ----
let savedStars = 0;
for (let i = 1; i <= 30; i++) savedStars += parseInt(g.ls.getItem('tidyup3d_v1_stars_' + i) || '0');
T('save-stars', savedStars >= 30, 'stars saved=' + savedStars);
const sv = JSON.parse(g.ls.getItem('tidyup3d_v1') || 'null');
T('save-persisted', !!sv && sv.version === 1 && Object.keys(sv.progress).length >= 30, 'progress=' + (sv ? Object.keys(sv.progress).length : 0));
const ach = JSON.parse(g.ls.getItem('tidyup3d_achievements') || '[]');
T('achievements-check', ach.includes('first_sort') && ach.includes('stars_30'), 'ach=' + ach.length + ' ' + ach.slice(0, 4).join(','));
T('coins-earned', parseInt(g.ls.getItem('tidyup3d_coins') || '0') >= 30 * 50, 'coins=' + g.ls.getItem('tidyup3d_coins'));
T('menu-after-30', g.call('__S.scr()') === 'menu', 'scr=' + g.call('__S.scr()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won.length + '/30', stars: savedStars, stuck: stuck || '' } };
console.log('tidy-up-3d: ' + won.length + '/30 levels via real select->zone taps to engine complete: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
