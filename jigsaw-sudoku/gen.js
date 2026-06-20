#!/usr/bin/env node
// Jigsaw Sudoku (Irregular Sudoku) — region-tiling generator + solution generator +
// uniqueness-verified puzzle digger.  Output: jigsaw-sudoku/levels.json
//
// Rules: fill N×N grid with 1..N; each row, column, AND irregular region (N regions
// of N cells each, shapes vary per puzzle) must contain 1..N exactly once.
//
// Strategy:
//   1. Generate a connected region tiling (N regions × N cells) via multi-seed growth.
//   2. Build a full valid solution via MRV backtracking with unified peer set
//      (row + col + region).
//   3. Dig holes in random order, re-checking uniqueness with an independent
//      region-aware solution counter (stop at 2), until target clue count reached.
//   4. Emit levels.json.

const fs = require('fs');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

// ---- Region tiling: partition N×N into N connected regions of N cells each ----
function generateRegions(N, rng){
  const grid = new Int8Array(N*N).fill(-1);
  const cells = shuffle([...Array(N*N).keys()], rng);
  // Pick N well-spread seeds
  const seeds = [];
  for(const idx of cells){
    if(seeds.length >= N) break;
    const r = Math.floor(idx/N), c = idx%N;
    let ok = true;
    for(const s of seeds){
      const sr = Math.floor(s/N), sc = s%N;
      if(Math.abs(r-sr)+Math.abs(c-sc) < Math.max(2, Math.floor(N/3))){ ok=false; break; }
    }
    if(ok) seeds.push(idx);
  }
  while(seeds.length < N){ for(const idx of cells){ if(!seeds.includes(idx)){ seeds.push(idx); if(seeds.length>=N) break; } } }
  const regionList = Array.from({length:N}, ()=>[]);
  const sizes = new Array(N).fill(0);
  for(let rid=0; rid<N; rid++){ grid[seeds[rid]]=rid; regionList[rid].push(seeds[rid]); sizes[rid]=1; }
  let claimed = N;
  const order = shuffle([...Array(N).keys()], rng);
  let safety = 0;
  while(claimed < N*N && safety < N*N*6){
    safety++;
    shuffle(order, rng);
    let progressed = false;
    for(const rid of order){
      if(sizes[rid] >= N) continue;
      // Find frontier: unclaimed cells adjacent to this region
      const frontier = [];
      for(const cell of regionList[rid]){
        const r = Math.floor(cell/N), c = cell%N;
        for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nr=r+dr, nc=c+dc;
          if(nr>=0&&nr<N&&nc>=0&&nc<N){ const ni=nr*N+nc; if(grid[ni]===-1) frontier.push(ni); }
        }
      }
      if(frontier.length === 0) continue;
      const pick = frontier[Math.floor(rng()*frontier.length)];
      grid[pick] = rid; regionList[rid].push(pick); sizes[rid]++; claimed++; progressed = true;
      if(claimed >= N*N) break;
    }
    if(!progressed){
      // Assign remaining unclaimed cells to any adjacent region with capacity
      for(let i=0; i<N*N; i++){
        if(grid[i] === -1){
          const r = Math.floor(i/N), c = i%N;
          let best = -1;
          for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
            const nr=r+dr, nc=c+dc;
            if(nr>=0&&nr<N&&nc>=0&&nc<N){ const rid2=grid[nr*N+nc]; if(rid2>=0 && sizes[rid2]<N){ best=rid2; break; } }
          }
          if(best === -1){ for(let rid2=0; rid2<N; rid2++){ if(sizes[rid2]<N){ best=rid2; break; } } }
          grid[i] = best; regionList[best].push(i); sizes[best]++; claimed++;
        }
      }
      break;
    }
  }
  for(let r=0; r<N; r++){ if(sizes[r] !== N) return null; }
  return grid;
}

// ---- Build peer list: every cell conflicting with a given cell (row + col + region) ----
function buildPeers(N, regionGrid){
  const peers = new Array(N*N);
  for(let r=0; r<N; r++) for(let c=0; c<N; c++){
    const idx = r*N+c;
    const s = new Set();
    for(let i=0; i<N; i++){ if(i!==c) s.add(r*N+i); if(i!==r) s.add(i*N+c); }
    const rid = regionGrid[idx];
    for(let i=0; i<N*N; i++){ if(regionGrid[i]===rid && i!==idx) s.add(i); }
    peers[idx] = [...s];
  }
  return peers;
}

