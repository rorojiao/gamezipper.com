#!/usr/bin/env node
// Exhaustive two-coordinate neighbourhoods, followed by finite local geometry grids.
const fs=require('fs');
const {LV,CW,CH,P,cupCatalog,comboPlan,PhysicsPool,SEEDS,REC_OFFSETS}=require('./solver_strong');
const {credit}=require('./staged_search');
(async()=>{
 const start=Date.now(),lv=LV[29],pool=new PhysicsPool(); await Promise.all(pool.slots.map(s=>s.ready));
 let sims=0;
 let best=JSON.parse(fs.readFileSync('solver_logs/coordinate-30.json')).best;
 const catalogs=lv.cups.map((_,ci)=>cupCatalog(lv,ci,Infinity));
 catalogs.forEach(c=>c.push({parts:[],kind:'empty'}));
 if(!process.env.SS_REFINE_GEOMETRY) fs.writeFileSync('evidence-l30/catalogs.json',JSON.stringify(catalogs));
 const record=()=>fs.writeFileSync('evidence-l30/refine-progress.json',JSON.stringify({sims,elapsedMs:Date.now()-start,best},null,1));
 const winners=new Set();
 async function evaluate(plans){
  let rows=[];
  for(let i=0;i<plans.length;i+=8){
   const batch=plans.slice(i,i+8), rs=await Promise.all(batch.map(c=>pool.sim(lv,c.plan,424242,0,1,1500))); sims+=rs.length;
   for(let j=0;j<batch.length;j++){
    const row={...batch[j],r:rs[j],score:credit(lv,rs[j])}; rows.push(row);
    if(row.score>best.score){best=row;record();console.error('best',sims,best.score,best.r.fills);}
    if(row.r.ok){
     const k=JSON.stringify(row.plan);if(winners.has(k))continue;winners.add(k);
     const tests=await Promise.all(SEEDS.flatMap(seed=>REC_OFFSETS.map(off=>pool.sim(lv,row.plan,seed,off,1,4200))));sims+=tests.length;
     const pass=tests.filter(r=>r.ok).length;console.error('battery',pass,tests.length,'sims',sims);
     if(pass===tests.length){fs.writeFileSync('evidence-l30/candidate.json',JSON.stringify({'30':[row.plan]},null,1));record();return true;}
    }
   }
  }
  record();return false;
 }
 // Every member of each of the three smallest pair neighbourhoods is evaluated.
 for(const [a,b] of (process.env.SS_REFINE_GEOMETRY ? [] : [[1,2],[0,2],[2,3],[0,1]])){
  const origin=best.tuple || JSON.parse(fs.readFileSync('solver_logs/coordinate-30.json')).best.tuple;
  const plans=[];for(let i=0;i<catalogs[a].length;i++)for(let j=0;j<catalogs[b].length;j++){
   const tuple=origin.slice();tuple[a]=i;tuple[b]=j;
   const plan=comboPlan(lv,tuple.map((n,ci)=>catalogs[ci][n]),0);if(plan)plans.push({plan,tuple});
  }
  console.error('pair',a,b,'size',plans.length);if(await evaluate(plans)){await pool.close();return;}
 }
 // Downhill endpoint/waypoint variants of the strongest assembled plan. Each
 // complete coordinate grid is evaluated before taking a strict improvement.
 for(let round=0;round<4;round++){
  const before=best.score;
  for(let l=0;l<best.plan.lines.length;l++)for(let p=0;p<best.plan.lines[l].length;p++){
   const base=best.plan,plans=[];
   for(const dx of [-24,-16,-8,0,8,16,24])for(const dy of [-16,-8,0,8,16]){
    const plan=JSON.parse(JSON.stringify(base));plan.lines[l][p].x+=dx;plan.lines[l][p].y+=dy;
    if(!plan.lines.every(line=>line.every((q,i)=>q.x>=2&&q.x<=CW-2&&q.y>=2&&q.y<=CH-2&&(!i||P.slopeOK(line[i-1],q)))))continue;
    plans.push({plan});
   }
   if(await evaluate(plans)){await pool.close();return;}
  }
  if(best.score<=before)break;
 }
 console.error('finite refinement exhausted',sims,Date.now()-start);await pool.close();
})().catch(e=>{console.error(e);process.exit(1)});
