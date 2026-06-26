// Improved Magnet Drop solver: finer grid + closest-approach metric
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const m=html.match(/const LEVELS=(\[[\s\S]*?\n\];)/);
const TUTORIAL="Tutorial",EASY="Easy",MED="Medium",HARD="Hard",EXP="Expert",MAS="Master";
const LEVELS=eval(m[1]);
const VW=480, VH=720;
const GRAV=0.42, AIR=0.999, REST=0.55, BALL_R=11, SUBSTEPS=6;
const MAXPOWER=22, MK=5200, SOFT=420;   // boosted magnet strength
const GOAL_PAD=16;                       // expanded goal capture zone
const tierOrder={Tutorial:0,Easy:1,Medium:2,Hard:3,Expert:4,Master:5};

function goalHit(L,x,y){
  const g=L.g;
  return x>g.x-GOAL_PAD&&x<g.x+g.w+GOAL_PAD&&y>g.y-BALL_R&&y<g.y+g.h+GOAL_PAD;
}

function stepSim(bx,by,vx,vy,L,maxFrames,trackMin){
  let x=bx,y=by,settled=0,minD=1e9;
  for(let f=0;f<maxFrames;f++){
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
    if(goalHit(L,x,y))return {win:true,frames:f};
    const g=L.g,gcx=g.x+g.w/2,gcy=g.y+g.h/2;
    const dd=Math.hypot(x-gcx,y-gcy); if(dd<minD)minD=dd;
    if(y>VH+60||x<-80||x>VW+80)break;
    const sp=Math.hypot(vx,vy);
    if(sp<0.55){settled++;if(settled>22)break;}else settled=0;
  }
  return {win:false,minD:trackMin?minD:0};
}

function trySolve(L){
  const sx=L.s.x, sy=L.s.y;
  let best={solved:false,minD:1e9};
  for(let ang=0;ang<360;ang+=2){
    for(let pw=0.2;pw<=1.01;pw+=0.04){
      const rad=ang*Math.PI/180;
      let vx=Math.cos(rad)*pw*MAXPOWER;
      let vy=Math.sin(rad)*pw*MAXPOWER;
      const r=stepSim(sx,sy,vx,vy,L,520,true);
      if(r.win)return {solved:true,angle:ang,power:pw};
      if(r.minD<best.minD)best={solved:false,minD:r.minD,angle:ang,power:pw};
    }
  }
  return best;
}

let solvedCount=0, unsolvable=[];
let prevTier=-1, tierOk=true;
for(let i=0;i<LEVELS.length;i++){
  const L=LEVELS[i];
  const tv=tierOrder[L.tier];
  if(tv<prevTier)tierOk=false;
  prevTier=tv;
  const res=trySolve(L);
  const idx=String(i+1).padStart(2,' ');
  if(res.solved){solvedCount++;console.log('L'+idx+' '+L.tier.padEnd(9)+' '+L.n.padEnd(20)+' OK');}
  else{unsolvable.push(i+1);console.log('L'+idx+' '+L.tier.padEnd(9)+' '+L.n.padEnd(20)+' MISS minD='+res.minD.toFixed(0)+' (ang='+res.angle+' pw='+res.power.toFixed(2)+')');}
}
console.log('--- Solved: '+solvedCount+'/'+LEVELS.length+' | Tier order: '+(tierOk?'YES':'NO')+' | Unsolvable: '+(unsolvable.length?unsolvable.join(','):'NONE'));
