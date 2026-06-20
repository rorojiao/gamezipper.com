#!/usr/bin/env node
// INDEPENDENT verifier for anti-king-sudoku levels.
// Separate solver implementation (constraint-propagation style with a different
// candidate representation than gen.js) to cross-check uniqueness + validity.
//   - Confirms the stored SOLUTION is a valid anti-king sudoku.
//   - Confirms the stored PUZZLE givens are consistent with the solution.
//   - Counts solutions of the puzzle with an independent DFS, requires == 1.
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

function kingValid(r, c, v, grid, N, br, bc){
  // row, column, box
  for (let i = 0; i < N; i++) if (grid[r][i] === v || grid[i][c] === v) return false;
  const br0 = Math.floor(r/br)*br, bc0 = Math.floor(c/bc)*bc;
  for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++)
    if (grid[br0+i][bc0+j] === v) return false;
  // king moves (8 neighbours, incl. diagonals)
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++){
    if (!dr && !dc) continue;
    const nr = r+dr, nc = c+dc;
    if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === v) return false;
  }
  return true;
}

function verify(level){
  const N = level.N;
  const [br, bc] = boxSize(N);
  const sol = level.s, giv = level.p;
  // 1. dimensions
  if (!Array.isArray(sol) || sol.length !== N) return {ok:false, reason:'solution rows'};
  if (!Array.isArray(giv) || giv.length !== N) return {ok:false, reason:'puzzle rows'};
  // 2. solution is a valid anti-king sudoku (build incrementally to reuse kingValid)
  const test = giv.map(r => r.slice()); // start from givens, then check sol fills validly
  // validate solution directly: every row/col/box/king pair distinct
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++){
    const v = sol[r][c];
    if (v < 1 || v > N) return {ok:false, reason:'solution value out of range '+r+','+c};
    // king neighbours distinct
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++){
      if (!dr && !dc) continue;
      const nr = r+dr, nc = c+dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && sol[nr][nc] === v)
        return {ok:false, reason:'king clash in solution at '+r+','+c};
    }
  }
  // rows/cols/boxes all-permutation check
  for (let r = 0; r < N; r++){ const s = new Set(sol[r]); if (s.size !== N) return {ok:false, reason:'solution row '+r}; }
  for (let c = 0; c < N; c++){ const s = new Set(); for (let r = 0; r < N; r++) s.add(sol[r][c]); if (s.size !== N) return {ok:false, reason:'solution col '+c}; }
  for (let bi = 0; bi < N; bi += br) for (let bj = 0; bj < N; bj += bc){
    const s = new Set();
    for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) s.add(sol[bi+i][bj+j]);
    if (s.size !== N) return {ok:false, reason:'solution box '+bi+','+bj};
  }
  // 3. givens consistent with solution
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
    if (giv[r][c] !== 0 && giv[r][c] !== sol[r][c]) return {ok:false, reason:'given mismatch '+r+','+c};
  // 4. INDEPENDENT uniqueness solver (plain DFS, first-empty cell, different from gen's MRV)
  const grid = giv.map(r => r.slice());
  let solutions = 0;
  function dfs(){
    if (solutions >= 2) return;
    let er = -1, ec = -1;
    for (let r = 0; r < N && er === -1; r++) for (let c = 0; c < N; c++)
      if (grid[r][c] === 0){ er = r; ec = c; break; }
    if (er === -1){ solutions++; return; }
    for (let v = 1; v <= N; v++){
      if (kingValid(er, ec, v, grid, N, br, bc)){
        grid[er][ec] = v; dfs(); grid[er][ec] = 0;
        if (solutions >= 2) return;
      }
    }
  }
  dfs();
  const clueCount = giv.flat().filter(x => x !== 0).length;
  return { ok: solutions === 1, reason: solutions === 1 ? 'unique' : (solutions + ' solutions'),
           clues: clueCount };
}

let allOk = true;
let t0 = Date.now();
for (const lvl of data.levels){
  const res = verify(lvl);
  const mark = res.ok ? '✓' : '✗';
  if (!res.ok) allOk = false;
  console.log(`${mark} #${String(lvl.id).padStart(2)} ${lvl.tier.padEnd(10)} N=${lvl.N} clues=${res.clues} — ${res.reason}`);
}
console.log(`\n${allOk ? '✅ ALL 27 LEVELS VERIFIED: valid anti-king solution + unique puzzle' : '✗ FAILURES DETECTED'} (${((Date.now()-t0)/1000).toFixed(2)}s)`);
process.exit(allOk ? 0 : 1);
