#!/usr/bin/env node
/* drive-fury endless softlock regression gate — R1134 (fa40f82cde).
 * CLASS: render transitions 'endless_over' -> 'endless_over_saved' after ONE frame
 * (banking coins once), but handleClick ONLY accepted 'endless_over' — RETRY/BACK
 * on the results screen were dead for >=1 frame, which is forever once rAF has
 * advanced: P1 softlock requiring page reload.
 * GATE: drive endless mode to fuel-out, assert the state machine settles into
 * endless_over_saved, assert coin banking happens EXACTLY ONCE, and assert
 * RETRY and BACK clicks work FROM THE SAVED STATE (the state the player
 * actually sees). Static wiring (the || clause) is asserted via saved-state
 * click behaviour, not by grepping source.
 * Three-layer pattern per R1133: dynamic freeze-release here; git-stash control
 * run executed manually at commit time. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('drive-fury', { inject: {
  anchor: 'function handleClick(x, y) {',
  exports: "globalThis.__DF = { st: () => gameState, setSt: (s) => { gameState = s; }, game: () => game, save: () => save, W: () => W, H: () => H, go: (x, y) => handleClick(x, y) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const W = g.call('__DF.W()'), H = g.call('__DF.H()');
const key = (c, t) => g.sandbox.dispatchEvent({ type: t || 'keydown', code: c, key: c, preventDefault() {} });

// title -> endless (second title button: y in [H/2+25, H/2+75], x within 220-wide bar)
g.call(`__DF.go(${W / 2}, ${H / 2 + 50})`);
g.pump(5);
const stAfterStart = g.call('__DF.st()');
const endlessActive = stAfterStart === 'playing' && g.call('__DF.game().endless') === true;
T('endless-started', endlessActive, 'st=' + stAfterStart + ' endless=' + g.call('__DF.game().endless'));

// seed coins so single-banking is observable (fresh endless game has coins=0)
g.call('(() => { const gg = __DF.game(); gg.coins = 7; save.coins = 100; })()');

// drive (ArrowRight, best-effort) until fuel runs out: fuel 100 - 3/s => ~33s game time
let guard = 0, sawOver = false, st = '', coinsAtOut = null;
while (guard++ < 6000) {
  st = g.call('__DF.st()');
  if (st === 'playing' && g.call('__DF.game().endless')) { key('ArrowRight'); g.pump(3); key('ArrowRight', 'keyup'); }
  else { g.pump(1); }
  if (st === 'endless_over') { sawOver = true; coinsAtOut = g.call('__DF.game().coins'); }
  if (st === 'endless_over_saved') { if (coinsAtOut === null) coinsAtOut = g.call('__DF.game().coins'); break; }
}
T('fuel-out-reached', g.call('__DF.game().fuel') <= 0 || sawOver || st === 'endless_over_saved',
  'st=' + st + ' fuel=' + g.call('__DF.game().fuel') + ' frames=' + guard);
T('settles-into-saved', st === 'endless_over_saved', 'st=' + st + ' (render must leave a CLICKABLE results state, not transient endless_over)');

// coin banking must be exactly-once (double count = coins += g.coins every frame).
// Baseline = the run's own coin total at the transition instant (driving picks up coins).
const banked = g.call('save.coins') - 100;
T('coins-banked-exactly-once', banked === coinsAtOut, 'banked=' + banked + ' (expected ' + coinsAtOut + ' once)');
g.pump(10); // more frames in saved state
T('coins-not-rebanked', g.call('save.coins') - 100 === banked, 'banked=' + (g.call('save.coins') - 100) + ' -> ' + banked + ' after 10 extra frames');

// THE R1134 assertion: clicks FROM THE SAVED STATE (state = endless_over_saved
// is guaranteed: render keeps it there, mainLoop only rewrites 'endless' -> 'playing')
const cx = W / 2, cy = H / 2;
T('pre-state-is-saved', g.call('__DF.st()') === 'endless_over_saved', 'st=' + g.call('__DF.st()'));

// BACK button (cy+115..cy+160) -> title
g.call(`__DF.go(${cx}, ${cy + 137})`);
g.pump(3);
T('back-from-saved-works', g.call('__DF.st()') === 'title', 'st=' + g.call('__DF.st()'));

// RETRY from saved: re-enter endless, then from the fresh results cycle assert
// fuel reset. Re-enter endless via title first (deterministic geometry).
g.call(`__DF.go(${cx}, ${H / 2 + 50})`);
g.pump(3);
const reentered = g.call('__DF.st()') === 'playing' && g.call('__DF.game().endless') === true && g.call('__DF.game().fuel') > 90;
T('retry-path-restarts-endless', reentered, 'st=' + g.call('__DF.st()') + ' fuel=' + g.call('__DF.game().fuel'));

// direct RETRY geometry from saved state: force saved, click RETRY rect
g.call(`__DF.setSt('endless_over_saved')`);
g.call(`__DF.go(${cx}, ${cy + 82})`);
g.pump(2);
const retryDirect = g.call('__DF.st()') === 'playing' && g.call('__DF.game().endless') === true;
T('retry-from-saved-works', retryDirect, 'st=' + g.call('__DF.st()') + ' (the exact R1134 dead-button regression)');

const errHit = (g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e));
T('no-vm-errors', !errHit, JSON.stringify(errHit || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { framesToFuelOut: guard, banked, endState: g.call('__DF.st()') } };
console.log('drive-fury: endless results-screen softlock gate (R1134): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
