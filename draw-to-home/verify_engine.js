#!/usr/bin/env node
/* draw-to-home in-engine verifier (wave-A3). Draw-a-path puzzle: per character, the player
 * draws one polyline (ink-limited) from the char to its color-matched home; the char then
 * walks it at 2.5px/frame and dies on wall/mover contact (corner-point test, r=10) or if
 * the path end is >35px from its home. Win = engine's own updateGame: every char happy ->
 * state.won + showWin modal + save persisted to localStorage drawToHome_v2.
 * Strategy: per level, an INDEPENDENT A* (walls + mover sweep regions inflated by 13px)
 * finds a collision-free path per char, then it is PLAYED through the engine's real input
 * path: pointerdown at the char (near-char gate), pointermove along the polyline (the
 * engine's own ink accounting), pointerup (path assignment); rAF pumped at dt=1 until the
 * engine declares win. Levels whose shortest legal path exceeds inkMax are reported as
 * UNSOLVABLE(minInk=...) — those were regenerated in level data (see
 * _optimization/scripts/fix-drawtohome-levels.js; original ink budgets were sized for a
 * ~200px-wide board, but the engine runs a 600x900 canvas — every shipped level was
 * unwinnable, and 9 levels additionally had gapless full-height walls).
 * Usage: node draw-to-home/verify_engine.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'draw-to-home';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY (index.html untouched): the engine is one big IIFE and `state` is
 * reassigned at boot AFTER this anchor, so export getters, not values. */
const ANCHOR = 'window.__drawToHomeDestroy = destroy;';
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__DTH={get state(){return state;},LEVELS:LEVELS,startLevel:startLevel};');

/* ---- sandbox ---- */
const rafQ = [];
function mkEl(id, extra) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '', disabled: false, hidden: false,
    style: { setProperty() {}, cssText: '' }, dataset: {}, className: '',
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, dispatch(t, ev) { if (t === 'click' && typeof this.onclick === 'function') { try { this.onclick(ev || { preventDefault() {} }); } catch (e) { ctx.__timerErrs.push('onclick:' + String(e && e.message)); } } (listeners[t] || []).forEach(f => f(ev || { preventDefault() {} })); },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width || 600, height: el.height || 900, right: el.width || 600, bottom: el.height || 900 }),
    setAttribute() {}, getAttribute: () => '', focus() {}, blur() {},
    getContext: () => new Proxy({}, { get(t, p) { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }),
    clientWidth: 600, clientHeight: 900, width: 600, height: 900, offsetWidth: 10,
  };
  Object.assign(el, extra || {});
  return el;
}
const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
const canvasEl = mkEl('gameCanvas', { width: 600, height: 900 });
els.set('gameCanvas', canvasEl);
const MathClone = Object.assign(Object.create(Math), Math);
const ctx = {
  console: { log() {}, error() {}, warn() {} }, Date, JSON, Math: MathClone,
  CanvasRenderingContext2D: { prototype: {} },
  setTimeout: (f) => { /* immediate-run stub with nesting guard: BGM re-schedules itself via
   * setTimeout, which would recurse to stack overflow if run at depth 0 forever */
    if (typeof f === 'function' && ctx.__tdepth < 200) { ctx.__tdepth++; try { f(); } catch (e) { ctx.__timerErrs.push(String(e && e.message)); } finally { ctx.__tdepth--; } } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval: {},
  requestAnimationFrame: (f) => { rafQ.push(f); return rafQ.length; }, cancelAnimationFrame() {},
  performance: null,
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '' },
  document: {
    getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, createElement: t => mkEl(t),
    body: mkEl('body'), documentElement: mkEl('html'), hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  /* AudioContext stub: initAudio() does `new (window.AudioContext||...)()` — undefined
   * would throw inside the real pointerdown handler */
  AudioContext: function () {
    this.currentTime = 0; this.destination = {};
    this.createOscillator = () => ({ type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} });
    this.createGain = () => ({ gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} });
    this.close = () => Promise.resolve();
  },
  alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  CustomEvent: function (t) { this.type = t; },
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  innerWidth: 600, innerHeight: 900, devicePixelRatio: 1,
  __timerErrs: [], __tdepth: 0, adsbygoogle: { push() {} },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
