#!/usr/bin/env node
// Jigsaw Sudoku (Irregular Sudoku) — generator.
// Pattern adapted from anti-knight-sudoku/gen.js (proven fast V8 solver).
// Regions replace boxes+knight as the third constraint.
//
// Output: jigsaw-sudoku/levels.json  {p:puzzle, s:solution, regions, regionCells}

const fs = require('fs');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

// ---- Region tiling: partition N×N into N connected regions of N cells each ----
function generateRegions(N, rng){
  const grid = new Int8Array(N*N).fill(-1);
  const cells = shuffle([...Array(N*N).keys()], rng);
  const seeds = [];
  for(const idx of cells){
    if(seeds.length >= N) break;
    const r = (idx/N)|0, c = idx%N;
    let ok = true;
    for(const s of seeds){
      const sr = (s/N)|0, sc = s%N;
      if(Math.abs(r-sr)+Math.abs(c-sc) < Math.max(2, (N/3)|0)){ ok=false; break; }
    }
    if(ok) seeds.push(idx);
  }
  while(seeds.length < N){ for(const idx of cells){ if(!seeds.includes(idx)){ seeds.push(idx); if(seeds.length>=N) break; } } }
  const regionList = []; for(let i=0;i<N;i++) regionList.push([]);
  const sizes = new Array(N).fill(0);
  for(let rid=0; rid<N; rid++){ grid[seeds[rid]]=rid; regionList[rid].push(seeds[rid]); sizes[rid]=1; }
  let claimed = N;
  const order = shuffle([...Array(N).keys()], rng);
  let safety = 0;
  while(claimed < N*N && safety < N*N*8){
    safety++;
    shuffle(order, rng);
    let progressed = false;
    for(const rid of order){
      if(sizes[rid] >= N) continue;
      const frontier = [];
      for(const cell of regionList[rid]){
        const r = (cell/N)|0, c = cell%N;
        if(r>0){ const ni=(r-1)*N+c; if(grid[ni]===-1) frontier.push(ni); }
        if(r<N-1){ const ni=(r+1)*N+c; if(grid[ni]===-1) frontier.push(ni); }
        if(c>0){ const ni=r*N+(c-1); if(grid[ni]===-1) frontier.push(ni); }
        if(c<N-1){ const ni=r*N+(c+1); if(grid[ni]===-1) frontier.push(ni); }
      }
      if(frontier.length === 0) continue;
      const pick = frontier[(rng()*frontier.length)|0];
      grid[pick] = rid; regionList[rid].push(pick); sizes[rid]++; claimed++; progressed = true;
      if(claimed >= N*N) break;
    }
    if(!progressed){
      for(let i=0; i<N*N; i++){
        if(grid[i] === -1){
          const r=(i/N)|0, c=i%N; let best=-1;
          if(r>0){const rid2=grid[(r-1)*N+c]; if(rid2>=0&&sizes[rid2]<N)best=rid2;}
          if(best===-1&&r<N-1){const rid2=grid[(r+1)*N+c]; if(rid2>=0&&sizes[rid2]<N)best=rid2;}
          if(best===-1&&c>0){const rid2=grid[r*N+(c-1)]; if(rid2>=0&&sizes[rid2]<N)best=rid2;}
          if(best===-1&&c<N-1){const rid2=grid[r*N+(c+1)]; if(rid2>=0&&sizes[rid2]<N)best=rid2;}
          if(best===-1){for(let rid2=0;rid2<N;rid2++){if(sizes[rid2]<N){best=rid2;break;}}}
          grid[i]=best; regionList[best].push(i); sizes[best]++; claimed++;
        }
      }
      break;
    }
  }
  for(let r=0; r<N; r++){ if(sizes[r] !== N) return null; }
  return grid;
}

// ---- Build peer list: row + col + region ----
function buildPeers(N, regionGrid){
  const peers = new Array(N*N);
  for(let r=0; r<N; r++) for(let c=0; c<N; c++){
    const idx = r*N+c;
    const s = new Set();
    for(let i=0;i<N;i++){ if(i!==c)s.add(r*N+i); if(i!==r)s.add(i*N+c); }
    const rid = regionGrid[idx];
    for(let i=0;i<N*N;i++){ if(regionGrid[i]===rid && i!==idx) s.add(i); }
    peers[idx] = [...s];
  }
  return peers;
}

// ---- verify full grid satisfies all constraints ----
function checkFull(grid,N,peers){
  for(let i=0;i<N*N;i++){
    const v=grid[i]; if(v<1||v>N)return false;
    for(const p of peers[i]) if(grid[p]===v) return false;
  }
  return true;
}

