/* Deterministic, partial-credit search. Each coordinate neighbourhood is exhausted
 * in catalog order, with asynchronous jobs collected in that same order. */
'use strict';
function credit(lv, r) {
  const fractions = r.fills.map((v, i) => Math.min(1, parseFloat(v) / lv.cups[i].need));
  return fractions.filter(v => v >= 1).length * (lv.cups.length + 1)
    + fractions.reduce((a, b) => a + b, 0);
}
async function search({lv, catalogs, combo, sim, log, save, workers, accept, initial=[]}) {
  const start = Date.now(), cache = new Map(), winners = [], testedWinners = new Set();
  let sims = 0, sweeps = 0, restarts = 0;
  const key = tuple => tuple.join(',');
  const planFor = tuple => combo(tuple.map((n, i) => catalogs[i][n]));
  async function evaluate(tuples) {
    const out = [];
    for (let b = 0; b < tuples.length; b += workers) {
      const batch = tuples.slice(b, b + workers);
      const rows = await Promise.all(batch.map(async tuple => {
        const k = key(tuple);
        if (cache.has(k)) return cache.get(k);
        const plan = planFor(tuple);
        const r = plan ? await sim(plan) : {ok:false, fills:lv.cups.map(() => 0)};
        const row = {tuple, plan, r, score:credit(lv, r)};
        cache.set(k, row); sims++; return row;
      }));
      out.push(...rows);
    }
    return out.sort((a,b) => b.score-a.score || key(a.tuple).localeCompare(key(b.tuple)));
  }
  async function check(rows) {
    for (const row of rows.filter(r => r.r.ok).slice(0, 8)) {
      const k = key(row.tuple);
      if (testedWinners.has(k)) continue;
      testedWinners.add(k);
      save({sims,sweeps,restarts,elapsedMs:Date.now()-start, best:row, complete:false});
      const accepted = await accept(row.plan);
      if (accepted) { winners.push({plan:accepted === true ? row.plan : accepted,gen:'coordinate:'+k,preferred:true}); return true; }
    }
    return false;
  }
  // Empty entries let each route earn partial credit before interacting with others.
  const empty = catalogs.map(c => c.length - 1);
  const singles = await evaluate(catalogs.flatMap((c,ci) => c.map((_,n) => empty.map((e,i) => i===ci?n:e))));
  const bestFor = catalogs.map((c,ci) => singles.filter(r => r.tuple.every((n,i) => i===ci || n===empty[i]))
    .sort((a,b) => {
      const f = r => Math.min(1,parseFloat(r.r.fills[ci])/lv.cups[ci].need);
      return f(b)-f(a) || b.score-a.score;
    }).slice(0,8));
  log('isolated routes: '+bestFor.map((rs,ci) => rs[0].r.fills[ci]).join(',')+' sims='+sims);
  const seeds = [...initial, bestFor.map((rs,ci) => rs[0].tuple[ci])];
  for (let r=1; r<8; r++) seeds.push(bestFor.map((rs,ci) => rs[(r*(ci*2+1))%rs.length].tuple[ci]));
  let globalBest = singles[0];
  // Finite space: 8 deterministic restarts; strict ascent over finite catalog
  // tuples. On convergence every one-coordinate alternative has been evaluated.
  for (const seed of seeds) {
    restarts++;
    let current = (await evaluate([seed]))[0];
    for (;;) {
      let improved = false;
      // Most constrained cup first (catalog size), with stable cup-index ties.
      const order = catalogs.map((_,i) => i).sort((a,b) => catalogs[a].length-catalogs[b].length || a-b);
      for (const ci of order) {
        const rows = await evaluate(catalogs[ci].map((_,n) => current.tuple.map((v,i) => i===ci?n:v)));
        sweeps++;
        if (rows[0].score > current.score) { current=rows[0]; improved=true; }
        if (current.score > globalBest.score) globalBest=current;
        log('coordinate restart='+restarts+' cup='+ci+' sims='+sims+' score='+current.score.toFixed(4)+' fills='+current.r.fills.join(',')+' tuple='+key(current.tuple));
        save({sims,sweeps,restarts,elapsedMs:Date.now()-start,best:globalBest,complete:false});
        if (await check(rows)) return {winners,sims,sweeps,restarts,elapsedMs:Date.now()-start,complete:false};
      }
      if (!improved) break;
    }
  }
  const result = {winners,sims,sweeps,restarts,elapsedMs:Date.now()-start,complete:true,best:globalBest};
  save({...result,winners:winners.length});
  return result;
}
module.exports={search,credit};
