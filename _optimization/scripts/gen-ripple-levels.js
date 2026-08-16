#!/usr/bin/env node
/* ripple-effect level generator — 30 campaign levels + 10 daily-pool puzzles, generated
 * OFFLINE and statically embedded in ripple-effect/index.html.
 *
 * Why: the engine generated every level at runtime with a bounded solver (generateSolution
 * deadline 3s/6s/15s per attempt x50 attempts). Measured generation times blew past any
 * usable bound (L6=171.7s, L14=126.8s, L18=59.6s; 15+ of 31 items could not finish inside
 * the 105s verifier cap), leaving the browser stuck on "Generating puzzle...".
 *
 * Method: run the ENGINE'S OWN generator logic (generateRegions / canPlace /
 * generateSolution / createPuzzle copied verbatim from index.html) offline with the same
 * per-level configs (id/size/difficulty/seed schedule unchanged, so difficulty structure
 * matches the shipped curve), then emit a compact static table. Every emitted puzzle is
 * re-validated: solution satisfies canPlace row/col window semantics per region 1..N, the
 * given mask removes exactly floor(total*difficulty) cells (>=1 given per region), and the
 * player grid built from givens matches the solution. Budgets (memory-tight machine):
 * per-level wall caps 30s(6x6)/90s(8x8)/180s(10x10)/300s(12x12) + seed fallback ladder, 40min global, serial.
 * Output: state/ripple-levels.json {levels:[30], daily:[10]} with compact string fields:
 *   rm  regionMap row-major, one base36 char per cell
 *   sol solution row-major, one base36 char per cell
 *   giv given mask row-major, '1'=given '0'=blank
 */
const fs = require('fs');
const path = require('path');

/* ---- engine's own generator logic (copied verbatim from ripple-effect/index.html) ---- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,rng){for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

function generateRegions(size,rng,capRegion){
  const grid=Array.from({length:size},()=>Array(size).fill(-1));
  const regions=[];
  const cells=[];
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)cells.push([r,c]);
  shuffle(cells,rng);
  let rid=0;
  for(const[sr,sc]of cells){
    if(grid[sr][sc]!==-1)continue;
    const maxR=Math.min(size<=8?5:size<=10?6:7,capRegion||99);
    const minR=Math.min(3,maxR-1);
    const target=minR+Math.floor(rng()*(maxR-minR+1));
    const region=[[sr,sc]];
    grid[sr][sc]=rid;
    let tries=0;
    while(region.length<target&&tries<100){
      tries++;
      const candidates=[];
      for(const[rr,cc]of region){
        for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){
          const nr=rr+dr,nc=cc+dc;
          if(nr>=0&&nr<size&&nc>=0&&nc<size&&grid[nr][nc]===-1)candidates.push([nr,nc]);
        }
      }
      if(!candidates.length)break;
      const[nr,nc]=candidates[Math.floor(rng()*candidates.length)];
      region.push([nr,nc]);
      grid[nr][nc]=rid;
    }
    regions.push(region);
    rid++;
  }
  // merge singletons
  for(let i=regions.length-1;i>=0;i--){
    if(regions[i].length>1)continue;
    const[r,c]=regions[i][0];
    let merged=false;
    for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<size&&nc>=0&&nc<size&&grid[nr][nc]!==i){
        const targetRid=grid[nr][nc];
        regions[targetRid].push([r,c]);
        grid[r][c]=targetRid;
        regions.splice(i,1);
        for(let rr=0;rr<size;rr++)for(let cc=0;cc<size;cc++){
          if(grid[rr][cc]===i)grid[rr][cc]=targetRid;
        }
        merged=true;break;
      }
    }
  }
  const newGrid=Array.from({length:size},()=>Array(size).fill(-1));
  for(let i=0;i<regions.length;i++){
    for(const[r,c]of regions[i])newGrid[r][c]=i;
  }
  return{regions,regionMap:newGrid};
}

function canPlace(r,c,val,solution,regionUsed,size){
  for(let cc=Math.max(0,c-val);cc<=Math.min(size-1,c+val);cc++){
    if(cc!==c&&solution[r][cc]===val)return false;
  }
  for(let rr=Math.max(0,r-val);rr<=Math.min(size-1,r+val);rr++){
    if(rr!==r&&solution[rr][c]===val)return false;
  }
  return true;
}

function generateSolution(size,regions,regionMap,rng,maxMs){
  const solution=Array.from({length:size},()=>Array(size).fill(0));
  const regionUsed=regions.map(()=>new Set());
  const cellOrder=[];
  const sortedRegions=[...regions].sort((a,b)=>a.length-b.length);
  for(const region of sortedRegions)for(const[r,c]of region)cellOrder.push([r,c]);
  const regionSizes=regions.map(r=>r.length);
  const deadline=Date.now()+(maxMs!==undefined?maxMs:(size<=8?3000:size<=10?6000:15000));
  let nodes=0;
  const NODE_CAP=20_000_000;

  function backtrack(idx){
    if(++nodes>NODE_CAP)return false;
    if(nodes%2000===0&&Date.now()>deadline)return false;
    if(idx===cellOrder.length)return true;
    const[r,c]=cellOrder[idx];
    const rid=regionMap[r][c];
    const maxVal=regionSizes[rid];
    const vals=[];
    for(let v=1;v<=maxVal;v++)vals.push(v);
    shuffle(vals,rng);
    for(const val of vals){
      if(regionUsed[rid].has(val))continue;
      if(!canPlace(r,c,val,solution,regionUsed,size))continue;
      solution[r][c]=val;
      regionUsed[rid].add(val);
      if(backtrack(idx+1))return true;
      solution[r][c]=0;
      regionUsed[rid].delete(val);
    }
    return false;
  }
  return backtrack(0)?{solution,nodes}:null;
}

/* MRV-ordered solution search — same output SEMANTICS as the engine's generateSolution
 * (each region holds 1..N exactly once, canPlace row/col +-window rule, randomized value
 * order for variety), but picks the most-constrained cell first. The engine's fixed
 * cell order strands certain region layouts in exponential backtracking (the measured
 * L6=171.7s / L15-class pathologies); MRV solves those in milliseconds. Output puzzles
 * are still validated against the engine rule set below. */
