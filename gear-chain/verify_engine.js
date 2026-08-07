// Static verifier for gear-chain (sweep 45, 2026-08-08).
// Parses LV array from index.html, re-implements computePropagation(),
// and validates that solutionTeeth produces the target RPM + direction.
// 30/30 PASS confirmed 2026-08-08.
//
// Usage: node gear-chain/verify_engine.js
// Exit 0 = all levels solvable, exit 1 = failures

'use strict';
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = HTML.match(/var LV=(\[[\s\S]*?\]);/);
if (!m) { console.error('cannot find LV array'); process.exit(1); }

// LV is a JS object-literal array; eval it
const LV = eval(m[1]);
console.log(`Loaded ${LV.length} levels`);

function computePropagation(lv, teeth) {
  const names = Object.keys(lv.nodes);
  const pos = Object.fromEntries(names.map(n => [n, lv.nodes[n]]));
  const adj = Object.fromEntries(names.map(n => [n, []]));
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j];
      const ta = teeth[a] || 0, tb = teeth[b] || 0;
      if (ta <= 0 || tb <= 0) continue;
      const dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1];
      const d = Math.sqrt(dx*dx + dy*dy);
      const mesh = 3 * (ta + tb); // PITCH=3
      if (Math.abs(d - mesh) <= 2.0) { adj[a].push(b); adj[b].push(a); } // MESH_TOL=2
    }
  }
  const rpm = {}, cw = {}, visited = {};
  rpm[lv.d] = lv.dr; cw[lv.d] = true; visited[lv.d] = true;
  const q = [lv.d];
  while (q.length) {
    const cur = q.shift();
    for (const nb of adj[cur]) {
      if (visited[nb]) continue;
      visited[nb] = true;
      rpm[nb] = rpm[cur] * (teeth[cur] / teeth[nb]);
      cw[nb] = !cw[cur];
      q.push(nb);
    }
  }
  return { rpm, cw, visited };
}

function fullAssignments(lv) {
  return { ...lv.pre, ...lv.ste, [lv.d]: lv.dt };
}

let pass = 0, fail = 0;
for (let i = 0; i < LV.length; i++) {
  const lv = LV[i];
  const teeth = fullAssignments(lv);
  const { rpm, cw, visited } = computePropagation(lv, teeth);
  const t = lv.t;
  let ok = visited[t] && Math.abs(rpm[t] - lv.trv) <= 0.05 && cw[t] === lv.tcw;
  if (ok && lv.st) {
    for (const [sn, sr, sc] of lv.st) {
      if (!visited[sn] || Math.abs(rpm[sn] - sr) > 0.05 || cw[sn] !== sc) {
        ok = false;
        break;
      }
    }
  }
  if (ok) pass++;
  else { fail++; console.error(`FAIL level id=${lv.id} idx=${i}`); }
}
console.log(`PASS ${pass}/${LV.length}`);
process.exit(fail > 0 ? 1 : 0);