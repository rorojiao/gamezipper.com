#!/usr/bin/env node
// catch-the-cat independent verifier (re-implements genLevel + validates cat escape BFS)
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

const GRID_SIZE = 11; // from index.html genObs: "o.q>=0 && o.q<GRID_SIZE"

// Re-implement genLevel from source
function genLevel(seed, count, aiType, catQ, catR) {
  catQ = catQ || 5; catR = catR || 5;
  let s = seed * 7919 + 31;
  function rng(max) { s = (s * 9301 + 49297) % 233280; return Math.floor(s / 233280 * max); }
  for (let attempt = 0; attempt < 50; attempt++) {
    const obs = [];
    const obsSet = {};
    let safety = 0;
    while (obs.length < count && safety < 500) {
      safety++;
      const q = rng(GRID_SIZE), r = rng(GRID_SIZE);
      if (q === catQ && r === catR) continue;
      const k = q+','+r;
      if (obsSet[k]) continue;
      obsSet[k] = true;
      obs.push({q, r});
    }
    const blocked = {};
    obs.forEach(o => blocked[o.q+','+o.r] = true);
    const ns = [{q:catQ+1,r:catR},{q:catQ-1,r:catR},{q:catQ,r:catR+1},{q:catQ,r:catR-1},{q:catQ+1,r:catR-1},{q:catQ-1,r:catR+1}];
    let hasMove = false;
    for (let i = 0; i < 6; i++) {
      const n = ns[i];
      if (n.q>=0 && n.q<GRID_SIZE && n.r>=0 && n.r<GRID_SIZE && !blocked[n.q+','+n.r]) { hasMove = true; break; }
    }
    if (!hasMove) continue;
    let bfsOk = false;
    const vis = {}; vis[catQ+','+catR] = true;
    const queue = [{q:catQ,r:catR}]; let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      const cn = [{q:cur.q+1,r:cur.r},{q:cur.q-1,r:cur.r},{q:cur.q,r:cur.r+1},{q:cur.q,r:cur.r-1},{q:cur.q+1,r:cur.r-1},{q:cur.q-1,r:cur.r+1}];
      for (let ci = 0; ci < 6; ci++) {
        const nn = cn[ci];
        if (nn.q<0||nn.q>=GRID_SIZE||nn.r<0||nn.r>=GRID_SIZE) continue;
        const nk = nn.q+','+nn.r;
        if (vis[nk] || blocked[nk]) continue;
        if (nn.q===0||nn.q===GRID_SIZE-1||nn.r===0||nn.r===GRID_SIZE-1) bfsOk = true;
        vis[nk] = true;
        queue.push({q:nn.q, r:nn.r});
      }
    }
    if (!bfsOk) continue;
    return obs;
  }
  return [];
}

