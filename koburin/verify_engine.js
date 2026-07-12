// In-engine verifier — extracts LEVELS from index.html and verifies each
// solution using the SAME rule interpretation as the game (loop passes through
// ALL non-black cells including clue cells).
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (!levelsMatch) { console.error('Could not extract LEVELS'); process.exit(1); }
const LEVELS = JSON.parse(levelsMatch[1]);

function neighbors4(r, c, R, C) {
  const out = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < R && nc >= 0 && nc < C) out.push([nr, nc]);
  }
  return out;
}
function edgeKey(r1, c1, r2, c2) {
  if (r1 > r2 || (r1 === r2 && c1 > c2)) { [r1, r2] = [r2, r1]; [c1, c2] = [c2, c1]; }
  return `${r1},${c1},${r2},${c2}`;
}
function buildEdgesFromLoop(loopArr) {
  const edges = new Set();
  for (let i = 0; i < loopArr.length; i++) {
    const a = loopArr[i], b = loopArr[(i + 1) % loopArr.length];
    edges.add(edgeKey(a[0], a[1], b[0], b[1]));
  }
  return edges;
}

// This mirrors the game's checkWin logic EXACTLY (same rule interpretation).
function checkSolution(data) {
  const R = data.R, C = data.C;
  const blacks = new Set(data.blacks.map(b => b.join(',')));
  const clues = data.clues;
  const loopEdges = buildEdgesFromLoop(data.solution_loop);

  // 1. all clues satisfied
  for (const k in clues) {
    const [r, c] = k.split(',').map(Number);
    let cnt = 0;
    for (const [nr, nc] of neighbors4(r, c, R, C)) if (blacks.has(`${nr},${nc}`)) cnt++;
    if (cnt !== clues[k]) return { ok: false, reason: `clue ${k}=${clues[k]} actual ${cnt}` };
  }
  // 2. no two blacks orth-adjacent
  for (const bk of blacks) {
    const [r, c] = bk.split(',').map(Number);
    for (const [nr, nc] of neighbors4(r, c, R, C)) {
      if (blacks.has(`${nr},${nc}`)) return { ok: false, reason: `adjacent blacks ${bk} ${nr},${nc}` };
    }
  }
  // 3. loop is single cycle through all non-black cells
  const whiteCells = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const k = `${r},${c}`;
    if (!blacks.has(k)) whiteCells.push(k);
  }
  const whiteSet = new Set(whiteCells);
  const adj = {}; whiteCells.forEach(k => adj[k] = []);
  loopEdges.forEach(ek => {
    const [r1, c1, r2, c2] = ek.split(',').map(Number);
    const k1 = `${r1},${c1}`, k2 = `${r2},${c2}`;
    if (whiteSet.has(k1) && whiteSet.has(k2)) { adj[k1].push(k2); adj[k2].push(k1); }
  });
  for (const k of whiteCells) {
    if (adj[k].length !== 2) return { ok: false, reason: `cell ${k} has ${adj[k].length} loop segments (needs 2)` };
  }
  // single cycle traversal
  if (whiteCells.length === 0) return { ok: true };
  const start = whiteCells[0];
  const visited = new Set([start]);
  let cur = start, prev = null, steps = 0;
  while (steps < whiteCells.length + 1) {
    const nbrs = adj[cur].filter(n => n !== prev);
    if (nbrs.length === 0) break;
    const nxt = nbrs[0];
    if (nxt === start) break;
    if (visited.has(nxt)) break;
    visited.add(nxt); prev = cur; cur = nxt; steps++;
  }
  if (visited.size !== whiteCells.length) return { ok: false, reason: `not single cycle (${visited.size}/${whiteCells.length})` };
  // verify closes back to start
  const lastNbrs = adj[cur].filter(n => n !== prev);
  if (!lastNbrs.includes(start)) return { ok: false, reason: 'loop does not close' };
  return { ok: true };
}

let pass = 0, fail = 0;
for (const lvl of LEVELS) {
  const result = checkSolution(lvl);
  if (result.ok) pass++;
  else { fail++; console.log(`L${lvl.id} (${lvl.tier}): FAIL — ${result.reason}`); }
}
console.log(`\nIn-engine verify: ${pass}/${LEVELS.length} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