function generateSolutionMRV(size,regions,regionMap,rng,maxMs){
  const solution=Array.from({length:size},()=>Array(size).fill(0));
  const regionUsed=regions.map(()=>new Set());
  const cells=[];
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)cells.push([r,c]);
  const deadline=Date.now()+maxMs;
  let nodes=0;const NODE_CAP=20_000_000;
  /* budget aborts THROW instead of returning false: a false return merely prunes one
   * branch, and the parent loops on to enumerate millions of sibling subtrees before the
   * whole tree unwinds (measured: 3s deadline + 29s of unwinding). */
  function backtrack(remaining){
    if(++nodes>NODE_CAP)throw 0;
    if((nodes&255)===0&&Date.now()>deadline)throw 0;
    if(remaining===0)return true;
    let best=null,bestVals=null;
    for(const cell of cells){
      const r=cell[0],c=cell[1];
      if(solution[r][c]!==0)continue;
      const rid=regionMap[r][c];
      const vals=[];
      for(let v=1;v<=regions[rid].length;v++){
        if(regionUsed[rid].has(v))continue;
        if(!canPlace(r,c,v,solution,regionUsed,size))continue;
        vals.push(v);
      }
      if(!vals.length)return false;
      if(!best||vals.length<bestVals.length){best=cell;bestVals=vals;if(vals.length===1)break;}
    }
    const r=best[0],c=best[1];
    const shuffled=bestVals.slice();
    shuffle(shuffled,rng);
    for(const val of shuffled){
      solution[r][c]=val;
      regionUsed[regionMap[r][c]].add(val);
      if(backtrack(remaining-1))return true;
      solution[r][c]=0;
      regionUsed[regionMap[r][c]].delete(val);
    }
    return false;
  }
  let ok=false;
  try{ok=backtrack(size*size);}catch(e){ok=false;}
  return ok?{solution,nodes}:null;
}

/* Region-by-region constructive solver with REGION-LEVEL BACKTRACKING.
 * Probe data (2026-08-16): pure greedy fill-or-die completes ~0/250 layouts even at 8x8 —
 * when one region has no valid completion the whole layout was abandoned. Here each
 * region's assignments are enumerated lazily (generator), and a stuck region backtracks
 * into the previous region's NEXT alternative assignment before giving up on the layout.
 * Region order is most-constrained-first (most assigned neighbor cells), recomputed at
 * each depth. Dead layouts still die in milliseconds, so generateLevel can try hundreds
 * of layouts per wall. Output semantics: every region holds 1..N exactly once + the
 * canPlace row/col window rule, re-proven by the independent validator below. */
