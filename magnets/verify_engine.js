// Magnets Verifier — validate all 30 levels
// Rules:
//   1. Every cell is +1 or -1 (no 0)
//   2. fixed[r][c] (if non-zero) matches solution[r][c]
//   3. For each [r1,c1,r2,c2] in x: solution[r1][c1] !== solution[r2][c2]
//   4. For each row r: count(+1) === row_clues[r]
//   5. For each col c: count(+1) === col_clues[c]
// Uniqueness: brute-force search for second valid solution (BFS w/ constraint propagation)

const fs = require('fs');
const path = require('path');

const LEVELS = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = LEVELS.levels;

// Verify each level's stored solution
function verifyStored(idx, lvl) {
  const n = lvl.n, m = lvl.m;
  const sol = lvl.solution, fixed = lvl.fixed, x = lvl.x;
  const rc = lvl.row_clues, cc = lvl.col_clues;
  const errors = [];
  // Rule 1: filled
  for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) {
    if (sol[r][c] !== 1 && sol[r][c] !== -1) errors.push(`(${r+1},${c+1}) empty`);
  }
  // Rule 2: fixed
  for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) {
    if (fixed[r][c] !== 0 && sol[r][c] !== fixed[r][c]) errors.push(`fixed(${r+1},${c+1}) mismatch`);
  }
  // Rule 3: X markers (must differ)
  for (const [r1,c1,r2,c2] of x) {
    if (sol[r1][c1] === sol[r2][c2]) errors.push(`X(${r1+1},${c1+1})-(${r2+1},${c2+1}) violated (same=${sol[r1][c1]})`);
  }
  // Rule 4: row clues
  for (let r = 0; r < n; r++) {
    const cnt = sol[r].filter(v => v === 1).length;
    if (cnt !== rc[r]) errors.push(`row ${r+1} has ${cnt}+1, clue ${rc[r]}`);
  }
  // Rule 5: col clues
  for (let c = 0; c < m; c++) {
    const cnt = sol.reduce((a,row)=>a + (row[c]===1?1:0), 0);
    if (cnt !== cc[c]) errors.push(`col ${c+1} has ${cnt}+1, clue ${cc[c]}`);
  }
  return errors;
}

// Uniqueness: solve from scratch using BFS with constraint propagation
// Returns array of valid solutions found (cap at 2 — if 2 found, "not unique")
function solveUniqueness(idx, lvl) {
  const n = lvl.n, m = lvl.m;
  const fixed = lvl.fixed, x = lvl.x;
  const rc = lvl.row_clues, cc = lvl.col_clues;
  // Build constraint graph: for each X marker (r1,c1,r2,c2) we know sol[r1][c1] != sol[r2][c2]
  // For same-pole markers... wait, the engine only has X (different). No 'same' marker.
  // So only adjacency constraints are "different".
  const cells = []; // {r,c,fixedVal,neighbors:[{r,c,eq:true/false}]}
  const cellKey = (r,c) => r*m + c;
  for (let r=0;r<n;r++) for (let c=0;c<m;c++) {
    cells.push({r,c,fixedVal:fixed[r][c],neighbors:[]});
  }
  for (const [r1,c1,r2,c2] of x) {
    cells[cellKey(r1,c1)].neighbors.push({r:r2,c:c2,eq:false});
    cells[cellKey(r2,c2)].neighbors.push({r:r1,c:c1,eq:false});
  }
  // BFS with pruning using row/col counts
  const grid = []; for (let r=0;r<n;r++) grid.push(new Array(m).fill(0));
  // Initialize from fixed
  for (let r=0;r<n;r++) for (let c=0;c<m;c++) grid[r][c] = fixed[r][c];
  let solutions = [];
  let maxSol = 2;
  let iterCount = 0;
  const MAX_ITER = 500000;

  function checkConstraints(r, c, val) {
    // X markers involving (r,c) — both neighbors must already be set
    for (const {r:r2,c:c2} of cells[cellKey(r,c)].neighbors) {
      if (grid[r2][c2] !== 0 && grid[r2][c2] === val) return false;
    }
    return true;
  }

  function rowCount(r) {
    let cnt = 0, set = 0;
    for (let c=0;c<m;c++) {
      if (grid[r][c] === 1) cnt++;
      if (grid[r][c] !== 0) set++;
    }
    return {cnt, set};
  }
  function colCount(c) {
    let cnt = 0, set = 0;
    for (let r=0;r<n;r++) {
      if (grid[r][c] === 1) cnt++;
      if (grid[r][c] !== 0) set++;
    }
    return {cnt, set};
  }

  function isValidPartial() {
    for (let r=0;r<n;r++) {
      const {cnt,set} = rowCount(r);
      if (cnt > rc[r]) return false;
      if (set === m && cnt !== rc[r]) return false;
      // remaining cells in row must be +1 (cnt grows) or -1 (cnt stays)
      const remaining = m - set;
      if (cnt + remaining < rc[r]) return false;
    }
    for (let c=0;c<m;c++) {
      const {cnt,set} = colCount(c);
      if (cnt > cc[c]) return false;
      if (set === n && cnt !== cc[c]) return false;
      const remaining = n - set;
      if (cnt + remaining < cc[c]) return false;
    }
    return true;
  }

  function dfs(idx) {
    if (solutions.length >= maxSol) return;
    if (++iterCount > MAX_ITER) return;
    if (idx === n*m) {
      // All filled — verify
      for (let r=0;r<n;r++) for (let c=0;c<m;c++) {
        if (grid[r][c] !== 1 && grid[r][c] !== -1) return;
      }
      for (let r=0;r<n;r++) {
        if (grid[r].filter(v=>v===1).length !== rc[r]) return;
      }
      for (let c=0;c<m;c++) {
        let cnt = 0;
        for (let r=0;r<n;r++) if (grid[r][c]===1) cnt++;
        if (cnt !== cc[c]) return;
      }
      // Capture solution
      const sol = grid.map(row=>row.slice());
      solutions.push(sol);
      return;
    }
    const r = Math.floor(idx/m), c = idx%m;
    if (grid[r][c] !== 0) {
      dfs(idx+1);
      return;
    }
    for (const val of [1,-1]) {
      grid[r][c] = val;
      if (checkConstraints(r,c,val) && isValidPartial()) {
        dfs(idx+1);
      }
      grid[r][c] = 0;
      if (solutions.length >= maxSol) return;
    }
  }
  dfs(0);
  return {count: solutions.length, iterCount, solutions};
}

let totalErrors = 0;
let totalUnique = 0;
let totalMulti = 0;
let totalUnsolvable = 0;
const issues = [];

for (let i = 0; i < levels.length; i++) {
  const lvl = levels[i];
  const errors = verifyStored(i, lvl);
  const uniq = solveUniqueness(i, lvl);
  if (errors.length > 0) {
    totalErrors += errors.length;
    issues.push({level: i, tier: lvl.tier, type: 'stored_solution_invalid', errors});
  } else if (uniq.count === 0) {
    totalUnsolvable++;
    issues.push({level: i, tier: lvl.tier, type: 'unsolvable', errors: ['No valid solution found']});
  } else if (uniq.count > 1) {
    totalMulti++;
    issues.push({level: i, tier: lvl.tier, type: 'multi_solution', count: uniq.count, iterCount: uniq.iterCount});
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
