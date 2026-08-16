#!/usr/bin/env node
/* GENERATED in-engine verifier for slice-master — pattern follows akari/verify_engine.js.
 * vm sandbox: loads index.html inline scripts (engine is inline, top-level declarations so a
 * follow-up script in the same context can reach G/LEVELS/startLevel/performCut directly — no
 * surgery). Drives the engine's own performCut() with a cut line through the level-1 circle's
 * center; the engine's own setTimeout(checkComplete,350) (stubbed to run synchronously) then
 * calls finishLevel(). Goal: complete one successful cut (level 1 solved, stars awarded).
 * Usage: node slice-master/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)(?![^>]*type="text\/javascript-verify")[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'function performCut';
/* the engine is an IIFE: read-only source surgery injects a __verify export at its tail */
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }
if (!/\}\)\(\);\s*$/.test(scripts[engIdx])) { console.error('surgery anchor not found'); process.exit(1); }
scripts[engIdx] = scripts[engIdx].replace(/\}\)\(\);\s*$/,
  'window.__verify={startLevel:startLevel,performCut:performCut,G:G,LEVELS:LEVELS,save:save,CX:CX,CY:CY,' +
  'snap:function(){return {pieces:G.pieces.length,target:G.targetPieces,completed:G.completed,' +
  'failed:G.failed,stars:G.lastStars,score:(save.scores&&save.scores[G.lvIdx])||0,cutsLeft:G.cutsLeft}}};\n})();');

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
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 36,
    disabled: false, hidden: false, visibilityState: 'visible', display: 'none',
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
sandbox.window.dispatchEvent = sandbox.window.dispatchEvent || (() => {});
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (s.includes(ENGINE_MARK)) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (s.includes(ENGINE_MARK)) engineOK = false; }
});
if (!engineOK) { console.error('engine script failed to load:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const V = window.__verify;
  const res = { cutHit:false, pieces:0, target:0, completed:false, failed:false, stars:0, score:0, err:null };
  try {
    V.startLevel(0);
    res.target = V.snap().target;
    // level 1: single circle(CX,CY,r=120), target 2 pieces, 1 cut allowed.
    // Player action = drag a straight cut line through the shape's center (vertical diameter).
    res.cutHit = V.performCut({x: V.CX, y: V.CY - 160}, {x: V.CX, y: V.CY + 160}) === true;
    const s = V.snap();
    res.pieces = s.pieces; res.completed = s.completed; res.failed = s.failed;
    res.stars = s.stars; res.score = s.score;
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const checks = [];
checks.push(['engine-load-no-fatal-error' + (loadErrors.length ? ' (non-engine script errors: ' + loadErrors.length + ')' : ''), !r.err]);
checks.push(['cut-hit-target (performCut returned true, pieces=' + r.pieces + '/' + r.target + ')', r.cutHit && r.pieces >= 2]);
checks.push(['level-complete-flow (G.completed, stars=' + r.stars + ', score=' + r.score + ')', r.completed && !r.failed && r.stars >= 1 && r.score > 0]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('slice-master in-engine verification: cutHit=' + r.cutHit + ' pieces=' + r.pieces + '/' + r.target + ' completed=' + r.completed + ' stars=' + r.stars + ' score=' + r.score);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'complete one cut that splits the target shape (level 1 solved via performCut + engine checkComplete/finishLevel)', steps: 1, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
