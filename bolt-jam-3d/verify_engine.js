#!/usr/bin/env node
/* bolt-jam-3d verifier — 50 ball-sort levels solved by BFS over the engine's own move
 * rules (handleRodClick src/dst pairs — the same function the 3D raycaster invokes),
 * replayed with pumps so match/win timers fire. THREE.js cannot run headless, so its
 * local script is swapped for a recursive no-op mock via harness scriptOverrides —
 * only rendering is stubbed; game state and rules run unmodified. */
const THREE_MOCK = `
const __mk = () => new Proxy(function(){}, { get: (t, p) => { if (p === Symbol.toPrimitive) return () => 0; if (p === 'length' || p === 'size') return 0; return __mk(); }, apply: () => __mk(), construct: () => __mk(), set: () => true });
var THREE = new Proxy({}, { get: (t, p) => { if (p === 'REVISION') return 'mock'; return class { constructor() { return __mk(); } }; } });
`;
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('bolt-jam-3d', { scriptOverrides: { 'three.min.js': THREE_MOCK },
  inject: { anchor: 'function checkWin() {',
    exports: `globalThis.__J = {
      n: () => LEVELS.length,
      state: () => gameState,
      rods: () => rodDisks.map(r => r.slice()),
      cap: () => capacity,
      click: (i) => handleRodClick(i),
    };` } });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('typeof __J !== "undefined" ? __J.n() : -1');
T('levels-exist', N === 50, 'n=' + N);

function startLevel(i) {
  g.call(`startLevel(${i + 1})`); // engine's own starter — builds scene against the THREE mock
  g.pump(2);
}

// mirror of the engine rules for search: move top->non-full rod; top-cap same color clears
function mirrorMove(rods, cap, src, dst) {
  if (src === dst || !rods[src].length || rods[dst].length >= cap) return null;
  const next = rods.map(r => r.slice());
  next[dst].push(next[src].pop());
  const st = next[dst];
  if (st.length >= cap && st.slice(-cap).every(c => c === st[st.length - cap])) next[dst].splice(st.length - cap, cap);
  return next;
}
function solvedState(rods) { return rods.every(r => r.length === 0); }
function hash(rods) { return rods.map(r => r.join(',')).join('|'); }

function solveLevel(i) {
  startLevel(i);
  const start = g.call('__J.rods()'), cap = g.call('__J.cap()');
  const seen = new Set();
  let nodes = 0, found = null;
  const h = (rods) => rods.reduce((n, r) => n + r.length, 0); // disks remaining
  const stack = [{ rods: start, path: [] }];
  while (stack.length && nodes < 1500000 && !found) {
    const { rods, path } = stack.pop();
    const k = hash(rods);
    if (seen.has(k)) continue;
    seen.add(k);
    if (solvedState(rods)) { found = path; break; }
    const succ = [];
    for (let s = 0; s < rods.length; s++) {
      if (!rods[s].length) continue;
      for (let d = 0; d < rods.length; d++) {
        if (rods[d].length && rods[d][rods[d].length - 1] !== rods[s][rods[s].length - 1]) continue;
        const next = mirrorMove(rods, cap, s, d);
        if (!next) continue;
        nodes++;
        if (seen.has(hash(next))) continue;
        // prefer states with fewer disks left (clearing rods), then longer runs on dst
        succ.push({ rods: next, path: path.concat([[s, d]]), pri: h(next) * 10 - (next[d].length || 0) });
      }
    }
    succ.sort((a, b) => b.pri - a.pri); // higher pri = pushed later = explored first (stack)
    for (const su of succ) stack.push(su);
  }
  if (!found) return false;
  for (const [s, d] of found) { g.call(`__J.click(${s})`); g.call(`__J.click(${d})`); g.pump(30); }
  g.pump(40);
  return g.call('__J.state()') === 'win';
}

const solved = [];
for (let i = 0; i < N; i++) { if (solveLevel(i)) solved.push(i + 1); else fails.push('L' + (i + 1) + ' unsolved'); }
T('levels-solved', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N, note: 'THREE swapped for a no-op mock (rendering only) via scriptOverrides; all moves replayed through the engine rod-click API with match/win timers pumped' } };
console.log('bolt-jam-3d: ' + solved.length + '/' + N + ' levels solved via engine rod clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
