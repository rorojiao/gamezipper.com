#!/usr/bin/env node
/* boxrob verifier v3 — hierarchical solver (A-type golden standard):
 *   1. ABSTRACT PLANNER: pure-JS BFS over discrete box states using the engine's own
 *      mechanics read from LEVELS (horizontal pushes only; box falls when its footprint
 *      leaves all solid tiles; rests snapped to tile tops; box-box blocks at same row).
 *      Actions = "push box i dir d until next event (wall-stop / edge-fall / target)".
 *   2. EXECUTOR: replays the plan through REAL keys — player navigation is its own BFS
 *      over player-only macros with boxes frozen (any edge that disturbs a box is
 *      rejected), then the push itself is a held key watched per frame until the
 *      planned event (stop-x / fall) or engine win (the engine's own check, never forced).
 * v1/v2 flat beam search plateaued at 18-20/40: it pruned player-setup states that
 * don't immediately improve box fitness (jump-overs), which this decomposition removes. */
const fs = require('fs');
const path = require('path');
const { bootGame } = require('../_optimization/scripts/harness-lib.js');

// ---------- load level data (same source the engine boots from) ----------
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const LEVELS = eval(html.match(/var LEVELS\s*=\s*(\[[\s\S]*?\]);/)[1]);
const TILE = 40;

function parseMap(levelData) {
  const map = levelData.map, rows = map.length;
  let cols = 0; for (const r of map) cols = Math.max(cols, r.length);
  const solid = [];
  const st = { boxes: [], targets: [], player: null, rows, cols };
  for (let r = 0; r < rows; r++) {
    solid[r] = [];
    for (let c = 0; c < cols; c++) {
      const ch = map[r][c] || ' ';
      solid[r][c] = ch === 'W' ? 1 : 0;
      if (ch === 'P') st.player = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
      if (ch === 'B') st.boxes.push({ x: c * TILE, y: r * TILE });
      if (ch === 'T') st.targets.push({ x: c * TILE, y: r * TILE });
      if (ch === 'X') { st.boxes.push({ x: c * TILE, y: r * TILE }); st.targets.push({ x: c * TILE, y: r * TILE }); }
    }
  }
  st.solid = solid;
  return st;
}
const solidAt = (st, r, c) => (r < 0 || r >= st.rows || c < 0 || c >= st.cols) ? 1 : st.solid[r][c];
// engine isWall over a rect
function isWallRect(st, x, y, w, h) {
  const l = Math.floor(x / TILE), rr = Math.floor((x + w - 1) / TILE), t = Math.floor(y / TILE), b = Math.floor((y + h - 1) / TILE);
  for (let r = t; r <= b; r++) for (let c = l; c <= rr; c++) if (solidAt(st, r, c)) return true;
  return false;
}

// ---------- abstract box mechanics (mirrors update()) ----------
// A push can stop ANYWHERE the player releases (not only at walls/falls), so we
// enumerate destinations: the support's reachable span in `dir`, clipped by the
// first wall/box; destinations = every target x + every other box's x + parking
// spots adjacent to blockers + the fall edge + the stop itself. Falls happen when
// the box footprint loses ALL solid overlap below (engine isWall snap logic).
function slideLimit(st, boxes, i, dir) {
  const b = boxes[i];
  // support at (x,y): a wall tile under the footprint, or another box top it rests on
  const supported = (x, yy) => {
    const rowBelow = Math.floor((yy + TILE) / TILE);
    const l = Math.floor(x / TILE), rr = Math.floor((x + TILE - 1) / TILE);
    for (let c = l; c <= rr; c++) if (solidAt(st, rowBelow, c)) return true;
    for (let j = 0; j < boxes.length; j++) {
      if (j === i) continue;
      const o = boxes[j];
      if (Math.abs(o.y - (yy + TILE)) < 2 && o.x < x + TILE && x < o.x + TILE) return true;
    }
    return false;
  };
  // highest surface top strictly below the bottom edge (walls AND box tops — boxes stack)
  const landTop = (x, yy) => {
    const l = Math.floor(x / TILE), rr = Math.floor((x + TILE - 1) / TILE);
    let top = st.rows * TILE;
    for (let row = Math.floor((yy + TILE) / TILE); row < st.rows; row++)
      for (let c = l; c <= rr; c++) if (solidAt(st, row, c)) { top = Math.min(top, row * TILE); break; }
    for (let j = 0; j < boxes.length; j++) {
      if (j === i) continue;
      const o = boxes[j];
      if (o.y >= yy + TILE - 1 && o.x < x + TILE && x < o.x + TILE) top = Math.min(top, o.y);
    }
    return top;
  };
  // step 4px; find first blocked x and (if earlier) the fall edge
  let x = b.x;
  const y = b.y;
  for (let s = 0; s < 400; s++) {
    const nx = x + dir * 4;
    let blocker = null;
    for (let j = 0; j < boxes.length; j++) {
      if (j === i) continue;
      const o = boxes[j];
      if (Math.abs(o.y - y) < TILE && nx < o.x + TILE && nx + TILE > o.x) { blocker = o; break; }
    }
    if (blocker) return { kind: 'stop', x: dir === 1 ? blocker.x - TILE : blocker.x + TILE }; // actual contact — box faces aren't tile-aligned (push grid leaves ±1-2px residue)
    if (isWallRect(st, nx, y, TILE, TILE)) {
      const stopX = dir === 1 ? Math.floor((nx + TILE) / TILE) * TILE - TILE : Math.ceil(nx / TILE) * TILE;
      return { kind: 'stop', x: stopX };
    }
    x = nx;
    if (!supported(x, y)) {
      // box leaves the support at this x: falls, x frozen
      return { kind: 'fall', x, y: landTop(x, y) - TILE };
    }
  }
  return { kind: 'stop', x };
}
// (retired: standing-window feasibility was replaced by canPush's contact-band check —
// aerial jump-pushes with no standing window are legal, the window test wrongly pruned them)

function enumeratePushes(st, boxes, i, dir, allowDrift) {
  const b = boxes[i];
  const lim = slideLimit(st, boxes, i, dir);
  if (Math.abs(lim.x - b.x) < 2 && lim.kind === 'stop') return [];
  const dests = new Set();
  const inDir = (x) => dir === 1 ? x > b.x + 2 : x < b.x - 2;
  const closer = (x) => dir === 1 ? x <= lim.x + 2 : x >= lim.x - 2;
  for (const t of st.targets) if (inDir(t.x) && t.y === b.y && closer(t.x)) dests.add(t.x);
  for (const o of boxes) if (o !== b && inDir(o.x) && o.y === b.y && closer(o.x)) { dests.add(o.x); dests.add(o.x - dir * TILE); } // park at / just before a same-row box
  dests.add(lim.x);
  const out = [];
  for (const x of dests) {
    if (lim.kind === 'fall' && (dir === 1 ? x > lim.x + 2 : x < lim.x - 2)) continue; // beyond the edge = unreachable (stop dests only)
    out.push({ x, y: lim.kind === 'fall' && Math.abs(x - lim.x) < 3 ? lim.y : b.y, event: Math.abs(x - lim.x) < 3 && lim.kind === 'fall' ? 'fall' : 'stop', edgeX: lim.x });
  }
  if (lim.kind === 'fall' && ![...dests].some(x => Math.abs(x - lim.x) < 3)) out.push({ x: lim.x, y: lim.y, event: 'fall', edgeX: lim.x });
  // drift dests: a box tipped over an edge stays pushable while falling (vertical overlap
  // persists; contact breaks when the box clears the player's reach) — holding the key
  // through the fall lands the box further along. Levels like L15 need this to clear a gap.
  // Gated: attempt 0 plans drift-free (drift overshoots can dead-end otherwise-free boxes).
  if (allowDrift && lim.kind === 'fall') for (const d of [9.33, 18.66, 28, 37.33]) {
    out.push({ x: lim.x + dir * d, y: lim.y, event: 'fall', edgeX: lim.x });
  }
  return out.filter(d => Math.abs(d.x - b.x) >= 2 || d.y !== b.y);
}
const qkey = (boxes) => boxes.map(b => (Math.round(b.x / 4) * 4) + ':' + b.y).join('|');
const goalReached = (st, bs) => st.targets.every(t => bs.some(b => Math.abs(b.x - t.x) < 2 && Math.abs(b.y - t.y) < 2));

