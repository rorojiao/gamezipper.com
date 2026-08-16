#!/usr/bin/env node
/* GENERATED in-engine verifier for snake — pattern follows akari/verify_engine.js.
 * vm sandbox: loads index.html inline scripts (engine is inline, top-level declarations so a
 * follow-up script in the same context can reach snake/food/step/setDir directly — no surgery).
 * Drives the real player input path setDir() + engine tick step() with a BFS pathfinder to the
 * nearest food. Goal: snake length reaches 10 (ate 9 foods) without crashing.
 * Usage: node snake/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)(?![^>]*type="text\/javascript-verify")[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ENGINE_MARK = 'function step';

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
  const res = { steps:0, ticks:0, deaths:0, maxLen:1, score:0, err:null };
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
  function bfsFirstStep(){
    // BFS from head to food avoiding the snake body (all segments, conservative)
    const head = snake[0];
    if (!food) return null;
    const blocked = {};
    for (const s of snake) blocked[s.x + ',' + s.y] = true;
    const q = [[head.x, head.y]];
    const prev = {}; prev[head.x + ',' + head.y] = '';
    while (q.length) {
      const [x, y] = q.shift();
      if (x === food.x && y === food.y) {
        // walk back to the step after head
        let k = x + ',' + y; const p = prev[k];
        if (p === head.x + ',' + head.y) return { x: x - head.x, y: y - head.y };
        let cur = k;
        while (prev[cur] !== head.x + ',' + head.y) cur = prev[cur];
        const [cx, cy] = cur.split(',').map(Number);
        return { x: cx - head.x, y: cy - head.y };
      }
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, key = nx + ',' + ny;
        if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
        if (blocked[key] && !(nx === food.x && ny === food.y)) continue;
        if (key in prev) continue;
        prev[key] = x + ',' + y;
        q.push([nx, ny]);
      }
    }
    return null;
  }
  function safeMove(){
    // fallback: any adjacent cell not occupied and not a reverse
    const head = snake[0];
    const occ = {};
    for (let i = 0; i < snake.length - 1; i++) occ[snake[i].x + ',' + snake[i].y] = true; // tail moves away
    for (const [dx, dy] of DIRS) {
      if (dx === -dir.x && dy === -dir.y && snake.length > 1) continue;
      const nx = head.x + dx, ny = head.y + dy;
      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
      if (occ[nx + ',' + ny]) continue;
      return { x: dx, y: dy };
    }
    return null;
  }
  try {
    startGame();
    let guard = 0;
    while (guard++ < 20000) {
      if (snake.length >= 10) break;
      if (gameState !== 'play') { res.deaths++; startGame(); continue; }
      let mv = bfsFirstStep();
      if (!mv) mv = safeMove();
      if (!mv) { res.deaths++; startGame(); continue; }
      setDir(mv.x, mv.y);
      step();
      res.steps++;
      if (snake.length > res.maxLen) res.maxLen = snake.length;
      res.score = score;
    }
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const checks = [];
checks.push(['engine-load-no-fatal-error' + (loadErrors.length ? ' (non-engine script errors: ' + loadErrors.length + ')' : ''), !r.err]);
checks.push(['snake-length-10-reached (maxLen=' + r.maxLen + ', score=' + r.score + ')', r.maxLen >= 10]);
checks.push(['score-positive', r.score > 0]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('snake in-engine verification: maxLen=' + r.maxLen + ' score=' + r.score + ' steps=' + r.steps + ' deaths=' + r.deaths);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'snake length reaches 10 (BFS auto-player eats 9 foods)', steps: r.steps, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
