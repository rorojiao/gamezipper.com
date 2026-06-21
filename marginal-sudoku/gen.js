#!/usr/bin/env node
// Marginal Sudoku (Outside Sudoku) — full-solution generator + uniqueness-verified puzzle digger.
// Rules:
//   - Standard Sudoku (rows, columns, boxes each contain 1..N once).
//   - Marginal clues: digits outside the grid indicate that this digit appears
//     in one of the FIRST K cells of the row/column from that edge.
//     * "5" left of row R  -> digit 5 must be in (R, 0..K-1)
//     * "7" above column C -> digit 7 must be in (0..K-1, C)
//     * "3" right of row R -> digit 3 must be in (R, N-K..N-1)
//     * "9" below column C -> digit 9 must be in (N-K..N-1, C)
//     K=2 for beginner/easy 6x6, K=3 otherwise.
// Output: marginal-sudoku/levels.json
//
// Strategy:
//   1. Build a full STANDARD Sudoku solution via the canonical cyclic Latin-square
//      pattern + band/stack shuffles + transpose + digit relabel (proven pattern
//      from anti-knight/greater-than siblings — no backtracking needed for full
//      solution).
//   2. DERIVE marginal clue candidates from the solution: for each row r the K
//      digits in cols 0..K-1 become left-clue candidates; cols N-K..N-1 become
//      right-clue candidates; similarly per column for top/bottom.
//   3. Pick a RANDOM SUBSET of marginal clues (target size per tier).
//   4. Solve an EMPTY grid with marginal constraints (each cell has a forbidden-
//      digit set derived from the chosen marginal clues). Use an MRV DFS counter
//      that stops at limit=2. If puzzle is not unique, ADD interior givens in
//      random order (from the solution) until unique, then MINIMIZE them.
//   5. Emit levels.json + a printed verification report.

const fs = require('fs');
const crypto = require('crypto');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// ---- canonical cyclic pattern + shuffles -> full standard Sudoku solution ----
function patternSolution(N, rng){
  const [br,bc]=boxSize(N);
  const g=new Int8Array(N*N);
  for(let r=0;r<N;r++) for(let c=0;c<N;c++)
    g[r*N+c]=((c + bc*(r%br) + Math.floor(r/br)) % N) + 1;
  // 1. shuffle rows WITHIN each band
  {
    const copy=new Int8Array(g);
    const perm=new Array(N);
    for(let band=0; band<N/br; band++){
      const idx=[];
      for(let i=0;i<br;i++) idx.push(band*br+i);
      shuffle(idx,rng);
      for(let i=0;i<br;i++) perm[band*br+i]=idx[i];
    }
    for(let r=0;r<N;r++){ const src=perm[r]; for(let c=0;c<N;c++) g[r*N+c]=copy[src*N+c]; }
  }
  // 2. shuffle BANDS
  {
    const copy=new Int8Array(g);
    const stackIdx=[];
    for(let b=0;b<N/br;b++) stackIdx.push(b);
    shuffle(stackIdx,rng);
    const perm=new Array(N);
    for(let dstB=0; dstB<N/br; dstB++){
      const srcB=stackIdx[dstB];
      for(let i=0;i<br;i++) perm[dstB*br+i]=srcB*br+i;
    }
    for(let r=0;r<N;r++){ const src=perm[r]; for(let c=0;c<N;c++) g[r*N+c]=copy[src*N+c]; }
  }
  // 3. shuffle cols WITHIN each stack
  {
    const copy=new Int8Array(g);
    const colPerm=new Array(N);
    for(let stack=0; stack<N/bc; stack++){
      const idx=[];
      for(let i=0;i<bc;i++) idx.push(stack*bc+i);
      shuffle(idx,rng);
      for(let i=0;i<bc;i++) colPerm[stack*bc+i]=idx[i];
    }
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) g[r*N+c]=copy[r*N+colPerm[c]];
  }
  // 4. shuffle STACKS
  {
    const copy=new Int8Array(g);
    const sIdx=[];
    for(let s=0;s<N/bc;s++) sIdx.push(s);
    shuffle(sIdx,rng);
    const colPerm=new Array(N);
    for(let dstS=0; dstS<N/bc; dstS++){
      const srcS=sIdx[dstS];
      for(let i=0;i<bc;i++) colPerm[dstS*bc+i]=srcS*bc+i;
    }
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) g[r*N+c]=copy[r*N+colPerm[c]];
  }
  // 5. transpose (50%) — only when box is square (br===bc), else transpose breaks boxes
  if(br===bc && rng()<0.5){
    const t=new Int8Array(N*N);
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) t[c*N+r]=g[r*N+c];
    g.set(t);
  }
  // 6. digit relabel
  const perm=shuffle([...Array(N)].map((_,i)=>i+1),rng);
  const out=new Int8Array(N*N);
  for(let i=0;i<N*N;i++) out[i]=perm[g[i]-1];
  return out;
}

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