// drop boxes that lost support, bottom-up, until stable — support = a wall tile OR
// another box's top (boxes stack). Used for the load-time pre-settle (engine pre-settles
// floating spawns, e.g. L18 b1) and after every planned push (pushing a support box out
// from under a stack drops the ones above — the old walls-only settle left them floating).
function cascadeSettle(st, boxes) {
  const bs = boxes.map(b => ({ x: b.x, y: Math.floor(b.y + 0.001) }));
  for (let pass = 0; pass < 4 * bs.length + 8; pass++) {
    let moved = false;
    const order = bs.map((_, k) => k).sort((a, b) => bs[b].y - bs[a].y); // bottom boxes first
    for (const k of order) {
      let top = st.rows * TILE;
      const l = Math.floor(bs[k].x / TILE), rr = Math.floor((bs[k].x + TILE - 1) / TILE);
      for (let row = Math.floor((bs[k].y + TILE) / TILE); row < st.rows; row++)
        for (let c = l; c <= rr; c++) if (solidAt(st, row, c)) { top = Math.min(top, row * TILE); break; }
      for (let j = 0; j < bs.length; j++) {
        if (j === k) continue;
        const o = bs[j];
        if (o.y >= bs[k].y + TILE - 1 && o.x < bs[k].x + TILE && bs[k].x < o.x + TILE) top = Math.min(top, o.y);
      }
      if (top - TILE < bs[k].y - 0.5) { bs[k].y = top - TILE; moved = true; }
    }
    if (!moved) break;
  }
  return bs;
}

// where the spawn player ends up standing (walls-only). player.x/y are the ENGINE's
// left/top coords (body [x, x+28] × [y, y+36]) — the P tile straddles two columns and
// either can catch the landing (L6: spawn over the shaft still catches the platform edge)
function spawnFeet(st) {
  if (!st.player) return 0;
  const l = Math.floor(st.player.x / TILE), rr = Math.floor((st.player.x + 27) / TILE);
  const bot = st.player.y + 36;
  for (let row = Math.floor(bot / TILE); row < st.rows; row++)
    for (let c = l; c <= rr; c++) if (solidAt(st, row, c)) return row * TILE;
  return st.rows * TILE;
}

