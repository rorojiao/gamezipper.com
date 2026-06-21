#!/usr/bin/env node
// Outside Sudoku (Marginal Sudoku) — full-solution generator + uniqueness-verified puzzle digger.
// Rules: standard Sudoku (rows, columns, boxes each contain 1..N once)
//   PLUS outside clues: digits listed outside the grid indicate which numbers
//   appear in the nearest box-dimension cells of that row/column.
//   - Left of row r: digits in cols 0..bc-1 of row r
//   - Right of row r: digits in cols N-bc..N-1 of row r
//   - Above col c: digits in rows 0..br-1 of col c
//   - Below col c: digits in rows N-br..N-1 of col c
// Output: outside-sudoku/levels.json (compact p/s/out grids)
//
// Strategy:
//   1. Build a full valid Sudoku solution via canonical-pattern + shuffles
//      (row-within-band, band, col-within-stack, stack, digit relabel).
//   2. Compute outside clues from the complete grid.
//   3. Dig holes (remove givens) in random order, re-checking uniqueness with
//      an outside-aware solution counter (stop at 2), until target clue count.
//   4. Emit levels.json + verification report.

const fs = require('fs');
const crypto = require('crypto');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// ---- standard Sudoku peers (row + col + box, NO extra region) ----
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
  // Row permutation: shuffle within bands, then shuffle bands
  let rowPerm=[];
  for(let b=0;b<numBands;b++){
    const rows=[]; for(let i=0;i<br;i++) rows.push(b*br+i);
    shuffle(rows,rng); rowPerm.push(rows);
  }
  shuffle(rowPerm,rng); rowPerm=rowPerm.flat();
  // Col permutation: shuffle within stacks, then shuffle stacks
  let colPerm=[];
  for(let s=0;s<numStacks;s++){
    const cols=[]; for(let i=0;i<bc;i++) cols.push(s*bc+i);
    shuffle(cols,rng); colPerm.push(cols);
  }
  shuffle(colPerm,rng); colPerm=colPerm.flat();
  // Digit relabel
  const digitPerm=shuffle([...Array(N)].map((_,i)=>i+1),rng);
  // Build grid: grid[r][c] = relabel(canon[rowPerm[r]][colPerm[c]])
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

// ---- compute outside clues from a complete grid ----
function computeOutside(grid,N){
  const [br,bc]=boxSize(N);
  const g=(r,c)=>grid[r*N+c];
  const L=[],R=[],T=[],B=[];
  for(let r=0;r<N;r++){
    const left=[]; for(let c=0;c<bc;c++) left.push(g(r,c));
    L.push(left.sort((a,b)=>a-b));
    const right=[]; for(let c=N-bc;c<N;c++) right.push(g(r,c));
    R.push(right.sort((a,b)=>a-b));
  }
  for(let c=0;c<N;c++){
    const top=[]; for(let r=0;r<br;r++) top.push(g(r,c));
    T.push(top.sort((a,b)=>a-b));
    const bottom=[]; for(let r=N-br;r<N;r++) bottom.push(g(r,c));
    B.push(bottom.sort((a,b)=>a-b));
  }
  return {L,R,T,B};
}

