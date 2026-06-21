// Binairo level generator — CORRECTED (enforces ALL 4 rules)
// Rules: 1) fill 0/1, 2) no 3-consecutive in row/col, 3) equal 0s/1s per row/col, 4) unique rows/cols
const fs = require('fs');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Check if placing `val` at (row,col) is valid given the current grid state
function isValid(grid, N, row, col, val) {
  grid[row][col] = val;
  // Check row for 3-consecutive around this cell
  for (let c = Math.max(0, col - 2); c <= Math.min(N - 3, col); c++) {
    if (grid[row][c] !== -1 && grid[row][c+1] !== -1 && grid[row][c+2] !== -1 &&
        grid[row][c] === grid[row][c+1] && grid[row][c+1] === grid[row][c+2]) {
      grid[row][col] = -1;
      return false;
    }
  }
  // Check col for 3-consecutive around this cell
  for (let r = Math.max(0, row - 2); r <= Math.min(N - 3, row); r++) {
    if (grid[r][col] !== -1 && grid[r+1][col] !== -1 && grid[r+2][col] !== -1 &&
        grid[r][col] === grid[r+1][col] && grid[r+1][col] === grid[r+2][col]) {
      grid[row][col] = -1;
      return false;
    }
  }
  // Check row count: zeros and ones must not exceed N/2
  let zeros = 0, ones = 0;
  for (let c = 0; c < N; c++) {
    if (grid[row][c] === 0) zeros++;
    else if (grid[row][c] === 1) ones++;
  }
  if (zeros > N/2 || ones > N/2) {
    grid[row][col] = -1;
    return false;
  }
  // Check col count
  zeros = 0; ones = 0;
  for (let r = 0; r < N; r++) {
    if (grid[r][col] === 0) zeros++;
    else if (grid[r][col] === 1) ones++;
  }
  if (zeros > N/2 || ones > N/2) {
    grid[row][col] = -1;
    return false;
  }
  grid[row][col] = -1;
  return true;
}

// Check if two partial rows are identical (for uniqueness check during generation)
function rowsCouldBeIdentical(grid, N, r1, r2) {
  for (let c = 0; c < N; c++) {
    if (grid[r1][c] !== -1 && grid[r2][c] !== -1 && grid[r1][c] !== grid[r2][c]) return false;
  }
  // Check if both rows are fully filled and identical
  let r1Full = grid[r1].every(v => v !== -1);
  let r2Full = grid[r2].every(v => v !== -1);
  if (r1Full && r2Full) {
    for (let c = 0; c < N; c++) {
      if (grid[r1][c] !== grid[r2][c]) return false;
    }
    return true; // identical full rows
  }
  return false;
}

// Generate a valid full solution via backtracking, cell by cell (row-major)
function generateSolution(N) {
  const grid = Array.from({length: N}, () => Array(N).fill(-1));
  
  function backtrack(idx) {
    if (idx === N * N) {
      // Final checks: unique rows, unique cols
      const rowStrs = new Set();
      for (let r = 0; r < N; r++) rowStrs.add(grid[r].join(''));
      if (rowStrs.size !== N) return false;
      const colStrs = new Set();
      for (let c = 0; c < N; c++) {
        let s = '';
        for (let r = 0; r < N; r++) s += grid[r][c];
        colStrs.add(s);
      }
      if (colStrs.size !== N) return false;
      return true;
    }
    const row = Math.floor(idx / N);
    const col = idx % N;
    const vals = Math.random() < 0.5 ? [0, 1] : [1, 0];
    for (const v of vals) {
      if (isValid(grid, N, row, col, v)) {
        grid[row][col] = v;
        // Check row uniqueness: this row must not be identical to any previous FULL row
        let rowOk = true;
        for (let r = 0; r < row; r++) {
          if (rowsCouldBeIdentical(grid, N, r, row)) {
            rowOk = false;
            break;
          }
        }
        if (rowOk) {
          if (backtrack(idx + 1)) return true;
        }
        grid[row][col] = -1;
      }
    }
    return false;
  }
  
  if (backtrack(0)) return grid;
  return null;
}

