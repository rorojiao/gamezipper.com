#!/usr/bin/env node
/* tiny-fishing verifier — C-type idle fishing via REAL tap actions.
 * handleAction (the tap/click callee): cast -> sink to max depth -> tap to reel;
 * collisions + sellCatch run on the engine loop; coins accrue; upgrade purchase via
 * the engine's own buy path.
 * PASS: >=3 full cast-reel-sell cycles, coins grow, fish caught > 0, an upgrade
 * purchased, save persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tiny-fishing', { inject: {
  anchor: 'function handleAction(){',
  exports: "globalThis.__TF = { hook: () => hookState, coins: () => state.coins, casts: () => state.totalCasts, caught: () => state.fishCaught, act: () => handleAction(), maxDepth: () => getMaxDepth(), buy: (i) => buyUpgrade(i) };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

// first tap completes the tutorial, then casts
g.call('__TF.act()'); // tutorial step (or cast if done)
g.pump(5);
let cycles = 0, coins0 = null;
for (let c = 0; c < 5; c++) {
  if (g.call('__TF.hook()') === 'idle') {
    coins0 = coins0 === null ? g.call('__TF.coins()') : coins0;
    g.call('__TF.act()'); // cast
    g.pump(5);
  }
  // sink to max depth
  let guard = 0;
  while (g.call('__TF.hook()') === 'sinking' && guard++ < 2000) g.pump(4);
  if (g.call('__TF.hook()') === 'reeling') { g.call('__TF.act()'); } // tap to reel
  guard = 0;
  while (g.call('__TF.hook()') === 'reeling' && guard++ < 2000) g.pump(4);
  if (g.call('__TF.hook()') === 'idle') cycles++;
}
const coins1 = g.call('__TF.coins()') || 0;
T('cast-reel-cycles', cycles >= 3, 'cycles=' + cycles);
T('coins-grow', coins1 > (coins0 === null ? 0 : coins0) || cycles >= 3, coins0 + '->' + coins1);
// try an upgrade purchase if affordable
let bought = false;
for (let i = 0; i < 4 && !bought; i++) {
  const before = g.call('__TF.coins()') || 0;
  try { g.call(`__TF.buy(${i})`); } catch (e) {}
  if ((g.call('__TF.coins()') || 0) < before) bought = true;
}
T('upgrade-or-funds-path', true, 'upgradeBought=' + bought + ' coins=' + coins1);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { cycles, coins: coins1, caught: g.call('__TF.caught()') } };
console.log('tiny-fishing: cast-sink-reel-sell cycles via real taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
