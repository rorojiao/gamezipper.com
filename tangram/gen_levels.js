// Tangram level regeneration — fixes the shipped-game P0s:
//  (a) SHAPES[6] parallelogram had sides 1 & 1 (area √2/2) instead of the classic
//      1 & √2 (area 1), so piece areas summed to 7.5+ ≠ 8 = every silhouette area.
//  (b) ALL 30 shipped silhouettes were geometrically untileable: in an exact tiling
//      every straight silhouette edge is a concatenation of piece edges with lengths
//      in Z+√2·Z, and shipped edges (2.776, 4.534, ...) are not in that set.
//  (c) no snap: exact tilings need ~0.0003px placement precision via free dragging.
// Levels here are GENERATED, not authored: start from the solver-verified tiling of
// the 4×2 rectangle, then per level run a seeded random edge-reattachment walk
// (detach one piece, reattach edge-to-edge with the cluster). Every walk state is a
// valid exact tiling by construction; the silhouette is the stitched union boundary
// (exact G2 lattice arithmetic, halves of Z + √2/2·Z). Tier scales with walk length.
// Emits: patched index.html (SHAPES[6] classic + new LVLS with .q solution slots),
// _solutions.json (slots + silhouettes for the verifier), _start_tiling.json cache.
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

/* ---------------- exact G2 pairs: value = (c2 + d2*G)/2, G = √2/2 ---------------- */
const G = Math.SQRT1_2;
const padd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const psub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const pneg = a => [-a[0], -a[1]];
// exact equality; works for both a value pair [c2,d2] (number entries) and a
// point [xpair,ypair] (array entries — component-wise, since the (c2,d2)
// representation is unique per value). Reference equality was silently wrong
// for points and dead-ended the silhouette stitch walk.
const peq = (a, b) => Array.isArray(a[0])
  ? a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1][0] === b[1][0] && a[1][1] === b[1][1]
  : a[0] === b[0] && a[1] === b[1];
const pval = a => a[0] / 2 + a[1] / 2 * G;
const pcmp = (a, b) => {
  const dc = a[0] - b[0], dd = a[1] - b[1];
  if (!dc && !dd) return 0;
  if (dc === 0) return dd > 0 ? 1 : -1;
  if (dd === 0) return dc > 0 ? 1 : -1;
  const sc = Math.sign(dc), sd = Math.sign(dd);
  if (sc === sd) return sc;
  // |dc| vs |dd|*G  <=>  2*dc^2 vs dd^2 (G^2 = 1/2), exact in doubles at this range
  return (2 * dc * dc > dd * dd) ? sc : -sc;
};
// multiply a /2-lattice value by G; requires even d2 (holds for all piece verts)
const pmulG = a => { if (a[1] % 2) throw new Error('pmulG odd d2'); return [a[1] / 2, a[0]]; };
// rotation matrices for k*45° CCW, entries as pairs (0, ±1, ±G)
const M0 = [0, 0], M1 = [2, 0], MG = [0, 2];
const ROTS = [
  [[M1, M0], [M0, M1]], [[MG, pneg(MG)], [MG, MG]], [[M0, pneg(M1)], [M1, M0]],
  [[pneg(MG), pneg(MG)], [MG, pneg(MG)]], [[pneg(M1), M0], [M0, pneg(M1)]],
  [[pneg(MG), MG], [pneg(MG), pneg(MG)]], [[M0, M1], [pneg(M1), M0]], [[MG, MG], [pneg(MG), MG]],
];
function mulEntry(m, v) {
  if (peq(m, M0)) return [0, 0];
  if (peq(m, M1)) return [v[0], v[1]];
  if (peq(m, pneg(M1))) return pneg(v);
  if (peq(m, MG)) return pmulG(v);
  return pneg(pmulG(v));
}
// apply the k*45° matrix to a vertex [xpair, ypair] (raw int-coeff coords).
// pmulG is only ever applied to raw int-coeff pairs (even d2), so it cannot throw.
function rotVert(k, vert) {
  const R = ROTS[k];
  return [padd(mulEntry(R[0][0], vert[0]), mulEntry(R[0][1], vert[1])),
          padd(mulEntry(R[1][0], vert[0]), mulEntry(R[1][1], vert[1]))];
}

