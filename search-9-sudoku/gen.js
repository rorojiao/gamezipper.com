#!/usr/bin/env node
// Search-9 Sudoku — full-solution generator + uniqueness-verified puzzle digger.
// Rules: standard 9×9 Sudoku (rows, columns, 3×3 boxes each contain 1..9 once)
//   PLUS outside position clues: numbers outside the grid indicate the POSITION
//   of digit 9 in that row (left clues) or column (top clues).
//   - Left of row r: 1-indexed column position of digit 9 in row r
//   - Above col c: 1-indexed row position of digit 9 in column c
//   All 18 clues (9 row-left + 9 col-top) are always shown.
// Output: search-9-sudoku/levels.json
//
// Strategy:
//   1. Build a full valid 9×9 Sudoku solution via canonical-pattern + shuffles.
//   2. Compute position clues from the complete grid (where is 9 in each row/col).
//   3. Dig holes (remove givens) in random order. The solver always pre-fills
//      the 9 positions from clues, so digging those cells is "free" (no info lost).
//   4. Uniqueness check: pre-fill 9-positions from clues, then standard MRV
//      backtracking Sudoku solver counting solutions (stop at 2).
//   5. Emit levels.json + verification report.

const fs = require('fs');
const crypto = require('crypto');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// ---- standard Sudoku peers (row + col + box) ----
function buildPeers(N){
  const [br,bc]=boxSize(N);
  const peers=new Array(N*N);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const s=new Set();
    for(let i=0;i<N;i++){ if(i!==c)s.add(r*N+i); if(i!==r)s.add(i*N+c); }
    const br0=Math.floor(r/br)*br, bc0=Math.floor(c/bc)*bc;
    for(let i=0;i<br;i++)for(let j=0;j<bc;j++){ const rr=br0+i,cc=bc0+j; if(rr!==r||cc!==c)s.add(rr*N+cc); }
    peers[r*N+c]=[...s];
  }
  return peers;
}

// ---- generate complete valid Sudoku grid via canonical pattern + shuffles ----
function makeComplete(N,rng){
  const [br,bc]=boxSize(N);
  const numBands=N/br, numStacks=N/bc;
  let rowPerm=[];
  for(let b=0;b<numBands;b++){
    const rows=[]; for(let i=0;i<br;i++) rows.push(b*br+i);
    shuffle(rows,rng); rowPerm.push(rows);
  }
  shuffle(rowPerm,rng); rowPerm=rowPerm.flat();
  let colPerm=[];
  for(let s=0;s<numStacks;s++){
    const cols=[]; for(let i=0;i<bc;i++) cols.push(s*bc+i);
    shuffle(cols,rng); colPerm.push(cols);
  }
  shuffle(colPerm,rng); colPerm=colPerm.flat();
  const digitPerm=shuffle([...Array(N)].map((_,i)=>i+1),rng);
  const grid=new Int8Array(N*N);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const sr=rowPerm[r], sc=colPerm[c];
    const canonVal=((sr%br)*bc+Math.floor(sr/br)+sc)%N+1;
    grid[r*N+c]=digitPerm[canonVal-1];
  }
  return grid;
}

// ---- verify a FULL grid satisfies standard Sudoku constraints ----
function checkFull(grid,N,peers){
  for(let i=0;i<N*N;i++){
    const v=grid[i]; if(v<1||v>N)return false;
    for(const p of peers[i]) if(grid[p]===v) return false;
  }
  return true;
}

// ---- compute Search-9 position clues from a complete grid ----
// L[r] = 1-indexed column position of digit N in row r
// T[c] = 1-indexed row position of digit N in column c
function computeSearchClues(grid,N){
  const target=N;
  const L=[],T=[];
  for(let r=0;r<N;r++){
    for(let c=0;c<N;c++){
      if(grid[r*N+c]===target){ L.push(c+1); break; }
    }
  }
  for(let c=0;c<N;c++){
    for(let r=0;r<N;r++){
      if(grid[r*N+c]===target){ T.push(r+1); break; }
    }
  }
  return {L,T};
}

// ---- solution counter with Search-9 position clues (stop at `limit`) ----
// Pre-fills the N-positions from clues, then standard MRV backtracking.
function countSolutions(grid,N,peers,clues,limit){
  const g=new Int8Array(grid);
  const target=N;
  // Pre-fill target positions from row clues
  for(let r=0;r<N;r++){
    const c=clues.L[r]-1;
    if(g[r*N+c]===0) g[r*N+c]=target;
  }
  // Column clues should be consistent (same solution) — also fill
  for(let c=0;c<N;c++){
    const r=clues.T[c]-1;
    if(g[r*N+c]===0) g[r*N+c]=target;
  }
  let count=0;
  function dfs(){
    if(count>=limit)return;
    let best=-1,bestCand=null;
    for(let i=0;i<N*N;i++){
      if(g[i]!==0)continue;
      let usedMask=0; const ps=peers[i];
      for(let k=0;k<ps.length;k++){ if(g[ps[k]])usedMask|=(1<<g[ps[k]]); }
      const cand=[];
      for(let v=1;v<=N;v++){ if(!(usedMask&(1<<v)))cand.push(v); }
      if(cand.length===0)return;
      if(bestCand===null||cand.length<bestCand.length){ bestCand=cand;best=i; if(cand.length===1)break; }
    }
    if(best===-1){count++;return;}
    for(const v of bestCand){ g[best]=v; dfs(); g[best]=0; if(count>=limit)return; }
  }
  dfs();
  return count;
}

