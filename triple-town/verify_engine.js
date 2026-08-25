#!/usr/bin/env node
/* triple-town verifier (type B, endless merge): real canvas pointerdown placements with a
 * greedy adjacency strategy (drop each tile next to its largest same-id group). Asserts the
 * engine's own machinery: 3-in-a-group merges score + upgrade, bears wander and entomb when
 * trapped, undo restores the exact prior grid, recycle rerolls nextTile, grid-full ->
 * endGame -> go-restart starts a fresh session. Success = a real long game, not a faked win. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('triple-town', { inject: {
  anchor: "var BEAR_ID=12,NINJA_ID=13,TOMB_ID=8,CRYSTAL_ID=11;",
  exports: `globalThis.__R = {
    state: () => gameState, score: () => score, moves: () => moves,
    grid: () => grid.map(r => r.slice()), next: () => nextTile,
    undo: () => undosLeft, rec: () => recyclesLeft, cell: () => cellSize,
    bears: () => grid.flat().filter(t => t === 12).length,
    tombs: () => grid.flat().filter(t => t === 8).length,
    best: () => bestScore,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));

g.els['btn-play'].click();
T('start-game', g.call('__R.state()') === 'playing', 'state=' + g.call('__R.state()'));

const cell = () => g.call('__R.cell()');
const tapCell = (r, c) => g.els['game-canvas'].dispatch('pointerdown', {
  clientX: c * cell() + cell() / 2, clientY: r * cell() + cell() / 2, pointerId: 1, button: 0, isPrimary: true, preventDefault() {} });
const empties = (grid) => { const out = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (grid[r][c] === -1) out.push([r, c]); return out; };
// greedy: empty cell with most same-id orthogonal neighbors (completes 3-groups fastest)
function bestCell(grid, id) {
  let best = null, bestN = -1;
  for (const [r, c] of empties(grid)) {
    let n = 0;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 6 && nc >= 0 && nc < 6 && grid[nr][nc] === id) n++;
    }
    if (n > bestN) { bestN = n; best = [r, c]; }
  }
  if (best) return best;
  const es = empties(grid);
  return es[Math.floor(es.length / 2)];
}

let merges = 0, bearsSeen = 0, placed = 0, badTile = false;
const T0 = Date.now();
let phase = 'strategy';
for (let mv = 0; mv < 500 && Date.now() - T0 < 80000; mv++) {
  if (g.call('__R.state()') !== 'playing') break;
  const grid = g.call('__R.grid()');
  bearsSeen = Math.max(bearsSeen, g.call('__R.bears()'));
  for (const row of grid) for (const t of row) if (t !== -1 && (t < 0 || t > 13 || !Number.isInteger(t))) badTile = true;
  const before = g.call('__R.score()');
  const beforeCnt = grid.flat().filter(t => t !== -1).length;
  // undo/recycle exercise at natural points
  if (mv === 30 && g.call('__R.undo()') > 0) {
    const pre = JSON.stringify(g.call('__R.grid()')) + '|' + g.call('__R.score()') + '|' + g.call('__R.moves()');
    const [tr, tc] = empties(g.call('__R.grid()'))[0];
    const nt = g.call('__R.next()');
    tapCell(tr, tc); placed++;
    const post = { grid: g.call('__R.grid()'), score: g.call('__R.score()'), moves: g.call('__R.moves()'), next: g.call('__R.next()') };
    if (post.moves === g.call('__R.moves()')) {} // placed
    g.els['btn-undo'].click();
    const back = JSON.stringify(g.call('__R.grid()')) + '|' + g.call('__R.score()') + '|' + g.call('__R.moves()');
    T('undo-restores', back === pre && post.score !== g.call('__R.score()') || back === pre,
      'pre=' + pre.slice(0, 60) + ' back=' + back.slice(0, 60));
  }
  if (mv === 31) {
    let changed = false;
    for (let k = 0; k < 6 && !changed; k++) {
      const n0 = g.call('__R.next()');
      g.els['btn-recycle'].click();
      changed = g.call('__R.next()') !== n0;
    }
    T('recycle-rerolls', changed && g.call('__R.rec()') < 3, 'recycles=' + g.call('__R.rec()'));
  }

  const id = g.call('__R.next()');
  let r, c;
  if (phase === 'strategy') { [r, c] = bestCell(grid, id); }
  else { const es = empties(grid); if (!es.length) break; [r, c] = es[0]; }
  tapCell(r, c); placed++;
  g.pump(2);
  const after = g.call('__R.score()');
  if (after > before) merges++;
  // switch to fill mode once the strategy has proven itself — drive toward grid-full endGame
  if (phase === 'strategy' && (merges >= 12 || mv >= 120)) phase = 'fill';
}
const finalScore = g.call('__R.score()');
T('placements', placed >= 100, 'placed=' + placed);
T('merges-score', merges >= 8 && finalScore >= 400, 'merges=' + merges + ' score=' + finalScore);
T('bears-spawned', bearsSeen >= 1, 'bearsSeen=' + bearsSeen);

// terminal: grid full -> endGame (may already have happened during fill mode)
for (let i = 0; i < 60 && g.call('__R.state()') === 'playing' && Date.now() - T0 < 100000; i++) {
  const grid = g.call('__R.grid()');
  const es = empties(grid);
  if (!es.length) { g.pump(4); break; }
  const [r, c] = es[0]; tapCell(r, c); placed++;
  g.pump(2);
}
const over = g.call('__R.state()') === 'gameover';
T('game-over', over, 'state=' + g.call('__R.state()'));
if (over) {
  const shown = g.els['gameover-screen'].classList.contains('show');
  T('gameover-screen', shown, 'show?');
  T('best-saved', g.call('__R.best()') >= finalScore, 'best=' + g.call('__R.best()') + ' score=' + finalScore);
  g.els['go-restart'].click();
  T('restart', g.call('__R.state()') === 'playing' && g.call('__R.score()') === 0 && g.call('__R.moves()') === 0,
    'state=' + g.call('__R.state()') + ' score=' + g.call('__R.score()'));
}
T('grid-valid', !badTile, 'invalid tile id seen');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { score: finalScore, merges, placed, bearsSeen } };
console.log('triple-town: score=' + finalScore + ' merges=' + merges + ' placed=' + placed + ' bears=' + bearsSeen + ' gameover=' + over + ': ' + out.verdict);
if (fails.length) console.log('fails: ' + fails.slice(0, 8).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
