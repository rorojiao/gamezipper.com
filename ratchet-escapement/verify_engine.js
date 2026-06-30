// In-engine BFS verification using EXACT game rules from index.html
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const m = html.match(/var LEVELS=(\[[\s\S]*?\]);/);
const LEVELS = eval(m[1]);

function bfsEngine(lvl) {
  const nT = lvl.t;
  const pawls = lvl.p;
  const nPawls = pawls.length;
  const posToIdx = {};
  for (let i = 0; i < nPawls; i++) posToIdx[pawls[i]] = i;

  const initMask = (1 << nPawls) - 1;
  const start = `0,${initMask}`;
  const dist = new Map(); dist.set(start, 0);
  const paths = new Map(); paths.set(start, 1);
  const queue = [start];
  let foundDist = null;
  const goal = lvl.g;

  while (queue.length > 0) {
    const state = queue.shift();
    const d = dist.get(state);
    if (foundDist !== null && d >= foundDist) continue;
    const parts = state.split(',');
    const pos = +parts[0], mask = +parts[1];

    const npos1 = (pos + 1) % nT;
    const ns1 = npos1 + ',' + mask;
    if (!dist.has(ns1)) { dist.set(ns1, d+1); paths.set(ns1, paths.get(state)); if (npos1===goal) foundDist = foundDist===null?d+1:Math.min(foundDist,d+1); else queue.push(ns1); }
    else if (dist.get(ns1)===d+1) paths.set(ns1, paths.get(ns1)+paths.get(state));

    const pi = posToIdx[pos];
    let blocked = false;
    if (pi !== undefined && (mask & (1 << pi))) blocked = true;
    if (!blocked) {
      const npos2 = (pos - 1 + nT) % nT;
      const ns2 = npos2 + ',' + mask;
      if (!dist.has(ns2)) { dist.set(ns2, d+1); paths.set(ns2, paths.get(state)); if (npos2===goal) foundDist = foundDist===null?d+1:Math.min(foundDist,d+1); else queue.push(ns2); }
      else if (dist.get(ns2)===d+1) paths.set(ns2, paths.get(ns2)+paths.get(state));
    }

    if (pi !== undefined) {
      const nmask = mask ^ (1 << pi);
      const ns3 = pos + ',' + nmask;
      if (!dist.has(ns3)) { dist.set(ns3, d+1); paths.set(ns3, paths.get(state)); queue.push(ns3); }
      else if (dist.get(ns3)===d+1) paths.set(ns3, paths.get(ns3)+paths.get(state));
    }
  }
  if (foundDist === null) return { par: null, nPaths: 0 };
  let total = 0;
  for (const [s, d] of dist) if (d === foundDist && +s.split(',')[0] === goal) total += paths.get(s);
  return { par: foundDist, nPaths: total };
}

let allOk = true;
for (const lvl of LEVELS) {
  const r = bfsEngine(lvl);
  const ok = r.par === lvl.par && r.nPaths === 1;
  if (!ok) allOk = false;
  console.log('L' + String(lvl.id).padStart(2) + ' expected par=' + lvl.par + ' got par=' + r.par + ' nPaths=' + r.nPaths + (ok?' OK':' FAIL'));
}
console.log('\nIn-engine BFS: ALL 30 UNIQUE+VALID: ' + allOk);
process.exit(allOk ? 0 : 1);