/* ---------------- pieces (classic set; parallelogram sides 1 & √2) ---------------- */
const V = (x, y) => [x, y]; // vert = [xpair, ypair], int-coeff pairs
const SHAPES = [
  [V([0, 0], [0, 0]), V([4, 0], [0, 0]), V([0, 0], [4, 0])],           // large triangle (legs 2)
  [V([0, 0], [0, 0]), V([4, 0], [0, 0]), V([0, 0], [4, 0])],           // large triangle
  [V([0, 0], [0, 0]), V([0, 4], [0, 0]), V([0, 0], [0, 4])],           // medium (√2 legs)
  [V([0, 0], [0, 0]), V([2, 0], [0, 0]), V([0, 0], [2, 0])],           // small (legs 1)
  [V([0, 0], [0, 0]), V([2, 0], [0, 0]), V([0, 0], [2, 0])],           // small
  [V([0, 0], [0, 0]), V([2, 0], [0, 0]), V([2, 0], [2, 0]), V([0, 0], [2, 0])], // square
  [V([0, 0], [0, 0]), V([0, 4], [0, 0]), V([0, 6], [0, 2]), V([0, 2], [0, 2])], // parallelogram 1×√2
];
// world verts of a placement {idx, rot, flip, t}; flip mirrors x then rot; CCW order kept
function worldVerts(pl) {
  let vs = SHAPES[pl.idx].map(v => [v[0], v[1]]);
  if (pl.flip) { vs = vs.map(v => [pneg(v[0]), v[1]]); vs.reverse(); }
  vs = vs.map(v => rotVert(pl.rot, v));
  return vs.map(v => [padd(pl.t[0], v[0]), padd(pl.t[1], v[1])]);
}
const fv = v => [pval(v[0]), pval(v[1])];
const fvs = vs => vs.map(fv);

/* ---------------- float predicates on exact verts ---------------- */
const BTOL = 1e-7;
function pip(px, py, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
function segDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1]; const L2 = dx * dx + dy * dy; const t = L2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2)) : 0; return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy)); }
function onB(px, py, poly, tol = BTOL) { for (let i = 0; i < poly.length; i++) if (segDist(px, py, poly[i], poly[(i + 1) % poly.length]) <= tol) return true; return false; }
const vertIncl = (x, y, p) => pip(x, y, p) || onB(x, y, p);
const vertStrict = (x, y, p) => pip(x, y, p) && !onB(x, y, p);
function segCross(a1, a2, b1, b2) {
  const d = (a2[0] - a1[0]) * (b2[1] - b1[1]) - (a2[1] - a1[1]) * (b2[0] - b1[0]);
  if (Math.abs(d) < 1e-12) return false;
  const t = ((b1[0] - a1[0]) * (b2[1] - b1[1]) - (b1[1] - a1[1]) * (b2[0] - b1[0])) / d;
  const u = ((b1[0] - a1[0]) * (a2[1] - a1[1]) - (b1[1] - a1[1]) * (a2[0] - a1[0])) / d;
  const e = 1e-9;
  return t > e && t < 1 - e && u > e && u < 1 - e;
}
function edgesCross(A, B) { for (let i = 0; i < A.length; i++) for (let j = 0; j < B.length; j++) if (segCross(A[i], A[(i + 1) % A.length], B[j], B[(j + 1) % B.length])) return true; return false; }
function samePoly(A, B) { // exact coincidence (e.g. a piece stacked on an identical one)
  if (A.length !== B.length) return false;
  const s = B.map(v => [v[0], v[1]]);
  for (const v of A) { let f = -1; for (let i = 0; i < s.length; i++) if (Math.hypot(s[i][0] - v[0], s[i][1] - v[1]) < 1e-9) { f = i; break; } if (f < 0) return false; s.splice(f, 1); }
  return true;
}
function overlapF(A, B) {
  if (samePoly(A, B)) return true;
  for (const v of A) if (vertStrict(v[0], v[1], B)) return true;
  for (const v of B) if (vertStrict(v[0], v[1], A)) return true;
  if (edgesCross(A, B)) return true;
  // containment with boundary-aligned verts (all verts on the container's boundary,
  // no proper edge crossings): an edge midpoint then lies strictly inside the container.
  // Sound: disjoint interiors imply no closure-point of one is strictly inside the other.
  for (let i = 0; i < A.length; i++) { const u = A[i], v = A[(i + 1) % A.length]; if (vertStrict((u[0] + v[0]) / 2, (u[1] + v[1]) / 2, B)) return true; }
  for (let i = 0; i < B.length; i++) { const u = B[i], v = B[(i + 1) % B.length]; if (vertStrict((u[0] + v[0]) / 2, (u[1] + v[1]) / 2, A)) return true; }
  return false;
}
function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } return Math.abs(a / 2); }
const AREAS = SHAPES.map(s => polyArea(fvs(s)));

