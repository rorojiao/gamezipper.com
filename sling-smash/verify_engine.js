#!/usr/bin/env node
/* sling-smash (Slingshot Smash) in-engine verifier — spec v3, type B-with-levels.
 * Loads index.html inline script into a vm sandbox (top-level var/function globals,
 * no source surgery). For each of the 30 levels: an offline mirror of the engine's
 * own ball integrator (update(), same formulas/dt) sweeps launch angles to find a
 * drag that makes the FIRST block hit be each standing target; the shot is then
 * played through the engine's REAL input path (canvas pointerdown->pointermove->
 * pointerup -> onPointerUp launch) and the physics loop is pumped frame-by-frame
 * (requestAnimationFrame queue + virtual clock). Blockers in the way are cleared
 * with real shots first (glass shatters, wood/stone topple and stop colliding).
 * Win must be reached via the engine's own checkWin -> GS='win' + level-complete
 * overlay + stars persisted to localStorage slingshot_smash.
 * Engine bug found & fixed (index.html checkWin): knocked-down targets rest on the
 * ground forever (ground bounce damps vx by 0.7/frame), so targetsLeft never hit 0
 * and no level could ever be won; win now = no target still STANDING (falling or
 * destroyed both count as knocked down). FAIL detail explains if that regresses.
 * Also drives a negative path: waste all balls on L1 -> engine's own lose overlay.
 * Usage: node sling-smash/verify_engine.js  (cwd anywhere; reads its own index.html)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'sling-smash';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

/* ---- canvas 2d context stub (spec template) ---- */
const CTX2D = new Proxy({ fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', globalAlpha: 1, textAlign: '', textBaseline: '', lineCap: '', lineJoin: '' }, {
  get: (t, p) => {
    if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    if (typeof p === 'string' && !(p in t)) return () => 1;
    return t[p];
  },
  set: () => true,
});

/* ---- DOM element stub with real listener capture ---- */
function mkEl(id) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '', src: '', href: '',
    style: { setProperty() {} }, dataset: {},
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {},
    dispatch(t, ev) { (listeners[t] || []).slice().forEach(f => f(ev)); },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 800, right: 480, bottom: 800 }),
    setAttribute() {}, getAttribute: () => null, focus() {}, blur() {}, click() {},
    getContext: () => CTX2D,
    offsetHeight: 0, offsetWidth: 0, width: 480, height: 800, disabled: false,
  };
  el._listeners = listeners;
  return el;
}

const elsById = new Map();
const getEl = (id) => { if (!elsById.has(id)) elsById.set(id, mkEl(id)); return elsById.get(id); };

/* ---- virtual clock + rAF queue (deterministic, faithful ordering) ---- */
let VT = 0;
const rafQ = [];
let timerId = 1;
const timers = [];
function fireTimers() {
  const due = timers.filter(t => t.at <= VT);
  for (const t of due) { timers.splice(timers.indexOf(t), 1); try { t.fn(); } catch (e) { harnessErrors.push('timer: ' + e.message); } }
}
function frame(ms) { VT += (ms === undefined ? 1000 / 60 : ms); const cbs = rafQ.splice(0); cbs.forEach(f => { try { f(VT); } catch (e) { harnessErrors.push('raf: ' + e.message); } }); fireTimers(); }
function pumpFrames(n) { for (let i = 0; i < n; i++) frame(); }

let harnessErrors = [];

