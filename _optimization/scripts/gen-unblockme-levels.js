#!/usr/bin/env node
/* unblock-me level generator — Rush Hour style, 6x6, red 2x1 on row 2, exit right.
 * Solvability by construction: start from a SOLVED board (red at x=4), place filler blocks,
 * then reverse-scramble with K random legal slides (red biased LEFT) ⇒ undo = solution.
 * BFS (multi-cell slides = 1 move, mirroring engine semantics) confirms optimal length band.
 * Mirrors original 50-level optimal-move curve (1→18, sawtooth) and block-count ramp. */
const fs = require('fs');
const path = require('path');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const W = 6, H = 6, R = 2; // grid, red row
const PALETTE = ['#4a90d9','#5bc0be','#9b59b6','#e67e22','#2ecc71','#f39c12','#1abc9c','#3498db','#8e44ad','#e74c3c'];

// target optimal per level (mirror original curve; interpolate the 27 broken slots)
const CURVE = [];
(function(){
  const orig = {1:1,2:2,3:3,4:2,5:4,6:3,7:4,8:3,9:5,11:6,12:5,14:6,15:8,16:7,18:9,20:8,22:9,23:11,26:10,27:12,32:14,34:13,38:15};
  let prev = 1;
  for (let i = 1; i <= 50; i++) {
    if (orig[i] !== undefined) prev = orig[i];
    else if (i > 38) prev = Math.min(15, prev + 1);           // late ramp to 15 (18 unreachable by scramble; the 18-peak came from the original broken-level data)
    else if (i > 27 && i !== 32 && i !== 34 && i !== 38) prev = prev; // hold plateau ~12-14
    CURVE.push(orig[i] !== undefined ? orig[i] : prev);
  }
  // gentle sawtooth: dip after peaks 15/18
  for (const peak of [15]) { const idx = CURVE.indexOf(peak); if (idx > 0 && idx < 49 && CURVE[idx+1] >= peak) CURVE[idx+1] = peak - 2; }
})();
const BLOCKS = i => { const t = CURVE[i]; return t <= 5 ? t + 1 : Math.min(15, Math.ceil(t * 0.8) + 1); }; // fit to original (par,blocks) data points