// ---------- player surface reachability (static map model) ----------
// Standable surfaces = wall-top tile runs with headroom above (player is 36 tall < 40).
// The player navigates between surfaces by walking (same level), falling off edges
// (down, small drift), and jumping (up ≤106px — apex 106.8 — with ~80px drift).
// A push is only possible from a surface the player can actually reach: the flat
// "spawnFeet − 106" rule both over-pruned multi-platform climbs (L29/L30 need
// floor→ledge→ledge) and under-pruned stranding (L21: after a floor push the platform
// is 120 up = unreachable, but the old band check ignored the ceiling and allowed it).
// Per box-configuration graph: resting boxes SPLIT the wall-top surfaces they block
// (their 40px body covers the 36px walk band) and their own tops are standable
// surfaces. Without that, levels whose solution runs along box tops (L18: over the
// wall, onto a box top, then off its lip into a roofed corridor) are unplannable —
// the corridor floor looks contiguous with the open floor and the nav aims straight
// into the wall body. Falls are modeled off the facing lip with a clear landing
// column (any height); jumps need 107px clear above takeoff AND landing columns
// (a roofed corridor can't be jumped out of, but an open gap can be hopped).
function surfaceGraph(st, boxes) {
  const qb = boxes ? boxes.map(b => ({ x: Math.round(b.x / 4) * 4, y: Math.floor(b.y + 0.001) })) : null;
  const key = qb ? qkey(qb) : '~';
  if (!st.__surfCache) st.__surfCache = new Map();
  if (st.__surfCache.has(key)) return st.__surfCache.get(key);
  let segs = [];
  for (let r = 1; r < st.rows; r++) for (let c = 0; c < st.cols; c++) {
    if (!solidAt(st, r, c) || solidAt(st, r - 1, c)) continue;
    const last = segs[segs.length - 1];
    if (last && last.y === r * TILE && last.x1 === c * TILE) last.x1 = (c + 1) * TILE;
    else segs.push({ y: r * TILE, x0: c * TILE, x1: (c + 1) * TILE });
  }
  if (qb && qb.length) {
    // body band [S.y-36, S.y) blocked by a box resting on (or crossing) the surface
    const split = (s) => {
      const cuts = qb.filter(o => o.y < s.y && o.y + TILE > s.y - 36 && o.x < s.x1 && o.x + TILE > s.x0).sort((p, q2) => p.x - q2.x);
      const out = []; let x = s.x0;
      for (const o of cuts) { if (o.x > x) out.push({ y: s.y, x0: x, x1: Math.min(o.x, s.x1) }); x = Math.max(x, o.x + TILE); }
      if (x < s.x1) out.push({ y: s.y, x0: x, x1: s.x1 });
      return out.length ? out : [];
    };
    segs = segs.flatMap(split);
    for (const o of qb) {
      if (isWallRect(st, o.x, o.y - 35, TILE, 35)) continue; // <36px headroom — not standable
      if (qb.some(q2 => q2 !== o && q2.y + TILE > o.y - 36 && q2.y < o.y && q2.x < o.x + TILE && q2.x + TILE > o.x)) continue; // stacked box blocks the band
      segs.push({ y: o.y, x0: o.x, x1: o.x + TILE });
    }
    segs.sort((a, b) => a.y - b.y || a.x0 - b.x0);
  }
  const clear = (x, y, w, h) => !isWallRect(st, x, y, w, h);
  // jump-capable columns per seg (107px open above — a full apex's worth)
  const cols = segs.map(s => { const out = []; for (let x = s.x0; x <= s.x1 - 28; x += 8) if (clear(x, s.y - 107, 28, 107)) out.push(x); return out; });
  const n = segs.length;
  const adj = Array.from({ length: n }, () => []);
  const gap = (a, b) => Math.max(0, Math.max(a.x0 - b.x1, b.x0 - a.x1));
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    if (a === b) continue;
    const A = segs[a], B = segs[b];
    const gp = gap(A, B);
    let ok = false;
    if (A.y === B.y) ok = gp <= 4;                                    // walk across
    else if (B.y > A.y) {                                             // fall off the facing lip, any height
      const right = (B.x0 + B.x1) / 2 >= (A.x0 + A.x1) / 2;
      const e = right ? A.x1 : A.x0;
      // walk-to-lip: the last 28px before support is lost must be body-clear — a wall
      // or box face flush with the lip (L18: the row-5 wall against a box's top) pins
      // the player while still supported, so the fall never starts
      let walk = true;
      const wl = right ? Math.max(A.x0, A.x1 - 28) : A.x0 - 28, wh = right ? A.x1 : A.x0;
      for (let x = wl; x <= wh && walk; x += 4)
        walk = clear(x, A.y - 36, 28, 36) && !qb.some(o => o.x < x + 28 && o.x + TILE > x && o.y < A.y && o.y + TILE > A.y - 36);
      // landing window must scale with fall height: an 80px fall drifts ~65px of walk
      // momentum, a jump off the lip ~176px — the old fixed ±48 window made tall falls
      // (L26: platform lip to the floor under it) look like they land nowhere reachable
      const drift = Math.min(200, 4 + 3.7 * (21 + Math.sqrt(2 * (106 + B.y - A.y) / 0.5)));
      const lo = Math.max(B.x0, right ? e - 28 : e - 28 - drift), hi = Math.min(B.x1 - 28, right ? e + drift : e);
      if (walk) for (let x = lo; x <= hi && !ok; x += 8) ok = clear(x, A.y, 28, B.y - A.y);
    } else if (A.y - B.y <= 106 && gp <= 80) {                        // jump up: apex 106.8, ~80 gap
      for (let bi2 = 0; bi2 < cols[a].length && !ok; bi2++) {
        const xt = cols[a][bi2];
        for (let bj = 0; bj < cols[b].length && !ok; bj++) {
          const xl = cols[b][bj];
          if (Math.abs(xl - xt) <= 100 && clear((xt + xl) / 2 - 14, B.y - 106, 28, 106)) ok = true;
        }
      }
    }
    if (ok) adj[a].push(b);
  }
  const closure = segs.map((_, s) => {
    const seen = new Set([s]), q = [s];
    while (q.length) { const u = q.shift(); for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); q.push(v); } }
    return seen;
  });
  let spawnSid = -1;
  if (st.player) {
    const fy = spawnFeet(st);
    spawnSid = segs.findIndex(s => s.y === fy && st.player.x >= s.x0 - 20 && st.player.x <= s.x1 + 20);
  }
  const surf = { segs, adj, closure, spawnSid };
  if (st.__surfCache.size > 512) st.__surfCache.clear();
  st.__surfCache.set(key, surf);
  return surf;
}
// can the player actually ENTER a window spot x on surface S? Standing there isn't enough:
// the spot needs a drop-in column (wall-free from S.y-106 up — a jump-apex's worth, which
// also covers falls from higher) or a walk corridor from another enterable column on the
// same support. L15 is the canonical case: the lower-left floor spots are standable but
// sit under a solid wall block, and the only open approach (the shaft) is blocked by the
// very box we want to push — such windows must prune so the planner drifts the box clear
// of the overhang instead of promising an unexecutable push.
function windowReachable(st, boxes, bi, S, x, allowed, surf) {
  const colClear = (cx) => !isWallRect(st, cx, S.y - 106, 28, 106);
  if (colClear(x)) return true;
  const segs = surf.segs;
  // lip-fall entry: walk off a reachable higher surface's lip and land near it (the
  // fall column needs only the drop clearance, not a jump apex — L18's corridor is
  // entered by stepping off a box top beside it, under a wall the apex rule rejects)
  const lipEntry = (x2) => {
    const sIdx = surf.segs.indexOf(S);
    for (let t = 0; t < segs.length; t++) {
      const T = segs[t];
      if (T.y >= S.y) continue;
      if (allowed && !allowed.has(t)) continue;
      // the T->S fall must be a real graph edge: the edge builder verifies the walk to
      // T's lip is body-clear, which this column scan alone cannot see (L18's sealed
      // corridor looked enterable by "falling off" a box top whose lip is walled off)
      if (sIdx < 0 || !surf.adj[t].includes(sIdx)) continue;
      const nearL = x2 >= T.x0 - 72 && x2 <= T.x0 - 24, nearR = x2 >= T.x1 - 24 && x2 <= T.x1 + 44;
      if (!nearL && !nearR) continue;
      if (!isWallRect(st, x2, T.y, 28, S.y - T.y)) return true;
    }
    return false;
  };
  // jump-up / fall-arc entries from other reachable surfaces: e.g. L29's row5-top windows
  // are roofed by row2 walls but reached by jumping UP from the row7 ledge below
  for (let t = 0; t < segs.length; t++) {
    if (segs[t] === S) continue;
    if (allowed && !allowed.has(t)) continue;
    const T = segs[t];
    if (T.y > S.y && T.y - S.y <= 106) {
      // jump up onto S: takeoff within drift range of the window, standable spot on T
      if (x + 28 < T.x0 - 60 || x > T.x1 + 60) continue;
      for (let x2 = Math.max(T.x0, x - 80); x2 <= Math.min(T.x1 - 28, x + 80); x2 += 8)
        if (!isWallRect(st, x2, T.y - 36, 28, 36)) return true;
    } else if (T.y < S.y) {
      // fall/arc down onto S from a higher surface: unobstructed column T.y..S.y at x
      if (x + 28 < T.x0 - 24 || x > T.x1 + 24) continue;
      if (!isWallRect(st, x, T.y, 28, S.y - T.y)) return true;
    }
  }
  const b = boxes[bi];
  for (let x2 = S.x0; x2 <= S.x1 - 28; x2 += 8) {
    if (Math.abs(x2 - x) < 8) continue;
    if (!colClear(x2) && !lipEntry(x2)) continue;
    if (isWallRect(st, x2, S.y - 36, 28, 36)) continue;
    const cl = Math.min(x, x2);
    let ch = Math.max(x, x2) + 28;
    if (Math.max(x, x2) === x) ch -= 4; // tolerate the pushed box touching the window edge
    if (isWallRect(st, cl, S.y - 36, ch - cl, 36)) continue;
    let blocked = false;
    for (let j = 0; j < boxes.length; j++) {
      const o = boxes[j];
      if (o.x < ch && o.x + TILE > cl && o.y < S.y && o.y + TILE > S.y - 36) { blocked = true; break; }
    }
    if (!blocked) return true;
  }
  return false;
}
// can the player contact box i to push it in dir, standing/aerial from any surface in `allowed`?
// contact = player feet A ∈ (b.y+4, b.y+76) (body band [b.y+4, b.y+40) needs A-36 < b.y+40, A > b.y+4),
// reachable from surface S by a jump (A ≥ S.y − 106) with the body itself wall/box-free —
// the body-free test is also what enforces ceilings (jumping under a low roof can't reach the band).
function canPush(st, boxes, i, dir, allowed, surf) {
  const b = boxes[i];
  const lo = dir === 1 ? b.x - 62 : b.x + 37, hi = dir === 1 ? b.x - 25 : b.x + 74;
  for (let s = 0; s < surf.segs.length; s++) {
    if (allowed && !allowed.has(s)) continue;
    const S = surf.segs[s];
    if (S.y <= b.y + 5) continue; // surface must be above the band bottom
    const aTop = Math.min(b.y + 74, S.y), aBot = Math.max(b.y + 6, S.y - 106);
    for (let x = lo; x <= hi; x += 4) {
      if (Math.max(S.x0 - (x + 28), x - S.x1) > 80) continue; // too far to drift in mid-jump
      if (isWallRect(st, x, S.y - 36, 28, 36)) continue;      // no standing body at the window
      if (!windowReachable(st, boxes, i, S, x, allowed, surf)) continue;
      for (let A = aTop; A >= aBot; A -= 8) {
        if (isWallRect(st, x, A - 36, 28, 36)) continue;
        let blocked = false;
        for (let j = 0; j < boxes.length; j++) {
          if (j === i) continue;
          const o = boxes[j];
          if (x < o.x + TILE && x + 28 > o.x && A - 36 < o.y + TILE && A > o.y) { blocked = true; break; }
        }
        if (!blocked) return true;
      }
    }
  }
  return false;
}
// which surface the player ends up on after pushing to dest: the support top on the
// PUSH side of the box (dir -1 leaves the player right of it). Surfaces are identified
// by signature, not index — seg ids are only stable within one box-configuration's graph.
// Plain edge-falls release at the lip, so the player keeps its current surface.
const segSig = (s) => s.y + ':' + Math.round(s.x0) + ':' + Math.round(s.x1);
function sideSig(dest, curSig, surfNB) {
  if (dest.event === 'fall' && Math.abs(dest.x - dest.edgeX) < 3) return curSig;
  const want = dest.y + TILE;
  const near = (s, w0, w1) => s.y === want && s.x0 < w1 && w0 < s.x1;
  let seg = surfNB.segs.find(s => near(s, dest.x + TILE, dest.x + TILE + 76)); // dir -1: player follows on the right
  if (!seg) seg = surfNB.segs.find(s => near(s, dest.x - 76, dest.x));        // dir 1: on the left
  if (!seg) seg = surfNB.segs.find(s => near(s, dest.x - 60, dest.x + TILE + 60));
  return seg ? segSig(seg) : curSig;
}

