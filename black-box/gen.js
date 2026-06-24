// Black Box level generator — Tatham-faithful ray simulation.
// Algorithm copied EXACTLY from Simon Tatham's blackbox.c (isball + fire_laser_internal),
// fetched from the official puzzles repo (git.tartarus.org/simon/puzzles.git).
// Directions clockwise: 0=up,1=right,2=down,3=left.
// Grid: N x N interior at [1..N][1..N]; 1-cell ring = laser ports.
// atom id encoding: id = (x-1)*N + (y-1)  (x,y in 1..N  ->  id in 0..N*N-1).

const fs = require('fs');

const DXDY = [[0,-1],[1,0],[0,1],[-1,0]]; // up,right,down,left
const FORWARD=1, LEFT=0, RIGHT=2;         // Tatham LOOK_* order (LEFT, FORWARD, RIGHT)
const HIT=-1, REFLECT=-2;

const idOf=(x,y,N)=>(x-1)*N+(y-1);
const xyOf=(id,N)=>[Math.floor(id/N)+1, id%N+1];

function buildPorts(N){
  const ports=[];
  for(let x=1;x<=N;x++) ports.push({x,y:0,dir:2});   // top -> down
  for(let y=1;y<=N;y++) ports.push({x:N+1,y,dir:3}); // right -> left
  for(let x=N;x>=1;x--) ports.push({x,y:N+1,dir:0}); // bottom -> up
  for(let y=N;y>=1;y--) ports.push({x:0,y,dir:1});   // left -> right
  const cellToPort=new Map();
  ports.forEach((p,i)=>cellToPort.set(p.x+','+p.y,i));
  return {ports, cellToPort};
}

// is there an atom in FORWARD / forward-left / forward-right cell relative to (x,y,dir)?
function isball(atoms, N, x, y, dir, look){
  let nx=x+DXDY[dir][0], ny=y+DXDY[dir][1];
  if(look===LEFT){ const d=(dir+3)%4; nx+=DXDY[d][0]; ny+=DXDY[d][1]; }
  else if(look===RIGHT){ const d=(dir+1)%4; nx+=DXDY[d][0]; ny+=DXDY[d][1]; }
  if(nx<1||nx>N||ny<1||ny>N) return false;
  return atoms.has(idOf(nx,ny,N));
}

// Fire laser from port idx -> HIT(-1), REFLECT(-2), or exit port idx.
function fireLaser(atoms, N, ports, cellToPort, idx){
  const e=ports[idx];
  let x=e.x, y=e.y, dir=e.dir;
  if(isball(atoms,N,x,y,dir,FORWARD)) return HIT;
  if(isball(atoms,N,x,y,dir,LEFT)||isball(atoms,N,x,y,dir,RIGHT)) return REFLECT;
  x+=DXDY[dir][0]; y+=DXDY[dir][1];
  const seen=new Set();
  while(true){
    if(x<1||x>N||y<1||y>N){
      const ex=cellToPort.get(x+','+y);
      return ex===undefined?REFLECT:(ex===idx?REFLECT:ex);
    }
    const key=x+','+y+','+dir;
    if(seen.has(key)) return REFLECT;          // cycle guard
    seen.add(key);
    if(atoms.has(idOf(x,y,N))) return HIT;     // safety (shouldn't trigger)
    if(isball(atoms,N,x,y,dir,FORWARD)) return HIT;
    if(isball(atoms,N,x,y,dir,LEFT)){ dir=(dir+1)%4; continue; }   // CW
    if(isball(atoms,N,x,y,dir,RIGHT)){ dir=(dir+3)%4; continue; }  // CCW
    x+=DXDY[dir][0]; y+=DXDY[dir][1];
  }
}

function cluesFor(atoms, N, ports, cellToPort){
  const out=new Array(ports.length);
  for(let i=0;i<ports.length;i++) out[i]=fireLaser(atoms,N,ports,cellToPort,i);
  return out;
}
const sigStr=cl=>cl.join(',');

// Count k-subsets whose clue signature == target; bail at 2 (non-unique).
function countSolutions(N, k, target, ports, cellToPort){
  const n=N*N, cells=[...Array(n).keys()];
  let count=0;
  const idx=[...Array(k)].map((_,i)=>i);
  const tgt=sigStr(target);
  while(true){
    const atoms=new Set(idx);
    if(sigStr(cluesFor(atoms,N,ports,cellToPort))===tgt){ count++; if(count>=2) return count; }
    let p=k-1;
    while(p>=0 && idx[p]===n-k+p) p--;
    if(p<0) break;
    idx[p]++;
    for(let q=p+1;q<k;q++) idx[q]=idx[q-1]+1;
  }
  return count;
}

function rngFrom(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

function makeLevel(N, k, seed){
  const {ports,cellToPort}=buildPorts(N);
  const rnd=rngFrom(seed);
  for(let attempt=0; attempt<600; attempt++){
    const atoms=new Set();
    while(atoms.size<k){
      const x=1+Math.floor(rnd()*N), y=1+Math.floor(rnd()*N);
      atoms.add(idOf(x,y,N));
    }
    const clues=cluesFor(atoms,N,ports,cellToPort);
    if(!clues.every(c=>c===HIT||c===REFLECT||(c>=0&&c<ports.length))) continue;
    if(countSolutions(N,k,clues,ports,cellToPort)!==1) continue;
    const atomList=[...atoms].map(id=>xyOf(id,N)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    return {N,k,atoms:atomList,clues};
  }
  return null;
}

function main(){
  const tiers=[
    {name:'Beginner', N:6,k:3,count:4},
    {name:'Easy',     N:7,k:3,count:4},
    {name:'Medium',   N:8,k:4,count:5},
    {name:'Hard',     N:8,k:5,count:4},
    {name:'Expert',   N:9,k:4,count:5},
    {name:'Master',   N:9,k:5,count:5},
  ];
  const levels=[]; let seed=20260624;
  for(const t of tiers){
    for(let i=0;i<t.count;i++){
      const lvl=makeLevel(t.N,t.k,(++seed*7919+i)>>>0);
      if(!lvl){ console.error('FAILED tier',t.name,i); process.exit(1); }
      levels.push({tier:t.name, idx:levels.length+1, ...lvl});
      console.log(`[${t.name}] #${levels.length} ${t.N}x${t.N} k=${t.k} unique OK`);
    }
  }
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(levels,null,1));
  console.log(`\nGenerated ${levels.length} levels -> ${__dirname}/levels.json`);
}
main();
