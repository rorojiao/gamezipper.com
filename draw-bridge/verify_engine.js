#!/usr/bin/env node
/* draw-bridge in-engine verifier (wave-A3). Physics drawing puzzle: the player draws
 * bridge strokes (ink-limited) and a car drives over them; win = car inside the goal
 * rect while onGround (engine's own check in _update). Strategy: per level, CONSTRUCT
 * candidate stroke sets from the terrain profile (bridges over gaps, ramps over up-steps,
 * over-pass arcs / jump ramps over on-road rocks, elevated bridge over road-level
 * vanishing platforms), then PLAY them through the engine's real input path — pointer
 * down/move/up on the canvas (the game's own _screenToWorld mapping + ink enforcement) —
 * and pump the engine's rAF loop at 60fps until the engine itself declares complete or
 * gameover. Deterministic (seeded Math.random drives obstacle phases). PASS requires the
 * engine's complete state + modal + stars persisted to localStorage drawbridge_save_v2.
 * Usage: node draw-bridge/verify_engine.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'draw-bridge';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY (index.html untouched): export the lexically-scoped game/LEVELS/CFG */
const ANCHOR = 'game = new Game();';
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__DB={game:game,LEVELS:LEVELS,CFG:CFG};');

/* ---- sandbox ---- */
const rafQ = [];
function mkEl(id, extra) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '', disabled: false, hidden: false, checked: true,
    style: { setProperty() {} }, dataset: {}, className: '',
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, dispatch(t, ev) { (listeners[t] || []).forEach(f => f(ev || { preventDefault() {} })); },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width || 1280, height: el.height || 720, right: el.width || 1280, bottom: el.height || 720 }),
    setAttribute() {}, getAttribute: () => '', focus() {}, blur() {},
    getContext: () => new Proxy({}, { get(t, p) { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }),
    clientWidth: 1280, clientHeight: 720, width: 1280, height: 720, offsetWidth: 10,
  };
  Object.assign(el, extra || {});
  return el;
}
const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
const canvasEl = mkEl('game-canvas', { width: 1280, height: 720 });
els.set('game-canvas', canvasEl);
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 424242; MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ctx = {
  console: { log() {}, error() {}, warn() {} }, Date, JSON, Math: MathClone,
  CanvasRenderingContext2D: { prototype: {} },
  setTimeout: (f) => { if (typeof f === 'function') { try { f(); } catch (e) { ctx.__timerErrs.push(String(e && e.message)); } } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: (f) => { rafQ.push(f); return rafQ.length; }, cancelAnimationFrame() {},
  performance: null, /* set below (virtual clock shared with the pump) */
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '' },
  document: {
    getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, createElement: t => mkEl(t),
    body: mkEl('body'), documentElement: mkEl('html'), hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  AudioContext: undefined, webkitAudioContext: undefined, alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  CustomEvent: function (t) { this.type = t; },
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  __timerErrs: [], adsbygoogle: { push() {} },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
/* virtual monotonic clock so dt is exactly 1/60 per pumped frame */
let NOW = 1000000;
ctx.performance = { now: () => NOW };
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const DB = ctx.window.__DB;
if (!DB || !DB.game) { console.error('no engine export'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const G = DB.game, LEVELS = DB.LEVELS;
if (G.scale !== 1) { console.error('unexpected scale ' + G.scale); process.exit(1); }

/* ---- candidate plan construction from terrain profile ----
 * Physics insight (validated against the engine): a stroke endpoint that sits ABOVE the
 * local road surface acts as a wall — the wheel's closest-point collision pushes the car
 * backward and drains vx until it stalls. Every stroke therefore starts and ends exactly
 * ON the bank surfaces (0 step), so the road remains a continuous surface. */
function polyLen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return s; }
function buildPlan(lvl, P) {
  const OV = P.OV === undefined ? 12 : P.OV;
  const segs = lvl.terrain.slice().sort((a, b) => a.x1 - b.x1);
  const strokes = [];
  for (let i = 0; i < segs.length - 1; i++) {
    const A = segs[i], B = segs[i + 1];
    const gapW = B.x1 - A.x2, dy = B.y1 - A.y2;
    if (gapW > 4) {
      /* road-level static/vanishing platform inside the gap (axis-x mo)? then elevate */
      const mos = (lvl.movingObstacles || []).filter(m => (m.axis === 'x' || !m.range) && m.x + (m.w || 40) > A.x2 && m.x < B.x1);
      const roadY = Math.min(A.y2, B.y1);
      const blocker = mos.find(m => (m.y + (m.h || 40)) >= roadY - 42);
      if (blocker && P.elev) {
        const by = Math.min(blocker.y - 56, roadY - 40);
        const er = Math.min(P.ER || 95, Math.floor(gapW / 2) - 4);
        strokes.push([{ x: A.x2 - OV, y: A.y2 }, { x: A.x2 + er, y: by }, { x: B.x1 - er, y: by }, { x: B.x1 + OV, y: B.y1 }]);
      } else {
        strokes.push([{ x: A.x2 - OV, y: A.y2 }, { x: B.x1 + OV, y: B.y1 }]);
      }
    } else if (dy < -6) { // step up (smaller y = higher)
      strokes.push([{ x: A.x2 - P.R, y: A.y2 }, { x: B.x1 + P.R2, y: B.y1 }]);
    }
  }
  for (const obs of (lvl.obstacles || [])) {
    if (obs.type !== 'rock') continue;
    const surf = segs.find(s => obs.x >= s.x1 - 2 && obs.x <= s.x2 + 2);
    if (!surf) continue;
    const sy = surf.y1;
    const stick = sy - (obs.y - obs.r);
    if (stick <= 2) continue; // buried
    const x0 = Math.max(surf.x1 + 5, obs.x - P.SP), x1 = Math.min(surf.x2 - 5, obs.x + P.SP + P.SP2);
    if (P.jump) {
      strokes.push([{ x: x0, y: sy }, { x: obs.x - obs.r - 6, y: sy - P.JH }]);
    } else {
      const apex = sy - Math.max(6, stick + P.CL);
      strokes.push([{ x: x0, y: sy }, { x: obs.x - obs.r - 6, y: apex }, { x: obs.x + obs.r + 6, y: apex }, { x: x1, y: sy }]);
    }
  }
  return strokes;
}
const PARAM_SETS = [
  { OV: 12, R: 90, R2: 90, CL: 26, SP: 50, SP2: 40 },
  { OV: 0, R: 120, R2: 70, CL: 16, SP: 32, SP2: 55 },
  { OV: 6, R: 60, R2: 60, CL: 34, SP: 70, SP2: 30 },
  { OV: 12, R: 90, R2: 90, jump: true, JH: 46, SP: 55, SP2: 40 },
  { OV: 0, R: 150, R2: 55, CL: 12, SP: 26, SP2: 65 },
  { OV: 12, R: 110, R2: 110, CL: 20, SP: 40, SP2: 50, ER: 95, elev: true },
  { OV: 12, R: 40, R2: 40, CL: 42, SP: 85, SP2: 30 },
];

/* ---- play one attempt through the engine's real input path ---- */
function drawStroke(pts) {
  const cx = G.camera.x;
  const ev = p => ({ preventDefault() {}, clientX: p.x - cx, clientY: p.y });
  canvasEl.dispatch('pointerdown', ev(pts[0]));
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(d / 10));
    for (let s = 1; s <= steps; s++) canvasEl.dispatch('pointermove', ev({ x: a.x + (b.x - a.x) * s / steps, y: a.y + (b.y - a.y) * s / steps }));
  }
  canvasEl.dispatch('pointerup', ev(pts[pts.length - 1]));
}
function pumpFrames(n) {
  for (let f = 0; f < n; f++) {
    NOW += 50 / 3;
    const batch = rafQ.splice(0);
    for (const cb of batch) cb(NOW);
  }
}
function attempt(lvlNum, strokes, staggerFrames) {
  NOW += 100; /* fresh offset so lastTime=performance.now() aligns with the pump clock */
  G._startLevel(lvlNum);
  if (staggerFrames > 0) {
    for (let i = 0; i < strokes.length; i++) {
      drawStroke(strokes[i]);
      if (i < strokes.length - 1) pumpFrames(staggerFrames);
    }
  } else strokes.forEach(drawStroke);
  let frames = 0, lastX = -1, stall = 0;
  while (frames < 9000) {
    NOW += 50 / 3; frames++;
    const batch = rafQ.splice(0);
    if (!batch.length) break;
    for (const cb of batch) cb(NOW);
    if (G.state === 'complete') return { win: true, frames, ink: Math.round(G.totalInk) };
    if (G.car && G.car.dead) return { win: false, why: 'dead', x: Math.round(G.car.x), dmg: Math.round(G.car.damage), frames };
    if (G.car && Math.abs(G.car.x - lastX) < 3) { if (++stall > 450) return { win: false, why: 'stall@' + Math.round(G.car.x) + '/y' + Math.round(G.car.y) + '/vx' + Math.round(G.car.vx), x: Math.round(G.car.x), frames }; } else { stall = 0; lastX = G.car.x; }
  }
  return { win: false, why: G.car ? ('timeout@' + Math.round(G.car.x)) : 'timeout', frames };
}

let pass = 0, fail = 0; const fails = [], notes = [];
const t0 = Date.now();
for (let n = 1; n <= LEVELS.length; n++) {
  const lvl = LEVELS[n - 1];
  let won = null, tried = [];
  const variants = [];
  PARAM_SETS.forEach((P, i) => variants.push({ P, stagger: 0, tag: 'P' + (i + 1) }));
  [8, 16, 24, 32, 40, 48, 56].forEach(sg => variants.push({ P: PARAM_SETS[0], stagger: sg, tag: 'P1+s' + sg }));
  [6, 14, 22, 30, 44, 60, 90].forEach(sg => variants.push({ P: PARAM_SETS[2], stagger: sg, tag: 'P3+s' + sg }));
  for (const v of variants) {
    let strokes = buildPlan(lvl, v.P);
    const ink = strokes.reduce((a, s) => a + polyLen(s), 0);
    if (ink > lvl.inkMax - 2) { tried.push(v.tag + '(ink ' + Math.round(ink) + '>' + lvl.inkMax + ')'); continue; }
    const r = attempt(n, strokes, v.stagger);
    tried.push(v.tag + '=' + (r.win ? 'WIN ink' + r.ink : r.why));
    if (r.win) { won = { r, v, ink }; break; }
  }
  if (won) {
    /* persistence already asserted during the winning attempt (setStars + modal run
     * synchronously in _onLevelComplete); moving-obstacle phases advance between
     * attempts, so no replay — the verifier run itself is deterministic (seeded RNG) */
    const sv = JSON.parse(ctx.localStorage.getItem('drawbridge_save_v2') || '{}');
    const stars = (sv.stars || {})[n] || 0;
    if (!stars) { fail++; fails.push('L' + n + ' win but stars not persisted'); continue; }
    if (getEl('modal-complete').classList.contains('hidden')) { fail++; fails.push('L' + n + ' win but complete modal not shown'); continue; }
    pass++;
    if (n === 1 || n === 30 || n % 6 === 0) notes.push('L' + n + ': ' + won.v.tag + ', ink ' + won.ink + '/' + lvl.inkMax + ' stars ' + stars + ' (' + won.r.frames + ' frames)');
  } else {
    fail++; fails.push('L' + n + ' all candidates failed [' + tried.join(', ') + ']');
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails.slice(0, 31);
console.log(SLUG + ': ' + pass + '/' + (pass + fail) + ' levels: constructed strokes drawn via pointer events, engine physics drove car to goal (engine-declared win)');
notes.forEach(x => console.log('  ' + x));
(fails || []).slice(0, 12).forEach(f => console.log('  FAIL ' + f));
if (ctx.__timerErrs.length) console.log('timer errors: ' + JSON.stringify(ctx.__timerErrs.slice(0, 5)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