// ---- outside-aware solution counter (stop at `limit`) ----
function countSolutions(grid,N,peers,outside,limit){
  const [br,bc]=boxSize(N);
  const g=new Int8Array(grid);
  // Precompute bitmasks for outside zones
  const Lmask=outside.L.map(a=>a.reduce((m,d)=>m|(1<<d),0));
  const Rmask=outside.R.map(a=>a.reduce((m,d)=>m|(1<<d),0));
  const Tmask=outside.T.map(a=>a.reduce((m,d)=>m|(1<<d),0));
  const Bmask=outside.B.map(a=>a.reduce((m,d)=>m|(1<<d),0));
  const allBits=(1<<(N+1))-2; // bits 1..N
  let count=0;
  function dfs(){
    if(count>=limit)return;
    let best=-1,bestCand=null;
    for(let i=0;i<N*N;i++){
      if(g[i]!==0)continue;
      const r=Math.floor(i/N),c=i%N;
      // Peer conflict mask
      let usedMask=0; const ps=peers[i];
      for(let k=0;k<ps.length;k++){ if(g[ps[k]])usedMask|=(1<<g[ps[k]]); }
      // Outside zone constraint
      let allowed=allBits;
      if(c<bc) allowed&=Lmask[r];
      if(c>=N-bc) allowed&=Rmask[r];
      if(r<br) allowed&=Tmask[c];
      if(r>=N-br) allowed&=Bmask[c];
      const finalMask=allowed&~usedMask;
      const cand=[];
      for(let v=1;v<=N;v++){ if(finalMask&(1<<v))cand.push(v); }
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
function digHoles(solution,N,rng,peers,outside,targetClues,maxMs){
  const t0=Date.now();
  let bestPuzzle=null, bestClues=N*N+1;
  for(let attempt=0;attempt<6;attempt++){
    const puzzle=new Int8Array(solution);
    const order=shuffle([...Array(N*N)].map((_,i)=>i),rng);
    let clues=N*N;
    for(const idx of order){
      if(clues<=targetClues)break;
      if(Date.now()-t0>maxMs)break;
      const save=puzzle[idx];
      if(save===0)continue;
      puzzle[idx]=0;
      const cnt=countSolutions(puzzle,N,peers,outside,2);
      if(cnt!==1){ puzzle[idx]=save; }
      else clues--;
    }
    const finalCnt=countSolutions(puzzle,N,peers,outside,2);
    if(finalCnt===1&&clues<bestClues){ bestPuzzle=puzzle;bestClues=clues; }
    if(bestClues<=targetClues)break;
  }
  if(!bestPuzzle){ bestPuzzle=new Int8Array(solution);bestClues=N*N; }
  return {puzzle:bestPuzzle,clues:bestClues};
}

// ---- tier config (27 levels: 6x6 tiers 1-3, 9x9 tiers 4-6) ----
const TIERS=[
  {name:'Beginner',N:6,count:4,clues:18,maxMs:5000},
  {name:'Easy',    N:6,count:4,clues:10,maxMs:6000},
  {name:'Medium',  N:6,count:4,clues:5,maxMs:8000},
  {name:'Hard',    N:9,count:6,clues:28,maxMs:20000},
  {name:'Expert',  N:9,count:5,clues:18,maxMs:30000},
  {name:'Master',  N:9,count:4,clues:10,maxMs:45000},
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }

function main(){
  const seedBase=parseInt(crypto.createHash('md5').update('outside-sudoku-v1-'+Date.now()).digest('hex').slice(0,8),16);
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
      const outside=computeOutside(sol,tier.N);
      const {puzzle,clues}=digHoles(sol,tier.N,rng,peers,outside,tier.clues,tier.maxMs);
      const dt=(Date.now()-t0)/1000;
      const chk=countSolutions(puzzle,tier.N,peers,outside,2);
      const mark=chk===1?'UNIQUE':'NONUNIQUE('+chk+')';
      process.stderr.write(`${clues} givens, ${dt.toFixed(1)}s, ${mark}\n`);
      levels.push({
        id,tier:tier.name,N:tier.N,
        p:gridToArr(puzzle,tier.N),
        s:gridToArr(sol,tier.N),
        out:{L:outside.L,R:outside.R,T:outside.T,B:outside.B},
        clues,unique:chk===1,
      });
      id++;
    }
  }
  const allUnique=levels.every(l=>l.unique);
  const out={version:1,game:'outside-sudoku',generated:new Date().toISOString(),levels,allUnique,count:levels.length};
  fs.writeFileSync(__dirname+'/levels.json',JSON.stringify(out));
  console.log('=== OUTSIDE SUDOKU — GENERATION REPORT ===');
  console.log(`Generated ${levels.length} levels. All unique: ${allUnique}`);
  for(const t of TIERS){
    const ls=levels.filter(l=>l.tier===t.name);
    const cs=ls.map(l=>l.clues);
    console.log(`  ${t.name.padEnd(10)} N=${t.N}  givens=${Math.min(...cs)}-${Math.max(...cs)}  (target ${t.clues})  unique=${ls.every(l=>l.unique)}`);
  }
  console.log('levels.json written.');
  if(!allUnique){ console.error('WARNING: some levels are not unique!'); process.exit(2); }
}
main();