// Solver that counts solutions (up to limit) — enforces ALL rules
function countSolutions(puzzle, N, limit) {
  const grid = puzzle.map(r => [...r]);
  let count = 0;
  
  function isValidPlace(grid, N, row, col, val) {
    grid[row][col] = val;
    // 3-consecutive row
    for (let c = Math.max(0, col-2); c <= Math.min(N-3, col); c++) {
      if (grid[row][c] !== -1 && grid[row][c+1] !== -1 && grid[row][c+2] !== -1 &&
          grid[row][c] === grid[row][c+1] && grid[row][c+1] === grid[row][c+2]) {
        grid[row][col] = -1; return false;
      }
    }
    // 3-consecutive col
    for (let r = Math.max(0, row-2); r <= Math.min(N-3, row); r++) {
      if (grid[r][col] !== -1 && grid[r+1][col] !== -1 && grid[r+2][col] !== -1 &&
          grid[r][col] === grid[r+1][col] && grid[r+1][col] === grid[r+2][col]) {
        grid[row][col] = -1; return false;
      }
    }
    // Row count
    let z=0,o=0;
    for (let c=0;c<N;c++){if(grid[row][c]===0)z++;else if(grid[row][c]===1)o++;}
    if (z>N/2||o>N/2){grid[row][col]=-1;return false;}
    // Col count
    z=0;o=0;
    for (let r=0;r<N;r++){if(grid[r][col]===0)z++;else if(grid[r][col]===1)o++;}
    if (z>N/2||o>N/2){grid[row][col]=-1;return false;}
    grid[row][col]=-1;
    return true;
  }
  
  function solve(idx) {
    if (count >= limit) return;
    if (idx === N*N) {
      // Check unique rows/cols
      const rs = new Set();
      for (let r=0;r<N;r++) rs.add(grid[r].join(''));
      if (rs.size!==N) return;
      const cs = new Set();
      for (let c=0;c<N;c++){let s='';for(let r=0;r<N;r++)s+=grid[r][c];cs.add(s);}
      if (cs.size!==N) return;
      count++;
      return;
    }
    const row = Math.floor(idx/N);
    const col = idx%N;
    if (grid[row][col] !== -1) { solve(idx+1); return; }
    for (const v of [0,1]) {
      if (isValidPlace(grid,N,row,col,v)) {
        grid[row][col]=v;
        solve(idx+1);
        grid[row][col]=-1;
      }
      if (count>=limit) return;
    }
  }
  
  solve(0);
  return count;
}

function hasUniqueSolution(puzzle, N) {
  return countSolutions(puzzle, N, 2) === 1;
}

// Dig holes from a valid solution
function digHoles(solution, N, targetGivens) {
  const puzzle = solution.map(r => [...r]);
  const total = N * N;
  const order = shuffle([...Array(total).keys()]);
  let givens = total;
  
  for (const idx of order) {
    if (givens <= targetGivens) break;
    const r = Math.floor(idx / N);
    const c = idx % N;
    const saved = puzzle[r][c];
    puzzle[r][c] = -1;
    if (hasUniqueSolution(puzzle, N)) {
      givens--;
    } else {
      puzzle[r][c] = saved;
    }
  }
  return puzzle;
}

// LEVEL SPEC
const LEVELS_SPEC = [
  {tier:'Beginner',size:6,count:4,minGivens:16,maxGivens:20},
  {tier:'Easy',    size:6,count:4,minGivens:12,maxGivens:14},
  {tier:'Medium',  size:8,count:5,minGivens:24,maxGivens:28},
  {tier:'Hard',    size:8,count:5,minGivens:20,maxGivens:24},
  {tier:'Expert',  size:10,count:5,minGivens:36,maxGivens:42},
  {tier:'Master',  size:12,count:4,minGivens:54,maxGivens:62},
];

const levels = [];
let id = 1;
const t0 = Date.now();

for (const spec of LEVELS_SPEC) {
  for (let i = 0; i < spec.count; i++) {
    const N = spec.size;
    const targetGivens = spec.minGivens + Math.floor(Math.random() * (spec.maxGivens - spec.minGivens + 1));
    
    process.stdout.write(`#${id} ${spec.tier} ${N}x${N} target=${targetGivens}... `);
    const sol = generateSolution(N);
    if (!sol) { console.log('FAILED to generate solution!'); process.exit(1); }
    
    const puzzle = digHoles(sol, N, targetGivens);
    const actualGivens = puzzle.flat().filter(v => v !== -1).length;
    
    // Final uniqueness check
    const unique = hasUniqueSolution(puzzle, N);
    if (!unique) { console.log('NOT UNIQUE — regenerating...'); i--; continue; }
    
    const givens = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (puzzle[r][c] !== -1) givens.push([r, c, puzzle[r][c]]);
      }
    }
    
    levels.push({
      id, tier: spec.tier, size: N,
      givens, solution: sol
    });
    
    console.log(`${actualGivens} givens, unique=OK (${((Date.now()-t0)/1000).toFixed(1)}s)`);
    id++;
  }
}

const outPath = __dirname + '/levels.json';
fs.writeFileSync(outPath, JSON.stringify(levels));
console.log(`\n${levels.length}/${levels.length} levels generated in ${((Date.now()-t0)/1000).toFixed(1)}s`);
console.log(`Written to ${outPath}`);