// ---- dig holes to reach target clue count, keeping uniqueness ----
function digHoles(solution,N,rng,peers,clues,targetClues,maxMs){
  const t0=Date.now();
  let bestPuzzle=null, bestClues=N*N+1;
  for(let attempt=0;attempt<8;attempt++){
    const puzzle=new Int8Array(solution);
    const order=shuffle([...Array(N*N)].map((_,i)=>i),rng);
    let givenCount=N*N;
    for(const idx of order){
      if(givenCount<=targetClues)break;
      if(Date.now()-t0>maxMs)break;
      const save=puzzle[idx];
      if(save===0)continue;
      puzzle[idx]=0;
      const cnt=countSolutions(puzzle,N,peers,clues,2);
      if(cnt!==1){ puzzle[idx]=save; }
      else givenCount--;
    }
    const finalCnt=countSolutions(puzzle,N,peers,clues,2);
    if(finalCnt===1&&givenCount<bestClues){ bestPuzzle=puzzle;bestClues=givenCount; }
    if(bestClues<=targetClues)break;
  }
  if(!bestPuzzle){ bestPuzzle=new Int8Array(solution);bestClues=N*N; }
  return {puzzle:bestPuzzle,clues:bestClues};
}

// ---- tier config: 27 levels, all 9×9 ----
// clues = target interior givens (cells filled in the grid).
// Solver always gets 9 bonus positions from clues → effective = clues + 9.
const TIERS=[
  {name:'Beginner',N:9,count:4,clues:30,maxMs:12000},
  {name:'Easy',    N:9,count:4,clues:25,maxMs:15000},
  {name:'Medium',  N:9,count:5,clues:22,maxMs:18000},
  {name:'Hard',    N:9,count:5,clues:20,maxMs:22000},
  {name:'Expert',  N:9,count:5,clues:17,maxMs:28000},
  {name:'Master',  N:9,count:4,clues:14,maxMs:35000},
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }

function main(){
  const seedBase=parseInt(crypto.createHash('md5').update('search-9-sudoku-v1-'+Date.now()).digest('hex').slice(0,8),16);
  let rng=mulberry32(seedBase);
  const peersCache={};
  function peersFor(N){ return peersCache[N]||(peersCache[N]=buildPeers(N)); }

  const levels=[]; let id=1;
  for(const tier of TIERS){
    const peers=peersFor(tier.N);
    for(let i=0;i<tier.count;i++){
      process.stderr.write(`Generating ${tier.name} #${i+1} (N=${tier.N}, target=${tier.clues} givens)... `);
      const t0=Date.now();
      let sol=null;
      while(!sol){
        sol=makeComplete(tier.N,rng);
        if(!checkFull(sol,tier.N,peers)) throw new Error('generated grid failed constraint check');
      }
      const sclues=computeSearchClues(sol,tier.N);
      if(!sclues||!sclues.L||sclues.L.length!==tier.N){ throw new Error('computeSearchClues failed: '+JSON.stringify(sclues)); }
      const dr=digHoles(sol,tier.N,rng,peers,sclues,tier.clues,tier.maxMs);
      const puzzle=dr.puzzle, actualClues=dr.clues;
      const dt=(Date.now()-t0)/1000;
      const chk=countSolutions(puzzle,tier.N,peers,sclues,2);
      const mark=chk===1?'UNIQUE':'NONUNIQUE('+chk+')';
      process.stderr.write(`${actualClues} givens, ${dt.toFixed(1)}s, ${mark}\n`);
      levels.push({
        id,tier:tier.name,N:tier.N,
        p:gridToArr(puzzle,tier.N),
        s:gridToArr(sol,tier.N),
        clues:{L:sclues.L,T:sclues.T},
        givens:actualClues,unique:chk===1,
      });
      id++;
    }
  }
  const allUnique=levels.every(l=>l.unique);
  const out={version:1,game:'search-9-sudoku',generated:new Date().toISOString(),levels,allUnique,count:levels.length};
  fs.writeFileSync(__dirname+'/levels.json',JSON.stringify(out));
  console.log('=== SEARCH-9 SUDOKU — GENERATION REPORT ===');
  console.log(`Generated ${levels.length} levels. All unique: ${allUnique}`);
  for(const t of TIERS){
    const ls=levels.filter(l=>l.tier===t.name);
    const cs=ls.map(l=>l.givens);
    console.log(`  ${t.name.padEnd(10)} N=${t.N}  givens=${Math.min(...cs)}-${Math.max(...cs)}  (target ${t.clues})  unique=${ls.every(l=>l.unique)}`);
  }
  console.log('levels.json written.');
  if(!allUnique){ console.error('WARNING: some levels are not unique!'); process.exit(2); }
}
main();
