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
// Strategy (dig-from-full — proven fast approach from anti-knight/greater-than siblings):
//   1. Build a full STANDARD Sudoku solution via canonical cyclic Latin-square
//      pattern + band/stack shuffles + (square-box-only) transpose + digit relabel.
//   2. DERIVE marginal clue candidates from the solution.
//   3. Start: FULL solution as givens + ALL marginal candidates.
//      (Trivially unique.)
//   4. Phase 1: dig INTERIOR givens in random order, re-checking uniqueness with
//      the marginal-aware counter (stop at 2). Keep removal if still unique.
//   5. Phase 2: dig MARGINAL clues in random order down to the tier's target max,
//      re-checking uniqueness after each marginal removal.
//   6. Emit levels.json + a printed verification report.

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
    const bIdx=[];
    for(let b=0;b<N/br;b++) bIdx.push(b);
    shuffle(bIdx,rng);
    const perm=new Array(N);
    for(let dstB=0; dstB<N/br; dstB++){
      const srcB=bIdx[dstB];
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

// flatten candidates into a list of {side, idx, digit}
function flattenMarg(cands, N){
  const all=[];
  for(let r=0;r<N;r++) for(const d of cands.left[r])   all.push({side:'left',   idx:r, digit:d});
  for(let r=0;r<N;r++) for(const d of cands.right[r])  all.push({side:'right',  idx:r, digit:d});
  for(let c=0;c<N;c++) for(const d of cands.top[c])    all.push({side:'top',    idx:c, digit:d});
  for(let c=0;c<N;c++) for(const d of cands.bottom[c]) all.push({side:'bottom', idx:c, digit:d});
  return all;
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

// ---- marginal-aware solution counter (stop at `limit`, optional node budget) ----
function countSolutions(grid, N, peers, forbidden, limit, nodeBudget){
  const g=new Int8Array(grid);
  let count=0, nodes=0;
  function dfs(){
    if(count>=limit) return;
    if(nodeBudget && ++nodes>nodeBudget){ count=limit; return; } // abort -> ambiguous
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

// ---- verify a FULL grid satisfies standard Sudoku (defensive) ----
function checkFull(grid, N, peers){
  for(let i=0;i<N*N;i++){
    const v=grid[i]; if(v<1||v>N) return false;
    for(const p of peers[i]) if(grid[p]===v) return false;
  }
  return true;
}
function checkMarginal(grid, N, K, marg){
  for(let r=0;r<N;r++){
    for(const d of marg.left[r]){  let ok=false; for(let c=0;c<K;c++) if(grid[r*N+c]===d){ ok=true; break; } if(!ok) return false; }
    for(const d of marg.right[r]){ let ok=false; for(let c=N-K;c<N;c++) if(grid[r*N+c]===d){ ok=true; break; } if(!ok) return false; }
  }
  for(let c=0;c<N;c++){
    for(const d of marg.top[c]){    let ok=false; for(let r=0;r<K;r++) if(grid[r*N+c]===d){ ok=true; break; } if(!ok) return false; }
    for(const d of marg.bottom[c]){ let ok=false; for(let r=N-K;r<N;r++) if(grid[r*N+c]===d){ ok=true; break; } if(!ok) return false; }
  }
  return true;
}

// ---- dig-from-full puzzle generator ----
// Strategy: pick EXACTLY targetMarg random marginal clues (per spec), then
// dig interior givens (start: full solution) until target reached or budget
// exhausted. countSolutions is FAST here because we always have many givens.
function digPuzzle(solution, N, K, rng, peers, cands, targetMarg, maxMs){
  const t0=Date.now();
  let bestPuzzle=null, bestSubset=null, bestGivens=Infinity;
  for(let attempt=0; attempt<4; attempt++){
    if(Date.now()-t0>maxMs) break;
    const innerT0=Date.now();
    const attemptBudget=Math.min(maxMs-(innerT0-t0), maxMs/4+1500);
    // pick targetMarg random marginal clues (the spec's "select a SUBSET")
    const margFlat=flattenMarg(cands, N);
    shuffle(margFlat, rng);
    const subset=margFlat.slice(0, Math.min(targetMarg, margFlat.length));
    const margSets=buildMarginalSets(subset, N);
    const forbidden=buildForbidden(N, K, margSets);
    // start: full solution as givens (trivially unique)
    const puzzle=new Int8Array(solution);
    // dig givens in random order, keeping uniqueness
    const cellOrder=shuffle([...Array(N*N)].map((_,i)=>i), rng);
    for(const idx of cellOrder){
      if(Date.now()-innerT0>attemptBudget) break;
      const save=puzzle[idx]; if(save===0) continue;
      puzzle[idx]=0;
      const cnt=countSolutions(puzzle, N, peers, forbidden, 2, 30000);
      if(cnt!==1) puzzle[idx]=save;
    }
    const givens=puzzle.filter(x=>x!==0).length;
    if(givens<bestGivens){ bestGivens=givens; bestPuzzle=new Int8Array(puzzle); bestSubset=subset.slice(); }
  }
  if(!bestPuzzle){ bestPuzzle=new Int8Array(solution); bestSubset=flattenMarg(cands, N).slice(0, targetMarg); }
  return { puzzle:bestPuzzle, subset:bestSubset };
}

// ---- tier config (27 levels) ----
// K = "first K cells" rule (2 for beginner/easy 6x6, 3 otherwise)
// targetMarg = exact marginal clue count to display per spec
//   (interior givens are added on top as needed for uniqueness)
const TIERS=[
  {name:'Beginner', N:6, K:2, count:4, targetMarg:12, maxMs:2500},
  {name:'Easy',     N:6, K:2, count:4, targetMarg:13, maxMs:2500},
  {name:'Medium',   N:6, K:3, count:4, targetMarg:9,  maxMs:3000},
  {name:'Hard',     N:9, K:3, count:6, targetMarg:18, maxMs:7000},
  {name:'Expert',   N:9, K:3, count:5, targetMarg:11, maxMs:9000},
  {name:'Master',   N:9, K:3, count:4, targetMarg:7,  maxMs:12000},
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }

// compact marginal clue encoding: subset -> per-side arrays of arrays
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
      process.stderr.write(`Generating ${tier.name} #${i+1} (N=${tier.N}, K=${tier.K}, maxMarg=${tier.targetMaxMarginal})... `);
      const t0=Date.now();
      const sol=patternSolution(tier.N, rng);
      if(!checkFull(sol, tier.N, peers)) throw new Error('full solution failed constraint check N='+tier.N);
      const cands=deriveMarginalCandidates(sol, tier.N, tier.K);
      const { puzzle, subset } = digPuzzle(sol, tier.N, tier.K, rng, peers, cands, tier.targetMarg, tier.maxMs);
      // FINAL uniqueness verify with no node budget
      const margSets=buildMarginalSets(subset, tier.N);
      const forbidden=buildForbidden(tier.N, tier.K, margSets);
      const finalCnt=countSolutions(puzzle, tier.N, peers, forbidden, 2);
      const givens=puzzle.filter(x=>x!==0).length;
      const dt=(Date.now()-t0)/1000;
      const mark = finalCnt===1 ? 'UNIQUE' : 'NONUNIQUE('+finalCnt+')';
      process.stderr.write(`${givens} givens + ${subset.length} marginal = ${givens+subset.length} total, ${dt.toFixed(1)}s, ${mark}\n`);
      levels.push({
        id, tier:tier.name, N:tier.N, K:tier.K,
        p: gridToArr(puzzle,tier.N),
        s: gridToArr(sol,tier.N),
        marginal: marginalToArrs(subset,tier.N),
        givenCount: givens,
        marginalCount: subset.length,
        unique: finalCnt===1,
      });
      id++;
    }
  }
  const allUnique = levels.every(l=>l.unique);
  const out={ version:1, game:'marginal-sudoku', generated:new Date().toISOString(),
              levels, allUnique, count:levels.length };
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(out));
  console.log('=== MARGINAL SUDOKU — GENERATION REPORT ===');
  console.log(`Generated ${levels.length} levels. All unique: ${allUnique}`);
  for(const t of TIERS){
    const ls=levels.filter(l=>l.tier===t.name);
    const gs=ls.map(l=>l.givenCount), ms=ls.map(l=>l.marginalCount);
    console.log(`  ${t.name.padEnd(10)} N=${t.N} K=${t.K}  givens=${Math.min(...gs)}-${Math.max(...gs)}  marginal=${Math.min(...ms)}-${Math.max(...ms)}  unique=${ls.every(l=>l.unique)}`);
  }
  console.log('levels.json written.');
  if(!allUnique){ console.error('WARNING: some levels are not unique!'); process.exit(2); }
}
main();
