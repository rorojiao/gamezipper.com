#!/usr/bin/env node
// Method 2: Independent Node.js solver — verify each level is solvable
// and the givens uniquely determine the solution.

const fs = require('fs');

const LEVELS = JSON.parse(fs.readFileSync('levels.json', 'utf8')).LEVELS;

function solveCount(gridInit, givens, N, cap = 2) {
  const MAX_NODES = 50000;
  const grid = Array.from({length: N}, (_, r) =>
    Array.from({length: N}, (_, c) => gridInit[r][c])
  );
  let nodes = 0;
  let solCount = 0;

  function validateComplete(g) {
    const visited = Array.from({length: N}, () => new Array(N).fill(false));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (visited[r][c]) continue;
        const d = g[r][c];
        const comp = [];
        const q = [[r, c]];
        visited[r][c] = true;
        while (q.length) {
          const [cr, cc] = q.pop();
          comp.push([cr, cc]);
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = cr + dr, nc = cc + dc;
            if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
            if (visited[nr][nc] || g[nr][nc] !== d) continue;
            visited[nr][nc] = true;
            q.push([nr, nc]);
          }
        }
        if (comp.length !== d) return false;
        for (const [cr, cc] of comp) {
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = cr + dr, nc = cc + dc;
            if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
            if (comp.some(([pr, pc]) => pr === nr && pc === nc)) continue;
            if (g[nr][nc] === d) return false;
          }
        }
      }
    }
    return true;
  }

  function checkPartial(r, c, v, g) {
    // 1s must be isolated
    if (v === 1) {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        if (g[nr][nc] === 1) return false;
      }
    }
    return true;
  }

  function checkRunBounds(r, c, v, g) {
    const seen = new Set([`${r},${c}`]);
    const q = [[r, c]];
    while (q.length) {
      const [cr, cc] = q.pop();
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = cr + dr, nc = cc + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        const key = `${nr},${nc}`;
        if (seen.has(key)) continue;
        if (g[nr][nc] !== v) continue;
        seen.add(key);
        q.push([nr, nc]);
      }
    }
    return seen.size <= v;
  }

  function backtrack(pos) {
    nodes++;
    if (nodes > MAX_NODES) return 2;
    if (solCount >= cap) return solCount;
    if (pos === emptyCells.length) {
      if (validateComplete(grid)) solCount++;
      return solCount;
    }
    const [r, c] = emptyCells[pos];
    for (let v = 1; v <= N; v++) {
      if (!checkPartial(r, c, v, grid)) continue;
      grid[r][c] = v;
      if (!checkRunBounds(r, c, v, grid)) { grid[r][c] = 0; continue; }
      const res = backtrack(pos + 1);
      if (res >= cap) return res;
      grid[r][c] = 0;
    }
    return solCount;
  }

  // Reset grid using init (which has givens placed)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) grid[r][c] = 0;
  }
  for (const [r, c, v] of givens) grid[r][c] = v;
  const givenSet = new Set(givens.map(g => `${g[0]},${g[1]}`));
  const emptyCells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!givenSet.has(`${r},${c}`)) emptyCells.push([r, c]);
    }
  }
  // Simple MRV: cells adjacent to most givens first
  function givenNeighborCount(r, c) {
    let cnt = 0;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
      if (givenSet.has(`${nr},${nc}`)) cnt++;
    }
    return cnt;
  }
  emptyCells.sort((a, b) => givenNeighborCount(b[0], b[1]) - givenNeighborCount(a[0], a[1]));
  return backtrack(0);
}

let pass = 0, fail = 0;
const failDetails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const N = lv.N;
  const fullGrid = Array.from({length: N}, (_, r) =>
    Array.from({length: N}, (_, c) => lv.s[r * N + c])
  );
  const count = solveCount(fullGrid, lv.g, N, 2);
  const ok = count === 1;
  if (ok) pass++; else { fail++; failDetails.push(i+1); }
  console.log(`L${i+1} ${lv.t} N=${N}: ${ok ? 'UNIQUE' : 'FAIL'} (sols=${count})`);
}
console.log(`\n${pass}/${LEVELS.length} levels UNIQUE`);
if (fail > 0) console.log('Failed levels:', failDetails.join(', '));
process.exit(fail > 0 ? 1 : 0);