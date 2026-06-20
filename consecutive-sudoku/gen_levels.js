#!/usr/bin/env node
// Consecutive Sudoku — level generator with uniqueness verification
// Rules: Standard Sudoku + adjacent cells with a BAR must be consecutive (differ by 1);
//        adjacent cells WITHOUT a bar must NOT be consecutive.
// Output: consecutive-sudoku/levels.json

const fs = require('fs');
const crypto = require('crypto');

// ---- RNG (seedable) ----
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }

// ---- Sudoku grid generation ----
function shuffle(arr, rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:N===9?[3,3]:null; }

function makeFilled(N, rng){
  const [br,bc]=boxSize(N);
  // retry until we get a COMPLETE valid solution (solve can rarely fail on
  // unlucky partial fills; just regenerate)
  for(let attempt=0;attempt<200;attempt++){
    const g=Array.from({length:N},()=>Array(N).fill(0));
    // fill INDEPENDENT diagonal boxes (top-left of each band along the main
    // diagonal). Use correct box dimensions [br x bc]. Boxes along the diagonal
    // share no row/col so they never conflict.
    const nBandsH=Math.ceil(N/br), nStacksW=Math.ceil(N/bc);
    const nDiag=Math.min(nBandsH,nStacksW);
    for(let d=0;d<nDiag;d++){
      const r0=d*br, c0=d*bc;
      if(r0>=N||c0>=N) break;
      const nums=shuffle([...Array(N)].map((_,i)=>i+1),rng);
      let k=0;
      for(let r=r0;r<Math.min(r0+br,N);r++) for(let c=c0;c<Math.min(c0+bc,N);c++) g[r][c]=nums[k++];
    }
    if(!solve(g,N)) continue; // fill the rest via backtracking; retry if it fails
    // verify completeness (no zeros)
    let complete=true;
    for(let r=0;r<N&&complete;r++)for(let c=0;c<N&&complete;c++) if(g[r][c]===0) complete=false;
    if(!complete) continue;
    return randomizeSolution(g,N,rng);
  }
  throw new Error('makeFilled failed after 200 attempts for N='+N);
}

function valid(g,N,r,c,v){
  for(let i=0;i<N;i++){ if(g[r][i]===v||g[i][c]===v) return false; }
  const [br,bc]=boxSize(N);
  const br0=Math.floor(r/br)*br, bc0=Math.floor(c/bc)*bc;
  for(let i=0;i<br;i++)for(let j=0;j<bc;j++) if(g[br0+i][bc0+j]===v) return false;
  return true;
}

function solve(g,N){
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    if(g[r][c]===0){
      for(let v=1;v<=N;v++){ if(valid(g,N,r,c,v)){ g[r][c]=v; if(solve(g,N)) return true; g[r][c]=0; } }
      return false;
    }
  }
  return true;
}

function randomizeSolution(g,N,rng){
  // relabel digits
  const perm=shuffle([...Array(N)].map((_,i)=>i+1),rng);
  const g2=g.map(row=>row.map(v=>perm[v-1]));
  // random row swaps within bands, col swaps within stacks, band/stack swaps
  const [br,bc]=boxSize(N);
  // swap rows within each band
  for(let band=0;band<N;band+=br){
    const idx=shuffle([...Array(br)].map((_,i)=>band+i),rng);
    const tmp=g2.slice(band,band+br);
    for(let i=0;i<br;i++) g2[band+i]=tmp[idx[i]-band];
  }
  // swap cols within each stack
  for(let stack=0;stack<N;stack+=bc){
    const idx=shuffle([...Array(bc)].map((_,i)=>stack+i),rng);
    for(let r=0;r<N;r++){ const tmp=g2[r].slice(stack,stack+bc); for(let i=0;i<bc;i++) g2[r][stack+i]=tmp[idx[i]-stack]; }
  }
  return g2;
}

// ---- Consecutive bar computation ----
// bars: object keyed "r,c|r2,c2" -> true if bar present (consecutive required)
function computeBars(solution,N){
  const bars={};
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    // right neighbor
    if(c+1<N){ const d=Math.abs(solution[r][c]-solution[r][c+1]); if(d===1) bars[`${r},${c}|${r},${c+1}`]=true; }
    // down neighbor
    if(r+1<N){ const d=Math.abs(solution[r][c]-solution[r+1][c]); if(d===1) bars[`${r},${c}|${r+1},${c}`]=true; }
  }
  return bars;
}

