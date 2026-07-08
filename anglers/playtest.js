#!/usr/bin/env node
/**
 * Playtest: simulate the stored solution through the engine's isComplete logic.
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

let allOk = true;
for (const L of LEVELS) {
  const grid = L.solution.map(row => [...row]);
  const fishSet = {};
  L.fish.forEach(f => { fishSet[f[0]+','+f[1]] = true; });
  // Check all fish caught
  let allFishCaught = true;
  for (const f of L.fish) if (grid[f[0]][f[1]] === -1) { allFishCaught = false; break; }
  // Check counts
  let countsOk = true;
  for (const a of L.anglers) {
    let n = 0;
    for (const f of L.fish) if (grid[f[0]][f[1]] === a.id) n++;
    if (n !== a.count) { countsOk = false; break; }
  }
  // Check connectivity
  let connOk = true;
  for (const a of L.anglers) {
    const [ar,ac] = a.pos;
    const seen = new Set([ar+','+ac]);
    const q = [[ar,ac]];
    while (q.length) {
      const [r,c] = q.shift();
      for (const [nr,nc] of neighbors(r,c,L.H,L.W))
        if (grid[nr][nc]===a.id && !seen.has(nr+','+nc)) { seen.add(nr+','+nc); q.push([nr,nc]); }
    }
    for (let r=0;r<L.H;r++) for (let c=0;c<L.W;c++)
      if (grid[r][c]===a.id && !seen.has(r+','+c)) { connOk = false; break; }
  }
  const ok = allFishCaught && countsOk && connOk;
  console.log(`Level ${String(L.id).padStart(2)} [${L.tier.padEnd(9)}]: playtest -> ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) allOk = false;
}
console.log(`\nRESULT: ${allOk ? 'ALL 30 PASS (playtest)' : 'FAILURES (playtest)'}`);
process.exit(allOk ? 0 : 1);
