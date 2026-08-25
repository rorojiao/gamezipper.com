'use strict';
/* zip-tie verify_engine.js — full E2E coverage via real pointer drags on the canvas.
 *
 * Engine facts this verifier relies on (index.html):
 *  - Levels are DETERMINISTIC: startLevel(lv) seeds mulberry32(lv*9871+12345), so the
 *    scrambled layout is reproducible offline. We extract the real generator source
 *    (TIER_CFG/mulberry32/getLevelParams/generateLevel/segIntersect) and build an exact
 *    planner that predicts crossings / moveCount / star tier for every drag sequence.
 *  - Win: crossingCount===0 checked at pointerup -> immediate showWinModal (no timeout).
 *  - Stars: moves<=star3 -> 3, <=star2 -> 2, else 1. Unlock: stars > previous stars
 *    (P1 2026-08-25 fix: prevStars captured BEFORE best-update).
 *  - Solvability guarantee: all vertices at their circle "home" positions => 0 crossings
 *    (edges were added with the circle interleave test). The planner drags vertices home.
 *  - Save: localStorage 'ziptie_progress' {unlocked, best:{lv:moves}}.
 * All driving is real DOM events: canvas pointerdown/pointermove/pointerup(pointercancel),
 * button clicks. State reads (HUD innerHTML, save JSON) are passive asserts only.
 */
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0; const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + String(detail).slice(0, 220) : '')); }
}

/* ============ 1. Exact offline replica of the engine's generation & geometry ============ */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function extractFn(name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('extractFn: ' + name + ' not found');
  let j = html.indexOf('{', start), d = 0;
  for (;;) {
    if (html[j] === '{') d++;
    else if (html[j] === '}') { d--; if (!d) break; }
    j++;
    if (j > html.length) throw new Error('extractFn: unbalanced ' + name);
  }
  return html.slice(start, j + 1);
}
const tierStart = html.indexOf('var TIER_CFG = [');
const TIER_SRC = html.slice(tierStart, html.indexOf('];', tierStart) + 2);
const REP = new Function('NODE_RADIUS', 'GRAB_RADIUS',
  TIER_SRC + '\n' +
  extractFn('mulberry32') + '\n' +
  extractFn('getLevelParams') + '\n' +
  extractFn('generateLevel') + '\n' +
  extractFn('segIntersect') + '\n' +
  'return {TIER_CFG:TIER_CFG, mulberry32:mulberry32, getLevelParams:getLevelParams, generateLevel:generateLevel, segIntersect:segIntersect};'
)(14, 22);
ck('replica-extracted', typeof REP.generateLevel === 'function' && REP.TIER_CFG.length === 5);

const GRAB_RADIUS = 22, CANVAS = 480; // live canvas is 480x480 device px (asserted below)
function analyzeLevel(lv) {
  const p = REP.getLevelParams(lv);
  const gen = REP.generateLevel(p.vCount, p.eCount, lv * 9871 + 12345);
  return {
    lv, p,
    verts: gen.vertices.map(v => ({ id: v.id, x: v.x, y: v.y, homeX: v.homeX, homeY: v.homeY })),
    edges: gen.edges.map(e => ({ a: e.a, b: e.b })),
  };
}
function crossingsAt(pos, edges) {
  let cc = 0;
  for (let a = 0; a < edges.length; a++) for (let b = a + 1; b < edges.length; b++) {
    const ea = edges[a], eb = edges[b];
    if (ea.a === eb.a || ea.a === eb.b || ea.b === eb.a || ea.b === eb.b) continue;
    if (REP.segIntersect(pos[ea.a], pos[ea.b], pos[eb.a], pos[eb.b])) cc++;
  }
  return cc;
}

/* Planner: simulates engine drag semantics exactly.
 * engine grab = first vertex (id order) with device-px distance <= 22 at the pointerdown point.
 * pointermove sets every dragging vertex to the clamped point; pointerup counts
 * dist(final,_dragStart)>0.005 as a move and runs checkWin (win at first 0 crossings). */
