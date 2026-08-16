#!/usr/bin/env node
/* In-engine verifier for poly-art-3d (Type A puzzle).
 * Engine (index.html, IIFE): 30 artworks (ARTWORKS) of polygon pieces; startLevel(idx)
 * spawns pieces with a RANDOM shade (0..3) in a tray; real input path is the canvas
 * pointerdown handler onDown(e): tap tray piece -> S.sel; right-click (e.button===2)
 * -> rotatePiece (shade=(shade+1)%4); tap grid cell -> placePiece(idx,row,col) which
 * calls checkWin. checkWin requires EVERY piece placed AND shade===origShade AND
 * gridCol===id%cols && gridRow===floor(id/cols) -> completeLevel(): stars/progress
 * persisted to localStorage "polyart3d_save" (D.done gets artIdx, D.best[artIdx]) and
 * #compOv overlay unhidden.
 * Verification per artwork: play the level through the engine's REAL pointer events
 * (dispatched on the recorded canvas pointerdown listener): select piece from tray at
 * its rendered position, right-click-rotate until shade matches the target artwork's
 * shade (player-visible via the ghost preview + piece color), tap the piece's target
 * grid cell. PASS requires the engine's own completeLevel to fire: #compOv not hidden
 * AND progress persisted for that artwork index.
 * The rAF queue is pumped a few frames per level to exercise the engine's render loop.
 * Usage: node poly-art-3d/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'poly-art-3d';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* surgery: inject accessor exports inside the IIFE (index.html itself is never edited) */
const ANCHOR = 'window.togSfx=togSfx;window.togMus=togMus;window.dismissTutorial=dismissTutorial;';
if (!code.includes(ANCHOR)) { console.error('surgery anchor missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + `
window.__PA={
 start:function(i){return startLevel(i)},
 down:function(e){return onDown(e)},
 state:function(){return S},
 arts:function(){return ARTWORKS},
 geom:function(){var w=cv.width/devicePixelRatio,h=cv.height/devicePixelRatio,gw=w*.8,gh=h*.48;
  return {w:w,h:h,gx:(w-gw)/2,gy:10,cellW:gw/S.art.cols,cellH:gh/S.art.rows,trayTop:h*.62}},
 prog:function(){return JSON.parse(localStorage.getItem('polyart3d_save')||'{}')}
};`);

/* ── sandbox ── */
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
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false, _ls: {},
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener(type, fn) { (el._ls[type] = el._ls[type] || []).push(fn); },
    removeEventListener() {}, dispatchEvent: () => {},
    setPointerCapture() {}, releasePointerCapture() {},
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width, height: el.height, right: el.width, bottom: el.height }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
function dispatch(el, type, ev) {
  ev = ev || {};
  ev.preventDefault = ev.preventDefault || (() => {});
  (el._ls[type] || []).slice().forEach(fn => fn(ev));
}
const BODY = mkEl(); const DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL; DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
const elsById = new Map();
const rafQueue = [];
let simNow = 1000;
let seed = 12345;
const MathClone = Object.create(Math);
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
  devicePixelRatio: 1,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 800, innerHeight: 800,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, scrollTo: () => {}, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY, parentNode: BODY })); return elsById.get(id); },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })], getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }), querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createElementNS: (ns, t) => mkEl({ tagName: t, namespaceURI: ns, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { return 0; } }, clearTimeout: () => {},
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  performance: { now: () => simNow },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.setInterval = sandbox.setInterval;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.clearTimeout = sandbox.clearTimeout;
sandbox.window.devicePixelRatio = 1;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'poly-art-3d-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const PA = sandbox.window.__PA;
if (!PA) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* ── helpers ── */
const canvas = elsById.get('game');
function tap(x, y, button) { dispatch(canvas, 'pointerdown', { clientX: x, clientY: y, button: button || 0 }); }
function pump(frames) {
  let n = 0;
  while (rafQueue.length && n < frames) {
    const f = rafQueue.shift();
    simNow += 200;
    f(simNow);
    n++;
  }
  return n;
}

const ARTS = PA.arts();
let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < ARTS.length; i++) {
  const t0 = Date.now();
  try {
    PA.start(i);
    pump(3); /* exercise engine render loop */
    const art = ARTS[i];
    let moves = 0, rots = 0;
    for (let pi = 0; pi < art.pieces.length; pi++) {
      const st = PA.state();
      const p = st.pieces[pi];
      if (!p) throw new Error('piece ' + pi + ' missing');
      /* 1. select from tray at its rendered position */
      tap(p.x, p.y, 0);
      if (PA.state().sel !== pi) throw new Error('tray tap did not select piece ' + pi);
      /* 2. right-click rotate until shade matches the target artwork shade */
      let guard = 0;
      while (PA.state().pieces[pi].shade !== p.origShade) {
        tap(p.x, p.y, 2);
        rots++;
        if (++guard > 4) throw new Error('rotate did not converge for piece ' + pi);
      }
      /* 3. place on the piece's target grid cell (id-major order: col=id%cols,row=floor(id/cols)) */
      const g = PA.geom();
      const col = p.id % art.cols, row = Math.floor(p.id / art.cols);
      tap(g.gx + col * g.cellW + g.cellW / 2, g.gy + row * g.cellH + g.cellH / 2, 0);
      moves++;
      const p2 = PA.state().pieces[pi];
      if (!p2.placed || p2.gridCol !== col || p2.gridRow !== row) throw new Error('piece ' + pi + ' not placed at target cell');
    }
    /* engine's own win path must have fired on the final placement */
    const ov = elsById.get('compOv');
    const shown = ov && !ov.classList.contains('hidden');
    if (!shown) throw new Error('all pieces placed correctly but #compOv not shown (checkWin did not fire completeLevel)');
    const prog = PA.prog();
    if (!(prog.done && prog.done.indexOf(i) >= 0)) throw new Error('win overlay shown but progress not persisted for art ' + i);
    if (!prog.best || !prog.best[i]) throw new Error('D.best not persisted for art ' + i);
    pump(3); /* render frames during win overlay */
    pass++;
    if (i < 2 || i === ARTS.length - 1) notes.push('L' + (i + 1) + ' "' + art.name + '": won via ' + moves + ' placements + ' + rots + ' rotations, stars=' + prog.best[i].stars + ' (' + (Date.now() - t0) + 'ms)');
    ov.classList.add('hidden');
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 140));
    const ov = elsById.get('compOv'); if (ov) ov.classList.add('hidden');
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': real pointer-event play (tray tap -> right-click rotate -> grid tap) to engine checkWin/completeLevel for ' + ARTS.length + ' artworks: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
