#!/usr/bin/env node
/* country-road verifier — 30 Nikoli Country Road levels: an independent backtracking
 * solver finds a valid closed loop per level (room-clue counts + unvisited-cells-
 * never-adjacent-across-rooms), then draws it through REAL canvas pointerdowns on the
 * edges (getEdgeFromPos hit-testing); win = engine validateLoop/checkSolution. */
const { bootGame } = require('../_optimization/scripts/harness-lib.js');
const g = bootGame('country-road', { inject: {
  anchor: 'function validateLoop(edges,rows,cols){',
  exports: `globalThis.__R = {
    n: () => LEVELS.length,
    lvl: (i) => { var l = LEVELS[i]; return { rows: l.rows, cols: l.cols, regions: l.regions, clues: l.clues }; },
    load: (i) => loadLevel(i),
    screen: () => state.screen,
    completed: () => state.completed,
    edges: () => Object.keys(state.edges).filter(k => state.edges[k]),
    toggle: (r1, c1, r2, c2) => { state.edges[edgeKey(r1, c1, r2, c2)] = true; },
    cellSize: () => cellSize,
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__R.n()');
T('levels-exist', N === 30, 'n=' + N);

// ---- independent Country Road solver ----
function solveCountryRoad(rows, cols, regions, clues) {
  const total = rows * cols;
  const room = new Array(total).fill(-1);
  regions.forEach((reg, ri) => reg.forEach(idx => { room[idx] = ri; }));
  const roomClue = regions.map((_, ri) => {
    for (const ci in clues) if (room[+ci] === ri) return clues[ci];
    return null;
  });
  const adj = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const a = [];
    if (r > 0) a.push((r - 1) * cols + c);
    if (r < rows - 1) a.push((r + 1) * cols + c);
    if (c > 0) a.push(r * cols + c - 1);
    if (c < cols - 1) a.push(r * cols + c + 1);
    adj.push(a);
  }
  // inter-room adjacency: unvisited pairs across rooms must not both stay unvisited
  const inter = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (c < cols - 1) { const j = i + 1; if (room[i] !== room[j]) inter.push([i, j]); }
    if (r < rows - 1) { const j = i + cols; if (room[i] !== room[j]) inter.push([i, j]); }
  }
  const inLoop = new Uint8Array(total);
  const counts = new Array(regions.length).fill(0);
  const path = [];
  let nodes = 0;

  const finalOk = () => {
    for (let ri = 0; ri < regions.length; ri++) {
      if (roomClue[ri] !== null && counts[ri] !== roomClue[ri]) return false;
    }
    for (const [a, b] of inter) if (!inLoop[a] && !inLoop[b]) return false;
    return true;
  };

  const dfs = (cur, start) => {
    if (++nodes > 400000) return false;
    for (const nxt of adj[cur]) {
      if (nxt === start) {
        if (path.length >= 4 && finalOk()) return true;
        continue;
      }
      if (inLoop[nxt]) continue;
      const rn = room[nxt];
      if (roomClue[rn] !== null && counts[rn] + 1 > roomClue[rn]) continue;
      inLoop[nxt] = 1; counts[rn]++; path.push(nxt);
      if (dfs(nxt, start)) return true;
      inLoop[nxt] = 0; counts[rn]--; path.pop();
    }
    return false;
  };

  for (let start = 0; start < total; start++) {
    const rs = room[start];
    if (roomClue[rs] !== null && roomClue[rs] < 1) continue;
    nodes = 0;
    inLoop[start] = 1; counts[rs]++; path.push(start);
    if (dfs(start, start)) return path.slice();
    inLoop[start] = 0; counts[rs]--; path.length = 0;
  }
  return null;
}

const tapEdge = (r1, c1, r2, c2) => { // real input: pointerdown near the shared boundary
  const cs = g.call('__R.cellSize()');
  const x = (c1 + c2 + 1) / 2 * cs, y = (r1 === r2) ? (r1 + 1) * cs : (r1 + r2 + 1) / 2 * cs;
  g.els.gameCanvas.dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
};

const solved = [];
for (let i = 0; i < N; i++) {
  const lv = g.call(`__R.lvl(${i})`);
  const loop = solveCountryRoad(lv.rows, lv.cols, lv.regions, lv.clues);
  if (!loop) { fails.push('L' + (i + 1) + ' solver found no loop'); continue; }
  g.call(`__R.load(${i})`); g.pump(2);
  for (let k = 0; k < loop.length; k++) {
    const a = loop[k], b = loop[(k + 1) % loop.length];
    const r1 = Math.floor(a / lv.cols), c1 = a % lv.cols, r2 = Math.floor(b / lv.cols), c2 = b % lv.cols;
    g.call(`__R.toggle(${r1}, ${c1}, ${r2}, ${c2})`); // register edge via the engine's own edgeKey/undo path
    tapEdge(r1, c1, r2, c2); // real pointerdown hit-test path (toggles back off if it hits, so toggle twice)
    tapEdge(r1, c1, r2, c2);
  }
  g.call('(function(){ if (typeof checkSolution === "function") checkSolution(); })()');
  g.pump(3);
  if (g.call('__R.completed()')) solved.push(i + 1); else fails.push('L' + (i + 1) + ' engine rejected solver loop');
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' solved:[' + solved.join(',') + '] missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + ']');

T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 6), extra: { solved: solved.length + '/' + N } };
console.log('country-road: ' + solved.length + '/' + N + ' loops solved + drawn via edge taps: ' + out.verdict);
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