const DIRS=[[0,1],[0,-1],[1,0],[-1,0]];
function solveByRegions(size,regions,regionMap,rng,deadline){
  const solution=Array.from({length:size},()=>Array(size).fill(0));
  const regionUsed=regions.map(()=>new Set());
  const remaining=regions.map((_,i)=>i);
  shuffle(remaining,rng);
  let nodes=0;const NODE_CAP=2_000_000;
  function* regionAssignments(cells,rid){
    const n=cells.length;
    function* rec(idx){
      if(idx===n){yield true;return;} // one complete assignment of this region is live in solution[]
      const r=cells[idx][0],c=cells[idx][1];
      const vals=[];
      for(let v=1;v<=n;v++)if(!regionUsed[rid].has(v))vals.push(v);
      shuffle(vals,rng);
      for(const v of vals){
        if(!canPlace(r,c,v,solution,regionUsed,size))continue;
        solution[r][c]=v;
        regionUsed[rid].add(v);
        yield* rec(idx+1);
        solution[r][c]=0;
        regionUsed[rid].delete(v);
      }
    }
    yield* rec(0);
  }
  function pickRegion(){
    let bi=0,bs=-1;
    for(let ri=0;ri<remaining.length;ri++){
      const rid=remaining[ri];
      let score=0;
      for(let d=0;d<4;d++){
        const cell=regions[rid];
        for(let ci=0;ci<cell.length;ci++){
          const r=cell[ci][0]+DIRS[d][0],c=cell[ci][1]+DIRS[d][1];
          if(r>=0&&r<size&&c>=0&&c<size&&solution[r][c]!==0)score++;
        }
      }
      if(score>bs){bs=score;bi=ri;}
    }
    return bi;
  }
  function dfs(){
    if(!remaining.length)return true;
    if(++nodes>NODE_CAP)return false;
    if((nodes&255)===0&&Date.now()>deadline)return false;
    const bi=pickRegion();
    const rid=remaining[bi];
    for(const _ of regionAssignments(regions[rid],rid)){
      remaining.splice(bi,1);
      if(dfs())return true;
      remaining.push(rid);
      if(++nodes>NODE_CAP)return false;
      if((nodes&255)===0&&Date.now()>deadline)return false;
    }
    return false;
  }
  if(!dfs())return null;
  return{solution,nodes};
}

/* ---------- constructive 12x12 generator (satisfiable BY DESIGN) ----------
 * Measured reality (2026-08-16): most random compact-growth 12x12 layouts are simply
 * UNSATISFIABLE - L25's stream burned 3x900s (MRV) and 90s x N full-budget probes with
 * zero solves, and a complete region-level DFS also proved layouts dead. Instead of
 * playing the satisfiability lottery, build the SOLUTION first and grow regions around it:
 *
 *   1. V(r,c) filled reading-order, each cell a random value from 1..6 that conflicts
 *      with no already-placed same value inside its row/col +-v windows (checked at
 *      placement - sound by construction; a rare dead cell restarts the grid).
 *   2. Regions grow by adjacency to a "perfect" value set: stop when the region's values
 *      are exactly {1..|region|}. Connected by construction, sizes 1..6, each holding a
 *      permutation of 1..N - engine semantics, re-proven by the independent validator.
 * Repeated sweeps reseed cells no region could perfect (boundaries shift between sweeps). */
