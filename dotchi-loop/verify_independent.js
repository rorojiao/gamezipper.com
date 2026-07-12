// Independent Node.js verifier for Dotchi-Loop levels.
// Re-implements cycle + white-circle + region-consistency checks.
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function verify(lv) {
  const { R, C, regions, white, solution } = lv;
  // solution edges -> adjacency
  const adj = {};
  for (const e of solution) {
    const a = e[0] + ',' + e[1], b = e[2] + ',' + e[3];
    (adj[a] = adj[a] || []).push(b);
    (adj[b] = adj[b] || []).push(a);
  }
  // every cell degree must be 2 (Hamiltonian cycle)
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const k = r + ',' + c;
    if (!adj[k] || adj[k].length !== 2) return { ok: false, msg: `cell ${k} degree != 2 (got ${adj[k]?adj[k].length:0})` };
  }
  // trace single loop (bidirectional follow)
  const start = '0,0';
  const path = [start];
  // pick first neighbor as "next"
  let prev = start;
  let cur = adj[start][0];
  let steps = 0;
  while (steps < R * C + 5) {
    path.push(cur);
    // next = the neighbor that isn't prev
    const nbrs = adj[cur];
    const nxt = nbrs[0] === prev ? nbrs[1] : nbrs[0];
    prev = cur;
    cur = nxt;
    steps++;
    if (cur === start) break;
  }
  if (cur !== start) return { ok: false, msg: 'loop does not close' };
  if (path.length !== R * C) return { ok: false, msg: `loop covers ${path.length} cells, expected ${R*C}` };
  // all white circles on path
  const pathSet = new Set(path);
  for (const wc of white) {
    if (!pathSet.has(wc[0] + ',' + wc[1])) return { ok: false, msg: `white circle ${wc} not on loop` };
  }
  // region consistency
  const pos = {}; path.forEach((k, i) => pos[k] = i);
  const plen = path.length;
  const dirs = {};
  for (let i = 0; i < plen; i++) {
    const c = path[i], p = path[(i - 1 + plen) % plen], n = path[(i + 1) % plen];
    const [cr, cc] = c.split(',').map(Number), [pr, pc] = p.split(',').map(Number), [nr, nc] = n.split(',').map(Number);
    const inD = [pr - cr, pc - cc], outD = [nr - cr, nc - cc];
    dirs[c] = (inD[0] === -outD[0] && inD[1] === -outD[1]) ? 'straight' : 'turn';
  }
  const regBeh = {};
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const rid = regions[r][c], k = r + ',' + c;
    if (white.some(w => w[0] === r && w[1] === c)) {
      const beh = dirs[k];
      if (rid in regBeh && regBeh[rid] !== beh) return { ok: false, msg: `region ${rid} mixed ${regBeh[rid]}/${beh}` };
      regBeh[rid] = beh;
    }
  }
  return { ok: true };
}

let pass = 0, fail = 0;
for (const lv of levels) {
  const res = verify(lv);
  if (res.ok) { pass++; }
  else { fail++; console.log(`L${lv.num} FAIL: ${res.msg}`); }
}
console.log(`\nIndependent verifier: ${pass}/${levels.length} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
