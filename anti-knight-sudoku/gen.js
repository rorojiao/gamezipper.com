#!/usr/bin/env node
// Anti-Knight Sudoku — full-solution generator + uniqueness-verified puzzle digger.
// Rules: standard Sudoku (rows, columns, boxes each contain 1..N once)
//   PLUS anti-knight: no two cells a knight's-move apart (L-shape: ±1,±2 / ±2,±1)
//   may share the same digit.
// Output: anti-knight-sudoku/levels.json  (compact p=puzzle / s=solution grids)
//
// Strategy:
//   1. Build a full valid anti-knight solution via MRV backtracking with a
//      unified peer set (row+col+box+knight).
//   2. Dig holes (remove clues) in random order, re-checking uniqueness with an
//      independent knight-aware solution counter (stop at 2), until the target
//      clue count is reached or the time budget is exhausted.
//   3. Emit levels.json + a printed verification report.

const fs = require('fs');
const crypto = require('crypto');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// ---- KNIGHT move offsets: (±1,±2) and (±2,±1) = 8 targets ----
const KNIGHT_DELTAS = [
  [-2,-1],[-2,1],[ -1,-2],[-1,2],
  [ 1,-2],[ 1,2],[  2,-1],[ 2,1],
];

// ---- unified peer list: every cell that CONFLICTS with a given cell
// (same row OR same column OR same box OR a knight's move away) ----
function buildPeers(N){
  const [br,bc]=boxSize(N);
  const peers=new Array(N*N);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const s=new Set();
    for(let i=0;i<N;i++){ if(i!==c)s.add(r*N+i); if(i!==r)s.add(i*N+c); }
    const br0=Math.floor(r/br)*br, bc0=Math.floor(c/bc)*bc;
    for(let i=0;i<br;i++)for(let j=0;j<bc;j++){ const rr=br0+i,cc=bc0+j; if(rr!==r||cc!==c)s.add(rr*N+cc); }
    // knight moves
    for(const [dr,dc] of KNIGHT_DELTAS){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<N&&nc>=0&&nc<N)s.add(nr*N+nc);
    }
    peers[r*N+c]=[...s];
  }
  return peers;
}

// ---- verify a FULL grid satisfies every constraint (defensive) ----
function checkFull(grid,N,peers){
  for(let i=0;i<N*N;i++){
    const v=grid[i]; if(v<1||v>N)return false;
    for(const p of peers[i]) if(grid[p]===v) return false;
  }
  return true;
}

// ---- MRV backtracking fill of an EMPTY grid -> full anti-knight solution ----
function makeFilled(N,rng,peers){
  const grid=new Int8Array(N*N);
  function bt(){
    let best=-1,bestCand=null;
    for(let i=0;i<N*N;i++){
      if(grid[i]!==0)continue;
      const cand=[];
      for(let v=1;v<=N;v++){ let ok=true; const ps=peers[i]; for(let k=0;k<ps.length;k++){ if(grid[ps[k]]===v){ok=false;break;} } if(ok)cand.push(v); }
      if(cand.length===0)return false;
      if(bestCand===null||cand.length<bestCand.length){ bestCand=cand; best=i; if(cand.length===1)break; }
    }
    if(best===-1)return true;
    shuffle(bestCand,rng);
    for(const v of bestCand){ grid[best]=v; if(bt())return true; grid[best]=0; }
    return false;
  }
  if(!bt()) return null;
  return grid;
}

// ---- knight-aware solution counter (stop at `limit`) ----
function countSolutions(grid,N,peers,limit){
  const g=new Int8Array(grid);   // copy
  let count=0;
  function dfs(){
    if(count>=limit)return;
    let best=-1,bestCand=null;
    for(let i=0;i<N*N;i++){
      if(g[i]!==0)continue;
      const cand=[]; const ps=peers[i];
      for(let v=1;v<=N;v++){ let ok=true; for(let k=0;k<ps.length;k++){ if(g[ps[k]]===v){ok=false;break;} } if(ok)cand.push(v); }
      if(cand.length===0)return;
      if(bestCand===null||cand.length<bestCand.length){ bestCand=cand; best=i; if(cand.length===1)break; }
    }
    if(best===-1){ count++; return; }
    for(const v of bestCand){ g[best]=v; dfs(); g[best]=0; if(count>=limit)return; }
  }
  dfs();
  return count;
}

