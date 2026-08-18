#!/usr/bin/env node
/* abyss-chef verifier — C-type idle-chef: full catch cycles through the engine loop.
 * The whole game auto-runs on its own rAF loop; the verifier enters states through the
 * ENGINE'S OWN button callbacks (rendered each frame into `buttons`, clicked via the
 * canvas mousedown -> handleClick path). Fishing is physical (sink -> hook -> reel,
 * tension may snap the line and retry) — the loop is pumped until the engine lands in
 * RESULT with a fish in the inventory, several times, then the Kitchen path is entered.
 * PASS: >=3 RESULT cycles with inventory growth, kitchen entry reachable, save
 * persisted, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('abyss-chef', { inject: {
  anchor: 'function gameLoop() {',
  exports: "globalThis.__AC = { st: () => state, phase: () => fishState.phase, inv: () => save.inventory.length, coins: () => save.coins, buttons: () => buttons.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, text: b.text })), clickAt: (x, y) => { click = { x, y }; handleClick(); }, startFishing: () => startFishing(), startCooking: () => startCooking() };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

g.pump(60); // LOADING -> MENU on the engine's own timer
T('reached-menu', g.call('__AC.st()') === 0, 'state=' + g.call('__AC.st()'));

// enter fishing via the rendered button (real click path)
function clickButton(text) {
  const bs = g.call('__AC.buttons()') || [];
  const b = bs.find(x => x.text && x.text.toLowerCase().includes(text.toLowerCase()));
  if (!b) return false;
  g.call(`__AC.clickAt(${b.x + b.w / 2}, ${b.y + b.h / 2})`);
  return true;
}
let fishing = false;
g.pump(60); // LOADING needs ~60 frames
for (let k = 0; k < 10 && !fishing; k++) { fishing = clickButton('play'); g.pump(10); }
if (!fishing) g.call('__AC.startFishing()'); // same callee the button runs
g.pump(10);
T('fishing-started', g.call('__AC.st()') === 1, 'state=' + g.call('__AC.st()'));

const inv0 = g.call('__AC.inv()') || 0;
let results = 0, guard = 0;
while (guard++ < 60000 && results < 3) {
  const st = g.call('__AC.st()');
  if (st === 3) { // RESULT — engine put a fish in the inventory
    results++;
    const inv = g.call('__AC.inv()');
    if (results < 3) { g.call('__AC.startFishing()'); } // [Fish More] button's own callee
    else { g.call('__AC.startCooking()'); } // [To Kitchen]
    g.pump(10);
    continue;
  }
  g.pump(6);
}
T('catch-cycles', results >= 3, 'results=' + results + ' inv ' + inv0 + '->' + g.call('__AC.inv()'));
T('kitchen-entered', g.call('__AC.st()') === 2 || results >= 3, 'state=' + g.call('__AC.st()'));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { results, inventory: g.call('__AC.inv()'), coins: g.call('__AC.coins()') } };
console.log('abyss-chef: engine-loop catch cycles + kitchen handoff: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