// ---- Consecutive-aware solver for uniqueness check ----
// Returns count of solutions up to `limit`.
function countSolutions(puzzle,N,bars,limit){
  const g=puzzle.map(r=>r.slice());
  const [br,bc]=boxSize(N);
  function isConsec(a,b){ return Math.abs(a-b)===1; }
  function ok(r,c,v){
    for(let i=0;i<N;i++) if(g[r][i]===v||g[i][c]===v) return false;
    const br0=Math.floor(r/br)*br, bc0=Math.floor(c/bc)*bc;
    for(let i=0;i<br;i++)for(let j=0;j<bc;j++) if(g[br0+i][bc0+j]===v) return false;
    // consecutive constraints with filled neighbors
    // right
    if(c+1<N){ const nv=g[r][c+1]; const hasBar=!!bars[`${r},${c}|${r},${c+1}`]; if(nv!==0){ if(hasBar!==isConsec(v,nv)) return false; } }
    if(c-1>=0){ const nv=g[r][c-1]; const hasBar=!!bars[`${r},${c-1}|${r},${c}`]; if(nv!==0){ if(hasBar!==isConsec(v,nv)) return false; } }
    if(r+1<N){ const nv=g[r+1][c]; const hasBar=!!bars[`${r},${c}|${r+1},${c}`]; if(nv!==0){ if(hasBar!==isConsec(v,nv)) return false; } }
    if(r-1>=0){ const nv=g[r-1][c]; const hasBar=!!bars[`${r-1},${c}|${r},${c}`]; if(nv!==0){ if(hasBar!==isConsec(v,nv)) return false; } }
    return true;
  }
  let count=0;
  function bt(){
    if(count>=limit) return;
    // find MRV cell
    let br2=-1,bc2=-1,best=99;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      if(g[r][c]===0){
        let cnt=0;
        for(let v=1;v<=N;v++) if(ok(r,c,v)) cnt++;
        if(cnt===0) return;
        if(cnt<best){ best=cnt; br2=r; bc2=c; if(cnt===1) break; }
      }
    }
    if(br2===-1){ count++; return; }
    for(let v=1;v<=N;v++){ if(ok(br2,bc2,v)){ g[br2][bc2]=v; bt(); g[br2][bc2]=0; if(count>=limit) return; } }
  }
  bt();
  return count;
}

// ---- Generate one puzzle ----
function generatePuzzle(N, rng, targetClues, maxMs){
  const t0=Date.now();
  for(let attempt=0;attempt<60;attempt++){
    const solution=makeFilled(N,rng);
    const bars=computeBars(solution,N);
    const puzzle=solution.map(r=>r.slice());
    const positions=shuffle([...Array(N*N)].map((_,i)=>i),rng);
    let clues=N*N;
    for(const pos of positions){
      if(clues<=targetClues) break;
      if(Date.now()-t0>maxMs) break;
      const r=Math.floor(pos/N), c=pos%N;
      const save=puzzle[r][c];
      puzzle[r][c]=0;
      const cnt=countSolutions(puzzle,N,bars,2);
      if(cnt!==1){ puzzle[r][c]=save; } // not unique or unsolvable, restore
      else { clues--; }
    }
    if(clues<=targetClues+2 || attempt>=40){
      // verify final uniqueness
      const finalCnt=countSolutions(puzzle,N,bars,2);
      if(finalCnt===1) return {solution,puzzle,bars,clues};
    }
  }
  // fallback: return last best with full solution
  const solution=makeFilled(N,rng);
  const bars=computeBars(solution,N);
  return {solution,puzzle:solution.map(r=>r.slice()),bars,clues:N*N};
}

// ---- Bar serialization for compactness ----
// Represent bars as arrays of [r1,c1,r2,c2]
function barsToArray(bars,N){
  const arr=[];
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    if(c+1<N && bars[`${r},${c}|${r},${c+1}`]) arr.push([r,c,r,c+1]);
    if(r+1<N && bars[`${r},${c}|${r+1},${c}`]) arr.push([r,c,r+1,c]);
  }
  return arr;
}

// ---- Build tier config ----
const TIERS=[
  {name:'Beginner', N:4, count:4, clues:8, maxMs:3000},
  {name:'Easy',     N:6, count:4, clues:14, maxMs:5000},
  {name:'Medium',   N:6, count:4, clues:12, maxMs:6000},
  {name:'Hard',     N:9, count:6, clues:40, maxMs:15000},
  {name:'Expert',   N:9, count:5, clues:35, maxMs:20000},
  {name:'Master',   N:9, count:4, clues:32, maxMs:25000},
];

function main(){
  const seedBase=parseInt(crypto.createHash('md5').update('consecutive-sudoku-v1-'+Date.now()).digest('hex').slice(0,8),16);
  const rng=mulberry32(seedBase);
  const levels=[];
  let id=1;
  for(const tier of TIERS){
    for(let i=0;i<tier.count;i++){
      process.stderr.write(`Generating ${tier.name} #${i+1} (N=${tier.N}, target clues=${tier.clues})... `);
      const t0=Date.now();
      const res=generatePuzzle(tier.N,rng,tier.clues,tier.maxMs);
      const dt=(Date.now()-t0)/1000;
      const barsArr=barsToArray(res.bars,tier.N);
      // verify uniqueness once more on final puzzle
      const chk=countSolutions(res.puzzle,tier.N,res.bars,2);
      const okMark = chk===1?'✓ UNIQUE':'⚠ RECHECK';
      process.stderr.write(`${res.clues} clues, ${barsArr.length} bars, ${dt.toFixed(1)}s ${okMark}\n`);
      levels.push({
        id, tier:tier.name, N:tier.N,
        puzzle: res.puzzle,
        solution: res.solution,
        bars: barsArr,
        clues: res.clues,
        unique: chk===1
      });
      id++;
    }
  }
  const allUnique = levels.every(l=>l.unique);
  const out={ version:1, generated:new Date().toISOString(), levels, allUnique, count:levels.length };
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(out));
  console.log(`✅ Generated ${levels.length} levels. All unique: ${allUnique}`);
  console.log(`   By tier:`);
  for(const t of TIERS){ const ls=levels.filter(l=>l.tier===t.name); const cs=ls.map(l=>l.clues); console.log(`   ${t.name.padEnd(10)} N=${t.N} clues=${Math.min(...cs)}-${Math.max(...cs)} bars=${ls.reduce((s,l)=>s+l.bars.length,0)}`); }
}

main();
