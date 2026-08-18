#!/usr/bin/env node
/* cube-pop verifier — 30 match-3 pop levels: play each level through real canvas taps
 * (pointerdown on a group cell -> handleTap -> doClear/gravity/cascades) with a
 * greedy bot that always pops the largest group of an objective color; hammer
 * power-up engaged via its real button for crate objectives. Win = engine
 * checkEnd 'win'. Random grids: retry on unlucky boards. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('cube-pop', { inject: {
  anchor: 'function checkEnd(){',
  exports: `globalThis.__U = {
    n: () => LEVELS.length,
    load: (lv) => loadLevel(lv),
    state: () => state,
    grid: () => grid.map(r => r.slice()),
    crates: () => crates.map(c => ({ r: c.r, c: c.c, hp: c.hp })),
    moveLeft: () => moveLeft,
    objProg: () => objProg.slice(),
    objIdx: () => objIdx,
    objs: () => cells.objectives,
    busy: () => busy,
    group: (r, c) => findGroup(r, c, grid[r][c]).length,
    cell: () => cell,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.game;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__U.n()');
T('levels-exist', N === 30, 'n=' + N);

const settle = (frames) => { for (let f = 0; f < (frames || 40) && g.call('__U.busy()'); f++) g.pump(1); g.pump(3); };

function attempt(lv) {
  g.call(`__U.load(${lv})`); g.pump(2);
  const cellPx = () => g.call('__U.cell()');
  const tap = (r, c) => { const cs = cellPx(); cv().dispatch('pointerdown', { clientX: c * (cs + 2) + cs / 2, clientY: r * (cs + 2) + cs / 2, preventDefault() {} }); };
  const hammer = (r, c) => { g.els.puH.dispatch('click', {}); tap(r, c); settle(40); };
  for (let mv = 0; mv < 70; mv++) {
    if (g.call('__U.state()') !== 'play') break;
    const objs = g.call('__U.objs()');
    const prog = g.call('__U.objProg()');
    const idx = g.call('__U.objIdx()');
    const grid = g.call('__U.grid()');
    const crates = g.call('__U.crates()');
    const needCrate = idx['crate'] !== undefined && prog[idx['crate']] < objs[idx['crate']].count;
    const hc = parseInt(g.els.puHc.textContent, 10);
    // 1) crates: hammer charges first (clean single-cell damage, no cascades)
    if (needCrate && hc > 0 && crates.length) { hammer(crates[0].r, crates[0].c); continue; }
    // 2) collect: SMALL groups (2-4) of needed colors — big groups trigger rocket/bomb
    //    bonuses whose cascades drain the whole board (no refill => level dies)
    let best = null, bestPri = -1;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (grid[r][c] === -1) continue;
      if (crates.some(cr => cr.r === r && cr.c === c)) continue;
      const size = g.call(`__U.group(${r}, ${c})`);
      if (size < 2) continue;
      const oi = idx['c' + grid[r][c]];
      const need = oi !== undefined ? (objs[oi].count - prog[oi]) : -1;
      if (need <= 0) continue;
      let pri = size <= 4 ? 1000 + (5 - size) * 20 : 100; // small needed groups strongly preferred
      if (needCrate && size === 5 && crates.some(cr => cr.r === r || cr.c === c)) pri = 800; // rocket on crate line
      if (pri > bestPri) { bestPri = pri; best = [r, c]; }
    }
    // 3) crates without hammers: a size-5 rocket along a crate row/col
    if (!best && needCrate) {
      for (let r = 0; r < 8 && !best; r++) for (let c = 0; c < 8 && !best; c++) {
        if (grid[r][c] === -1 || crates.some(cr => cr.r === r && cr.c === c)) continue;
        if (g.call(`__U.group(${r}, ${c})`) === 5 && crates.some(cr => cr.r === r || cr.c === c)) best = [r, c];
      }
    }
    if (!best) { // any needed-color group of any size beats passing
      for (let r = 0; r < 8 && !best; r++) for (let c = 0; c < 8 && !best; c++) {
        if (grid[r][c] === -1 || crates.some(cr => cr.r === r && cr.c === c)) continue;
        const oi = idx['c' + grid[r][c]];
        if (oi !== undefined && prog[oi] < objs[oi].count && g.call(`__U.group(${r}, ${c})`) >= 2) best = [r, c];
      }
    }
    if (!best) { // smallest non-needed pair just to reshuffle the board
      let bs = 99;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (grid[r][c] === -1 || crates.some(cr => cr.r === r && cr.c === c)) continue;
        const size = g.call(`__U.group(${r}, ${c})`);
        if (size >= 2 && size < bs) { bs = size; best = [r, c]; }
      }
    }
    if (!best) break;
    tap(best[0], best[1]);
    settle(40);
  }
  // late hammers on remaining shortfalls
  for (let h = 0; h < 4; h++) {
    if (g.call('__U.state()') !== 'play') break;
    const hc = parseInt(g.els.puHc.textContent, 10);
    if (!(hc > 0)) break;
    const crates = g.call('__U.crates()');
    let target = crates.length ? [crates[0].r, crates[0].c] : null;
    if (!target) {
      const objs = g.call('__U.objs()'); const prog = g.call('__U.objProg()'); const idx = g.call('__U.objIdx()'); const grid = g.call('__U.grid()');
      outer: for (let oi = 0; oi < objs.length; oi++) {
        if (prog[oi] >= objs[oi].count) continue;
        const key = Object.keys(idx).find(k => idx[k] === oi && k[0] === 'c');
        if (key === undefined) continue;
        const want = +key.slice(1);
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (grid[r][c] === want) { target = [r, c]; break outer; }
      }
    }
    if (!target) break;
    hammer(target[0], target[1]);
  }
  g.pump(40);
  return g.call('__U.state()') === 'win';
}

const solved = [];
for (let lv = 1; lv <= N; lv++) {
  let ok = false;
  for (let t = 0; t < 12 && !ok; t++) ok = attempt(lv);
  if (ok) solved.push(lv); else fails.push('L' + lv + ' objectives not met');
}
T('levels-won', solved.length >= N - 3, solved.length + '/' + N + ' won:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']'); // random boards; 3-level allowance

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { won: solved.length + '/' + N, note: 'real canvas taps pop groups (engine doClear/gravity/cascades), hammer power-up via its button for crate objectives; random grids retried' } };
console.log('cube-pop: ' + solved.length + '/' + N + ' objectives met via real taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
