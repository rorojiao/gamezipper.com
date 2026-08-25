#!/usr/bin/env node
/* merge-sweets verifier — A-type: all 25 levels completed through the engine's own logic.
 *
 * The bot plays every level with REAL canvas mouse input (the engine's only input path: mousedown/
 * mouseup on gameCanvas -> onPointerDown/Up): taps generators (energy-limited, 3s regen — the bot
 * waits for regen like a player), merges equal items pairwise by dragging cell->cell (tryMerge),
 * and fulfills orders by dragging an exact item onto its order slot (fulfillOrder). An order {c,l}
 * costs 2^l taps, so levels are energy/time-budget puzzles; the bot's recursive builder
 * (makeLevelL = two level L-1s merged) keeps grid footprint at depth+1 cells.
 * Win detection is always the engine's own winLevel (all orders fulfilled -> save + win screen).
 * Navigation uses the real buttons: Play, tutorial Skip, win-screen Next, upgrade-screen Continue. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('merge-sweets', { viewport: [1280, 800], inject: {
  anchor: 'var SAVE_KEY="ms_v2";',
  exports: `globalThis.__S={st:function(){return{
    screen:currentScreen,level:currentLevel,energy:energy,maxEnergy:maxEnergy,timeLeft:timeLeft,
    gens:generators.slice(),gensChains:generators.map(function(gi){return GENERATORS[gi].chain}),paused:paused,tutActive:tutActive,
    grid:grid.map(function(c){return c?{c:c.c,l:c.l}:null}),
    orders:activeOrders.map(function(o){return{c:o.c,l:o.l,fulfilled:o.fulfilled}}),
    cw:CW,ch:CH,gridX:GRID_X,gridY:GRID_Y,cell:CELL,orderW:ORDER_W,cols:COLS,rows:ROWS,
    saveLevel:save.level,stars:(function(){var s=0;for(var k in save.stars)s+=save.stars[k];return s})(),
    starKeys:Object.keys(save.stars).length,coins:save.coins,tutorialDone:save.tutorialDone}}};`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
g.pump(3);
const S = () => g.call('__S.st()');

// ---- real canvas mouse input ----
const cnv = () => g.els['gameCanvas'];
function mouse(type, x, y) { cnv().dispatch(type, { clientX: x + (cnv().getBoundingClientRect().left || 0), clientY: y + (cnv().getBoundingClientRect().top || 0), preventDefault() {} }); }
const cellXY = (st, c, r) => ({ x: st.gridX + c * st.cell + st.cell / 2, y: st.gridY + r * st.cell + st.cell / 2 });
function drag(from, to) { mouse('mousedown', from.x, from.y); mouse('mouseup', to.x, to.y); g.pump(1); }
function tapGen(st, slot) {
  const n = st.gens.length;
  const genW = Math.floor((st.cw - 16 - (n - 1) * 6) / n);
  const gx = 8 + slot * (genW + 6) + genW / 2;
  mouse('mousedown', gx, Math.floor(st.gridY / 2)); g.pump(1);
}
function waitEnergy() { // energy regenerates 1/3s — pump virtual time until a tap is affordable
  for (let i = 0; i < 260 && g.call('__S.st().energy') < 1; i++) g.pump(12);
}

// produce one item of chain c at level L (recursive pairwise merging), return its [col,row]
function makeItem(c, L) {
  if (L === 0) {
    waitEnergy();
    const st = S();
    const emptyIdx = st.grid.findIndex(x => !x); // engine's findEmpty is row-major over the same grid
    if (emptyIdx < 0) throw new Error('grid full');
    const slot = st.gensChains.indexOf(c);
    if (slot < 0) throw new Error('no generator for chain ' + c);
    tapGen(st, slot);
    const st2 = S();
    const it = st2.grid[emptyIdx];
    if (!it || it.c !== c || it.l !== 0) throw new Error('tap did not land l0 at expected cell');
    return [emptyIdx % st2.cols, Math.floor(emptyIdx / st2.cols)];
  }
  const a = makeItem(c, L - 1);
  const b = makeItem(c, L - 1);
  const st = S();
  const A = cellXY(st, a[0], a[1]), B = cellXY(st, b[0], b[1]);
  drag(A, B);
  const st2 = S();
  const merged = st2.grid[b[1] * st2.cols + b[0]];
  if (!merged || merged.c !== c || merged.l !== L) throw new Error('merge to L' + L + ' failed');
  return b;
}
function fulfill(orderIdx, cell) {
  const st = S();
  const p = cellXY(st, cell[0], cell[1]);
  const ox = st.gridX + st.cols * st.cell + 8 + st.orderW / 2; // engine's order slot geometry
  const oy = orderIdx * 44 + 20;
  drag(p, { x: ox, y: oy });
}

// ---- title -> tutorial -> level 1 ----
T('title-boot', S().screen === 'title', 'screen=' + S().screen);
g.els['btnPlay'].click(); g.pump(2);
let tutHow = '';
if (S().tutActive) { g.els['btnTutSkip'].click(); g.pump(1); tutHow = 'real Skip button'; }
else g.call('skipTutorial()'), tutHow = 'G fallback';
T('tutorial-dismissable', S().tutorialDone && !S().tutActive, 'via ' + tutHow);

// ---- play all 25 levels ----
const DEADLINE = Date.now() + 95000;
let won = 0, stuck = '', taps = 0;
try {
  for (;;) {
    let st = S();
    if (st.screen !== 'game') { stuck = 'expected game screen, got ' + st.screen + ' (won ' + won + ')'; break; }
    // fulfill each order with an exact item built by recursive pairwise merging
    for (let oi = 0; oi < st.orders.length; oi++) {
      if (Date.now() > DEADLINE) throw new Error('deadline');
      const o = st.orders[oi];
      const cell = makeItem(o.c, o.l);
      fulfill(oi, cell);
      g.pump(2);
      st = S();
      if (!st.orders[oi].fulfilled) throw new Error('order ' + oi + ' (c' + o.c + ' l' + o.l + ') not fulfilled after exact drop');
      if (st.screen === 'win') break;
    }
    if (st.screen !== 'win') { stuck = 'level ' + (st.level + 1) + ' orders done but no win screen'; break; }
    won++;
    if (won === 25) break; // last level
    g.els['btnNext'].click(); g.pump(2);      // win screen -> upgrades (real button)
    g.els['btnContinue'].click(); g.pump(2);  // upgrades -> next level (real button)
  }
} catch (e) { stuck = String(e.message || e); }

const st = S();
T('all-25-levels-completable', won === 25, won + '/25' + (stuck ? ' stuck: ' + stuck : ''));
T('progress-saved', st.saveLevel === 25, 'save.level=' + st.saveLevel);
T('stars-earned', st.starKeys === 25 && st.stars >= 25, 'star keys=' + st.starKeys + ' sum=' + st.stars);
const sv = JSON.parse(g.ls.getItem('ms_v2') || 'null');
T('localStorage-persisted', !!sv && sv.v === 2 && sv.level === 25 && Object.keys(sv.stars || {}).length === 25,
  'v=' + (sv && sv.v) + ' level=' + (sv && sv.level) + ' stars=' + (sv ? Object.keys(sv.stars || {}).length : 0));
T('coins-earned', st.coins > 0, 'coins=' + st.coins);
if (won === 25 && !stuck) { g.els['btnNext'].click(); g.pump(2); }
T('final-screen-title', S().screen === 'title', 'screen=' + S().screen);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { won: won + '/25', stuck: stuck || '' } };
console.log('merge-sweets: ' + won + '/25 levels via real canvas drag merges + order drops: ' + out.verdict + (stuck ? ' [' + stuck + ']' : ''));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
