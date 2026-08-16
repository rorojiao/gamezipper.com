#!/usr/bin/env node
/* GENERATED in-engine verifier for bus-traffic-fever — pattern follows akari/verify_engine.js.
 * vm sandbox: loads game.js (IIFE engine) with read-only source surgery that only injects a
 * __verify export at the IIFE tail (no engine logic touched), then drives the real player
 * input path handleTap() -> tryMoveBus() + update(dt) ticks to slide buses out through their
 * matching gates. Goal: at least one bus exits (positive milestone), no fatal engine error;
 * stretch: fully clear level 1 and collect coin reward.
 * Usage: node bus-traffic-fever/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
let code = fs.readFileSync(path.join(SLUG_DIR, 'game.js'), 'utf8');
/* read-only source surgery: inject export hook before the IIFE's final `})();` */
if (!/\}\)\(\);\s*$/.test(code)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(/\}\)\(\);\s*$/,
  'window.__verify={' +
  'G:G,LEVELS:LEVELS,tryMoveBus:tryMoveBus,canBusExit:canBusExit,handleTap:handleTap,' +
  'update:update,startLevel:startLevel,loadLevel:loadLevel,getBusCells:getBusCells,' +
  'coins:function(){return save.coins;}};\n})();');
/* index.html inline scripts (analytics/share helpers) are not needed by the engine. */

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
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
        createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
        currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100,
      };
    },
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
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
sandbox.window.setInterval = sandbox.setInterval;
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
  const V = window.__verify, G = V.G;
  const res = { taps:0, ticks:0, exits:0, moves:0, cleared:false, coinsBefore:V.coins(), coinsAfter:0, stuck:false, remaining:-1, err:null };
  try {
    V.startLevel(0);
    let guard = 0;
    while (guard++ < 60) {
      let target = null;
      for (const b of G.buses) { if (b.alive && !b.exiting && V.canBusExit(b)) { target = b; break; } }
      if (!target) { const alive = G.buses.filter(b=>b.alive).length; if (alive>0) res.stuck = true; break; }
      // drive the real input path: tap the bus's first occupied cell
      const cx = G.gridOX + (target.c - 1) * G.cellSize + G.cellSize/2;
      const cy = G.gridOY + (target.r - 1) * G.cellSize + G.cellSize/2;
      V.handleTap(cx, cy);
      res.taps++;
      let t = 0;
      while (G.animating && t++ < 50000) { V.update(1); res.ticks++; }
      for (let k = 0; k < 5; k++) { V.update(1); res.ticks++; }
    }
    res.exits = G.buses.filter(b => !b.alive).length;
    res.moves = G.moves;
    res.remaining = G.buses.filter(b => b.alive).length;
    res.cleared = res.remaining === 0;
    res.coinsAfter = V.coins();
    // wait extra ticks so level-complete timeout side effects settle
    for (let k = 0; k < 30; k++) { V.update(1); res.ticks++; }
    res.coinsAfter = V.coins();
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }

const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err]);
checks.push(['bus-exited-through-gate (score milestone, moves=' + r.moves + ')', r.exits >= 1 && r.moves > 0]);
checks.push(['level-1-fully-cleared', r.cleared]);
checks.push(['coin-reward-awarded (+' + (r.coinsAfter - r.coinsBefore) + ')', r.coinsAfter - r.coinsBefore > 0]);
if (r.err) console.error('driver reported error:', r.err);

let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
const steps = r.taps + r.ticks;
console.log('bus-traffic-fever in-engine verification: exits=' + r.exits + ' moves=' + r.moves + ' cleared=' + r.cleared + ' coins=+' + (r.coinsAfter - r.coinsBefore) + ' taps=' + r.taps + ' ticks=' + r.ticks + (r.stuck ? ' [greedy-stuck]' : ''));
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'score >= one positive milestone (a bus exits through its gate), no fatal error', steps, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
