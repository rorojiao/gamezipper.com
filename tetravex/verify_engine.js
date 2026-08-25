#!/usr/bin/env node
/* tetravex verifier — 30 levels: solve each generated tile set with a backtracking
 * search over the tray, then place tiles through the real UI path (tray tile click ->
 * canvas cell pointerdown); win = engine checkWin (all cells filled + all shared edges
 * match) -> state.completedLevels set + win-screen shown. loadLevel(l) is navigation. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('tetravex', { inject: {
  anchor: 'function loadLevel(',
  exports: `globalThis.__T = {
    start: (l) => loadLevel(l),
    snap: () => JSON.stringify({ size: state.size, tray: state.tray }), // engine script is IIFE-wrapped; state only visible via closure
    ok: (l) => !!state.completedLevels[l],
    won: () => document.getElementById('win-screen').style.display !== 'none',
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

// host-side state mirrors for solving (refreshed per level via call)
const st = () => JSON.parse(g.call('__T.snap()'));
function solve(size, tray) {
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const used = new Array(tray.length).fill(false);
  function bt(pos) {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size), c = pos % size;
    for (let i = 0; i < tray.length; i++) {
      if (used[i]) continue;
      const t = tray[i];
      if (c > 0 && grid[r][c - 1].r !== t.l) continue;
      if (r > 0 && grid[r - 1][c].b !== t.t) continue;
      used[i] = true; grid[r][c] = t;
      if (bt(pos + 1)) return true;
      used[i] = false; grid[r][c] = null;
    }
    return false;
  }
  return bt(0) ? grid : null;
}

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const cv = g.els['grid-canvas'];
T('canvas-found', !!cv, 'no grid-canvas');
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: cv.width, height: cv.height, right: cv.width, bottom: cv.height });

const solved = [];
for (let l = 1; l <= 30; l++) {
  g.call(`__T.start(${l})`);
  g.pump(2);
  const s = st();
  const grid = solve(s.size, s.tray);
  if (!grid) { fails.push('L' + l + ' unsolvable tray'); continue; }
  const cellSize = cv.width / s.size;
  for (let r = 0; r < s.size; r++) for (let c = 0; c < s.size; c++) {
    const tile = grid[r][c];
    const idx = s.tray.findIndex(t => t.id === tile.id);
    const trayEl = g.els['tile-tray'].children[idx];
    trayEl.dispatch('click', {}); // select tile
    cv.dispatch('pointerdown', { clientX: c * cellSize + cellSize / 2, clientY: r * cellSize + cellSize / 2, preventDefault() {} }); // place
  }
  g.pump(40); // win reveal is on a 500ms setTimeout
  if (g.call(`__T.ok(${l})`) || g.call('__T.won()')) solved.push(l); else fails.push('L' + l + ' not won');
}
T('all-levels-won', solved.length === 30, solved.length + '/30 missing:[' +
  [...Array(30).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 160));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/30' } };
console.log('tetravex: ' + solved.length + '/30 levels solved via real tray-click + cell-place (edge-match rule-checked): ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
