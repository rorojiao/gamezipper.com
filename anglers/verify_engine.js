#!/usr/bin/env node
/**
 * In-engine verification: loads actual LEVELS from index.html,
 * runs the engine's validation logic (isComplete), confirms stored solutions valid.
 */
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/const LEVELS\s*=\s*(\[.+?\]);/s);
if (!match) { console.error('Cannot extract LEVELS'); process.exit(1); }
const LEVELS = JSON.parse(match[1]);

function neighbors(r, c, H, W) {
  const res = [];
  if (r+1<H) res.push([r+1,c]);
  if (r-1>=0) res.push([r-1,c]);
  if (c+1<W) res.push([r,c+1]);
  if (c-1>=0) res.push([r,c-1]);
  return res;
}

function countCaught(L, grid, aid, fishSet) {
  let n = 0;
  for (const key in fishSet) {
    const [r,c] = key.split(',').map(Number);
    if (grid[r][c] === aid) n++;
  }
  return n;
}

function isComplete(L, grid, anglerAt, fishSet) {
  for (const key in fishSet) {
    const [r,c] = key.split(',').map(Number);
    if (grid[r][c] === -1) return false;
  }
  for (const a of L.anglers) {
    if (countCaught(L, grid, a.id, fishSet) !== a.count) return false;
    const [ar,ac] = a.pos;
    const seen = new Set([ar+','+ac]);
    const q = [[ar,ac]];
    while (q.length) {
      const [r,c] = q.shift();
      for (const [nr,nc] of neighbors(r,c,L.H,L.W))
        if (grid[nr][nc]===a.id && !seen.has(nr+','+nc)) {
          seen.add(nr+','+nc); q.push([nr,nc]);
        }
    }
    for (let r=0;r<L.H;r++) for(let c=0;c<L.W;c++)
      if (grid[r][c]===a.id && !seen.has(r+','+c)) return false;
  }
  return true;
}

let allOk = true;
for (const L of LEVELS) {
  // Build grid from solution
  const grid = L.solution.map(row => [...row]);
  const anglerAt = {};
  L.anglers.forEach(a => { anglerAt[a.pos[0]+','+a.pos[1]] = a.id; });
  const fishSet = {};
  L.fish.forEach(f => { fishSet[f[0]+','+f[1]] = true; });
  const ok = isComplete(L, grid, anglerAt, fishSet);
  console.log(`Level ${String(L.id).padStart(2)} [${L.tier.padEnd(9)}] ${L.W}x${L.H}: engine -> ${ok ? 'OK' : 'FAIL'}`);
  if (!ok) allOk = false;
}
console.log(`\nRESULT: ${allOk ? 'ALL 30 VALID (engine)' : 'FAILURES (engine)'}`);
process.exit(allOk ? 0 : 1);
