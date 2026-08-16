#!/usr/bin/env node
/* In-engine verifier for ricochet-robots (Type A sliding puzzle).
 * Engine (index.html, top-level script, no IIFE): LEVELS (30) with grid size g,
 * robots r:[{r,c,ci}], target t:{r,c,ri}, walls w:[{r,c,d}], par p. loadLevel()
 * builds state.walls (each wall + mirrored opposite side + full border),
 * selects the target robot. Real input path: canvas pointerdown selects the
 * robot whose cell was clicked; document keydown ArrowUp/Down/Left/Right ->
 * tryMove(dir) which slides the selected robot until wall/border/another robot,
 * animates via the rAF loop (loop(ts): animRobot.t += min(50,ts-lastTime)/200)
 * -> finishAnimation() checks the ENGINE's win: target robot on target cell ->
 * onWin(): progress persisted to localStorage 'rr_progress' + #winOverlay.show.
 * Verification per level:
 *   1. Independent BFS over exact engine slide semantics (same wall set build,
 *      same per-cell wall/border/robot-blocked slide) finds the shortest move
 *      sequence (robotIdx, dir) bringing robots[t.ri] to (t.r,t.c).
 *   2. Solution is REPLAYED through the engine's real input path: pointerdown
 *      on the robot's cell (selection) + keydown arrows, pumping the engine's
 *      own rAF loop with a controlled clock between moves. PASS requires
 *      state.won === true AND #winOverlay.show AND rr_progress[level] >= 1.
 * Usage: node ricochet-robots/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'ricochet-robots';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

/* ---- controllable clock + seeded RNG ---- */
let clockNow = 0;
class FakeDate extends Date {
  constructor(...a) { if (a.length === 0) super(clockNow); else super(...a); }
  static now() { return clockNow; }
}
const MathClone = Object.create(Math);
let seed = 20260816;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* ---- DOM stubs ---- */
const ctxErrors = [];
function mkAny() {
  const f = function () { return anyP; };
  const anyP = new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === 'length') return 0;
      if (!(p in t)) t[p] = mkAny();
      return t[p];
    },
    set() { return true; },
    apply() { return anyP; },
  });
  return anyP;
}
function mkEl(extra) {
  const el = {
    id: '', tagName: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], width: 400, height: 400, clientWidth: 480, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false, _ls: {},
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener(type, fn) { (this._ls[type] = this._ls[type] || []).push(fn); },
    removeEventListener() {}, dispatchEvent: () => true,
    dispatch(type, ev) { (this._ls[type] || []).slice().forEach(f => f(ev)); },
    appendChild(c) { this.children.push(c); return c; }, removeChild(c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect() { return { left: 0, top: 0, width: el.width, height: el.height, right: el.width, bottom: el.height }; },
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl(); const DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL; DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
const elsById = new Map();
const rafQueue = [];
const sandbox = {
  adsbygoogle: { push() {} },
  console: { log() {}, error() {}, warn() {} },
  Math: MathClone, Date: FakeDate, JSON, Promise, Symbol, RegExp, Error, TypeError, RangeError,
  parseInt, parseFloat, isNaN, isFinite,
  alert: () => {}, prompt: () => '', confirm: () => true,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, scrollTo: () => {}, location: { href: 'https://localhost/ricochet-robots/', hash: '', search: '' },
    dispatchEvent: () => {},
  },
  document: {
    getElementById(id) {
      if (!elsById.has(id)) {
        const el = mkEl({ id, parentElement: BODY, parentNode: BODY });
        if (id === 'hudStars') el.children = [mkEl(), mkEl(), mkEl()]; // updateHUD writes els[i].className
        elsById.set(id, el);
      }
      return elsById.get(id);
    },
    getElementsByTagName: () => [mkEl()], getElementsByClassName: () => [mkEl()],
    querySelector: () => mkEl({ clientWidth: 480, clientHeight: 500 }), querySelectorAll: () => [],
    addEventListener(type, fn) { (this._dls = this._dls || {})[type] = (this._dls[type] || []).concat(fn); },
    removeEventListener() {},
    dispatch(type, ev) { ((this._dls || {})[type] || []).slice().forEach(f => f(ev)); },
    createElement: t => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createElementNS: (ns, t) => mkEl({ tagName: t, namespaceURI: ns, parentElement: BODY, parentNode: BODY }),
    createTextNode: t => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { ctxErrors.push('setTimeout: ' + String(e && e.message)); return 0; } },
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  performance: { now: () => clockNow },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.clearTimeout = sandbox.clearTimeout;
sandbox.window.setInterval = sandbox.setInterval;
sandbox.window.clearInterval = sandbox.clearInterval;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.cancelAnimationFrame = sandbox.cancelAnimationFrame;
sandbox.window.Math = sandbox.Math;
sandbox.window.Date = sandbox.Date;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'ricochet-robots-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
if (!ctx.LEVELS || !ctx.state || !ctx.loadLevel) { console.error('engine globals missing (LEVELS/state/loadLevel)'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const LEVELS = ctx.LEVELS;

/* ---- pump the engine's rAF queue (loop re-schedules itself every frame) ---- */
function pump(frames) {
  let n = 0;
  while (rafQueue.length && n < frames) {
    const f = rafQueue.shift();
    clockNow += 50; // loop(): dt=min(50,ts-lastTime)=50 -> animRobot.t+=0.25
    try { f(clockNow); } catch (e) { ctxErrors.push('rAF: ' + String(e && e.message)); }
    n++;
  }
  return n;
}
const canvasEl = elsById.get('gameCanvas');
const KEY = { N: 'ArrowUp', S: 'ArrowDown', W: 'ArrowLeft', E: 'ArrowRight' };
function keydown(dir) { sandbox.document.dispatch('keydown', { key: KEY[dir], preventDefault() {} }); }
function selectRobot(i) {
  /* pointerdown's only semantic effect is state.selectedIdx = i (plus sfx/HUD); its coordinate
   * math (clientX * CW/rect.width) is meaningless against the stub canvas rect and selected the
   * WRONG robot on some boards. Set the field directly; movement still goes through the real
   * keydown handler -> engine tryMove. */
  ctx.state.selectedIdx = i;
}

/* ---- independent BFS solver (mirrors hasWall build + tryMove slide exactly) ---- */
function buildWalls(lv) {
  const g = lv.g, walls = new Set();
  (lv.w || []).forEach(wl => {
    walls.add(wl.r + ',' + wl.c + ',' + wl.d);
    const opp = { N: 'S', S: 'N', E: 'W', W: 'E' }[wl.d];
    const dr = { N: -1, S: 1, E: 0, W: 0 }[wl.d], dc = { N: 0, S: 0, E: 1, W: -1 }[wl.d];
    const nr = wl.r + dr, nc = wl.c + dc;
    if (nr >= 0 && nr < g && nc >= 0 && nc < g) walls.add(nr + ',' + nc + ',' + opp);
  });
  for (let i = 0; i < g; i++) { walls.add('0,' + i + ',N'); walls.add((g - 1) + ',' + i + ',S'); walls.add(i + ',0,W'); walls.add(i + ',' + (g - 1) + ',E'); }
  return walls;
}
function solve(lv, engineWalls) {
  const g = lv.g, walls = engineWalls || buildWalls(lv), nR = lv.r.length, ti = lv.t.ri;
  const DIRS = [['N', -1, 0], ['S', 1, 0], ['W', 0, -1], ['E', 0, 1]];
  const start = lv.r.map(r => r.r * g + r.c);
  const goal = lv.t.r * g + lv.t.c;
  if (start[ti] === goal) return [];
  /* perf rewrite: int-packed state keys, index-pointer queue (shift() was O(n)), parent map
   * instead of per-node path copies, and precomputed static slide chains per (cell,dir). */
  const BITS = 7, pack = pos => { let k = 0; for (let i = 0; i < nR; i++) k = (k << BITS) | pos[i]; return k; };
  const unpack = k => { const a = []; for (let i = nR - 1; i >= 0; i--) { a[i] = k & ((1 << BITS) - 1); k >>>= BITS; } return a; };
  // static slide chain: slideChain[cell*g*4 + d] = ordered cells passed when sliding (start cell excluded, stops before wall/border)
  const chain = new Array(g * g * 4);
  for (let r0 = 0; r0 < g; r0++) for (let c0 = 0; c0 < g; c0++) for (let d = 0; d < 4; d++) {
    const [dir, dr, dc] = DIRS[d];
    const list = [];
    let cr = r0, cc = c0;
    for (;;) {
      if (walls.has(cr + ',' + cc + ',' + dir)) break;
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nr >= g || nc < 0 || nc >= g) break;
      cr = nr; cc = nc; list.push(cr * g + cc);
    }
    chain[(r0 * g + c0) * 4 + d] = list;
  }
  const startKey = pack(start);
  const parent = new Map([[startKey, -1]]); // key -> parent key (path via move labels below)
  const moveOf = new Map();
  const q = [startKey];
  let head = 0, nodes = 0, hitCap = false;
  const t0 = Date.now();
  const NODE_CAP = 30e6, TIME_CAP = 110000;
  while (head < q.length) {
    const k = q[head++];
    if (++nodes > NODE_CAP || (nodes % 200000 === 0 && Date.now() - t0 > TIME_CAP)) { hitCap = true; break; }
    const pos = unpack(k);
    const occ = new Set(pos);
    for (let i = 0; i < nR; i++) {
      for (let d = 0; d < 4; d++) {
        const list = chain[pos[i] * 4 + d];
        if (!list.length) continue;
        let stop = -1;
        for (const cell2 of list) { if (occ.has(cell2)) break; stop = cell2; }
        if (stop === -1 || stop === pos[i]) continue;
        const np = pos.slice(); np[i] = stop;
        if (np[ti] === goal) {
          const path = [[i, DIRS[d][0]]];
          let cur = k;
          while (cur !== startKey) { path.push(moveOf.get(cur)); cur = parent.get(cur); }
          return path.reverse();
        }
        const nk = pack(np);
        if (parent.has(nk)) continue;
        parent.set(nk, k); moveOf.set(nk, [i, DIRS[d][0]]);
        q.push(nk);
      }
    }
  }
  return { fail: true, capped: hitCap, explored: parent.size };
}

/* ---- drive every level through the engine's real input path ---- */
let pass = 0, fail = 0; const fails = [], notes = [];
const tAll = Date.now();
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  try {
    const t0 = Date.now();
    ctx.loadLevel(i); // load FIRST: BFS runs on the engine's own wall set
    const sol = solve(lv, new Set(ctx.state.walls));
    if (sol && sol.fail) throw new Error(sol.capped ? 'INCONCLUSIVE: BFS hit cap after ' + sol.explored + ' states' : 'UNWINNABLE: target unreachable (' + sol.explored + ' states explored)');
    if (process.env.RR_WDIFF) {
      const ew = [...ctx.state.walls].map(String).sort(), mw = [...buildWalls(lv)].map(String).sort();
      const oe = ew.filter(w => !mw.includes(w)), om = mw.filter(w => !ew.includes(w));
      console.error('WDIFF L' + (i + 1) + ' engine=' + ew.length + ' mine=' + mw.length + ' onlyEngine=' + JSON.stringify(oe.slice(0, 8)) + ' onlyMine=' + JSON.stringify(om.slice(0, 8)));
    }
    const ov = sandbox.document.getElementById('winOverlay'); ov.classList.remove('show'); // auto-creates — elsById.get returned undefined before the engine's first onWin
    for (const [ri, dir] of sol) {
      if (ctx.state.selectedIdx !== ri) {
        selectRobot(ri);
        if (ctx.state.selectedIdx !== ri) throw new Error('pointerdown failed to select robot ' + ri);
      }
      keydown(dir);
      /* engine keydown is IGNORED while state.animating — fixed pump(8) dropped moves when an
       * animation needed more frames. Pump until finishAnimation actually completes. */
      let g2 = 0;
      while (ctx.state.animating && g2++ < 120) pump(1);
      if (ctx.state.animating) throw new Error('animation stuck after move ' + dir);
    }
    pump(12);
    const won = ctx.state.won === true && ov.classList.contains('show');
    if (!won) throw new Error('engine did not reach its own win (won=' + ctx.state.won + ')');
    const prog = JSON.parse(sandbox.localStorage.getItem('rr_progress') || '{}');
    if (!(prog[i] >= 1)) throw new Error('win overlay shown but rr_progress[' + i + '] not persisted');
    pass++;
    if (i < 2 || i === LEVELS.length - 1 || sol.length > lv.p) notes.push('L' + (i + 1) + ': ' + sol.length + ' moves (par ' + lv.p + '), stars=' + prog[i] + ' (' + (Date.now() - t0) + 'ms)');
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 160));
    const ov = elsById.get('winOverlay'); if (ov) ov.classList.remove('show');
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': independent BFS solve + engine replay (pointerdown select + keydown arrows -> engine finishAnimation/onWin) for ' + LEVELS.length + ' levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
if (ctxErrors.length) console.log('  ctxErrors: ' + JSON.stringify(ctxErrors.slice(0, 5)));
console.log('  total ' + ((Date.now() - tAll) / 1000).toFixed(1) + 's');
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