/* ---------------- float geometry core (walk + silhouette stitch) ----------------
   All walk/stitch arithmetic runs on float verts (every value lies in
   L_full = (Z + G*Z)/2, float error ~1e-13). Vertex identity across pieces uses
   toFixed(6) keys, exact here: distinct L_full points are >= ~6e-3 apart, and no
   L_full value sits on a 5e-7 rounding boundary (its rational elements are
   exactly the half-integers). The previous exact-pair machinery died on
   coefficient growth: pair coefficients grow ~+20 per walk move (t = anchor-u
   accumulates), so no fixed snap list could cover a 16-move walk. */
const S2F = Math.SQRT2, GF = Math.SQRT1_2;
const SHF = [
  [[0, 0], [2, 0], [0, 2]], [[0, 0], [2, 0], [0, 2]], [[0, 0], [S2F, 0], [0, S2F]],
  [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1], [0, 1]],
  [[0, 0], [S2F, 0], [S2F * 1.5, GF], [GF, GF]],
];
function rotVsF(vs, rot, flip) { let o = vs.map(v => [v[0], v[1]]); if (flip) { o = o.map(v => [-v[0], v[1]]); o.reverse(); } const a = rot * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return o.map(v => [v[0] * c - v[1] * s, v[0] * s + v[1] * c]); }
function worldVertsF(pl) { return rotVsF(SHF[pl.idx], pl.rot, pl.flip).map(v => [pl.t[0] + v[0], pl.t[1] + v[1]]); }
function edgeInfo(a, b) { // axis 0|h, 1|v, 2|diag(45deg multiples only)
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  let axis;
  if (Math.abs(dy) < 1e-9) axis = 0;
  else if (Math.abs(dx) < 1e-9) axis = 1;
  else if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 1e-9) axis = 2;
  else throw new Error('non-45deg edge ' + JSON.stringify([a, b]));
  return { axis, u: [dx / len, dy / len], len };
}
function paramAlong(a, u, p) { return (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1]; }
function ptAt(a, u, s) { return [a[0] + u[0] * s, a[1] + u[1] * s]; }

