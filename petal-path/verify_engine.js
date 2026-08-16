#!/usr/bin/env node
/* In-engine verifier for petal-path (Type A puzzle).
 * Engine: LEVELS (30 static levels) with spawn/goal/fixed arrows/walls/thorns/dewdrops
 * and an arrow budget. Petal walk semantics = engine tracePath() (index.html): apply arrow
 * at cell -> loop-check on (pos,dir) -> goal win -> thorn die -> collect dewdrop -> move
 * (wall/out = die). Win path: launchPetal() -> animatePetal via requestAnimationFrame ->
 * handleResult('win') -> showWinOverlay (#win-overlay.active) + progress persisted to
 * localStorage petalpath_progress.
 * Verification per level:
 *   1. Independent DFS solver (arrows assigned at first cell entry, WLOG over all useful
 *      placements) finds a winning arrow set within the level budget; first trying the
 *      3-star form (all dewdrops + <= par arrows), falling back to any win.
 *   2. Solution is REPLAYED through the engine's real input path: handleCellTap(x,y) taps
 *      (1st tap places 'down', further taps rotate through DIR_CYCLE) then launchPetal();
 *      the rAF queue is manually pumped so the engine's own animation completes and
 *      handleResult runs. PASS requires #win-overlay.active AND progress[lvl] persisted.
 * Usage: node petal-path/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'petal-path';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

/* extract LEVELS data (bracket-matched) for the independent solver */
function extractLevels(src) {
  const start = src.indexOf('const LEVELS=');
  if (start < 0) throw new Error('LEVELS not found');
  const ob = src.indexOf('[', start);
  let depth = 0, i = ob;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) break; }
  }
  return JSON.parse(src.slice(ob, i + 1));
}
const LEVELS = extractLevels(html);

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
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl(); const DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL; DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
const elsById = new Map();
const timerErrors = [];
const rafQueue = [];
let simNow = 1000;
const MathClone = Object.assign(Object.create(Math), Math);

const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: (m) => {}, prompt: () => '', confirm: () => true,
  CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, scrollTo: () => {}, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY, parentNode: BODY })); return elsById.get(id); },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: () => [],
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
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { timerErrors.push(String(e && e.message)); return 0; } },
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  performance: { now: () => simNow },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
  __timerErrors: timerErrors,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.setInterval = sandbox.setInterval;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.clearTimeout = sandbox.clearTimeout;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'petal-path-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* pump the engine's requestAnimationFrame queue (manual clock, 200ms/frame) */
function pumpRAF(maxFrames) {
  let n = 0;
  while (rafQueue.length && n < (maxFrames || 3000)) {
    const f = rafQueue.shift();
    simNow += 200;
    f(simNow);
    n++;
  }
  return n;
}