// Parse LEVELS from index.html using balanced bracket extraction
const m = html.match(/var LEVELS\s*=\s*\[/);
const startIdx = m.index + m[0].length - 1;
let depth = 0, inStr = false, strCh = '', endIdx = startIdx;
for (let i = startIdx; i < html.length; i++) {
  const c = html[i];
  if (inStr) {
    if (c === '\\') { i++; continue; }
    if (c === strCh) inStr = false;
    continue;
  }
  if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
  if (c === '[') depth++;
  else if (c === ']') {
    depth--;
    if (depth === 0) { endIdx = i; break; }
  }
}
// Manually build LEVELS array by parsing entries (since genLevel() can't be eval'd)
const arrStr = html.slice(startIdx, endIdx + 1);
// Pattern: {cat:{q:N,r:N}, obstacles:genLevel(N,N,'TYPE'), ai:'TYPE', stars3:N, stars2:N}
const entryRe = /\{cat:\{q:(\d+),r:(\d+)\},\s*obstacles:genLevel\((\d+),(\d+),'(easy|bfs|smart|expert)'(?:,(\d+),(\d+))?\),\s*ai:'(easy|bfs|smart|expert)',\s*stars3:(\d+),\s*stars2:(\d+)\}/g;
const LEVELS = [];
let m2;
while ((m2 = entryRe.exec(arrStr)) !== null) {
  const [_, cq, cr, seed, count, genAi, _exQ, _exR, ai, stars3, stars2] = m2;
  const catQ = _exQ !== undefined ? +_exQ : +cq;
  const catR = _exR !== undefined ? +_exR : +cr;
  const obstacles = genLevel(+seed, +count, genAi, catQ, catR);
  LEVELS.push({cat: {q: catQ, r: catR}, obstacles, ai, stars3: +stars3, stars2: +stars2});
}
console.log(`Parsed ${LEVELS.length} levels`);
if (LEVELS.length === 0) { console.error('No levels parsed!'); process.exit(1); }

// Now simulate the AI escape and verify level solvability.
// Trap-the-cat strategy: place walls around the cat's escape paths.
// For each level, run a BFS solver: find min set of walls that traps the cat.
let pass = 0, fail = 0;
LEVELS.forEach((level, idx) => {
  const cat = {q: level.cat.q, r: level.cat.r};
  const blocked = {};
  level.obstacles.forEach(o => blocked[o.q+','+o.r] = true);
  const placed = {};
  // AI: from cat's position, BFS to nearest border through EMPTY cells (no player walls yet)
  function bfsDistFromCat() {
    const vis = {};
    vis[cat.q+','+cat.r] = true;
    const queue = [{q:cat.q,r:cat.r,d:0}];
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      const ns = [{q:cur.q+1,r:cur.r},{q:cur.q-1,r:cur.r},{q:cur.q,r:cur.r+1},{q:cur.q,r:cur.r-1},{q:cur.q+1,r:cur.r-1},{q:cur.q-1,r:cur.r+1}];
      for (const n of ns) {
        if (n.q<0||n.q>=GRID_SIZE||n.r<0||n.r>=GRID_SIZE) return cur.d + 1;
        const k = n.q+','+n.r;
        if (vis[k] || blocked[k] || placed[k]) continue;
        vis[k] = true;
        queue.push({q:n.q, r:n.r, d:cur.d+1});
      }
    }
    return -1;
  }
  const initDist = bfsDistFromCat();
  if (initDist === -1) { fail++; console.log(`❌ L${idx+1}: already trapped`); return; }

  // Helper: cat's escape dist from each neighbor (for AI move)
  function catEscapeDist(fromQ, fromR) {
    const vis = {}; vis[fromQ+','+fromR] = true;
    const queue = [{q:fromQ,r:fromR,d:0}]; let h=0; let dist = Infinity;
    while (h < queue.length) {
      const c = queue[h++];
      const n2 = [{q:c.q+1,r:c.r},{q:c.q-1,r:c.r},{q:c.q,r:c.r+1},{q:c.q,r:c.r-1},{q:c.q+1,r:c.r-1},{q:c.q-1,r:c.r+1}];
      for (const nn of n2) {
        if (nn.q<0||nn.q>=GRID_SIZE||nn.r<0||nn.r>=GRID_SIZE) { dist = Math.min(dist, c.d + 1); continue; }
        const k2 = nn.q+','+nn.r;
        if (vis[k2] || blocked[k2] || placed[k2]) continue;
        vis[k2] = true;
        queue.push({q:nn.q, r:nn.r, d:c.d+1});
      }
    }
    return dist;
  }

  // Pick best wall: try cells near cat first (adjacent or distance 1-2) for tight traps
  function bestWall() {
    // First try walls immediately adjacent to cat — they maximally constrain the cat's escape
    const catNs = [{q:cat.q+1,r:cat.r},{q:cat.q-1,r:cat.r},{q:cat.q,r:cat.r+1},{q:cat.q,r:cat.r-1},{q:cat.q+1,r:cat.r-1},{q:cat.q-1,r:cat.r+1}];
    let bestCell = null, bestDist = -1;
    // Phase 1: try cat-adjacent cells
    for (const n of catNs) {
      if (n.q<0||n.q>=GRID_SIZE||n.r<0||n.r>=GRID_SIZE) continue;
      const k = n.q+','+n.r;
      if (blocked[k] || placed[k]) continue;
      placed[k] = true;
      let maxD = -1;
      for (const nn of catNs) {
        if (nn.q<0||nn.q>=GRID_SIZE||nn.r<0||nn.r>=GRID_SIZE) continue;
        const ck = nn.q+','+nn.r;
        if (blocked[ck] || placed[ck]) continue;
        const d = catEscapeDist(nn.q, nn.r);
        if (d > maxD) maxD = d;
      }
      if (maxD > bestDist) { bestDist = maxD; bestCell = n; }
      delete placed[k];
    }
    if (bestCell) return bestCell;
    // Phase 2: try cells within distance 2 of cat
    for (let dr = -2; dr <= 2; dr++) {
      for (let dq = -2; dq <= 2; dq++) {
        const q = cat.q + dq, r = cat.r + dr;
        if (q<0||q>=GRID_SIZE||r<0||r>=GRID_SIZE) continue;
        if (q===cat.q && r===cat.r) continue;
        const k = q+','+r;
        if (blocked[k] || placed[k]) continue;
        placed[k] = true;
        let maxD = -1;
        for (const n of catNs) {
          if (n.q<0||n.q>=GRID_SIZE||n.r<0||n.r>=GRID_SIZE) continue;
          const ck = n.q+','+n.r;
          if (blocked[ck] || placed[ck]) continue;
          const d = catEscapeDist(n.q, n.r);
          if (d > maxD) maxD = d;
        }
        if (maxD > bestDist) { bestDist = maxD; bestCell = {q, r}; }
        delete placed[k];
      }
    }
    return bestCell;
  }

  let moves = 0;
  const MAX_MOVES = 100; // unlimited for solvability check
  let escaped = false, trapped = false;
  for (let attempt = 0; attempt < MAX_MOVES; attempt++) {
    const w = bestWall();
    if (!w) { trapped = true; break; }
    placed[w.q+','+w.r] = true;
    moves++;
    // Check if cat trapped
    const catNs = [{q:cat.q+1,r:cat.r},{q:cat.q-1,r:cat.r},{q:cat.q,r:cat.r+1},{q:cat.q,r:cat.r-1},{q:cat.q+1,r:cat.r-1},{q:cat.q-1,r:cat.r+1}];
    let canMove = false;
    for (const n of catNs) {
      if (n.q>=0 && n.q<GRID_SIZE && n.r>=0 && n.r<GRID_SIZE && !blocked[n.q+','+n.r] && !placed[n.q+','+n.r]) { canMove = true; break; }
    }
    if (!canMove) { trapped = true; break; }
    // Cat picks neighbor with shortest escape
    let bestDist = Infinity, bestCatMove = null;
    for (const n of catNs) {
      if (n.q<0||n.q>=GRID_SIZE||n.r<0||n.r>=GRID_SIZE) continue;
      const ck = n.q+','+n.r;
      if (blocked[ck] || placed[ck]) continue;
      const d = catEscapeDist(n.q, n.r);
      if (d < bestDist) { bestDist = d; bestCatMove = n; }
    }
    if (bestCatMove === null) { trapped = true; break; }
    if (bestDist === Infinity) { escaped = false; break; }
    // If cat's best escape is right at the border (cat moves onto border next), that means the chosen neighbor IS on the border
    if (bestDist === 1 && (bestCatMove.q===0||bestCatMove.q===GRID_SIZE-1||bestCatMove.r===0||bestCatMove.r===GRID_SIZE-1)) { escaped = true; break; }
    if (bestDist === 1) {
      // Cat about to escape via a non-border neighbor at distance 1 — keep playing, more walls needed
      // continue the loop
    }
    cat.q = bestCatMove.q; cat.r = bestCatMove.r;
  }
  if (trapped) pass++;
  else if (escaped) { fail++; console.log(`❌ L${idx+1}: cat escaped in ${moves} moves`); }
  else if (moves >= MAX_MOVES) { fail++; console.log(`❌ L${idx+1}: solver exceeded ${MAX_MOVES} moves`); }
  else pass++;
});
console.log(`\nResult: ${pass}/${LEVELS.length} solvable by trap-with-walls strategy`);