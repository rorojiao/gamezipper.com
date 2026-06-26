// Magnet Drop level generator v2 — goal-anchored attractor guarantees
// "magnet sucks ball in" mechanic + solver-verified solvability + progression.
const VW=480, VH=720;
const GRAV=0.42, AIR=0.999, REST=0.55, BALL_R=11, SUBSTEPS=6;
const MAXPOWER=22, MK=5200, SOFT=420, GOAL_PAD=16;
const tierDefs=[
  {name:"Tutorial",balls:3,nm:1,extra:0,gw:88,goalY:[470,640],hardBias:0},
  {name:"Easy",balls:3,nm:1,extra:0,gw:80,goalY:[400,620],hardBias:0},
  {name:"Medium",balls:4,nm:2,extra:1,gw:74,goalY:[340,580],hardBias:0.3},
  {name:"Hard",balls:4,nm:3,extra:1,gw:70,goalY:[280,540],hardBias:0.5},
  {name:"Expert",balls:5,nm:4,extra:2,gw:66,goalY:[220,500],hardBias:0.6},
  {name:"Master",balls:5,nm:5,extra:2,gw:60,goalY:[180,460],hardBias:0.7}
];
const names=["First Launch","Pull In","Bend Right","Push Away","Funnel","Twin Pull","Over the Wall","Repel Curve","Slot In","Bank Shot","Magnetic Gap","Weave","Lift Up","Deflector Field","Long Carry","Tight Squeeze","Power Pull","Repel Maze","Twin Field","Arc Master","Polarity Switch","Ceiling Run","Pinball","Magnetic Loop","Precision Drop","The Gauntlet","Chaos Field","Magnetic Climb","Master Shot","Grand Magnet"];
function rng(seed){let s=seed;return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};}
let R=Math.random;
function simulate(bx,by,vx,vy,L){
  let x=bx,y=by,settled=0;
  for(let f=0;f<560;f++){
    for(let s=0;s<SUBSTEPS;s++){
      const h=1/SUBSTEPS;
      for(const mm of L.m){
        const dx=mm.x-x,dy=mm.y-y,d2=dx*dx+dy*dy+SOFT,d=Math.sqrt(d2);
        const force=Math.min(MK*Math.abs(mm.p)/d2,4.0);const sg=mm.p>0?1:-1;
        vx+=sg*(dx/d)*force*h*60;vy+=sg*(dy/d)*force*h*60;
      }
      vy+=GRAV*h*60;vx*=Math.pow(AIR,h*60);vy*=Math.pow(AIR,h*60);
      x+=vx*h*60;y+=vy*h*60;
    }
    if(x>L.g.x-GOAL_PAD&&x<L.g.x+L.g.w+GOAL_PAD&&y>L.g.y-BALL_R&&y<L.g.y+L.g.h+GOAL_PAD)return true;
    if(y>VH+60||x<-80||x>VW+80)return false;
    const sp=Math.hypot(vx,vy);
    if(sp<0.55){settled++;if(settled>22)return false;}else settled=0;
  }
  return false;
}
function solvable(L){
  for(let ang=0;ang<360;ang+=3){
    for(let pw=0.35;pw<=1.01;pw+=0.05){
      const rad=ang*Math.PI/180;
      if(simulate(L.s.x,L.s.y,Math.cos(rad)*pw*MAXPOWER,Math.sin(rad)*pw*MAXPOWER,L))return true;
    }
  }
  return false;
}
function far(pt,x,y,d){return Math.hypot(pt.x-x,pt.y-y)>=d;}
function genLevel(td,idx,seedBase){
  for(let attempt=0;attempt<600;attempt++){
    R=rng(seedBase+attempt*101+idx*7);
    const sx=Math.round(60+R()*40), sy=Math.round(610+R()*50);
    const gw=td.gw;
    const gx=Math.round(300+R()*140-gw/2+ (R()<td.hardBias? -60:0)); // bias left at high tiers
    const gxClamped=Math.max(110,Math.min(440-gw,gx));
    const gy=Math.round(td.goalY[0]+R()*(td.goalY[1]-td.goalY[0]));
    const gh=Math.round(70+R()*40);
    const g={x:gxClamped,y:gy,w:gw,h:gh};
    const mags=[],walls=[];
    // PRIMARY: attractor anchored in the goal opening — "magnet sucks ball in"
    if(td.nm>=1){
      mags.push({x:Math.round(gxClamped+gw/2),y:Math.round(gy+18),r:22,p:Math.round((0.9+R()*0.5)*100)/100});
    }
    // SECONDARY magnets: attract/repel placed in mid-field, away from start & goal path
    for(let k=0;k<td.nm-1;k++){
      for(let t=0;t<40;t++){
        const mx=Math.round(150+R()*240),my=Math.round(160+R()*420);
        if(Math.hypot(mx-sx,my-sy)<90)continue;
        if(Math.hypot(mx-(gxClamped+gw/2),my-(gy+gh/2))<70)continue;
        let bad=false;for(const m of mags){if(Math.hypot(mx-m.x,my-m.y)<70){bad=true;break;}}if(bad)continue;
        const p=(R()<0.6?1:-1)*(0.7+R()*0.7);
        mags.push({x:mx,y:my,r:Math.round(20+R()*9),p:Math.round(p*100)/100});break;
      }
    }
    // optional decorative side walls
    for(let k=0;k<td.extra;k++){
      for(let t=0;t<25;t++){
        const wx=Math.round(120+R()*260),wy=Math.round(220+R()*360),ww=Math.round(60+R()*70),wh=14;
        if(Math.hypot(wx-sx,wy-sy)<100)continue;
        let bad=false;for(const m of mags){if(Math.hypot(wx-m.x,wy-m.y)<46){bad=true;break;}}
        for(const w of walls){if(Math.abs(wx-w.x)<80&&Math.abs(wy-w.y)<30){bad=true;break;}}if(bad)continue;
        walls.push({x:wx,y:wy,w:ww,h:wh});break;
      }
    }
    walls.push({x:0,y:670,w:480,h:50});
    const L={s:{x:sx,y:sy},g,m:mags,w:walls};
    if(solvable(L))return {n:names[idx],tier:td.name,balls:td.balls,s:L.s,g,m:mags,w:walls};
  }
  // hard fallback: pure direct arc, no magnets
  const g={x:360,y:480,w:88,h:80};
  return {n:names[idx],tier:td.name,balls:td.balls,s:{x:70,y:630},g,m:[],w:[{x:0,y:670,w:480,h:50}]};
}
const out=[];let li=0;
for(const td of tierDefs){for(let i=0;i<5;i++){out.push(genLevel(td,li,li*17+3));li++;}}
// verify ALL solvable one more time
let bad=0;out.forEach((L,i)=>{if(!solvable(L)){console.error('L'+(i+1)+' UNSOLVABLE post-gen');bad++;}});
let s='';out.forEach((L,i)=>{
  const ms=L.m.map(m=>'{x:'+m.x+',y:'+m.y+',r:'+m.r+',p:'+m.p+'}').join(',');
  const ws=L.w.map(w=>'{x:'+w.x+',y:'+w.y+',w:'+w.w+',h:'+w.h+'}').join(',');
  s+='{n:"'+L.n+'",tier:"'+L.tier+'",balls:'+L.balls+',s:{x:'+L.s.x+',y:'+L.s.y+'},g:{x:'+L.g.x+',y:'+L.g.y+',w:'+L.g.w+',h:'+L.g.h+'},\n m:['+ms+'],w:['+ws+']},\n';
});
console.log(s);
console.error('Generated '+out.length+' levels, '+bad+' unsolvable');
