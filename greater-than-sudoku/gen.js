#!/usr/bin/env node
// Greater-Than Sudoku — full-solution generator + uniqueness-verified puzzle digger.
// Rules: standard Sudoku (rows, columns, boxes each contain 1..N once)
//   PLUS greater-than / less-than signs between orthogonally-adjacent cells.
//   The open jaw of ">" points toward the LARGER digit.
//
// Strategy:
//   1. Build a full valid STANDARD Sudoku solution (MRV backtracking). The
//      inequalities are DERIVED from this solution, so they are automatically
//      consistent.
//   2. Derive ALL horizontal + vertical inequality signs from the solution.
//   3. Dig givens (remove digit clues) in random order, re-checking uniqueness
//      with an inequality-aware solution counter (stop at 2), until the target
//      given count is reached or the time budget is exhausted.
//   4. Emit levels.json + a printed verification report.
//
// Data shape per level:
//   { id, tier, N, p:[[givens, 0=empty]...], s:[[solution]...],
//     h:[[ '>'|'<' , ...] N rows x (N-1) cols],   // h[r][c]: relation (r,c) vs (r,c+1)
//     v:[[ '>'|'<' , ...] (N-1) rows x N cols],   // v[r][c]: relation (r,c) vs (r+1,c)
//     clues, unique }
//   '>' at h[r][c] means sol[r][c] > sol[r][c+1].

const fs = require('fs');
const crypto = require('crypto');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// ---- standard Sudoku peers (row + col + box only — NO inequality in peers,
//      inequalities are a SEPARATE constraint enforced in the solver) ----
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

// ---- precompute, for every cell, the list of inequality constraints it must
//      satisfy. Each entry: { idx: neighborCellIndex, gt: boolean }
//      gt=true  -> this cell must be GREATER than neighbor
//      gt=false -> this cell must be LESS than neighbor ----
function buildIneqConstraints(N, h, v){
  const cons = new Array(N*N);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const list = [];
    // horizontal: (r,c) vs (r,c+1)
    if(c < N-1 && h[r][c]){
      if(h[r][c]==='>') list.push({idx:r*N+(c+1), gt:true});   // this > right
      else              list.push({idx:r*N+(c+1), gt:false});  // this < right
    }
    // horizontal: (r,c-1) vs (r,c)
    if(c > 0 && h[r][c-1]){
      if(h[r][c-1]==='>') list.push({idx:r*N+(c-1), gt:false}); // left > this  => this < left
      else                list.push({idx:r*N+(c-1), gt:true});  // left < this  => this > left
    }
    // vertical: (r,c) vs (r+1,c)
    if(r < N-1 && v[r][c]){
      if(v[r][c]==='>') list.push({idx:(r+1)*N+c, gt:true});
      else              list.push({idx:(r+1)*N+c, gt:false});
    }
    // vertical: (r-1,c) vs (r,c)
    if(r > 0 && v[r-1][c]){
      if(v[r-1][c]==='>') list.push({idx:(r-1)*N+c, gt:false});
      else                list.push({idx:(r-1)*N+c, gt:true});
    }
    cons[r*N+c] = list;
  }
  return cons;
}

// ---- verify a FULL grid satisfies standard Sudoku + inequality constraints ----
function checkFull(grid,N,peers,cons){
  for(let i=0;i<N*N;i++){
    const val=grid[i]; if(val<1||val>N)return false;
    for(const p of peers[i]) if(grid[p]===val) return false;
    for(const ct of cons[i]){
      const nv=grid[ct.idx];
      if(ct.gt && !(val>nv)) return false;
      if(!ct.gt && !(val<nv)) return false;
    }
  }
  return true;
}

// ---- MRV backtracking fill of an EMPTY grid -> full standard Sudoku solution ----
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

// ---- derive ALL inequality signs from a full solution ----
function deriveInequalities(sol, N){
  const h = [], v = [];
  for(let r=0;r<N;r++){
    const row=[];
    for(let c=0;c<N-1;c++) row.push(sol[r*N+c] > sol[r*N+c+1] ? '>' : '<');
    h.push(row);
  }
  for(let r=0;r<N-1;r++){
    const row=[];
    for(let c=0;c<N;c++) row.push(sol[r*N+c] > sol[(r+1)*N+c] ? '>' : '<');
    v.push(row);
  }
  return { h, v };
}

// ---- inequality-aware candidate list for a single empty cell ----
function candidates(grid, i, N, peers, cons){
  const cand=[];
  for(let v=1;v<=N;v++){
    let ok=true;
    const ps=peers[i];
    for(let k=0;k<ps.length;k++){ if(grid[ps[k]]===v){ok=false;break;} }
    if(!ok) continue;
    for(let k=0;k<cons[i].length;k++){
      const ct=cons[i][k]; const nv=grid[ct.idx];
      if(nv===0) continue; // neighbor empty — defer
      if(ct.gt && !(v>nv)){ ok=false; break; }
      if(!ct.gt && !(v<nv)){ ok=false; break; }
    }
    if(ok) cand.push(v);
  }
  return cand;
}

// ---- inequality-aware solution counter (stop at `limit`) ----
function countSolutions(grid,N,peers,cons,limit){
  const g=new Int8Array(grid);
  let count=0;
  function dfs(){
    if(count>=limit)return;
    let best=-1,bestCand=null;
    for(let i=0;i<N*N;i++){
      if(g[i]!==0)continue;
      const cand=candidates(g,i,N,peers,cons);
      if(cand.length===0)return;
      if(bestCand===null||cand.length<bestCand.length){ bestCand=cand; best=i; if(cand.length===1)break; }
    }
    if(best===-1){ count++; return; }
    for(const v of bestCand){ g[best]=v; dfs(); g[best]=0; if(count>=limit)return; }
  }
  dfs();
  return count;
}

