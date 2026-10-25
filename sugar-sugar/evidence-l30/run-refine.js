const fs=require('fs');
const {LV,CW,CH,P,PhysicsPool,SEEDS,REC_OFFSETS}=require('../solver_strong');
const refine=require('../refine_plan');
(async()=>{
 const start=Date.now(),pool=new PhysicsPool();await Promise.all(pool.slots.map(s=>s.ready));
 const lv=LV[29],initial=JSON.parse(fs.readFileSync('evidence-l30/refine-progress.json')).best.plan;
 try{
 const plan=await refine(lv,initial,{CW,CH,P,log:console.error,
  sim:(plan,seed,offset)=>pool.sim(lv,plan,seed,offset,1,1500),
  battery:async plan=>{const cases=SEEDS.flatMap(seed=>REC_OFFSETS.map(off=>[seed,off]));return {cases,results:await Promise.all(cases.map(([s,o])=>pool.sim(lv,plan,s,o,1,4200)))}},
  save:row=>fs.writeFileSync('evidence-l30/robust-progress.json',JSON.stringify({...row,elapsedMs:Date.now()-start},null,1))});
 if(plan)fs.writeFileSync('evidence-l30/candidate.json',JSON.stringify({'30':[plan]},null,1));
 console.error('robust refinement done',!!plan,Date.now()-start);
 }finally{await pool.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
