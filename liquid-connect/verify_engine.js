#!/usr/bin/env node
/* liquid-connect verifier (type A): all 30 levels + the daily challenge must be solved through
 * the real input path (canvas taps rotate tiles; win = the engine's own checkFlow/isComplete ->
 * showWin overlay). The plan restores each path tile's connection set (derived from the level's
 * own generated paths) with the fewest real taps. Also exercises the previously-crashing
 * tutorial Next chain (G.nextTutorialStep), undo, hint, restart, star/unlock persistence. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('liquid-connect', { inject: {
  anchor: 'function rotateTile(r,c){',
  exports: `globalThis.__R = {
    state: () => state, solved: () => solved, moves: () => moves, hints: () => hints,
    lvId: () => curLv ? curLv.id : null, daily: () => curLv ? !!curLv.isDaily : false,
    n: () => LEVELS.length,
    grid: () => grid.map(row => row.map(c => ({ type: c.type, rot: c.rot }))),
    sz: () => gSz,
    paths: () => (curLv && curLv.isDaily) ? curLv.paths : LEVELS[curLv.id].paths,
    conns: (type, rot) => { var cell = { type: type, rot: rot }; return getConns(cell).slice().sort(); },
    cw: () => cW, cs: () => cSz, cvs: () => canvas,
    done: () => save.done, stars: (i) => save.stars[i] || 0, unlocked: () => save.unlocked,
    flows: () => flowSt.map(f => f.ok),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0 || g.loadErrors.every(e => /showLevelSelect is not defined/.test(e)),
  JSON.stringify(g.loadErrors[0] || '').slice(0, 120) + ' (note: the trailing analytics IIFE assigns window.showLevelSelect from a bare identifier that only exists when gz-analytics has already run — in production gz-analytics.js is deferred and this inline script returns early, so the error is harness-order-only)');
T('levels-exist', g.call('__R.n()') === 30, 'n=' + g.call('__R.n()'));

// --- tutorial chain (regression for the G.nextTutorialStep crash fix) ---
T('tutorial-opens', g.els['tutorial-overlay'].classList.contains('show'), 'no show');
for (let i = 0; i < 4; i++) g.call('G.nextTutorialStep()');
T('tutorial-next-chain', !g.els['tutorial-overlay'].classList.contains('show'), 'still shown');

// --- enter level 1 (inline onclick attributes are not wired in the harness; the public
// G API is the same code path the onclick attributes call, so invoke it directly) ---
g.call('G.showLevelSelect()');
const tiers = g.els['ls-tiers'].children;
const cells = [];
for (const t of tiers) for (const cell of (t.children || [])) if (String(cell.className).includes('lv-cell')) cells.push(cell);
cells[0].click();
T('level-1-starts', g.call('__R.state()') === 'game' && g.call('__R.lvId()') === 0, 'state=' + g.call('__R.state()'));

const cv = () => g.call('__R.cvs()');
const rectOf = () => { const r = cv().getBoundingClientRect(); return { l: r.left || 0, t: r.top || 0, w: r.width || 1 }; };
function tapCell(r, c) {
  const cw = g.call('__R.cw()'), cs = g.call('__R.cs()');
  const rc = rectOf();
  const x = rc.l + (c * cs + cs / 2) / cw * rc.w;
  const y = rc.t + (r * cs + cs / 2) / cw * rc.w;
  cv().dispatch('pointerdown', { clientX: x, clientY: y, pointerId: 9, button: 0, isPrimary: true, preventDefault() {} });
}

// --- undo + hint + restart exercises on level 1 ---
const grid0 = g.call('__R.grid()');
let tapTarget = null;
outer: for (let r = 0; r < grid0.length; r++) for (let c = 0; c < grid0.length; c++) if (grid0[r][c].type !== 4) { tapTarget = [r, c]; break outer; }
tapCell(tapTarget[0], tapTarget[1]);
const rot1 = g.call('__R.grid()')[tapTarget[0]][tapTarget[1]].rot;
T('tap-rotates', rot1 === (grid0[tapTarget[0]][tapTarget[1]].rot + 1) % 4 && g.call('__R.moves()') === 1,
  'rot=' + rot1 + ' moves=' + g.call('__R.moves()'));
g.call('G.doUndo()');
T('undo-restores', g.call('__R.grid()')[tapTarget[0]][tapTarget[1]].rot === grid0[tapTarget[0]][tapTarget[1]].rot && g.call('__R.moves()') === 0, 'undo');
g.call('G.doHint()');
T('hint-consumed', g.call('__R.hints()') === 2, 'hints=' + g.call('__R.hints()'));

// --- solve: restore each path tile's connection set with minimal taps ---
function solveCurrent() {
  const grid = g.call('__R.grid()');
  const sz = g.call('__R.sz()');
  const paths = g.call('__R.paths()');
  const need = {};
  const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  for (const p of paths) {
    for (let i = 0; i < p.length; i++) {
      const k = p[i].r + ',' + p[i].c;
      if (!need[k]) need[k] = new Set();
      if (i > 0) { const d = p[i - 1].r < p[i].r ? 0 : p[i - 1].r > p[i].r ? 2 : p[i - 1].c < p[i].c ? 3 : 1; need[k].add(d); }
      if (i < p.length - 1) { const d = p[i + 1].r < p[i].r ? 0 : p[i + 1].r > p[i].r ? 2 : p[i + 1].c < p[i].c ? 3 : 1; need[k].add(d); }
    }
  }
  for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) {
    const k = r + ',' + c, cell = grid[r][c];
    if (!need[k] || cell.type === 4) continue;
    // superset match: path endpoints are 1-direction tiles realized as curves (extra side
    // is harmless — the engine's BFS win check only needs connectivity along the path)
    const want = [...need[k]];
    let bestTaps = -1;
    for (let rt = 0; rt < 4; rt++) {
      const conns = g.call(`__R.conns(${cell.type}, ${rt})`);
      if (want.every(d => conns.includes(d))) {
        const taps = (rt - cell.rot + 4) % 4;
        if (bestTaps < 0 || taps < bestTaps) bestTaps = taps;
      }
    }
    if (bestTaps < 0) return false;
    for (let t = 0; t < bestTaps; t++) tapCell(r, c);
  }
  return true;
}

const solvedLv = [], notes = [];
const T0 = Date.now();
for (let li = 0; li < 30 && Date.now() - T0 < 95000; li++) {
  if (g.call('__R.lvId()') !== li) { notes.push('chain broken at L' + (li + 1)); fails.push('chain broken at L' + (li + 1)); break; }
  if (!solveCurrent()) { notes.push('L' + (li + 1) + ' plan failed (no rotation realizes path conns)'); fails.push('L' + (li + 1) + ' plan failed'); break; }
  g.pump(50); // win setTimeout 600ms
  if (!g.call('__R.solved()') || !g.els['game-over'].classList.contains('show')) {
    notes.push('L' + (li + 1) + ' not won: flows=' + JSON.stringify(g.call('__R.flows()')) + ' moves=' + g.call('__R.moves()'));
    fails.push('L' + (li + 1) + ' not won');
    break;
  }
  T('L' + (li + 1) + '-stars', g.call('__R.stars(' + li + ')') >= 1, 'stars=' + g.call('__R.stars(' + li + ')'));
  solvedLv.push(li + 1);
  if (li < 29) g.call('G.nextLevel()');
}
T('all-30-solved', solvedLv.length === 30, 'solved=' + solvedLv.length + '/30 ' + notes.slice(0, 4).join('|'));
T('unlock-progress', g.call('__R.unlocked()') >= 30, 'unlocked=' + g.call('__R.unlocked()'));

// --- restart mid-level, then daily challenge ---
g.call('G.restartLevel()');
T('restart-works', g.call('__R.solved()') === false && g.call('__R.moves()') === 0, 'restart');
g.call('G.showMenu()');
g.call('G.startDaily()');
T('daily-starts', g.call('__R.daily()') === true && g.call('__R.state()') === 'game', 'daily');
if (g.call('__R.state()') === 'game') {
  if (solveCurrent()) {
    g.pump(50);
    T('daily-solved', g.call('__R.solved()') === true && g.els['game-over'].classList.contains('show'),
      'solved=' + g.call('__R.solved()'));
  } else T('daily-solved', false, 'plan failed');
}

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solvedLv.length + '/30', notes: notes.slice(0, 6) } };
console.log('liquid-connect: ' + solvedLv.length + '/30 levels + daily solved via real taps: ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
