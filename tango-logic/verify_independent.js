#!/usr/bin/env node
/**
 * Tango Logic — Node.js independent solver.
 *
 * Independently re-implements the Tango solver in Node, then verifies each level
 * of data.js has exactly 1 unique solution AND the provided solution matches.
 */
const fs = require('fs');
const path = require('path');

const S = 'S', M = 'M';

function loadData() {
  const txt = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
  const m = txt.match(/window\.TANGO_LOGIC_DATA\s*=\s*(\{[\s\S]*?\});\s*$/);
  return JSON.parse(m[1]);
}

function isSafeLocal(grid, r, c, sym, n) {
  let cnt = 1;
  for (let c2 = c - 1; c2 >= 0; c2--) {
    if (grid[r][c2] === sym) cnt++;
    else if (grid[r][c2] !== null) break;
  }
  if (cnt >= 3) return false;
  cnt = 1;
  for (let r2 = r - 1; r2 >= 0; r2--) {
    if (grid[r2][c] === sym) cnt++;
    else if (grid[r2][c] !== null) break;
  }
  if (cnt >= 3) return false;
  return true;
}

function solvePuzzle(n, givens, constraints) {
  const grid = Array.from({length: n}, () => Array(n).fill(null));
  for (const [r, c, sym] of givens) grid[r][c] = sym;

  const eqN = {}, xN = {};
  for (const c of constraints) {
    const [r, cc, dr, dc] = c.cell.concat(c.dir);
    const nr = r + dr, nc = cc + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
    if (c.rel === '=') {
      (eqN[`${r},${cc}`] = eqN[`${r},${cc}`] || []).push([nr, nc]);
      (eqN[`${nr},${nc}`] = eqN[`${nr},${nc}`] || []).push([r, cc]);
    } else {
      (xN[`${r},${cc}`] = xN[`${r},${cc}`] || []).push([nr, nc]);
      (xN[`${nr},${nc}`] = xN[`${nr},${nc}`] || []).push([r, cc]);
    }
  }

  function checkLocal(grid, r, c, sym) {
    const eL = eqN[`${r},${c}`] || [];
    for (const [nr, nc] of eL) {
      if (grid[nr][nc] !== null && grid[nr][nc] !== sym) return false;
    }
    const xL = xN[`${r},${c}`] || [];
    for (const [nr, nc] of xL) {
      if (grid[nr][nc] !== null && grid[nr][nc] === sym) return false;
    }
    return true;
  }

  function propagate(grid) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] !== null) continue;
          let possible = new Set([S, M]);
          const eL = eqN[`${r},${c}`] || [];
          for (const [nr, nc] of eL) {
            if (grid[nr][nc] !== null) { possible = new Set([grid[nr][nc]]); break; }
          }
          const xL = xN[`${r},${c}`] || [];
          for (const [nr, nc] of xL) {
            if (grid[nr][nc] !== null) possible.delete(grid[nr][nc]);
          }
          for (const sym of [...possible]) {
            if (!isSafeLocal(grid, r, c, sym, n)) possible.delete(sym);
          }
          if (possible.size === 0) return false;
          if (possible.size === 1) {
            grid[r][c] = [...possible][0];
            changed = true;
          }
        }
      }
    }
    return true;
  }

  function backtrack(empty, idx) {
    if (sols.length > 1) return;
    if (idx === empty.length) {
      // Verify balance
      for (let r = 0; r < n; r++) {
        let cnt = 0;
        for (let c = 0; c < n; c++) if (grid[r][c] === S) cnt++;
        if (cnt !== n / 2) return;
      }
      for (let c = 0; c < n; c++) {
        let cnt = 0;
        for (let r = 0; r < n; r++) if (grid[r][c] === S) cnt++;
        if (cnt !== n / 2) return;
      }
      sols.push(grid.map(r => r.slice()));
      return;
    }
    const [r, c] = empty[idx];
    for (const sym of [S, M]) {
      if (!isSafeLocal(grid, r, c, sym, n)) continue;
      if (!checkLocal(grid, r, c, sym)) continue;
      let rowCnt = 0;
      for (let c2 = 0; c2 < n; c2++) if (grid[r][c2] === sym) rowCnt++;
      if (rowCnt >= n / 2 + 1) continue;
      let colCnt = 0;
      for (let r2 = 0; r2 < n; r2++) if (grid[r2][c] === sym) colCnt++;
      if (colCnt >= n / 2 + 1) continue;
      grid[r][c] = sym;
      const oldState = grid.map(r => r.slice());
      if (propagate(grid)) {
        backtrack(empty, idx + 1);
        if (sols.length > 1) {
          for (let rr = 0; rr < n; rr++)
            for (let cc = 0; cc < n; cc++) grid[rr][cc] = oldState[rr][cc];
          return;
        }
      }
      for (let rr = 0; rr < n; rr++)
        for (let cc = 0; cc < n; cc++) grid[rr][cc] = oldState[rr][cc];
    }
  }

  const empty = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] === null) empty.push([r, c]);
  if (!propagate(grid)) return [];
  const sols = [];
  backtrack(empty, 0);
  return sols;
}

