'use strict';
const {credit}=require('./staged_search');
// Counterexample-guided coordinate refinement on a fixed finite point grid.
module.exports=async function refinePlan(lv, initial, {sim,battery,log,save,CW,CH,P}){
 let plan=initial,sims=0,rounds=0;
 const cases=[[424242,0],[7,0],[987654,31]], memo=new Map();
 const valid=lines=>lines.every(line=>line.every((q,i)=>q.x>=2&&q.x<=CW-2&&q.y>=2&&q.y<=CH-2&&(!i||P.slopeOK(line[i-1],q))));
 async function evaluate(plans){
  const rows=[];
  for(const candidate of plans){
   const key=JSON.stringify(candidate),old=memo.get(key)||[];
   const extra=await Promise.all(cases.slice(old.length).map(([seed,offset])=>sim(candidate,seed,offset)));
   sims+=extra.length;const rs=old.concat(extra);memo.set(key,rs);
   const scores=rs.map(r=>credit(lv,r));
   const score=Math.min(...scores)*(lv.cups.length*(lv.cups.length+2)+1)+scores.reduce((a,b)=>a+b,0)/scores.length;
   rows.push({plan:candidate,score,rs});
  }
  return rows.sort((a,b)=>b.score-a.score);
 }
 async function check(row){
  if(!row.rs.every(r=>r.ok))return false;
  const result=await battery(row.plan);sims+=result.results.length;
  const failed=result.results.findIndex(r=>!r.ok);
  log('refine battery '+result.results.filter(r=>r.ok).length+'/'+result.results.length+' sims='+sims);
  if(failed<0){save({plan:row.plan,candidates:memo.size,sims,rounds,cases,complete:true});return true;}
  const next=result.cases[failed];if(!cases.some(c=>c[0]===next[0]&&c[1]===next[1])){
   cases.push(next);log('refine counterexample '+next.join('/'));
  }
  return false;
 }
 let current=(await evaluate([plan]))[0];
 // A bounded grid: at most 8 passes, each point 5x5 offsets; each pass is
 // exhausted before stopping for convergence, and every new case is fixed.
 for(rounds=1;rounds<=8;rounds++){
  let improved=false,added=cases.length;
  if(await check(current))return current.plan;
  current=(await evaluate([current.plan]))[0];
  for(let l=0;l<current.plan.lines.length;l++)for(let p=0;p<current.plan.lines[l].length;p++){
   const candidates=[];
   const step=rounds<=3?8:4;
   for(const dx of [-2,-1,0,1,2])for(const dy of [-2,-1,0,1,2]){
    const candidate=JSON.parse(JSON.stringify(current.plan));candidate.lines[l][p].x+=dx*step;candidate.lines[l][p].y+=dy*step;
    if(valid(candidate.lines))candidates.push(candidate);
   }
   // At most eight candidate plans in flight; each plan has its fixed case list.
   let rows=[];for(let k=0;k<candidates.length;k+=8)rows.push(...await evaluate(candidates.slice(k,k+8)));
   rows.sort((a,b)=>b.score-a.score);
   if(rows[0]&&rows[0].score>current.score+1e-10){current=rows[0];improved=true;}
   if(await check(current))return current.plan;
   current=(await evaluate([current.plan]))[0];
   save({plan:current.plan,candidates:memo.size,score:current.score,sims,rounds,cases,complete:false});
  }
  log('refine pass '+rounds+' cases='+cases.length+' score='+current.score+' sims='+sims);
  if(!improved&&cases.length===added)break;
 }
 return null;
};
