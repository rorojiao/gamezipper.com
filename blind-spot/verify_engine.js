#!/usr/bin/env node
/* blind-spot verifier — every level's guard-sight puzzle solved by computing a hitting
 * set over the engine's own visionMap rays (cells before the gem on each exposing ray),
 * then replaying the solution through real canvas clicks (handleTap -> placeBlock ->
 * checkWin). Also checks the block budget is enforced. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('blind-spot', { inject: {
  anchor: 'function computeVision(){',
  exports: `globalThis.__S = {
    n: () => LEVELS.length,
    load: (i) => loadLevel(i),
    blocks: () => placedBlocks.slice(),
    exposed: () => gemExposed,
    won: () => isWon,
    budget: () => LEVELS[currentLevel].budget,
    geo: () => ({ cell: cellSize, g: gridSize }),
    rays: () => { var out = []; var lvl = LEVELS[currentLevel]; var gem = lvl.gem;
      for (var gi in visionMap) for (var d in visionMap[gi]) { var cells = visionMap[gi][d];
        var gi2 = cells.findIndex(c => c.r === gem[0] && c.c === gem[1]); if (gi2 >= 0) out.push(cells.slice(0, gi2)); } // rays run PAST the gem — only cells before it shield
      return out; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const canvasEl = () => g.els.game;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = g.call('__S.n()');
T('levels-exist', N === 30, 'n=' + N);

const tapCell = (r, c) => { // real input path: canvas click at the cell's center
  const geo = g.call('__S.geo()');
  const px = c * geo.cell + geo.cell / 2, py = r * geo.cell + geo.cell / 2;
  canvasEl().dispatch('click', { clientX: px, clientY: py, preventDefault() {} });
};

function hittingSet(rays) { // smallest set of cells intersecting every ray (DFS, dedup shares)
  let best = null;
  const rec = (i, chosen) => {
    if (best && chosen.length >= best.length) return;
    if (i === rays.length) { best = chosen.slice(); return; }
    for (const cell of rays[i]) {
      const k = cell.r + ',' + cell.c;
      if (!chosen.includes(k)) chosen.push(k);
      rec(i + 1, chosen);
      if (!chosen.includes(k) || chosen[chosen.length - 1] !== k) { /* unchanged */ }
      else chosen.pop();
    }
  };
  rec(0, []);
  return best;
}

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__S.load(${i})`);
  const rays = g.call('__S.rays()');
  if (!rays.length) { fails.push('L' + (i + 1) + ' gem already hidden (no exposing rays — level trivial/broken)'); }
  const sol = hittingSet(rays);
  if (!sol || sol.length > g.call('__S.budget()')) { fails.push('L' + (i + 1) + ' no solution within budget (need ' + (sol ? sol.length : '?') + ')'); continue; }
  for (const k of sol) { const [r, c] = k.split(',').map(Number); tapCell(r, c); }
  g.pump(2);
  if (g.call('__S.won()')) solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' replay did not win (exposed=' + g.call('__S.exposed()') + ')');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

// budget enforcement: load L1, exhaust the budget, one more tap must be rejected
g.call('__S.load(0)');
const b = g.call('__S.budget()');
for (let k = 0; k < b; k++) { tapCell(2, 2 + k); } // unlikely to all be occupied/walls on L1 (empty walls)
for (let k = 0; k < 3; k++) tapCell(5, 1 + k);
T('budget-enforced', g.call('__S.blocks()').length <= b, 'blocks=' + g.call('__S.blocks()').length + ' budget=' + b);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('blind-spot: ' + solved.length + '/' + N + ' levels solved via hitting-set + canvas clicks: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
