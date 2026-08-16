#!/usr/bin/env node
/* In-engine verifier for power-wash (Type A puzzle, embedded-solution replay).
 * Engine (index.html, top-level script): 30 levels generated deterministically by
 * REVERSE CONSTRUCTION — generateLevels() builds each dirt grid by applying exactly
 * `strokes` simple paths (genPath) to a clean grid (each visit dirt++ capped at
 * maxDirt), so replaying those construction paths is a guaranteed optimal solution.
 * Real input path: canvas mousedown/mousemove/mouseup -> handleStart/handleMove/
 * handleEnd; a stroke is a self-avoiding orthogonal path of cells; handleEnd
 * decrements dirt on every path cell, then checkWin() -> all clean =>
 * localStorage "pw_stars"[level] persisted + setTimeout(300) (sandbox: immediate)
 * showWinOverlay() unhides #overlay.
 * Verification per level: capture the generator's own construction paths via string
 * surgery on the verifier's in-memory copy (globalThis.__SOL), cross-check by
 * simulating them against the engine's dirt grid (must clean it in exactly
 * level.strokes strokes), then REPLAY each path through the recorded canvas mouse
 * listeners at cell centers. PASS requires the engine's own checkWin path:
 * #overlay shown AND pw_stars[level] persisted.
 * Sandbox note: the engine starts with `const AC = new (window.AudioContext||...)`
 * OUTSIDE any try/catch, so a functional AudioContext stub is required to load it.
 * Usage: node power-wash/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'power-wash';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* surgery 1: init the solution capture BEFORE generateLevels() executes */
const ANCHOR_LEVELS = 'const ALL_LEVELS = generateLevels();';
if (!code.includes(ANCHOR_LEVELS)) fail2('anchor ALL_LEVELS missing');
code = code.replace(ANCHOR_LEVELS, 'globalThis.__SOL=[];' + ANCHOR_LEVELS);
/* surgery 2: capture every construction path (the embedded solution) */
const ANCHOR_PATH = 'const path = genPath(rng, size, pathLen, dirt);';
if (!code.includes(ANCHOR_PATH)) fail2('anchor genPath missing');
code = code.replace(ANCHOR_PATH, ANCHOR_PATH + '\n          globalThis.__SOL.push(path.map(function(p){return p.slice()}));');
/* surgery 3: expose internals (top-level script: second eval shares the global lexical scope) */
code += `
;globalThis.__PW={
 load:function(i){return loadLevel(i)},
 undo:undo, restart:restartLevel,
 levels:function(){return ALL_LEVELS},
 grid:function(){return grid},
 strokes:function(){return {left:strokesLeft,used:strokesUsed}},
 sol:function(){return globalThis.__SOL}
};`;
function fail2(msg) { console.error(msg); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

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
function audioParam() { return { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
function audioNode(extra) { return Object.assign({ connect() {}, disconnect() {}, start() {}, stop() {} }, extra || {}); }
function mkAudioContext() {
  return {
    sampleRate: 44100, state: 'running', currentTime: 0, destination: {},
    resume() {}, close() { return { catch() {} }; },
    createGain() { return audioNode({ gain: audioParam() }); },
    createOscillator() { return audioNode({ frequency: audioParam(), type: 'sine' }); },
    createBiquadFilter() { return audioNode({ frequency: audioParam(), Q: audioParam(), type: 'lowpass' }); },
    createBufferSource() { return audioNode({ buffer: null, loop: false }); },
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(Math.max(1, Math.floor(len) || 1)) }; },
  };
}
function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], width: 560, height: 900, clientWidth: 560, clientHeight: 900, offsetHeight: 40, offsetWidth: 40,
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
let seed = 777;
const MathClone = Object.create(Math);
MathClone.imul = Math.imul;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const AudioCtx = mkAudioContext;
const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
  devicePixelRatio: 1, adsbygoogle: [],
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 560, innerHeight: 900,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, scrollTo: () => {}, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {}, AudioContext: AudioCtx, webkitAudioContext: AudioCtx,
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
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'power-wash-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const PW = sandbox.window.__PW || sandbox.__PW;
if (!PW) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* ── helpers ── */
const canvas = elsById.get('game-canvas');
/* cellSize exactly as the engine's resizeCanvas() computes it:
 * cellSize = floor(dim/size), dim = min(innerWidth-30, innerHeight*0.55, 520) with
 * the sandbox window fixed at 560x900 */
