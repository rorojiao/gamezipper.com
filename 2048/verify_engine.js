#!/usr/bin/env node
/* GENERATED in-engine verifier for 2048 — pattern follows akari/verify_engine.js.
 * vm sandbox: loads game.js (IIFE engine) with read-only source surgery injecting a __verify
 * export at the IIFE tail (no engine logic touched). Drives the engine's own move(dir) with a
 * corner strategy (down > left > up, right only as last resort); setTimeout stub executes the
 * engine's post-move callback (spawnTile + isAnimating reset) synchronously so moves are
 * self-contained. Goal: merge up to a 128 tile within a bounded number of moves.
 * Usage: node 2048/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
let code = fs.readFileSync(path.join(SLUG_DIR, 'game.js'), 'utf8');
if (!/\}\)\(\);\s*$/.test(code)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(/\}\)\(\);\s*$/,
  'window.__verify={move:move,init:init,checkGameOver:checkGameOver,' +
  'snap:function(){return {grid:grid.map(function(r){return r.slice()}),score:score,over:gameOver,anim:isAnimating}}};\n})();');

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
    id: '', className: '', style: {}, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; },
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl(), DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL;
DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
function ImageStub() { const o = { width: 0, height: 0, complete: true, onload: null, onerror: null, addEventListener: () => {} }; let _s = ''; Object.defineProperty(o, 'src', { get: () => _s, set: (v) => { _s = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; }

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
        createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
        currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100,
      };
    },
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => mkEl({ id, parentElement: BODY, parentNode: BODY }),
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  adsbygoogle: { push: () => {} },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn, delay) => { if (typeof fn === 'function' && (delay || 0) <= 500) { try { fn(); } catch (e) {} } return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'game.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack && loadErr.stack.split('\n')[0] || loadErr.message); process.exit(1); }
if (!ctx.window.__verify) { console.error('__verify export missing'); process.exit(1); }

const DRIVER = `(function(){
  const V = window.__verify;
  const res = { moves:0, maxTile:0, score:0, err:null, restarts:0 };
  try {
    V.init();
    const MAX = 30000;
    while (res.moves < MAX) {
      const before = V.snap();
      if (before.over) { V.init(); res.restarts++; continue; }
      let maxT = 0; for (const row of before.grid) for (const v of row) if (v > maxT) maxT = v;
      if (maxT >= 128) break;
      // corner strategy: prefer down, then left, then up; right only if nothing else moves
      const order = ['down','left','up','right'];
      let did = false;
      for (const d of order) {
        V.move(d);
        const after = V.snap();
        let moved = false;
        for (let r = 0; r < 4 && !moved; r++) for (let c = 0; c < 4 && !moved; c++) if (after.grid[r][c] !== before.grid[r][c]) moved = true;
        if (moved) { did = true; break; }
      }
      if (!did) break; // no legal move at all
      res.moves++;
    }
    const s = V.snap();
    res.score = s.score;
    for (const row of s.grid) for (const v of row) if (v > res.maxTile) res.maxTile = v;
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err]);
checks.push(['reached-128-tile (max=' + r.maxTile + ' in ' + r.moves + ' moves)', r.maxTile >= 128]);
checks.push(['score-positive (' + r.score + ')', r.score > 0]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('2048 in-engine verification: maxTile=' + r.maxTile + ' score=' + r.score + ' moves=' + r.moves + ' restarts=' + r.restarts);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'merge up to a 128 tile via engine move()', steps: r.moves, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