// ---- derive marginal clue candidates from a full solution ----
// returns { left:[[d,d,...]], right:[...], top:[...], bottom:[...] } each length N
function deriveMarginalCandidates(sol, N, K){
  const left=[], right=[], top=[], bottom=[];
  for(let r=0;r<N;r++){
    const L=[], R=[];
    for(let c=0;c<K;c++) L.push(sol[r*N+c]);
    for(let c=N-K;c<N;c++) R.push(sol[r*N+c]);
    left.push(L); right.push(R);
  }
  for(let c=0;c<N;c++){
    const T=[], B=[];
    for(let r=0;r<K;r++) T.push(sol[r*N+c]);
    for(let r=N-K;r<N;r++) B.push(sol[r*N+c]);
    top.push(T); bottom.push(B);
  }
  return { left, right, top, bottom };
}

// ---- pick a random subset of marginal clues of `target` total size ----
function pickMarginalSubset(cands, N, target, rng){
  const all=[]; // {side, idx, digit}
  for(let r=0;r<N;r++) for(const d of cands.left[r])  all.push({side:'left',  idx:r, digit:d});
  for(let r=0;r<N;r++) for(const d of cands.right[r]) all.push({side:'right', idx:r, digit:d});
  for(let c=0;c<N;c++) for(const d of cands.top[c])   all.push({side:'top',   idx:c, digit:d});
  for(let c=0;c<N;c++) for(const d of cands.bottom[c])all.push({side:'bottom',idx:c, digit:d});
  shuffle(all, rng);
  return all.slice(0, Math.min(target, all.length));
}

// ---- build per-side digit Sets from a chosen subset ----
function buildMarginalSets(subset, N){
  const left  = Array.from({length:N},()=>new Set());
  const right = Array.from({length:N},()=>new Set());
  const top   = Array.from({length:N},()=>new Set());
  const bottom= Array.from({length:N},()=>new Set());
  for(const c of subset){
    if(c.side==='left')   left  [c.idx].add(c.digit);
    else if(c.side==='right')  right [c.idx].add(c.digit);
    else if(c.side==='top')    top   [c.idx].add(c.digit);
    else if(c.side==='bottom') bottom[c.idx].add(c.digit);
  }
  return { left, right, top, bottom };
}

// ---- build per-cell FORBIDDEN digit set from marginal constraints ----
// forbidden[i] = Set of digits NOT allowed in cell i (because of marginal rules).
// "D left of row r" -> D must be in cols 0..K-1 -> D forbidden in cols K..N-1.
function buildForbidden(N, K, marg){
  const f=Array.from({length:N*N},()=>new Set());
  for(let r=0;r<N;r++){
    for(const d of marg.left[r])   for(let c=K;   c<N;   c++) f[r*N+c].add(d);
    for(const d of marg.right[r])  for(let c=0;   c<N-K; c++) f[r*N+c].add(d);
  }
  for(let c=0;c<N;c++){
    for(const d of marg.top[c])    for(let r=K;   r<N;   r++) f[r*N+c].add(d);
    for(const d of marg.bottom[c]) for(let r=0;   r<N-K; r++) f[r*N+c].add(d);
  }
  return f;
}