// ---- digit relabel (preserves standard Sudoku; inequalities stay consistent
//      because relabel is a monotone bijection — '>'/'<' are preserved) ----
function relabel(grid,N,rng){
  const perm=shuffle([...Array(N)].map((_,i)=>i+1),rng);
  const out=new Int8Array(N*N);
  for(let i=0;i<N*N;i++) out[i]=perm[grid[i]-1];
  return out;
}

// ---- dig givens to reach a target clue count, keeping uniqueness ----
function digGivens(solution,N,rng,peers,cons,targetGivens,maxMs){
  const t0=Date.now();
  let bestPuzzle=null, bestClues=N*N+1;
  for(let attempt=0; attempt<8; attempt++){
    const puzzle=new Int8Array(solution);
    const order=shuffle([...Array(N*N)].map((_,i)=>i),rng);
    let clues=N*N;
    for(const idx of order){
      if(clues<=targetGivens)break;
      if(Date.now()-t0>maxMs)break;
      const save=puzzle[idx];
      if(save===0)continue;
      puzzle[idx]=0;
      const cnt=countSolutions(puzzle,N,peers,cons,2);
      if(cnt!==1){ puzzle[idx]=save; }
      else clues--;
    }
    const finalCnt=countSolutions(puzzle,N,peers,cons,2);
    if(finalCnt===1 && clues<bestClues){ bestPuzzle=puzzle; bestClues=clues; }
    if(bestClues<=targetGivens) break;
  }
  if(!bestPuzzle){ bestPuzzle=new Int8Array(solution); bestClues=N*N; }
  return { puzzle:bestPuzzle, clues:bestClues };
}

// ---- tier config (6x6 tiers 1-3, 9x9 tiers 4-6). targetGivens sets difficulty:
//      more givens = easier. Master aims for near-pure (very few givens). ----
const TIERS=[
  {name:'Beginner', N:6, count:4, targetGivens:18, maxMs:6000},
  {name:'Easy',     N:6, count:4, targetGivens:12, maxMs:8000},
  {name:'Medium',   N:6, count:4, targetGivens:6,  maxMs:10000},
  {name:'Hard',     N:9, count:6, targetGivens:35, maxMs:25000},
  {name:'Expert',   N:9, count:5, targetGivens:20, maxMs:35000},
  {name:'Master',   N:9, count:4, targetGivens:8,  maxMs:50000},
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }

function main(){
  const seedBase=parseInt(crypto.createHash('md5').update('greater-than-sudoku-v1-'+Date.now()).digest('hex').slice(0,8),16);
  const rng=mulberry32(seedBase);
  const peersCache={};
  function peersFor(N){ return peersCache[N]||(peersCache[N]=buildPeers(N)); }

  const levels=[]; let id=1;
  for(const tier of TIERS){
    const peers=peersFor(tier.N);
    for(let i=0;i<tier.count;i++){
      process.stderr.write(`Generating ${tier.name} #${i+1} (N=${tier.N}, target=${tier.targetGivens} givens)... `);
      const t0=Date.now();
      let sol=makeFilled(tier.N,rng,peers);
      if(!sol){ throw new Error('makeFilled returned null for N='+tier.N); }
      if(Math.random()<0.5) sol=relabel(sol,tier.N,rng);
      const { h, v } = deriveInequalities(sol, tier.N);
      const cons = buildIneqConstraints(tier.N, h, v);
      if(!checkFull(sol,tier.N,peers,cons)) throw new Error('full solution failed constraint check N='+tier.N);
      const { puzzle, clues } = digGivens(sol,tier.N,rng,peers,cons,tier.targetGivens,tier.maxMs);
      const dt=(Date.now()-t0)/1000;
      const chk=countSolutions(puzzle,tier.N,peers,cons,2);
      const mark = chk===1 ? 'UNIQUE' : 'NONUNIQUE('+chk+')';
      process.stderr.write(`${clues} givens, ${dt.toFixed(1)}s, ${mark}\n`);
      levels.push({
        id, tier:tier.name, N:tier.N,
        p: gridToArr(puzzle,tier.N),
        s: gridToArr(sol,tier.N),
        h, v, clues, unique: chk===1,
      });
      id++;
    }
  }
  const allUnique = levels.every(l=>l.unique);
  const out={ version:1, game:'greater-than-sudoku', generated:new Date().toISOString(), levels, allUnique, count:levels.length };
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(out));
  console.log('=== GREATER-THAN SUDOKU — GENERATION REPORT ===');
  console.log(`Generated ${levels.length} levels. All unique: ${allUnique}`);
  for(const t of TIERS){
    const ls=levels.filter(l=>l.tier===t.name);
    const cs=ls.map(l=>l.clues);
    console.log(`  ${t.name.padEnd(10)} N=${t.N}  givens=${Math.min(...cs)}-${Math.max(...cs)}  (target ${t.targetGivens})  unique=${ls.every(l=>l.unique)}`);
  }
  console.log('levels.json written.');
  if(!allUnique){ console.error('WARNING: some levels are not unique!'); process.exit(2); }
}
main();
