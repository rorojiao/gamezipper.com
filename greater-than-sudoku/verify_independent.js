#!/usr/bin/env node
// INDEPENDENT verifier for greater-than-sudoku levels.
// Separate solver implementation (plain DFS, first-empty-cell) to cross-check
// uniqueness + validity — different from gen.js's MRV backtracking.
//   - Confirms the stored SOLUTION is a valid standard Sudoku.
//   - Confirms the stored INEQUALITIES are consistent with the solution.
//   - Confirms the stored PUZZLE givens are consistent with the solution.
//   - Counts solutions of the puzzle with an independent DFS that enforces
//     row/col/box + inequality constraints; requires == 1.
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// Check whether placing value v at (r,c) is legal given the partial grid.
function legal(r, c, v, grid, N, br, bc, h, vIneq){
  // row + column
  for (let i = 0; i < N; i++) if (grid[r][i] === v || grid[i][c] === v) return false;
  // box
  const br0 = Math.floor(r/br)*br, bc0 = Math.floor(c/bc)*bc;
  for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++)
    if (grid[br0+i][bc0+j] === v) return false;
  // horizontal inequality: (r,c) vs (r,c+1)
  if (c < N-1 && h[r][c]){
    const right = grid[r][c+1];
    if (right !== 0){
      if (h[r][c] === '>' && !(v > right)) return false;
      if (h[r][c] === '<' && !(v < right)) return false;
    }
  }
  // horizontal inequality: (r,c-1) vs (r,c)
  if (c > 0 && h[r][c-1]){
    const left = grid[r][c-1];
    if (left !== 0){
      if (h[r][c-1] === '>' && !(left > v)) return false;
      if (h[r][c-1] === '<' && !(left < v)) return false;
    }
  }
  // vertical inequality: (r,c) vs (r+1,c)
  if (r < N-1 && vIneq[r][c]){
    const down = grid[r+1][c];
    if (down !== 0){
      if (vIneq[r][c] === '>' && !(v > down)) return false;
      if (vIneq[r][c] === '<' && !(v < down)) return false;
    }
  }
  // vertical inequality: (r-1,c) vs (r,c)
  if (r > 0 && vIneq[r-1][c]){
    const up = grid[r-1][c];
    if (up !== 0){
      if (vIneq[r-1][c] === '>' && !(up > v)) return false;
      if (vIneq[r-1][c] === '<' && !(up < v)) return false;
    }
  }
  return true;
}

function verify(level){
  const N = level.N;
  const [br, bc] = boxSize(N);
  const sol = level.s, giv = level.p, h = level.h, vIneq = level.v;
  // 1. dimensions
  if (!Array.isArray(sol) || sol.length !== N) return {ok:false, reason:'solution rows'};
  if (!Array.isArray(giv) || giv.length !== N) return {ok:false, reason:'puzzle rows'};
  if (!Array.isArray(h) || h.length !== N) return {ok:false, reason:'h rows'};
  if (!Array.isArray(vIneq) || vIneq.length !== N-1) return {ok:false, reason:'v rows'};
  // 2. solution is a valid standard Sudoku
  for (let r = 0; r < N; r++){
    if (sol[r].length !== N) return {ok:false, reason:'solution cols '+r};
    const s = new Set(sol[r]); if (s.size !== N) return {ok:false, reason:'solution row '+r};
  }
  for (let c = 0; c < N; c++){
    const s = new Set(); for (let r = 0; r < N; r++) s.add(sol[r][c]);
    if (s.size !== N) return {ok:false, reason:'solution col '+c};
  }
  for (let bi = 0; bi < N; bi += br) for (let bj = 0; bj < N; bj += bc){
    const s = new Set();
    for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) s.add(sol[bi+i][bj+j]);
    if (s.size !== N) return {ok:false, reason:'solution box '+bi+','+bj};
  }
  // 3. inequalities consistent with the solution
  for (let r = 0; r < N; r++) for (let c = 0; c < N-1; c++){
    if (h[r][c] === '>' && !(sol[r][c] > sol[r][c+1])) return {ok:false, reason:'h inequality mismatch '+r+','+c};
    if (h[r][c] === '<' && !(sol[r][c] < sol[r][c+1])) return {ok:false, reason:'h inequality mismatch '+r+','+c};
  }
  for (let r = 0; r < N-1; r++) for (let c = 0; c < N; c++){
    if (vIneq[r][c] === '>' && !(sol[r][c] > sol[r+1][c])) return {ok:false, reason:'v inequality mismatch '+r+','+c};
    if (vIneq[r][c] === '<' && !(sol[r][c] < sol[r+1][c])) return {ok:false, reason:'v inequality mismatch '+r+','+c};
  }
  // 4. givens consistent with solution
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
    if (giv[r][c] !== 0 && giv[r][c] !== sol[r][c]) return {ok:false, reason:'given mismatch '+r+','+c};
  // 5. INDEPENDENT uniqueness solver (plain DFS, first-empty cell)
  const grid = giv.map(r => r.slice());
  let solutions = 0;
  function dfs(){
    if (solutions >= 2) return;
    let er = -1, ec = -1;
    for (let r = 0; r < N && er === -1; r++) for (let c = 0; c < N; c++)
      if (grid[r][c] === 0){ er = r; ec = c; break; }
    if (er === -1){ solutions++; return; }
    for (let v = 1; v <= N; v++){
      if (legal(er, ec, v, grid, N, br, bc, h, vIneq)){
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
console.log(`\n${allOk ? '✅ ALL 27 LEVELS VERIFIED: valid Sudoku + consistent inequalities + unique puzzle' : '✗ FAILURES DETECTED'} (${((Date.now()-t0)/1000).toFixed(2)}s)`);
process.exit(allOk ? 0 : 1);
