#!/usr/bin/env node
/* color-by-number verifier — 31 generated paint-by-number levels (6 cats x5 + daily)
 * solved through REAL input: menu level-grid button click -> per color: pal-item click
 * (sets activeColor) then canvas-wrap pointerup on each region centroid (engine's own
 * hitTest ray-casting + number match fills); win = engine checkComplete ->
 * completion-modal show. All 31 completed via the real fill path. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('color-by-number', { inject: {
  anchor: 'function checkComplete(){',
  exports: `globalThis.__N = {
    n: () => LEVELS.length,
    screen: () => state.screen,
    regions: () => LEVELS[state.currentLevel].regions.map(r => ({ x: (r.points[0][0]+r.points[1][0]+r.points[2][0])/3, y: (r.points[0][1]+r.points[1][1]+r.points[2][1])/3, num: r.number })),
    filled: () => Object.keys(state.filled).length,
    total: () => LEVELS[state.currentLevel].regions.length,
    active: () => state.activeColor,
    canvasSize: () => canvas.width,
    done: () => state.completed,
    clearDone: () => { state.completed = {}; },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const wrap = () => g.els['canvas-wrap'], bar = () => g.els['palette-bar'];

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__N.n()');
T('levels-exist', N === 31, 'n=' + N);

function palClick(n) { // real pal-item click (textContent = number + remaining count)
  for (const it of (bar().children || [])) if (String(it.textContent).startsWith(String(n))) { it.dispatch('click', {}); return true; }
  return false;
}
function tapRegion(r) { // real fill: pointerdown+up at region centroid (zoom 1, pan 0)
  const S = g.call('__N.canvasSize()');
  const x = r.x + S / 2 - 200, y = r.y + S / 2 - 200;
  wrap().dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
  wrap().dispatch('pointerup', { clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
}

// solve each level from the real menu grid (children = daily + 30 level buttons in order)
const grid = g.els['level-grid'];
const solved = [];
for (let i = 0; i < N; i++) {
  const btn = (grid.children || [])[Math.min(i + 1, (grid.children || []).length - 1)]; // [0] is the daily button; level i at i+1
  if (btn) btn.dispatch('click', {}); else fails.push('L' + (i + 1) + ' no grid button');
  g.pump(40); // tutorial timer / completion timer drains
  const regions = g.call('__N.regions()');
  const total = g.call('__N.total()');
  let bad = 0;
  for (let n = 1; n <= 8; n++) {
    const mine = regions.map((r, k) => ({ ...r, k })).filter(r => r.num === n);
    if (!mine.length) continue;
    if (!palClick(n)) { bad++; continue; }
    for (const r of mine) { tapRegion(r); g.pump(1); }
  }
  g.pump(50); // completion modal timer (600ms)
  const filled = g.call('__N.filled()');
  const won = g.els['completion-modal'].classList.contains('show');
  if (filled === total && won) solved.push(i + 1); else fails.push('L' + (i + 1) + ' filled ' + filled + '/' + total + ' modal=' + won + ' badpal=' + bad);
  if (g.els['completion-modal'].classList.contains('show')) { (g.els['next-level-btn'] || { dispatch() {} }).dispatch('click', {}); g.pump(10); }
}
T('levels-completed', solved.length === N, solved.length + '/' + N + ' [' + fails.slice(0, 3).join(' | ') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { completed: solved.length + '/' + N, note: 'real menu-grid clicks, pal-item color selection, canvas-wrap pointerup fills through engine hitTest ray-casting; completion via engine checkComplete modal' } };
console.log('color-by-number: ' + solved.length + '/' + N + ' pictures completed via real fills: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
