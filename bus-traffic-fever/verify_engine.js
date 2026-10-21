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
  const TOTAL = V.LEVELS.length;
  const res = { levels:[], taps:0, ticks:0, total:TOTAL, coinsBefore:V.coins(), coinsAfter:0, err:null };
  try {
   // R321: drive EVERY level, not just level 1 (P1 test-gate defect).
   for (let li = 0; li < TOTAL; li++) {
    const coinsAtStart = V.coins();
    const L = { i: li, taps:0, ticks:0, exits:0, cleared:false, stuck:false, err:null, coins:0 };
    try {
     V.startLevel(li);
     let guard = 0;
     while (guard++ < 120) {
      let target = null;
      for (const b of G.buses) { if (b.alive && !b.exiting && V.canBusExit(b)) { target = b; break; } }
      if (!target) { if (G.buses.filter(b=>b.alive).length > 0) L.stuck = true; break; }
      const cx = G.gridOX + (target.c - 1) * G.cellSize + G.cellSize/2;
      const cy = G.gridOY + (target.r - 1) * G.cellSize + G.cellSize/2;
      V.handleTap(cx, cy);
      L.taps++; res.taps++;
      let t = 0;
      while (G.animating && t++ < 50000) { V.update(1); L.ticks++; res.ticks++; }
      for (let k = 0; k < 5; k++) { V.update(1); L.ticks++; res.ticks++; }
     }
     L.exits = G.buses.filter(b => !b.alive).length;
     L.cleared = G.buses.filter(b => b.alive).length === 0;
     for (let k = 0; k < 30; k++) { V.update(1); L.ticks++; res.ticks++; }
     L.coins = V.coins() - coinsAtStart;
     if (L.coins < 0) L.coins = 0;
    } catch (e) { L.err = String(e && e.stack || e).slice(0, 200); }
    res.levels.push(L);
   }
   res.coinsAfter = V.coins();
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }

// R321: per-level report + catalog coverage assertion. A verifier that drives
// only level 1 is a test-gate defect, so we assert levelsRun === LEVELS.length.
console.log('bus-traffic-fever in-engine verification: ' + r.total + ' levels, taps=' + r.taps + ' ticks=' + r.ticks);
let pass = 0; const fails = [];
let cleared = 0, withExits = 0, stuck = 0;
for (const L of r.levels) {
  const problems = [];
  if (L.err) problems.push('engine-error');
  if (!L.cleared) problems.push('not-cleared');
  if (L.exits < 1) problems.push('no-bus-exited');
  if (L.stuck) problems.push('greedy-stuck');
  if (L.cleared) cleared++;
  if (L.exits >= 1) withExits++;
  if (L.stuck) stuck++;
  const ok = problems.length === 0;
  if (ok) pass++; else fails.push('L' + (L.i + 1) + ': ' + problems.join(','));
  console.log('  L' + String(L.i + 1).padStart(2) + ' ' + (ok ? 'PASS' : 'FAIL') +
    '  buses=' + (L.exits) + ' taps=' + L.taps + ' coins=+' + L.coins +
    (L.err ? '  err=' + L.err.slice(0, 80) : '') + (problems.length && !L.err ? '  [' + problems.join(',') + ']' : ''));
}
const fail = fails.length;
if (r.err) fails.push('driver: ' + r.err.slice(0, 120));
// coverage guard — refuse to report PASS without covering the whole catalog
const covered = r.levels.length;
console.log('coverage: ' + covered + '/' + r.total + ' levels driven');
const coverageOk = covered === r.total && r.total > 0;
if (!coverageOk) fails.push('coverage ' + covered + '/' + r.total);
console.log(JSON.stringify({
  pass, fail, fails, levels_total: r.total, levels_covered: covered,
  levels_cleared: cleared, levels_with_exits: withExits, levels_stuck: stuck,
  goal: 'every level fully cleared via the real input path (handleTap -> tryMoveBus)',
  steps: r.taps + r.ticks,
  verdict: (fails.length === 0 && coverageOk) ? 'PASS' : 'FAIL'
}));
process.exit((fails.length === 0 && coverageOk) ? 0 : 1);
