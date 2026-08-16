#!/usr/bin/env node
/* GENERATED in-engine verifier for phantom-blade — pattern follows akari/verify_engine.js.
 * vm sandbox: loads index.html inline engine (IIFE) with read-only source surgery injecting a
 * PB.__api export just before the IIFE's final return statement (engine logic untouched).
 * Drives the real input path handleTap() (menu PLAY -> tutorial -> playing) and the engine's own
 * update() with a controllable performance.now() clock (16.67ms/frame). AI predicts the exact
 * disc-impact angle of a fresh throw (mirroring the engine's per-frame math) and only throws when
 * the landing angle is clear of stuck blades (>=0.145 rad margin over the 0.12 collision angle).
 * Goal: complete 1 knife stick / score > 0 (stretch: clear level 1 = exhaust all 5 knives).
 * Usage: node phantom-blade/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'function throwKnife';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }
if (!/return\{togglePause/.test(scripts[engIdx])) { console.error('surgery anchor not found'); process.exit(1); }
scripts[engIdx] = scripts[engIdx].replace(/return\{togglePause/,
  'PB.__api={throwKnife:throwKnife,initLevel:initLevel,update:update,' +
  'tap:function(x,y){handleTap({preventDefault:function(){},clientX:x,clientY:y});},' +
  'snap:function(){return {state:state,score:score,combo:combo,level:level,knifeQueue:knifeQueue,' +
  'flying:!!flyingKnife,stuck:stuckKnives.map(function(k){return k.angle}),bombs:bombSlots.length,' +
  'gems:gemTargets.map(function(g){return g.alive}),discAngle:discAngle,discSpeed:discSpeed,discDir:discDir,' +
  'paused:paused,W:W,H:H,DX:DISC_X,DY:DISC_Y,DR:DISC_R}}};\n' +
  'return{togglePause');

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

// controllable clock: the engine derives dt from performance.now() deltas
let CLOCK = 0;
const elCache = {};
const CANVAS = mkEl({ id: 'c', width: 420, height: 800 });
CANVAS.getContext = () => mkAny();
CANVAS.getBoundingClientRect = () => ({ left: 0, top: 0, right: CANVAS.width, bottom: CANVAS.height, width: CANVAS.width, height: CANVAS.height });

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  Audio: function () { this.loop = false; this.volume = 1; this.play = () => Promise.resolve(); this.pause = () => {}; },
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 420, innerHeight: 828,
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
    getElementById: (id) => { if (id === 'c') return CANVAS; if (!elCache[id]) elCache[id] = mkEl({ id }); return elCache[id]; },
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
  performance: { now: () => CLOCK },
  __advance: (ms) => { CLOCK += ms; },
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
sandbox.window.Audio = sandbox.Audio;
sandbox.window.dispatchEvent = () => {};
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.AudioContext = sandbox.window.AudioContext;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (s.includes(ENGINE_MARK)) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (s.includes(ENGINE_MARK)) engineOK = false; }
});
if (!engineOK || !ctx.PB || !ctx.PB.__api) { console.error('engine failed to load or __api missing:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const A = PB.__api;
  const res = { frames:0, taps:0, throws:0, sticks:0, score:0, state:'', failed:false, levelCleared:false, err:null };
  const DT = 16.6667, dt = DT / 1000;
  function tick(){ __advance(DT); A.update(); res.frames++; }
  function angDiff(a,b){ let d=a-b; while(d>Math.PI)d-=Math.PI*2; while(d<-Math.PI)d+=Math.PI*2; return d; }
  // exact mirror of the engine's per-frame flight+rotation math for a knife thrown NOW
  function predictImpact(s){
    let kx = s.W/2, ky = s.H - s.H*0.13, dA = s.discAngle;
    for (let f = 0; f < 600; f++) {
      dA += s.discSpeed * s.discDir * dt;      // disc rotates first (engine order)
      ky -= 800 * dt;                           // then the knife advances
      const dy = ky - s.DY, dx = kx - s.DX;
      if (Math.sqrt(dx*dx + dy*dy) <= s.DR + 5) {
        let na = Math.atan2(dy, dx) - dA;
        while (na < 0) na += Math.PI*2; while (na >= Math.PI*2) na -= Math.PI*2;
        return na;
      }
    }
    return null;
  }
  try {
    // ---- real input path: menu -> PLAY button -> tutorial -> tap to start ----
    tick(); // one frame in menu populates PB._btnBounds / PB._skinBtns via drawOverlay
    const b = PB._btnBounds;
    if (!b) { res.err = 'menu button bounds not populated'; return res; }
    A.tap(b.bx + b.bw/2, b.by + b.bh/2); res.taps++;   // PLAY
    tick();                                             // tutorial frame
    A.tap(210, 400); res.taps++;                        // tutorial tap -> playing
    // ---- playing loop ----
    let guard = 0;
    while (guard++ < 30000) {
      const s = A.snap();
      if (s.state === 'levelComplete') { res.levelCleared = true; break; }
      if (s.state === 'fail') { res.failed = true; break; }
      if (s.state !== 'playing') { res.err = 'unexpected state ' + s.state; break; }
      if (!s.flying && s.knifeQueue > 0) {
        const na = predictImpact(s);
        const safe = na !== null && s.stuck.every(function(a){ return Math.abs(angDiff(na, a)) >= 0.145; });
        if (safe) { A.throwKnife(); res.throws++; }
      }
      tick();
    }
    const fin = A.snap();
    res.sticks = fin.stuck.length; res.score = fin.score; res.state = fin.state;
    if (guard >= 30000) res.err = 'frame guard exhausted';
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const checks = [];
checks.push(['engine-load-no-fatal-error' + (loadErrors.length ? ' (non-engine script errors: ' + loadErrors.length + ')' : ''), !r.err && !r.failed]);
checks.push(['knife-stuck-on-disc (sticks=' + r.sticks + ', throws=' + r.throws + ')', r.sticks >= 1]);
checks.push(['score>0 (score=' + r.score + ')', r.score > 0]);
checks.push(['level-1-cleared (state=' + r.state + ', all 5 knives landed)', r.levelCleared]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('phantom-blade in-engine verification: score=' + r.score + ' sticks=' + r.sticks + ' throws=' + r.throws + ' taps=' + r.taps + ' state=' + r.state + ' failed=' + r.failed + ' frames=' + r.frames);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'complete 1 knife stick on the disc / score > 0 via handleTap + update() with predicted safe throws', steps: r.frames, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
