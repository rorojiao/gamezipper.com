#!/usr/bin/env node
/* GENERATED in-engine verifier for tetris — pattern follows akari/verify_engine.js.
 * vm sandbox: loads game.js (top-level engine, no surgery needed — declarations stay reachable
 * from follow-up scripts in the same context). Drives only real player actions:
 * rotate()/moveLeft()/moveRight()/hardDrop(). Placement picked by simulating the engine's own
 * validPos() over all rotations x columns and scoring the resulting board (holes/bump/height/lines).
 * Goal: clear at least 1 line.
 * Usage: node tetris/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const code = fs.readFileSync(path.join(SLUG_DIR, 'game.js'), 'utf8');

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
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 380, clientHeight: 500,
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

const DRIVER = `(function(){
  const res = { pieces:0, lines:0, score:0, err:null, restarts:0 };
  function cloneBoard(b){ return b.map(function(r){ return r.slice(); }); }
  function dropY(bd, piece, x, rot){
    // landing row for piece at column x with rotation rot (using engine's own validPos)
    let y = piece.y;
    while (validPos(piece, x, y + 1, rot)) y++;
    return y;
  }
  function evaluate(bd){
    let heights = [], holes = 0, agg = 0;
    for (let c = 0; c < COLS; c++) {
      let h = 0, seen = false;
      for (let r = 0; r < ROWS; r++) {
        if (bd[r][c]) { if (!seen) { h = ROWS - r; seen = true; } }
        else if (seen) holes++;
      }
      heights.push(h); agg += h;
    }
    let bump = 0;
    for (let c = 0; c < COLS - 1; c++) bump += Math.abs(heights[c] - heights[c + 1]);
    let full = 0;
    for (let r = 0; r < ROWS; r++) if (bd[r].every(function(x){ return x !== null; })) full++;
    return agg * 1.0 + holes * 28 + bump * 3 - full * 130;
  }
  function simulate(bd, piece, x, rot){
    const y = dropY(bd, piece, x, rot);
    if (y < 0 || !validPos(piece, x, y, rot)) return null;
    const nb = cloneBoard(bd);
    const shape = getShape(piece.type, rot);
    for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const by = y + r;
      if (by < 0) return null;
      nb[by][x + c] = 'v';
    }
    return nb;
  }
  try {
    startGame();
    let guard = 0;
    while (gameRunning && guard++ < 600) {
      if (lines >= 1) break;
      const piece = { type: currentPiece.type, rot: currentPiece.rot, x: currentPiece.x, y: -3 };
      let best = null;
      for (let rot = 0; rot < 4; rot++) {
        const shape = getShape(piece.type, rot);
        for (let x = -2; x <= COLS; x++) {
          if (!validPos(piece, x, 0, rot)) continue;
          const nb = simulate(board, piece, x, rot);
          if (!nb) continue;
          const sc = evaluate(nb);
          if (!best || sc < best.sc) best = { sc: sc, rot: rot, x: x };
        }
      }
      if (!best) { // no placement (shouldn't happen) — just drop
        hardDrop(); res.pieces++; continue;
      }
      // execute via real player actions
      let safety = 0;
      while (currentPiece.rot !== best.rot && safety++ < 8) {
        const before = currentPiece.rot;
        rotate();
        if (currentPiece.rot === before) break; // rotation rejected
      }
      safety = 0;
      while (currentPiece.x < best.x && safety++ < 12) moveRight();
      safety = 0;
      while (currentPiece.x > best.x && safety++ < 12) moveLeft();
      hardDrop();
      res.pieces++;
      if (!gameRunning) { // topped out — restart and try again
        startGame(); res.restarts++;
      }
    }
    res.lines = lines; res.score = score;
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err]);
checks.push(['cleared-1-line (lines=' + r.lines + ', score=' + r.score + ', pieces=' + r.pieces + ')', r.lines >= 1]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('tetris in-engine verification: lines=' + r.lines + ' score=' + r.score + ' pieces=' + r.pieces + ' restarts=' + r.restarts);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'clear at least 1 line via player actions (rotate/move/hardDrop)', steps: r.pieces, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