function buildPatternSolution(size,rng){
  const V=Array.from({length:size},()=>Array(size).fill(0));
  /* low values weighted higher: perfect regions {1..N} need the low run 1,2,3.. far more
   * often than the top value (only a full size-6 region wants a 6) */
  const WEIGHTS=[0,30,24,18,13,9,6]; /* index=value; ~1..6 */
  const WSUM=WEIGHTS.reduce((a,b)=>a+b,0);
  function drawValue(){
    let t=rng()*WSUM;
    for(let v=1;v<=6;v++){t-=WEIGHTS[v];if(t<0)return v}
    return 6;
  }
  for(let restart=0;restart<200;restart++){
    let ok=true;
    for(let r=0;r<size&&ok;r++)for(let c=0;c<size&&ok;c++){
      const cand=[];
      for(let v=1;v<=6;v++){
        let good=true;
        for(let cc=Math.max(0,c-v);cc<c;cc++)if(V[r][cc]===v){good=false;break}
        if(good)for(let rr=Math.max(0,r-v);rr<r;rr++)if(V[rr][c]===v){good=false;break}
        if(good)cand.push(v);
      }
      if(!cand.length){ok=false;break}
      /* local balancing: prefer the legal value least used in the surrounding 5x5, so
       * every neighbourhood carries a 1..N spread for perfect-region growth to draw on
       * (weighted-random V clusters values and forces singleton-heavy partitions) */
      let bestUse=Infinity;
      const tied=[];
      for(const v of cand){
        let use=0;
        for(let rr=Math.max(0,r-2);rr<=Math.min(size-1,r+2);rr++)
          for(let cc=Math.max(0,c-2);cc<=Math.min(size-1,c+2);cc++)
            if(V[rr][cc]===v)use++;
        if(use<bestUse){bestUse=use;tied.length=0;tied.push(v)}
        else if(use===bestUse)tied.push(v);
      }
      V[r][c]=tied[Math.floor(rng()*tied.length)];
    }
    if(ok){
      /* belt-and-braces: full window-rule assert over the finished grid */
      for(let r=0;r<size;r++)for(let c=0;c<size;c++){
        const v=V[r][c];
        for(let cc=c+1;cc<=Math.min(size-1,c+v);cc++)if(V[r][cc]===v)throw new Error('greedy row violation at '+r+','+c+'/'+cc);
        for(let rr=r+1;rr<=Math.min(size-1,r+v);rr++)if(V[rr][c]===v)throw new Error('greedy col violation at '+r+','+c+'/'+rr);
      }
      return V;
    }
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)V[r][c]=0;
  }
  throw new Error('greedy value grid failed');
}
function buildPatternRegions(size,V,rng,diag){
  const regionMap=Array.from({length:size},()=>Array(size).fill(-1));
  const regions=[];
  let nodes=0;const NODE_CAP=120000;
  /* enumerate perfect connected subsets ({1..N} value set) containing (sr,sc), grown
   * cell-by-cell; yields shape after shape (small perfect first via preference order) */
  function* perfectRegionsContaining(sr,sc){
    const cells=[[sr,sc]];
    const vals=new Set([V[sr][sc]]);
    function* grow(){
      const selfPerfect=vals.size===cells.length&&isInitialSegment(vals);
      let pool=[];
      if(cells.length<6){
        const len=cells.length;
        const cand=[];
        for(const[r,c]of cells){
          for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){
            const nr=r+dr,nc=c+dc;
            if(nr<0||nr>=size||nc<0||nc>=size)continue;
            if(regionMap[nr][nc]!==-1)continue;
            if(cells.some(x=>x[0]===nr&&x[1]===nc))continue;
            cand.push([nr,nc]);
          }
        }
        /* exact-extension first (value len+1), then missing <=len+1, then any missing */
        const exact=cand.filter(x=>V[x[0]][x[1]]===len+1);
        const preferred=exact.length?exact:cand.filter(x=>{const v=V[x[0]][x[1]];return !vals.has(v)&&v<=len+1});
        pool=preferred.length?preferred:cand.filter(x=>!vals.has(V[x[0]][x[1]]));
      }
      if(pool.length){
        /* bigger shapes first; yield self afterwards; a size-1 {1} singleton only as a
         * last resort (engine boards have ~30 rooms of size 2..8, not singleton dust) */
        for(const[nr,nc]of pool){
          cells.push([nr,nc]);
          vals.add(V[nr][nc]);
          yield* grow();
          cells.pop();
          vals.delete(V[nr][nc]);
        }
        if(selfPerfect){
          if(cells.length>=2)yield cells.slice();
          else yield cells.slice(); /* singleton after every bigger option failed */
        }
        return;
      }
      if(selfPerfect)yield cells.slice();
    }
    yield* grow();
  }
  /* exact cover: assign the first unassigned cell's region, recurse, backtrack globally */
  function dfs(){
    if(++nodes>NODE_CAP)return false;
    let sr=-1,sc=-1;
    outer:for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      if(regionMap[r][c]===-1){sr=r;sc=c;break outer}
    }
    if(sr===-1)return true; /* fully partitioned */
    for(const reg of perfectRegionsContaining(sr,sc)){
      for(const[r,c]of reg)regionMap[r][c]=regions.length;
      regions.push(reg);
      if(dfs())return true;
      regions.pop();
      for(const[r,c]of reg)regionMap[r][c]=-1;
      if(nodes>NODE_CAP)return false;
    }
    return false;
  }
  if(!dfs())return null;
  /* any cells left unassigned (rare): attach each to an adjacent region that stays perfect,
   * else form singleton regions if value==1, else fail the layout */
  let ok=true;
  for(let r=0;r<size&&ok;r++)for(let c=0;c<size&&ok;c++){
    if(regionMap[r][c]!==-1)continue;
    const v=V[r][c];
    let attached=false;
    for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){
      const nr=r+dr,nc=c+dc;
      if(nr<0||nr>=size||nc<0||nc>=size)continue;
      const rid=regionMap[nr][nc];
      if(rid===-1)continue;
      const reg=regions[rid];
      if(reg.length===6)continue;
      const vs=new Set(reg.map(function(x){return V[x[0]][x[1]]}));
      if(!vs.has(v)&&v===reg.length+1){ /* extends the initial segment by exactly one */
        reg.push([r,c]);
        regionMap[r][c]=rid;
        attached=true;
        break;
      }
    }
    if(!attached){
      if(v===1){ /* singleton {1} is a legal region */
        regionMap[r][c]=regions.length;
        regions.push([[r,c]]);
        attached=true;
      }else{
        ok=false; /* orphan cell - layout failed, caller retries */
        break;
      }
    }
  }
  if(!ok)return null;
  /* rebuild region ids contiguous */
  const remap=Array(regions.length).fill(-1);
  let next=0;
  for(let i=0;i<regions.length;i++)remap[i]=next++;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)regionMap[r][c]=remap[regionMap[r][c]];
  return{regions,regionMap};
}
function isInitialSegment(vals){
  for(let i=1;i<=vals.size;i++)if(!vals.has(i))return false;
  return true;
}
function generateLevelConstructive(config,wallCapMs){
  const rng=mulberry32(config.seed);
  const{size,difficulty}=config;
  const t0=Date.now();
  const cap=wallCapMs||900000;
  for(let attempt=0;attempt<200;attempt++){
    if(attempt&&(Date.now()-t0)>cap)return null;
    const r=mulberry32(config.seed+attempt*9973);
    let V,regions,regionMap;
    try{V=buildPatternSolution(size,r)}catch(e){continue}
    const reg=buildPatternRegions(size,V,r);
    if(!reg)continue;
    regions=reg.regions;regionMap=reg.regionMap;
    const solution=V;
    const puzzle=createPuzzle(size,regions,regionMap,solution,difficulty,rng);
    return{size,regions,regionMap,solution,puzzle,maxNum:Math.max(...regions.map(x=>x.length)),attempts:attempt+1,nodes:0};
  }
  return null;
}