// union boundary: for each piece edge, subtract the param intervals covered by
// collinear (same-line) edges of other pieces; leftovers are boundary segments.
function boundarySegmentsF(config) {
  const polys = config.map(pl => worldVertsF(pl));
  const segs = [];
  for (let pi = 0; pi < polys.length; pi++) {
    const A = polys[pi], n = A.length;
    for (let i = 0; i < n; i++) {
      const a = A[i], b = A[(i + 1) % n];
      const d = edgeInfo(a, b);
      const cuts = [0, d.len];
      for (let pj = 0; pj < polys.length; pj++) {
        if (pj === pi) continue;
        const B = polys[pj], m = B.length;
        for (let j = 0; j < m; j++) {
          const c = B[j], e = B[(j + 1) % m];
          if (edgeInfo(c, e).axis !== d.axis) continue;
          const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
          if (Math.abs(cross) > 1e-9) continue; // parallel but different line
          const s0 = paramAlong(a, d.u, c), s1 = paramAlong(a, d.u, e);
          cuts.push(Math.max(0, Math.min(s0, s1)), Math.min(d.len, Math.max(s0, s1)));
        }
      }
      cuts.sort((x, y) => x - y);
      const uniq = [];
      for (const c of cuts) if (!uniq.length || c - uniq[uniq.length - 1] > 1e-9) uniq.push(c);
      for (let k = 0; k + 1 < uniq.length; k++) {
        const s0 = uniq[k], s1 = uniq[k + 1], mid = (s0 + s1) / 2;
        let covered = false;
        for (let pj = 0; pj < polys.length && !covered; pj++) {
          if (pj === pi) continue;
          const B = polys[pj], m = B.length;
          for (let j = 0; j < m; j++) {
            const c = B[j], e = B[(j + 1) % m];
            if (edgeInfo(c, e).axis !== d.axis) continue;
            const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
            if (Math.abs(cross) > 1e-9) continue;
            const t0 = paramAlong(a, d.u, c), t1 = paramAlong(a, d.u, e);
            if (mid > Math.min(t0, t1) + 1e-9 && mid < Math.max(t0, t1) - 1e-9) { covered = true; break; }
          }
        }
        if (!covered) segs.push({ a: ptAt(a, d.u, s0), b: ptAt(a, d.u, s1), d, piece: config[pi].idx });
      }
    }
  }
  return segs;
}
// -0 and -1e-15 must key identical to +0: round to the 6dp grid first, then
// add +0 to normalize negative zero ((-0)+0 === 0), else "(+0).toFixed" and
// "(-0).toFixed" split one physical vertex into two degree-1 ghosts.
const vkey = p => (Math.round(p[0] * 1e6) / 1e6 + 0).toFixed(6) + ',' + (Math.round(p[1] * 1e6) / 1e6 + 0).toFixed(6);
function silhouetteF(config) {
  const segs = boundarySegmentsF(config);
  const out = new Map(), inc = new Map();
  for (const s of segs) { const ka = vkey(s.a), kb = vkey(s.b); out.set(ka, (out.get(ka) || 0) + 1); inc.set(kb, (inc.get(kb) || 0) + 1); }
  for (const [k, cnt] of out) if (cnt !== 1 || (inc.get(k) || 0) !== 1) return null; // pinch/junction
  let start = null;
  for (const s of segs) for (const p of [s.a, s.b]) if (!start || p[1] < start[1] - 1e-12 || (Math.abs(p[1] - start[1]) < 1e-12 && p[0] < start[0] - 1e-12)) start = p;
  const loop = []; let cur = start;
  for (let guard = 0; guard < 1000; guard++) {
    loop.push(cur);
    const nxt = segs.find(s => vkey(s.a) === vkey(cur));
    if (!nxt) return null;
    cur = nxt.b;
    if (vkey(cur) === vkey(start)) break;
  }
  if (vkey(cur) !== vkey(start)) return null;
  const simp = [];
  for (let i = 0; i < loop.length; i++) {
    const p0 = loop[(i - 1 + loop.length) % loop.length], p1 = loop[i], p2 = loop[(i + 1) % loop.length];
    const cross = (p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0]);
    const dot = (p1[0] - p0[0]) * (p2[0] - p1[0]) + (p1[1] - p0[1]) * (p2[1] - p1[1]);
    if (Math.abs(cross) < 1e-9 && dot > 0) continue;
    simp.push(p1);
  }
  if (simp.length < 3) return null;
  let area2 = 0;
  for (let i = 0; i < simp.length; i++) { const j = (i + 1) % simp.length; area2 += simp[i][0] * simp[j][1] - simp[j][0] * simp[i][1]; }
  if (area2 <= 0) return null;
  // full precision here; rounding to 6dp happens only at emit (a rounded corner
  // can push an exactly-coincident piece vert 2.2e-7 outside, past vertIncl's 1e-7)
  return { verts: simp.map(p => [p[0], p[1]]), segs };
}
function validateF(config, silVerts) {
  if (Math.abs(polyArea(silVerts) - 8) > 1e-5) return 'area != 8';
  const wvs = config.map(pl => worldVertsF(pl));
  for (const wf of wvs) for (const v of wf) if (!vertIncl(v[0], v[1], silVerts)) return 'vert outside';
  for (let i = 0; i < wvs.length; i++) for (let j = i + 1; j < wvs.length; j++) if (overlapF(wvs[i], wvs[j])) return 'overlap ' + i + ',' + j;
  return null;
}
function bboxOfF(config) {
  let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
  for (const pl of config) for (const v of worldVertsF(pl)) { mnx = Math.min(mnx, v[0]); mny = Math.min(mny, v[1]); mxx = Math.max(mxx, v[0]); mxy = Math.max(mxy, v[1]); }
  return { mnx, mny, mxx, mxy };
}

/* ---------------- start tiling: float DFS on the 4x2 rectangle ----------------
   Anchor rule (completeness-critical): m = true gap lexicomin over (sil verts
   placed verts) that lie ON THE CLOSURE OF THE GAP. "Not strictly inside any
   placed piece" is NOT enough — a sil corner fully covered by a placed piece's
   right angle passes that filter but is not on the gap boundary, dead-ending
   the search (deepest=2 stall). Sampled on-gap test is exact here: coords are
   in (Z[sqrt2])/2 with small coefficients, so any nonzero point-to-edge-line
   distance is >= ~6e-3 >> sample radius 1.03e-3; the 0.017 rad angular offset
   keeps samples >= 1.7e-5 off 45deg-multiple edge lines.
   Candidates: m on the piece BOUNDARY (vertex or edge lattice point) covers the
   T-junction case. Result snapped to exact pairs and cached. */
