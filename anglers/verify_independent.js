#!/usr/bin/env node
/**
 * Independent Node.js verifier for Anglers levels.
 * Verifies stored solutions: paths connected, fish counts correct, no overlaps.
 */
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function neighbors(r, c, H, W) {
  const res = [];
  if (r+1<H) res.push([r+1,c]);
  if (r-1>=0) res.push([r-1,c]);
  if (c+1<W) res.push([r,c+1]);
  if (c-1>=0) res.push([r,c-1]);
  return res;
}

function verifyLevel(level) {
  const H = level.H, W = level.W;
  const anglers = level.anglers;
  const fishSet = new Set(level.fish.map(f => f[0]+','+f[1]));
  const solution = level.solution;

  // 1. Anglers on border
  for (const ang of anglers) {
    const [r, c] = ang.pos;
    if (!(r === 0 || c === 0 || r === H-1 || c === W-1))
      return {ok: false, msg: 'angler not on border'};
  }

  // 2. Each angler path connected
  for (const ang of anglers) {
    const aid = ang.id;
    const [ar, ac] = ang.pos;
    if (solution[ar][ac] !== aid)
      return {ok: false, msg: `angler ${aid} pos not marked`};
    const seen = new Set([ar+','+ac]);
    const q = [[ar, ac]];
    while (q.length) {
      const [r, c] = q.shift();
      for (const [nr, nc] of neighbors(r, c, H, W))
        if (solution[nr][nc] === aid && !seen.has(nr+','+nc)) {
          seen.add(nr+','+nc);
          q.push([nr, nc]);
        }
    }
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++)
        if (solution[r][c] === aid && !seen.has(r+','+c))
          return {ok: false, msg: `angler ${aid} disconnected`};
  }

  // 3. Fish counts
  for (const ang of anglers) {
    const aid = ang.id;
    let count = 0;
    for (const f of level.fish)
      if (solution[f[0]][f[1]] === aid) count++;
    if (count !== ang.count)
      return {ok: false, msg: `angler ${aid}: ${count} != ${ang.count}`};
  }

  // 4. All fish on paths
  for (const f of level.fish)
    if (solution[f[0]][f[1]] === -1)
      return {ok: false, msg: `fish ${f} not on path`};

  return {ok: true, msg: 'OK'};
}

let allOk = true;
for (const lv of levels) {
  const {ok, msg} = verifyLevel(lv);
  const status = ok ? 'OK' : 'FAIL: ' + msg;
  if (!ok) allOk = false;
  console.log(`Level ${String(lv.id).padStart(2)} [${lv.tier.padEnd(9)}] ${lv.W}x${lv.H}: ${status}`);
}
console.log();
console.log(`RESULT: ${allOk ? 'ALL 30 VALID' : 'FAILURES DETECTED'}`);
process.exit(allOk ? 0 : 1);