// BFS over abstract box states; returns list of push steps [{i, dir, toX, toY}]
// bans: "stateKey:i:dir[:toX]" pushes known unexecutable; visited: state keys already seen live.
// Each state carries the player's current surface SIGNATURE (stable across graphs) —
// pushes are only expanded if the box's contact band is reachable from a surface in the
// closure of the current one (see surfaceGraph).
function planLevel(st, start, bans, visited, allowDrift, opts) {
  if (goalReached(st, start)) return [];
  const noContact = (opts && opts.noContact) || process.env.NOCONTACT;
  const dl = opts && opts.deadline; // wall-clock backstop — the BFS can otherwise outlive
  //                            its level's whole budget (60000 expansions × canPush)
  const surf0 = surfaceGraph(st, start);
  let sig0 = null;
  if (opts && opts.pAt) { // plan from where the player actually stands, not the spawn
    const feet = opts.pAt.y + (opts.pAt.h || 36);
    const s = surf0.segs.findIndex(sg => Math.abs(sg.y - feet) <= 8 && opts.pAt.x + 28 > sg.x0 && opts.pAt.x < sg.x1);
    if (s >= 0) sig0 = segSig(surf0.segs[s]);
  }
  if (sig0 == null && surf0.spawnSid >= 0) sig0 = segSig(surf0.segs[surf0.spawnSid]);
  if (sig0 == null) sig0 = '*';
  const seen = new Set([qkey(start) + '@' + sig0]);
  // greedy best-first, not FIFO: states with more boxes already on targets expand first
  // (ties by depth). Plain BFS drowns at branching ~40^depth — L31/L39 need 7-8 pushes
  // and the 60000-expansion cap expires before any goal depth is reached.
  const buckets = Array.from({ length: 256 }, () => []);
  const bkey = (bs, d) => {
    let off = 0;
    for (const b of bs) if (!st.targets.some(t => Math.abs(t.x - b.x) < 2 && Math.abs(t.y - b.y) < 2)) off++;
    return Math.min(15, off) * 16 + Math.min(15, d);
  };
  buckets[bkey(start, 0)].push({ bs: start, steps: [], ssig: sig0 });
  let qn = 1;
  for (let iter = 0; iter < 60000 && qn; iter++) {
    let bk = -1;
    for (let t = 0; t < 256; t++) if (buckets[t].length) { bk = t; break; }
    const { bs, steps, ssig } = buckets[bk].shift(); qn--;
    if ((iter & 255) === 255 && dl && Date.now() > dl) return null;
    if (steps.length >= 9) continue; // depth cap — solutions never need more pushes
    const sk = qkey(bs);
    const surf = surfaceGraph(st, bs);
    const sid = surf.segs.findIndex(sg => segSig(sg) === ssig);
    const allowed = sid >= 0 ? surf.closure[sid] : null;
    for (let i = 0; i < bs.length; i++) for (const dir of [-1, 1]) {
      if (bans.has(sk + ':' + i + ':' + dir)) continue;
      if (!noContact && !canPush(st, bs, i, dir, allowed, surf)) { if (process.env.PLANDBG) console.error('   prune', JSON.stringify(bs), 'box', i, 'dir', dir); continue; }
      for (const dest of enumeratePushes(st, bs, i, dir, allowDrift)) {
        if (bans.has(sk + ':' + i + ':' + dir + ':' + Math.round(dest.x))) continue;
        const raw = bs.map(b => ({ ...b }));
        const old = { x: raw[i].x, y: raw[i].y };
        raw[i] = { x: dest.x, y: dest.y };
        const nb = cascadeSettle(st, raw); // boxes above a pushed-out support drop
        const nSig = sideSig(dest, ssig, surfaceGraph(st, nb));
        const k = qkey(nb) + '@' + nSig;
        if (seen.has(k) || visited.has(qkey(nb))) continue;
        seen.add(k);
        const nsteps = steps.concat([{ i, dir, fromX: old.x, fromY: old.y, toX: dest.x, toY: dest.y, event: dest.event, edgeX: dest.edgeX }]);
        if (goalReached(st, nb)) return nsteps;
        buckets[bkey(nb, nsteps.length)].push({ bs: nb, steps: nsteps, ssig: nSig }); qn++;
      }
    }
  }
  return null;
}

