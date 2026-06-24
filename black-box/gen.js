// Black Box level generator — Tatham-faithful ray simulation (optimized).
// Algorithm from Simon Tatham's blackbox.c (isball + fire_laser_internal).
// Directions clockwise: 0=up,1=right,2=down,3=left. Interior [1..N][1..N], ring = ports.
// atom id = (x-1)*N+(y-1).

const fs = require('fs');
const DXDY = [[0,-1],[1,0],[0,1],[-1,0]];
const FORWARD=1, LEFT=0, RIGHT=2;
const HIT=-1, REFLECT=-2;
const idOf=(x,y,N)=>(x-1)*N+(y-1);

function buildPorts(N){
  const ports=[], cellToPort=new Map();
  for(let x=1;x<=N;x++){ ports.push({x,y:0,dir:2}); }
  for(let y=1;y<=N;y++){ ports.push({x:N+1,y,dir:3}); }
  for(let x=N;x>=1;x--){ ports.push({x,y:N+1,dir:0}); }
  for(let y=N;y>=1;y--){ ports.push({x:0,y,dir:1}); }
  ports.forEach((p,i)=>cellToPort.set(p.x+','+p.y,i));
  return {ports, cellToPort};
}

// occupancy: Uint8Array indexed by ring coord id=(x)*(N+2)+y, x,y in 0..N+1
function makeOcc(N){ return new Uint8Array((N+2)*(N+2)); }
function occSet(occ,x,y,N){ occ[x*(N+2)+y]=1; }
function occAt(occ,x,y,N){ return (x>=1&&x<=N&&y>=1&&y<=N)?occ[x*(N+2)+y]:0; }

function isballO(occ,N,x,y,dir,look){
  let nx=x+DXDY[dir][0], ny=y+DXDY[dir][1];
  if(look===LEFT){ const d=(dir+3)%4; nx+=DXDY[d][0]; ny+=DXDY[d][1]; }
  else if(look===RIGHT){ const d=(dir+1)%4; nx+=DXDY[d][0]; ny+=DXDY[d][1]; }
  return occAt(occ,nx,ny,N);
}
function fireLaserO(occ,N,ports,cellToPort,idx){
  const e=ports[idx];
  let x=e.x, y=e.y, dir=e.dir;
  if(isballO(occ,N,x,y,dir,FORWARD)) return HIT;
  if(isballO(occ,N,x,y,dir,LEFT)||isballO(occ,N,x,y,dir,RIGHT)) return REFLECT;
  x+=DXDY[dir][0]; y+=DXDY[dir][1];
  let guard=0, lim=8*N*N+64;
  while(guard++<lim){
    if(x<1||x>N||y<1||y>N){
      const ex=cellToPort.get(x+','+y);
      return ex===undefined?REFLECT:(ex===idx?REFLECT:ex);
    }
    if(occAt(occ,x,y,N)) return HIT;
    if(isballO(occ,N,x,y,dir,FORWARD)) return HIT;
    if(isballO(occ,N,x,y,dir,LEFT)){ dir=(dir+1)%4; continue; }
    if(isballO(occ,N,x,y,dir,RIGHT)){ dir=(dir+3)%4; continue; }
    x+=DXDY[dir][0]; y+=DXDY[dir][1];
  }
  return REFLECT; // cycle guard
}

function cluesForO(occ,N,ports,cellToPort){
  const out=new Array(ports.length);
  for(let i=0;i<ports.length;i++) out[i]=fireLaserO(occ,N,ports,cellToPort,i);
  return out;
}

// Count solutions matching target, checking ports in `order` with EARLY BAIL.
// Bails as soon as a port outcome mismatches target (huge speedup for non-solutions).
function countSolutionsFast(N,k,target,order,ports,cellToPort){
  const n=N*N, occ=makeOcc(N);
  let count=0;
  const idx=[...Array(k)].map((_,i)=>i);
  const total=n;
  while(true){
    occ.fill(0);
    for(let j=0;j<k;j++){ const id=idx[j]; const x=Math.floor(id/N)+1, y=id%N+1; occSet(occ,x,y,N); }
    let match=true;
    for(let o=0;o<order.length;o++){
      const p=order[o];
      if(fireLaserO(occ,N,ports,cellToPort,p)!==target[p]){ match=false; break; }
    }
    if(match){ count++; if(count>=2) return count; }
    let p=k-1;
    while(p>=0 && idx[p]===total-k+p) p--;
    if(p<0) break;
    idx[p]++;
    for(let q=p+1;q<k;q++) idx[q]=idx[q-1]+1;
  }
  return count;
}

// splitmix32 PRNG
function rngFrom(seed){ let s=seed>>>0||1; return ()=>{ s=(s+0x9E3779B9)>>>0; let z=s; z=(z^(z>>>16))*0x85EBCA6B>>>0; z=(z^(z>>>13))*0xC2B2AE35>>>0; return (z^(z>>>16))>>>0; }; }

function makeLevel(N,k,seed){
  const {ports,cellToPort}=buildPorts(N);
  const rnd=rngFrom(seed);
  for(let attempt=0; attempt<800; attempt++){
    const occ=makeOcc(N);
    const atomIds=[];
    while(atomIds.length<k){
      const id=rnd()% (N*N);
      const x=Math.floor(id/N)+1, y=id%N+1;
      if(!occAt(occ,x,y,N)){ occSet(occ,x,y,N); atomIds.push(id); }
    }
    const target=cluesForO(occ,N,ports,cellToPort);
    if(!target.every(c=>c===HIT||c===REFLECT||(c>=0&&c<ports.length))) continue;
    // check order: HIT ports first (most restrictive), then others
    const order=[...target.keys()].sort((a,b)=>{
      const ra=target[a]===HIT?0:(target[a]===REFLECT?1:2);
      const rb=target[b]===HIT?0:(target[b]===REFLECT?1:2);
      return ra-rb;
    });
    if(countSolutionsFast(N,k,target,order,ports,cellToPort)!==1) continue;
    const atoms=atomIds.map(id=>[Math.floor(id/N)+1, id%N+1]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    return {N,k,atoms,clues:target};
  }
  return null;
}

function main(){
  const tiers=[
    {name:'Beginner',N:6,k:3,count:4},
    {name:'Easy',    N:7,k:3,count:4},
    {name:'Medium',  N:8,k:4,count:5},
    {name:'Hard',    N:8,k:5,count:4},
    {name:'Expert',  N:9,k:4,count:5},
    {name:'Master',  N:10,k:4,count:5},
  ];
  const levels=[]; let seed=20260624; const t0=Date.now();
  for(const t of tiers){
    for(let i=0;i<t.count;i++){
      const ts=Date.now();
      const lvl=makeLevel(t.N,t.k,(++seed*7919+i*104729)>>>0);
      if(!lvl){ console.error('FAILED tier',t.name,i); process.exit(1); }
      levels.push({tier:t.name,idx:levels.length+1,...lvl});
      console.log(`[${t.name}] #${levels.length} ${t.N}x${t.N} k=${t.k}  (${((Date.now()-ts)/1000).toFixed(1)}s)`);
    }
  }
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(levels));
  console.log(`\nGenerated ${levels.length} levels in ${((Date.now()-t0)/1000).toFixed(1)}s`);
}
main();
