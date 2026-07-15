#!/usr/bin/env node
// Shirokuro INDEPENDENT verifier
// Re-implements the validation logic from scratch (does NOT use the engine).

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function checkLevel(lv) {
  // Build adjacency from solution edges
  const adj = {};
  for (const e of lv.solution) {
    const [r1, c1, r2, c2] = e;
    const ka = r1 + ',' + c1;
    const kb = r2 + ',' + c2;
    (adj[ka] = adj[ka] || []).push(kb);
    (adj[kb] = adj[kb] || []).push(ka);
  }
  // circleSet
  const circleSet = new Set();
  const ws = new Set();
  const bs = new Set();
  for (const c of lv.circles) {
    const k = c.r + ',' + c.c;
    circleSet.add(k);
    if (c.type === 'W') ws.add(k);
    else bs.add(k);
  }
  // 1) Every circle must have degree 1
  for (const k of circleSet) {
    if (!adj[k] || adj[k].length !== 1) return `Circle ${k} has deg ${adj[k] ? adj[k].length : 0}, expected 1`;
  }
  // 2) Every non-circle must have degree 0 or 2
  for (const k in adj) {
    if (circleSet.has(k)) continue;
    if (adj[k].length !== 0 && adj[k].length !== 2) return `Non-circle ${k} has deg ${adj[k].length}`;
  }
  // 3) Every W must connect to a B via path
  const reachedBs = new Set();
  for (const w of ws) {
    let cur = w;
    let prev = null;
    let steps = 0;
    while (steps < 2000) {
      const nbrs = adj[cur];
      if (!nbrs || nbrs.length < 1) break;
      let nxt = null;
      if (prev === null) nxt = nbrs[0];
      else nxt = nbrs[0] === prev ? nbrs[1] : nbrs[0];
      if (nxt === null) break;
      if (nxt !== w && circleSet.has(nxt) && !bs.has(nxt)) return `Line from ${w} passes through circle ${nxt}`;
      if (bs.has(nxt) && nxt !== w) { reachedBs.add(nxt); break; }
      prev = cur; cur = nxt; steps++;
    }
  }
  if (reachedBs.size !== bs.size) return `Only ${reachedBs.size}/${bs.size} black circles connected`;
  if (reachedBs.size !== ws.size) return `Mismatch: ${ws.size} whites but ${reachedBs.size} reached`;
  return null;  // PASS
}

let allPass = true;
for (const lv of data) {
  const err = checkLevel(lv);
  if (err) {
    console.log(`L${lv.num} ${lv.tier} ${lv.R}x${lv.C}: FAIL - ${err}`);
    allPass = false;
  } else {
    console.log(`L${lv.num} ${lv.tier} ${lv.R}x${lv.C}: PASS (${lv.solution.length} edges, ${lv.circles.length} circles)`);
  }
}
console.log(`\n${allPass ? '✓ ALL 30 LEVELS PASS' : '✗ SOME LEVELS FAIL'}`);
process.exit(allPass ? 0 : 1);
