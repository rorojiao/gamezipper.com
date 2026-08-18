#!/usr/bin/env node
/* cookie-clicker verifier — C-type idle: real click + buy + tick loop.
 * clickCookie through the cookie element's own pointer handler (state.cookies += power);
 * buyBuilding (the shop button callee) on the engine's own cost check; gameTick runs on
 * the engine's setInterval (harness timer pump).
 * PASS: clicks accrue cookies, >=3 buildings bought, CPS income accrues across pumped
 * ticks, save persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('cookie-clicker', { inject: {
  anchor: 'function gameTick(){',
  exports: "globalThis.__CC = { cookies: () => state.cookies, cps: () => calculateCPS(), buildings: () => state.buildings.slice(), cost: (i) => getBuildingCost(i), buy: (i) => buyBuilding(i, null), click: () => clickCookie({ preventDefault() {} }), save: () => saveGame() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

// clicks
let c0 = g.call('__CC.cookies()') || 0;
for (let i = 0; i < 50; i++) g.call('__CC.click()');
let c1 = g.call('__CC.cookies()') || 0;
T('clicks-accrue', c1 > c0, c0 + '->' + c1);

// buy the affordable buildings (cursor is cheap)
let bought = 0;
for (let round = 0; round < 40; round++) {
  for (let b = 0; b < 4; b++) {
    const cost = g.call(`__CC.cost(${b})`) || Infinity;
    if ((g.call('__CC.cookies()') || 0) >= cost) { g.call(`__CC.buy(${b})`); bought++; }
  }
  if (bought >= 3) break;
  for (let i = 0; i < 30; i++) g.call('__CC.click()');
  g.pump(60); // ~1s of engine ticks
}
T('buildings-bought', bought >= 3, 'bought=' + bought);

// CPS income across pumped ticks
const cps = g.call('__CC.cps()') || 0;
const before = g.call('__CC.cookies()') || 0;
g.pump(600); // ~10s of ticks
const after = g.call('__CC.cookies()') || 0;
T('cps-income', cps > 0 && after > before, 'cps=' + cps.toFixed(1) + ' ' + Math.round(before) + '->' + Math.round(after));

// persistence
g.call('__CC.save()');
const saved = g.ls.getItem('cookieClicker') || [...Object.keys(g.ls._m || {})].find(k => /cookie|cc_/i.test(k)) || '';
T('save-persisted', saved !== '', 'key=' + String(saved).slice(0, 30));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { bought, cps: +cps.toFixed(1), cookies: Math.round(after) } };
console.log('cookie-clicker: click+buy+idle-tick loop through the engine: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