/* seeded Math for determinism (spec: seed random before Context-izing) */
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 12345;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const docListeners = {};
const winListeners = {};
const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean, Symbol, RegExp, Promise,
  Uint8Array, Uint32Array, Int32Array, Float32Array, Uint8ClampedArray, Error, TypeError, RangeError,
  parseInt, parseFloat, isNaN, isFinite,
  alert() {}, prompt: () => '', confirm: () => true,
  setTimeout: (fn, ms) => { timers.push({ id: timerId, at: VT + (ms || 0), fn }); return timerId++; },
  clearTimeout: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
  setInterval: (fn, ms) => { const id = timerId++; const rec = { id }; rec.fn = () => { fn(); }; /* advanced only by pump; games here don't rely on it */ timers.push({ id, at: VT + (ms || 1), fn: rec.fn, interval: ms || 1 }); return id; },
  clearInterval: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
  requestAnimationFrame: (fn) => { rafQ.push(fn); return rafQ.length; },
  cancelAnimationFrame() {},
  performance: { now: () => VT },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear() { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '' },
  document: {
    getElementById: getEl,
    querySelector: () => mkEl(), querySelectorAll: () => [],
    createElement: t => mkEl(t), createElementNS: (ns, t) => mkEl(t), createTextNode: t => ({ textContent: t }),
    addEventListener(t, f) { (docListeners[t] = docListeners[t] || []).push(f); },
    removeEventListener() {},
    body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'),
    hidden: false, visibilityState: 'visible', cookie: '', readyState: 'complete',
  },
  adsbygoogle: { push() {} },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  Event: function (t) { this.type = t; }, CustomEvent: function (t) { this.type = t; },
};
sandbox.window = {
  addEventListener(t, f) { (winListeners[t] = winListeners[t] || []).push(f); },
  removeEventListener() {}, dispatchEvent() {},
  innerWidth: 480, innerHeight: 800, devicePixelRatio: 1, scrollX: 0, scrollY: 0, scrollTo() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  location: sandbox.location, localStorage: sandbox.localStorage, performance: sandbox.performance,
  setTimeout: sandbox.setTimeout, clearTimeout: sandbox.clearTimeout, setInterval: sandbox.setInterval, clearInterval: sandbox.clearInterval,
  requestAnimationFrame: sandbox.requestAnimationFrame, cancelAnimationFrame: sandbox.cancelAnimationFrame,
  navigator: sandbox.navigator, document: sandbox.document, adsbygoogle: sandbox.adsbygoogle,
  AudioContext: undefined, webkitAudioContext: undefined,
};
sandbox.window.window = sandbox.window;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(scripts, ctx, { filename: SLUG + '-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', extra: { error: String(loadErr.message).slice(0, 120) } })); process.exit(1); }

/* fire DOMContentLoaded -> engine init() */
(docListeners.DOMContentLoaded || []).forEach(f => { try { f({}); } catch (e) { harnessErrors.push('DOMContentLoaded: ' + e.message); } });

/* ---- engine internals are vm context globals (top-level var/function) ---- */
const E = ctx; // GS, LV, blocks, ballsLeft, startLevel, onPointerDown/Move/Up, update, endShot, checkWin ...
const DT = 1000 / 60;
const C = {
  VW: 480, GRAVITY: 620, AIR: 0.998, GROUND: 760, SLX: 85, SLY: 640, MAXDRAG: 110, POWER: 7.2, R: 13, REST: 0.35, FRIC: 0.88,
};
function circleRect(cx, cy, cr, rx, ry, rw, rh) {
  const px = Math.max(rx, Math.min(cx, rx + rw)), py = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - px, dy = cy - py;
  return dx * dx + dy * dy < cr * cr;
}
/* offline mirror of engine update() ball integration until first block hit / rest */
function simShot(vx0, vy0, blocksLive, maxFrames) {
  let x = C.SLX, y = C.SLY, vx = vx0, vy = vy0, bounces = 0;
  const bl = blocksLive.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
  for (let f = 0; f < (maxFrames || 900); f++) {
    vy += C.GRAVITY * (DT / 1000);
    const ar = Math.pow(C.AIR, (DT / 1000) * 60);
    vx *= ar; vy *= ar;
    x += vx * (DT / 1000); y += vy * (DT / 1000);
    if (x - C.R < 0) { x = C.R; vx = -vx * C.REST; }
    if (x + C.R > C.VW) { x = C.VW - C.R; vx = -vx * C.REST; }
    if (y - C.R < 0) { y = C.R; vy = -vy * C.REST; }
    if (y + C.R > C.GROUND) { y = C.GROUND - C.R; vy = -vy * C.REST; vx *= C.FRIC; bounces++; }
    for (let i = 0; i < blocksLive.length; i++) {
      const b = blocksLive[i];
      if (b.destroyed || b.falling) continue;
      if (circleRect(x, y, C.R, b.x, b.y, b.w, b.h)) return { hit: i, x, y, frames: f };
    }
    const speed = Math.sqrt(vx * vx + vy * vy);
    if ((speed < 30 && Math.abs(y - (C.GROUND - C.R)) < 3) || bounces > 8) return { hit: -1, rest: true, x, y, frames: f };
  }
  return { hit: -1, timeout: true };
}
function liveBlocks() { return ctx.blocks.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, type: b.type, falling: b.falling, destroyed: b.destroyed })); }
function standingTargets() { return ctx.blocks.map((b, i) => ({ b, i })).filter(o => o.b.type === 'T' && !o.b.destroyed && !o.b.falling).map(o => o.i); }

