#!/usr/bin/env node
/* cave verifier — Corral/Bag puzzles: every level's embedded solution (LEVELS[i].white)
 * is replayed through the engine's real interaction path (canvas clicks cycling
 * UNKNOWN -> SHADE -> CAVE); win = the engine's own checkWin (visibility + connectivity
 * + edge-connected shading). */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('cave', { inject: {
  anchor: 'function checkWin(){',
  exports: `globalThis.__V = {
    n: () => LEVELS.length,
    start: (i) => loadLevel(i),
    states: () => cellStates.map(r => r.slice()),
    geo: () => ({ ox: boardOriginX, oy: boardOriginY, cs: cellSize, w: boardCanvas.width, h: boardCanvas.height }),
    won: () => checkWin(),
    lvl: (i) => LEVELS[i],
    clues: () => clueMap,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
const cv = () => g.els.board || g.els.boardCanvas || g.els.game;

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__V.n()');
T('levels-exist', N === 26, 'n=' + N);

function clickCell(r, c) {
  const geo = g.call('__V.geo()');
  const x = geo.ox + (c + 0.5) * geo.cs, y = geo.oy + (r + 0.5) * geo.cs;
  cv().dispatch('mousedown', { clientX: x, clientY: y, button: 0, preventDefault() {} });
  cv().dispatch('mouseup', { clientX: x, clientY: y, button: 0, preventDefault() {} });
}

const solved = [];
for (let i = 0; i < N; i++) {
  g.call(`__V.start(${i})`); g.pump(2);
  const lvl = g.call(`__V.lvl(${i})`);
  const clues = g.call('__V.clues()');
  const white = new Set((lvl.white || []).map(([r, c]) => r + ',' + c));
  // replay the embedded solution: white cells -> CAVE (two forward cycles from UNKNOWN), others -> SHADE (one cycle)
  for (let r = 0; r < lvl.rows; r++) for (let c = 0; c < lvl.cols; c++) {
    if (clues[r + ',' + c] !== undefined) continue;
    if (white.has(r + ',' + c)) { clickCell(r, c); clickCell(r, c); } // UNKNOWN -> SHADE -> CAVE
    else clickCell(r, c); // UNKNOWN -> SHADE
  }
  g.pump(3);
  if (g.call('__V.won()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' replay not won');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N } };
console.log('cave: ' + solved.length + '/' + N + ' corral puzzles solved via embedded-solution replay: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
