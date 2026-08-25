#!/usr/bin/env node
/* pottery-master verifier — all 30 levels completed through the engine's real
 * input path: real canvas pointerdown/pointermove/pointerup strokes (the engine's
 * own applyShape brush math) driving each vessel's 24-radius profile toward the
 * target until the engine's OWN checkWin (threshold sustained 16 frames) fires
 * triggerWin. A greedy shaper picks, per event, the brush spot whose exact
 * replicated applyShape effect most reduces total profile error — then the event
 * is dispatched through the real pointer path. Navigation/hint/undo/reset through
 * the real buttons; star + progress persistence in localStorage. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('pottery-master', { inject: {
  anchor: '// ---- State ----',
  exports: `
globalThis.__won = null;
var __oTW = triggerWin;
triggerWin = function(){ globalThis.__won = { lvl: currentLevel+1, match: computeMatch(), moves: moves }; return __oTW.apply(this, arguments); };
render = function(){}; // draw-only — stubbed to keep the rAF loop cheap; no game logic
globalThis.__PM = {
  n: function(){ return LEVELS.length; },
  lv: function(i){ return { th: LEVELS[i].threshold, brush: LEVELS[i].brushSize, budget: LEVELS[i].moveBudget, hints: LEVELS[i].hints, target: LEVELS[i].target.slice() }; },
  st: function(){ return { lvl: currentLevel, match: computeMatch(), moves: moves, won: isWon, hintA: hintActive, hints: hintsLeft,
    cur: currentProfile.slice(), undoN: undoStack.length, snap: snapping }; },
  geo: function(){ return { cx: centerX, top: vesselTopY, bot: vesselBottomY, h: vesselHeight, mr: maxRadiusPx }; },
  sd: function(){ return JSON.parse(JSON.stringify(starData)); },
};`
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const C = (e) => g.call(e);
const cv = g.els['game'];
const T0 = Date.now();

// ---------- exact replication of applyShape ----------
function applyMirror(cur, geo, brush, idx, tR) {
  const sigma = brush;
  for (let i = 0; i < cur.length; i++) {
    const d = Math.abs(i - idx);
    if (d > sigma * 2.5) continue;
    const w = Math.exp(-(d * d) / (2 * sigma * sigma));
    const delta = (tR - cur[i]) * w * 0.35;
    if (Math.abs(delta) > 0.001) cur[i] = Math.min(0.97, Math.max(0.12, cur[i] + delta));
  }
}
function yFor(geo, idx, N) { return geo.bot - (idx / (N - 1)) * geo.h; }
function matchOf(cur, target) {
  let s = 0; for (let i = 0; i < cur.length; i++) s += Math.abs(cur[i] - target[i]);
  return Math.max(0, Math.min(100, Math.round(100 - (s / cur.length) * 200)));
}
function pev(type, x, y) {
  cv.dispatch(type, { clientX: x, clientY: y, pointerId: 1, button: 0, preventDefault() {} });
}
function strokeToWin(id, deadline) { // one real stroke (down -> moves -> up), then pump the engine's own sustained checkWin
  const N = 24;
  const lv = C('__PM.lv(' + (id - 1) + ')');
  const geo = C('__PM.geo()');
  const target = lv.target;
  let st = C('__PM.st()');
  let cur = st.cur.slice();
  let best = -1;
  for (let ev = 0; ev < 4000; ev++) {
    if (matchOf(cur, target) >= lv.th) break;
    // greedy: pick the brush spot whose single applyShape event most reduces total error
    let bestSum = Infinity, bestIdx = 0;
    for (let idx = 0; idx < N; idx++) {
      const c2 = cur.slice();
      applyMirror(c2, geo, lv.brush, idx, target[idx]);
      let s = 0; for (let i = 0; i < N; i++) s += Math.abs(c2[i] - target[i]);
      if (s < bestSum) { bestSum = s; bestIdx = idx; }
    }
    const tR = Math.min(0.97, Math.max(0.12, target[bestIdx]));
    const x = geo.cx + tR * geo.mr, y = yFor(geo, bestIdx, N);
    pev(ev === 0 ? 'pointerdown' : 'pointermove', x, y);
    applyMirror(cur, geo, lv.brush, bestIdx, tR);
    if (ev % 150 === 149) cur = C('__PM.st().cur').slice(); // resync mirror with the live engine
    if (Date.now() > deadline) return { r: 'deadline', m: matchOf(cur, target) };
  }
  pev('pointerup', geo.cx, geo.bot);
  const m = matchOf(cur, target);
  if (m < lv.th) return { r: 'below-threshold', m, th: lv.th };
  for (let i = 0; i < 300 && !C('__PM.st().won'); i++) { // engine needs 16 sustained frames
    g.pump(3);
    if (Date.now() > deadline) return { r: 'sustain-timeout', m };
  }
  if (!C('__PM.st().won')) return { r: 'no-win', m };
  g.pump(60); // flush the 900ms win-overlay timer
  return { r: 'won', m };
}

// ---------- boot + level data integrity ----------
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
T('levels-30', C('__PM.n()') === 30, 'n=' + C('__PM.n()'));
const LV = [];
for (let i = 0; i < 30; i++) LV.push(C('__PM.lv(' + i + ')'));
let integ = [];
LV.forEach((l, i) => {
  if (l.target.length !== 24) integ.push('L' + (i + 1) + ':len' + l.target.length);
  if (l.target.some(v => v < 0.12 || v > 0.97)) integ.push('L' + (i + 1) + ':range');
  if (!(l.th >= 85 && l.th <= 100)) integ.push('L' + (i + 1) + ':th' + l.th);
  if (!(l.brush >= 1 && l.budget >= 10)) integ.push('L' + (i + 1) + ':meta');
});
T('level-data-integrity', integ.length === 0, integ.join(',').slice(0, 120));
const geo0 = C('__PM.geo()');
T('geometry-sane', geo0.mr > 50 && geo0.h > 100 && geo0.bot > geo0.top, JSON.stringify(geo0));
T('fresh-level-1', C('__PM.st().lvl') === 0 && C('__PM.st().moves') === 0, 'lvl=' + C('__PM.st().lvl'));

// ---------- hint probe (real button) on level 1 ----------
g.els['btn-hint'].click(); g.pump(2);
T('hint-consumed', C('__PM.st().hints') === LV[0].hints - 1 && C('__PM.st().hintA') === true,
  'hints=' + C('__PM.st().hints') + '/' + LV[0].hints + ' act=' + C('__PM.st().hintA'));

// ---------- level 1 via real stroke ----------
C('__won = null');
const r1 = strokeToWin(1, Math.min(Date.now() + 20000, T0 + 90000));
T('level-1-won', r1.r === 'won' && C('__won') && C('__won').lvl === 1, r1.r + ' m=' + r1.m);
T('win-overlay-shown', g.els['win-overlay'].classList.contains('show'), 'overlay hidden');
let prog = JSON.parse(g.ls.getItem('potteryMaster_progress') || '{}');
T('l1-star-saved', prog['0'] && prog['0'].stars >= 1, JSON.stringify(prog['0'] || {}).slice(0, 50));
T('l1-moves-in-budget', C('__PM.st().moves') >= 1 && C('__PM.st().moves') <= LV[0].budget, 'moves=' + C('__PM.st().moves'));

// ---------- level 2: undo + reset probes through real buttons, then win ----------
g.els['btn-next-level'].click(); g.pump(4);
T('next-loads-2', C('__PM.st().lvl') === 1 && C('__PM.st().moves') === 0, 'lvl=' + C('__PM.st().lvl'));
const geo2 = C('__PM.geo()');
pev('pointerdown', geo2.cx + 0.7 * geo2.mr, yFor(geo2, 12, 24));
for (let k = 0; k < 8; k++) pev('pointermove', geo2.cx + 0.7 * geo2.mr, yFor(geo2, 12, 24));
pev('pointerup', geo2.cx, geo2.bot);
T('drag-counts-move', C('__PM.st().moves') === 1 && C('__PM.st().undoN') === 1, 'moves=' + C('__PM.st().moves') + ' undo=' + C('__PM.st().undoN'));
g.els['btn-undo'].click(); g.pump(2);
T('undo-restores', C('__PM.st().cur').every(v => Math.abs(v - 0.5) < 0.01) && C('__PM.st().undoN') === 0,
  'max dev=' + Math.max(...C('__PM.st().cur').map(v => Math.abs(v - 0.5))).toFixed(3));
g.els['btn-undo'].click(); g.pump(2); // empty stack -> toast path
T('undo-empty-safe', C('__PM.st().undoN') === 0, 'undoN=' + C('__PM.st().undoN'));
g.els['btn-reset'].click(); g.pump(2);
T('reset-works', C('__PM.st().moves') === 0 && C('__PM.st().cur').every(v => v === 0.5), 'moves=' + C('__PM.st().moves'));
C('__won = null');
const r2 = strokeToWin(2, Math.min(Date.now() + 20000, T0 + 92000));
T('level-2-won', r2.r === 'won' && C('__won') && C('__won').lvl === 2, r2.r + ' m=' + r2.m);

// ---------- levels 3..30 chained through the real Next Level button ----------
const chain = ['1', '2'];
for (let id = 3; id <= 30; id++) {
  g.els['btn-next-level'].click(); g.pump(4);
  if (C('__PM.st().lvl') !== id - 1) { chain.push(id + ':bad-load'); T('level-' + id + '-won', false, 'bad-load lvl=' + C('__PM.st().lvl')); break; }
  C('__won = null');
  const res = strokeToWin(id, Math.min(Date.now() + 20000, T0 + 95000));
  const ok = res.r === 'won' && C('__won') && C('__won').lvl === id;
  chain.push(ok ? '' + id : id + ':' + res.r + '@' + res.m);
  T('level-' + id + '-won', ok, res.r + ' m=' + res.m + '/' + LV[id - 1].th);
  T('level-' + id + '-moves', ok && C('__PM.st().moves') <= LV[id - 1].budget, 'moves=' + C('__PM.st().moves') + '/' + LV[id - 1].budget);
  if (!ok) break;
}
T('all-30-levels', chain.length === 30 && chain.every(x => !x.includes(':')), chain.filter(x => x.includes(':')).join(',').slice(0, 200) || 'all');

// ---------- persistence + level select ----------
prog = JSON.parse(g.ls.getItem('potteryMaster_progress') || '{}');
T('progress-30-completed', Object.keys(prog).length === 30 && Object.values(prog).every(v => v.completed && v.stars >= 1),
  'keys=' + Object.keys(prog).length);
T('next-hidden-on-last', g.els['btn-next-level'].style.display === 'none', 'disp=' + g.els['btn-next-level'].style.display);
g.els['btn-menu-levels'].click(); g.pump(2); // real Menu button -> level select
T('level-select-opens', g.els['level-select'].style.display === 'flex', 'disp=' + g.els['level-select'].style.display);
g.els['close-levels'].click(); g.pump(2);
T('level-select-closes', g.els['level-select'].style.display === 'none', 'disp=' + g.els['level-select'].style.display);
g.els['btn-prev'].click(); g.pump(2); // real Prev/Next nav on the select grid
T('prev-works', C('__PM.st().lvl') === 28, 'lvl=' + C('__PM.st().lvl'));
g.els['btn-next'].click(); g.pump(2);
T('next-works', C('__PM.st().lvl') === 29, 'lvl=' + C('__PM.st().lvl'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError|^(raf|timer): /.test(e)) || '').slice(0, 120));

const stars3 = Object.values(prog).filter(v => v.stars === 3).length;
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8),
  extra: { levels: chain.filter(x => !x.includes(':')).length + '/30', durS: Math.round((Date.now() - T0) / 1000),
    notes: 'levels reached via single continuous real strokes (moves 1-3 each, well under budget); 3-star=' + stars3 + '/30; level-select card grid is innerHTML-built (harness stub) — nav proven via real Prev/Next/Next-Level buttons instead' } };
console.log('pottery-master: ' + chain.filter(x => !x.includes(':')).length + '/30 levels via real pointer strokes: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
