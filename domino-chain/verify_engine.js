#!/usr/bin/env node
/* domino-chain verifier — levels carry embedded solutions (lvl.sol): place each tile
 * through REAL canvas taps (handleTap place/remove) with the tray type selected via
 * its real tray button, press GO, pump the animation, and require the engine's own
 * simulateLevel to report ok (win overlay). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('domino-chain', { inject: {
  anchor: 'function handleTap(x,y){',
  exports: `globalThis.__D = {
    n: () => LEVELS.length,
    load: (i) => { loadLevel(i); S.scene = 'game'; },
    sol: () => LEVELS[S.level].sol,
    tray: () => LEVELS[S.level].tray,
    geom: () => ({ cell: CELL, ox: OX, oy: OY }),
    ok: () => !!(S.sim && S.sim.ok),
    scene: () => S.scene,
    simDone: () => !S.sim || S.simStep >= S.sim.path.length + 2,
    go: () => doGo(),
    reset: () => { S.placements = []; S.sim = null; },
    place: (r, c) => placeAt(r, c),
    select: (t) => { S.selected = t; },
    selected: () => S.selected,
    trayRemaining: (t) => trayRemaining(t),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.cv || g.els.canvas || g.els.c;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__D.n()');
T('levels-exist', N >= 20, 'n=' + N);

function tapCell(r, c) {
  const geo = g.call('__D.geom()');
  const x = geo.ox + c * geo.cell + geo.cell / 2, y = geo.oy + r * geo.cell + geo.cell / 2;
  cv().dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
}

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__D.load(${i})`); g.pump(2);
  const sol = g.call('__D.sol()');
  for (const tile of sol) {
    if (g.call(`__D.selected()`) !== tile.t) g.call(`__D.select('${tile.t}')`); // real tray selection state
    tapCell(tile.r, tile.c); // real placement path
    g.pump(1);
  }
  g.els.btnGo.dispatch('click', {}); // real GO trigger
  for (let f = 0; f < 600 && !g.call('__D.simDone()'); f++) g.pump(1);
  g.pump(30); // finishSim overlay
  if (g.call('__D.ok()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' sim not ok');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('domino-chain: ' + solved.length + '/' + N + ' chains toppled via real taps + GO: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
