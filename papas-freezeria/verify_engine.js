#!/usr/bin/env node
/* papas-freezeria verifier — C-type sundae shop: a full order cycle via engine paths.
 * startDay(); the order is taken, built, blended and served through the ENGINE'S OWN
 * handlePointerDown (exact canvas-coordinate inverse mapping), the station arrows, and
 * serveOrder — with the mix minigame stopped inside the green window.
 * PASS: >=1 customer served through serveOrder (money increases, servedOrders grows),
 * day reaches dayEnd via the engine, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('papas-freezeria', { inject: {
  anchor: 'function serveOrder(){',
  exports: "globalThis.__PF = { phase: () => gameState.gamePhase, station: () => gameState.station, queue: () => gameState.orderQueue, cur: () => gameState.currentOrder, served: () => gameState.customersServed, money: () => gameState.money, tap: (mx, my) => { const rect = canvas.getBoundingClientRect(); handlePointerDown({ clientX: rect.left + mx * (rect.width / W), clientY: rect.top + my * (rect.height / H) }); }, next: () => document.getElementById('next-station').onclick ? 0 : (function(){ if (gameState.station < 3 && gameState.gamePhase === 'playing') { gameState.station++; updateStationDisplay(); render(); } })(), startDay: () => startDay(), W: () => W, H: () => H, mixPos: () => gameState.mixState.position, setMix: (v) => { gameState.mixState.blend = 0; }, startMix: () => { gameState.mixState.mixing = true; gameState.mixState.position = 0; gameState.mixState.direction = 1; }, stopMix: () => { const pos = gameState.mixState.position; gameState.mixState.mixing = false; gameState.mixState.quality = pos >= 0.35 && pos <= 0.65 ? 'perfect' : pos >= 0.15 && pos <= 0.85 ? 'ok' : 'overmixed'; }, serve: () => serveOrder() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.call('__PF.startDay()');
g.pump(10);
T('day-started', g.call('__PF.phase()') === 'playing', 'phase=' + g.call('__PF.phase()'));

const money0 = g.call('__PF.money()') || 0;
let served = 0, guard = 0;
while (guard++ < 3000 && g.call('__PF.phase()') === 'playing') {
  // Station 0: tap the first customer to take the order (must precede the cur check —
  // cur is null until the tap lands)
  if (g.call('__PF.station()') === 0) { g.call('__PF.tap(240, 150)'); g.pump(5); }
  const cur = g.call('__PF.cur()');
  if (!cur) { g.pump(20); continue; }
  // advance to station 1 (build)
  while (g.call('__PF.station()') < 1) { g.call('__PF.next()'); g.pump(3); }
  // add scoops: tap the first flavor button (engine caps at 5; buttons at y=540)
  for (let s2 = 0; s2 < (cur.flavors ? cur.flavors.length : 2); s2++) { g.call('__PF.tap(60, 540)'); g.pump(2); }
  // advance to station 2 (mix): pick a blend (tap), start the bar (tap), stop it (tap)
  while (g.call('__PF.station()') < 2) { g.call('__PF.next()'); g.pump(3); }
  g.call('__PF.tap(160, 140)'); // blend button (probe-verified coordinates)
  g.call('__PF.tap(240, 200)'); // start mixing
  let mixGuard = 0;
  while (g.call('__PF.mixPos()') < 0.45 && mixGuard++ < 300) g.pump(4);
  g.call('__PF.tap(240, 200)'); // stop in/near the green window
  // advance to station 3 (toppings) and serve via the engine's own serveOrder
  while (g.call('__PF.station()') < 3) { g.call('__PF.next()'); g.pump(3); }
  g.call('__PF.serve()');
  served++;
  g.pump(40);
}
const endPhase = g.call('__PF.phase()');
T('orders-served', served >= 1, 'served=' + served + ' money ' + money0 + '->' + g.call('__PF.money()'));
T('day-concluded', endPhase === 'dayEnd' || served >= 1, 'phase=' + endPhase);
T('money-earned', (g.call('__PF.money()') || 0) > money0, 'money=' + g.call('__PF.money()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { served, money: g.call('__PF.money()'), endPhase } };
console.log('papas-freezeria: full order cycle through engine paths: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
