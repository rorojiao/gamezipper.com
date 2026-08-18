#!/usr/bin/env node
/* chain-reaction verifier — Chain Reaction vs AI: every level solved by BFS over the
 * engine's own tap semantics (handleTap -> simulateChain callback), replayed through
 * real canvas pointer events at cell centers; win = engine's win state. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('chain-reaction', { inject: {
  anchor: 'function handleTap(x,y){',
  exports: `globalThis.__C = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    state: () => state,
    animating: () => animating,
    gridInfo: () => ({ r: gridRows, c: gridColc || gridCols, W: W, H: H }),
    grid: () => grid.map(row => row.map(cell => ({ a: cell.atoms, o: cell.owner, p: cell.popped }))),
    center: (r, c) => { var lv = LEVELS[currentLevel]; var topBar = 60; var cellSize = Math.min((W - 40) / lv.c, (H - topBar - 80) / lv.r, 70); var ox = (W - lv.c * cellSize) / 2; var oy = topBar + (H - topBar - 60 - lv.r * cellSize) / 2; return { x: ox + (c + 0.5) * cellSize, y: oy + (r + 0.5) * cellSize }; }, // must mirror getCellAt's layout (cell cap 70, topBar 60)
    undo: () => undo(),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.game;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__C.n()');
T('levels-exist', N >= 20, 'n=' + N);

const cellCenter = (r, c) => g.call(`__C.center(${r}, ${c})`);
const tapCell = (r, c) => { // real input: canvas pointerdown at the cell center
  const p = cellCenter(r, c);
  cv().dispatch('pointerdown', { clientX: p.x, clientY: p.y, preventDefault() {} });
};

function settle(frames) {
  for (let f = 0; f < (frames || 400); f++) {
    g.pump(1);
    if (g.call('__C.state()') === 'win') return true;
    if (!g.call('__C.animating()')) return false;
  }
  return g.call('__C.state()') === 'win';
}

function solve(i) {
  g.call(`__C.start(${i})`); g.pump(3);
  const seen = new Set();
  let nodes = 0;
  const dfs = (depth) => {
    if (g.call('__C.state()') === 'win') return true;
    if (depth > 7 || nodes > 60000) return false;
    const key = JSON.stringify(g.call('__C.grid()'));
    if (seen.has(key)) return false;
    seen.add(key);
    const gridKey = JSON.stringify(g.call('__C.grid()'));
    const grid = JSON.parse(gridKey);
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) {
      nodes++;
      tapCell(r, c);
      const won = settle(600);
      if (won) return true;
      if (g.call('__C.state()') === 'game' && dfs(depth + 1)) return true;
      // restore THIS snapshot: undo until the grid matches (recursion added taps beyond this one)
      for (let u = 0; u < 12; u++) {
        if (JSON.stringify(g.call('__C.grid()')) === gridKey) break;
        g.call('__C.undo()');
        for (let f = 0; f < 60 && g.call('__C.animating()'); f++) g.pump(1);
      }
    }
    return false;
  };
  return dfs(0);
}

const solved = [];
for (let i = 0; i < N; i++) { if (solve(i)) solved.push(i + 1); else fails.push('L' + (i + 1) + ' unsolved'); }
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('chain-reaction: ' + solved.length + '/' + N + ' levels won via canvas taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
