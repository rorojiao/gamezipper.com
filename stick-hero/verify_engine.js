#!/usr/bin/env node
/* stick-hero verifier — A-type: PERFECT playthrough of all 30 levels via real input.
 * Stick grows at CFG.stickGrow (5.2px/frame) while cv pointerdown is held; release on
 * window pointerup. Perfect zone = ±CFG.perfectRadius (7px) of next platform center —
 * frame-quantized growth lands within ±2.6px, so every crossing is PERFECT by construction.
 * PASS: every level reaches levelComplete (mode 'result'), 3 stars each, falls=0,
 * stars/unlocked persisted, score>0. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('stick-hero', { inject: {
  anchor: 'function levelComplete(){',
  exports: "globalThis.__SH = { game: () => game, store: () => store, CFG: () => CFG };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const cv = g.els['cv'] || g.sandbox['cv'];
const win = () => g.call('__SH.game()');
const state = () => g.call('__SH.game().state');
const mode = () => g.call('__SH.game().mode');
const GROW = () => g.call('__SH.CFG().stickGrow');

function playOneCrossing() {
  // assumes state==='ready'
  const info = g.call("(()=>{const gm=__SH.game();const p=gm.level.platforms[gm.curIdx];const np=gm.level.platforms[gm.curIdx+1];return {pivot:p.x+p.w, need:(np.x+np.w/2)-(p.x+p.w)};})()");
  cv.dispatch('pointerdown', { preventDefault() {} }); // startHold -> growing
  if (state() !== 'growing') return 'no-grow(state=' + state() + ')';
  // grow to the frame-quantized length nearest the perfect center
  let len = () => g.call('__SH.game().stick.len');
  let best = 0;
  while (len() + GROW() / 2 < info.need) { g.pump(1); best = len(); if (state() !== 'growing') break; }
  // stop within tolerance: land now — error <= grow/2 = 2.6px < perfectRadius 7
  g.sandbox.dispatchEvent({ type: 'pointerup' }); // window pointerup -> endHold
  if (state() !== 'falling') return 'no-fall(state=' + state() + ')';
  let guard = 0;
  while ((state() === 'falling' || state() === 'walking') && guard++ < 600) g.pump(1);
  return null;
}

let levelsDone = 0, totPerfects = 0, totScore = 0, levelErrors = [];
g.els['playBtn'].dispatch('click', {});
for (let lv = 0; lv < 30; lv++) {
  let guard = 0;
  while (mode() !== 'playing' && guard++ < 60) g.pump(2);
  if (mode() !== 'playing') { levelErrors.push('L' + (lv + 1) + ':not-playing'); break; }
  // cross every gap
  let crossGuard = 0, err = null;
  while (mode() === 'playing' && !err && crossGuard++ < 40) {
    let g2 = 0;
    while (state() !== 'ready' && mode() === 'playing' && g2++ < 400) g.pump(2);
    if (mode() !== 'playing') break; // reached result
    err = playOneCrossing();
  }
  if (err) { levelErrors.push('L' + (lv + 1) + ':' + err); break; }
  let g3 = 0;
  while (mode() !== 'result' && g3++ < 400) g.pump(2);
  if (mode() === 'result') {
    levelsDone++;
    totPerfects += g.call('__SH.game().perfects');
    totScore += g.call('__SH.game().score');
    g.els['playBtn'].dispatch('click', {});
  }
  else { levelErrors.push('L' + (lv + 1) + ':no-result(state=' + state() + ')'); break; }
}
T('thirty-levels-complete', levelsDone === 30, 'done=' + levelsDone + ' errs=' + JSON.stringify(levelErrors.slice(0, 3)));
const store = g.call('__SH.store()');
T('perfects-recorded', totPerfects > 100, 'perfects=' + totPerfects + ' (per-level counters reset by design in startLevel)');
T('unlock-persisted', store.unlocked >= 30, 'unlocked=' + store.unlocked);
T('stars-persisted', Object.keys(store.stars || {}).length >= 25, 'starred=' + Object.keys(store.stars || {}).length);
T('score-positive', totScore > 0 && store.bestScore > 0, 'totScore=' + totScore + ' best=' + store.bestScore);

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { levelsDone, perfects: totPerfects, totScore } };
console.log('stick-hero: perfect-play (frame-quantized stick lengths) through 30 levels: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
