// Independent Binairo level verifier — checks ALL 4 rules + uniqueness
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, 'levels.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));

// Fresh solver — column-major traversal (different from gen.js's row-major)
function countSolutionsColMajor(puzzle, N, limit) {
  // Work on a copy
  const g = puzzle.map(r => [...r]);
  let solutions = 0;

  function check(row, col, val) {
    g[row][col] = val;
    // Rule 2: no 3-consecutive horizontally
    for (let c = Math.max(0, col - 2); c <= Math.min(N - 3, col); c++) {
      if (g[row][c] >= 0 && g[row][c+1] >= 0 && g[row][c+2] >= 0 &&
          g[row][c] === g[row][c+1] && g[row][c+1] === g[row][c+2]) {
        g[row][col] = -1; return false;
      }
    }
    // Rule 2: no 3-consecutive vertically
    for (let r = Math.max(0, row - 2); r <= Math.min(N - 3, row); r++) {
      if (g[r][col] >= 0 && g[r+1][col] >= 0 && g[r+2][col] >= 0 &&
          g[r][col] === g[r+1][col] && g[r+1][col] === g[r+2][col]) {
        g[row][col] = -1; return false;
      }
    }
    // Rule 3: equal count feasibility per row
    let zc = 0, oc = 0;
    for (let c = 0; c < N; c++) { if (g[row][c]===0) zc++; else if (g[row][c]===1) oc++; }
    if (zc > N/2 || oc > N/2) { g[row][col] = -1; return false; }
    // Rule 3: equal count feasibility per col
    zc = 0; oc = 0;
    for (let r = 0; r < N; r++) { if (g[r][col]===0) zc++; else if (g[r][col]===1) oc++; }
    if (zc > N/2 || oc > N/2) { g[row][col] = -1; return false; }
    g[row][col] = -1;
    return true;
  }

  // Traverse column-major: index = col * N + row
  function solve(idx) {
    if (solutions >= limit) return;
    if (idx === N * N) {
      // Rule 4: unique rows
      const rset = new Set();
      for (let r = 0; r < N; r++) rset.add(g[r].join(''));
      if (rset.size !== N) return;
      // Rule 4: unique cols
      const cset = new Set();
      for (let c = 0; c < N; c++) {
        let s = ''; for (let r = 0; r < N; r++) s += g[r][c];
        cset.add(s);
      }
      if (cset.size !== N) return;
      solutions++;
      return;
    }
    const col = Math.floor(idx / N);
    const row = idx % N;
    if (g[row][col] !== -1) { solve(idx + 1); return; }
    for (const v of [1, 0]) { // try 1 first (different order from gen.js)
      if (check(row, col, v)) {
        g[row][col] = v;
        solve(idx + 1);
        g[row][col] = -1;
      }
      if (solutions >= limit) return;
    }
  }

  solve(0);
  return solutions;
}

// Verify ALL 4 rules on a complete solution
function verifySolutionRules(sol, N) {
  // Rule 2: no 3-consecutive in rows
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N - 2; c++) {
      if (sol[r][c] === sol[r][c+1] && sol[r][c+1] === sol[r][c+2]) return '3-consecutive in row ' + r;
    }
  }
  // Rule 2: no 3-consecutive in cols
  for (let c = 0; c < N; c++) {
    for (let r = 0; r < N - 2; r++) {
      if (sol[r][c] === sol[r+1][c] && sol[r+1][c] === sol[r+2][c]) return '3-consecutive in col ' + c;
    }
  }
  // Rule 3: equal count per row
  for (let r = 0; r < N; r++) {
    if (sol[r].filter(v => v === 0).length !== N/2) return 'unbalanced row ' + r;
  }
  // Rule 3: equal count per col
  for (let c = 0; c < N; c++) {
    let z = 0; for (let r = 0; r < N; r++) if (sol[r][c] === 0) z++;
    if (z !== N/2) return 'unbalanced col ' + c;
  }
  // Rule 4: unique rows
  const rset = new Set();
  for (let r = 0; r < N; r++) rset.add(sol[r].join(''));
  if (rset.size !== N) return 'duplicate rows';
  // Rule 4: unique cols
  const cset = new Set();
  for (let c = 0; c < N; c++) {
    let s = ''; for (let r = 0; r < N; r++) s += sol[r][c];
    cset.add(s);
  }
  if (cset.size !== N) return 'duplicate cols';
  return null; // valid
}

let allPass = true;
for (const lvl of levels) {
  const N = lvl.size;
  // 1. Verify stored solution satisfies ALL rules
  const ruleErr = verifySolutionRules(lvl.solution, N);
  if (ruleErr) {
    console.log(`#${String(lvl.id).padStart(2,'0')} ${lvl.tier.padEnd(8)} ${N}x${N}  RULE VIOLATION: ${ruleErr}`);
    allPass = false;
    continue;
  }
  // 2. Build puzzle from givens
  const puzzle = Array.from({length: N}, () => Array(N).fill(-1));
  for (const [r, c, v] of lvl.givens) puzzle[r][c] = v;
  // 3. Verify givens are consistent with solution
  for (const [r, c, v] of lvl.givens) {
    if (lvl.solution[r][c] !== v) {
      console.log(`#${String(lvl.id).padStart(2,'0')} ${lvl.tier.padEnd(8)} ${N}x${N}  GIVEN MISMATCH at (${r},${c}): given=${v} sol=${lvl.solution[r][c]}`);
      allPass = false;
      continue;
    }
  }
  // 4. Count solutions (up to 2)
  const numSol = countSolutionsColMajor(puzzle, N, 2);
  if (numSol === 1) {
    console.log(`#${String(lvl.id).padStart(2,'0')} ${lvl.tier.padEnd(8)} ${N}x${N}  UNIQUE + VALID`);
  } else {
    console.log(`#${String(lvl.id).padStart(2,'0')} ${lvl.tier.padEnd(8)} ${N}x${N}  ${numSol} SOLUTIONS (NOT UNIQUE)`);
    allPass = false;
  }
}

console.log('');
if (allPass) {
  console.log(`${levels.length}/${levels.length} UNIQUE + VALID`);
  process.exit(0);
} else {
  console.log(`FAILURES DETECTED`);
  process.exit(1);
}