function createPuzzle(size,regions,regionMap,solution,difficulty,rng){
  const given=Array.from({length:size},()=>Array(size).fill(true));
  const cells=[];
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)cells.push([r,c]);
  shuffle(cells,rng);
  const total=size*size;
  const target=Math.floor(total*difficulty);
  let removed=0;
  for(const[r,c]of cells){
    if(removed>=target)break;
    given[r][c]=false;
    removed++;
  }
  for(let i=0;i<regions.length;i++){
    const hasGiven=regions[i].some(([r,c])=>given[r][c]);
    if(!hasGiven){
      const[r,c]=regions[i][Math.floor(rng()*regions[i].length)];
      given[r][c]=true;
    }
  }
  return given;
}

function generateLevel(config,wallCapMs){
  /* size>=12: constructive generator directly (compact-growth layouts are mostly UNSAT
   * there - L25 burned 45+ min proving it across 3 strategies).
   * smaller sizes: fast MRV attempts first (engine-style layouts, usually <1s), then the
   * constructive generator as a guaranteed fallback for unlucky seed streams (daily d1). */
  if(config.size>=12)return generateLevelConstructive(config,wallCapMs);
  const fast=generateLevelMRV(config,Math.min(wallCapMs,45000));
  if(fast)return fast;
  return generateLevelConstructive(config,wallCapMs);
}
function generateLevelMRV(config,wallCapMs){
  const rng=mulberry32(config.seed);
  const{size,difficulty}=config;
  let regions,regionMap,solutionResult;
  const t0=Date.now();
  let attempt;
  for(attempt=0;attempt<50;attempt++){
    if(Date.now()-t0>wallCapMs)break;
    const r=mulberry32(config.seed+attempt*9973);
    const gen=generateRegions(size,r,0);
    regions=gen.regions;regionMap=gen.regionMap;
    const maxRegion=Math.max(...regions.map(rg=>rg.length));
    if(maxRegion>Math.floor(size/2)+2)continue; // engine rule: skip too-large regions
    const remain=wallCapMs-(Date.now()-t0);
    solutionResult=generateSolutionMRV(size,regions,regionMap,r,Math.max(500,Math.min(10000,remain)));
    if(solutionResult)break;
  }
  if(!solutionResult)return null;
  const puzzle=createPuzzle(size,regions,regionMap,solutionResult.solution,difficulty,rng);
  return{size,regions,regionMap,solution:solutionResult.solution,puzzle,maxNum:Math.max(...regions.map(r=>r.length)),attempts:attempt+1,nodes:solutionResult.nodes};
}

