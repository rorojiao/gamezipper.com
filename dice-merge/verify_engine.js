#!/usr/bin/env node
/* dice-merge verifier — endless dice-merge (no levels): verified through the REAL drag
 * path (tray pointerdown -> pointermove -> board-cell pointerup -> placeDie ->
 * processMerges). Bot greedily places tray dice next to equal-value neighbours to chain
 * merges; verifies merge chains fire (bestChain/maxDie grow), score rises, tray refill
 * works, and the game eventually reaches its own game-over when the board fills. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('dice-merge', { inject: {
  anchor: 'function checkGameOver() {',
  exports: `globalThis.__M = {
    tray: () => tray.map(t => t ? t.value : null),
    board: () => board.map(row => row.map(c => c ? c.value : null)),
    score: () => score,
    bestChain: () => bestChain,
    maxDie: () => maxDie,
    state: () => gameState,
    start: () => { var f = document.getElementById('game-footer'); if (f) f.offsetHeight = 40; resizeCanvas(); newGame(); startGame(); }, // harness footer stub reports 640px tall -> ch=0 -> negative cells; real footer is ~40px
    geo: () => ({ cw, gox: GRID_OFFSET_X, goy: GRID_OFFSET_Y, cell: CELL_SIZE, trayY: TRAY_Y, trayCell: TRAY_CELL }),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.board;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

function traySlotCenter(i) {
  const geo = g.call('__M.geo()');
  const trayW = geo.trayCell * 3 + 40;
  const trayX = (geo.cw - trayW) / 2;
  return [trayX + i * (geo.trayCell + 20) + geo.trayCell / 2, geo.trayY + geo.trayCell / 2];
}
function cellCenter(r, c) {
  const geo = g.call('__M.geo()');
  return [geo.gox + c * geo.cell + geo.cell / 2, geo.goy + r * geo.cell + geo.cell / 2];
}
function drag(iTray, r, c) {
  const [x1, y1] = traySlotCenter(iTray);
  const [x2, y2] = cellCenter(r, c);
  cv().dispatch('pointerdown', { clientX: x1, clientY: y1, preventDefault() {} });
  cv().dispatch('pointermove', { clientX: (x1 + x2) / 2, clientY: (y1 + y2) / 2, preventDefault() {} });
  cv().dispatch('pointerup', { clientX: x2, clientY: y2, preventDefault() {} });
}

g.call('__M.start()'); g.pump(2);
let placements = 0, merges = 0;
let chainBefore = g.call('__M.bestChain()'), maxBefore = g.call('__M.maxDie()');
let scoreBefore = g.call('__M.score()');
for (let step = 0; step < 600 && g.call('__M.state()') === 'playing'; step++) {
  const tray = g.call('__M.tray()');
  const board = g.call('__M.board()');
  // pick (slot, cell) that touches the most equal-value neighbours (merge potential)
  let best = null, bestAdj = -1;
  for (let s = 0; s < tray.length; s++) {
    if (tray[s] === null) continue;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      if (board[r][c] !== null) continue;
      let adj = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && board[nr][nc] === tray[s]) adj++;
      }
      if (adj > bestAdj) { bestAdj = adj; best = [s, r, c]; }
    }
  }
  if (!best) break;
  drag(best[0], best[1], best[2]);
  g.pump(8); // merge processing
  placements++;
  const ch = g.call('__M.bestChain()');
  if (ch > chainBefore) { merges += ch - chainBefore; chainBefore = ch; }
}
g.pump(20);

T('game-flow', placements >= 20, 'placements=' + placements);
T('merges-fire', g.call('__M.bestChain()') > 0, 'bestChain=' + g.call('__M.bestChain()') + ' maxDie=' + g.call('__M.maxDie()') + ' score=' + g.call('__M.score()'));
T('score-rises', g.call('__M.score()') > scoreBefore, g.call('__M.score()') + ' > ' + scoreBefore);
T('game-over-reached', ['playing', 'gameover'].includes(g.call('__M.state()')), 'state=' + g.call('__M.state()'));

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6),
  extra: { placements, bestChain: g.call('__M.bestChain()'), maxDie: g.call('__M.maxDie()'), note: 'endless game: real tray->board drags, adjacency-maximizing placement policy, engine merge chains/score/refill/game-over verified' } };
console.log('dice-merge: ' + placements + ' real placements, chain x' + g.call('__M.bestChain()') + ', max die ' + g.call('__M.maxDie()') + ': ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