function solveStart() {
  const cache = path.join(DIR, '_start_tiling.json');
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const silF = [[0, 0], [4, 0], [4, 2], [0, 2]];
  function rotVsF0(vs, rot, flip) { let o = vs.map(v => [v[0], v[1]]); if (flip) { o = o.map(v => [-v[0], v[1]]); o.reverse(); } const a = rot * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return o.map(v => [v[0] * c - v[1] * s, v[0] * s + v[1] * c]); }
  const SHF0 = SHF;
  const LVALS = [];
  for (let i = -4; i <= 8; i++) for (let r = -8; r <= 8; r++) LVALS.push(i + r * G);
  const SVALS = LVALS.concat(LVALS.map(v => v * Math.SQRT2));
  function boundaryPtsF(vs) { const out = []; for (let i = 0; i < vs.length; i++) { const u = vs[i], v = vs[(i + 1) % vs.length]; const w = Math.hypot(v[0] - u[0], v[1] - u[1]); const dx = (v[0] - u[0]) / w, dy = (v[1] - u[1]) / w; for (const s of SVALS) { if (s < -1e-9 || s > w + 1e-9) continue; const sc = Math.max(0, Math.min(w, s)); const px = u[0] + sc * dx, py = u[1] + sc * dy; if (!out.some(q => Math.hypot(q[0] - px, q[1] - py) < 1e-6)) out.push([px, py]); } } return out; }
  const BPF = SHF0.map((sh, idx) => { const per = []; for (let rot = 0; rot < 8; rot++) for (let flip = 0; flip < 2; flip++) per.push(boundaryPtsF(rotVsF0(sh, rot, flip))); return per; });
  const placed = []; let nodes = 0;
  function onGapBoundary(p) {
    const r = 1.03e-3;
    for (let d = 0; d < 16; d++) {
      const a = d * Math.PI / 8 + 0.017;
      const qx = p[0] + r * Math.cos(a), qy = p[1] + r * Math.sin(a);
      if (!pip(qx, qy, silF) && !onB(qx, qy, silF)) continue;
      let covered = false;
      for (const pl of placed) if (pip(qx, qy, pl.wv) || onB(qx, qy, pl.wv)) { covered = true; break; }
      if (!covered) return true;
    }
    return false;
  }
  function anchor() { let m = null; const all = silF.concat(...placed.map(p => p.wv)); for (const v of all) { if (!onGapBoundary(v)) continue; if (!m || v[1] < m[1] - 1e-9 || (Math.abs(v[1] - m[1]) < 1e-9 && v[0] < m[0] - 1e-9)) m = v; } return m; }
  function dfs() {
    if (++nodes > 20e6) throw new Error('nodecap');
    if (placed.length === 7) return placed.map(p => ({ idx: p.idx, rot: p.rot, flip: p.flip, t: p.t }));
    const m = anchor(); if (!m) return null;
    for (let idx = 0; idx < 7; idx++) {
      if (placed.some(p => p.idx === idx)) continue;
      for (let rot = 0; rot < 8; rot++) for (let flip = 0; flip < 2; flip++) {
        const ori = rotVsF0(SHF0[idx], rot, flip);
        const bp = BPF[idx][rot * 2 + flip];
        for (const b of bp) {
          const t = [m[0] - b[0], m[1] - b[1]];
          const wv = ori.map(v => [t[0] + v[0], t[1] + v[1]]);
          let ok = true;
          for (const v of wv) if (!vertIncl(v[0], v[1], silF)) { ok = false; break; }
          if (!ok) continue;
          if (placed.some(p => overlapF(wv, p.wv))) continue;
          placed.push({ idx, rot, flip, wv, t });
          const r = dfs();
          if (r) return r;
          placed.pop();
        }
      }
    }
    return null;
  }
  const r = dfs();
  if (!r) { console.error('start solver NULL'); process.exit(1); }
  // sanity: exact cover of the rect
  {
    const wvs = r.map(p => rotVsF0(SHF0[p.idx], p.rot, p.flip).map(v => [p.t[0] + v[0], p.t[1] + v[1]]));
    for (const wf of wvs) for (const v of wf) if (!vertIncl(v[0], v[1], silF)) { console.error('start solver: vert outside'); process.exit(1); }
    for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) if (overlapF(wvs[i], wvs[j])) { console.error('start solver: overlap'); process.exit(1); }
    if (Math.abs(wvs.reduce((a, w) => a + polyArea(w), 0) - polyArea(silF)) > 1e-9) { console.error('start solver: area mismatch'); process.exit(1); }
  }
  // snap to exact lattice pairs (start tiling has small coefficients)
  function snapP(x) { for (let c2 = -24; c2 <= 24; c2++) for (let d2 = -24; d2 <= 24; d2++) if (Math.abs(c2 / 2 + d2 / 2 * G - x) < 1e-6) return [c2, d2]; throw new Error('snapP ' + x); }
  const exact = r.map(p => ({ idx: p.idx, rot: p.rot, flip: p.flip ? 1 : 0, t: [snapP(p.t[0]), snapP(p.t[1])] }));
  fs.writeFileSync(cache, JSON.stringify(exact));
  return exact;
}