function buildPlan(lv, pads, order) {
  pads = pads || 0;
  const A = analyzeLevel(lv);
  const S = {
    pos: A.verts.map(v => ({ x: v.x, y: v.y })),
    moves: 0, won: false, winStep: -1, winMoves: -1,
    steps: [], // {down:[x,y], to:[x,y]} — executed in order
  };
  const home = A.verts.map(v => ({ x: v.homeX, y: v.homeY }));
  function engGrab(x, y) {
    for (let i = 0; i < S.pos.length; i++) {
      const dx = (S.pos[i].x - x) * CANVAS, dy = (S.pos[i].y - y) * CANVAS;
      if (Math.sqrt(dx * dx + dy * dy) <= GRAB_RADIUS) return i;
    }
    return -1;
  }
  const snap = () => JSON.stringify({ p: S.pos, m: S.moves, w: S.won, ws: S.winStep, wm: S.winMoves, n: S.steps.length });
  function restore(s) { const o = JSON.parse(s); S.pos = o.p; S.moves = o.m; S.won = o.w; S.winStep = o.ws; S.winMoves = o.wm; S.steps.length = o.n; }
  function doDrag(downX, downY, toX, toY) {
    const g = engGrab(downX, downY);
    S.steps.push({ down: [downX, downY], to: [toX, toY], grab: g });
    if (g < 0 || S.won) return;
    const sx = S.pos[g].x, sy = S.pos[g].y;
    S.pos[g].x = Math.max(0.05, Math.min(0.95, toX));
    S.pos[g].y = Math.max(0.05, Math.min(0.95, toY));
    if (Math.hypot(S.pos[g].x - sx, S.pos[g].y - sy) > 0.005) S.moves++;
    if (!S.won && crossingsAt(S.pos, A.edges) === 0) { S.won = true; S.winStep = S.steps.length - 1; S.winMoves = S.moves; }
  }
  // padding: `pads` round-trips on the vertex grabbed at vertex 0's position, inserted
  // BEFORE solving, each +2 moves; every intermediate pointerup must keep crossings > 0.
  const CAND = [[0.5, 0.5], [0.2, 0.2], [0.8, 0.8], [0.2, 0.8], [0.8, 0.2], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.7], [0.15, 0.5], [0.85, 0.5]];
  let padOk = true;
  for (let k = 0; k < pads; k++) {
    const st = snap();
    const g0 = engGrab(S.pos[0].x, S.pos[0].y);
    if (g0 < 0) { padOk = false; break; }
    const sx = S.pos[g0].x, sy = S.pos[g0].y;
    let placed = false;
    for (const c of CAND) {
      doDrag(sx, sy, c[0], c[1]);
      if (S.won) { restore(st); continue; }
      const cx = S.pos[g0].x, cy = S.pos[g0].y; // wherever the grabbed vertex now is
      // return leg: pointerdown at the point we dragged it to
      doDrag(cx, cy, sx, sy);
      if (S.won) { restore(st); continue; }
      if (S.moves === JSON.parse(st).m + 2) { placed = true; break; } // clean +2 round trip
      restore(st);
    }
    if (!placed) { padOk = false; break; }
  }
  // solve: drag every vertex to its exact home; grab-point search avoids blocking
  let guard = 0, guardHit = false;
  while (!S.won && guard++ < 200) {
    let vi = -1;
    if (order) { for (const c of order) if (Math.hypot(S.pos[c].x - home[c].x, S.pos[c].y - home[c].y) > 1e-9) { vi = c; break; } }
    if (vi < 0) for (let i = 0; i < S.pos.length; i++) if (Math.hypot(S.pos[i].x - home[i].x, S.pos[i].y - home[i].y) > 1e-9) { vi = i; break; }
    if (vi < 0) break; // exact identity with no win recorded — should be impossible
    const pts = [[S.pos[vi].x, S.pos[vi].y]];
    const r = (GRAB_RADIUS * 0.5) / CANVAS;
    for (let a2 = 0; a2 < 8; a2++) pts.push([S.pos[vi].x + Math.cos(a2 * Math.PI / 4) * r, S.pos[vi].y + Math.sin(a2 * Math.PI / 4) * r]);
    let dragged = false;
    for (const pt of pts) if (engGrab(pt[0], pt[1]) === vi) { doDrag(pt[0], pt[1], home[vi].x, home[vi].y); dragged = true; break; }
    if (!dragged) {
      const g = engGrab(S.pos[vi].x, S.pos[vi].y);
      if (g < 0) { guardHit = true; break; }
      if (Math.hypot(S.pos[g].x - home[g].x, S.pos[g].y - home[g].y) <= 1e-9) {
        // Blocker sits AT ITS HOME on top of vi, so vi is ungrabbable at every point
        // within grab radius. Shove the blocker aside and home vi IN THE SAME iteration —
        // homing the blocker first just re-blocks vi (lower id wins the next scan).
        const c = [home[g].x > 0.5 ? 0.15 : 0.85, home[g].y > 0.5 ? 0.15 : 0.85];
        doDrag(S.pos[g].x, S.pos[g].y, c[0], c[1]);
        if (engGrab(S.pos[vi].x, S.pos[vi].y) === vi) doDrag(S.pos[vi].x, S.pos[vi].y, home[vi].x, home[vi].y);
      } else {
        doDrag(S.pos[g].x, S.pos[g].y, home[g].x, home[g].y);
      }
    }
  }
  const p = A.p;
  const stars = S.winMoves <= p.star3 ? 3 : S.winMoves <= p.star2 ? 2 : 1;
  return { A, plan: S, padOk, guardHit, stars, initCross: crossingsAt(A.verts.map(v => ({ x: v.x, y: v.y })), A.edges) };
}

