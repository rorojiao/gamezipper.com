#!/usr/bin/env node
/* In-engine verifier for prism-path (Type A puzzle, embedded solution replay).
 * Engine (index.html, top-level script): 30 LEVELS (expanded from LEVELS_RAW); each
 * tile carries `sol` (solution rotation) and `init` (scramble). Real input path:
 * canvas pointerdown -> handleTap(px,py) -> pixelToHex -> rotateTile(idx,+1) which
 * pushes undo history, increments moves, sets `animating`, and schedules a 200ms
 * setTimeout (sandbox: fires immediately) that runs the engine's own
 * propagate(curTiles) and calls onWin() when every color target is satisfied.
 * onWin() persists stars/unlocked to localStorage "prism_path_save_v1" and unhides
 * #winpopup.
 * Verification per level: loadLevel(n), pump the engine's rAF queue so its own
 * resizeCanvas()/computeLayout() runs, then replay the EMBEDDED solution — tap each
 * pipe tile (sol-rot+6)%6 times at its exact hex-center pixel through the recorded
 * canvas pointerdown listener. PASS requires:
 *   1. the engine's propagate(curTiles).won === true after the taps,
 *   2. #winpopup unhidden,
 *   3. stars persisted for that level in localStorage.
 * (Solution validity itself is cross-checked live by the engine's propagate — the
 *  two pre-existing scripts verify_iife.js / verify_independent.js already proved
 *  the sol data with an independent BFS.)
 * Usage: node prism-path/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'prism-path';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* the engine is a plain top-level script: expose its internals via a second eval in
 * the same context (top-level const/let live in the shared global lexical scope) */
code += `
;globalThis.__PP={
 load:function(n){return loadLevel(n)},
 tap:function(px,py){return handleTap(px,py)},
 tiles:function(){return curTiles},
 won:function(){return won},
 moves:function(){return moves},
 levels:function(){return LEVELS},
 prop:function(){return propagate(curTiles)},
 geom:function(){return {originX:originX,originY:originY,hexSize:hexSize}},
 hex:function(q,r,s){return hexToPixel(q,r,s)}
};`;

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
    children: [], width: 800, height: 900, clientWidth: 800, clientHeight: 900, offsetHeight: 40, offsetWidth: 40,
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
let seed = 424243;
/* prism's first inline script has a top-level "use strict" -> the concatenated bundle
 * is strict, so the AdSense inline block's `(adsbygoogle=...)` needs a resolvable global */
const adsbygoogle = [];
const MathClone = Object.create(Math);
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
  devicePixelRatio: 1, adsbygoogle,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 800, innerHeight: 900,
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
sandbox.window.adsbygoogle = adsbygoogle;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'prism-path-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const PP = sandbox.window.__PP || sandbox.__PP;
if (!PP) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* ── helpers ── */
const canvas = elsById.get('board');
function tapAt(px, py) { dispatch(canvas, 'pointerdown', { clientX: px, clientY: py }); }
function pump(frames) {
  let n = 0;
  while (rafQueue.length && n < frames) {
    const f = rafQueue.shift();
    simNow += 16.7;
    f(simNow);
    n++;
  }
  return n;
}

const LEVELS = PP.levels();
let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < LEVELS.length; i++) {
  const t0 = Date.now();
  try {
    PP.load(i);
    pump(4); /* engine's own resizeCanvas/computeLayout via its rAF callback + main loop frames */
    const g = PP.geom();
    if (!g.hexSize || !isFinite(g.hexSize)) throw new Error('layout not computed (hexSize=' + g.hexSize + ')');
    const tiles = PP.tiles();
    let taps = 0;
    /* The embedded `sol` rotations are a guaranteed winning configuration, but levels
     * can have several: the engine's own propagate() may declare onWin() mid-replay
     * (won=true makes handleTap ignore further input — real game behavior). Tap each
     * pipe toward sol and stop as soon as the engine wins. */
    for (let ti = 0; ti < tiles.length && !PP.won(); ti++) {
      const t = tiles[ti];
      if (t.role !== 'pipe') continue;
      const delta = (((t.sol - t.rot) % 6) + 6) % 6;
      if (delta === 0) continue;
      const [x, y] = PP.hex(t.q, t.r, g.hexSize);
      for (let d = 0; d < delta && !PP.won(); d++) { tapAt(x + g.originX, y + g.originY); taps++; }
    }
    /* engine's own propagation must report won */
    const prop = PP.prop();
    if (!prop.won) throw new Error('engine propagate().won=false after replaying embedded solution (satisfied ' + prop.satisfied.length + ' targets)');
    if (!PP.won()) throw new Error('propagate won but engine onWin() did not fire');
    const ov = elsById.get('winpopup');
    if (!ov || ov.classList.contains('hidden')) throw new Error('#winpopup not shown');
    const saved = JSON.parse(sandbox.localStorage.getItem('prism_path_save_v1') || '{}');
    if (!(saved.stars && saved.stars[String(i)] >= 1)) throw new Error('stars not persisted for level ' + i);
    pump(2);
    pass++;
    if (i < 2 || i === LEVELS.length - 1) notes.push('L' + (i + 1) + ': won via ' + taps + ' taps (starTarget ' + LEVELS[i].starTarget + '), stars=' + saved.stars[String(i)] + ' (' + (Date.now() - t0) + 'ms)');
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 140));
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': embedded-solution replay through real canvas pointerdown taps to engine propagate/onWin for ' + LEVELS.length + ' levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
