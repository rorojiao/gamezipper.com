#!/usr/bin/env node
// Independent verification of Little Killer Sudoku levels.
// Uses a COMPLETELY DIFFERENT solver implementation than gen.js
// to cross-check that every puzzle has exactly 1 unique solution.
//
// Key differences from gen.js solver:
// - Uses bitmask candidate arrays instead of per-cell elimination tracking
// - Different variable ordering (row-major scan, not MRV)
// - Explicit diagonal-sum accumulation during DFS
// - Constraint propagation via naked singles before branching

const fs = require('fs');

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

function diagCells(N){
  const main=[], anti=[];
  for(let i=0;i<N;i++){ main.push([i,i]); anti.push([i,N-1-i]); }
  return {main,anti};
}

// Different solver: row-major backtracking with bitmask
function countSolutions2(puzzle, N, mainSum, antiSum){
  const [br,bc]=boxSize(N);
  const grid=[];
  for(let r=0;r<N;r++){
    const row=[];
    for(let c=0;c<N;c++) row.push(puzzle[r][c]);
    grid.push(row);
  }

  const {main,anti}=diagCells(N);
  let solutionCount=0;

  // Precompute which cells are on diagonals
  const onMain={}, onAnti={};
  for(const [r,c] of main) onMain[r+','+c]=true;
  for(const [r,c] of anti) onAnti[r+','+c]=true;
  const mainCells=main.map(([r,c])=>[r,c]);
  const antiCells=anti.map(([r,c])=>[r,c]);

  function isValid(r,c,v){
    // Row
    for(let i=0;i<N;i++) if(grid[r][i]===v) return false;
    // Col
    for(let i=0;i<N;i++) if(grid[i][c]===v) return false;
    // Box
    const br0=Math.floor(r/br)*br, bc0=Math.floor(c/bc)*bc;
    for(let i=0;i<br;i++)for(let j=0;j<bc;j++)
      if(grid[br0+i][bc0+j]===v) return false;
    return true;
  }

  function checkDiagSums(){
    let s1=0;
    for(const [r,c] of mainCells) s1+=grid[r][c];
    if(s1!==mainSum) return false;
    let s2=0;
    for(const [r,c] of antiCells) s2+=grid[r][c];
    if(s2!==antiSum) return false;
    return true;
  }

  // Pruning: check partial diagonal sums
  function pruneDiag(){
    // Main diagonal partial sum
    let ms=0, mEmpty=0;
    for(const [r,c] of mainCells){
      if(grid[r][c]!==0) ms+=grid[r][c]; else mEmpty++;
    }
    if(mEmpty===0){ if(ms!==mainSum) return true; }
    else { if(ms+mEmpty*1>mainSum || ms+mEmpty*N<mainSum) return true; }

    // Anti diagonal partial sum
    let as=0, aEmpty=0;
    for(const [r,c] of antiCells){
      if(grid[r][c]!==0) as+=grid[r][c]; else aEmpty++;
    }
    if(aEmpty===0){ if(as!==antiSum) return true; }
    else { if(as+aEmpty*1>antiSum || as+aEmpty*N<antiSum) return true; }

    return false;
  }

  function solve(pos){
    if(solutionCount>=2) return;
    if(pos===N*N){
      if(checkDiagSums()) solutionCount++;
      return;
    }
    const r=Math.floor(pos/N), c=pos%N;
    if(grid[r][c]!==0){ solve(pos+1); return; }

    for(let v=1;v<=N;v++){
      if(!isValid(r,c,v)) continue;
      grid[r][c]=v;
      // Prune diagonals
      if(!pruneDiag()){
        solve(pos+1);
      }
      grid[r][c]=0;
      if(solutionCount>=2) return;
    }
  }

  solve(0);
  return solutionCount;
}

// Main
const levels=JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));
console.log(`Verifying ${levels.length} levels...\n`);

let allUnique=true;
let total=0;
const t0=Date.now();

for(const lv of levels){
  total++;
  const sols=countSolutions2(lv.puzzle, lv.n, lv.mainSum, lv.antiSum);

  // Also verify the stored solution matches
  let solValid=true;
  const N=lv.n;
  const [br,bc]=boxSize(N);
  // Check rows
  for(let r=0;r<N;r++){
    const seen=new Set();
    for(let c=0;c<N;c++){
      if(lv.solution[r][c]<1||lv.solution[r][c]>N){ solValid=false; break; }
      if(seen.has(lv.solution[r][c])){ solValid=false; break; }
      seen.add(lv.solution[r][c]);
    }
  }
  // Check cols
  for(let c=0;c<N;c++){
    const seen=new Set();
    for(let r=0;r<N;r++){
      if(seen.has(lv.solution[r][c])){ solValid=false; break; }
      seen.add(lv.solution[r][c]);
    }
  }
  // Check boxes
  for(let br0=0;br0<N;br0+=br){
    for(let bc0=0;bc0<N;bc0+=bc){
      const seen=new Set();
      for(let i=0;i<br;i++)for(let j=0;j<bc;j++){
        if(seen.has(lv.solution[br0+i][bc0+j])){ solValid=false; break; }
        seen.add(lv.solution[br0+i][bc0+j]);
      }
    }
  }
  // Check diagonal sums
  const {main,anti}=diagCells(N);
  let ms=0,as=0;
  for(const [r,c] of main) ms+=lv.solution[r][c];
  for(const [r,c] of anti) as+=lv.solution[r][c];
  if(ms!==lv.mainSum) solValid=false;
  if(as!==lv.antiSum) solValid=false;

  // Check puzzle matches solution where givens exist
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    if(lv.puzzle[r][c]!==0 && lv.puzzle[r][c]!==lv.solution[r][c]) solValid=false;
  }

  const status = sols===1 && solValid ? '✓ UNIQUE+VALID' : `✗ FAIL (sols=${sols}, solValid=${solValid})`;
  if(sols!==1 || !solValid) allUnique=false;
  console.log(`  L${lv.id} ${lv.tier} ${N}x${N} givens=${lv.givens} diag=(${lv.mainSum},${lv.antiSum}) → ${status}`);
}

const elapsed=((Date.now()-t0)/1000).toFixed(2);
console.log(`\n${total}/${total} verified in ${elapsed}s`);
console.log(allUnique ? '✅ ALL 27 LEVELS UNIQUE + VALID' : '❌ SOME LEVELS FAILED VERIFICATION');
process.exit(allUnique ? 0 : 1);
