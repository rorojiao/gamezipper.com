#!/usr/bin/env node
/* centrifuge-separation verifier — 30 levels: set the RPM slider through its real
 * input event, press START, pump the full virtual time limit so the engine's own
 * gameLoop settles the particles and calls checkResult; win = "Level Complete!" modal.
 * Heavy particles sink (density > fluid); pick the RPM that separates within budget. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('centrifuge-separation', { inject: {
  anchor: 'function checkResult() {',
  exports: `globalThis.__F = {
    n: () => LEVELS.length,
    init: (i) => initLevel(i),
    state: () => gameState,
    rpm: (r) => { rpm = r; },
    parts: () => particles.map(p => ({ d: p.density, y: p.y })),
    lvl: (i) => LEVELS[i],
    title: () => document.getElementById('modal-title').textContent,
    hideModal: () => { document.getElementById('modal-overlay').style.display = 'none'; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__F.n()');
T('levels-exist', N === 30, 'n=' + N);

const slider = () => g.els['rpm-slider'];

function attempt(i, rpmVal) {
  g.call(`__F.init(${i})`); g.pump(2);
  slider().value = String(rpmVal);
  slider().dispatch('input', { target: slider(), value: String(rpmVal) });
  g.els['btn-start'].dispatch('click', {});
  for (let f = 0; f < 3400 && g.call('__F.state()') === 'running'; f++) g.pump(1); // full time_limit
  g.pump(2);
  return g.call('__F.title()') === 'Level Complete!';
}

const solved = [];
for (let i = 0; i < N; i++) {
  let ok = false;
  for (const rpmVal of [175, 225, 275, 350, 450, 150]) { // sweep across rpm_range bands
    if (attempt(i, rpmVal)) { ok = true; break; }
    g.call('__F.hideModal()');
  }
  if (ok) solved.push(i + 1); else fails.push('L' + (i + 1) + ' separation failed');
}
T('levels-separated', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

// rpm slider is the real control path
g.call('__F.hideModal()');
g.call('__F.init(0)'); g.pump(2);
slider().value = '300';
slider().dispatch('input', { target: slider(), value: '300' });
g.pump(1);
T('rpm-slider-works', String(g.els['rpm-value'].textContent) === '300', 'got ' + g.els['rpm-value'].textContent);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('centrifuge-separation: ' + solved.length + '/' + N + ' separations via real RPM + START: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