ctx.webkitAudioContext = ctx.AudioContext;
let NOW = 1000000; /* virtual clock; pump advances by exactly 16.67 => loop dt = 1 */
ctx.performance = { now: () => NOW };
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const DTH = ctx.window.__DTH;
if (!DTH || !DTH.LEVELS) { console.error('no engine export'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const LEVELS = DTH.LEVELS, W = 600, H = 900;

/* ---- independent path planner. Engine collision truth: a char dies when the single
 * corner point (x-10, y-10) enters a wall/mover rect (inWall/inMover, r=10), so the
 * forbidden region for the char CENTER is each rect translated by (+10,+10) and widened
 * by a small safety margin (waypoint overshoot is 2.5px/frame) ---- */
function toWorld(lvl) {
  const walls = lvl.walls.map(w => ({ x: w.x * W / 100, y: w.y * H / 100, w: w.w * W / 100, h: w.h * H / 100 }));
  const movers = (lvl.movers || []).map(m => {
    const x = m.x * W / 100, y = m.y * H / 100, w = m.w * W / 100, h = m.h * H / 100;
    const rg = m.range || 50;
    /* engine initLevel: dx: m.dx*W/100/60 per frame (dt=1 in the pumped loop) */
    return { x, y, w, h, sx: x, sy: y, range: rg, dx: m.dx * W / 100 / 60, dy: m.dy * H / 100 / 60 };
  });
  const chars = lvl.chars.map(c => ({ x: c.x * W / 100, y: c.y * H / 100, ci: c.ci }));
  const homes = lvl.homes.map(h => ({ x: h.x * W / 100, y: h.y * H / 100, ci: h.ci }));
  return { walls, movers, chars, homes };
}
function astar(lvl, from, to, opt) {
  const CELL = opt.cell || 6, M = opt.m === undefined ? 4 : opt.m; /* corner inflation */
  const { walls, movers } = toWorld(lvl);
  /* blocked center box: the corner point (x-10,y-10) inflated by M around the rect —
   * i.e. center x in (wx, wx+ww) both shifted +10 and widened by M on each side */
  const blocked = (x, y) => {
    const cx = x - 10, cy = y - 10;
    for (const w of walls) if (cx > w.x - M && cx < w.x + w.w + M && cy > w.y - M && cy < w.y + w.h + M) return true;
    if (!opt.ignoreMovers) for (const m of movers) {
      /* sweep box scaled by opt.sweepScale: scale 1 = timing-proof full sweep; fractional
       * scales bias the path to cross during the mover's off-phase (sim validates timing) */
      const rg = (m.range || 0) * (opt.sweepScale === undefined ? 1 : opt.sweepScale);
      if (cx > m.x - rg - M && cx < m.x + m.w + rg + M && cy > m.y - rg - M && cy < m.y + m.h + rg + M) return true;
    }
    return false;
  };
  const clampPad = 16;
  const x0 = clampPad, x1 = W - clampPad, y0 = clampPad + 0, y1 = H - clampPad;
  const nx = Math.floor((x1 - x0) / CELL) + 1, ny = Math.floor((y1 - y0) / CELL) + 1;
  const id = (i, j) => j * nx + i;
  const px = i => Math.min(x1, x0 + i * CELL), py = j => Math.min(y1, y0 + j * CELL);
  const blk = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) blk[id(i, j)] = blocked(px(i), py(j)) ? 1 : 0;
  const gi = p => Math.max(0, Math.min(nx - 1, Math.round((p - x0) / CELL))), gj = p => Math.max(0, Math.min(ny - 1, Math.round((p - y0) / CELL)));
  const si = gi(from.x), sj = gj(from.y);
  /* a char can spawn inside the inflated margin of a wall (e.g. spiral L18 char sits on a
   * wall edge) — leaving is legal as long as the next step's corner point clears the wall,
   * so never reject on a blocked START cell; just unblock it. */
  blk[id(si, sj)] = 0;
  let ti = gi(to.x), tj = gj(to.y);
  if (blk[id(ti, tj)]) {
    /* home centre inside the inflated band: the engine only needs the path END within 35px
     * of the home — retarget to the nearest free cell <30px away */
    let found = false;
    for (let r = 2; r <= 6 && !found; r++) {
      for (let di = -r; di <= r && !found; di++) for (let dj = -r; dj <= r && !found; dj++) {
        const ni = ti + di, nj = tj + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue;
        if (blk[id(ni, nj)]) continue;
        if (Math.hypot(px(ni) - to.x, py(nj) - to.y) < 30) { ti = ni; tj = nj; found = true; }
      }
    }
    if (!found) return null;
  }
  const dist = new Float64Array(nx * ny).fill(Infinity);
  const prev = new Int32Array(nx * ny).fill(-1);
  const open = [[si, sj]]; dist[id(si, sj)] = 0;
  const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
  let nodes = 0; const CAP = 4e6;
  while (open.length) {
    if (++nodes > CAP) return null;
    let bi = 0; for (let k = 1; k < open.length; k++) if (dist[id(open[k][0], open[k][1])] + Math.hypot(open[k][0] - ti, open[k][1] - tj) < dist[id(open[bi][0], open[bi][1])] + Math.hypot(open[bi][0] - ti, open[bi][1] - tj)) bi = k;
    const [ci, cj] = open.splice(bi, 1)[0];
    if (ci === ti && cj === tj) {
      const pts = []; let cur = id(ci, cj);
      while (cur !== -1) { pts.push({ x: px(cur % nx), y: py(Math.floor(cur / nx)) }); cur = prev[cur]; }
      pts.reverse(); pts.push({ x: px(ti), y: py(tj) });
      return smooth(pts, blocked);
    }
    for (const [di, dj, w] of D) {
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue;
      if (blk[id(ni, nj)]) continue;
      if (di && dj && (blk[id(ci + di, cj)] || blk[id(ci, cj + dj)])) continue; /* no corner cutting */
      const nd = dist[id(ci, cj)] + w;
      if (nd < dist[id(ni, nj)] - 1e-9) { dist[id(ni, nj)] = nd; prev[id(ni, nj)] = id(ci, cj); if (!open.some(o => o[0] === ni && o[1] === nj)) open.push([ni, nj]); }
    }
  }
  return null;
}
function segClear(a, b, blocked) {
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(2, Math.ceil(d / 4));
  for (let s = 0; s <= n; s++) { const x = a.x + (b.x - a.x) * s / n, y = a.y + (b.y - a.y) * s / n; if (blocked(x, y)) return false; }
  return true;
}
function smooth(pts, blocked) {
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !segClear(pts[i], pts[j], blocked)) j--;
    out.push(pts[j]); i = j;
  }
  return out;
}
/* exact mirror of what the engine will do: the drawn polyline is emitted as pointermove
 * points every <=8px, the engine appends only points >3px from the last, and anchors the
 * path at the char's exact position. The simulator must replay the SAME filtered path. */