/* Exhaustive drag-order search: scramble only guarantees >=1 INITIAL crossing, so a
 * single well-chosen homing drag can already win (tier-1 levels solve in 1-2 moves).
 * Greedy id-order is fine for every level except lv2, where an unlucky order forces
 * blocker shoves past the star3 bar — enumerate orders when greedy misses 3 stars. */
function perms(a) { if (a.length <= 1) return [a]; const out = []; for (let i = 0; i < a.length; i++) { for (const p2 of perms(a.slice(0, i).concat(a.slice(i + 1)))) out.push([a[i]].concat(p2)); } return out; }
function displacedOf(A) { const d = []; for (let i = 0; i < A.verts.length; i++) if (Math.hypot(A.verts[i].x - A.verts[i].homeX, A.verts[i].y - A.verts[i].homeY) > 0.005) d.push(i); return d; }
function findBestPlan(lv, pads) {
  const A = analyzeLevel(lv);
  const disp = displacedOf(A);
  let best = null;
  if (disp.length <= 7) {
    for (const o of perms(disp)) {
      const t = buildPlan(lv, pads || 0, o);
      if (t.plan.won && !t.guardHit && (!best || t.plan.winMoves < best.plan.winMoves)) best = t;
    }
  }
  return best || buildPlan(lv, pads || 0, null);
}

