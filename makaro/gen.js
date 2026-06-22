// Makaro level generator — produces 25 verified-unique levels.
// Rules (this game): N×N grid; fill each NON-shaded cell with 1..N.
// Shaded cells are walls (no entry, excluded from sums).
// Each ROW clue = sum of all non-shaded cells in that row.
// Each COL clue = sum of all non-shaded cells in that column.
// A clue may be null (no constraint). Win = all non-shaded filled + all
// non-null row/col clues satisfied. Generator guarantees a unique solution.

function rng(seed){ // mulberry32
  let a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Count solutions (cap) for a level given shaded set + clues. clues may be null=free.
function countSolutions(N, shaded, rowClue, colClue, cap, nodeCap){
  const cells = [];
  const rowCnt = new Array(N).fill(0);
  const colCnt = new Array(N).fill(0);
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){
    if(!shaded.has(r*N+c)){ cells.push(r*N+c); rowCnt[r]++; colCnt[c]++; }
  }
  const rowSum = new Array(N).fill(0);
  const colSum = new Array(N).fill(0);
  const rowFilled = new Array(N).fill(0);
  const colFilled = new Array(N).fill(0);
  let count = 0, nodes = 0;

  function dfs(idx){
    if(count >= cap) return;
    if(nodes++ > nodeCap){ count = cap+1; return; } // abort: treat as unknown
    if(idx === cells.length){
      for(let c=0;c<N;c++) if(colClue[c]!==null && colSum[c]!==colClue[c]) return;
      for(let r=0;r<N;r++) if(rowClue[r]!==null && rowSum[r]!==rowClue[r]) return;
      count++; return;
    }
    const key = cells[idx];
    const r = (key/N)|0, c = key%N;
    const rowLeftAfter = rowCnt[r]-rowFilled[r]-1;
    const colLeftAfter = colCnt[c]-colFilled[c]-1;
    for(let v=1; v<=N; v++){
      if(rowClue[r]!==null){
        const rem = rowClue[r]-(rowSum[r]+v);
        if(rem < rowLeftAfter*1 || rem > rowLeftAfter*N) continue;
      }
      if(colClue[c]!==null){
        const rem = colClue[c]-(colSum[c]+v);
        if(rem < colLeftAfter*1 || rem > colLeftAfter*N) continue;
      }
      rowSum[r]+=v; colSum[c]+=v; rowFilled[r]++; colFilled[c]++;
      let ok = true;
      if(rowFilled[r]===rowCnt[r] && rowClue[r]!==null && rowSum[r]!==rowClue[r]) ok=false;
      if(ok && colFilled[c]===colCnt[c] && colClue[c]!==null && colSum[c]!==colClue[c]) ok=false;
      if(ok) dfs(idx+1);
      rowSum[r]-=v; colSum[c]-=v; rowFilled[r]--; colFilled[c]--;
      if(count >= cap) return;
    }
  }
  dfs(0);
  return count;
}

// Build a random solution grid for non-shaded cells (1..N), biased toward
// informative (extreme-ish) values to raise uniqueness odds.
function randomFill(N, shaded, rand){
  const g = Array.from({length:N},()=>new Array(N).fill(0));
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){
    if(shaded.has(r*N+c)){ g[r][c]=-1; continue; }
    const t = rand();
    let v;
    if(t < 0.18) v = 1;
    else if(t < 0.36) v = N;
    else v = 1 + ((rand()*(N))|0); // 1..N
    g[r][c] = v;
  }
  return g;
}

function sumsFromGrid(N, shaded, g){
  const rowClue = new Array(N).fill(0);
  const colClue = new Array(N).fill(0);
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){
    if(shaded.has(r*N+c)) continue;
    rowClue[r]+=g[r][c]; colClue[c]+=g[r][c];
  }
  return {rowClue, colClue};
}

function pickShaded(N, count, rand){
  const total = N*N;
  const idxs = [];
  for(let i=0;i<total;i++) idxs.push(i);
  // shuffle
  for(let i=idxs.length-1;i>0;i--){ const j=(rand()*(i+1))|0; [idxs[i],idxs[j]]=[idxs[j],idxs[i]]; }
  const set = new Set();
  for(let i=0;i<count;i++) set.add(idxs[i]);
  return set;
}

// Try to null out clues (harder) while preserving uniqueness.
function sparsifyClues(N, shaded, rowClue, colClue, rand, nodeCap){
  const rc = rowClue.slice(), cc = colClue.slice();
  // candidate (axis, index) list, shuffled
  const cands = [];
  for(let r=0;r<N;r++) cands.push(['r',r]);
  for(let c=0;c<N;c++) cands.push(['c',c]);
  for(let i=cands.length-1;i>0;i--){ const j=(rand()*(i+1))|0; [cands[i],cands[j]]=[cands[j],cands[i]]; }
  let nullCount = 0;
  for(const [ax,i] of cands){
    if(nullCount >= MAX_NULLS) break;
    if(ax==='r'){ if(rc[i]===null) continue; const save=rc[i]; rc[i]=null;
      if(countSolutions(N,shaded,rc,cc,2,nodeCap)===1){ nullCount++; } else rc[i]=save; }
    else { if(cc[i]===null) continue; const save=cc[i]; cc[i]=null;
      if(countSolutions(N,shaded,rc,cc,2,nodeCap)===1){ nullCount++; } else cc[i]=save; }
  }
  return {rowClue:rc, colClue:cc};
}