// ---------- engine harness ----------
const g = bootGame('boxrob', { inject: {
  anchor: 'function update(dt) {',
  exports: `globalThis.__R = {
    n: () => LEVELS.length,
    load: (i) => startLevel(i),
    done: () => gameState === 'complete',
    state: () => gameState,
    boxes: () => boxes.map(b => ({ x: b.x, y: b.y })),
    p: () => ({ x: player.x, y: player.y, w: player.w, h: player.h, ground: player.onGround }),
    snap: () => JSON.stringify({ p: { x: player.x, y: player.y, vx: player.vx, vy: player.vy, onGround: player.onGround }, b: boxes.map(b => ({ x: b.x, y: b.y })), m: moveCount, st: gameState, t: levelTime }),
    restore: (s) => { const o = JSON.parse(s); player.x = o.p.x; player.y = o.p.y; player.vx = o.p.vx; player.vy = o.p.vy; player.onGround = o.p.onGround; boxes.forEach((b, i) => { b.x = o.b[i].x; b.y = o.b[i].y; }); moveCount = o.m; undoStack = []; gameState = o.st; levelTime = o.t; particles = []; },
    // in-page nav-macro executor: runs an entire held-move macro (keys toggled directly,
    // update() called per frame — no render, no rAF) and returns the outcome in ONE call.
    // Mirrors the Node-side navMacro semantics: pred fire / win / drift-abort / settle.
    key: (code, on) => { keys[code] = !!on; },
    step: () => { update(1 / 60); return JSON.stringify({ g: player.onGround, sp: keys['Space'], vy: Math.round(player.vy), y: +player.y.toFixed(1), x: +player.x.toFixed(1), lj: lastJumpPress, jb: +jumpBufferTimer.toFixed(3) }); },
    macro: (argJs) => {
      const a = JSON.parse(argJs);
      const go = () => { if (currentScreen === 'game' && gameState === 'playing') { update(1 / 60); return true; } return false; };
      const code = a.d === 1 ? 'ArrowRight' : a.d === -1 ? 'ArrowLeft' : null;
      const b0 = a.b0, boxY = a.boxY;
      const pred = a.pred ? () => {
        const b = boxes[a.bi], p = player;
        if (Math.abs(p.vy) > 80) return false;
        const gap = a.pd === 1 ? b.x - (p.x + p.w) : p.x - (b.x + 40);
        return Math.abs((p.y + p.h) - (boxY + 40)) <= 6 && gap > -3 && gap < 34;
      } : null;
      // the push TARGET itself gets extra slack: entering its push window unavoidably
      // grazes it through the contact band (+10..25px toward pd) — it's the box we're
      // about to push anyway. Drift AGAINST pd (the box shoved the wrong way) is never
      // recoverable and only breeds fake-progress states — abort those after 12px.
      // Other boxes keep the tight cumulative bound.
      const drifted = () => boxes.some((b, k) => {
        if (Math.abs(b.y - b0[k][1]) > 0.6) return true;
        const dx = b.x - b0[k][0];
        // a box already sitting on a target is never fair game to shove while positioning
        // (L18: walk macros nudged a solved box 18px off its pad, then the level budget
        // died trying to push it back)
        if (a.bi !== k && targets.some(t => Math.abs(t.x - b0[k][0]) < 2 && Math.abs(t.y - b0[k][1]) < 2)) return Math.abs(dx) > 2;
        if (a.bi === k) return Math.abs(dx) > (dx * (a.pd || 1) >= 0 ? 40 : 12);
        return Math.abs(dx) > 24;
      });
      const fin = (r) => { if (code) keys[code] = false; keys['Space'] = false; return JSON.stringify({ r }); };
      const relAt = a.k === 'jhlate' ? 8 + (a.o || 0) : (a.o || 0);
      const isWalk = a.k === 'walk' || a.k === 'whop';
      if (isWalk || a.k === 'jump' || a.k === 'jhop') if (code) keys[code] = true;
      const maxF = isWalk ? 340 : 170;
      let stillX = 0, lastX = null, stable = 0, lastY = null, jf = -1;
      for (let i = 0; i < maxF; i++) {
        if ((a.k === 'jlate' || a.k === 'jhlate') && i === 8 && code) keys[code] = true;
        if (!isWalk) {
          // the engine's jump is PRESS-EDGE triggered (jumpPress && !lastJumpPress) and
          // onGround flickers with the resting parity jitter (~1 of 3 frames true) — a
          // Space held from macro start that misses the first ground frame is lost
          // forever. Re-edge Space every ground frame until the jump actually fires.
          keys['Space'] = jf < 0 ? !!player.onGround : false;
        }
        // release offsets count from the ACTUAL jump frame (takeoff may be delayed by
        // the edge-retry above), falling back to macro-start when no jump happens
        const rel = jf < 0 ? relAt : jf + (a.o || 0);
        if ((a.k === 'jhop' || a.k === 'jhlate' || a.k === 'whop') && code && i === rel) keys[code] = false;
        if (!go() || gameState === 'complete') return fin(gameState === 'complete' ? 'win' : 'ok');
        if (a.dbg) console.error('  f' + i, 'g=' + player.onGround, 'sp=' + keys['Space'], 'vy=' + player.vy.toFixed(0), 'y=' + player.y.toFixed(1), 'x=' + player.x.toFixed(1), 'jf=' + jf);
        if (jf < 0 && !isWalk && player.vy < -300) jf = i;
        if (pred && (i & 1) === 0 && pred()) return fin('pred');
        const p = player;
        if (Math.abs(p.x - (lastX === null ? p.x : lastX)) < 0.01) stillX++; else stillX = 0;
        lastX = p.x;
        if (Math.abs(p.y - (lastY === null ? p.y : lastY)) < 0.01) stable++; else stable = 0;
        lastY = p.y;
        if ((i & 7) === 7 && drifted()) return fin('drift');
        if (isWalk) { if (stillX > 22 && Math.abs(p.vy) < 5) break; }
        else if (i > 12 && stable > 10 && Math.abs(p.vy) < 5) break;
      }
      if (code) keys[code] = false; keys['Space'] = false;
      let last = '', same = 0;
      for (let i = 0; i < 12 && same < 3; i++) {
        if (!go() || gameState === 'complete') return fin(gameState === 'complete' ? 'win' : 'ok');
        const s = JSON.stringify(boxes.map(b => [Math.round(b.x * 10) / 10, Math.floor(b.y)])) + '|' + Math.floor(player.y);
        if (s === last) same++; else { same = 0; last = s; }
      }
      if (pred && pred()) return fin('pred');
      return fin(drifted() ? 'drift' : 'ok');
    },
  };`,
} });

let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };
T('boot-clean', g.loadErrors.length === 0, JSON.stringify(g.loadErrors[0] || '').slice(0, 120));
const N = g.call('__R.n()');
T('levels-exist', N === 40, 'n=' + N);

