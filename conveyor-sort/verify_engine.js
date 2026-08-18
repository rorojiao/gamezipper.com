#!/usr/bin/env node
/* conveyor-sort verifier — 30 levels: run each level to completion with the engine's
 * own loop; toggle switches mid-flight through real canvas clicks at switch centers
 * (input path exercised). Win = engine checkGameEnd (processedCount >= nItems). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('conveyor-sort', { inject: {
  anchor: 'function checkGameEnd() {',
  exports: `globalThis.__V = {
    n: () => LEVELS.length,
    start: (n) => startLevel(n),
    won: () => state.won,
    over: () => state.gameOver,
    screen: () => state.screen,
    processed: () => state.processedCount,
    mistakes: () => state.mistakeCount,
    items: () => LEVELS.length,
    switches: () => state.switches.map(s => ({ x: s.x, y: s.y, d: s.direction })),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els['game-canvas'];

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__V.n()');
T('levels-exist', N === 30, 'n=' + N);

const clickAt = (x, y) => cv().dispatch('click', { clientX: x * (480 / 450), clientY: y * (640 / 500), preventDefault() {} });

const solved = [];
for (let i = 1; i <= N; i++) {
  g.call(`__V.start(${i})`); g.pump(3);
  let frames = 0;
  let toggled = 0;
  while (!g.call('__V.over()') && frames < 12000) {
    g.pump(1);
    frames++;
    if (frames % 40 === 0 && toggled < 4) { // real switch clicks mid-flight
      const sw = g.call('__V.switches()')[toggled % Math.max(1, g.call('__V.switches()').length)];
      if (sw) { clickAt(sw.x, sw.y); toggled++; }
    }
  }
  g.pump(60); // result modal timer
  if (g.call('__V.won()')) solved.push(i); else fails.push('L' + i + ' not won (processed ' + g.call('__V.processed()') + ', mistakes ' + g.call('__V.mistakes()') + ')');
}
T('levels-won', solved.length === N, solved.length + '/' + N + ' won:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { won: solved.length + '/' + N, note: 'levels run in the engine loop to natural completion; switches toggled through real canvas clicks mid-flight (routing auto-targets the color-matched bin)' } };
console.log('conveyor-sort: ' + solved.length + '/' + N + ' levels completed with real switch clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