const MAX_NULLS = 0; // set per-tier below (overridden)

function makeLevel(N, targetShaded, allowNulls, seed){
  const rand = rng(seed);
  let shade = targetShaded;
  for(let attempt=0; attempt<4000; attempt++){
    const shaded = pickShaded(N, shade, rand);
    const g = randomFill(N, shaded, rand);
    const {rowClue, colClue} = sumsFromGrid(N, shaded, g);
    const nodeCap = 600000;
    const cnt = countSolutions(N, shaded, rowClue, colClue, 2, nodeCap);
    if(cnt !== 1){ // 0, 2, or aborted(>cap) -> retry; bump shade occasionally
      if(cnt > 2 && attempt>0 && attempt%60===0 && shade < Math.floor(N*N/3)) shade++;
      continue;
    }
    // unique with full clues. Optionally sparsify.
    let final = {rowClue, colClue};
    if(allowNulls > 0){
      const tmp = MAX_NULLS_GLOBAL; // read global
      // set global cap then restore via local sparsify (we pass allowance)
      final = sparsifyWithCap(N, shaded, rowClue, colClue, rand, allowNulls, nodeCap);
    }
    // build cells array
    const cells = [];
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){
      cells.push({r,c,value:g[r][c],isShaded:shaded.has(r*N+c)});
    }
    return { cols:N, rows:N, cells, rowClues:final.rowClue, colClues:final.colClue,
      solution: cells.map(x=>x.value), _attempts:attempt+1, _shade:shade };
  }
  return null;
}

// sparsify with explicit max-nulls cap
function sparsifyWithCap(N, shaded, rowClue, colClue, rand, maxNulls, nodeCap){
  const rc = rowClue.slice(), cc = colClue.slice();
  const cands = [];
  for(let r=0;r<N;r++) cands.push(['r',r]);
  for(let c=0;c<N;c++) cands.push(['c',c]);
  for(let i=cands.length-1;i>0;i--){ const j=(rand()*(i+1))|0; [cands[i],cands[j]]=[cands[j],cands[i]]; }
  let n=0;
  for(const [ax,i] of cands){
    if(n>=maxNulls) break;
    if(ax==='r'){ if(rc[i]===null) continue; const s=rc[i]; rc[i]=null;
      if(countSolutions(N,shaded,rc,cc,2,nodeCap)===1){n++;} else rc[i]=s; }
    else { if(cc[i]===null) continue; const s=cc[i]; cc[i]=null;
      if(countSolutions(N,shaded,rc,cc,2,nodeCap)===1){n++;} else cc[i]=s; }
  }
  return {rowClue:rc, colClue:cc};
}
const MAX_NULLS_GLOBAL = 0; // unused placeholder (kept for clarity)

// Tier plan: [levelRangeStart..end, N, shadeTarget{min,max}, allowNulls]
const TIERS = [
  { name:'Beginner', start:1,  end:5,  N:5, shade:[0,0],  nulls:0 },
  { name:'Easy',     start:6,  end:10, N:6, shade:[1,2],  nulls:0 },
  { name:'Medium',   start:11, end:15, N:7, shade:[2,3],  nulls:1 },
  { name:'Hard',     start:16, end:20, N:8, shade:[3,4],  nulls:2 },
  { name:'Expert',   start:21, end:25, N:9, shade:[4,5],  nulls:3 },
];

function main(){
  const levels = [];
  let seedBase = 1337000;
  for(const tier of TIERS){
    for(let lv = tier.start; lv <= tier.end; lv++){
      const shadeTarget = tier.shade[0] + ((lv - tier.start) % (tier.shade[1]-tier.shade[0]+1));
      let level = null;
      let s = seedBase++;
      for(let tries=0; tries<40 && !level; tries++){
        level = makeLevel(tier.N, shadeTarget, tier.nulls, s + tries*7919);
      }
      if(!level){ throw new Error('FAILED to generate level '+lv+' ('+tier.name+')'); }
      // FINAL verification: ensure unique w.r.t. the FINAL (possibly sparsified) clues
      const verify = countSolutions(tier.N,
        new Set(level.cells.filter(x=>x.isShaded).map(x=>x.r*tier.N+x.c)),
        level.rowClues, level.colClues, 2, 800000);
      if(verify !== 1){ throw new Error('Level '+lv+' uniqueness verify failed: '+verify); }
      level.tier = tier.name;
      level.num = lv;
      levels.push(level);
      const ns = level.cells.filter(x=>x.isShaded).length;
      const nullR = level.rowClues.filter(x=>x===null).length;
      const nullC = level.colClues.filter(x=>x===null).length;
      console.error(`L${lv} ${tier.name} N=${tier.N} shade=${ns} nullR=${nullR} nullC=${nullC} attempts=${level._attempts} UNIQUE=ok`);
    }
  }
  // Emit compact JSON (strip internal fields)
  const out = levels.map(l=>{
    const cells = l.cells.map(c=>[c.r,c.c,c.value,c.isShaded?1:0]);
    return { num:l.num, tier:l.tier, cols:l.cols, rows:l.rows, cells,
      rowClues:l.rowClues, colClues:l.colClues, solution:l.solution };
  });
  console.log(JSON.stringify(out));
}

main();
