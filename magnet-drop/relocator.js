// Goal relocator: for each failing level, find a goal position that many
// trajectories pass through, guaranteeing robust solvability.
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const m=html.match(/const LEVELS=(\[[\s\S]*?\n\];)/);
const TUTORIAL="Tutorial",EASY="Easy",MED="Medium",HARD="Hard",EXP="Expert",MAS="Master";
const LEVELS=eval(m[1]);
const VW=480, VH=720;
const GRAV=0.42, AIR=0.999, REST=0.55, BALL_R=11, SUBSTEPS=6;
const MAXPOWER=22, MK=5200, SOFT=420, GOAL_PAD=16;

const failSet=new Set([4,8,11,12,14,16,18,19,22,26,27,28,29,30]);

function simulateTrail(L,vx,vy){
  let x=L.s.x,y=L.s.y,trail=[],settled=0;
  for(let f=0;f<520;f++){
    for(let s=0;s<SUBSTEPS;s++){
      const h=1/SUBSTEPS;
      for(const mm of (L.m||[])){
        const dx=mm.x-x,dy=mm.y-y,d2=dx*dx+dy*dy+SOFT,d=Math.sqrt(d2);
        const force=Math.min(MK*Math.abs(mm.p)/d2,4.0);const sg=mm.p>0?1:-1;
        vx+=sg*(dx/d)*force*h*60;vy+=sg*(dy/d)*force*h*60;
      }
      vy+=GRAV*h*60;vx*=Math.pow(AIR,h*60);vy*=Math.pow(AIR,h*60);
      x+=vx*h*60;y+=vy*h*60;
    }
    trail.push([x,y]);
    if(y>VH+60||x<-80||x>VW+80)break;
    const sp=Math.hypot(vx,vy);
    if(sp<0.55){settled++;if(settled>22)break;}else settled=0;
  }
  return trail;
}

// collect all trajectory points across the launch grid, then bucket into a grid
// and find cells with the most coverage (away from start, in lower 2/3 of field).
function findBestGoal(L){
  const cell=10;
  const buckets={};
  let count=0;
  for(let ang=0;ang<360;ang+=3){
    for(let pw=0.4;pw<=1.01;pw+=0.05){
      const rad=ang*Math.PI/180;
      const vx=Math.cos(rad)*pw*MAXPOWER,vy=Math.sin(rad)*pw*MAXPOWER;
      const trail=simulateTrail(L,vx,vy);
      const seen=new Set();
      for(const [x,y] of trail){
        if(y<80||y>VH-20)continue;          // keep goal in playfield body
        if(x<30||x>VW-30)continue;
        const cx=Math.floor(x/cell),cy=Math.floor(y/cell);
        const key=cx+','+cy; if(seen.has(key))continue; seen.add(key);
        buckets[key]=(buckets[key]||0)+1; count++;
      }
    }
  }
  // pick the cell (in right-ish area, not too close to start) with max coverage
  let best=null,bestScore=-1;
  for(const k in buckets){
    const [cx,cy]=k.split(',').map(Number);
    const gx=cx*cell+cell/2, gy=cy*cell+cell/2;
    // prefer goals reasonably far from start and to the right/upper for variety
    const distStart=Math.hypot(gx-L.s.x,gy-L.s.y);
    let score=buckets[k];
    if(distStart<120)score*=0.3;            // avoid trivial near-start goals
    if(gx>160)score*=1.2;                   // mild right bias
    if(score>bestScore){bestScore=score;best={gx,gy,cov:buckets[k]};}
  }
  return best;
}

for(let i=0;i<LEVELS.length;i++){
  if(!failSet.has(i+1))continue;
  const L=LEVELS[i];
  const b=findBestGoal(L);
  console.log('L'+(i+1)+' '+L.n.padEnd(18)+' start('+L.s.x+','+L.s.y+')  -> GOAL x:'+Math.round(b.gx)+' y:'+Math.round(b.gy)+' cov:'+b.cov);
}
