#!/usr/bin/env node
/* In-engine verifier for sliding-puzzle (Type A puzzle).
 * Engine: 30 levels, each generated deterministically by shuffleGrid(size, shuffle, seed) —
 * a seeded random walk (mulberry32) from the solved grid, so every level is solvable by
 * construction. Win path: handleClick(cx,cy) in screen 'game' hits the grid -> moveTile ->
 * isSolved() -> completeLevel() -> saveData.completed persisted (localStorage sliding_puzzle_v1).
 * Verification per level: recompute the seeded shuffle walk in the verifier (mulberry32 copy),
 * ASSERT the resulting grid equals the engine's live state.grid (engine truth), then REPLAY the
 * exact inverse walk as real clicks: handleClick(tilePos(r,c) center) for each pre-move empty
 * position, driving the engine's own click->moveTile->isSolved->completeLevel->persist chain.
 * Usage: node sliding-puzzle/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'sliding-puzzle';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* engine body is an IIFE — export the needed top-level bindings next to its closing */
const SURGERY_ANCHOR = 'requestAnimationFrame(loop);\n})();';
if (code.split(SURGERY_ANCHOR).length !== 2) { console.error('surgery anchor not unique'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
code = code.replace(SURGERY_ANCHOR, `requestAnimationFrame(loop);
window.__SP={
  initLevel:function(l){return initLevel(l)},
  LEVELS:LEVELS,
  state:state,
  saveData:saveData,
  handleClick:function(x,y){return handleClick(x,y)},
  tilePos:function(r,c){return tilePos(r,c)},
  tileSize:function(){return tileSize},
  isSolved:function(){return isSolved()}
};
})();`);

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
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    disabled: false, hidden: false,
    classList: { _set: new Set(), add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect() { return { left: 0, top: 0, width: el.width, height: el.height }; },
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const elsById = new Map();
const BODY = mkEl();
const rafQueue = [];
let simNow = 0;
const sandbox = {
  console, Math: Object.assign(Object.create(Math), Math), Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    location: { href: 'https://localhost/' },
  },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY })); return elsById.get(id); },
    querySelector: () => mkEl(), querySelectorAll: () => [], addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t }), createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { return 0; } }, clearTimeout: () => {},
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  performance: { now: () => simNow },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'sliding-puzzle-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* mulberry32 + shuffle walk copy (engine-truth check + inverse solution) */
function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffleWalk(size, count, seed) {
  const rng = mulberry32(seed);
  const g = [];
  for (let r = 0; r < size; r++) { g[r] = []; for (let c = 0; c < size; c++) { const v = r * size + c + 1; g[r][c] = v === size * size ? 0 : v; } }
  let eR = size - 1, eC = size - 1;
  const empties = [{ r: eR, c: eC }];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let i = 0; i < count; i++) {
    const valid = [];
    for (const [dr, dc] of dirs) {
      const nr = eR + dr, nc = eC + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) valid.push([nr, nc]);
    }
    const idx = Math.floor(rng() * valid.length);
    const [nr, nc] = valid[idx];
    g[eR][eC] = g[nr][nc];
    g[nr][nc] = 0;
    eR = nr; eC = nc;
    empties.push({ r: eR, c: eC });
  }
  return { grid: g, empties };
}

const SP = ctx.window.__SP;
if (!SP) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const LEVELS = SP.LEVELS;
if (!Array.isArray(LEVELS) || LEVELS.length !== 30) { console.error('LEVELS missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  try {
    SP.initLevel(lv);
    SP.state.screen = 'game';
    const walk = shuffleWalk(lv.size, lv.shuffle, lv.seed);
    /* engine truth: engine's live grid must equal the recomputed seeded shuffle */
    const live = SP.state.grid;
    for (let r = 0; r < lv.size; r++) for (let c = 0; c < lv.size; c++) {
      if (live[r][c] !== walk.grid[r][c]) throw new Error('engine grid differs from seeded shuffle at ' + r + ',' + c);
    }
    /* replay inverse walk through the engine's real click handler */
    let clicks = 0;
    for (let s = walk.empties.length - 1; s >= 1; s--) {
      const target = walk.empties[s - 1];
      const p = SP.tilePos(target.r, target.c);
      SP.handleClick(p.x + SP.tileSize() / 2, p.y + SP.tileSize() / 2);
      clicks++;
    }
    if (!SP.isSolved()) throw new Error('inverse walk did not solve the board');
    const done = SP.saveData.completed[lv.id];
    if (!done) throw new Error('isSolved reached but completed[' + lv.id + '] not persisted');
    const raw = sandbox.localStorage.getItem('slidingPuzzle_v1') || '';
    if (!raw) throw new Error('nothing persisted to localStorage slidingPuzzle_v1');
    pass++;
    if (i === 0 || i === 10 || i === 20 || i === LEVELS.length - 1) notes.push('L' + lv.id + ' ' + lv.size + 'x' + lv.size + ' "' + lv.name + '": solved via ' + clicks + ' seeded-inverse clicks, stars=' + SP.state.stars);
  } catch (e) {
    fail++; fails.push('L' + lv.id + ' ' + String(e.message).slice(0, 140));
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': seeded-shuffle engine-truth check + inverse-walk replay via real handleClick for 30 levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
