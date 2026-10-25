const assert=require('assert');
const {search,credit}=require('../staged_search');
(async()=>{
 const lv={cups:[{need:12},{need:15},{need:12},{need:10}]};
 assert.equal(credit(lv,{fills:['12/12','0/15','0/12','0/10']}),6);
 assert(credit(lv,{fills:[12,0,0,0]})>credit(lv,{fills:['11/12','14/15','11/12','9/10']}));
 const catalogs=lv.cups.map(()=>[{fill:true},{fill:false}]);let accepted=0;
 const result=await search({lv,catalogs,workers:8,combo:sel=>sel,
  sim:async sel=>({ok:sel.every(e=>e.fill),fills:sel.map((e,i)=>e.fill?lv.cups[i].need:0)}),
  log:()=>{},save:()=>{},accept:async()=>{accepted++;return true;}});
 assert.equal(result.winners.length,1);assert.equal(accepted,1);
 const exhausted=await search({lv,catalogs,workers:8,combo:sel=>sel,sim:async()=>({ok:false,fills:[0,0,0,0]}),log:()=>{},save:()=>{},accept:async()=>false});
 assert(exhausted.complete);assert.equal(exhausted.restarts,8);assert.equal(exhausted.sweeps,32);
 console.log('PASS: fractional scoring, satisfied-cup priority, finite coordinate search finds joint solution');
})().catch(e=>{console.error(e);process.exitCode=1});
