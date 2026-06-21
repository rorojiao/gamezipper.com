#!/usr/bin/env node
// Little Killer Sudoku — generator + uniqueness-verified puzzle digger.
// Rules: standard Sudoku (rows/cols/boxes contain 1..N once) PLUS
//   diagonal sum clues: numbers outside grid indicate sum of ALL cells
//   on the main diagonal (\) and anti-diagonal (/).
//   - Main diagonal: cells where r === c
//   - Anti-diagonal: cells where r + c === N - 1  (0-indexed)
// Output: little-killer-sudoku/levels.json
//
// Strategy:
//   1. Build full valid Sudoku solution via canonical-pattern + shuffles.
//   2. Compute diagonal sums from the complete grid.
//   3. Dig holes in random order, checking uniqueness after each removal.
//   4. Uniqueness check: DFS solver with diagonal-sum pruning.
//   5. Emit levels.json + verification report.

const fs = require('fs');

// ---- seedable RNG ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }

// ---- diagonal cells ----
function diagCells(N){
  const main=[], anti=[];
  for(let i=0;i<N;i++){ main.push(i*N+i); anti.push(i*N+(N-1-i)); }
  return {main,anti};
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

// ---- compute diagonal sums from complete grid ----
function computeDiagSums(grid,N){
  const {main,anti}=diagCells(N);
  let s1=0,s2=0;
  for(const idx of main) s1+=grid[idx];
  for(const idx of anti) s2+=grid[idx];
  return {mainSum:s1, antiSum:s2};
}

// ---- solver: count solutions (stop at 2) with diagonal-sum pruning ----
// grid: Int8Array(N*N), 0=empty
// Returns number of solutions found (0, 1, or 2)
function countSolutions(grid,N,peers,mainSum,antiSum){
  const {main,anti}=diagCells(N);
  const mainSet=new Set(main), antiSet=new Set(anti);
  const g=new Int8Array(grid); // working copy
  let count=0;

  // Candidate masks: bits 1..N for each cell
  const cands=new Uint16Array(N*N);
  for(let i=0;i<N*N;i++){
    if(g[i]!==0) cands[i]=0;
    else cands[i]=(1<<(N+1))-2; // bits 1..N
  }
  // Eliminate from givens
  for(let i=0;i<N*N;i++){
    if(g[i]!==0){
      for(const p of peers[i]) cands[p]&=~(1<<g[i]);
    }
  }

  function solve(){
    if(count>=2) return;

    // MRV: find empty cell with fewest candidates
    let bestIdx=-1, bestCount=99;
    for(let i=0;i<N*N;i++){
      if(g[i]===0){
        let cnt=0;
        for(let v=1;v<=N;v++) if(cands[i]&(1<<v)) cnt++;
        if(cnt===0) return; // dead end
        if(cnt<bestCount){ bestCount=cnt; bestIdx=i; if(cnt===1) break; }
      }
    }
    if(bestIdx===-1){
      // All filled — check diagonal sums
      let s1=0,s2=0;
      for(const idx of main) s1+=g[idx];
      for(const idx of anti) s2+=g[idx];
      if(s1===mainSum && s2===antiSum) count++;
      return;
    }

    const idx=bestIdx;
    const onMain=mainSet.has(idx), onAnti=antiSet.has(idx);

    for(let v=1;v<=N;v++){
      if(!(cands[idx]&(1<<v))) continue;
      // Try placing v at idx
      g[idx]=v;

      // Collect affected cells for undo
      const removed=[];
      for(const p of peers[idx]){
        if(g[p]===0 && (cands[p]&(1<<v))){
          cands[p]&=~(1<<v);
          removed.push(p);
        }
      }

      // Diagonal-sum pruning
      let prune=false;
      if(onMain||onAnti){
        // Compute partial sums + remaining capacity
        let ms=0, mc=0; // main: sum, empty count
        let as=0, ac=0;
        for(let k=0;k<N;k++){
          const mi=main[k], ai=anti[k];
          if(g[mi]!==0) ms+=g[mi]; else mc++;
          if(g[ai]!==0) as+=g[ai]; else ac--;
          // fix: need separate counts
        }
        // Recompute properly
        ms=0; mc=0; as=0; ac=0;
        for(let k=0;k<N;k++){
          if(g[main[k]]!==0) ms+=g[main[k]]; else mc++;
          if(g[anti[k]]!==0) as+=g[anti[k]]; else ac++;
        }
        // Min/max possible remaining
        const msMin=ms+mc*1, msMax=ms+mc*N;
        const asMin=as+ac*1, asMax=as+ac*N;
        if(msMin>mainSum || msMax<mainSum) prune=true;
        if(asMin>antiSum || asMax<antiSum) prune=true;
      }

      if(!prune) solve();

      // Undo
      for(const p of removed) cands[p]|=(1<<v);
      g[idx]=0;

      if(count>=2) return;
    }
  }

  solve();
  return count;
}

// ---- verify a FULL grid satisfies standard Sudoku constraints ----
function checkFull(grid,N,peers){
  for(let i=0;i<N*N;i++){
    const v=grid[i]; if(v<1||v>N)return false;
    for(const p of peers[i]) if(grid[p]===v) return false;
  }
  return true;
}

// ---- dig holes to create puzzle with target given count ----
function digHoles(solution,N,peers,mainSum,antiSum,targetGivens,rng){
  const puzzle=new Int8Array(solution);
  const allCells=shuffle([...Array(N*N).keys()],rng);

  let givens=N*N;
  for(const idx of allCells){
    if(givens<=targetGivens) break;
    if(puzzle[idx]===0) continue;
    const saved=puzzle[idx];
    puzzle[idx]=0;
    const sols=countSolutions(puzzle,N,peers,mainSum,antiSum);
    if(sols===1){
      givens--;
    } else {
      puzzle[idx]=saved; // restore — not unique
    }
  }
  return {puzzle, givens};
}

// ---- tier config ----
const TIERS=[
  {name:'Beginner',count:4,N:6,givens:[16,18]},
  {name:'Easy',    count:4,N:6,givens:[12,14]},
  {name:'Medium',  count:5,N:6,givens:[8,10]},
  {name:'Hard',    count:5,N:9,givens:[28,32]},
  {name:'Expert',  count:5,N:9,givens:[22,26]},
  {name:'Master',  count:4,N:9,givens:[17,20]},
];

// ---- main ----
function main(){
  const levels=[];
  let levelId=1;
  let seed=42;

  for(const tier of TIERS){
    for(let i=0;i<tier.count;i++){
      const N=tier.N;
      const peers=buildPeers(N);
      let success=false;
      let attempts=0;

      while(!success && attempts<200){
        attempts++;
        const rng=mulberry32(seed+attempts*7919+i*31);
        const solution=makeComplete(N,rng);
        if(!checkFull(solution,N,peers)) continue;

        const {mainSum,antiSum}=computeDiagSums(solution,N);
        const targetGivens=tier.givens[0]+Math.floor(rng()*(tier.givens[1]-tier.givens[0]+1));
        const {puzzle,givens}=digHoles(solution,N,peers,mainSum,antiSum,targetGivens,rng);

        // Final uniqueness check
        const sols=countSolutions(puzzle,N,peers,mainSum,antiSum);
        if(sols!==1) continue;

        // Convert to 2D arrays
        const sol2d=[],puz2d=[];
        for(let r=0;r<N;r++){
          const sr=[],pr=[];
          for(let c=0;c<N;c++){ sr.push(solution[r*N+c]); pr.push(puzzle[r*N+c]); }
          sol2d.push(sr); puz2d.push(pr);
        }

        levels.push({
          id:levelId++,
          tier:tier.name,
          n:N,
          box_r:boxSize(N)[0],
          box_c:boxSize(N)[1],
          givens,
          mainSum,
          antiSum,
          label:`${N}x${N} — ${tier.name.toLowerCase()}`,
          puzzle:puz2d,
          solution:sol2d,
        });

        success=true;
        console.log(`  L${levelId-1} ${tier.name} ${N}x${N} givens=${givens} diag=(${mainSum},${antiSum}) [attempts=${attempts}]`);
      }

      if(!success){
        console.error(`FAILED to generate level ${levelId} for tier ${tier.name} after 200 attempts`);
        process.exit(1);
      }
      seed+=1000;
    }
  }

  // Write levels.json
  const outPath=__dirname+'/levels.json';
  fs.writeFileSync(outPath, JSON.stringify(levels));
  console.log(`\n✅ Generated ${levels.length} levels → ${outPath}`);

  // Summary
  const byTier={};
  for(const lv of levels){ byTier[lv.tier]=(byTier[lv.tier]||0)+1; }
  console.log('Tier distribution:', JSON.stringify(byTier));
}

main();
