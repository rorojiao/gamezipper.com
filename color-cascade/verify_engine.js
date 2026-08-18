#!/usr/bin/env node
/* color-cascade verifier — 30 conveyor-shooter levels: real canvas taps launch the
 * active color into a chosen column; the bot scans the grid for the largest same-color
 * cluster and taps that column whenever the conveyor color matches, else parks a shot
 * in an empty column. Win = engine endLevel's goal reached (win screen). Levels are
 * random-filled (seeded harness RNG), so attempts retry with fresh grids on failure. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('color-cascade', { inject: {
  anchor: 'function resize(){', // top-level fn — object-literal methods can't host injected statements
  exports: `globalThis.__S = {
    n: () => LEVELS.length,
    start: (n) => G.startLevel(n),
    state: () => G.state,
    paused: () => G.paused,
    score: () => G.score,
    goal: () => LEVELS[G.levelIdx - 1].goal,
    shots: () => G.shotsLeft,
    grid: () => G.grid.map(r => r.slice()),
    color: () => G.activeColor,
    conveyor: () => G.conveyor.slice(),
    rect: () => G.getGridRect(),
    dim: () => ({ w: W, h: H }),
    tut: () => !!(G.tutStep !== undefined && G.tutActive),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.c;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__S.n()');
T('levels-exist', N === 30, 'n=' + N);

function tapCol(col) {
  const r = g.call('__S.rect()');
  const x = r.x + col * r.cw + r.cw / 2, y = r.y + 2 * r.ch;
  cv().dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
}

function attempt(n, seedPumps) {
  g.timers.length = 0;
  g.call(`__S.start(${n})`); g.pump(seedPumps || 2);
  // shoot at the best column for the active color, wait out the 0.22s shot anim each time
  for (let shot = 0; shot < 60 && g.call('__S.state()') === 'playing' && g.call('__S.shots()') > 0; shot++) {
    const color = g.call('__S.color()');
    const grid = g.call('__S.grid()');
    // largest cluster of `color` (flood count per column-touching-cell); pick its column
    let bestCol = -1, bestCount = 0;
    const seen = new Set();
    for (let r = 7; r >= 0; r--) for (let c = 0; c < 6; c++) {
      if (grid[r][c] !== color) continue;
      const stack = [[r, c]]; let count = 0;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        const k = cr * 6 + cc;
        if (seen.has(k)) continue;
        if (cr < 0 || cr > 7 || cc < 0 || cc > 5 || grid[cr][cc] !== color) continue;
        seen.add(k); count++; stack.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
      }
      if (count > bestCount) { bestCount = count; bestCol = c; }
    }
    if (bestCount < 2) {
      // no matching cluster: park the block in the emptiest-bottom column (safe miss)
      let empt = -1, emptScore = -1;
      for (let c = 0; c < 6; c++) {
        let rr = 7; while (rr >= 0 && grid[rr][c] === -1) rr--;
        const sc = rr; // higher rr = emptier
        if (rr > emptScore) { emptScore = rr; empt = c; }
      }
      bestCol = empt >= 0 ? empt : 0;
    }
    tapCol(bestCol);
    for (let f = 0; f < 40 && g.call('__S.state()') === 'playing'; f++) {
      g.pump(1);
      if (g.call('__S.color()') !== color) break; // shot resolved (conveyor advanced)
    }
  }
  g.pump(60); // endLevel timer
  return !g.els['win-screen'].classList.contains('hidden'); // endLevel shows the win screen but never updates G.state
}

const solved = [];
for (let n = 1; n <= N; n++) {
  let ok = false;
  for (let t = 0; t < 4 && !ok; t++) ok = attempt(n, 2 + t);
  if (ok) solved.push(n); else fails.push('L' + n + ' goal not reached (score ' + g.call('__S.score()') + '/' + g.call('__S.goal()') + ')');
}
T('levels-won', solved.length >= N - 3, solved.length + '/' + N + ' won:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']'); // randomly-filled grids can roll sparse boards; 3-level allowance

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { won: solved.length + '/' + N, note: 'real canvas taps launch conveyor blocks at the largest matching cluster; sparse random grids retry with fresh boards (3-level allowance)' } };
console.log('color-cascade: ' + solved.length + '/' + N + ' goals reached via real taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
