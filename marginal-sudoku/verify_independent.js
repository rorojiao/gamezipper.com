#!/usr/bin/env node
// INDEPENDENT verifier for marginal-sudoku levels.
// Separate solver implementation (plain DFS, first-empty-cell, NO node budget)
// to cross-check uniqueness + validity — different from gen.js's MRV backtracking.
//   - Confirms the stored SOLUTION is a valid standard Sudoku.
//   - Confirms the stored SOLUTION satisfies every displayed marginal clue.
//   - Confirms the stored PUZZLE givens are consistent with the solution.
//   - Counts solutions of the puzzle with an independent DFS that respects
//     marginal constraints (each cell has a forbidden-digit set), requires == 1.
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// plain row/col/box validity check
function placeOk(grid, r, c, v, N, br, bc){
  for (let i = 0; i < N; i++) if (grid[r][i] === v || grid[i][c] === v) return false;
  const br0 = Math.floor(r/br)*br, bc0 = Math.floor(c/bc)*bc;
  for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++)
    if (grid[br0+i][bc0+j] === v) return false;
  return true;
}

// build per-cell forbidden digits from marginal clue arrays
// marginal: { left:[Set per row], right:[...], top:[Set per col], bottom:[...] }
function buildForbiddenArrays(N, K, marg){
  const f = Array.from({length:N}, () => Array.from({length:N}, () => new Set()));
  for (let r = 0; r < N; r++){
    for (const d of marg.left[r])   for (let c = K;   c < N;   c++) f[r][c].add(d);
    for (const d of marg.right[r])  for (let c = 0;   c < N-K; c++) f[r][c].add(d);
  }
  for (let c = 0; c < N; c++){
    for (const d of marg.top[c])    for (let r = K;   r < N;   r++) f[r][c].add(d);
    for (const d of marg.bottom[c]) for (let r = 0;   r < N-K; r++) f[r][c].add(d);
  }
  return f;
}

function setsFromArrays(margArrs, N){
  const wrap = (a) => a.map(arr => new Set(arr));
  return { left: wrap(margArrs.left), right: wrap(margArrs.right),
           top: wrap(margArrs.top), bottom: wrap(margArrs.bottom) };
}

function verify(level){
  const N = level.N, K = level.K || 3;
  const [br, bc] = boxSize(N);
  const sol = level.s, giv = level.p;
  const marg = setsFromArrays(level.marginal, N);
  // 1. dimensions
  if (!Array.isArray(sol) || sol.length !== N) return {ok:false, reason:'solution rows'};
  if (!Array.isArray(giv) || giv.length !== N) return {ok:false, reason:'puzzle rows'};
  for (let r = 0; r < N; r++){
    if (sol[r].length !== N || giv[r].length !== N) return {ok:false, reason:'row width'};
  }
  // 2. solution is a valid standard Sudoku
  for (let r = 0; r < N; r++){ const s = new Set(sol[r]); if (s.size !== N) return {ok:false, reason:'solution row '+r}; }
  for (let c = 0; c < N; c++){ const s = new Set(); for (let r = 0; r < N; r++) s.add(sol[r][c]); if (s.size !== N) return {ok:false, reason:'solution col '+c}; }
  for (let bi = 0; bi < N; bi += br) for (let bj = 0; bj < N; bj += bc){
    const s = new Set();
    for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) s.add(sol[bi+i][bj+j]);
    if (s.size !== N) return {ok:false, reason:'solution box '+bi+','+bj};
  }
  // 3. solution satisfies every displayed marginal clue
  for (let r = 0; r < N; r++){
    for (const d of marg.left[r]){
      let ok = false; for (let c = 0; c < K; c++) if (sol[r][c] === d){ ok = true; break; }
      if (!ok) return {ok:false, reason:'marginal left clue '+d+' row '+r+' violated by solution'};
    }
    for (const d of marg.right[r]){
      let ok = false; for (let c = N-K; c < N; c++) if (sol[r][c] === d){ ok = true; break; }
      if (!ok) return {ok:false, reason:'marginal right clue '+d+' row '+r+' violated by solution'};
    }
  }
  for (let c = 0; c < N; c++){
    for (const d of marg.top[c]){
      let ok = false; for (let r = 0; r < K; r++) if (sol[r][c] === d){ ok = true; break; }
      if (!ok) return {ok:false, reason:'marginal top clue '+d+' col '+c+' violated by solution'};
    }
    for (const d of marg.bottom[c]){
      let ok = false; for (let r = N-K; r < N; r++) if (sol[r][c] === d){ ok = true; break; }
      if (!ok) return {ok:false, reason:'marginal bottom clue '+d+' col '+c+' violated by solution'};
    }
  }
  // 4. givens consistent with solution
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
    if (giv[r][c] !== 0 && giv[r][c] !== sol[r][c]) return {ok:false, reason:'given mismatch '+r+','+c};
  // 5. INDEPENDENT uniqueness solver (plain DFS, first-empty cell, marginal-aware)
  const forbidden = buildForbiddenArrays(N, K, marg);
  const grid = giv.map(r => r.slice());
  let solutions = 0;
  function dfs(){
    if (solutions >= 2) return;
    let er = -1, ec = -1;
    for (let r = 0; r < N && er === -1; r++) for (let c = 0; c < N; c++)
      if (grid[r][c] === 0){ er = r; ec = c; break; }
    if (er === -1){ solutions++; return; }
    for (let v = 1; v <= N; v++){
      if (forbidden[er][ec].has(v)) continue;
      if (placeOk(grid, er, ec, v, N, br, bc)){
        grid[er][ec] = v; dfs(); grid[er][ec] = 0;
        if (solutions >= 2) return;
      }
    }
  }
  dfs();
  const givenCount = giv.flat().filter(x => x !== 0).length;
  const margCount = level.marginal.left.flat().length + level.marginal.right.flat().length
                  + level.marginal.top.flat().length + level.marginal.bottom.flat().length;
  return { ok: solutions === 1, reason: solutions === 1 ? 'unique' : (solutions + ' solutions'),
           clues: givenCount, margCount };
}

let allOk = true;
let t0 = Date.now();
for (const lvl of data.levels){
  const res = verify(lvl);
  const mark = res.ok ? 'PASS' : 'FAIL';
  if (!res.ok) allOk = false;
  console.log(`${mark} #${String(lvl.id).padStart(2)} ${lvl.tier.padEnd(10)} N=${lvl.N} K=${lvl.K} givens=${res.clues} marg=${res.margCount} — ${res.reason}`);
}
const dt = ((Date.now()-t0)/1000).toFixed(2);
console.log(`\n${allOk ? 'PASS — ALL '+data.levels.length+' LEVELS VERIFIED: valid standard sudoku + valid marginal clues + unique puzzle' : 'FAIL — FAILURES DETECTED'} (${dt}s)`);
process.exit(allOk ? 0 : 1);