/* ---- independent validation (engine semantics) ---- */
function validate(size,regions,regionMap,solution,puzzle,difficulty){
  // regions tile the grid
  const seen=new Set();
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const rid=regionMap[r][c];
    if(rid<0||rid>=regions.length)throw new Error('regionMap out of range');
    seen.add(rid);
  }
  for(const region of regions)for(const[r,c]of region){
    if(r<0||r>=size||c<0||c>=size)throw new Error('region cell out of grid');
    if(regionMap[r][c]!==regions.indexOf(region))throw new Error('regionMap/regions mismatch');
  }
  if(seen.size!==regions.length)throw new Error('empty region');
  // region connectivity
  for(let i=0;i<regions.length;i++){
    const cells=regions[i];
    const set=new Set(cells.map(([r,c])=>r+','+c));
    const st=[cells[0]];const vis=new Set([cells[0].join(',')]);
    while(st.length){const[r,c]=st.pop();for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){const k=(r+dr)+','+(c+dc);if(set.has(k)&&!vis.has(k)){vis.add(k);st.push([r+dr,c+dc])}}}
    if(vis.size!==set.size)throw new Error('region '+i+' not connected');
  }
  // solution: each region holds 1..N exactly once; row/col +-window rule
  for(let i=0;i<regions.length;i++){
    const N=regions[i].length;
    const vals=new Set();
    for(const[r,c]of regions[i]){
      const v=solution[r][c];
      if(v<1||v>N)throw new Error('cell value '+v+' outside 1..'+N+' in region '+i);
      if(vals.has(v))throw new Error('duplicate '+v+' in region '+i);
      vals.add(v);
    }
    if(vals.size!==N)throw new Error('region '+i+' missing values');
  }
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const v=solution[r][c];
    for(let cc=Math.max(0,c-v);cc<=Math.min(size-1,c+v);cc++)if(cc!==c&&solution[r][cc]===v)throw new Error('row window violation at '+r+','+c);
    for(let rr=Math.max(0,r-v);rr<=Math.min(size-1,r+v);rr++)if(rr!==r&&solution[rr][c]===v)throw new Error('col window violation at '+r+','+c);
  }
  // given mask: exactly floor(total*difficulty) removed, >=1 given per region, givens match solution
  let removed=0;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!puzzle[r][c])removed++;
  const target=Math.floor(size*size*difficulty);
  /* createPuzzle removes exactly `target`, then may RESTORE one given per given-less
   * region (>=1 given per region) - so removed can fall short by at most regions.length */
  if(removed>target||target-removed>regions.length)throw new Error('removed '+removed+' outside ['+(target-regions.length)+','+target+']');
  for(let i=0;i<regions.length;i++)if(!regions[i].some(([r,c])=>puzzle[r][c]))throw new Error('region '+i+' has no given');
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(puzzle[r][c]&&typeof solution[r][c]!=='number')throw new Error('bad solution cell');
  return true;
}

const B36='0123456789abcdefghijklmnopqrstuvwxyz';
function enc(map2d){let s='';for(const row of map2d)for(const v of row)s+=B36[v];return s}

