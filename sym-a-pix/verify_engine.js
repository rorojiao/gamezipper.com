// Sym-a-Pix Verifier — validate all 30 levels
// Rules:
//   1. Solution must satisfy every clue: clue[r][c] = count of filled 8-neighbors
//   2. Solution must be point-symmetric: sol[r][c] == sol[N-1-r][N-1-c]
//   3. From the clue set alone, the solution must be UNIQUE
//
// Usage: node verify_engine.js

const fs = require('fs');
const path = require('path');

const LEVELS = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = LEVELS.levels;

function neighbors(n, r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) out.push([nr, nc]);
    }
  }
  return out;
}

function verifyStored(idx, lvl) {
  const n = lvl.n;
  const sol = lvl.solution;
  const clues = lvl.clues;
  const errors = [];
  // Rule 1: clues match solution
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let cnt = 0;
      for (const [nr, nc] of neighbors(n, r, c)) cnt += sol[nr][nc];
      if (cnt !== clues[r][c]) {
        errors.push(`clue (${r+1},${c+1}) = ${clues[r][c]} but sol gives ${cnt}`);
      }
    }
  }
  // Rule 2: solution is point-symmetric
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (sol[r][c] !== sol[n - 1 - r][n - 1 - c]) {
        errors.push(`sol not symmetric at (${r+1},${c+1}) vs (${n-r},${n-c})`);
      }
    }
  }
  return errors;
}

function solveUniqueness(idx, lvl) {
  const n = lvl.n;
  const clues = lvl.clues;
  // Primary cells: (r,c) <= (n-1-r, n-1-c) lexicographically
  const primary = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const rr = n - 1 - r, cc = n - 1 - c;
      if (r < rr || (r === rr && c <= cc)) primary.push([r, c]);
    }
  }
  const K = primary.length;
  const idxMap = {};
  primary.forEach((p, i) => { idxMap[p[0] + ',' + p[1]] = i; });

  // Build constraints
  const constraints = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const nbrIndices = [];
      for (const [nr, nc] of neighbors(n, r, c)) {
        const nrr = n - 1 - nr, ncc = n - 1 - nc;
        let key;
        if (nr < nrr || (nr === nrr && nc <= ncc)) key = nr + ',' + nc;
        else key = nrr + ',' + ncc;
        nbrIndices.push(idxMap[key]);
      }
      constraints.push({ idxs: nbrIndices.sort((x, y) => x - y), v: clues[r][c] });
    }
  }

  const grid = new Array(K).fill(0);
  const solutions = [];
  const assigned = [];
  const maxSol = 2;

  function prune() {
    for (const { idxs, v } of constraints) {
      let s = 0, unassigned = 0;
      for (const i of idxs) {
        if (i < assigned.length) s += grid[i];
        else unassigned++;
      }
      if (s > v) return false;
      if (unassigned === 0 && s !== v) return false;
    }
    return true;
  }

  function dfs() {
    if (solutions.length >= maxSol) return;
    if (assigned.length === K) {
      let ok = true;
      for (const { idxs, v } of constraints) {
        let s = 0;
        for (const i of idxs) s += grid[i];
        if (s !== v) { ok = false; break; }
      }
      if (ok) solutions.push([...grid]);
      return;
    }
    for (const v of [0, 1]) {
      grid[assigned.length] = v;
      assigned.push(null);
      if (prune()) dfs();
      assigned.pop();
    }
  }
  dfs();
  return { count: solutions.length, solutions };
}

let totalErrors = 0, totalUnique = 0, totalMulti = 0, totalUnsolvable = 0;
const issues = [];

for (let i = 0; i < levels.length; i++) {
  const lvl = levels[i];
  const errs = verifyStored(i, lvl);
  const uniq = solveUniqueness(i, lvl);
  if (errs.length > 0) {
    totalErrors += errs.length;
    issues.push({ level: i, tier: lvl.tier, name: lvl.name, type: 'stored_invalid', errors: errs });
  } else if (uniq.count === 0) {
    totalUnsolvable++;
    issues.push({ level: i, tier: lvl.tier, name: lvl.name, type: 'unsolvable' });
  } else if (uniq.count > 1) {
    totalMulti++;
    issues.push({ level: i, tier: lvl.tier, name: lvl.name, type: 'multi_solution', count: uniq.count });
  } else {
    totalUnique++;
  }
}

console.log(JSON.stringify({
  total: levels.length,
  stored_valid: totalErrors === 0,
  unique: totalUnique,
  multi: totalMulti,
  unsolvable: totalUnsolvable,
  invalid: totalErrors,
  issues
}, null, 2));