function press(code, on) {
  g.sandbox.dispatchEvent({ type: on ? 'keydown' : 'keyup', code, key: code.replace('Arrow', ''), preventDefault() {} });
}
// resting entities jitter y by ±0.5px each frame (gravity adds 30/s, collision snaps
// back) — quantize y down so quiescence and frozen-box checks see through the parity
const boxSig = (boxes) => JSON.stringify(boxes.map(b => [Math.round(b.x * 10) / 10, Math.floor(b.y)]));
function settle(maxFrames) {
  let last = '', same = 0;
  for (let i = 0; i < (maxFrames || 60) && same < 3; i++) {
    g.pump(1);
    if (g.call('__R.done()')) return true;
    if ((i & 3) === 3) { const s = boxSig(g.call('__R.boxes()')) + '|' + Math.floor(g.call('__R.p()').y); if (s === last) same++; else { same = 0; last = s; } }
  }
  return g.call('__R.done()');
}
// player-only nav macros now execute INSIDE the page (__R.macro in the inject above —
// one bridge call per macro instead of ~100; identical semantics: pred fire / win /
// drift-abort / settle-then-recheck). Macro kinds:
//   walk — hold dir until blocked/settled (walks off ledges, falls, keeps walking)
//   jump — Space+dir together from takeoff (full-hold flight)
//   jhop — dir held from takeoff, RELEASED at frame `off` (short mid-air drift → short landing)
//   jlate/jhlate — Space first, dir from frame 8 (rise past a box top before drifting over it)
//   whop — walk with dir released at `off` (a release stops ledge-walk drift at the lip)
// blind fallback set (aim === null): coarse offsets both directions
const NAVS_BLIND = [
  ['walk', 1], ['walk', -1],
  ['jhop', 1, 12], ['jhop', 1, 24], ['jhop', -1, 12], ['jhop', -1, 24],
  ['jhlate', 1, 12], ['jhlate', -1, 12],
  ['whop', 1, 10], ['whop', 1, 30], ['whop', -1, 10], ['whop', -1, 30],
];
// horizontal speed is 220px/s = 3.667px/frame — convert a wanted drift to a release frame
const PX_PER_FRAME = 220 / 60;
// aimed macro list for a state at x toward aim.x: walk both ways + precise jhop/whop
// release offsets around the exact needed drift (±4 frames ≈ ±15px, pred windows are ±18px)
function navsFor(x, aim) {
  const out = [['walk', 1], ['walk', -1]];
  const dx = aim - x, dir = dx >= 0 ? 1 : -1;
  const base = Math.round(Math.abs(dx) / PX_PER_FRAME);
  // dense release ladder: mid-flight shelves (a box top under the arc) catch the descent
  // long before the aim distance, so every ~11px step needs its own bracket (L18: the
  // window sits 178px away but the flight must land 77px in, just past an intervening box)
  const jOffs = new Set();
  for (let o = 3; o <= Math.min(44, base + 4); o += 3) jOffs.add(o);
  jOffs.add(Math.max(3, Math.min(44, base - 2))); jOffs.add(Math.max(3, Math.min(44, base + 4)));
  // jumping OVER a box to its far side needs ~dx+box-width of flight — bracket that too
  const over = Math.round((Math.abs(dx) + 80) / PX_PER_FRAME);
  jOffs.add(Math.max(3, Math.min(44, over - 3))); jOffs.add(Math.max(3, Math.min(44, over + 3)));
  const wOffs = [base - 2, base + 4].map(o => Math.max(3, Math.min(90, o))); // walking can go far
  for (const o of jOffs) out.push(['jhop', dir, o]);
  for (const o of wOffs) out.push(['whop', dir, o]);
  out.push(['jump', dir]); // full-hold flight — the longest drift onto a ledge top (jhop always releases)
  if (base > 12) out.push(['jhlate', dir, Math.max(2, Math.min(30, base - 8))]);
  // short retreats the OTHER way: reposition a takeoff (e.g. clear a box corner before hopping on top)
  out.push(['whop', -dir, 3], ['whop', -dir, 8]);
  return out;
}

// frontier dedup key: player position (8px buckets) + box signature (16px buckets) —
// player-only keys collapsed branches whose tolerated box nudges differ, letting a
// degraded branch shadow a clean one
function navKey(snap) {
  const o = JSON.parse(snap);
  return (o.p.x / 8 | 0) + ',' + (Math.floor(o.p.y) / 8 | 0) + '|' + o.b.map(b => (b.x / 16 | 0) + ':' + (b.y / 40 | 0)).join(',');
}
// BFS the player to a predicate over held-move edges; boxes stay frozen.
// aim: null (blind) | number (static x) | fn(p) -> {x, y} (dynamic per-state aim, used
// for routed climbs so each hop targets the next surface instead of the far goal)
// mp: {bi, boxY, pd} — push-window params for the in-page pred (fires mid-macro)
function navigate(pred, budgetMs, aim, aimY, mp) {
  const t0 = Date.now();
  const NAVSTAT = { false: 0, state: 0, seen: 0, edges: 0 };
  const entry = g.call('__R.snap()');
  const entryB0 = JSON.parse(entry).b.map(b => [b.x, b.y]);
  let frontier = [entry];
  const seen = new Set([navKey(entry)]);
  if (pred()) return true;
  const aimAt = (p) => typeof aim === 'function' ? aim(p) : { x: aim, y: aimY };
  for (let depth = 0; depth < 14 && frontier.length; depth++) {
    if (Date.now() - t0 > (budgetMs || 1500)) break;
    if (NAVSTAT.edges > 6000) break; // backstop; the wall-clock budget is the real bound
    const next = [];
    for (const snap of frontier) {
      const o0 = JSON.parse(snap);
      const sp = o0.p;
      const A = aimAt(sp);
      const navs = A.x == null ? NAVS_BLIND : navsFor(sp.x, A.x);
      const b0arr = entryB0; // cumulative-drift bound: every macro is measured against the nav ENTRY, so accepted paths can't accumulate nudges
      for (const [kind, dir, off] of navs) {
        if (Date.now() - t0 > (budgetMs || 1500)) break;
        g.call(`__R.restore(${JSON.stringify(snap)})`);
        const arg = JSON.stringify({ k: kind, d: dir, o: off, b0: b0arr, bi: mp && mp.bi, boxY: mp && mp.boxY, pd: mp && mp.pd, pred: mp ? 1 : 0 });
        const res = JSON.parse(g.call(`__R.macro(${JSON.stringify(arg)})`));
        NAVSTAT.edges++;
        if (process.env.NAVM) console.error('   m', kind, dir, off, '->', res.r, 'P', JSON.stringify(g.call('__R.p()')));
        if (res.r === 'win' || res.r === 'pred') return true;
        if (res.r === 'drift') { if (process.env.NAVDBG) NAVSTAT.false++; continue; } // disturbed a box
        if (g.call('__R.state()') !== 'playing') { if (process.env.NAVDBG) NAVSTAT.state++; continue; }
        const s2 = g.call('__R.snap()');
        const key = navKey(s2);
        if (!seen.has(key)) { seen.add(key); next.push(s2); } else if (process.env.NAVDBG) NAVSTAT.seen++;
      }
    }
    // process states nearest the aim first — the pred usually follows within 1-2 hops of it.
    // y weighs double: a state on the box top / aim's surface beats a same-x state a floor above.
    if (aim != null) {
      // drift from the nav ENTRY is spent budget (drift is cumulative vs entry) — a nudged
      // state near the aim has nothing left to spend on the final crossing, so penalize it
      // hard and let clean states get expanded first (L18: b1-nudged states crowded out
      // every state that could still cross into the push window)
      const driftOf = (s) => { const o = JSON.parse(s); return Math.max(0, ...o.b.map((b, k) => Math.abs(b.x - entryB0[k][0]) * (mp && mp.bi === k ? 3 : 5))); };
      // route-stage dominates: a state mid-route is one hop from the window even though its
      // y sits a full surface below the NEXT hop's aim — a raw y-term punished exactly those
      // states and let unreachable floor states on the wrong side of a wall win the sort
      // (L18: 131 macros landed on the box-top hop state at w174; floor creepers sat at w53)
      const w = (s) => { const o = JSON.parse(s); const p = o.p; const A = aimAt(p); const st = A.st ?? 0; return 300 * st + Math.abs(p.x - A.x) + (st === 0 ? 2 * Math.abs(p.y - (A.y ?? p.y)) : 0) + driftOf(s); };
      next.sort((a, b) => w(a) - w(b));
    }
    frontier = next.slice(0, 150);
    if (process.env.NAVDBG) console.error('  nav depth', depth, 'frontier', frontier.length, JSON.stringify(NAVSTAT), frontier.slice(0, 8).map(s => { const p = JSON.parse(s).p; return Math.round(p.x) + ',' + Math.round(p.y); }).join(' '));
  }
  // FAIL: put the game back where it was found — the BFS's tolerated ≤24px box nudges
  // accumulate per depth, and handing the caller a silently-shoved position (L18: b1
  // walked +158px right during one failed nav) wrecks every subsequent replan
  g.call(`__R.restore(${JSON.stringify(entry)})`);
  if (process.env.NAVDBG) console.error('  NAV-FAIL from P', JSON.stringify(g.call('__R.p()')), 'B', JSON.stringify(g.call('__R.boxes()')));
  return false;
}

