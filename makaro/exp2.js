// Experiment 2: with row+col sums PLUS k givens (pre-filled cells), how often unique?
const {countSolutionsWithGivens, rng, pickShaded, sumsFromGrid} = (function(){
  function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function pickShaded(N,count,rand){const t=[];for(let i=0;i<N*N;i++)t.push(i);for(let i=t.length-1;i>0;i--){const j=(rand()*(i+1))|0;[t[i],t[j]]=[t[j],t[i]];}return new Set(t.slice(0,count));}
  function sumsFromGrid(N,shaded,g){const rc=new Array(N).fill(0),cc=new Array(N).fill(0);for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(shaded.has(r*N+c))continue;rc[r]+=g[r][c];cc[c]+=g[r][c];}return{rowClue:rc,colClue:cc};}
  function countSolutionsWithGivens(N,shaded,rowClue,colClue,givens,cap,nodeCap){
    // givens: Map key->value (forced)
    const cells=[],rowCnt=new Array(N).fill(0),colCnt=new Array(N).fill(0);
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(!shaded.has(r*N+c)&&!givens.has(r*N+c)){cells.push(r*N+c);rowCnt[r]++;colCnt[c]++;}}
    const rowSum=new Array(N).fill(0),colSum=new Array(N).fill(0),rowFilled=new Array(N).fill(0),colFilled=new Array(N).fill(0);
    // account givens into base sums & counts
    const baseRow=new Array(N).fill(0),baseCol=new Array(N).fill(0),givenRowCnt=new Array(N).fill(0),givenColCnt=new Array(N).fill(0);
    for(const [key,val] of givens){const r=(key/N)|0,c=key%N;baseRow[r]+=val;baseCol[c]+=val;givenRowCnt[r]++;givenColCnt[c]++;}
    let count=0,nodes=0;
    function dfs(idx){if(count>=cap)return;if(nodes++>nodeCap){count=cap+1;return;}if(idx===cells.length){for(let c=0;c<N;c++)if(colClue[c]!==null&&colSum[c]+baseCol[c]!==colClue[c])return;for(let r=0;r<N;r++)if(rowClue[r]!==null&&rowSum[r]+baseRow[r]!==rowClue[r])return;count++;return;}
      const key=cells[idx],r=(key/N)|0,c=key%N;const rlA=rowCnt[r]-rowFilled[r]-1,clA=colCnt[c]-colFilled[c]-1;
      for(let v=1;v<=N;v++){
        if(rowClue[r]!==null){const rem=rowClue[r]-(baseRow[r]+rowSum[r]+v);const cellsLeftInRow=(rowCnt[r]+givenRowCnt[r])-(rowFilled[r]+givenRowCnt[r])-1;if(rem<rlA||rem>rlA*N)continue;}
        if(colClue[c]!==null){const rem=colClue[c]-(baseCol[c]+colSum[c]+v);if(rem<clA||rem>clA*N)continue;}
        rowSum[r]+=v;colSum[c]+=v;rowFilled[r]++;colFilled[c]++;let ok=true;if(rowFilled[r]===rowCnt[r]&&rowClue[r]!==null&&(rowSum[r]+baseRow[r])!==rowClue[r])ok=false;if(ok&&colFilled[c]===colCnt[c]&&colClue[c]!==null&&(colSum[c]+baseCol[c])!==colClue[c])ok=false;if(ok)dfs(idx+1);rowSum[r]-=v;colSum[c]-=v;rowFilled[r]--;colFilled[c]--;if(count>=cap)return;
      }}
    dfs(0);return count;
  }
  return {countSolutionsWithGivens,rng,pickShaded,sumsFromGrid};
})();

function fillBias(N, shaded, rand){
  const g=Array.from({length:N},()=>new Array(N).fill(0));
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(shaded.has(r*N+c)){g[r][c]=-1;continue;}const t=rand();let v;if(t<0.2)v=1;else if(t<0.4)v=N;else v=1+((rand()*N)|0);g[r][c]=v;}
  return g;
}

function trial(N, shade, kGivens, iters){
  let unique=0; const rand=rng(100+N*7+shade*13+kGivens*5);
  for(let i=0;i<iters;i++){
    const s=pickShaded(N,shade,rand);
    const g=fillBias(N,s,rand);
    const {rowClue,colClue}=sumsFromGrid(N,s,g);
    // pick k givens from non-shaded cells
    const ns=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!s.has(r*N+c))ns.push(r*N+c);
    for(let x=ns.length-1;x>0;x--){const y=(rand()*(x+1))|0;[ns[x],ns[y]]=[ns[y],ns[x]];}
    const givens=new Map();for(let x=0;x<Math.min(kGivens,ns.length);x++){const key=ns[x];givens.set(key,g[(key/N)|0][key%N]);}
    const c=countSolutionsWithGivens(N,s,rowClue,colClue,givens,2,200000);
    if(c===1)unique++;
  }
  console.log(`N=${N} shade=${shade} givens=${kGivens}: unique ${unique}/${iters} = ${(100*unique/iters).toFixed(1)}%`);
}

for(const cfg of [
  [5,0,2],[5,0,3],[5,0,4],[5,0,5],
  [6,2,3],[6,2,4],[6,2,5],[6,2,6],
  [7,3,4],[7,3,5],[7,3,6],[7,3,7],
  [8,4,5],[8,4,6],[8,4,8],[8,4,10],
  [9,5,6],[9,5,8],[9,5,10],[9,5,12],
]) trial(cfg[0],cfg[1],cfg[2],150);
