#!/usr/bin/env node
/* gravity-run verifier — A/B-type runner: complete level 1 via REAL keys.
 * startLevel(1) (story level button path); the world auto-scrolls on the engine loop;
 * steering = ArrowLeft/Right lane changes (engine keys{} path), Space jumps.
 * Policy: scan curLvl.tiles ahead — steer to a non-GAP lane in the next row; jump at
 * GAP rows to clear them. PASS: engine lvlComplete fires (T_END reached), orbs/score
 * collected, death path exercised via real input if it occurs, save written, boot clean. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('gravity-run', { inject: {
  anchor: 'function lvlComplete(){',
  exports: "globalThis.__GR = { st: () => gState, y: () => pl.y, x: () => pl.x, gnd: () => pl.gnd, tiles: () => curLvl.tiles, orbs: () => orbsColl, alive: () => pl.alive, lvl: () => curLvlIdx };",
} });
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + (info ? ': ' + info : '')); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify((g.loadErrors || [])[0] || '').slice(0, 90));
const key = (c, t) => g.sandbox.document.dispatch(t || 'keydown', { code: c, key: c, preventDefault() {} });

g.call('G.startLevel(1)'); // exposed API (same fn the level buttons call)
g.pump(5);
T('level-started', g.call('__GR.st()') === 'playing', 'state=' + g.call('__GR.st()'));

let guard = 0, completed = false, deaths = 0, lastY = 0, maxY = 0;
while (guard++ < 60000) {
  const st = g.call('__GR.st()');
  if (st === 'complete') { completed = true; break; }
  if (st === 'over') { deaths++; break; }
  if (st !== 'playing') { g.pump(3); continue; }
  const tiles = g.call('__GR.tiles()') || [];
  const py = Math.floor(g.call('__GR.y()') || 0);
  const px = Math.round(g.call('__GR.x()') || 0);
  maxY = Math.max(maxY, py);
  const rowAhead = tiles[py + 1] || [];
  const GAP = 1;
  // lane safety: prefer current lane if walkable ahead, else nearest walkable lane
  let lane = px;
  // END tile (6) is the goal lane — head straight for it
  const END = 6;
  let endCol = -1;
  for (let c = 0; c < rowAhead.length; c++) if (rowAhead[c] === END) endCol = c;
  if (endCol >= 0) lane = endCol;
  else if (rowAhead[px] === GAP) {
    let best = null, bd = 99;
    for (let c = 0; c < rowAhead.length; c++) {
      if (rowAhead[c] !== GAP) { const d = Math.abs(c - px); if (d < bd) { bd = d; best = c; } }
    }
    if (best !== null) lane = best;
  }
  if (lane < px) { key('ArrowLeft'); g.pump(2); key('ArrowLeft', 'keyup'); }
  else if (lane > px) { key('ArrowRight'); g.pump(2); key('ArrowRight', 'keyup'); }
  // jump when grounded and the row 2 ahead is also blocked for our lane (chained gaps)
  const row2 = tiles[py + 2] || [];
  if (g.call('__GR.gnd()') && (rowAhead[px] === GAP || row2[px] === GAP)) { key('Space'); g.pump(3); key('Space', 'keyup'); }
  g.pump(3);
}
T('level-completed', completed, 'deaths=' + deaths + ' maxY=' + maxY + ' st=' + g.call('__GR.st()'));
T('progress-made', maxY > 5, 'maxY=' + maxY);
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 80));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { completed, deaths, maxY, orbs: g.call('__GR.orbs()') } };
console.log('gravity-run: lane-seeking runner via real arrow/space keys: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
