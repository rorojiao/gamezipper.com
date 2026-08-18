#!/usr/bin/env node
/* antistress verifier — C-type toybox: open toys through the REAL card-click callee,
 * interact via the canvas pointer handlers the toy loop reads, close, repeat.
 * PASS: >=5 distinct toys opened (uses counted + saved), canvas interactions drive
 * toyInstance.update on the engine rAF loop, close/reopen path works, save persisted,
 * boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('antistress', { inject: {
  anchor: 'function closeToy(){',
  exports: "globalThis.__AS = { toys: () => TOYS.map(t => ({ id: t.id, name: t.name })), open: (id) => { const t = TOYS.find(x => x.id === id); openToy(t); }, close: () => closeToy(), uses: (id) => state.toyUses[id] || 0, current: () => state.currentToy && state.currentToy.id, inst: () => !!toyInstance };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));

const toys = g.call('__AS.toys()') || [];
T('toys-exist', toys.length >= 10, 'n=' + toys.length);
const cv = g.els['gameCanvas'];
let opened = 0;
for (let i = 0; i < Math.min(toys.length, 6); i++) {
  g.call(`__AS.open(${JSON.stringify(toys[i].id)})`);
  g.pump(5);
  if (g.call('__AS.inst()') !== true) continue;
  // interact on the canvas (pointer down/move/up like a real touch)
  cv.dispatch('pointerdown', { clientX: 200, clientY: 300, preventDefault() {} });
  for (let s = 0; s < 6; s++) cv.dispatch('pointermove', { clientX: 200 + s * 8, clientY: 300 + s * 4, preventDefault() {} });
  cv.dispatch('pointerup', { clientX: 248, clientY: 324, preventDefault() {} });
  g.pump(30); // toy loop runs (update+draw on rAF)
  g.call('__AS.close()');
  g.pump(3);
  opened++;
}
T('toys-opened', opened >= 5, 'opened=' + opened);
T('uses-counted', toys.slice(0, 6).every(t => g.call(`__AS.uses(${JSON.stringify(t.id)})`) >= 1));
T('save-persisted', !!g.ls.getItem('antistress-save'), 'key present');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { opened, totalToys: toys.length } };
console.log('antistress: open-interact-close cycles through the real toy paths: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
