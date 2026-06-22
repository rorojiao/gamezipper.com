// Experiment: how often is a random NxN matrix UNIQUE given row+col sums?
const {countSolutions, rng, pickShaded, sumsFromGrid} = (function(){
  function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function pickShaded(N,count,rand){const t=[];for(let i=0;i<N*N;i++)t.push(i);for(let i=t.length-1;i>0;i--){const j=(rand()*(i+1))|0;[t[i],t[j]]=[t[j],t[i]];}return new Set(t.slice(0,count));}
  function sumsFromGrid(N,shaded,g){const rc=new Array(N).fill(0),cc=new Array(N).fill(0);for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(shaded.has(r*N+c))continue;rc[r]+=g[r][c];cc[c]+=g[r][c];}return{rowClue:rc,colClue:cc};}
  function countSolutions(N,shaded,rowClue,colClue,cap,nodeCap){const cells=[],rowCnt=new Array(N).fill(0),colCnt=new Array(N).fill(0);for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(!shaded.has(r*N+c)){cells.push(r*N+c);rowCnt[r]++;colCnt[c]++;}}const rowSum=new Array(N).fill(0),colSum=new Array(N).fill(0),rowFilled=new Array(N).fill(0),colFilled=new Array(N).fill(0);let count=0,nodes=0;function dfs(idx){if(count>=cap)return;if(nodes++>nodeCap){count=cap+1;return;}if(idx===cells.length){for(let c=0;c<N;c++)if(colClue[c]!==null&&colSum[c]!==colClue[c])return;for(let r=0;r<N;r++)if(rowClue[r]!==null&&rowSum[r]!==rowClue[r])return;count++;return;}const key=cells[idx],r=(key/N)|0,c=key%N;const rlA=rowCnt[r]-rowFilled[r]-1,clA=colCnt[c]-colFilled[c]-1;for(let v=1;v<=N;v++){if(rowClue[r]!==null){const rem=rowClue[r]-(rowSum[r]+v);if(rem<rlA||rem>rlA*N)continue;}if(colClue[c]!==null){const rem=colClue[c]-(colSum[c]+v);if(rem<clA||rem>clA*N)continue;}rowSum[r]+=v;colSum[c]+=v;rowFilled[r]++;colFilled[c]++;let ok=true;if(rowFilled[r]===rowCnt[r]&&rowClue[r]!==null&&rowSum[r]!==rowClue[r])ok=false;if(ok&&colFilled[c]===colCnt[c]&&colClue[c]!==null&&colSum[c]!==colClue[c])ok=false;if(ok)dfs(idx+1);rowSum[r]-=v;colSum[c]-=v;rowFilled[r]--;colFilled[c]--;if(count>=cap)return;}}dfs(0);return count;}
  return {countSolutions,rng,pickShaded,sumsFromGrid};
})();

function fillBias(N, shaded, rand, p1, pN){
  const g=Array.from({length:N},()=>new Array(N).fill(0));
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(shaded.has(r*N+c)){g[r][c]=-1;continue;}const t=rand();let v;if(t<p1)v=1;else if(t<p1+pN)v=N;else v=1+((rand()*N)|0);g[r][c]=v;}
  return g;
}

function trial(N, shade, iters, p1, pN){
  let unique=0, mult=0, zero=0, nodeAbort=0; const rand=rng(42+N*7+shade*13);
  for(let i=0;i<iters;i++){
    const s=pickShaded(N,shade,rand);
    const g=fillBias(N,s,rand,p1,pN);
    const {rowClue,colClue}=sumsFromGrid(N,s,g);
    const c=countSolutions(N,s,rowClue,colClue,2,300000);
    if(c===1)unique++; else if(c===0)zero++; else if(c===2)mult++; else nodeAbort++;
  }
  console.log(`N=${N} shade=${shade} p1=${p1} pN=${pN}: unique ${unique}/${iters} (${(100*unique/iters).toFixed(1)}%)  multi=${mult} zero=${zero} abort=${nodeAbort}`);
}

for(const N of [5,6,7,8,9]){
  for(const shade of [0, Math.floor(N*N*0.1)|0, Math.floor(N*N*0.2)|0, Math.floor(N*N*0.3)|0]){
    trial(N, shade, 200, 0.25, 0.25);
  }
}
