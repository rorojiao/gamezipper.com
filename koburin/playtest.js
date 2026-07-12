// Playtest: reconstruct the player's edge-set from the solution loop and verify
// the game's checkWin would accept it. This simulates a perfect playthrough.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
const LEVELS = JSON.parse(levelsMatch[1]);

let pass = 0, fail = 0;
for (const lvl of LEVELS) {
  // The solution_loop is a cycle. Build the edge set a player would draw.
  const loop = lvl.solution_loop;
  const blackSet = new Set(lvl.blacks.map(b => b.join(',')));
  const drawnEdges = new Set();
  function ek(r1, c1, r2, c2) {
    if (r1 > r2 || (r1 === r2 && c1 > c2)) { [r1, r2] = [r2, r1]; [c1, c2] = [c2, c1]; }
    return `${r1},${c1},${r2},${c2}`;
  }
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    drawnEdges.add(ek(a[0], a[1], b[0], b[1]));
  }
  // Simulate: player has blacked exactly the solution blacks and drawn exactly the loop edges.
  // checkWin should return true.
  // We reuse the same logic as verify_engine.
  const R = lvl.R, C = lvl.C;
  function neighbors4(r, c) {
    const out = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C) out.push([nr, nc]);
    }
    return out;
  }
  let ok = true, reason = '';
  // clues
  for (const k in lvl.clues) {
    const [r, c] = k.split(',').map(Number);
    let cnt = 0;
    for (const [nr, nc] of neighbors4(r, c)) if (blackSet.has(`${nr},${nc}`)) cnt++;
    if (cnt !== lvl.clues[k]) { ok = false; reason = `clue ${k}`; break; }
  }
  // adj blacks
  if (ok) for (const bk of blackSet) {
    const [r, c] = bk.split(',').map(Number);
    for (const [nr, nc] of neighbors4(r, c)) {
      if (blackSet.has(`${nr},${nc}`)) { ok = false; reason = `adj blacks`; break; }
    }
    if (!ok) break;
  }
  // loop cycle
  if (ok) {
    const whiteCells = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (!blackSet.has(`${r},${c}`)) whiteCells.push(`${r},${c}`);
    }
    const adj = {}; whiteCells.forEach(k => adj[k] = []);
    drawnEdges.forEach(e => {
      const [r1, c1, r2, c2] = e.split(',').map(Number);
      const k1 = `${r1},${c1}`, k2 = `${r2},${c2}`;
      if (k1 in adj && k2 in adj) { adj[k1].push(k2); adj[k2].push(k1); }
    });
    for (const k of whiteCells) if (adj[k].length !== 2) { ok = false; reason = `deg ${k}=${adj[k].length}`; break; }
    if (ok) {
      const start = whiteCells[0];
      const visited = new Set([start]);
      let cur = start, prev = null;
      for (let s = 0; s < whiteCells.length + 1; s++) {
        const nbrs = adj[cur].filter(n => n !== prev);
        if (nbrs.length === 0) break;
        const nxt = nbrs[0];
        if (nxt === start) break;
        if (visited.has(nxt)) break;
        visited.add(nxt); prev = cur; cur = nxt;
      }
      if (visited.size !== whiteCells.length) { ok = false; reason = `cycle ${visited.size}/${whiteCells.length}`; }
    }
  }
  if (ok) pass++; else { fail++; console.log(`L${lvl.id} playtest FAIL: ${reason}`); }
}
console.log(`Playtest: ${pass}/${LEVELS.length} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