// ---- Count solutions up to `limit` with constraint propagation + MRV ----
function countSolutions(grid, N, peers, limit){
  const g = Int8Array.from(grid); // copy
  const rows = new Int32Array(N), cols = new Int32Array(N), regs = new Int32Array(N);
  const empties = [];
  const FULL = (1<<N) - 1;
  for(let i=0; i<N*N; i++){
    const v = g[i];
    if(v){ const bit=1<<(v-1); const r=Math.floor(i/N),c=i%N; rows[r]|=bit; cols[c]|=bit; regs[regionGrid[i]]|=bit; }
    else empties.push(i);
  }
  // WAIT — regionGrid is not in scope here. Fix: pass it or capture.
}

// Proper solver with regionGrid captured via closure
function makeCounter(N, regionGrid, peers){
  const FULL = (1<<N) - 1;
  return function countSolutions(grid, limit){
    const g = Int8Array.from(grid);
    const rows = new Int32Array(N), cols = new Int32Array(N), regs = new Int32Array(N);
    const empties = [];
    for(let i=0; i<N*N; i++){
      const v = g[i];
      if(v){ const bit=1<<(v-1); const r=Math.floor(i/N),c=i%N; rows[r]|=bit; cols[c]|=bit; regs[regionGrid[i]]|=bit; }
      else empties.push(i);
    }
    let count = 0;
    function candMask(idx){
      const r=Math.floor(idx/N), c=idx%N;
      return FULL & ~(rows[r] | cols[c] | regs[regionGrid[idx]]);
    }
    function propagate(){
      // Fill naked singles. Returns filled list for undo, or null on contradiction.
      const filled = [];
      let changed = true;
      while(changed){
        changed = false;
        for(let k=0; k<empties.length; k++){
          const idx = empties[k];
          const m = candMask(idx);
          if(m === 0){ for(const f of filled) unfill(f); return null; }
          if((m & (m-1)) === 0){
            const d = Math.log2(m) + 1; // digit
            g[idx] = d;
            const r=Math.floor(idx/N), c=idx%N; const bit=m;
            rows[r]|=bit; cols[c]|=bit; regs[regionGrid[idx]]|=bit;
            empties.splice(k,1); k--;
            filled.push(idx);
            changed = true;
          }
        }
      }
      return filled;
    }
    function fill(idx, d){
      const bit = 1<<(d-1);
      g[idx] = d;
      const r=Math.floor(idx/N), c=idx%N;
      rows[r]|=bit; cols[c]|=bit; regs[regionGrid[idx]]|=bit;
      const k = empties.indexOf(idx); if(k>=0) empties.splice(k,1);
    }
    function unfill(idx){
      const d = g[idx]; const bit = 1<<(d-1);
      g[idx] = 0;
      const r=Math.floor(idx/N), c=idx%N;
      rows[r]&=~bit; cols[c]&=~bit; regs[regionGrid[idx]]&=~bit;
      empties.push(idx);
    }
    function backtrack(){
      if(count >= limit) return;
      const prop = propagate();
      if(prop === null) return;
      if(empties.length === 0){ count++; for(let i=prop.length-1;i>=0;i--) unfill(prop[i]); return; }
      // MRV
      let bestK=-1, bestMask=0, bestCnt=N+1;
      for(let k=0; k<empties.length; k++){
        const m = candMask(empties[k]);
        const cnt = popcount(m);
        if(cnt < bestCnt){ bestCnt=cnt; bestK=k; bestMask=m; if(cnt<=2) break; }
      }
      const idx = empties[bestK];
      let m = bestMask, d = 1;
      while(m){
        if(m & 1){
          fill(idx, d);
          backtrack();
          unfill(idx);
          if(count >= limit) break;
        }
        m >>= 1; d++;
      }
      for(let i=prop.length-1;i>=0;i--) unfill(prop[i]);
    }
    backtrack();
    return count;
  };
}
function popcount(x){ let c=0; while(x){ c+=x&1; x>>=1; } return c; }