// shortest surface path over the SAME adjacency the planner used — lets the nav aim at
// the NEXT hop of a multi-ledge climb instead of discovering it by BFS luck
function segRoute(surf, fromSid, toSid) {
  const { segs, adj } = surf;
  const prev = new Array(segs.length).fill(-1);
  prev[fromSid] = fromSid;
  const q = [fromSid];
  while (q.length) {
    const u = q.shift();
    if (u === toSid) break;
    for (const v of adj[u]) if (prev[v] === -1) { prev[v] = u; q.push(v); }
  }
  if (prev[toSid] === -1) return null;
  const path = [];
  for (let u = toSid; u !== fromSid; u = prev[u]) path.unshift(u);
  return path;
}
// exact span containment first (split floor pieces sit 40px apart — the ±80 slack of the
// fallback would return the WRONG piece for a window inside a box-delimited corridor)
const sidAt = (surf, x, feet) => {
  const exact = surf.segs.findIndex(s => Math.abs(s.y - feet) <= 8 && x + 28 > s.x0 && x < s.x1);
  if (exact >= 0) return exact;
  return surf.segs.findIndex(s => Math.abs(s.y - feet) <= 8 && x + 28 > s.x0 - 80 && x < s.x1 + 80);
};

// execute one planned push: navigate behind the box, hold key, watch for the event
const dirSignedPast = (x, target, dir) => dir === 1 ? x >= target - 0.5 : x <= target + 0.5;
function execPush(step, boxesNow, navBudget, st) {
  const boxY = boxesNow[step.i].y;
  const dirCode = step.dir === 1 ? 'ArrowRight' : 'ArrowLeft';
  const isEdgeDest = step.event !== 'fall' || Math.abs(step.toX - step.edgeX) < 3;
  const pred = () => {
    const p = g.call('__R.p()');
    // no p.ground requirement — the ground flag parity-flickers at rest; feet alignment
    // + small |vy| identifies "standing on the box's support" robustly
    if (Math.abs(p.vy) > 80) return false;
    if (Math.abs((p.y + p.h) - (boxY + TILE)) > 6) return false; // feet on the box's support
    const gap = step.dir === 1 ? g.call('__R.boxes()')[step.i].x - (p.x + p.w) : p.x - (g.call('__R.boxes()')[step.i].x + TILE);
    return gap > -3 && gap < 34;
  };
  // routed aim: if the push window sits on a far surface, aim each nav hop at the next
  // surface along the route instead of at the box (the box aim makes BFS waste its
  // budget discovering the climb). The graph is built from the CURRENT box positions
  // and frozen for the whole nav — box tops the chain must run along (L18) are segs.
  let route = null, segs = null;
  if (st) {
    const surf = surfaceGraph(st, boxesNow);
    const pNow = g.call('__R.p()');
    const from = sidAt(surf, pNow.x, pNow.y + pNow.h);
    const to = sidAt(surf, boxesNow[step.i].x + (step.dir === 1 ? -43 : 55), boxY + TILE);
    if (from >= 0 && to >= 0 && from !== to) {
      route = segRoute(surf, from, to);
      segs = surf.segs;
    }
  }
  const finalAim = () => ({ x: boxesNow[step.i].x + (step.dir === 1 ? -43 : 55), y: boxY + TILE - 36, st: 0 });
  const aimFor = (p) => {
    if (!route || !route.length) return finalAim();
    const feet = p.y + 36;
    // near-exact span membership: the ±80 slack let floor states LEFT of a box-delimited
    // corridor claim "on the corridor" and take the final aim — they then out-ranked the
    // box-top hop states that are the only real way in, and the frontier spent its whole
    // budget creeping floor states into the wall (L18 iter2 nav-fail)
    const onSeg = (s) => Math.abs(s.y - feet) <= 8 && p.x + 28 > s.x0 - 12 && p.x < s.x1 + 12;
    for (let j = route.length - 1; j >= 0; j--) {
      const s = segs[route[j]];
      if (onSeg(s)) {
        if (j + 1 < route.length) {
          const t = segs[route[j + 1]];
          return { x: Math.max(t.x0 + 2, Math.min(t.x1 - 30, (t.x0 + t.x1) / 2 - 14)), y: t.y - 36, st: route.length - (j + 1) };
        }
        return finalAim(); // already on the last hop's surface — go for the window itself
      }
    }
    // player is on none of the route's surfaces (a box top mid-route, the floor past a
    // split): aim at the NEAREST route seg. The old fallback re-aimed everything at
    // route[0], pulling mid-route states back toward where they came from (L26: box-top
    // states aimed at the platform above, and the frontier walked back up all budget)
    let best = null;
    for (let j = 0; j < route.length; j++) {
      const t2 = segs[route[j]];
      const ax = Math.max(t2.x0 + 2, Math.min(t2.x1 - 30, p.x));
      const d = Math.abs(ax - p.x) + Math.abs(t2.y - 36 - p.y) * 0.5 + 300 * (route.length - 1 - j);
      if (!best || d < best.d) best = { d, x: ax, y: t2.y - 36, st: route.length - j };
    }
    return { x: best.x, y: best.y, st: best.st };
  };
  if (!navigate(pred, navBudget || 2200, aimFor, null, { bi: step.i, boxY, pd: step.dir })) return 'nav-fail';
  press(dirCode, true);
  let stalled = 0, prevX = null;
  for (let f = 0; f < 420; f++) {
    g.pump(1);
    if (g.call('__R.done()')) { press(dirCode, false); return 'win'; }
    const b = g.call('__R.boxes()')[step.i];
    if (process.env.BXDBG && (f % 10 === 0 || f > 100)) console.error('f' + f, 'P' + JSON.stringify(g.call('__R.p()')), 'B' + JSON.stringify(b));
    let done = false;
    if (step.event === 'fall') {
      if (isEdgeDest) done = dirSignedPast(b.x, step.toX, step.dir) || b.y > boxY + 8;
      // drift dest: hold THROUGH the fall until the box reaches toX (push contact persists
      // while falling — the player follows off the lip); land+stall = contact lost short
      else done = dirSignedPast(b.x, step.toX, step.dir) || (b.y >= step.toY - 2 && stalled > 8) || b.y > step.toY + 40;
    } else {
      done = Math.abs(b.x - step.toX) < 2 || b.y > boxY + 8;
    }
    if (done) break;
    if (prevX !== null && Math.abs(b.x - prevX) < 0.01) { stalled++; if (stalled > 26) { if (process.env.BXDBG) console.error('stall-break f' + f); break; } } else stalled = 0;
    prevX = b.x;
  }
  press(dirCode, false);
  return settle(80) ? 'win' : 'ok';
}