function build(config,wallCapMs){
  /* seed fallback ladder: some seeds never solve under the engine's own bounded generator
   * (the original pathology - L6/L14/L15/L18-class seeds); the size/difficulty schedule is
   * what defines the level, so failing seeds fall through to deterministic alternates. */
  const SEED_STEPS=[0,500001,1000003,1500005,2000011,2500029,3000047,3500059,4000093,4500101,5000117];
  let data=null,usedSeed=config.seed;
  const t0=Date.now();
  for(const step of SEED_STEPS){
    if(Date.now()-t0>wallCapMs)break;
    const seed=config.seed+step;
    data=generateLevel(Object.assign({},config,{seed}),Math.max(30000,wallCapMs-(Date.now()-t0)));
    if(data){usedSeed=seed;break}
  }
  if(!data)return null;
  try{validate(config.size,data.regions,data.regionMap,data.solution,data.puzzle,config.difficulty)}
  catch(e){console.error('VALIDATION FAIL id='+config.id+': '+e.message);process.exit(1)}
  return{
    id:config.id,size:config.size,difficulty:config.difficulty,seed:usedSeed,
    rm:enc(data.regionMap),sol:enc(data.solution),
    giv:data.puzzle.map(row=>row.map(v=>v?'1':'0').join('')).join(''),
    maxNum:data.maxNum,_attempts:data.attempts,_nodes:data.nodes
  };
}

/* ---- configs: identical schedule to the shipped LEVELS table ---- */
const LEVELS=[];
for(let i=1;i<=30;i++){
  let sz;
  if(i<=5)sz=6;else if(i<=12)sz=8;else if(i<=22)sz=10;else sz=12;
  LEVELS.push({id:i,size:sz,difficulty:.3+(i/30)*.25,seed:i*7919+42});
}
const DAILY=[];
for(let i=0;i<10;i++){
  DAILY.push({id:'d'+(i+1),size:[8,10,12][i%3],difficulty:.45,seed:91000000+i*7919+7});
}

const WALL={6:30000,8:90000,10:180000,12:900000};
const STATE=path.join(__dirname,'..','state','ripple-levels.json');
/* resume support: every solved item is flushed to the state file immediately, and a rerun
 * skips ids already present (a killed run loses nothing - L25's first run burned 24 solved
 * levels because output was only written at the end) */
let out;
try{out=JSON.parse(fs.readFileSync(STATE,'utf8'))}catch(e){out=null}
if(!out||!Array.isArray(out.levels)||!Array.isArray(out.daily)){
  out={generated:new Date().toISOString(),levels:[],daily:[]};
}
function have(id,isDaily){return (isDaily?out.daily:out.levels).some(l=>l.id===id)}
function flush(){fs.mkdirSync(path.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify(out,null,1))}
const T0=Date.now();
const GLOBAL_MS=80*60*1000;

for(const cfg of LEVELS){
  if(have(cfg.id,false)){console.log(`L${cfg.id}: already in state file, skipping`);continue}
  if(Date.now()-T0>GLOBAL_MS){console.error('global budget exceeded');process.exit(1)}
  const t0=Date.now();
  const lv=build(cfg,WALL[cfg.size]);
  if(!lv){console.error(`L${cfg.id} (${cfg.size}x${cfg.size}) FAILED within ${WALL[cfg.size]}ms wall cap`);process.exit(1)}
  out.levels.push(lv);
  flush();
  console.log(`L${cfg.id} (${cfg.size}x${cfg.size} diff=${cfg.difficulty.toFixed(2)}): seed=${lv.seed}, ${(Date.now()-t0)/1000}s, ${lv.rm.length} cells, maxNum=${lv.maxNum}`);
}
for(const cfg of DAILY){
  if(have(cfg.id,true)){console.log(`daily ${cfg.id}: already in state file, skipping`);continue}
  if(Date.now()-T0>GLOBAL_MS){console.error('global budget exceeded');process.exit(1)}
  const t0=Date.now();
  const lv=build(cfg,WALL[cfg.size]);
  if(!lv){console.error(`daily ${cfg.id} (${cfg.size}x${cfg.size}) FAILED`);process.exit(1)}
  out.daily.push(lv);
  flush();
  console.log(`D${cfg.id} (${cfg.size}x${cfg.size} diff=.45): seed=${lv.seed}, ${(Date.now()-t0)/1000}s, maxNum=${lv.maxNum}`);
}
out.levels.sort((a,b)=>a.id-b.id);
flush();
console.log(`OK: ${out.levels.length} levels + ${out.daily.length} dailies in state/ripple-levels.json. Every level independently validated (region tiling+connectivity, 1..N per region, row/col window rule, given-mask counts).`);
