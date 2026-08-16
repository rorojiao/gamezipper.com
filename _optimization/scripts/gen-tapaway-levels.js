#!/usr/bin/env node
/* tap-away level generator — constructive solvability guarantee.
 * Invariant: a block placed when its LOS-to-edge is clear of ALREADY-placed blocks
 * can be removed first among {it + earlier blocks} ⇒ reverse placement order = valid solution.
 * Mirrors the original 30-level size/block-count curve exactly; only layouts are regenerated.
 * Output: state/tap-away-levels.json (levels + per-level constructive solution + self-check) */
const fs = require('fs');
const path = require('path');

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// original curve: [w, h, blocks]
const CURVE = [[3,3,4],[3,3,3],[3,3,4],[4,4,4],[4,4,5],[4,4,5],[4,4,8],[4,4,8],[5,5,9],[5,5,7],[5,5,10],[5,5,10],[5,5,19],[5,5,13],[5,5,12],[6,6,16],[6,6,14],[6,6,16],[6,6,20],[6,6,16],[6,6,20],[7,7,15],[7,7,17],[7,7,21],[7,7,28],[7,7,23],[7,7,30],[7,7,28],[7,7,31],[7,7,33]];
const DIRS = [[0,-1],[1,0],[0,1],[-1,0]]; // d: 0=up 1=right 2=down 3=left

function losClear(w, h, occ, x, y, d) {
  const [dx, dy] = DIRS[d];
  let cx = x + dx, cy = y + dy;
  while (cx >= 0 && cx < w && cy >= 0 && cy < h) {
    if (occ[cy * w + cx]) return false;
    cx += dx; cy += dy;
  }
  return true;
}

function genLevel(w, h, n, rnd) {
  // occ = occupancy of placed blocks; border-first bias for frame-like visuals
  for (let attempt = 0; attempt < 400; attempt++) {
    const occ = new Array(w * h).fill(false);
    const blocks = [];
    let guard = 0;
    while (blocks.length < n && guard++ < 4000) {
      // candidate cells ordered center-OUT (interior first: near-empty board ⇒ almost any d clear;
      // border cells are always placeable via their outward direction, so they go last)
      const cands = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (occ[y * w + x]) continue;
        const dc = Math.max(Math.abs(x - (w - 1) / 2), Math.abs(y - (h - 1) / 2)); // chebyshev from center
        cands.push({ x, y, k: dc + rnd() * 0.9 });
      }
      cands.sort((a, b) => a.k - b.k);
      let placed = false;
      for (const c of cands) {
        const ds = [0, 1, 2, 3].sort(() => rnd() - 0.5);
        for (const d of ds) {
          if (losClear(w, h, occ, c.x, c.y, d)) {
            occ[c.y * w + c.x] = true;
            blocks.push({ x: c.x, y: c.y, d });
            placed = true; break;
          }
        }
        if (placed) break;
      }
      if (!placed) break; // dead end, retry level
    }
    if (blocks.length === n) return blocks;
  }
  throw new Error('gen failed for ' + w + 'x' + h + ' n=' + n);
}

// independent replay check mirroring engine canRemove()
function replaySolution(w, h, blocks) {
  const alive = blocks.map(() => true);
  for (let i = blocks.length - 1; i >= 0; i--) { // reverse placement order
    const b = blocks[i];
    const [dx, dy] = DIRS[b.d];
    let cx = b.x + dx, cy = b.y + dy, ok = true;
    while (cx >= 0 && cx < w && cy >= 0 && cy < h) {
      const idx = blocks.findIndex((o, j) => j !== i && alive[j] && o.x === cx && o.y === cy);
      if (idx >= 0) { ok = false; break; }
      cx += dx; cy += dy;
    }
    if (!ok) return { ok: false, at: i };
    alive[i] = false;
  }
  return { ok: true };
}

const out = [];
for (let i = 0; i < CURVE.length; i++) {
  const [w, h, n] = CURVE[i];
  const rnd = mulberry32(0x7a9e3d + i * 7919);
  const blocks = genLevel(w, h, n, rnd);
  const chk = replaySolution(w, h, blocks);
  if (!chk.ok) { console.error('SELF-CHECK FAILED L' + (i + 1), chk); process.exit(1); }
  out.push({ w, h, par: n, blocks });
}
fs.writeFileSync(path.join(__dirname, '..', 'state', 'tap-away-levels.json'), JSON.stringify({ generated: new Date().toISOString(), levels: out }, null, 1));
console.log('OK: 30 levels, all replay-verified solvable. par=blockcount. Curve mirrored.');