// solve one level: replan from the LIVE box state after every executed push (the abstract
// 4px model and the engine's 2.33px push grid diverge at support edges — replanning
// self-corrects). nav-failed/no-op pushes get banned; a dead end (no plan) restarts the
// level with the first executed move root-banned; drift pushes only enter planning from
// attempt 1 onward (they overshoot and can dead-end otherwise-solvable boxes).
// load + settle a level so boxes land on their abstract positions. The spawn player is
// physical: on levels where it stands in a box's fall path (L37), settling while idle
// shoves that box ~40px into a wall corner and scrambles the puzzle. Walk clear of the
// fall columns first (34f covers the longest spawn drop); keep whichever dodge mode's
// settled boxes deviate least from the abstract settle.
function cleanLoad(i, st) {
  const want = cascadeSettle(st, st.boxes);
  const run = (mode) => {
    g.call(`__R.load(${i})`); g.pump(2);
    const code = mode === 1 ? 'ArrowRight' : mode === -1 ? 'ArrowLeft' : null;
    if (code) { press(code, true); }
    for (let k = 0; k < 34; k++) g.pump(1);
    if (code) press(code, false);
    press('Space', false);
    settle(40);
    let dev = 0;
    g.call('__R.boxes()').forEach((b, k) => { dev += Math.abs(b.x - want[k].x) + Math.abs(Math.floor(b.y + 0.001) - want[k].y); });
    return dev;
  };
  let bestMode = 0, bestDev = Infinity;
  for (const mode of [0, 1, -1]) {
    const dev = run(mode);
    if (dev < 1) return; // clean settle — done
    if (dev < bestDev) { bestDev = dev; bestMode = mode; }
  }
  run(bestMode); // least-bad settle (player interference unavoidable on this layout)
}

function solveLevel(i, deadline) {
  const st = parseMap(LEVELS[i]);
  const rootBans = new Set();
  for (let attempt = 0; attempt < 4; attempt++) {
    cleanLoad(i, st);
    if (settle(6)) return { ok: true }; // already complete (X tiles)
    const bans = new Set(rootBans), visited = new Set();
    // quantize the ±0.5px resting jitter away — target rows are exact multiples of TILE
    const quant = (bs) => bs.map(b => ({ x: b.x, y: Math.floor(b.y + 0.001) }));
    const startKey = qkey(quant(g.call('__R.boxes()')));
    const executed = [];
    let dead = false, why = 'no plan', allowDrift = attempt >= 1;
    for (let iter = 0; iter < 40; iter++) {
      if (Date.now() > deadline - 200) return { ok: false, why: 'level budget (' + why + ')' };
      const boxes = g.call('__R.boxes()').map(b => ({ x: b.x, y: b.y }));
      if (goalReached(st, boxes)) return { ok: true };
      const qb = quant(boxes);
      const k0 = qkey(qb);
      visited.add(k0);
      let plan = planLevel(st, cascadeSettle(st, qb), bans, visited, allowDrift, { pAt: g.call('__R.p()'), deadline: deadline - 400 });
      if (!plan && !allowDrift) { // drift is risky (overshoot dead-ends) but if there is no
        allowDrift = true;        // drift-free plan at all, the level NEEDS it (e.g. L16)
        plan = planLevel(st, cascadeSettle(st, qb), bans, visited, true, { pAt: g.call('__R.p()'), deadline: deadline - 400 });
      }
      if (!plan) plan = planLevel(st, cascadeSettle(st, qb), bans, visited, true, { pAt: g.call('__R.p()'), deadline: deadline - 400, noContact: true }); // last resort: surface model can miss box-top standings
      if (!plan || !plan.length) {
        dead = true; why = 'no plan @ ' + qb.map(b => Math.round(b.x) + ',' + b.y).join(' ');
        break;
      }
      const step = plan[0];
      const r = execPush(step, boxes, Math.min(3400, Math.max(150, deadline - Date.now())), st);
      if (r === 'win') return { ok: true };
      const after = quant(g.call('__R.boxes()'));
      // no-op = nothing meaningfully moved (nav corner-nudges ≤5px don't count as progress);
      // compare quantized-vs-quantized — raw y carries the ±0.5px resting jitter
      const before = quant(boxes);
      const noOp = after.every((b, k) => Math.abs(b.x - before[k].x) < 6 && b.y === before[k].y);
      if (r === 'nav-fail' || noOp) bans.add(k0 + ':' + step.i + ':' + step.dir); // unexecutable / no-op
      executed.push({ ...step, stateKey: k0 });
      why = 'push ' + step.i + ' dir' + step.dir + ' -> ' + r;
    }
    if (!dead) return { ok: false, why: 'iterations exhausted (' + why + ')' };
    if (!executed.length) return { ok: false, why: why + ' [from start]' };
    const f = executed[0];
    rootBans.add(f.stateKey + ':' + f.i + ':' + f.dir + ':' + Math.round(f.toX));
  }
  return { ok: false, why: 'restarts exhausted' };
}

const solved = [], notes = [];
const T0 = Date.now();
const pending = [];
for (let i = 0; i < N; i++) {
  const remain = 110000 - (Date.now() - T0);
  if (remain < 1500) { for (let j = i; j < N; j++) fails.push('L' + (j + 1) + ' unsolved (deadline)'); break; }
  const r = solveLevel(i, Math.min(Date.now() + Math.min(12000, Math.max(2000, remain / (N - i) * 2)), T0 + 106000));
  if (r.ok) solved.push(i + 1); else { fails.push('L' + (i + 1) + ' unsolved'); notes.push('L' + (i + 1) + ': ' + r.why); pending.push({ i, why: r.why }); }
}
// second pass: flappy nav-budget failures get the leftover time with fresh bans —
// a level that failed at 2s of budget often solves at 8s (nondeterministic macro order)
for (let pass = 0; pass < 2 && pending.length; pass++) {
  const remain = 110000 - (Date.now() - T0);
  if (remain < 6000) break;
  for (const pj of pending.slice()) {
    const rem2 = 110000 - (Date.now() - T0);
    if (rem2 < 5000) break;
    const r = solveLevel(pj.i, Math.min(Date.now() + Math.min(10000, rem2 - 3000), T0 + 106000));
    if (r.ok) {
      solved.push(pj.i + 1);
      fails.splice(fails.indexOf('L' + (pj.i + 1) + ' unsolved'), 1);
      const ni = notes.findIndex(n => n.startsWith('L' + (pj.i + 1) + ':'));
      if (ni >= 0) notes.splice(ni, 1);
      pending.splice(pending.indexOf(pj), 1);
    }
  }
}
T('levels-solved', solved.length === N, solved.length + '/' + N + ' missing:[' + [...Array(N).keys()].map(x => x + 1).filter(x => !solved.includes(x)).join(',') + '] ' + notes.slice(0, 6).join(' | '));
T('no-vm-errors', !(g.sandbox.__errors || []).some(e => /TypeError|ReferenceError/.test(e)),
  JSON.stringify((g.sandbox.__errors || []).find(e => /TypeError|ReferenceError/.test(e)) || '').slice(0, 120));

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails: fails.slice(0, 8), extra: { solved: solved.length + '/' + N, notes: notes.slice(0, 10) } };
console.log('boxrob: ' + solved.length + '/' + N + ' levels solved via abstract-plan + real-key replay: ' + out.verdict);
if (notes.length) console.log('misses: ' + notes.slice(0, 10).join(' | '));
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