function verifyLevel(level) {
  const n = level.n;
  const givens = level.givens;
  const constraints = level.constraints;
  const solution = level.solution;

  // Verify solution
  for (let r = 0; r < n; r++) {
    let cnt = 0;
    for (let c = 0; c < n; c++) if (solution[r][c] === S) cnt++;
    if (cnt !== n / 2) return { ok: false, msg: `Row ${r} sun=${cnt} expected ${n/2}` };
  }
  for (let c = 0; c < n; c++) {
    let cnt = 0;
    for (let r = 0; r < n; r++) if (solution[r][c] === S) cnt++;
    if (cnt !== n / 2) return { ok: false, msg: `Col ${c} sun=${cnt} expected ${n/2}` };
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n - 2; c++) {
      if (solution[r][c] === solution[r][c+1] && solution[r][c] === solution[r][c+2])
        return { ok: false, msg: `3-in-row at (${r},${c})` };
    }
  }
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n - 2; r++) {
      if (solution[r][c] === solution[r+1][c] && solution[r][c] === solution[r+2][c])
        return { ok: false, msg: `3-in-col at (${r},${c})` };
    }
  }
  for (const c of constraints) {
    const [r, cc, dr, dc] = c.cell.concat(c.dir);
    const nr = r + dr, nc = cc + dc;
    if (c.rel === '=' && solution[r][cc] !== solution[nr][nc])
      return { ok: false, msg: `= violated at (${r},${cc})->(${nr},${nc})` };
    if (c.rel === 'X' && solution[r][cc] === solution[nr][nc])
      return { ok: false, msg: `X violated at (${r},${cc})->(${nr},${nc})` };
  }
  for (const g of givens) {
    if (solution[g[0]][g[1]] !== g[2])
      return { ok: false, msg: `Given mismatch at (${g[0]},${g[1]})` };
  }

  // Check uniqueness
  const sols = solvePuzzle(n, givens, constraints);
  if (sols.length === 0) return { ok: false, msg: 'No solution' };
  if (sols.length > 1) return { ok: false, msg: `Not unique: ${sols.length} solutions` };
  return { ok: true };
}

function main() {
  const data = loadData();
  let fails = 0;
  for (const level of data.levels) {
    const r = verifyLevel(level);
    if (!r.ok) {
      fails++;
      console.log(`FAIL ${level.tier} ${level.name}: ${r.msg}`);
    } else {
      console.log(`PASS ${level.tier} ${level.name}`);
    }
  }
  console.log(`\n${data.levels.length - fails}/${data.levels.length} PASS`);
  process.exit(fails === 0 ? 0 : 1);
}

main();