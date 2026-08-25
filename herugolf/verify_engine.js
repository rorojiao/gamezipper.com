#!/usr/bin/env node
/* herugolf verifier — replay each level's embedded solution (per-ball segments) via the
 * engine's own window-pointerdown handler with real-shaped events at cell centers:
 * tap ball cell to activate it, then tap each segment endpoint; engine shoot() validates
 * the physics (straight line, walls, strictly decreasing lengths, no immediate reverse);
 * win = engine checkWin -> #win-overlay unhidden. loadLevel(i) is navigation-only. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('herugolf', { inject: {
  anchor: 'function loadLevel(',
  exports: `globalThis.__T = {
    n: () => LEVELS.length,
    start: (i) => loadLevel(i),
    sol: () => LEVELS[state.levelIdx].solution,
    won: () => !document.getElementById('win-overlay').classList.contains('hidden'),
    tap: (r, c) => handlePointer({ preventDefault() {}, clientX: c * CELL + CELL / 2, clientY: r * CELL + CELL / 2 }),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const tap = (r, c) => g.call(`__T.tap(${r}, ${c})`);

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
// harness fidelity: no real AudioContext — engine BGM.scheduler reads audioCtx.currentTime
// unguarded; provide the minimal stub a browser provides (same as initAudio's user-gesture path)
g.call(`(function(){ window.AudioContext = window.AudioContext || function(){
  this.currentTime = 0; this.destination = {}; this.state = 'running';
  this.resume = () => Promise.resolve();
  this.createOscillator = () => ({ frequency: {}, type: '', connect(){}, start(){}, stop(){} });
  this.createGain = () => ({ gain: { value: 0, setValueAtTime(){} }, connect(){} });
}; initAudio(); })()`);
const N = g.call('__T.n()');
T('levels-exist', N > 0, 'n=' + N);

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__T.start(${i})`);
  g.pump(2);
  const sol = g.call('__T.sol()'); // [{ball, hole, path, segments:[{dir,len}]}]
  for (const s of sol) {
    tap(s.ball[0], s.ball[1]); // activate this ball (switches active ball since path empty)
    let cur = [s.ball[0], s.ball[1]];
    for (const seg of s.segments) {
      const to = [cur[0] + seg.dir[0] * seg.len, cur[1] + seg.dir[1] * seg.len];
      tap(to[0], to[1]); // shoot one full segment
      cur = to;
    }
  }
  g.pump(3);
  if (g.call('__T.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' not won');
}
T('all-levels-won', solved.length === N, solved.length + '/' + N + ' missing:[' +
  [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('herugolf: ' + solved.length + '/' + N + ' levels solved via real segment taps (physics-validated): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