function emitPoints(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(d / 8));
    for (let s = 1; s <= steps; s++) out.push({ x: a.x + (b.x - a.x) * s / steps, y: a.y + (b.y - a.y) * s / steps });
  }
  return out;
}
function enginePath(startPt, pts) {
  const p = [{ x: startPt.x, y: startPt.y }];
  for (const q of emitPoints(pts)) {
    const last = p[p.length - 1];
    if (Math.hypot(q.x - last.x, q.y - last.y) > 3) p.push(q);
  }
  return p;
}
/* offline replay of updateMovers+updateChars (dt=1, same float ops, same order). Chars are
 * drawn sequentially: char i is assigned its path after `delays[i]` frames beyond the
 * resolution of char i-1 (delays[0] from level start). Returns final mover state so the
 * scheduler can continue from a snapshot. */
function simSegment(lvlWorld, lvl, path, charIdx, prev, delay) {
  const inR = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const ms = prev ? prev.ms.map(m => Object.assign({}, m)) : lvlWorld.movers.map(m => Object.assign({}, m));
  const c0 = lvlWorld.chars[charIdx];
  const home = lvlWorld.homes.find(h => h.ci === lvl.chars[charIdx].ci);
  const c = { x: c0.x, y: c0.y, path: enginePath(c0, path), pathIndex: 0, done: false, happy: false };
  let assigned = false;
  for (let f = 0; f < 9000; f++) {
    if (!assigned && delay-- <= 0) assigned = true;
    for (const m of ms) {
      m.x += m.dx; m.y += m.dy;
      const d = Math.hypot(m.x - m.sx, m.y - m.sy);
      if (d > m.range) {
        m.dx *= -1; m.dy *= -1;
        m.x = Math.max(m.sx - m.range, Math.min(m.sx + m.range, m.x));
        m.y = Math.max(m.sy - m.range, Math.min(m.sy + m.range, m.y));
      }
    }
    if (!assigned || c.done) continue;
    if (c.pathIndex < c.path.length) {
      const t = c.path[c.pathIndex], dx = t.x - c.x, dy = t.y - c.y, dist = Math.hypot(dx, dy);
      if (dist < 3) { c.pathIndex++; continue; }
      const nx = dx / dist, ny = dy / dist, nextX = c.x + nx * 2.5, nextY = c.y + ny * 2.5;
      const hit = (x, y) => lvlWorld.walls.some(w => inR(x, y, w)) || ms.some(m => inR(x, y, m));
      if (hit(nextX - 10, nextY - 10)) return { ok: false, why: 'sim-died@' + Math.round(c.x) + ',' + Math.round(c.y) + ' f' + f };
      c.x = nextX; c.y = nextY;
      if (hit(c.x - 10, c.y - 10)) return { ok: false, why: 'sim-died@' + Math.round(c.x) + ',' + Math.round(c.y) + ' f' + f };
    } else {
      c.done = true;
      c.happy = Math.hypot(c.x - home.x, c.y - home.y) < 35;
      if (c.happy) return { ok: true, ms, frames: f };
      return { ok: false, why: 'sim-unmatched-end' };
    }
  }
  return { ok: false, why: 'sim-cap' };
}
/* greedy per-character phase search: after char i-1 resolves (mover snapshot), scan one
 * full mover period for a delay that lets char i walk its path cleanly. */
