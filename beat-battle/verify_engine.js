#!/usr/bin/env node
/* GENERATED in-engine verifier for beat-battle — pattern follows phantom-blade/verify_engine.js.
 * vm sandbox loads the inline engine script (top-level globals: Game/UI/LEVELS/pressLane — no
 * source surgery needed). Input path: the engine's own window keydown handler (captured from
 * addEventListener) -> pressLane(lane) -> Game._press(lane) judging against the note chart.
 * Clock: controllable performance.now(); frames pumped by the engine's own Game._tick().
 * AI presses every note inside the PERFECT window (|d|<=0.06 beats, frame step 0.05 max).
 * Goal: win (hp>50 at song end => VICTORY + stars) on levels 1, 13 and 30, save persisted.
 * Usage: node beat-battle/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'pressLane';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK) && s.includes('var Game='));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }

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
    children: [], left: 0, top: 0, width: 400, height: 400, clientWidth: 400, clientHeight: 400,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; },
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
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

let CLOCK = 0;
const elCache = {};
const WINVH = {};
const KEYS = [0, 1, 2, 3].map(l => mkEl({ dataset: { l: String(l) } }));

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  window: {
    addEventListener: (t, fn) => { (WINVH[t] = WINVH[t] || []).push(fn); }, removeEventListener: () => {},
    innerWidth: 420, innerHeight: 828,
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBiquadFilter: () => ({ connect: () => {}, type: '', frequency: { value: 0 } }),
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
    getElementById: (id) => { if (!elCache[id]) elCache[id] = mkEl({ id }); return elCache[id]; },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: (sel) => (String(sel).indexOf('.key') >= 0 ? KEYS : []),
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
  setTimeout: (fn, delay) => { if (typeof fn === 'function' && (delay || 0) <= 2000) { try { fn(); } catch (e) {} } return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => CLOCK },
  __advance: (ms) => { CLOCK += ms; },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.dispatchEvent = () => {};
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.AudioContext = sandbox.window.AudioContext;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let engineOK = false; const loadErrors = [];
scripts.forEach((s, i) => {
  try { vm.runInContext(s, ctx, { filename: 'inline' + i + '.js' }); if (i === engIdx) engineOK = true; }
  catch (e) { loadErrors.push('inline' + i + ': ' + (e.message || e).toString().slice(0, 120)); if (i === engIdx) engineOK = false; }
});
if (!engineOK || !ctx.Game || !ctx.LEVELS) { console.error('engine failed to load:', loadErrors.join(' ; ')); process.exit(1); }

const DRIVER = `(function(){
  const res = { levels:{}, presses:0, frames:0, err:null };
  const KEYK = ['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'];
  function fireKey(l){ window.__vh.keydown.forEach(function(h){ h({ key: KEYK[l], preventDefault: function(){} }); }); res.presses++; }
  function playLevel(lid){
    Game.start(lid);
    Render.init(); UI.refreshMenu();
    let guard = 0;
    while (Game.running && guard++ < 500000) {
      const beat = (performance.now() / 1000 - Game.startTime) / Game.beatDur;
      for (let i = Game.idx; i < Game.notes.length; i++) {
        const n = Game.notes[i];
        if (n.t > beat + 0.06) break;
        if (!n.hit && !n.miss && Math.abs(n.t - beat) <= 0.06) fireKey(n.lane);
      }
      __advance(16.6667);
      Game._tick();
      res.frames++;
    }
    const win = Game.hp > 50;
    const acc = Game.total > 0 ? (Game.hpP + Game.hpG + Game.hpO) / Game.total : 0;
    return { lid: lid, win: win, hp: Game.hp, score: Math.round(Game.score), acc: acc,
      brk: [Game.hpP, Game.hpG, Game.hpO, Game.hpM].join('/'), maxCombo: Game.maxCombo, frames: guard };
  }
  try {
    [1, 13, 30].forEach(function(lid){ res.levels[lid] = playLevel(lid); });
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

sandbox.window.__vh = WINVH;
let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0, 3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

let saved = null;
try { saved = JSON.parse(sandbox.localStorage.getItem('beatbattle_v1') || 'null'); } catch (e) {}
const L = r.levels || {};
const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err && !loadErrors.length]);
checks.push(['level1-won (hp=' + (L[1] && L[1].hp) + ' brk=' + (L[1] && L[1].brk) + ')', L[1] && L[1].win]);
checks.push(['level13-won (hp=' + (L[13] && L[13].hp) + ' brk=' + (L[13] && L[13].brk) + ')', L[13] && L[13].win]);
checks.push(['level30-won (hp=' + (L[30] && L[30].hp) + ' brk=' + (L[30] && L[30].brk) + ')', L[30] && L[30].win]);
checks.push(['save-persisted (stars keys=' + (saved && saved.stars ? Object.keys(saved.stars).join(',') : 'none') + ')', !!(saved && saved.stars && saved.stars[1] && saved.stars[13] && saved.stars[30])]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('beat-battle in-engine verification: L1 ' + JSON.stringify(L[1]) + ' | L13 ' + JSON.stringify(L[13]) + ' | L30 ' + JSON.stringify(L[30]) + ' | presses=' + r.presses + ' frames=' + r.frames);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'win 3 representative levels (1 Beginner / 13 Normal / 30 Master) via real keydown->pressLane->_press with perfect-timing play; stars+combo saved to localStorage', steps: r.frames, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