// ---- digit relabel (always preserves sudoku + knight) for extra variety ----
function relabel(grid,N,rng){
  const perm=shuffle([...Array(N)].map((_,i)=>i+1),rng);
  const out=new Int8Array(N*N);
  for(let i=0;i<N*N;i++) out[i]=perm[grid[i]-1];
  return out;
}

// ---- dig holes to reach a target clue count, keeping uniqueness ----
function digHoles(solution,N,rng,peers,targetClues,maxMs){
  const t0=Date.now();
  let bestPuzzle=null, bestClues=N*N+1;
  for(let attempt=0; attempt<6; attempt++){
    const puzzle=new Int8Array(solution);
    const order=shuffle([...Array(N*N)].map((_,i)=>i),rng);
    let clues=N*N;
    for(const idx of order){
      if(clues<=targetClues)break;
      if(Date.now()-t0>maxMs)break;
      const save=puzzle[idx];
      if(save===0)continue;
      puzzle[idx]=0;
      const cnt=countSolutions(puzzle,N,peers,2);
      if(cnt!==1){ puzzle[idx]=save; }
      else clues--;
    }
    const finalCnt=countSolutions(puzzle,N,peers,2);
    if(finalCnt===1 && clues<bestClues){ bestPuzzle=puzzle; bestClues=clues; }
    if(bestClues<=targetClues) break;
  }
  if(!bestPuzzle){ bestPuzzle=new Int8Array(solution); bestClues=N*N; }
  return { puzzle:bestPuzzle, clues:bestClues };
}

// ---- tier config (same structure as anti-king: 6x6 tiers 1-3, 9x9 tiers 4-6) ----
const TIERS=[
  {name:'Beginner', N:6, count:4, clues:22, maxMs:5000},
  {name:'Easy',     N:6, count:4, clues:15, maxMs:6000},
  {name:'Medium',   N:6, count:4, clues:12, maxMs:8000},
  {name:'Hard',     N:9, count:6, clues:34, maxMs:20000},
  {name:'Expert',   N:9, count:5, clues:26, maxMs:30000},
  {name:'Master',   N:9, count:4, clues:20, maxMs:45000},
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }

function main(){
  const seedBase=parseInt(crypto.createHash('md5').update('anti-knight-sudoku-v1-'+Date.now()).digest('hex').slice(0,8),16);
  const rng=mulberry32(seedBase);
  const peersCache={};
  function peersFor(N){ return peersCache[N]||(peersCache[N]=buildPeers(N)); }

  const levels=[]; let id=1;
  for(const tier of TIERS){
    const peers=peersFor(tier.N);
    for(let i=0;i<tier.count;i++){
      process.stderr.write(`Generating ${tier.name} #${i+1} (N=${tier.N}, target=${tier.clues} clues)... `);
      const t0=Date.now();
      let sol=makeFilled(tier.N,rng,peers);
      if(!sol){ throw new Error('makeFilled returned null for N='+tier.N); }
      if(Math.random()<0.5) sol=relabel(sol,tier.N,rng);
      if(!checkFull(sol,tier.N,peers)) throw new Error('full solution failed constraint check N='+tier.N);
      const { puzzle, clues } = digHoles(sol,tier.N,rng,peers,tier.clues,tier.maxMs);
      const dt=(Date.now()-t0)/1000;
      const chk=countSolutions(puzzle,tier.N,peers,2);
      const mark = chk===1 ? 'UNIQUE' : 'NONUNIQUE('+chk+')';
      process.stderr.write(`${clues} clues, ${dt.toFixed(1)}s, ${mark}\n`);
      levels.push({
        id, tier:tier.name, N:tier.N,
        p: gridToArr(puzzle,tier.N),
        s: gridToArr(sol,tier.N),
        clues, unique: chk===1,
      });
      id++;
    }
  }
  const allUnique = levels.every(l=>l.unique);
  const out={ version:1, game:'anti-knight-sudoku', generated:new Date().toISOString(), levels, allUnique, count:levels.length };
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(out));
  console.log('=== ANTI-KNIGHT SUDOKU — GENERATION REPORT ===');
  console.log(`Generated ${levels.length} levels. All unique: ${allUnique}`);
  for(const t of TIERS){
    const ls=levels.filter(l=>l.tier===t.name);
    const cs=ls.map(l=>l.clues);
    console.log(`  ${t.name.padEnd(10)} N=${t.N}  clues=${Math.min(...cs)}-${Math.max(...cs)}  (target ${t.clues})  unique=${ls.every(l=>l.unique)}`);
  }
  console.log('levels.json written.');
  if(!allUnique){ console.error('WARNING: some levels are not unique!'); process.exit(2); }
}
main();
