#!/usr/bin/env node
// INDEPENDENT verifier for girandola-sudoku levels.
// Separate solver implementation (plain DFS, first-empty-cell) to cross-check
// uniqueness + validity — different from gen.js's MRV backtracking.
//   - Confirms the stored SOLUTION is a valid girandola sudoku.
//   - Confirms the stored PUZZLE givens are consistent with the solution.
//   - Counts solutions of the puzzle with an independent DFS, requires == 1.
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// GIRANDOLA cells: the extra region
const GIRANDOLA_CELLS_9 = [[1,1],[1,4],[1,7],[4,1],[4,4],[4,7],[7,1],[7,4],[7,7]];
const GIRANDOLA_CELLS_6 = [[1,1],[1,4],[2,2],[3,3],[4,1],[4,4]];

function girandolaCells(N){
  return N===6 ? GIRANDOLA_CELLS_6 : GIRANDOLA_CELLS_9;
}

function girandolaValid(r, c, v, grid, N, br, bc, gCells){
  // row, column
  for (let i = 0; i < N; i++) if (grid[r][i] === v || grid[i][c] === v) return false;
  // box
  const br0 = Math.floor(r/br)*br, bc0 = Math.floor(c/bc)*bc;
  for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++)
    if (grid[br0+i][bc0+j] === v) return false;
  // girandola region: only applies if THIS cell is in the girandola set.
  // Non-girandola cells may freely share values with girandola cells.
  for (const [gr, gc] of gCells){
    if (gr === r && gc === c){
      // this cell IS a girandola cell -> enforce mutual distinctness
      for (const [gr2, gc2] of gCells){
        if (gr2 === r && gc2 === c) continue;
        if (grid[gr2][gc2] === v) return false;
      }
      break;
    }
  }
  return true;
}

function verify(level){
  const N = level.N;
  const [br, bc] = boxSize(N);
  const sol = level.s, giv = level.p;
  const gCells = girandolaCells(N);
  // 1. dimensions
  if (!Array.isArray(sol) || sol.length !== N) return {ok:false, reason:'solution rows'};
  if (!Array.isArray(giv) || giv.length !== N) return {ok:false, reason:'puzzle rows'};
  // 2. solution is a valid girandola sudoku
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++){
    const v = sol[r][c];
    if (v < 1 || v > N) return {ok:false, reason:'solution value out of range '+r+','+c};
  }
  // rows/cols/boxes all-permutation check
  for (let r = 0; r < N; r++){ const s = new Set(sol[r]); if (s.size !== N) return {ok:false, reason:'solution row '+r}; }
  for (let c = 0; c < N; c++){ const s = new Set(); for (let r = 0; r < N; r++) s.add(sol[r][c]); if (s.size !== N) return {ok:false, reason:'solution col '+c}; }
  for (let bi = 0; bi < N; bi += br) for (let bj = 0; bj < N; bj += bc){
    const s = new Set();
    for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) s.add(sol[bi+i][bj+j]);
    if (s.size !== N) return {ok:false, reason:'solution box '+bi+','+bj};
  }
  // girandola region all-distinct check
  const gSet = new Set();
  for (const [gr, gc] of gCells) gSet.add(sol[gr][gc]);
  if (gSet.size !== N) return {ok:false, reason:'girandola region not all-distinct'};
  // 3. givens consistent with solution
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
    if (giv[r][c] !== 0 && giv[r][c] !== sol[r][c]) return {ok:false, reason:'given mismatch '+r+','+c};
  // 4. INDEPENDENT uniqueness solver (plain DFS, first-empty cell)
  const grid = giv.map(r => r.slice());
  let solutions = 0;
  function dfs(){
    if (solutions >= 2) return;
    let er = -1, ec = -1;
    for (let r = 0; r < N && er === -1; r++) for (let c = 0; c < N; c++)
      if (grid[r][c] === 0){ er = r; ec = c; break; }
    if (er === -1){ solutions++; return; }
    for (let v = 1; v <= N; v++){
      if (girandolaValid(er, ec, v, grid, N, br, bc, gCells)){
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
console.log(`\n${allOk ? '✅ ALL 27 LEVELS VERIFIED: valid girandola solution + unique puzzle' : '✗ FAILURES DETECTED'} (${((Date.now()-t0)/1000).toFixed(2)}s)`);
process.exit(allOk ? 0 : 1);
