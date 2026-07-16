#!/usr/bin/env node
// Doppelblock 3-method verification (Method 2: independent Node solver).
// Re-implements the solver in JS from scratch (not importing from gen_levels.py).

const fs = require('fs');

function solve(blackGrid, clues, N, prefilled, cap = 3, timeLimitMs = 4000) {
  const K = N - 2;
  const start = Date.now();
  const solutions = [];
  const grid = Array.from({length: N}, (_, r) =>
    Array.from({length: N}, (_, c) => blackGrid[r][c] === 1 ? -1 : 0)
  );
  if (prefilled) {
    for (const [key, v] of Object.entries(prefilled)) {
      const [r, c] = key.split(',').map(Number);
      grid[r][c] = v;
    }
  }
  const rowUsed = Array.from({length: N}, () => new Set());
  const colUsed = Array.from({length: N}, () => new Set());
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = grid[r][c];
      if (v && v !== -1) {
        rowUsed[r].add(v);
        colUsed[c].add(v);
      }
    }
  }
  const rowWhiteCols = Array.from({length: N}, (_, r) =>
    Array.from({length: N}, (_, c) => blackGrid[r][c] === 0 ? c : -1).filter(c => c >= 0)
  );
  const colWhiteRows = Array.from({length: N}, (_, c) =>
    Array.from({length: N}, (_, r) => blackGrid[r][c] === 0 ? r : -1).filter(r => r >= 0)
  );
  const rowBlacks = Array.from({length: N}, (_, r) =>
    Array.from({length: N}, (_, c) => blackGrid[r][c] === 1 ? c : -1).filter(c => c >= 0).sort((a, b) => a - b)
  );
  const colBlacks = Array.from({length: N}, (_, c) =>
    Array.from({length: N}, (_, r) => blackGrid[r][c] === 1 ? r : -1).filter(r => r >= 0).sort((a, b) => a - b)
  );

  function dfs(r) {
    if (Date.now() - start > timeLimitMs) return;
    if (solutions.length >= cap) return;
    if (r === N) {
      solutions.push(grid.map(row => [...row]));
      return;
    }
    const whites = rowWhiteCols[r];
    const posToFill = [];
    const posFilled = {};
    for (const c of whites) {
      if (grid[r][c] !== 0) {
        posFilled[c] = grid[r][c];
      } else {
        posToFill.push(c);
      }
    }
    const usedInRow = new Set(Object.values(posFilled));
    const colAvail = {};
    for (const c of posToFill) {
      const used = new Set();
      for (let rr = 0; rr < N; rr++) {
        if (rr === r) continue;
        const v = grid[rr][c];
        if (v && v !== -1) used.add(v);
      }
      colAvail[c] = used;
    }
    const n = posToFill.length;
    const allRemaining = [];
    for (let d = 1; d <= K; d++) {
      if (!usedInRow.has(d)) allRemaining.push(d);
    }
    const perms = [];
    function genPerms(idx, current, used) {
      if (idx === n) {
        const permDict = {};
        for (let i = 0; i < n; i++) permDict[posToFill[i]] = current[i];
        perms.push(permDict);
        return;
      }
      const c = posToFill[idx];
      for (const d of allRemaining) {
        if (used.has(d) || colAvail[c].has(d)) continue;
        current.push(d);
        used.add(d);
        genPerms(idx + 1, current, used);
        current.pop();
        used.delete(d);
      }
    }
    genPerms(0, [], new Set());
    if (perms.length === 0) return;

    const bc = rowBlacks[r];
    const c1 = bc[0], c2 = bc[1];
    const clueCols = [];
    if (c2 - c1 > 1) {
      for (let c = c1 + 1; c < c2; c++) clueCols.push(c);
    }
    const target = clues.rowL[r];

    const filtered = [];
    for (const permDict of perms) {
      let ok = true;
      if (clueCols.length > 0 && target !== null) {
        let s = 0;
        for (const c of clueCols) {
          if (permDict[c] !== undefined) s += permDict[c];
          else if (posFilled[c] !== undefined) s += posFilled[c];
        }
        if (s !== target) ok = false;
      }
      if (!ok) continue;
      for (const c of posToFill) {
        const targetCol = clues.colT[c];
        if (targetCol === null) continue;
        const br = colBlacks[c];
        const r1 = br[0], r2 = br[1];
        if (r2 - r1 <= 1) continue;
        let partial = 0;
        for (let rr = r1 + 1; rr < r2; rr++) {
          if (rr === r) continue;
          const v = grid[rr][c];
          if (v && v !== -1) partial += v;
        }
        if (permDict[c] !== undefined) partial += permDict[c];
        const remainingRows = [];
        for (let rr = r1 + 1; rr < r2; rr++) {
          if (rr > r && grid[rr][c] === 0) remainingRows.push(rr);
        }
        const nRem = remainingRows.length;
        if (nRem > 0) {
          let minRem = 0, maxRem = 0;
          for (let i = 1; i <= nRem; i++) minRem += i;
          for (let i = K - nRem + 1; i <= K; i++) maxRem += i;
          if (partial + minRem > targetCol || partial + maxRem < targetCol) {
            ok = false;
            break;
          }
        }
      }
      if (ok) filtered.push(permDict);
    }
    if (filtered.length === 0) return;

    for (const permDict of filtered) {
      for (const [c, v] of Object.entries(permDict)) {
        grid[r][Number(c)] = v;
        rowUsed[r].add(v);
        colUsed[Number(c)].add(v);
      }
      let prune = false;
      for (const c of Object.keys(permDict)) {
        const cc = Number(c);
        let full = true;
        for (const rr of colWhiteRows[cc]) {
          if (grid[rr][cc] === 0) { full = false; break; }
        }
        if (full) {
          const br = colBlacks[cc];
          const r1 = br[0], r2 = br[1];
          let s = 0;
          if (r2 - r1 > 1) {
            for (let rr = r1 + 1; rr < r2; rr++) s += grid[rr][cc];
          }
          if (clues.colT[cc] !== null && s !== clues.colT[cc]) { prune = true; break; }
          if (clues.colB[cc] !== null && s !== clues.colB[cc]) { prune = true; break; }
        }
      }
      if (!prune) dfs(r + 1);
      for (const [c, v] of Object.entries(permDict)) {
        grid[r][Number(c)] = 0;
        rowUsed[r].delete(v);
        colUsed[Number(c)].delete(v);
      }
      if (solutions.length >= cap) return;
    }
  }
  dfs(0);
  return solutions;
}

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
console.log(`Loaded ${levels.length} levels`);
let nPass = 0;
for (let i = 0; i < levels.length; i++) {
  const lvl = levels[i];
  const N = lvl.N;
  const blackGrid = [];
  for (let r = 0; r < N; r++) {
    blackGrid.push(lvl.black.slice(r * N, (r + 1) * N));
  }
  const solGrid = [];
  for (let r = 0; r < N; r++) {
    solGrid.push(lvl.solution.slice(r * N, (r + 1) * N));
  }
  const prefilled = {};
  for (const p of lvl.prefilled) {
    prefilled[`${p[0]},${p[1]}`] = p[2];
  }
  const t0 = Date.now();
  const found = solve(blackGrid, lvl.clues, N, prefilled, 3, 4000);
  let match = false;
  for (const sol of found) {
    let m = true;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (blackGrid[r][c] === 0 && sol[r][c] !== solGrid[r][c]) {
          m = false;
          break;
        }
      }
      if (!m) break;
    }
    if (m) { match = true; break; }
  }
  const unique = found.length === 1;
  const ok = match && unique;
  if (ok) nPass++;
  console.log(`  L${String(i + 1).padStart(2, ' ')} N=${N}: ${ok ? 'PASS' : 'FAIL'} sols=${found.length} match=${match} unique=${unique} time=${(Date.now() - t0) / 1000}s`);
}
console.log(`\n${nPass}/${levels.length} levels PASS`);