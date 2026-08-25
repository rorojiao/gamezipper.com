#!/usr/bin/env node
/* numbrix verifier — 27 levels: each level ships its full solution path; fill every
 * non-clue cell through the real input path (canvas pointerdown to select, then digit
 * keydowns — two-digit values typed digit-by-digit like a real player); win =
 * checkWin -> onWin -> SAVE.completed[idx]. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('numbrix', { inject: {
  anchor: 'function loadLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => loadLevel(i),
    sol: (i) => JSON.stringify(LEVELS[i].solution),
    clues: (i) => JSON.stringify([...LEVELS[i].clueSet]),
    geo: () => { const o = gridOrigin(); return [o.x, o.y, o.cs]; },
    won: (i) => !!SAVE.completed[i],
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__T.n()');
T('levels-exist', N === 27, 'n=' + N);
const cv = g.els['cv'];
T('canvas-found', !!cv, 'no cv');
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });
const key = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });
g.call('SAVE.sound = false'); // harness audio stub lacks gain.cancelScheduledValues; a real player can mute (engine setting, not a bypass)

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(7); // virtual clock must pass the engine's 60ms input debounce (Date.now starts at 0 in harness)
  const sol = JSON.parse(g.call(`__T.sol(${i})`));
  const clues = new Set(JSON.parse(g.call(`__T.clues(${i})`)));
  const [ox, oy, cs] = g.call('__T.geo()');
  for (let idx = 0; idx < sol.length; idx++) {
    if (clues.has(idx)) continue;
    const rows = Math.round(Math.sqrt(sol.length)); // square grids only (r===c in all levels)
    const rr = Math.floor(idx / rows), cc = idx % rows;
    cv.dispatch('pointerdown', { clientX: ox + cc * cs + cs / 2, clientY: oy + rr * cs + cs / 2, preventDefault() {} });
    const v = sol[idx];
    const digits = String(v).split('');
    for (const d of digits) { key(d); g.pump(6); } // engine debounces input at 60ms
  }
  g.pump(5);
  if (g.call(`__T.won(${i})`)) solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' not won after filling all non-clue cells');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('numbrix: ' + solved.length + '/' + N + ' levels solved via real cell-select + digit keydowns (path-validity win-checked): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
