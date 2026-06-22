// Experiment 3: TRUE Kakuro-style generator. Latin-square base => every run
// (subset of a row/col permutation) is automatically distinct. Walls split
// rows/cols into runs with varied sums. Verify uniqueness via Kakuro solver
// (distinct + sum per run).
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function latinSquare(N, rand){
  // randomized Latin square via repeated row/column shuffles of cyclic base
  let L = Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>((r+c)%N)+1));
  // shuffle symbol labels
  const sym = Array.from({length:N},(_,i)=>i+1);
  for(let i=N-1;i>0;i--){const j=(rand()*(i+1))|0;[sym[i],sym[j]]=[sym[j],sym[i]];}
  L = L.map(row=>row.map(v=>sym[v-1]));
  // shuffle rows and columns
  const rows=[...Array(N).keys()]; for(let i=N-1;i>0;i--){const j=(rand()*(i+1))|0;[rows[i],rows[j]]=[rows[j],rows[i]];}
  const cols=[...Array(N).keys()]; for(let i=N-1;i>0;i--){const j=(rand()*(i+1))|0;[cols[i],cols[j]]=[cols[j],cols[i]];}
  return Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>L[rows[r]][cols[c]]));
}

function makeWalls(N, wallCount, rand){
  // avoid first row/col being all-wall; place walls randomly but keep grid solvable-ish
  const w = new Set();
  const order=[]; for(let i=0;i<N*N;i++) order.push(i);
  for(let i=order.length-1;i>0;i--){const j=(rand()*(i+1))|0;[order[i],order[j]]=[order[j],order[i]];}
  for(const key of order){ if(w.size>=wallCount) break; w.add(key); }
  return w;
}

// Compute horizontal & vertical runs. Each run = list of cell keys + sum.
function computeRuns(N, walls, L){
  const across=[], down=[];
  for(let r=0;r<N;r++){
    let run=[];
    for(let c=0;c<N;c++){const key=r*N+c; if(walls.has(key)){ if(run.length) across.push({cells:run,sum:run.reduce((s,k)=>s+L[(k/N)|0][k%N],0)}); run=[]; }
      else run.push(key); }
    if(run.length) across.push({cells:run,sum:run.reduce((s,k)=>s+L[(k/N)|0][k%N],0)});
  }
  for(let c=0;c<N;c++){
    let run=[];
    for(let r=0;r<N;r++){const key=r*N+c; if(walls.has(key)){ if(run.length) down.push({cells:run,sum:run.reduce((s,k)=>s+L[(k/N)|0][k%N],0)}); run=[]; }
      else run.push(key); }
    if(run.length) down.push({cells:run,sum:run.reduce((s,k)=>s+L[(k/N)|0][k%N],0)});
  }
  return {across,down};
}

// Kakuro solver: distinct per run + sum per run. Count solutions (cap).
function kakuroCount(N, walls, across, down, cap, nodeCap){
  const white=[]; for(let r=0;r<N;r++)for(let c=0;c<N;c++) if(!walls.has(r*N+c)) white.push(r*N+c);
  // group runs, map cell->runs
  const cellAcross=new Map(), cellDown=new Map();
  for(const run of across){ run.used=new Set(); for(const k of run.cells) cellAcross.set(k,run); }
  for(const run of down){ run.used=new Set(); for(const k of run.cells) cellDown.set(k,run); }
  // order white cells by most-constrained (run length) for speed
  white.sort((a,b)=> (cellAcross.get(a).cells.length+cellDown.get(a).cells.length) - (cellAcross.get(b).cells.length+cellDown.get(b).cells.length));
  const val=new Map();
  let count=0, nodes=0;
  function runOK(run,k,v){
    if(run.used.has(v)) return false;
    const rem=run.sum - (v + [...run.used].reduce((s,x)=>s+x,0));
    const left=run.cells.length-run.used.size-1;
    if(rem<0) return false;
    if(left===0) return rem===0;
    // feasible: remaining distinct unused digits in [1,N] can sum to rem
    return rem>=left*(left+1)/2 - 0 + 0; // minimal sum of left distinct digits >=1+2+.. = left(left+1)/2 ... approx; tighten below
  }
  // stronger feasibility using available digits
  function feasible(run, v){
    if(run.used.has(v)) return false;
    const usedSum=[...run.used].reduce((s,x)=>s+x,0)+v;
    const rem=run.sum-usedSum;
    const left=run.cells.length-run.used.size-1;
    if(rem<0) return false;
    if(left===0) return rem===0;
    // available digits: 1..N minus used minus v
    const avail=[];
    for(let d=1;d<=N;d++) if(!run.used.has(d)&&d!==v) avail.push(d);
    if(avail.length<left) return false;
    avail.sort((a,b)=>a-b);
    let minS=0; for(let i=0;i<left;i++) minS+=avail[i];
    let maxS=0; for(let i=avail.length-left;i<avail.length;i++) maxS+=avail[i];
    return rem>=minS && rem<=maxS;
  }
  function dfs(idx){
    if(count>=cap) return;
    if(nodes++>nodeCap){ count=cap+1; return; }
    if(idx===white.length){ count++; return; }
    const k=white[idx]; const ra=cellAcross.get(k), rd=cellDown.get(k);
    for(let v=1;v<=N;v++){
      if(!feasible(ra,v)) continue;
      if(!feasible(rd,v)) continue;
      // need to check rd feasibility properly with its own used set (rd vs ra independent) — feasible() uses run.used
      val.set(k,v); ra.used.add(v); rd.used.add(v);
      dfs(idx+1);
      ra.used.delete(v); rd.used.delete(v); val.delete(k);
      if(count>=cap) return;
    }
  }
  dfs(0);
  return count;
}

function trial(N, wallCount, iters){
  let unique=0, multi=0, abort=0, valid=0; const rand=rng(7+N*31+wallCount*7);
  for(let i=0;i<iters;i++){
    const L=latinSquare(N,rand);
    const walls=makeWalls(N,wallCount,rand);
    // validity: every white cell must be in a run of length>=1 (always true) AND runs length>=1.
    // also ensure no row/col is fully wall (would be fine actually). Accept.
    const {across,down}=computeRuns(N,walls,L);
    // need fresh run objects for solver each time (solver mutates used). recompute:
    valid++;
    const c=kakuroCount(N,walls,across,down,2,400000);
    if(c===1) unique++; else if(c===2) multi++; else abort++;
  }
  console.log(`N=${N} walls=${wallCount}: unique ${unique}/${iters} (${(100*unique/iters).toFixed(1)}%) multi=${multi} abort=${abort}`);
}

for(const cfg of [
  [5,4],[5,6],[5,8],
  [6,6],[6,9],[6,12],
  [7,9],[7,12],[7,15],
  [8,12],[8,16],[8,20],
  [9,16],[9,20],[9,24],
]) trial(cfg[0],cfg[1],120);