/* ── independent solver (mirrors tracePath semantics exactly) ──
 * Arrows are pre-placed in the real game, so an arrow must affect EVERY visit to its
 * cell. Incremental equivalent: an arrow may only be decided when the walk FIRST enters
 * a cell (it then applies to that and all later visits). */
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIR_ORDER = ['down', 'right', 'up', 'left'];
function solveLevel(lv, wantPerfect) {
  const wallSet = new Set(lv.walls.map(w => w.x + ',' + w.y));
  const thornSet = new Set(lv.thorns.map(t => t.x + ',' + t.y));
  const dewIdx = new Map(lv.dewdrops.map((d, i) => [d.x + ',' + d.y, i]));
  const placeable = [];
  for (let y = 0; y < lv.grid.h; y++) for (let x = 0; x < lv.grid.w; x++) {
    const k = x + ',' + y;
    if (wallSet.has(k) || thornSet.has(k) || k === lv.spawn.x + ',' + lv.spawn.y || k === lv.goal.x + ',' + lv.goal.y) continue;
    if (lv.fixed.some(a => a.x === x && a.y === y)) continue;
    placeable.push(k);
  }
  const placeSet = new Set(placeable);
  const fixedMap = {};
  for (const a of lv.fixed) fixedMap[a.x + ',' + a.y] = a.dir;
  const goalKey = lv.goal.x + ',' + lv.goal.y;
  const budget = lv.arrows;
  const maxSteps = lv.grid.w * lv.grid.h * 4;
  const arrows = new Map();       // key -> dir (decided at first entry)
  const visited = new Set();      // cells entered at least once
  const memo = new Set();         // failed states
  let nodes = 0; const NODE_CAP = 4e6; const DEADLINE = Date.now() + 20000; let hitCap = false;
  let best = null;

  function sig() {
    const a = [...arrows.entries()].map(e => e[0] + e[1][0]).sort().join('');
    const v = [...visited].filter(k => !arrows.has(k)).sort().join('');
    return a + '|' + v;
  }
  /* walk(): petal is AT (x,y) entering with direction d; all cells in `visited` have had
   * their arrow decision made. Returns solution map or null. */
  function walk(x, y, d, budgetLeft, collected, steps) {
    if (best) return null;
    if (++nodes > NODE_CAP || (nodes % 100000 === 0 && Date.now() > DEADLINE)) { hitCap = true; return null; }
    if (steps > maxSteps) return null;
    const key = x + ',' + y;
    let dir = d;
    if (arrows.has(key)) dir = arrows.get(key);
    else if (fixedMap[key]) dir = fixedMap[key];
    const stateKey = x + ',' + y + ',' + dir + ',' + budgetLeft + '|' + sig() + (wantPerfect ? '#' + collected : '');
    if (memo.has(stateKey)) return null;
    if (key === goalKey) {
      if (!wantPerfect || collected === (1 << lv.dewdrops.length) - 1) {
        best = new Map(arrows); return best;
      }
      memo.add(stateKey); return null; /* reached goal but not perfect — dead for this search */
    }
    if (thornSet.has(key)) { memo.add(stateKey); return null; }
    let nc = collected;
    if (dewIdx.has(key)) nc |= (1 << dewIdx.get(key));
    const [dx, dy] = DIRS[dir];
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || nx >= lv.grid.w || ny < 0 || ny >= lv.grid.h) { memo.add(stateKey); return null; }
    if (wallSet.has(nx + ',' + ny)) { memo.add(stateKey); return null; }
    const nk = nx + ',' + ny;
    let r = null;
    if (!visited.has(nk)) {
      visited.add(nk);
      if (placeSet.has(nk) && budgetLeft > 0) {
        for (const nd of DIR_ORDER) {
          arrows.set(nk, nd);
          r = walk(nx, ny, dir, budgetLeft - 1, nc, steps + 1);
          arrows.delete(nk);
          if (r) break;
          if (hitCap) break;
        }
      }
      if (!r && !hitCap) r = walk(nx, ny, dir, budgetLeft, nc, steps + 1);
      visited.delete(nk);
    } else {
      r = walk(nx, ny, dir, budgetLeft, nc, steps + 1);
    }
    if (r) return r;
    memo.add(stateKey);
    return null;
  }
  visited.add(lv.spawn.x + ',' + lv.spawn.y);
  const startCollected = dewIdx.has(lv.spawn.x + ',' + lv.spawn.y) ? (1 << dewIdx.get(lv.spawn.x + ',' + lv.spawn.y)) : 0;
  const sol = walk(lv.spawn.x, lv.spawn.y, lv.spawn.dir, budget, startCollected, 0);
  return sol ? { arrows: [...sol.entries()].map(([k, dir]) => { const [x, y] = k.split(',').map(Number); return { x, y, dir }; }), capped: hitCap, nodes } : { arrows: null, capped: hitCap, nodes };
}

/* ── drive the engine ── */
let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  try {
    const t0 = Date.now();
    let res = solveLevel(lv, true);
    let mode = '3star';
    if (!res.arrows && !res.capped) { res = solveLevel(lv, false); mode = 'win'; }
    if (!res.arrows) throw new Error(res.capped ? 'INCONCLUSIVE: solver hit cap' : 'UNWINNABLE: no arrow assignment <= budget ' + lv.arrows + ' reaches the goal');
    const sol = res.arrows;
    if (sol.length > lv.arrows) throw new Error('solver produced more arrows than budget');
    /* replay through the engine's real input path */
    ctx.startLevel(i);
    for (const a of sol) {
      const taps = 1 + DIR_ORDER.indexOf(a.dir); /* 1st tap places 'down', taps rotate through DIR_CYCLE */
      for (let t = 0; t < taps; t++) ctx.handleCellTap(a.x, a.y);
    }
    /* engine's own trace must agree the placed arrows win */
    const traceRes = ctx.tracePath(lv);
    if (process.env.PP_DEBUG && i === +process.env.PP_DEBUG) console.error('DEBUG sol=' + JSON.stringify(sol) + ' trace=' + JSON.stringify({ outcome: traceRes.outcome, collected: [...traceRes.collected] }));
    if (traceRes.outcome !== 'win') throw new Error('engine tracePath disagrees after replay: outcome=' + traceRes.outcome);
    ctx.launchPetal();
    pumpRAF(4000);
    const overlay = elsById.get('win-overlay');
    const won = overlay && overlay.classList.contains('active');
    if (!won) throw new Error('launchPetal+pump did not reach win overlay');
    const prog = JSON.parse(sandbox.localStorage.getItem('petalpath_progress') || '{}');
    if (!(prog[i] >= 1)) throw new Error('win overlay shown but progress[' + i + '] not persisted');
    pass++;
    if (i === 0 || i === LEVELS.length - 1) notes.push('L' + (i + 1) + ' "' + lv.name + '": ' + mode + ' via ' + sol.length + '/' + lv.arrows + ' arrows, stars=' + prog[i] + ' (' + (Date.now() - t0) + 'ms)');
    overlay.classList.remove('active');
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 140));
    const ov = elsById.get('win-overlay'); if (ov) ov.classList.remove('active');
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': independent solve + engine replay (handleCellTap taps -> launchPetal -> rAF pump -> win overlay + progress persisted) for ' + LEVELS.length + ' levels: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
if (timerErrors.length) console.log('  timerErrors: ' + JSON.stringify(timerErrors.slice(0, 5)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
