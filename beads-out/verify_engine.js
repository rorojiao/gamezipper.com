#!/usr/bin/env node
/* beads-out verifier — 30 levels solved by DFS through the engine's own getValidMoves/
 * tapBead, then each solution REPLAYED through real canvas mousedown events (hit-test ->
 * handleInput -> tapBead) to reach the 'complete' screen. Backtracking uses the engine's
 * own undoMove (a shipped game feature, also button-wired). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('beads-out', { inject: {
  anchor: 'function getValidMoves(){',
  exports: `globalThis.__B = {
    n: () => LEVELS.length,
    start: (i) => startLevel(i),
    moves: () => getValidMoves(),
    tap: (id) => tapBead(id),
    undo: () => undoMove(),
    reset: () => resetLevel(),
    cleared: () => gameState.strings.every(s => s.cleared),
    screen: () => currentScreen,
    pos: (id) => ({ x: gridToCanvasX(gameState.beadMap[id].x), y: gridToCanvasY(gameState.beadMap[id].y), r: getBeadRadius() }),
    key: () => gameState.beads.map(b => b.removed ? 1 : 0).join(''),
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const canvas = g.els.gameCanvas;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 90));
const N = g.call('__B.n()');
T('levels-exist', N === 30, 'n=' + N);

const tapInput = (id) => { // the real input path: canvas mousedown on the bead
  const p = g.call(`__B.pos(${id})`);
  canvas.dispatch('mousedown', { offsetX: p.x, offsetY: p.y, clientX: p.x, clientY: p.y, button: 0, preventDefault() {} });
};

function solve(i) { // DFS with engine undo for backtracking; returns array of tap ids or null
  g.call(`__B.start(${i})`);
  const seen = new Set();
  let nodes = 0;
  const dfs = () => {
    if (g.call('__B.cleared()')) return [];
    if (++nodes > 20000) return null;
    const k = g.call('__B.key()');
    if (seen.has(k)) return null;
    seen.add(k);
    for (const id of g.call('__B.moves()')) {
      g.call(`__B.tap(${id})`);
      const r = dfs();
      if (r) return [id, ...r];
      g.call('__B.undo()');
    }
    return null;
  };
  return dfs();
}

const solved = [];
for (let i = 0; i < N; i++) {
  const sol = solve(i);
  if (!sol) { fails.push('L' + (i + 1) + ' unsolvable'); continue; }
  // replay the whole solution through real input events and confirm the complete screen
  g.call(`__B.start(${i})`); g.pump(2);
  for (const id of sol) { tapInput(id); g.pump(2); }
  g.pump(40); // showComplete fires from a 400ms timer
  if (g.call('__B.screen()') === 'complete') solved.push(i + 1);
  else fails.push('L' + (i + 1) + ' replay did not complete (screen=' + g.call('__B.screen()') + ')');
}
T('levels-completed', solved.length === N, solved.length + '/' + N + (solved.length < N ? ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']' : ''));

// undo is a working safety net (tap one valid bead, undo, moves state restored)
g.call('__B.start(0)'); g.pump(2);
const m0 = g.call('__B.moves()').join(',');
g.call('__B.tap(' + (g.call('__B.moves()')[0]) + ')');
g.call('__B.undo()');
const m1 = g.call('__B.moves()').join(',');
T('undo-restores', m0 === m1, m0 + ' -> ' + m1);

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 90));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('beads-out: ' + solved.length + '/' + N + ' levels solved + replayed via canvas input: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