// ---- Generate full solution via MRV backtracking ----
function makeSolution(N, regionGrid, peers, rng){
  const FULL = (1<<N) - 1;
  const g = new Int8Array(N*N);
  const rows = new Int32Array(N), cols = new Int32Array(N), regs = new Int32Array(N);
  const order = shuffle([...Array(N*N).keys()], rng);
  function candMask(idx){
    const r=Math.floor(idx/N), c=idx%N;
    return FULL & ~(rows[r] | cols[c] | regs[regionGrid[idx]]);
  }
  function bt(pos){
    if(pos === order.length) return true;
    const idx = order[pos];
    if(g[idx] !== 0) return bt(pos+1);
    const r=Math.floor(idx/N), c=idx%N;
    let m = candMask(idx);
    const digits = [];
    let d=1;
    while(m){ if(m&1) digits.push(d); m>>=1; d++; }
    shuffle(digits, rng);
    for(const dgt of digits){
      const bit = 1<<(dgt-1);
      g[idx]=dgt; rows[r]|=bit; cols[c]|=bit; regs[regionGrid[idx]]|=bit;
      if(bt(pos+1)) return true;
      rows[r]&=~bit; cols[c]&=~bit; regs[regionGrid[idx]]&=~bit; g[idx]=0;
    }
    return false;
  }
  return bt(0) ? Array.from(g) : null;
}

// ---- Dig holes: remove cells while maintaining uniqueness ----
function makePuzzle(solution, N, regionGrid, peers, targetGivens, rng, counter){
  const puzzle = Int8Array.from(solution);
  const cells = shuffle([...Array(N*N).keys()], rng);
  let givens = N*N;
  for(const idx of cells){
    if(givens <= targetGivens) break;
    const saved = puzzle[idx];
    puzzle[idx] = 0;
    const cnt = counter(puzzle, 2);
    if(cnt === 1) givens--;
    else puzzle[idx] = saved; // restore
  }
  return { puzzle: Array.from(puzzle), givens };
}

// ---- Main pipeline ----
const TIERS = [
  { name:"Beginner", count:4, N:6, givens:[20,24] },
  { name:"Easy",     count:4, N:6, givens:[14,18] },
  { name:"Medium",   count:4, N:6, givens:[10,13] },
  { name:"Hard",     count:6, N:9, givens:[32,38] },
  { name:"Expert",   count:5, N:9, givens:[26,31] },
  { name:"Master",   count:4, N:9, givens:[22,25] },
];

function genLevel(tier, N, givensRange, levelNum, rng){
  for(let attempt=0; attempt<25; attempt++){
    // Regions
    let regionGrid = null;
    for(let t=0; t<15; t++){ regionGrid = generateRegions(N, rng); if(regionGrid) break; }
    if(!regionGrid) continue;
    const peers = buildPeers(N, regionGrid);
    const counter = makeCounter(N, regionGrid, peers);
    // Solution
    const solution = makeSolution(N, regionGrid, peers, rng);
    if(!solution) continue;
    // Puzzle
    const target = givensRange[0] + Math.floor(rng() * (givensRange[1]-givensRange[0]+1));
    const { puzzle, givens } = makePuzzle(solution, N, regionGrid, peers, target, rng, counter);
    if(givens > givensRange[1] + 3) continue;
    // Final uniqueness check
    const cnt = counter(Int8Array.from(puzzle), 2);
    if(cnt !== 1) continue;
    // Build regionCells
    const regionCells = Array.from({length:N}, ()=>[]);
    for(let i=0; i<N*N; i++) regionCells[regionGrid[i]].push([Math.floor(i/N), i%N]);
    return {
      n: N,
      regions: Array.from(regionGrid),
      regionCells,
      solution: chunk(solution, N),
      puzzle: chunk(puzzle, N),
      givens,
      tier: tier,
      level: levelNum,
    };
  }
  return null;
}
function chunk(arr, N){ const out=[]; for(let i=0;i<arr.length;i+=N) out.push(arr.slice(i,i+N)); return out; }

function main(){
  const seed = parseInt(process.argv[2]) || 391;
  const rng = mulberry32(seed);
  const levels = [];
  let levelNum = 0;
  const t0 = Date.now();
  for(const tier of TIERS){
    for(let i=0; i<tier.count; i++){
      levelNum++;
      let lv = null;
      for(let retry=0; retry<5; retry++){
        lv = genLevel(tier.name, tier.N, tier.givens, levelNum, rng);
        if(lv) break;
      }
      if(!lv){ console.error(`FAILED level ${levelNum} (${tier.name})`); process.exit(1); }
      levels.push(lv);
      process.stderr.write(`  L${String(levelNum).padStart(2)} ${tier.name.padEnd(9)} ${tier.N}x${tier.N}  givens=${lv.givens}  [${((Date.now()-t0)/1000).toFixed(1)}s]\n`);
      fs.writeFileSync('/home/msdn/gamezipper.com/jigsaw-sudoku/levels.json', JSON.stringify(levels));
    }
  }
  process.stderr.write(`\nGenerated ${levels.length} levels in ${((Date.now()-t0)/1000).toFixed(1)}s\n`);
}
main();
