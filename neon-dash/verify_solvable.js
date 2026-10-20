#!/usr/bin/env node
/* neon-dash solvability gate — CLI over plan-lib.js.
 * Exit 0 only when ALL 30 levels are PROVEN solvable. TIMEOUT / FRAMECAP is
 * "search did not finish" and is reported as FAIL — an unfinished search is not
 * evidence that a level can be finished.
 * Run `node verify_real_replay.js` for the double-validation against the real engine.
 */
const p = require('./plan-lib.js');

console.log('neon-dash solvability (all ' + p.LEVELS.length + ' levels; indeterminate=FAIL):');
console.log('engine consts: ' + JSON.stringify(p.CONSTS));
const res = p.planAll(20000);
let ok = 0, unwinnable = 0, indet = 0;
for (const r of res) {
  const lv = p.LEVELS[r.level - 1];
  if (r.solvable) ok++; else if (r.why === 'NO_PATH') unwinnable++; else indet++;
  console.log(`L${String(r.level).padStart(2)} ${lv.name.padEnd(19).slice(0, 19)} ` +
    (r.solvable ? `SOLVABLE frames=${r.frames} peak=${r.peak} plan=${r.plan.length} ${r.ms}ms`
      : `${r.why} frames=${r.frames} peak=${r.peak}`));
}
console.log(JSON.stringify({
  pass: ok, total: p.LEVELS.length, unwinnableProven: unwinnable, indeterminate: indet,
  verdict: ok === p.LEVELS.length ? 'PASS' : 'FAIL',
  obstacleTypes: [...new Set(p.LEVELS.flatMap(l => (l.obstacles || []).map(o => o.type)))],
}));
process.exit(ok === p.LEVELS.length ? 0 : 1);