function overlaps(blocks, b) {
  return blocks.some(o => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
}
function mkBoard(rnd, nBlocks, redX) {
  for (let att = 0; att < 300; att++) {
    const blocks = [{ x: redX, y: R, w: 2, h: 1, color: 'RED' }];
    let guard = 0;
    while (blocks.length < 1 + nBlocks && guard++ < 3000) {
      const vertical = rnd() < 0.6;
      let b;
      if (vertical) {
        // long verticals dominate, biased into corridor columns (x≥2) where they interlock
        const r = rnd(); const h2 = r < 0.45 ? 4 : r < 0.8 ? 3 : 2;
        const x = rnd() < 0.6 ? 2 + Math.floor(rnd() * (W - 2)) : Math.floor(rnd() * W);
        b = { x, y: Math.floor(rnd() * (H - h2 + 1)), w: 1, h: h2 };
      } else {
        const w2 = 2 + Math.floor(rnd() * 2);
        b = { x: Math.floor(rnd() * (W - w2 + 1)), y: Math.floor(rnd() * H), w: w2, h: 1 };
        if (b.y === R && rnd() < 0.5) b.y = (b.y + 1 + Math.floor(rnd() * (H - 1))) % H;
      }
      if (overlaps(blocks, b)) continue;
      b.color = PALETTE[blocks.length % PALETTE.length];
      blocks.push(b);
    }
    if (blocks.length === 1 + nBlocks) return blocks;
  }
  throw new Error('mkBoard failed');
}
function moves(blocks) {
  // engine canMove semantics EXACTLY: stepwise entering-cell check along the path.
  // (v1 checked only the destination footprint — blocks teleported through obstacles,
  //  inflating optima and "verifying" unsolvable boards.)
  const W6 = 6;
  const grid = new Int8Array(36).fill(-1);
  blocks.forEach((b, i) => { for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) grid[(b.y + dy) * 6 + b.x + dx] = i; });
  const out = [];
  blocks.forEach((b, i) => {
    const horiz = b.w >= b.h, vert = b.h >= b.w;
    if (horiz) {
      for (const ddir of [-1, 1]) {
        for (let d = 1; d < W6; d++) {
          const nx = b.x + d * ddir;
          if (nx < 0 || nx + b.w > W6) break;
          const col = ddir > 0 ? nx + b.w - 1 : nx; // entering column
          let ok = true;
          for (let dy = 0; dy < b.h; dy++) { const c = grid[(b.y + dy) * 6 + col]; if (c !== -1 && c !== i) { ok = false; break; } }
          if (!ok) break;
          out.push({ i, dx: d * ddir, dy: 0 });
        }
      }
    }
    if (vert) {
      for (const ddir of [-1, 1]) {
        for (let d = 1; d < W6; d++) {
          const ny = b.y + d * ddir;
          if (ny < 0 || ny + b.h > W6) break;
          const row = ddir > 0 ? ny + b.h - 1 : ny; // entering row
          let ok = true;
          for (let dx = 0; dx < b.w; dx++) { const c = grid[row * 6 + b.x + dx]; if (c !== -1 && c !== i) { ok = false; break; } }
          if (!ok) break;
          out.push({ i, dx: 0, dy: d * ddir });
        }
      }
    }
  });
  return out;
}
function apply(blocks, mv) {
  const nb = blocks.map(b => ({ ...b }));
  nb[mv.i].x += mv.dx; nb[mv.i].y += mv.dy;
  return nb;
}
function key(blocks) { return blocks.map(b => b.x + ',' + b.y).join(';'); }
function solved(blocks) { const r = blocks[0]; return r.x + r.w >= W; }
function bfsOptimal(blocks) {
  const start = key(blocks);
  const dist = new Map([[start, 0]]); const q = [blocks];
  const BUDGET = 60000;
  while (q.length) {
    if (dist.size > BUDGET) return -2; // state explosion — skip this candidate
    const cur = q.shift(); const d = dist.get(key(cur));
    if (solved(cur)) return d;
    for (const mv of moves(cur)) {
      const nb = apply(cur, mv); const k = key(nb);
      if (!dist.has(k)) { dist.set(k, d + 1); q.push(nb); }
    }
  }
  return -1;
}
function parkRedLeft(blocks, rnd) {
  // dedicated phase: slide red to x<=1, nudging blockers out of the way (keeps solvability —
  // every nudge is a legal move, so undoing the whole sequence solves the board)
  let cur = blocks;
  for (let guard = 0; guard < 60; guard++) {
    if (cur[0].x <= 1) break;
    const ms = moves(cur);
    const redL = ms.filter(m => m.i === 0 && m.dx < 0).sort((a, b) => a.dx - b.dx); // farthest first
    if (redL.length) { cur = apply(cur, redL[0]); continue; }
    // blocked: which filler sits immediately left of red's row span? nudge it vertically
    const red = cur[0];
    let moved = false;
    for (let i = 1; i < cur.length && !moved; i++) {
      const b = cur[i];
      const touches = b.y <= red.y && b.y + b.h > red.y && b.x + b.w === red.x;
      if (!touches) continue;
      const nudges = ms.filter(m => m.i === i && m.dy !== 0);
      if (nudges.length) { cur = apply(cur, nudges[Math.floor(rnd() * nudges.length)]); moved = true; }
    }
    if (!moved) break;
  }
  return cur;
}
function scramble(blocks, rnd, depth) {
  let cur = parkRedLeft(blocks, rnd);
  for (let s = 0; s < depth; s++) {
    const ms = moves(cur);
    if (!ms.length) break;
    let pool = ms.filter(m => m.i !== 0 || m.dx < 0); // never move red right
    const redL = ms.filter(m => m.i === 0 && m.dx < 0);
    if (redL.length && rnd() < 0.3) pool = redL;
    if (!pool.length) break;
    // difficulty-aware bias: prefer filler slides that CONGEST the exit corridor
    // (cells on row R from red's right edge to the exit) — keeps optimal length high
    const red = cur[0];
    const corridor = new Set();
    for (let x = red.x + red.w; x < W; x++) corridor.add(R * W + x);
    const blocking = pool.filter(m => {
      const b = cur[m.i], nb = { ...b, x: b.x + m.dx, y: b.y + m.dy };
      for (let dx = 0; dx < nb.w; dx++) for (let dy = 0; dy < nb.h; dy++) if (corridor.has((nb.y + dy) * W + nb.x + dx)) return true;
      return false;
    });
    if (blocking.length && rnd() < 0.65) pool = blocking;
    cur = apply(cur, pool[Math.floor(rnd() * pool.length)]);
  }
  return cur;
}
function scrambleFromSolved(rnd, nBlocks, target) {
  // start SOLVED (red at x=4 at the exit), fillers anywhere overlap-free, then apply
  // K corridor-biased legal slides. Solvable by construction (reverse the scramble);
  // optimal rises roughly with K. Hill-climb afterwards polishes toward the exact target.
  for (let att = 0; att < 300; att++) {
    let blocks = [{ x: 4, y: R, w: 2, h: 1, color: 'RED' }];
    let guard = 0;
    while (blocks.length < 1 + nBlocks && guard++ < 3000) {
      const vertical = rnd() < 0.6;
      let b;
      if (vertical) { const h2 = 2 + Math.floor(rnd() * 3); b = { x: Math.floor(rnd() * W), y: Math.floor(rnd() * (H - h2 + 1)), w: 1, h: h2 }; }
      else { const w2 = 2 + Math.floor(rnd() * 2); b = { x: Math.floor(rnd() * (W - w2 + 1)), y: Math.floor(rnd() * H), w: w2, h: 1 }; }
      if (b.y === R && b.x + b.w > 4) continue;          // don't sit on the exit cells (4,5 of row R)
      if (b.y + b.h > R && b.y <= R && b.x > 3) continue; // vertical spanning exit row right side
      if (overlaps(blocks, b)) continue;
      b.color = PALETTE[blocks.length % PALETTE.length];
      blocks.push(b);
    }
    if (blocks.length !== 1 + nBlocks) continue;
    const K = Math.round(target >= 13 ? target * 4.2 : target * 2.6); // deep targets need far more scrambling
    for (let sN = 0; sN < K; sN++) {
      const ms = moves(blocks);
      if (!ms.length) break;
      let pool = ms.filter(m => m.i !== 0);
      const redL = ms.filter(m => m.i === 0 && m.dx < 0); // red LEFT deepens the puzzle (undo = solve)
      if (redL.length && rnd() < (target >= 13 ? 0.4 : 0.25)) pool = redL; // deepen harder for high targets
      if (!pool.length) break;
      // bias toward moves that congest the exit corridor (row R, cols red.x+2..5)
      const red = blocks[0];
      const corridor = new Set();
      for (let x = red.x + red.w; x < W; x++) corridor.add(R * W + x);
      const blocking = pool.filter(m => {
        const b = blocks[m.i], nbx = b.x + m.dx, nby = b.y + m.dy;
        for (let dx = 0; dx < b.w; dx++) for (let dy = 0; dy < b.h; dy++) if (corridor.has((nby + dy) * W + nbx + dx)) return true;
        return false;
      });
      if (blocking.length && rnd() < (target >= 13 ? 0.85 : 0.7)) pool = blocking;
      const mv = pool[Math.floor(rnd() * pool.length)];
      blocks = apply(blocks, mv);
      if (blocks[0].x < 0 || blocks[0].x > 4) break; // safety
    }
    if (blocks[0].x <= 3) return blocks; // red not at exit = real puzzle (x=4 would be already-solved)
  }
  return null;
}
const argOf2 = k => { const i = process.argv.indexOf(k); return i >= 0 ? parseInt(process.argv[i + 1], 10) : 0; };
const FROM = argOf2('--from') || 1;
// resume: load existing state (if any) and keep levels before FROM
const out = [];
try {
  const prev = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'unblock-me-levels.json'), 'utf8'));
  for (const L of prev.levels) if (L.level < FROM) out.push(L);
} catch (e) {}
for (let i = FROM - 1; i < 50; i++) {
  const target = CURVE[i], nB = BLOCKS(i);
  let done = null; const dist = {};
  const lo = target <= 3 ? Math.max(1, target - 1) : target - 3;
  const hi = target <= 3 ? target + 1 : target >= 14 ? target + 2 : target + 2;
  const attempts = target >= 14 ? 2500 : target >= 13 ? 900 : 400;
  for (let att = 0; att < attempts && !done; att++) {
    const rnd = mulberry32(0xC0FFEE + i * 7919 + att * 131);
    // high targets: build directly with red parked LEFT (random dense boards at 14+ fillers
    // jam the corridor so hard that parkRedLeft can never slide red back — dist={} at L40)
    let blocks;
    if (target >= 12) {
      blocks = scrambleFromSolved(rnd, nB, target);
      if (!blocks) continue;
    } else {
      blocks = parkRedLeft(mkBoard(rnd, nB, 4), rnd);
      if (blocks[0].x > 1) continue;
    }
    let opt = bfsOptimal(blocks);
    if (opt === -2) continue; // state explosion — skip candidate board
    dist[opt] = (dist[opt] || 0) + 1;
    // hill-climb: mutate toward higher optimal until AT target (not just band floor —
    // stopping at lo landed every level at the band bottom, flattening the curve)
    for (let step = 0; step < 250 && opt < target; step++) {
      const cand = blocks.map(b => ({ ...b }));
      const j = 1 + Math.floor(rnd() * (cand.length - 1)); // mutate a filler
      const kind = rnd();
      if (kind < 0.5) {
        // teleport into the exit corridor (row R, right of red)
        const red = cand[0];
        const spots = [];
        for (let x = red.x + red.w; x < W; x++) {
          const vert = cand[j].w === 1;
          const b2 = vert ? { x, y: cand[j].y, w: 1, h: cand[j].h } : { x, y: R, w: cand[j].w, h: 1 };
          if (b2.y >= 0 && b2.y + b2.h <= H && !overlaps(cand.filter((_, k) => k !== j), b2)) spots.push(b2);
        }
        if (spots.length) cand[j] = { ...cand[j], ...spots[Math.floor(rnd() * spots.length)] };
      } else if (kind < 0.75) {
        // lengthen a corridor-column vertical (interlock ↑)
        const b = cand[j];
        if (b.w === 1 && b.h < 4) { const b2 = { ...b, h: b.h + 1 }; if (b2.y + b2.h <= H && !overlaps(cand.filter((_, k) => k !== j), b2)) cand[j] = b2; }
        else continue;
      } else if (kind < 0.88 && cand.length < 16) {
        // ADD a fresh blocker into the corridor (density ↑ for high targets):
        // 60% vertical h=3 spanning the corridor row, 40% horizontal 2x1 ON the corridor row
        const red0 = cand[0];
        const spots = [];
        if (rnd() < 0.6) {
          for (let x = red0.x + red0.w; x < W; x++) for (let y = 0; y + 3 <= H; y += 2) {
            const b2 = { x, y, w: 1, h: 3 };
            if (!overlaps(cand, b2)) spots.push(b2);
          }
        } else {
          for (let x = red0.x + red0.w; x + 2 <= W; x++) {
            const b2 = { x, y: R, w: 2, h: 1 };
            if (!overlaps(cand, b2)) spots.push(b2);
          }
        }
        if (spots.length) { const b2 = spots[Math.floor(rnd() * spots.length)]; b2.color = PALETTE[cand.length % PALETTE.length]; cand.push(b2); }
        else continue;
      } else {
        // nudge randomly
        const ms = moves(cand).filter(m => m.i === j);
        if (ms.length) { const mv = ms[Math.floor(rnd() * ms.length)]; cand[j].x += mv.dx; cand[j].y += mv.dy; }
        else continue;
      }
      if (overlaps(cand.filter((_, k) => k !== j), cand[j])) continue;
      const nOpt = bfsOptimal(cand); // -1 = unsolvable under TRUE semantics → reject
      if (nOpt >= opt && nOpt !== -1) { blocks = cand; opt = nOpt; dist[opt] = (dist[opt] || 0) + 1; }
    }
    if (opt >= lo && opt <= hi) done = { blocks, opt };
  }
  if (!done) { console.error(`FAILED L${i + 1} target=${target} dist=${JSON.stringify(dist)}`); process.exit(1); }
  // canonical: sort non-red blocks for stable output
  const rest = done.blocks.slice(1).sort((a, b) => a.y - b.y || a.x - b.x);
  out.push({ level: i + 1, optimal: done.opt, blocks: [done.blocks[0], ...rest] });
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'unblock-me-levels.json'), JSON.stringify({ generated: new Date().toISOString(), levels: out }, null, 1));
  console.log(`L${i + 1}: blocks=${done.blocks.length} optimal=${done.opt} (target ${target}) ✓ [saved ${out.length}]`);
}
fs.writeFileSync(path.join(__dirname, '..', 'state', 'unblock-me-levels.json'), JSON.stringify({ generated: new Date().toISOString(), levels: out }, null, 1));
console.log('OK: 50 levels, all BFS-verified solvable with optimal length on target curve.');