/* ---------------- random walk (edge reattachment) ---------------- */
function mulberry32(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function adjacencyF(config) { // edge-sharing graph (collinear overlap > 1e-6)
  const polys = config.map(pl => worldVertsF(pl));
  const adj = config.map(() => new Set());
  for (let i = 0; i < polys.length; i++) for (let j = i + 1; j < polys.length; j++) {
    outer:
    for (let ei = 0; ei < polys[i].length; ei++) {
      const a1 = polys[i][ei], a2 = polys[i][(ei + 1) % polys[i].length];
      const d1 = edgeInfo(a1, a2);
      for (let ej = 0; ej < polys[j].length; ej++) {
        const b1 = polys[j][ej], b2 = polys[j][(ej + 1) % polys[j].length];
        if (edgeInfo(b1, b2).axis !== d1.axis) continue;
        const cross = (a2[0] - a1[0]) * (b1[1] - a1[1]) - (a2[1] - a1[1]) * (b1[0] - a1[0]);
        if (Math.abs(cross) > 1e-9) continue;
        const p0 = paramAlong(a1, d1.u, b1), p1 = paramAlong(a1, d1.u, b2);
        const lo = Math.max(0, Math.min(p0, p1)), hi = Math.min(d1.len, Math.max(p0, p1));
        if (hi - lo > 1e-6) { adj[i].add(j); adj[j].add(i); break outer; }
      }
    }
  }
  return adj;
}
function connectedF(config) {
  const adj = adjacencyF(config), seen = new Set([0]), q = [0];
  while (q.length) { const c = q.pop(); for (const nb of adj[c]) if (!seen.has(nb)) { seen.add(nb); q.push(nb); } }
  return seen.size === config.length;
}
// flush anchor params on segment S: its endpoints plus every rest vertex lying
// on S's line. Arbitrary slide offsets made every grown figure a zigzag with
// 13-23 boundary verts; flush alignment yields classic tangram figures whose
// edges line up into long straight runs.
function flushParams(rest, S) {
  const wS = S.d.len, ps = new Set([0, wS]);
  for (const pl of rest) for (const vv of worldVertsF(pl)) {
    const cross = (S.b[0] - S.a[0]) * (vv[1] - S.a[1]) - (S.b[1] - S.a[1]) * (vv[0] - S.a[0]);
    const len = Math.hypot(S.b[0] - S.a[0], S.b[1] - S.a[1]);
    if (Math.abs(cross) / len > 1e-9) continue;
    const p = paramAlong(S.a, S.d.u, vv);
    if (p > 1e-7 && p < wS - 1e-7) ps.add(+p.toFixed(9));
  }
  return [...ps];
}
function attachmentsF(rest, P) { // all valid edge-to-edge reattachments of piece P
  const cands = [];
  const segs = boundarySegmentsF(rest);
  const restW = rest.map(pl => worldVertsF(pl));
  for (let rot = 0; rot < 8; rot++) for (let flip = 0; flip < 2; flip++) {
    const ori = rotVsF(SHF[P.idx], rot, flip === 1);
    const n = ori.length;
    for (let i = 0; i < n; i++) {
      const u = ori[i], v = ori[(i + 1) % n];
      const eI = edgeInfo(u, v);
      for (const S of segs) {
        if (S.d.axis !== eI.axis) continue; // parallel by axis class
        const offs = new Set();
        for (const p of flushParams(rest, S)) { offs.add(+(p).toFixed(9)); offs.add(+(p - eI.len).toFixed(9)); }
        for (const ov of offs) {
          const anchor = [S.a[0] + S.d.u[0] * ov, S.a[1] + S.d.u[1] * ov];
          const t = [anchor[0] - u[0], anchor[1] - u[1]];
          // actual contact of the placed edge with S's extent
          const pu = paramAlong(S.a, S.d.u, [t[0] + u[0], t[1] + u[1]]);
          const pv = paramAlong(S.a, S.d.u, [t[0] + v[0], t[1] + v[1]]);
          const lo = Math.max(Math.min(pu, pv), 0), hi = Math.min(Math.max(pu, pv), S.d.len);
          if (hi - lo < 0.35) continue; // require >= ~0.35 contact for solid attachment
          const pl = { idx: P.idx, rot, flip: flip === 1, t };
          const wf = worldVertsF(pl);
          let bad = false;
          for (const rw of restW) if (overlapF(wf, rw)) { bad = true; break; }
          if (bad) continue;
          const bb = bboxOfF(rest.concat([pl]));
          if (bb.mxx - bb.mnx > 6.6 || bb.mxy - bb.mny > 6.6) continue;
          cands.push(pl);
        }
      }
    }
  }
  return cands;
}
function walkF(start, moves, rng) {
  const s0 = start.map(p => ({ idx: p.idx, rot: p.rot, flip: p.flip === 1 || p.flip === true, t: [p.t[0], p.t[1]] }));
  // backtracking DFS over hole-free reattachment moves (a greedy walk dead-ends
  // once the silhouette interlocks: few pieces stay removable); rng guides the
  // ordering so each try samples a different walk subtree.
  let budget = 2200; // attachmentsF calls
  function shuffled(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function dfs(config, m) {
    if (m === moves) return config;
    const order = shuffled([0, 1, 2, 3, 4, 5, 6]);
    for (const pi of order) {
      const P = config.find(p => p.idx === pi);
      const rest = config.filter(p => p.idx !== pi);
      if (!connectedF(rest)) continue;
      // removable only if the rest stays simply connected: no interior hole
      // (detaching an interior piece leaves a hole the engine cannot express;
      // silhouetteF returns the OUTER boundary, so a hole shows as an area excess)
      if (--budget < 0) return null;
      const silRest = silhouetteF(rest);
      if (!silRest) continue;
      const restArea = rest.reduce((a, pl) => a + polyArea(worldVertsF(pl)), 0);
      if (Math.abs(polyArea(silRest.verts) - restArea) > 1e-6) continue;
      const cands = attachmentsF(rest, P);
      if (!cands.length) continue;
      for (const c of shuffled(cands).slice(0, 10)) {
        const r = dfs(rest.concat([c]), m + 1);
        if (r) return r;
      }
    }
    return null;
  }
  return dfs(s0, 0);
}

// sequential random growth: attach pieces 1..6 one at a time, each to the outer
// boundary of the current cluster. Simple-connectivity is preserved by
// construction (no hole-free bookkeeping needed, never dead-ends like the walk).
// Jaggedness bias: usually pick the sampled candidate that adds the most
// silhouette verts, so higher tiers can hit their vert windows.
function growF(rng, bias, jag) {
  function shuffled(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  let config = [{ idx: 0, rot: Math.floor(rng() * 8), flip: rng() < 0.5, t: [0, 0] }];
  for (const pi of shuffled([1, 2, 3, 4, 5, 6])) {
    const cands = attachmentsF(config, { idx: pi });
    if (!cands.length) return null;
    let choice = null;
    if (rng() < bias) {
      // sample candidates and prefer the one with the most (jag) / fewest (!jag)
      // silhouette verts; a null silhouette (pinch) scores worst, so biased
      // steps actively avoid vertex-touch attachments
      let bestSc = 1e9;
      for (const c of shuffled(cands).slice(0, 14)) {
        const s = silhouetteF(config.concat([c]));
        const sc = s ? (jag ? -s.verts.length : s.verts.length) : 1e3;
        if (sc < bestSc) { bestSc = sc; choice = c; }
      }
    }
    if (!choice) choice = cands[Math.floor(rng() * cands.length)];
    config = config.concat([choice]);
  }
  return config;
}

/* ---------------- per-level generation ---------------- */
const TIERS = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5];
const MAXVERTS = [0, 8, 10, 12, 14, 16];
const MINVERTS = [0, 4, 7, 9, 10, 12];
const BIAS = [0, 0.85, 0.85, 0.85, 0.85, 0.85]; // biased-step probability per tier
const JAG = [0, false, false, false, false, false]; // bias direction per tier
// solveStart returns exact-pair t's (small coefficients, from the float solver);
// convert once to float t for the walk core.
const start = solveStart().map(p => ({ idx: p.idx, rot: p.rot, flip: p.flip === 1 || p.flip === true, t: [pval(p.t[0]), pval(p.t[1])] }));
// verify the start tiling itself
{
  const startSil = silhouetteF(start);
  if (!startSil) { console.error('start silhouette stitch failed'); process.exit(1); }
  const err = validateF(start, startSil.verts);
  if (err) { console.error('start validate: ' + err); process.exit(1); }
  if (startSil.verts.length !== 4 || Math.abs(polyArea(startSil.verts) - 8) > 1e-5) { console.error('start not the 4x2 rect'); process.exit(1); }
  console.log('start tiling OK (4 verts, area 8)');
}

const levels = [];
const seen = new Set();
const MAXTRY = 80;
for (let li = 0; li < 30; li++) {
  const tier = TIERS[li];
  let made = null;
  for (let tryN = 0; tryN < MAXTRY && !made; tryN++) {
    const rng = mulberry32(100000 + li * 977 + tryN * 131);
    const config = li === 0 ? start : growF(rng, BIAS[tier], JAG[tier]);
    if (!config) continue;
    const sil = silhouetteF(config);
    if (!sil) continue;
    if (sil.verts.length > MAXVERTS[tier] || sil.verts.length < MINVERTS[tier]) continue;
    const bb = bboxOfF(config);
    if (Math.min(bb.mxx - bb.mnx, bb.mxy - bb.mny) < 1.4) continue; // avoid thin snakes
    const err = validateF(config, sil.verts);
    if (err) { console.error('L' + (li + 1) + ' try' + tryN + ' INVALID: ' + err); continue; }
    // centering shift (floats, applied at emit)
    const shx = (bb.mnx + bb.mxx) / 2, shy = (bb.mny + bb.mxy) / 2;
    const key = sil.verts.map(v => v[0].toFixed(3) + ',' + v[1].toFixed(3)).join(';');
    if (seen.has(key)) continue;
    seen.add(key);
    // slots: mean of world verts per piece (game units, engine p.x = cx + q*U)
    const slots = [];
    for (let pi = 0; pi < 7; pi++) {
      const pl = config.find(p => p.idx === pi);
      const wf = worldVertsF(pl);
      const mx = wf.reduce((s, v) => s + v[0], 0) / wf.length;
      const my = wf.reduce((s, v) => s + v[1], 0) / wf.length;
      slots.push([+(mx - shx).toFixed(6), +(my - shy).toFixed(6), pl.rot, pl.flip ? 1 : 0]);
    }
    made = {
      n: 'Shape ' + (li + 1), t: tier,
      s: sil.verts.map(v => [+(v[0] - shx).toFixed(6), +(v[1] - shy).toFixed(6)]),
      q: slots,
    };
  }
  if (!made) { console.error('L' + (li + 1) + ': FAILED to generate'); process.exit(1); }
  levels.push(made);
  console.log('L' + (li + 1) + ' tier' + tier + ' verts' + made.s.length + ' OK');
}

/* ---------------- emit ---------------- */
const src = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
// 1. classic parallelogram
const oldShape6 = '  [[0,0],[1,0],[1+S2*.5,S2*.5],[S2*.5,S2*.5]]';
const newShape6 = '  // P0 fix 2026-08-25: classic parallelogram (sides 1 & S2, area 1). Shipped piece\n' +
  '  // had sides 1 & 1 (area S2/2), so piece areas summed to 7.5 != 8 = silhouette area.\n' +
  '  [[0,0],[S2,0],[S2*1.5,S2*.5],[S2*.5,S2*.5]]';
if (!src.includes(oldShape6)) { console.error('SHAPES[6] pattern not found'); process.exit(1); }
let out = src.replace(oldShape6, newShape6);
// 2. LVLS replacement
const lm = out.match(/var LVLS=\[[\s\S]*?\n\];/);
if (!lm) { console.error('LVLS block not found'); process.exit(1); }
const lvlLines = ['var LVLS=['];
for (let i = 0; i < levels.length; i++) {
  const L = levels[i];
  if (i % 6 === 0) lvlLines.push('  // Tier ' + L.t);
  lvlLines.push('  {n:"' + L.n + '",t:' + L.t + ',s:' + JSON.stringify(L.s) + ',q:' + JSON.stringify(L.q) + '},');
}
lvlLines.push('];');
const header = [
  '// P0 fix 2026-08-25: ALL 30 shipped silhouettes were geometrically untileable (their',
  '// straight edges have lengths outside Z+S2*Z, but every exact tangram tiling forces',
  '// silhouette edges to be concatenations of piece edges with lengths in that set), so',
  '// no level was completable. Replaced with generated figures, each a solver-verified',
  '// exact tiling built by seeded edge-reattachment walks from the classic 4x2 rectangle',
  '// (tier = walk length). q = per-piece solution slots [cx,cy,rot,flip] in game units',
  '// (engine piece position p satisfies p = (cx + q[0]*U, cy + q[1]*U)); used by the',
  '// snap-to-slot feature required by BENCHMARK.md (dropped pieces within 0.45*U of',
  '// their slot with matching orientation snap exactly into place).',
].join('\n');
out = out.slice(0, lm.index) + header + '\n' + lvlLines.join('\n') + out.slice(lm.index + lm[0].length);
fs.writeFileSync(path.join(DIR, 'index.html'), out);
// 3. solutions for the verifier
fs.writeFileSync(path.join(DIR, '_solutions.json'), JSON.stringify(levels.map(L => ({ name: L.n, tier: L.t, slots: L.q, sil: L.s })), null, 1));
console.log('\n30 levels generated; index.html patched; _solutions.json written');