const DIM = Math.min(560 - 30, 520, 900 * 0.55);
function cellCenter(x, y, size) { const cs = Math.floor(DIM / size); return { clientX: (x + 0.5) * cs, clientY: (y + 0.5) * cs }; }
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
function replayStroke(pathCells, size) {
  const c0 = cellCenter(pathCells[0][0], pathCells[0][1], size);
  dispatch(canvas, 'mousedown', c0);
  for (let i = 1; i < pathCells.length; i++) {
    const c = cellCenter(pathCells[i][0], pathCells[i][1], size);
    dispatch(canvas, 'mousemove', c);
  }
  dispatch(canvas, 'mouseup', c0);
}

/* ── independent cross-check: captured construction paths must clean the dirt grid ── */
function simulateClean(dirt, paths) {
  const g = dirt.map(r => r.slice());
  for (const p of paths) for (const [x, y] of p) { if (g[y][x] > 0) g[y][x]--; }
  return g.every(row => row.every(v => v === 0));
}

const LEVELS = PW.levels();
const SOL = PW.sol();
/* group the flat per-stroke capture into per-level solutions (generation order is
 * the deterministic t/li loop, `strokes` strokes per level) */
const expectedTotal = LEVELS.reduce((a, l) => a + l.strokes, 0);
if (!Array.isArray(SOL) || SOL.length !== expectedTotal) {
  console.error('solution capture failed: got ' + (SOL ? SOL.length : 0) + ' construction strokes, expected ' + expectedTotal);
  console.log(JSON.stringify({ pass: 0, fail: LEVELS.length, total: LEVELS.length, verdict: 'FAIL' }));
  process.exit(1);
}
const SOL_BY_LEVEL = [];
{
  let k = 0;
  for (const l of LEVELS) SOL_BY_LEVEL.push(SOL.slice(k, k + l.strokes)), k += l.strokes;
}

let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < LEVELS.length; i++) {
  const t0 = Date.now();
  try {
    const lvl = LEVELS[i];
    const paths = SOL_BY_LEVEL[i];
    if (!Array.isArray(paths) || paths.length !== lvl.strokes) throw new Error('captured ' + (paths ? paths.length : 0) + ' construction strokes, expected ' + lvl.strokes);
    if (!simulateClean(lvl.dirt, paths)) throw new Error('independent replay of construction paths does NOT clean the dirt grid (level data/solution mismatch)');
    /* sanity: strokes must be simple orthogonal paths (what handleMove accepts) */
    for (const p of paths) for (let k = 1; k < p.length; k++) {
      if (Math.abs(p[k][0] - p[k - 1][0]) + Math.abs(p[k][1] - p[k - 1][1]) !== 1) throw new Error('construction path not orthogonal at step ' + k);
    }
    /* replay through the engine's real mouse input */
    PW.load(i);
    const gridW = PW.grid().length;
    if (gridW !== lvl.size) throw new Error('engine grid size mismatch');
    for (const p of paths) replayStroke(p, lvl.size);
    const grid = PW.grid();
    const left = grid.reduce((a, r) => a + r.reduce((x, v) => x + (v > 0 ? 1 : 0), 0), 0);
    if (left > 0) throw new Error(left + ' dirty tiles remain after replaying all ' + lvl.strokes + ' strokes');
    const st = PW.strokes();
    if (st.used !== lvl.strokes || st.left !== 0) throw new Error('stroke accounting wrong: used=' + st.used + ' left=' + st.left);
    const ov = elsById.get('overlay');
    if (!ov || !ov.classList.contains('show')) throw new Error('#overlay not shown (checkWin did not fire win)');
    const stars = JSON.parse(sandbox.localStorage.getItem('pw_stars') || '{}');
    if (!(stars[lvl.level] >= 1)) throw new Error('pw_stars not persisted for level ' + lvl.level);
    pump(2);
    pass++;
    if (i < 2 || i === LEVELS.length - 1) notes.push('L' + lvl.level + ' (' + lvl.tierName + ', ' + lvl.size + 'x' + lvl.size + '): cleaned in ' + st.used + '/' + lvl.strokes + ' strokes, stars=' + stars[lvl.level] + ' (' + (Date.now() - t0) + 'ms)');
    ov.classList.remove('show');
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 160));
    const ov = elsById.get('overlay'); if (ov) ov.classList.remove('show');
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': generator-embedded construction strokes replayed through real canvas mouse input to engine checkWin for ' + LEVELS.length + ' levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