/* find a (power, angle) whose first hit is `targetIdx`, else best blocker to clear */
function planShot(targetIdx) {
  const bl = liveBlocks();
  const hitAt = (dist, a) => {
    const sp = dist * C.POWER;
    return simShot(Math.cos(a) * sp, -Math.sin(a) * sp, bl);
  };
  /* phase 1: full power, coarse */
  for (let a = -0.40; a <= 1.50; a += 0.01) if (hitAt(C.MAXDRAG, a).hit === targetIdx) return { angle: a, dist: C.MAXDRAG, blocker: false };
  /* phase 2: power sweep (lobs / apex control for gap entries), fine power steps */
  for (let dist = 24; dist <= 108; dist += 3) {
    for (let a = -0.40; a <= 1.50; a += 0.008) if (hitAt(dist, a).hit === targetIdx) return { angle: a, dist, blocker: false };
  }
  /* blocker: pick the block whose REMOVAL opens the most direct trajectories (coarse eval) */
  const cands = new Map(); // blockIdx -> angle
  for (let a = -0.40; a <= 1.50; a += 0.01) {
    const r = hitAt(C.MAXDRAG, a);
    if (r.hit >= 0 && r.hit !== targetIdx && !cands.has(r.hit)) cands.set(r.hit, a);
  }
  let best = null, bestScore = -1;
  for (const [bi, a] of cands) {
    const bl2 = bl.map((b, i) => (i === bi ? { ...b, falling: true } : b)); // knocked => stops colliding
    let score = 0;
    for (let a2 = -0.40; a2 <= 1.50; a2 += 0.02) {
      const sp = C.MAXDRAG * C.POWER;
      if (simShot(Math.cos(a2) * sp, -Math.sin(a2) * sp, bl2).hit === targetIdx) score++;
    }
    if (score > bestScore || (score === bestScore && best && bl[bi].x < bl[best.hit].x)) { best = { a, hit: bi }; bestScore = score; }
  }
  if (!best) return null;
  return { angle: best.a, dist: C.MAXDRAG, blocker: true, blockerIdx: best.hit, opens: bestScore };
}
/* play one shot through the engine's real pointer handlers */
function shoot(angle, dist) {
  const D = dist || C.MAXDRAG;
  const aimEnd = { x: C.SLX - D * Math.cos(angle), y: C.SLY + D * Math.sin(angle) };
  const canvas = getEl('game');
  canvas.dispatch('pointerdown', { clientX: C.SLX, clientY: C.SLY, pointerId: 1 });
  canvas.dispatch('pointermove', { clientX: aimEnd.x, clientY: aimEnd.y, pointerId: 1 });
  canvas.dispatch('pointerup', { clientX: aimEnd.x, clientY: aimEnd.y, pointerId: 1 });
}

