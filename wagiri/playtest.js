// Playtest: replays the engine's logic to verify that the recorded solution
// passes the same validation as the in-game checkProgress would.
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/wagiri/index.html', 'utf8');
const m = html.match(/const __LEVELS_DATA_SCRIPT__ = `([^`]+)`/);
if (!m) { console.error('No levels data found'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);

function neighbors(r, c, R, C) {
  const out = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r+dr, nc = c+dc;
    if (0<=nr && nr<R && 0<=nc && nc<C) out.push([nr, nc]);
  }
  return out;
}

function edgeKey(r1, c1, r2, c2) {
  if (r1 > r2 || (r1 === r2 && c1 > c2)) [r1, c2, r2, c1] = [r2, c1, r1, c2];
  return `${r1},${c1},${r2},${c2}`;
}

function playTest(level) {
  const [R, C] = level.size;
  const N = level.circles.length / 2;
  // Build the edge set from the solution
  const edgeSet = new Set();
  for (const e of level.edges) {
    edgeSet.add(edgeKey(...e));
  }
  // Validate: for each pair, check connectivity, no branches, no cycles
  for (let i = 0; i < N; i++) {
    const a = level.circles[i];
    const b = level.circles[i + N];
    // BFS from a
    const visited = new Set();
    const stack = [a];
    visited.add(`${a[0]},${a[1]}`);
    let edgeCount = 0;
    while (stack.length) {
      const [cr, cc] = stack.pop();
      for (const [nr, nc] of neighbors(cr, cc, R, C)) {
        if (edgeSet.has(edgeKey(cr, cc, nr, nc))) {
          edgeCount++;
          if (!visited.has(`${nr},${nc}`)) {
            visited.add(`${nr},${nc}`);
            stack.push([nr, nc]);
          }
        }
      }
    }
    edgeCount = edgeCount / 2;
    if (!visited.has(`${b[0]},${b[1]}`)) return { ok: false, reason: `pair ${i}: not connected` };
    if (visited.size !== edgeCount + 1) return { ok: false, reason: `pair ${i}: cycle detected (cells=${visited.size}, edges=${edgeCount})` };
    // Degree check
    for (const cell of visited) {
      const [cr, cc] = cell.split(',').map(Number);
      let deg = 0;
      for (const [nr, nc] of neighbors(cr, cc, R, C)) {
        if (edgeSet.has(edgeKey(cr, cc, nr, nc))) deg++;
      }
      const isEndpoint = (cr === a[0] && cc === a[1]) || (cr === b[0] && cc === b[1]);
      if (isEndpoint && deg !== 1) return { ok: false, reason: `pair ${i}: endpoint (${cr},${cc}) has degree ${deg}` };
      if (!isEndpoint && deg !== 2) return { ok: false, reason: `pair ${i}: internal cell (${cr},${cc}) has degree ${deg}` };
    }
  }
  return { ok: true };
}

let allPass = true;
for (const L of LEVELS) {
  const result = playTest(L);
  if (result.ok) {
    console.log(`L${L.id} (${L.tier} ${L.size[0]}x${L.size[1]}): playtest PASS ✓`);
  } else {
    console.log(`L${L.id} (${L.tier} ${L.size[0]}x${L.size[1]}): playtest FAIL — ${result.reason} ❌`);
    allPass = false;
  }
}
console.log(`\n${allPass ? 'ALL PLAYTEST PASS' : 'SOME PLAYTEST FAIL'}`);
process.exit(allPass ? 0 : 1);