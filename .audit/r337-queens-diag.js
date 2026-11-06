#!/usr/bin/env node
/* R337 queens — diagnose the killer: which filter rejects every candidate? */
const path = require('path');
const M = require(path.join(__dirname, 'r337-queens-killer.js'));
const { enumerateAll, validate, connectedOK, blobRegions, mulberry32, ctx } = M;

function regionCells(n, regions, rid) {
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === rid) cells.push([r, c]);
  return cells;
}
function comp(n, regions, rid, start) {
  const seen = new Set([start[0] + ',' + start[1]]);
  const st = [start]; const out = [];
  while (st.length) {
    const [r, c] = st.pop(); out.push([r, c]);
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (regions[nr][nc] !== rid) continue;
      const k = nr + ',' + nc; if (seen.has(k)) continue; seen.add(k); st.push([nr, nc]);
    }
  }
  return out;
}

const n = 7;
const sol = ctx.__pq(n, mulberry32(31 + n));
const grid = blobRegions(n, sol, mulberry32(7919 + n * 104729));
const solCells = new Set(sol.map((c, r) => r + ',' + c));
const sols = enumerateAll(n, grid, 500000);
console.log('n=' + n + ' solutions=' + sols.length + ' sol=' + JSON.stringify(sol));

// where are the S crowns?
for (let r = 0; r < n; r++) console.log('  S crown row ' + r + ' col ' + sol[r] + ' region ' + grid[r][sol[r]]);

const cover = new Map();
for (const X of sols) for (let r = 0; r < n; r++) {
  const c = X[r]; if (solCells.has(r + ',' + c)) continue;
  const k = r + ',' + c; cover.set(k, (cover.get(k) || 0) + 1);
}
console.log('candidate cells (non-S): ' + cover.size);

let stats = { noAdjRegion: 0, artifact: 0, scrownInTravel: 0, remainderDisconnected: 0, ok: 0, countNotReduced: 0 };
for (const [k, cnt] of cover) {
  const [r, c] = k.split(',').map(Number);
  const R_old = grid[r][c];
  let R_new = -1;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
    if (grid[nr][nc] !== R_old) { R_new = grid[nr][nc]; break; }
  }
  if (R_new < 0) { stats.noAdjRegion++; continue; }
  // MOVE c ALONE; require R_old - c stays connected
  const g = grid.map(row => row.slice());
  g[r][c] = R_new;
  const rest = regionCells(n, g, R_old);
  if (!rest.length) { stats.artifact++; continue; }
  if (comp(n, g, R_old, rest[0]).length !== rest.length) { stats.remainderDisconnected++; continue; }
  // R_old must still hold its S crown
  let holdsCrown = false;
  for (let rr = 0; rr < n; rr++) if (grid[rr][sol[rr]] === R_old) {
    const cc = sol[rr];
    if (g[rr][cc] === R_old) holdsCrown = true;
  }
  if (!holdsCrown) { stats.scrownInTravel++; continue; }
  if (validate(n, g, sol) !== null) { stats.artifact++; continue; }
  if (!connectedOK(n, g)) { stats.artifact++; continue; }
  const after = enumerateAll(n, g, 500000);
  if (after.length >= sols.length) { stats.countNotReduced++; continue; }
  stats.ok++;
}
console.log('filter stats: ' + JSON.stringify(stats));

// show what actually happens to the count for the top candidate
const cands = [...cover.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
for (const [k, cnt] of cands) {
  const [r, c] = k.split(',').map(Number);
  let R_new = -1;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
    if (grid[nr][nc] !== grid[r][c]) { R_new = grid[nr][nc]; break; }
  }
  const g = grid.map(row => row.slice());
  g[r][c] = R_new;
  const rest = regionCells(n, g, grid[r][c]);
  const restConn = rest.length ? comp(n, g, grid[r][c], rest[0]).length === rest.length : false;
  const after = enumerateAll(n, g, 500000);
  console.log('  cand ' + k + ' cover=' + cnt + ' R_old=' + grid[r][c] + ' R_new=' + R_new +
    ' restConnected=' + restConn + ' after=' + after.length);
}