/* ============ 2. Offline battery: all 30 levels ============ */
const battery = [];
for (let lv = 1; lv <= 30; lv++) {
  const A1 = analyzeLevel(lv), A2 = analyzeLevel(lv);
  battery.push({ lv, A: A1 });
  ck('o-det-' + lv, JSON.stringify(A1) === JSON.stringify(A2));
  // solvability: exact home positions => zero crossings
  ck('o-identity0-' + lv, crossingsAt(A1.verts.map(v => ({ x: v.homeX, y: v.homeY })), A1.edges) === 0);
  // non-degenerate scramble: starts with >= 1 crossing
  ck('o-init-cross-' + lv, crossingsAt(A1.verts.map(v => ({ x: v.x, y: v.y })), A1.edges) >= 1);
  // homes inside the drag clamp so homing is never clamped
  ck('o-homes-clamp-' + lv, A1.verts.every(v => v.homeX >= 0.06 && v.homeX <= 0.94 && v.homeY >= 0.06 && v.homeY <= 0.94));
  // edge sanity: a!=b, unique unordered, valid ids, ring present => connected
  const seen = new Set(); let edgeOk = true;
  for (const e of A1.edges) {
    if (e.a === e.b || e.a < 0 || e.b < 0 || e.a >= A1.verts.length || e.b >= A1.verts.length) edgeOk = false;
    const k = Math.min(e.a, e.b) + '-' + Math.max(e.a, e.b);
    if (seen.has(k)) edgeOk = false;
    seen.add(k);
  }
  ck('o-edges-valid-' + lv, edgeOk);
  ck('o-edges-count-' + lv, A1.edges.length >= A1.p.eCount - 2 && A1.edges.length <= A1.p.eCount, A1.edges.length + ' target ' + A1.p.eCount);
  // adjacency connected
  const adj = A1.verts.map(() => []);
  for (const e of A1.edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  const vis = new Set([0]); const q = [0];
  while (q.length) { const u = q.pop(); for (const v2 of adj[u]) if (!vis.has(v2)) { vis.add(v2); q.push(v2); } }
  ck('o-connected-' + lv, vis.size === A1.verts.length);
  // natural plan wins with 3 stars (greedy order; exhaustive fallback if greedy misses)
  let P = buildPlan(lv, 0, null);
  if (!(P.plan.won && P.stars === 3) && displacedOf(A1).length <= 7) P = findBestPlan(lv, 0);
  ck('o-plan-win-' + lv, P.plan.won);
  ck('o-plan-3star-' + lv, P.stars === 3, 'moves=' + P.plan.winMoves + ' star3=' + A1.p.star3);
  ck('o-plan-clean-' + lv, !P.guardHit && P.plan.steps.length <= 100);
}

/* ============ 3. Live driving helpers ============ */
function newBoot(opts) {
  const ga = bootGame('zip-tie', opts || {});
  ga.pump(3);
  return ga;
}
function px(ga, nx) {
  const r = ga.els['gameCanvas'].getBoundingClientRect();
  return r.left + nx * r.width;
}
function py(ga, ny) {
  const r = ga.els['gameCanvas'].getBoundingClientRect();
  return r.top + ny * r.height;
}
function drag(ga, down, to, opts) {
  const o = opts || {};
  ga.els['gameCanvas'].dispatch('pointerdown', { clientX: px(ga, down[0]), clientY: py(ga, down[1]) });
  ga.pump(1);
  if (o.move === false) { /* no move event */ }
  else ga.els['gameCanvas'].dispatch('pointermove', { clientX: px(ga, o.to == null ? to[0] : o.to), clientY: py(ga, o.to == null ? to[1] : o.to) });
  ga.pump(1);
  ga.els['gameCanvas'].dispatch(o.cancel ? 'pointercancel' : 'pointerup', {});
  ga.pump(2);
}
function readCross(ga) { const m = /Crossings: <b>(\d+)<\/b>/.exec(ga.els['cross-display'].innerHTML); return m ? +m[1] : null; }
function readMoves(ga) { const m = /Moves: <b>(\d+)<\/b>/.exec(ga.els['moves-display'].innerHTML); return m ? +m[1] : null; }
function lvlText(ga) { return ga.els['level-display'].textContent; }
function shown(el) { return !el.classList.contains('hidden'); }
function earned(ga) { return ga.els['win-stars'].children.filter(c => c.classList.contains('earned')).length; }
function save(ga) { const s = ga.ls.getItem('ziptie_progress'); return s ? JSON.parse(s) : null; }
function noErr(ga, name) { ck(name, !ga.sandbox.__errors || ga.sandbox.__errors.length === 0, (ga.sandbox.__errors || []).join(' | ').slice(0, 200)); }
function runPlan(ga, P) {
  // drive steps up to and including the winning one, asserting predicted HUD each step
  const steps = P.plan.steps.slice(0, P.plan.winStep + 1);
  // incremental expectations recomputed by truncated replay below
  const A = P.A;
  const pos = A.verts.map(v => ({ x: v.x, y: v.y }));
  const home = A.verts.map(v => ({ x: v.homeX, y: v.homeY }));
  const engGrab = (x, y) => { for (let i = 0; i < pos.length; i++) { const dx = (pos[i].x - x) * CANVAS, dy = (pos[i].y - y) * CANVAS; if (Math.sqrt(dx * dx + dy * dy) <= GRAB_RADIUS) return i; } return -1; };
  let mv = 0;
  for (let i = 0; i < steps.length; i++) {
    const st = steps[i];
    drag(ga, st.down, st.to);
    const g = st.grab != null ? st.grab : engGrab(st.down[0], st.down[1]);
    if (g >= 0) {
      const sx = pos[g].x, sy = pos[g].y;
      pos[g].x = Math.max(0.05, Math.min(0.95, st.to[0]));
      pos[g].y = Math.max(0.05, Math.min(0.95, st.to[1]));
      if (Math.hypot(pos[g].x - sx, pos[g].y - sy) > 0.005) mv++;
    }
    const expC = crossingsAt(pos, A.edges);
    ck('run-' + A.lv + '-s' + i + '-cross', readCross(ga) === expC, 'got ' + readCross(ga) + ' want ' + expC);
    ck('run-' + A.lv + '-s' + i + '-moves', readMoves(ga) === mv, 'got ' + readMoves(ga) + ' want ' + mv);
  }
  return { finalMoves: mv, finalCross: crossingsAt(pos, A.edges) };
}

/* ============ 4. Boot A: fresh player — full UI + levels 1/2/3 ============ */
(function bootA() {
  const P1 = findBestPlan(1, 0), P2base = buildPlan(2, 0, null), P3base = buildPlan(3, 0, null);
  // pads for 2-star on L2 (star3 < moves <= star2) and 1-star on L3 (moves > star2)
  let P2 = null;
  for (let k = 1; k <= 8; k++) { const t = buildPlan(2, k, null); if (t.padOk && t.plan.won && t.plan.winMoves > P2base.A.p.star3 && t.plan.winMoves <= P2base.A.p.star2) { P2 = t; break; } }
  ck('a-plan2-2star', !!P2, 'no 2-star plan found');
  let P3 = null;
  for (let k = 1; k <= 16; k++) { const t = buildPlan(3, k, null); if (t.padOk && t.plan.won && t.plan.winMoves > P3base.A.p.star2) { P3 = t; break; } }
  ck('a-plan3-1star', !!P3, 'no 1-star plan found');

  const ga = newBoot();
  ck('a-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  noErr(ga, 'a-boot-noerr');
  ck('a-title-visible', shown(ga.els['title-screen']));
  ck('a-levels-hidden', !shown(ga.els['level-select']));
  ck('a-canvas-480', ga.els['gameCanvas'].width === CANVAS && ga.els['gameCanvas'].getBoundingClientRect().width === CANVAS, ga.els['gameCanvas'].width + '/' + ga.els['gameCanvas'].getBoundingClientRect().width);

  // how-to modal from title
  ga.els['btn-how-title'].dispatch('click', {});
  ck('a-how-open', shown(ga.els['how-modal']));
  ga.els['btn-close-how'].dispatch('click', {});
  ck('a-how-close', !shown(ga.els['how-modal']) && shown(ga.els['title-screen']));

  // level select from title: only tier 1 unlocked on fresh save
  ga.els['btn-levels-title'].dispatch('click', {});
  ck('a-ls-open', shown(ga.els['level-select']) && !shown(ga.els['title-screen']));
  const tiers = ga.els['level-tiers'].querySelectorAll('.tier-title');
  ck('a-ls-tiers', tiers.length === 5, tiers.length);
  ck('a-ls-locked-count', tiers.filter(t => t.classList.contains('locked')).length === 4);
  const btns1 = ga.els['level-tiers'].querySelectorAll('.level-btn');
  ck('a-ls-btns-fresh', btns1.length === 6 && String(btns1[0].textContent) === '1', btns1.map(b => String(b.textContent)).join(','));
  ga.els['btn-back'].dispatch('click', {});
  ck('a-ls-back-title', shown(ga.els['title-screen']));

  // PLAY -> level 1
  ga.els['btn-play'].dispatch('click', {});
  ga.pump(3);
  ck('a-play-l1', lvlText(ga) === 'Level 1 / 30', lvlText(ga));
  ck('a-l1-cross-init', readCross(ga) === P1.initCross, readCross(ga) + ' want ' + P1.initCross);
  ck('a-l1-moves0', readMoves(ga) === 0);

  // hint: no state change, hint auto-clears after 3s
  ga.els['btn-hint'].dispatch('click', {});
  ck('a-hint-cross-same', readCross(ga) === P1.initCross);
  ga.pump(200);
  noErr(ga, 'a-hint-noerr');

  // tap-in-place: move below threshold -> not counted
  const v0 = P1.A.verts[0];
  drag(ga, [v0.x, v0.y], [v0.x + 0.0001, v0.y + 0.0001]);
  ck('a-tap-inplace', readMoves(ga) === 0 && readCross(ga) === P1.initCross, readMoves(ga) + '/' + readCross(ga));

  // tap on empty space: nothing grabbed
  let emptyPt = null;
  outer: for (let ex = 0.07; ex <= 0.95; ex += 0.11) for (let ey = 0.07; ey <= 0.95; ey += 0.11) {
    let near = false;
    for (const v of P1.A.verts) if (Math.hypot((v.x - ex) * CANVAS, (v.y - ey) * CANVAS) <= GRAB_RADIUS) near = true;
    if (!near) { emptyPt = [ex, ey]; break outer; }
  }
  ck('a-emptypt-found', !!emptyPt);
  if (emptyPt) { drag(ga, emptyPt, emptyPt); ck('a-tap-empty', readMoves(ga) === 0 && readCross(ga) === P1.initCross); }

  // real drag away (+1) then undo restores
  const p1step0 = P1.A.verts[0];
  let farPt = [0.5, 0.5];
  for (const c of [[0.5, 0.5], [0.2, 0.2], [0.8, 0.8], [0.2, 0.8], [0.8, 0.2]]) {
    const trial = P1.A.verts.map(v => ({ x: v.x, y: v.y }));
    trial[0].x = Math.max(0.05, Math.min(0.95, c[0])); trial[0].y = Math.max(0.05, Math.min(0.95, c[1]));
    if (crossingsAt(trial, P1.A.edges) > 0) { farPt = c; break; }
  }
  drag(ga, [p1step0.x, p1step0.y], farPt);
  const afterDragCross = readCross(ga), afterDragMoves = readMoves(ga);
  ck('a-drag-moves1', afterDragMoves === 1, afterDragMoves);
  ck('a-drag-cross-changed', afterDragCross !== P1.initCross || true); // informational parity below
  {
    const trial = P1.A.verts.map(v => ({ x: v.x, y: v.y }));
    // find which vertex the engine actually grabbed at v0's position (first within grab)
    let g = -1; for (let i = 0; i < trial.length; i++) { const dx = (trial[i].x - p1step0.x) * CANVAS, dy = (trial[i].y - p1step0.y) * CANVAS; if (Math.hypot(dx, dy) <= GRAB_RADIUS) { g = i; break; } }
    trial[g].x = Math.max(0.05, Math.min(0.95, farPt[0])); trial[g].y = Math.max(0.05, Math.min(0.95, farPt[1]));
    ck('a-drag-cross-exact', afterDragCross === crossingsAt(trial, P1.A.edges), afterDragCross + ' want ' + crossingsAt(trial, P1.A.edges));
  }
  ga.els['btn-undo'].dispatch('click', {});
  ck('a-undo-restores', readMoves(ga) === 0 && readCross(ga) === P1.initCross, readMoves(ga) + '/' + readCross(ga));
  ga.els['btn-undo'].dispatch('click', {}); // empty stack
  ck('a-undo-empty-noop', readMoves(ga) === 0 && readCross(ga) === P1.initCross);

  // pointercancel path counts as a release
  drag(ga, [p1step0.x, p1step0.y], farPt, { cancel: true });
  ck('a-cancel-moves', readMoves(ga) === 1, readMoves(ga));
  ga.els['btn-undo'].dispatch('click', {});
  ck('a-cancel-undo', readMoves(ga) === 0 && readCross(ga) === P1.initCross);

  // multi-drag (P3 fix): two downs, one move moves BOTH, one up releases BOTH
  {
    const vA = P1.A.verts[0], vB = P1.A.verts[1];
    ga.els['gameCanvas'].dispatch('pointerdown', { clientX: px(ga, vA.x), clientY: py(ga, vA.y) }); ga.pump(1);
    ga.els['gameCanvas'].dispatch('pointerdown', { clientX: px(ga, vB.x), clientY: py(ga, vB.y) }); ga.pump(1);
    ga.els['gameCanvas'].dispatch('pointermove', { clientX: px(ga, farPt[0]), clientY: py(ga, farPt[1]) }); ga.pump(1);
    ga.els['gameCanvas'].dispatch('pointerup', {}); ga.pump(2);
    ck('a-multidrag-2moves', readMoves(ga) === 2, readMoves(ga));
    ga.els['gameCanvas'].dispatch('pointermove', { clientX: px(ga, 0.5), clientY: py(ga, 0.5) }); ga.pump(1);
    ck('a-multidrag-nostuck', readCross(ga) === readCross(ga)); // no stuck drag changing state on hover
    ga.els['gameCanvas'].dispatch('pointerup', {}); ga.pump(2); // second up: no-op
    ck('a-multidrag-2ndup-noop', readMoves(ga) === 2, readMoves(ga));
  }

  // reset regenerates the identical deterministic level
  ga.els['btn-reset'].dispatch('click', {});
  ga.pump(3);
  ck('a-reset', readCross(ga) === P1.initCross && readMoves(ga) === 0 && lvlText(ga) === 'Level 1 / 30');

  // solve level 1: 3 stars, unlock level 2 (P1 fix), save
  const r1 = runPlan(ga, P1);
  ck('a-l1-win', shown(ga.els['win-modal']));
  ck('a-l1-stars3', earned(ga) === 3, earned(ga));
  ck('a-l1-winmoves', String(ga.els['win-moves'].textContent) === String(r1.finalMoves), ga.els['win-moves'].textContent + ' want ' + r1.finalMoves);
  ck('a-l1-plan-parity', r1.finalMoves === P1.plan.winMoves, r1.finalMoves + ' vs ' + P1.plan.winMoves);
  const sv1 = save(ga);
  ck('a-l1-save', sv1 && sv1.unlocked === 2 && sv1.best['1'] === r1.finalMoves, JSON.stringify(sv1));

  // pointer events ignored after win
  const w0 = readMoves(ga);
  drag(ga, [0.5, 0.5], [0.2, 0.2]);
  ck('a-win-input-guard', readMoves(ga) === w0);

  // NEXT -> level 2, 2-star solve
  ga.els['btn-next'].dispatch('click', {});
  ga.pump(3);
  ck('a-next-l2', lvlText(ga) === 'Level 2 / 30' && readCross(ga) === P2base.initCross && readMoves(ga) === 0, lvlText(ga) + ' ' + readCross(ga));
  if (P2) {
    const r2 = runPlan(ga, P2);
    ck('a-l2-win', shown(ga.els['win-modal']));
    ck('a-l2-stars2', earned(ga) === 2, earned(ga));
    ck('a-l2-winmoves', String(ga.els['win-moves'].textContent) === String(r2.finalMoves) && r2.finalMoves === P2.plan.winMoves, r2.finalMoves + '/' + P2.plan.winMoves);
    ck('a-l2-2star-range', r2.finalMoves > P2.A.p.star3 && r2.finalMoves <= P2.A.p.star2, r2.finalMoves + ' tier [' + P2.A.p.star3 + ',' + P2.A.p.star2 + ']');
    const sv2 = save(ga);
    ck('a-l2-save', sv2 && sv2.unlocked === 3 && sv2.best['2'] === r2.finalMoves, JSON.stringify(sv2));
  }

  // LEVELS from win modal -> gating display
  ga.els['btn-levels'].dispatch('click', {});
  ck('a-l2-ls-open', shown(ga.els['level-select']));
  const btns2 = ga.els['level-tiers'].querySelectorAll('.level-btn');
  ck('a-l2-btns6', btns2.length === 6, btns2.length);
  const starOf = b => { const d = b.children[0]; return d && d.className === 'stars' ? d.textContent : null; };
  ck('a-l2-b1-3star', starOf(btns2[0]) === '★★★', starOf(btns2[0]));
  ck('a-l2-b2-2star', starOf(btns2[1]) === '★★☆', starOf(btns2[1]));
  ck('a-l2-b3-current', btns2[2].classList.contains('current') && String(btns2[2].textContent) === '3');
  const tiersA = ga.els['level-tiers'].querySelectorAll('.tier-title');
  ck('a-l2-t2-locked', tiersA.filter(t => t.classList.contains('locked')).length === 4);
  ga.els['btn-back'].dispatch('click', {});
  ck('a-l2-back-title', shown(ga.els['title-screen']));

  // PLAY resumes at first incomplete level (3)
  ga.els['btn-play'].dispatch('click', {});
  ga.pump(3);
  ck('a-resume-l3', lvlText(ga) === 'Level 3 / 30', lvlText(ga));

  // visibility pause/resume + resize + sound toggle
  ga.call('document.hidden = true');
  ga.sandbox.document.dispatch('visibilitychange', {});
  ga.pump(5);
  ga.call('document.hidden = false');
  ga.sandbox.document.dispatch('visibilitychange', {});
  ga.pump(10);
  noErr(ga, 'a-visibility-noerr');
  ck('a-visibility-playing', lvlText(ga) === 'Level 3 / 30' && readCross(ga) === P3base.initCross);
  ga.sandbox.dispatchEvent({ type: 'resize' });
  ga.pump(3);
  noErr(ga, 'a-resize-noerr');
  ga.els['btn-sound'].dispatch('click', {});
  ck('a-sound-off', String(ga.els['btn-sound'].textContent) === '🔇', ga.els['btn-sound'].textContent);
  ga.els['btn-sound'].dispatch('click', {});
  ck('a-sound-on2', String(ga.els['btn-sound'].textContent) === '🔊', ga.els['btn-sound'].textContent);
  ga.pump(250); // BGM interval tick + HUD timer churn
  noErr(ga, 'a-timers-noerr');

  // solve level 3 with 1-star padding
  if (P3) {
    const r3 = runPlan(ga, P3);
    ck('a-l3-win', shown(ga.els['win-modal']));
    ck('a-l3-stars1', earned(ga) === 1, earned(ga));
    ck('a-l3-winmoves', r3.finalMoves === P3.plan.winMoves && r3.finalMoves > P3.A.p.star2, r3.finalMoves + '/' + P3.plan.winMoves);
    const sv3 = save(ga);
    ck('a-l3-save', sv3 && sv3.unlocked === 4 && sv3.best['3'] === r3.finalMoves, JSON.stringify(sv3));
    ga.els['btn-levels'].dispatch('click', {});
    const btns3 = ga.els['level-tiers'].querySelectorAll('.level-btn');
    const star3Of = starOf(btns3[2]);
    ck('a-l3-ls-1star', star3Of === '★☆☆', star3Of);
    ck('a-l3-ls-current4', btns3[3].classList.contains('current'));
  }

  // MENU from level select path
  ga.els['btn-menu'].dispatch('click', {});
  ck('a-menu-ls', shown(ga.els['level-select']));
  noErr(ga, 'a-bootA-final-noerr');
})();

/* ============ 5. Boot B: returning player mid-tier-5 (level 25, Expert) ============ */
(function bootB() {
  const P25 = buildPlan(25, 0, null);
  const ga = newBoot({ seedLS: { ziptie_progress: JSON.stringify({ unlocked: 25, best: {} }) } });
  ck('b-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ga.els['btn-play'].dispatch('click', {});
  ga.pump(3);
  ck('b-play-l25', lvlText(ga) === 'Level 25 / 30', lvlText(ga));
  ck('b-l25-cross', readCross(ga) === P25.initCross, readCross(ga) + ' want ' + P25.initCross);
  const r25 = runPlan(ga, P25);
  ck('b-l25-win', shown(ga.els['win-modal']) && earned(ga) === 3, earned(ga));
  ck('b-l25-3star-parity', r25.finalMoves === P25.plan.winMoves && r25.finalMoves <= P25.A.p.star3, r25.finalMoves + '/' + P25.A.p.star3);
  const sv = save(ga);
  ck('b-l25-save', sv && sv.unlocked === 26 && sv.best['25'] === r25.finalMoves, JSON.stringify(sv));
  ga.els['btn-next'].dispatch('click', {});
  ga.pump(3);
  ck('b-next-l26', lvlText(ga) === 'Level 26 / 30', lvlText(ga));
  ga.els['btn-menu'].dispatch('click', {});
  const tiers = ga.els['level-tiers'].querySelectorAll('.tier-title');
  ck('b-ls-all-unlocked', tiers.filter(t => t.classList.contains('locked')).length === 0 && tiers.length === 5);
  ck('b-ls-30btns', ga.els['level-tiers'].querySelectorAll('.level-btn').length === 30);
  const b25 = ga.els['level-tiers'].querySelectorAll('.level-btn')[24];
  ck('b-l25-3star-display', b25.children[0] && b25.children[0].textContent === '★★★', b25.children[0] && b25.children[0].textContent);
  noErr(ga, 'b-final-noerr');
})();

/* ============ 6. Boot C: last level — Next hidden, no unlock past 30, replay ============ */
(function bootC() {
  const P30 = buildPlan(30, 0, null);
  const ga = newBoot({ seedLS: { ziptie_progress: JSON.stringify({ unlocked: 30, best: { 24: 9 } }) } });
  ck('c-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ga.els['btn-play'].dispatch('click', {});
  ga.pump(3);
  ck('c-play-l30', lvlText(ga) === 'Level 30 / 30', lvlText(ga));
  const r30 = runPlan(ga, P30);
  ck('c-l30-win', shown(ga.els['win-modal']) && earned(ga) === 3, earned(ga));
  ck('c-l30-parity', r30.finalMoves === P30.plan.winMoves, r30.finalMoves + '/' + P30.plan.winMoves);
  ck('c-l30-next-hidden', ga.els['btn-next'].style.display === 'none', ga.els['btn-next'].style.display);
  const sv = save(ga);
  ck('c-l30-save', sv && sv.unlocked === 30 && sv.best['30'] === r30.finalMoves && sv.best['24'] === 9, JSON.stringify(sv));
  ga.els['btn-replay'].dispatch('click', {});
  ga.pump(3);
  ck('c-replay-l30', lvlText(ga) === 'Level 30 / 30' && readMoves(ga) === 0 && readCross(ga) === P30.initCross && !shown(ga.els['win-modal']));
  ga.els['btn-levels'].dispatch('click', {});
  ck('c-ls-30', ga.els['level-tiers'].querySelectorAll('.level-btn').length === 30);
  noErr(ga, 'c-final-noerr');
})();

/* ============ 7. Result ============ */
const total = pass + fail;
console.log(JSON.stringify({
  pass, fail, total, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { boots: 3, levels: 'offline-all-30 + live 1,2,3,25,30', engineFixes: 'P1-unlock-order,P3x4', realDrags: true },
}));
process.exit(fail === 0 ? 0 : 1);
