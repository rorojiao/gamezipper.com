#!/usr/bin/env node
/* inertia verifier — 27 levels: replay each level's authored solution (dir list) through
 * the real on-screen d-pad buttons (dUp/dDown/dLeft/dRight onclick -> doMove), waiting out
 * the engine's slide animation in its rAF loop; win = onWin -> save.solved[level.id]. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('inertia', { inject: {
  anchor: 'function loadLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => loadLevel(i),
    id: (i) => LEVELS[i].id,
    sol: (i) => JSON.stringify(LEVELS[i].solution || []),
    won: (id) => !!save.solved[id],
    animActive: () => !!anim,
    atExit: () => ball[0] === exitPos[0] && ball[1] === exitPos[1],
    atExit: () => ball[0] === exitPos[0] && ball[1] === exitPos[1],
    gems: () => collected.size + '/' + gemsList.length,
    dead: () => dead,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 27, 'n=' + N);
const BTN = ['dUp', 'dDown', 'dLeft', 'dRight']; // dir 0..3

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const sol = JSON.parse(g.call(`__T.sol(${i})`));
  if (!sol.length) { fails.push('L' + (i + 1) + ' no stored solution'); continue; }
  for (const dir of sol) {
    g.els[BTN[dir]].dispatch('click', {});
    // slide anim runs in rAF and scales with path length (up to ~0.9s on 9x9); poll until the engine clears it
    for (let w = 0; w < 40 && g.call('__T.animActive()'); w++) g.pump(10);
    g.pump(3);
  }
  g.pump(60); // onWin overlay setTimeout 680ms
  if (g.call(`__T.won(__T.id(${i}))`)) solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' not won (atExit=' + g.call('__T.atExit()') + ' gems=' + g.call('__T.gems()') + ' dead=' + g.call('__T.dead()') + ' moves=' + sol.length + ')');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('inertia: ' + solved.length + '/' + N + ' levels solved via real d-pad button taps (authored solution replay): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
