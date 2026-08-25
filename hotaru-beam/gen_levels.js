// Hotaru Beam level regenerator — P0 fix: shipped LEVELS beyond L1 are unsolvable
// under the engine's own checkSolved semantics (proven for L2 by forced-beam
// contradiction; solver-confirmed for the rest). This regenerates broken levels
// solution-first: build a random clean path/cycle on the lattice, place circles
// on it, derive each circle's dir/num FROM the constructed solution, validate
// against a faithful checkSolved port. Original tier/gridR/gridC/circle-count/
// numbered-density are preserved per level.
'use strict';
const fs = require('fs');
const src = fs.readFileSync('hotaru-beam/index.html', 'utf8');
const levSrc = src.slice(src.indexOf('var LEVELS=['), src.indexOf('];', src.indexOf('var LEVELS=[')) + 2);
const LEVELS = new Function('return ' + levSrc.replace('var LEVELS=', ''))();
const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
const DIRNAME = {};
for (const k in DIRS) DIRNAME[DIRS[k][0] + ',' + DIRS[k][1]] = k;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// faithful port of engine checkSolved (degree-2 circles, connectivity, numbered traces)
function validate(lv, edges) {
  const circleSet = {}; lv.circles.forEach(c => circleSet[c.r + ',' + c.c] = 1);
  const adj = {};
  for (const k in edges) {
    const p = k.split(/[-,]/);
    const a = p[0] + ',' + p[1], b = p[2] + ',' + p[3];
    (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
  }
  for (const ci of lv.circles) if ((adj[ci.r + ',' + ci.c] || []).length !== 2) return { ok: false, why: 'degree' };
  const start = lv.circles[0].r + ',' + lv.circles[0].c;
  const seen = { [start]: 1 }, q = [start];
  while (q.length) for (const n of (adj[q.shift()] || [])) if (!seen[n]) { seen[n] = 1; q.push(n); }
  for (const ci of lv.circles) if (!seen[ci.r + ',' + ci.c]) return { ok: false, why: 'connectivity' };
  const ek = (r1, c1, r2, c2) => (r1 > r2 || (r1 === r2 && c1 > c2)) ? ek(r2, c2, r1, c1) : r1 + ',' + c1 + '-' + r2 + ',' + c2;
  for (const ci of lv.circles) {
    if (ci.num < 0) continue;
    const d = DIRS[ci.dir], fr = ci.r + d[0], fc = ci.c + d[1];
    if (!edges[ek(ci.r, ci.c, fr, fc)]) return { ok: false, why: 'no dot edge' };
    let cr = fr, cc = fc, pdr = d[0], pdc = d[1], bends = 0, steps = 0;
    const vis = { [ci.r + ',' + ci.c]: 1, [cr + ',' + cc]: 1 };
    while (steps++ < 500) {
      const k = cr + ',' + cc;
      if (circleSet[k] !== undefined) { if (bends !== ci.num) return { ok: false, why: 'bends ' + bends + '!=' + ci.num }; break; }
      const nx = (adj[k] || []).filter(n => !vis[n]);
      if (nx.length !== 1) return { ok: false, why: 'walk branch/dead' };
      const p = nx[0].split(','); const nr = +p[0], nc = +p[1];
      const ndr = nr - cr, ndc = nc - cc;
      if (ndr !== pdr || ndc !== pdc) bends++;
      vis[nx[0]] = 1; cr = nr; cc = nc; pdr = ndr; pdc = ndc;
    }
  }
  return { ok: true };
}

const TIER_TURN = [0, 0.22, 0.32, 0.42, 0.52, 0.62]; // wiggliness by tier (idx=tier)

function genLevel(meta, rng) {
  const R = meta.gridR, C = meta.gridC;
  const nodes = (R + 1) * (C + 1);
  const targetLen = Math.max(Math.round(nodes * (0.55 + rng() * 0.35)), meta.K * 3 + 2);
  // random walk on lattice, self-avoiding, wiggliness p
  const attempts = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    const sr = Math.floor(rng() * (R + 1)), sc = Math.floor(rng() * (C + 1));
    const path = [[sr, sc]];
    const used = new Set([sr + ',' + sc]);
    const edges = [];
    let dir = null;
    while (edges.length < targetLen) {
      const [cr, cc] = path[path.length - 1];
      const opts = [];
      for (const k in DIRS) {
        const [dr, dc] = DIRS[k];
        const nr = cr + dr, nc = cc + dc;
        if (nr < 0 || nr > R || nc < 0 || nc > C) continue;
        if (used.has(nr + ',' + nc)) continue;
        // degree cap: intermediate nodes degree 2 (path) — enforced by self-avoid
        opts.push([nr, nc, k]);
      }
      if (!opts.length) break;
      let pick;
      if (dir && rng() > TIER_TURN[meta.tier] && opts.some(o => DIRS[o[2]][0] === dir[0] && DIRS[o[2]][1] === dir[1])) {
        pick = opts.find(o => DIRS[o[2]][0] === dir[0] && DIRS[o[2]][1] === dir[1]);
      } else {
        pick = opts[Math.floor(rng() * opts.length)];
      }
      edges.push([cr, cc, pick[0], pick[1]]);
      used.add(pick[0] + ',' + pick[1]);
      path.push([pick[0], pick[1]]);
      dir = [pick[0] - cr, pick[1] - cc];
    }
    if (edges.length < targetLen * 0.8) continue;
    // try to close into a cycle if endpoints adjacent
    const [er, ec] = path[path.length - 1], [tr, tc] = path[0];
    let closed = false;
    if (Math.abs(er - tr) + Math.abs(ec - tc) === 1 && path.length > 3) {
      edges.push([er, ec, tr, tc]);
      closed = true;
    }
    attempts.push({ path, edges, closed });
    if (attempts.length >= 6) break;
  }
  if (!attempts.length) return null;
  const cand = attempts[Math.floor(rng() * attempts.length)];
  const { path, edges, closed } = cand;
  // place K circles on interior positions (skip endpoints unless closed), spread >= 2 apart
  const n = path.length;
  const lo = closed ? 0 : 1, hi = closed ? n - 1 : n - 2; // circle node indices along path
  for (let t = 0; t < 30; t++) {
    const positions = [];
    const pool = [];
    for (let i = lo; i < hi; i++) pool.push(i);
    // spread selection: shuffle pool, greedily take with min path-gap 2 (circular if closed)
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    for (const i of pool) {
      const gapOK = positions.every(p => {
        const d1 = Math.abs(p - i);
        const d2 = closed ? Math.min(d1, n - d1) : d1;
        return d2 >= 2;
      });
      if (gapOK) positions.push(i);
      if (positions.length === meta.K) break;
    }
    if (positions.length < meta.K) continue;
    positions.sort((a, b) => a - b);
    // build circle defs from path structure
    const idxAt = {}; path.forEach((p, i) => idxAt[p[0] + ',' + p[1]] = i);
    const edgeSet = {};
    for (const e of edges) {
      const k = e[0] > e[2] || (e[0] === e[2] && e[1] > e[3]) ? e[2] + ',' + e[3] + '-' + e[0] + ',' + e[1] : e[0] + ',' + e[1] + '-' + e[2] + ',' + e[3];
      edgeSet[k] = true;
    }
    const circles = [];
    let okAll = true;
    for (const pi of positions) {
      const [r, c] = path[pi];
      // two neighbors along path (circular wrap if closed)
      const prevN = path[(pi - 1 + n) % n], nextN = path[(pi + 1) % n];
      if (!closed && (pi === 0 || pi === n - 1)) { okAll = false; break; } // endpoint circles impossible
      // choose dot side: prefer next (rng)
      const dotNext = rng() < 0.5;
      const walkFrom = (startIdx, step) => {
        // walk along path from circle at startIdx in direction step; count bends to next circle (stop-at-first-circle)
        const posSet = new Set(positions.map(p => (p + n) % n));
        let bends = 0;
        let i = startIdx;
        let pd = [path[(i + step + n) % n][0] - path[i][0], path[(i + step + n) % n][1] - path[i][1]];
        i = (i + step + n) % n;
        let guard = 0;
        while (guard++ < 2 * n + 4) {
          if (posSet.has(i)) return { bends, at: i };
          const j = (i + step + n) % n;
          const nd = [path[j][0] - path[i][0], path[j][1] - path[i][1]];
          if (nd[0] !== pd[0] || nd[1] !== pd[1]) bends++;
          pd = nd; i = j;
        }
        return null;
      };
      const fwd = walkFrom(pi, +1), back = walkFrom(pi, -1);
      if (!fwd || !back) { okAll = false; break; }
      const dirIdx = dotNext ? (pi + 1) % n : (pi - 1 + n) % n;
      const dir = DIRNAME[(path[dirIdx][0] - r) + ',' + (path[dirIdx][1] - c)];
      const myNum = dotNext ? fwd.bends : back.bends;
      circles.push({ r, c, dir, num: myNum, _bendsFwd: fwd.bends, _bendsBack: back.bends });
    }
    if (!okAll) continue;
    // numbered subset: match original density, ensure >=1 numbered; prefer marking
    const wantNum = meta.numCount;
    const order = circles.map((x, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const numbered = new Set(order.slice(0, Math.max(1, wantNum)));
    const lvCircles = circles.map(x => ({ r: x.r, c: x.c, dir: x.dir, num: numbered.has(circles.indexOf(x)) ? x.num : -1 }));
    // also: unnumbered circles keep a solution-aligned dir (aesthetics) — already along path
    const lv = { id: meta.id, tier: meta.tier, gridR: R, gridC: C, circles: lvCircles };
    const v = validate(lv, edgeSet);
    if (!v.ok) continue;
    // quality: no numbered circle with num > 4 (readability), at least one numbered
    if (lvCircles.some(x => x.num > 4)) continue;
    if (!lvCircles.some(x => x.num >= 0)) continue;
    return { lv, edges: Object.keys(edgeSet), shape: closed ? 'cycle' : 'path' };
  }
  return null;
}

// meta per level from ORIGINAL data
const brokenIds = process.argv.slice(2).map(Number);
const out = fs.existsSync('hotaru-beam/_regen.json') ? JSON.parse(fs.readFileSync('hotaru-beam/_regen.json', 'utf8')) : {};
for (const id of brokenIds) {
  const orig = LEVELS[id - 1];
  const numCount = orig.circles.filter(c => c.num >= 0).length;
  const meta = { id, tier: orig.tier, gridR: orig.gridR, gridC: orig.gridC, K: orig.circles.length, numCount };
  let made = null, seedBase = id * 7919 + 13;
  for (let s = 0; s < 400 && !made; s++) made = genLevel(meta, mulberry32(seedBase + s));
  if (!made) { console.log('L' + id + ' GEN-FAIL'); continue; }
  out[id] = made;
  console.log('L' + id + ' tier' + meta.tier + ' ' + meta.gridR + 'x' + meta.gridC + ' K=' + meta.K + ' nums=' + numCount + ' -> ' + made.shape + ' edges=' + made.edges.length + ' nums now: ' + made.lv.circles.map(c => c.num).join(','));
}
fs.writeFileSync('hotaru-beam/_regen.json', JSON.stringify(out, null, 1));
console.log('written hotaru-beam/_regen.json with ' + Object.keys(out).length + ' levels');