// ---- MRV backtracking fill of EMPTY grid -> full solution ----
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

// ---- solution counter (stop at `limit`) — simple MRV DFS ----
function countSolutions(grid,N,peers,limit){
  const g=new Int8Array(grid);
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

// ---- dig holes to reach target clue count, keeping uniqueness ----
function digHoles(solution,N,rng,peers,targetClues,maxMs){
  const t0=Date.now();
  let bestPuzzle=null, bestClues=N*N+1;
  for(let attempt=0; attempt<6; attempt++){
    const puzzle=new Int8Array(solution);
    const order=shuffle([...Array(N*N).keys()],rng);
    let clues=N*N;
    for(const idx of order){
      if(clues<=targetClues)break;
      if(Date.now()-t0>maxMs)break;
      puzzle[idx]=0;
      const cnt=countSolutions(puzzle,N,peers,2);
      if(cnt!==1){ puzzle[idx]=solution[idx]; }
      else clues--;
    }
    const finalCnt=countSolutions(puzzle,N,peers,2);
    if(finalCnt===1 && clues<bestClues){ bestPuzzle=puzzle; bestClues=clues; }
    if(bestClues<=targetClues) break;
  }
  if(!bestPuzzle){ bestPuzzle=new Int8Array(solution); bestClues=N*N; }
  return { puzzle:bestPuzzle, clues:bestClues };
}

// ---- tier config ----
const TIERS=[
  {name:'Beginner', N:6, count:4, clues:22, maxMs:5000},
  {name:'Easy',     N:6, count:4, clues:15, maxMs:6000},
  {name:'Medium',   N:6, count:4, clues:12, maxMs:8000},
  {name:'Hard',     N:9, count:6, clues:34, maxMs:20000},
  {name:'Expert',   N:9, count:5, clues:26, maxMs:30000},
  {name:'Master',   N:9, count:4, clues:22, maxMs:45000},
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }

function genOneLevel(tier, rng){
  for(let attempt=0; attempt<20; attempt++){
    let regionGrid = null;
    for(let t=0; t<15; t++){ regionGrid = generateRegions(tier.N, rng); if(regionGrid) break; }
    if(!regionGrid) continue;
    const peers = buildPeers(tier.N, regionGrid);
    const sol = makeFilled(tier.N, rng, peers);
    if(!sol) continue;
    if(!checkFull(sol, tier.N, peers)) continue;
    const { puzzle, clues } = digHoles(sol, tier.N, rng, peers, tier.clues, tier.maxMs);
    const chk = countSolutions(puzzle, tier.N, peers, 2);
    if(chk !== 1) continue;
    // Build region cells
    const regionCells = []; for(let i=0;i<tier.N;i++) regionCells.push([]);
    for(let i=0;i<tier.N*tier.N;i++) regionCells[regionGrid[i]].push([(i/tier.N)|0, i%tier.N]);
    return {
      tier: tier.name, N: tier.N,
      regions: Array.from(regionGrid),
      regionCells,
      p: gridToArr(puzzle, tier.N),
      s: gridToArr(sol, tier.N),
      clues, unique: true,
    };
  }
  return null;
}

function main(){
  const seed = parseInt(process.argv[2]) || (Date.now() % 1000000);
  const rng = mulberry32(seed);
  process.stderr.write(`Seed: ${seed}\n`);
  const levels=[]; let id=1;
  const t0=Date.now();
  for(const tier of TIERS){
    for(let i=0;i<tier.count;i++){
      process.stderr.write(`  L${String(id).padStart(2)} ${tier.name.padEnd(10)} N=${tier.N} target=${tier.clues}... `);
      const lt0=Date.now();
      const lv = genOneLevel(tier, rng);
      if(!lv){ console.error(`FAILED level ${id} (${tier.name})`); process.exit(1); }
      lv.id = id;
      levels.push(lv);
      process.stderr.write(`${lv.clues} clues, ${((Date.now()-lt0)/1000).toFixed(1)}s, UNIQUE [${((Date.now()-t0)/1000).toFixed(1)}s total]\n`);
      fs.writeFileSync(__dirname+'/levels.json', JSON.stringify({version:1,game:'jigsaw-sudoku',levels,allUnique:true,count:levels.length}));
      id++;
    }
  }
  console.log(`\n=== JIGSAW SUDOKU — ${levels.length} levels generated in ${((Date.now()-t0)/1000).toFixed(1)}s ===`);
}
main();