// ---- marginal-aware solution counter (stop at `limit`) ----
function countSolutions(grid, N, peers, forbidden, limit){
  const g=new Int8Array(grid);
  let count=0;
  function dfs(){
    if(count>=limit) return;
    let best=-1, bestCand=null;
    for(let i=0;i<N*N;i++){
      if(g[i]!==0) continue;
      const cand=[]; const fb=forbidden[i]; const ps=peers[i];
      for(let v=1;v<=N;v++){
        if(fb.has(v)) continue;
        let ok=true;
        for(let k=0;k<ps.length;k++){ if(g[ps[k]]===v){ ok=false; break; } }
        if(ok) cand.push(v);
      }
      if(cand.length===0) return;
      if(bestCand===null||cand.length<bestCand.length){ bestCand=cand; best=i; if(cand.length===1) break; }
    }
    if(best===-1){ count++; return; }
    for(const v of bestCand){ g[best]=v; dfs(); g[best]=0; if(count>=limit) return; }
  }
  dfs();
  return count;
}

// ---- verify a FULL grid satisfies standard Sudoku + marginal constraints (defensive) ----
function checkFull(grid, N, peers){
  for(let i=0;i<N*N;i++){
    const v=grid[i]; if(v<1||v>N) return false;
    for(const p of peers[i]) if(grid[p]===v) return false;
  }
  return true;
}
function checkMarginal(grid, N, K, marg){
  // for each chosen marginal clue, the digit must appear in the first K cells
  for(let r=0;r<N;r++){
    for(const d of marg.left[r]){
      let ok=false; for(let c=0;c<K;c++) if(grid[r*N+c]===d){ ok=true; break; }
      if(!ok) return false;
    }
    for(const d of marg.right[r]){
      let ok=false; for(let c=N-K;c<N;c++) if(grid[r*N+c]===d){ ok=true; break; }
      if(!ok) return false;
    }
  }
  for(let c=0;c<N;c++){
    for(const d of marg.top[c]){
      let ok=false; for(let r=0;r<K;r++) if(grid[r*N+c]===d){ ok=true; break; }
      if(!ok) return false;
    }
    for(const d of marg.bottom[c]){
      let ok=false; for(let r=N-K;r<N;r++) if(grid[r*N+c]===d){ ok=true; break; }
      if(!ok) return false;
    }
  }
  return true;
}

// ---- add interior givens progressively until unique, then minimize ----
function digPuzzle(solution, N, rng, peers, forbidden, maxMs){
  const t0=Date.now();
  const puzzle=new Int8Array(N*N); // empty
  let cnt=countSolutions(puzzle, N, peers, forbidden, 2);
  if(cnt===0) throw new Error('marginal set inconsistent (0 solutions) — should never happen');
  if(cnt===1) return puzzle;
  // add givens in random order until unique
  const order=shuffle([...Array(N*N)].map((_,i)=>i), rng);
  for(const idx of order){
    if(cnt===1) break;
    if(Date.now()-t0>maxMs) break;
    if(puzzle[idx]!==0) continue;
    puzzle[idx]=solution[idx];
    cnt=countSolutions(puzzle, N, peers, forbidden, 2);
  }
  if(cnt!==1){
    // ran out of time/budget — fall back to full solution as givens
    return new Int8Array(solution);
  }
  // MINIMIZE: try removing each given
  const remOrder=shuffle([...order], rng);
  for(const idx of remOrder){
    if(puzzle[idx]===0) continue;
    if(Date.now()-t0>maxMs*2) break;
    const save=puzzle[idx];
    puzzle[idx]=0;
    const c2=countSolutions(puzzle, N, peers, forbidden, 2);
    if(c2!==1) puzzle[idx]=save;
  }
  return puzzle;
}

// ---- tier config (27 levels: 6x6 tiers 1-3, 9x9 tiers 4-6) ----
// K = "first K cells" rule (2 for beginner/easy 6x6, 3 otherwise)
// targetMarginal = total marginal clues to show (across all 4 sides)
const TIERS=[
  {name:'Beginner', N:6, K:2, count:4, targetMarginal:11, maxMs:3000},
  {name:'Easy',     N:6, K:2, count:4, targetMarginal:13, maxMs:4000},
  {name:'Medium',   N:6, K:3, count:4, targetMarginal:9,  maxMs:6000},
  {name:'Hard',     N:9, K:3, count:6, targetMarginal:18, maxMs:12000},
  {name:'Expert',   N:9, K:3, count:5, targetMarginal:11, maxMs:18000},
  {name:'Master',   N:9, K:3, count:4, targetMarginal:7,  maxMs:25000},
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }

// compact marginal clue encoding: {side, idx, digit}[] -> per-side arrays of arrays
function marginalToArrs(subset, N){
  const left=Array.from({length:N},()=>[]);
  const right=Array.from({length:N},()=>[]);
  const top=Array.from({length:N},()=>[]);
  const bottom=Array.from({length:N},()=>[]);
  for(const c of subset){
    if(c.side==='left')   left  [c.idx].push(c.digit);
    else if(c.side==='right')  right [c.idx].push(c.digit);
    else if(c.side==='top')    top   [c.idx].push(c.digit);
    else if(c.side==='bottom') bottom[c.idx].push(c.digit);
  }
  return { left, right, top, bottom };
}

function main(){
  const seedBase=parseInt(crypto.createHash('md5').update('marginal-sudoku-v1-'+Date.now()).digest('hex').slice(0,8),16);
  const rng=mulberry32(seedBase);
  const peersCache={};
  function peersFor(N){ return peersCache[N]||(peersCache[N]=buildPeers(N)); }

  const levels=[]; let id=1;
  for(const tier of TIERS){
    const peers=peersFor(tier.N);
    for(let i=0;i<tier.count;i++){
      process.stderr.write(`Generating ${tier.name} #${i+1} (N=${tier.N}, K=${tier.K}, targetMarg=${tier.targetMarginal})... `);
      const t0=Date.now();
      // build solution + derive marginal candidates
      const sol=patternSolution(tier.N, rng);
      if(!checkFull(sol, tier.N, peers)) throw new Error('full solution failed constraint check N='+tier.N);
      const cands=deriveMarginalCandidates(sol, tier.N, tier.K);
      // pick a marginal subset of target size; if not unique with empty grid + these clues,
      // try a few alternative subsets before falling back to adding givens.
      let bestPuzzle=null, bestMarg=null, bestGivens=Infinity;
      const tBudget=tier.maxMs;
      for(let attempt=0; attempt<8; attempt++){
        if(Date.now()-t0>tBudget) break;
        const subset=pickMarginalSubset(cands, tier.N, tier.targetMarginal, rng);
        const margSets=buildMarginalSets(subset, tier.N);
        const forbidden=buildForbidden(tier.N, tier.K, margSets);
        if(!checkMarginal(sol, tier.N, tier.K, margSets)) continue; // defensive
        const puzzle=digPuzzle(sol, tier.N, rng, peers, forbidden, Math.min(4000, tBudget-Math.floor((Date.now()-t0))));
        // verify unique
        const cnt=countSolutions(puzzle, tier.N, peers, forbidden, 2);
        if(cnt!==1) continue;
        const givens=puzzle.filter(x=>x!==0).length;
        if(givens<bestGivens){ bestGivens=givens; bestPuzzle=puzzle; bestMarg=subset; }
        if(givens<=2) break; // very few interior givens — accept
      }
      if(!bestPuzzle){ throw new Error('all attempts failed for tier '+tier.name); }
      const dt=(Date.now()-t0)/1000;
      const margArrs=marginalToArrs(bestMarg, tier.N);
      const totalMargCount=bestMarg.length;
      process.stderr.write(`${bestGivens} givens + ${totalMargCount} marginal, ${dt.toFixed(1)}s, UNIQUE\n`);
      levels.push({
        id, tier:tier.name, N:tier.N, K:tier.K,
        p: gridToArr(bestPuzzle,tier.N),
        s: gridToArr(sol,tier.N),
        marginal: margArrs,
        givenCount: bestGivens,
        marginalCount: totalMargCount,
      });
      id++;
    }
  }
  const out={ version:1, game:'marginal-sudoku', generated:new Date().toISOString(),
              levels, count:levels.length };
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(out));
  console.log('=== MARGINAL SUDOKU — GENERATION REPORT ===');
  console.log(`Generated ${levels.length} levels.`);
  for(const t of TIERS){
    const ls=levels.filter(l=>l.tier===t.name);
    const gs=ls.map(l=>l.givenCount), ms=ls.map(l=>l.marginalCount);
    console.log(`  ${t.name.padEnd(10)} N=${t.N} K=${t.K}  givens=${Math.min(...gs)}-${Math.max(...gs)}  marginal=${Math.min(...ms)}-${Math.max(...ms)}  (target ${t.targetMarginal})`);
  }
  console.log('levels.json written.');
}
main();