function planSchedule(lvlWorld, lvl, paths, P) {
  const step = 6;
  const range = [];
  for (let d = 0; d <= Math.max(P, 12); d += step) range.push(d);
  const delays = [];
  let snap = null;
  for (let k = 0; k < paths.length; k++) {
    let found = -1;
    for (const d of range) {
      const r = simSegment(lvlWorld, lvl, paths[k], k, snap, d);
      if (r.ok) { snap = { ms: r.ms }; found = d; break; }
    }
    if (found < 0) return null;
    delays.push(found);
  }
  return delays;
}
function planLevel(lvl) {
  const lvlWorld = toWorld(lvl);
  const opts = [
    { cell: 6, m: 5, ignoreMovers: true }, { cell: 6, m: 10, ignoreMovers: true }, { cell: 4, m: 7, ignoreMovers: true },
    { cell: 6, m: 5 }, { cell: 8, m: 14 }, /* sweep-blocked (timing-proof) */
    { cell: 6, m: 5, sweepScale: 0.5 }, { cell: 3, m: 3, sweepScale: 0.25 }, { cell: 3, m: 3, sweepScale: 0.75 }, /* partial-sweep crossings */
    { cell: 3, m: 3, ignoreMovers: true }, { cell: 3, m: 2, ignoreMovers: true },
  ];
  const cands = [];
  for (const c of lvlWorld.chars) {
    const home = lvlWorld.homes.find(h => h.ci === c.ci);
    if (!home) return { unsolvable: true, why: 'no home of color ' + c.ci };
    const ps = [];
    const seen = new Set();
    for (const opt of opts) {
      const p = astar(lvl, c, home, opt);
      if (!p) continue;
      const key = p.map(q => Math.round(q.x) + ',' + Math.round(q.y)).join(';');
      if (seen.has(key)) continue;
      seen.add(key); ps.push(p);
      if (ps.length >= 6) break;
    }
    if (!ps.length) return { unsolvable: true, why: 'no wall-legal path char ci=' + c.ci + ' (' + Math.round(c.x) + ',' + Math.round(c.y) + ')' };
    cands.push(ps);
  }
  /* combos: all-shortest, single-char alternates, all-sweep(idx1), bounded pairs */
  const combos = [];
  const idx0 = cands.map(() => 0);
  combos.push(idx0.slice());
  for (let i = 0; i < cands.length; i++) for (let k = 1; k < cands[i].length; k++) {
    const c = idx0.slice(); c[i] = k; combos.push(c);
  }
  if (cands.length > 1) combos.push(cands.map(ps => Math.min(1, ps.length - 1)));
  for (let i = 0; i < cands.length && combos.length < 24; i++) for (let j = i + 1; j < cands.length && combos.length < 24; j++) {
    for (let a = 1; a < Math.min(3, cands[i].length); a++) for (let b = 1; b < Math.min(3, cands[j].length); b++) {
      const c = idx0.slice(); c[i] = a; c[j] = b; combos.push(c);
    }
  }
  let P = 0;
  for (const m of lvlWorld.movers) {
    const v = Math.hypot(m.dx, m.dy);
    if (v > 1e-9) P = Math.max(P, 2 * m.range / v);
  }
  P = Math.min(P, 1400);
  for (const combo of combos) {
    const paths = cands.map((ps, i) => ps[combo[i]]);
    const delays = planSchedule(lvlWorld, lvl, paths, P);
    if (delays) {
      return { paths: paths.map(p => ({ path: p, len: polyLen(p) })), delays, minInk: Math.ceil(Math.max(...paths.map(p => polyLen(p)))) };
    }
  }
  return { unsolvable: true, why: 'no collision-free timed crossing found (' + combos.length + ' path combos, per-char phase scan period ' + Math.round(P) + ')' };
}
function polyLen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return s; }

