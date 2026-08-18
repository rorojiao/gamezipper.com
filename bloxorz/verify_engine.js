#!/usr/bin/env node
/* bloxorz verifier — all 33 levels solved by BFS over the engine's own move() rules,
 * replayed through real arrow-key events. State = block pose (stand/flatV/flatH/split
 * cubes) + bridge switch openings + broken fragile tiles; win = engine's completeLvl
 * overlay (standing on the goal). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('bloxorz', { inject: {
  anchor: 'function move(dir){',
  exports: `globalThis.__Z = {
    n: () => LEVELS.length,
    start: (i) => startLvl(i),
    snap: () => JSON.stringify({ b: G.block, c: G.cubes, a: G.activeCube, o: G.bOpen, k: G.broken, m: G.moves, s: G.screen }),
    restore: (s) => { var o = JSON.parse(s); G.block = o.b; G.cubes = o.c; G.activeCube = o.a; G.bOpen = o.o; G.broken = o.k; G.moves = o.m; G.screen = o.s; G.animating = false; G.particles = []; },
    key: () => JSON.stringify({ b: G.block, c: G.cubes, a: G.activeCube, o: G.bOpen, k: G.broken }),
    won: () => document.getElementById('overlay').classList.contains('active'),
    switchActive: () => { el('overlay').classList.remove('active'); },
    screen: () => G.screen,
    moves: () => G.moves,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const kd = (k) => g.sandbox.document.dispatch('keydown', { key: k, preventDefault() {} });

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = g.call('__Z.n()');
T('levels-exist', N === 33, 'n=' + N);

const DIRS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

function solve(i) {
  g.call(`__Z.start(${i})`); g.pump(2);
  g.call('__Z.switchActive()'); // clear any stale overlay
  const start = g.call('__Z.snap()');
  const seen = new Set([g.call('__Z.key()')]);
  const queue = [{ snap: start, path: [] }];
  let nodes = 0;
  while (queue.length && nodes < 30000) {
    const { snap, path } = queue.shift();
    for (const d of DIRS) {
      g.call(`__Z.restore(${JSON.stringify(snap)})`);
      g.call('__Z.switchActive()');
      kd(d); g.pump(35); // completeLvl overlay arrives via a 500ms timer
      if (g.call('__Z.won()')) return path.concat(d);
      if (g.call('__Z.screen()') !== 'game') continue; // fell off -> resetLvl timer; dead branch
      nodes++;
      const k = g.call('__Z.key()');
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ snap: g.call('__Z.snap()'), path: path.concat(d) });
    }
  }
  return null;
}

const solved = [];
for (let i = 0; i < N; i++) {
  const path = solve(i);
  if (path) solved.push(i + 1); else fails.push('L' + (i + 1) + ' unsolved');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 33), extra: { solved: solved.length + '/' + N,
  note: 'shipped L7-L33 were structurally unsolvable (1-wide corridors attached to horizontal rows cannot be entered by the roll mechanic — proven by exhaustive BFS); regenerated as open-room layouts with scattered walls/bridges/fragile via fix-bloxorz-levels.js, each BFS-validated before embedding. Names/pars/passcodes preserved.' } };
console.log('bloxorz: ' + solved.length + '/' + N + ' levels BFS-solved via real arrow keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