const results = { pass: 0, fail: 0, failIdx: [], fails: [], notes: [] };
const T0 = Date.now();
const ONLY = process.env.VERIFY_ONLY ? JSON.parse(process.env.VERIFY_ONLY) : null;
const DEBUG = !!process.env.VERIFY_DEBUG;
const LEVELS = ctx.LV.length;
for (let lvl = 0; lvl < LEVELS; lvl++) {
  if (ONLY && !ONLY.includes(lvl + 1)) continue;
  try {
    if (Date.now() - T0 > 100000) throw new Error('global time cap');
    ctx.startLevel(lvl);
    const ballsTotal = ctx.LV[lvl].b;
    let shots = 0, guard = 0;
    while (ctx.GS !== 'win' && ctx.GS !== 'lose') {
      if (++guard > 40) throw new Error('planner loop guard');
      const standing = standingTargets();
      if (!standing.length) break;
      const tgtIdx = standing.reduce((a, b) => (liveBlocks()[a].x <= liveBlocks()[b].x ? a : b), standing[0]);
      const plan = planShot(tgtIdx);
      if (!plan) throw new Error('no angle reaches any block (target unreachable)');
      if (ctx.ballsLeft <= 0) throw new Error('out of balls with targets standing');
      shoot(plan.angle, plan.dist); shots++;
      /* pump physics until shot resolves (ball rest -> endShot timer) + margin */
      let fr = 0;
      while ((ctx.GS === 'flying') && fr < 4000) { frame(); fr++; }
      pumpFrames(80); // settle timers / falling blocks
      if (DEBUG) console.log('L' + (lvl + 1) + ' shot#' + shots + ' a=' + plan.angle.toFixed(2) + (plan.blocker ? ' BLOCKER(' + plan.blockerIdx + ')' : ' TARGET') + ' -> standing=' + standingTargets().length + ' balls=' + ctx.ballsLeft + ' GS=' + ctx.GS + ' destroyed=' + ctx.blocks.filter(b => b.destroyed).length + ' falling=' + ctx.blocks.filter(b => b.falling && !b.destroyed).length);
    }
    if (ctx.GS !== 'win') {
      const rest = liveBlocks().filter(b => b.type === 'T' && !b.destroyed);
      throw new Error('not won; GS=' + ctx.GS + ', targets not destroyed=' + rest.length + ' (resting-on-ground blocks are never destroyed by engine physics)');
    }
    /* let win overlay timer fire + persistence check */
    pumpFrames(60);
    const p = JSON.parse(sandbox.localStorage.getItem('slingshot_smash') || '{}');
    const stars = (p.stars || {})[lvl] || 0;
    if (!stars) throw new Error('win but stars not persisted');
    if (shots > ballsTotal) results.notes.push('L' + (lvl + 1) + ': used ' + shots + ' shots > budget ' + ballsTotal + ' (restart path)');
    results.pass++;
    if (lvl === 0 || lvl === 29) results.notes.push('L' + (lvl + 1) + ': won in ' + shots + '/' + ballsTotal + ' balls, stars=' + stars + ', overlay=' + getEl('level-complete').style.display);
  } catch (e) {
    results.fail++; results.failIdx.push(lvl + 1); results.fails.push('L' + (lvl + 1) + ': ' + String(e.message).slice(0, 140));
  }
}
/* negative path on L1: waste all balls (steep upward shots landing near sling) -> engine lose */
let negOk = false, negNote = '';
try {
  ctx.startLevel(0);
  if (DEBUG) console.log('NEG start: GS=' + ctx.GS + ' blocks=' + ctx.blocks.map(b => b.type + '@' + b.x + ',' + b.y).join(' '));
  while (ctx.ballsLeft > 0 && ctx.GS !== 'lose' && ctx.GS !== 'win') {
    shoot(1.30, 18);
    let fr = 0; while ((ctx.GS === 'flying') && fr < 3000) { frame(); fr++; }
    pumpFrames(80);
    if (DEBUG) console.log('NEG shot: balls=' + ctx.ballsLeft + ' GS=' + ctx.GS + ' activeBall=' + !!ctx.activeBall + ' standing=' + standingTargets().length + ' falling=' + ctx.blocks.filter(b => b.falling).length);
  }
  negOk = ctx.GS === 'lose' && getEl('level-fail').style.display === 'flex';
  negNote = 'lose overlay shown=' + (getEl('level-fail').style.display === 'flex') + ', GS=' + ctx.GS;
} catch (e) { negNote = 'neg crash: ' + e.message; }
if (negOk) results.pass++; else { results.fail++; results.failIdx.push('NEG'); results.fails.push('negative lose path: ' + negNote); }

const out = { pass: results.pass, fail: results.fail, total: results.pass + results.fail, failIdx: results.failIdx, verdict: results.fail === 0 ? 'PASS' : 'FAIL' };
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (30 levels played via real pointer aim/launch through engine physics to engine checkWin win + stars persisted; negative lose path), verdict=' + out.verdict);
results.notes.forEach(n => console.log('  ' + n));
results.fails.slice(0, 12).forEach(f => console.log('  FAIL ' + f));
if (harnessErrors.length) console.log('harness errors: ' + JSON.stringify(harnessErrors.slice(0, 5)));
out.extra = { harnessErrors: harnessErrors.slice(0, 5), notes: results.notes.slice(0, 6), fails: results.fails.slice(0, 12) };
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