/* ---- play through the engine's real input path ---- */
function pumpFrames(n) {
  for (let f = 0; f < n; f++) {
    NOW += 16.67;
    const batch = rafQ.splice(0);
    if (!batch.length) return;
    for (const cb of batch) cb(NOW);
  }
}
function drawPath(pts) {
  const ev = p => ({ preventDefault() {}, clientX: p.x, clientY: p.y });
  canvasEl.dispatch('pointerdown', ev(pts[0]));
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(d / 8));
    for (let s = 1; s <= steps; s++) canvasEl.dispatch('pointermove', ev({ x: a.x + (b.x - a.x) * s / steps, y: a.y + (b.y - a.y) * s / steps }));
  }
  canvasEl.dispatch('pointerup', ev(pts[pts.length - 1]));
}

let pass = 0, fail = 0; const fails = [], notes = [], fixlist = [];
const t0 = Date.now();
/* plan every level up front (fix-drawtohome-levels.js reuses this via DTH_PLAN_ONLY=1 so
 * the fixer's ink regeneration and the verifier share ONE planner implementation) */
const plans = LEVELS.map((lvl, n) => ({ n, lvl, plan: planLevel(lvl) }));
if (process.env.DTH_PLAN_ONLY) {
  for (const { n, lvl, plan } of plans) {
    console.log(JSON.stringify({ n: n + 1, solvable: !plan.unsolvable, minInk: plan.minInk || null, why: plan.why || null }));
  }
  process.exit(0);
}
for (let n = 0; n < LEVELS.length; n++) {
  const lvl = LEVELS[n];
  const inkMax = lvl.ink || 100;
  const plan = plans[n].plan;
  if (plan.unsolvable) { fail++; fails.push('L' + (n + 1) + ' UNSOLVABLE: ' + plan.why); fixlist.push('L' + (n + 1) + ':walls'); continue; }
  if (plan.minInk > inkMax - 5) { fail++; fails.push('L' + (n + 1) + ' UNSOLVABLE: shortest legal path ' + plan.minInk + 'px > ink ' + inkMax); fixlist.push('L' + (n + 1) + ':ink>=' + Math.ceil(plan.minInk * 2 / 10) * 10); continue; }
  /* play it */
  try {
    DTH.startLevel(n);
    if (DTH.state.inTutorial) getEl('btnTutorialNext').dispatch('click'); /* 1-step tutorials */
    if (DTH.state.inTutorial) throw new Error('tutorial not dismissed');
    const st = DTH.state;
    for (let ci = 0; ci < plan.paths.length; ci++) {
      if (plan.delays[ci]) pumpFrames(plan.delays[ci]); /* advance movers to the simulated phase */
      const p = plan.paths[ci];
      /* plans are built in level chars order; take the next waiting char (same order) */
      const waiting = st.chars.filter(c => !c.moving && !c.happy && !c.dead && c.path.length === 0);
      if (!waiting.length) throw new Error('no waiting char for plan entry');
      drawPath(p.path);
      /* pump until this char resolves (walking at 2.5px/frame) */
      let guard = 0;
      while (guard++ < 12000) {
        pumpFrames(1);
        const c = waiting[0];
        if (c.happy || c.dead) break;
        if (st.gameOver) break;
      }
      const c = waiting[0];
      if (c.dead) throw new Error('char died at (' + Math.round(c.x) + ',' + Math.round(c.y) + ') ink ' + Math.round(st.ink));
      if (!c.happy) throw new Error('char did not arrive (guard) at (' + Math.round(c.x) + ',' + Math.round(c.y) + ')');
    }
    /* let the engine declare win (settles on next updateGame tick) */
    pumpFrames(3);
    if (!DTH.state.won) throw new Error('engine did not declare win (won=false)');
    if (getEl('winOverlay').classList.contains('hidden')) throw new Error('win overlay not shown');
    if (!/Complete/.test(getEl('winTitle').textContent || '')) throw new Error('lose modal shown instead of win');
    const sv = JSON.parse(ctx.localStorage.getItem('drawToHome_v2') || '{}');
    const rec = (sv.levels || {})[n];
    if (!rec || !(rec.stars >= 1) || !rec.unlocked) throw new Error('win not persisted');
    pass++;
    if (n === 0 || n === LEVELS.length - 1 || n % 10 === 9) notes.push('L' + (n + 1) + ': paths[' + plan.paths.map(p => Math.round(p.len)).join(',') + '] ink ' + plan.minInk + '/' + inkMax + ', stars ' + rec.stars + ', save ok');
  } catch (e) {
    fail++; fails.push('L' + (n + 1) + ' EX: ' + String(e.message).slice(0, 120));
  }
}
const dur = ((Date.now() - t0) / 1000).toFixed(1);
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails.slice(0, 55);
console.log(SLUG + ': ' + pass + '/' + (pass + fail) + ' levels planned (A* around walls + per-char timed mover crossings validated by an exact offline replay of updateMovers/updateChars) and played through pointer drawing; engine declared win + persisted save');
notes.forEach(x => console.log('  ' + x));
(fails || []).slice(0, 20).forEach(f => console.log('  FAIL ' + f));
if (fixlist.length) console.log('NEEDFIX ' + fixlist.join(' '));
if (ctx.__timerErrs.length) console.log('timer errors: ' + JSON.stringify(ctx.__timerErrs.slice(0, 5)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
