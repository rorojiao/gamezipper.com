#!/usr/bin/env node
/* soap-slice in-engine verifier — spec v3, type A (embedded-solution replay).
 * index.html inline game script (IIFE + 'use strict') loaded into a vm sandbox;
 * accessor injected before the IIFE's closing paren (spec-approved anchor surgery)
 * to reach IIFE-internal vars (state/LEVELS/progress/cellSize/handlers).
 * For each of the 30 levels: LEVELS[i].bestCuts/minCuts (engine-computed at load by
 * solveMinCuts brute force) are re-derived by an INDEPENDENT minimality enumeration
 * (my own cut-semantics checker: every 4-adjacency not severed by a cut must join
 * equal colors — exactly the engine's checkSolved component rule), then the cuts are
 * REPLAYED through the engine's real input path: canvas.onpointerdown/move/up with
 * geometric drag start on the gap line (snapToCut), so placeCut -> engine's own
 * checkSolved must set state.solved, the 300ms onSolved timer + rAF animateSolve +
 * 500ms showWinModal fire under the virtual clock, stars (=3, used===minCuts)
 * persist to localStorage 'soap-slice-save' and unlock advances.
 * Negative: pre-final-cut state must not be solved; cut budget exceed (used===
 * maxCuts -> placeCut early-return playError path, counts frozen); tap-toggle-off
 * of an existing cut; undo; resetLevel. Engine-vs-independent checker agreement is
 * asserted on every hypothetical config the greedy negative search evaluates.
 * Usage: node soap-slice/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'soap-slice';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
/* anchor surgery: inject accessor inside the game IIFE (block containing RAW_LEVELS) */
const gi = blocks.findIndex(b => b.includes('RAW_LEVELS'));
if (gi < 0) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', extra: { error: 'game script block not found' } })); process.exit(1); }
const gb = blocks[gi];
const anchor = gb.lastIndexOf('})();');
blocks[gi] = gb.slice(0, anchor) + `
;globalThis.__V={
  get state(){return state}, get progress(){return progress},
  get cellSize(){return cellSize}, get gridOffsetX(){return gridOffsetX}, get gridOffsetY(){return gridOffsetY},
  get hintFlash(){return hintFlash}, get canvas(){return canvas},
  LEVELS:LEVELS, checkSolved:checkSolved, setupCanvas:setupCanvas,
  startLevel:window.startLevel, undoCut:window.undoCut, resetLevel:window.resetLevel, useHint:window.useHint,
  saveProgress:saveProgress, loadProgress:loadProgress,
};
` + gb.slice(anchor);
const code = blocks.join('\n');

/* ---- canvas 2d context stub (spec template) ---- */
const CTX2D = new Proxy({ fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', globalAlpha: 1, textAlign: '', textBaseline: '', lineCap: '', lineJoin: '' }, {
  get: (t, p) => {
    if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    if (typeof p === 'string' && !(p in t)) return () => 1;
    return t[p];
  },
  set: () => true,
});
function mkEl(id) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '',
    style: { setProperty() {} }, dataset: {},
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); }, removeEventListener() {},
    dispatch(t, ev) { (listeners[t] || []).slice().forEach(f => f(ev)); },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 640, right: 480, bottom: 640 }),
    setAttribute() {}, getAttribute: () => null, focus() {}, blur() {}, click() {},
    getContext: () => CTX2D,
    offsetHeight: 0, offsetWidth: 0, clientWidth: 0, clientHeight: 0,
    width: 480, height: 640, disabled: false,
  };
  el._listeners = listeners;
  return el;
}
const elsById = new Map();
const getEl = (id) => { if (!elsById.has(id)) elsById.set(id, mkEl(id)); return elsById.get(id); };
/* setupCanvas reads .canvas-area clientWidth/clientHeight — must be numeric */
const areaEl = mkEl('canvas-area');
areaEl.clientWidth = 640; areaEl.clientHeight = 800;

/* ---- virtual clock + rAF queue ---- */
let VT = 0; const rafQ = []; let timerId = 1; const timers = []; let harnessErrors = [];
function fireTimers() { const due = timers.filter(t => t.at <= VT); for (const t of due) { timers.splice(timers.indexOf(t), 1); try { t.fn(); } catch (e) { harnessErrors.push('timer: ' + e.message); } } }
function frame() { VT += 1000 / 60; const cbs = rafQ.splice(0); cbs.forEach(f => { try { f(VT); } catch (e) { harnessErrors.push('raf: ' + e.message); } }); fireTimers(); }
function pumpFrames(n) { for (let i = 0; i < n; i++) frame(); }

const MathClone = Object.assign(Object.create(Math), Math);
let seed = 12345; MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const docListeners = {}, winListeners = {};
const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean, Symbol, RegExp, Promise,
  Uint8Array, Uint32Array, Int32Array, Float32Array, Uint8ClampedArray, Error, TypeError, RangeError,
  parseInt, parseFloat, isNaN, isFinite, alert() {}, prompt: () => '', confirm: () => true,
  setTimeout: (fn, ms) => { timers.push({ id: timerId, at: VT + (ms || 0), fn }); return timerId++; },
  clearTimeout: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
  setInterval: (fn, ms) => { const id = timerId++; timers.push({ id, at: VT + (ms || 1), fn, interval: ms || 1 }); return id; },
  clearInterval: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
  requestAnimationFrame: (fn) => { rafQ.push(fn); return rafQ.length; }, cancelAnimationFrame() {},
  performance: { now: () => VT },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear() { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '' },
  document: {
    getElementById: getEl,
    querySelector: (sel) => (sel && sel.indexOf('canvas-area') >= 0 ? areaEl : mkEl()),
    querySelectorAll: () => [],
    createElement: t => mkEl(t), createElementNS: (ns, t) => mkEl(t), createTextNode: t => ({ textContent: t }),
    addEventListener(t, f) { (docListeners[t] = docListeners[t] || []).push(f); }, removeEventListener() {},
    body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'),
    hidden: false, visibilityState: 'visible', cookie: '', readyState: 'complete',
  },
  adsbygoogle: { push() {} },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  Event: function (t) { this.type = t; }, CustomEvent: function (t) { this.type = t; },
};
sandbox.window = {
  addEventListener(t, f) { (winListeners[t] = winListeners[t] || []).push(f); }, removeEventListener() {}, dispatchEvent() {},
  innerWidth: 640, innerHeight: 900, devicePixelRatio: 1, scrollX: 0, scrollY: 0, scrollTo() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  location: sandbox.location, localStorage: sandbox.localStorage, performance: sandbox.performance,
  setTimeout: sandbox.setTimeout, clearTimeout: sandbox.clearTimeout, setInterval: sandbox.setInterval, clearInterval: sandbox.clearInterval,
  requestAnimationFrame: sandbox.requestAnimationFrame, cancelAnimationFrame: sandbox.cancelAnimationFrame,
  navigator: sandbox.navigator, document: sandbox.document, adsbygoogle: sandbox.adsbygoogle,
  AudioContext: undefined, webkitAudioContext: undefined,
};
sandbox.window.window = sandbox.window; sandbox.globalThis = sandbox; sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: SLUG + '-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', extra: { error: String(loadErr.message).slice(0, 160) } })); process.exit(1); }
const V = ctx.__V;
const E = () => V.state; // live engine state

/* ---- independent checker: engine checkSolved semantics re-derived ----
 * A cut set solves iff every cell pair joined by an uncut 4-adjacency has equal
 * color (equivalent to: all components single-color). */
function mySolved(grid, rows, cols, hCuts, vCuts) {
  const h = new Set(hCuts), v = new Set(vCuts);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (r + 1 < rows && !h.has(r) && grid[r][c] !== grid[r + 1][c]) return false;
    if (c + 1 < cols && !v.has(c) && grid[r][c] !== grid[r][c + 1]) return false;
  }
  return true;
}
/* independent minimum-cut enumeration (same search space, own semantics) */
function myMinCuts(lv) {
  const { grid, rows, cols } = lv;
  const hO = rows - 1, vO = cols - 1;
  for (let total = 0; total <= hO + vO; total++) {
    // enumerate subsets of hO+vO slots with exactly `total` bits set
    const n = hO + vO;
    const combos = [];
    const rec = (start, left, acc) => {
      if (left === 0) { combos.push(acc.slice()); return; }
      for (let i = start; i <= n - left; i++) { acc.push(i); rec(i + 1, left - 1, acc); acc.pop(); }
    };
    rec(0, total, []);
    for (const set of combos) {
      const h = set.filter(x => x < hO), v = set.filter(x => x >= hO).map(x => x - hO);
      if (mySolved(grid, rows, cols, h, v)) return { minCuts: total, h, v };
    }
  }
  return { minCuts: Infinity, h: null, v: null };
}

/* ---- real input path: drag a cut through canvas.onpointerdown/move/up ---- */
function dragCut(type, idx) {
  const c = getEl('soap-canvas');
  const cs = V.cellSize, ox = V.gridOffsetX, oy = V.gridOffsetY;
  const mk = (x, y) => ({ clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
  if (type === 'h') {
    const y = oy + (idx + 1) * cs; // exactly on the gap line (snap dist 0 < 0.4*cell)
    const x0 = ox + cs * 1.2;
    c.onpointerdown(mk(x0, y)); c.onpointermove(mk(x0 + 30, y)); c.onpointerup(mk(x0 + 60, y));
  } else {
    const x = ox + (idx + 1) * cs;
    const y0 = oy + cs * 1.2;
    c.onpointerdown(mk(x, y0)); c.onpointermove(mk(x, y0 + 30)); c.onpointerup(mk(x, y0 + 60));
  }
}
function tapAt(x, y) {
  const c = getEl('soap-canvas');
  const mk = (px, py) => ({ clientX: px, clientY: py, pointerId: 1, preventDefault() {} });
  c.onpointerdown(mk(x, y)); c.onpointerup(mk(x, y)); // dist<15 -> snapTapToCut
}

const results = { pass: 0, fail: 0, failIdx: [], fails: [], notes: [] };
const T0 = Date.now();
const LEVELS = V.LEVELS;
if (!LEVELS || LEVELS.length !== 30) { results.fails.push('LEVELS length ' + (LEVELS && LEVELS.length)); }

/* ---- per-level: independent minimality + embedded-solution replay ---- */
for (let i = 0; i < LEVELS.length; i++) {
  try {
    if (Date.now() - T0 > 100000) throw new Error('global time cap');
    const lv = LEVELS[i];
    if (!isFinite(lv.minCuts) || !lv.bestCuts || !lv.bestCuts.h || !lv.bestCuts.v) throw new Error('engine minCuts/bestCuts missing (unsolvable by solver)');
    if (!mySolved(lv.grid, lv.rows, lv.cols, lv.bestCuts.h, lv.bestCuts.v)) throw new Error('engine bestCuts does NOT solve (my checker)');
    const mine = myMinCuts(lv);
    if (mine.minCuts !== lv.minCuts) throw new Error('minCuts mismatch: engine=' + lv.minCuts + ' independent=' + (mine.minCuts === Infinity ? 'INF' : mine.minCuts));
    if (lv.bestCuts.h.length + lv.bestCuts.v.length !== lv.minCuts) throw new Error('bestCuts size !== minCuts');

    getEl('win-modal').classList.remove('active'); // mirror nextLevel() UI flow between levels
    V.startLevel(i);
    pumpFrames(6); // fire setTimeout(setupCanvas,50)
    if (!V.cellSize || V.cellSize < 30 || V.cellSize !== V.cellSize) throw new Error('setupCanvas failed (cellSize=' + V.cellSize + ')');
    const cuts = [];
    for (const h of lv.bestCuts.h) cuts.push(['h', h]);
    for (const v of lv.bestCuts.v) cuts.push(['v', v]);
    for (let k = 0; k < cuts.length; k++) {
      if (k === cuts.length - 1 && E().solved) throw new Error('solved before final cut (minimality violated in engine replay)');
      dragCut(cuts[k][0], cuts[k][1]);
      if (k < cuts.length - 1 && E().solved) throw new Error('engine solved on cut ' + (k + 1) + '/' + cuts.length + ' (< minCuts)');
    }
    if (!E().solved) throw new Error('all bestCuts placed via pointer path but state.solved=false (engine checkSolved did not fire)');
    pumpFrames(100); // 300ms onSolved + 20 rAF animateSolve + 500ms showWinModal
    if (!getEl('win-modal').classList.contains('active')) throw new Error('win modal not shown');
    const saved = JSON.parse(sandbox.localStorage.getItem('soap-slice-save') || '{}');
    const stars = saved.stars && saved.stars[i];
    if (stars !== 3) throw new Error('stars not persisted as 3 (got ' + stars + ')');
    if (!(saved.unlocked >= Math.min(i + 2, 30))) throw new Error('unlock did not advance (unlocked=' + saved.unlocked + ')');
    results.pass++;
    if (i === 0 || i === 14 || i === 29) results.notes.push('L' + (i + 1) + ' (' + lv.rows + 'x' + lv.cols + '): minCuts=' + lv.minCuts + ' independently re-derived, ' + cuts.length + ' cuts replayed via real drag path -> solved + modal + 3 stars saved');
  } catch (e) {
    results.fail++; results.failIdx.push(i + 1); results.fails.push('L' + (i + 1) + ': ' + String(e.message).slice(0, 150));
  }
}

/* ---- extra negative/paths on L11 (idx10) and L1 (idx0) ---- */
let extra = 0;
try {
  /* budget exceed: fill maxCuts with non-solving cuts, then one more must be rejected */
  let done = false;
  for (let li = 0; li < LEVELS.length && !done; li++) {
    const lv = LEVELS[li];
    if (lv.minCuts + 2 > (lv.rows - 1) + (lv.cols - 1)) continue; // not enough slots
    V.startLevel(li); pumpFrames(6);
    const st = E();
    const slots = [];
    for (let c = 0; c < lv.cols - 1; c++) slots.push(['v', c]);
    for (let r = 0; r < lv.rows - 1; r++) slots.push(['h', r]);
    let agree = 0;
    for (const s of slots) {
      if (st.hCuts.length + st.vCuts.length >= st.maxCuts) break;
      const h2 = st.hCuts.slice(), v2 = st.vCuts.slice();
      (s[0] === 'h' ? h2 : v2).push(s[1]);
      const eng = V.checkSolved(st.grid, st.rows, st.cols, h2, v2); // engine's own pure checker
      const mine = mySolved(st.grid, st.rows, st.cols, h2, v2);
      if (eng !== mine) throw new Error('engine checkSolved disagrees with independent checker on L' + (li + 1));
      agree++;
      if (eng) continue; // would solve — skip this slot
      dragCut(s[0], s[1]);
      if (st.solved) throw new Error('unexpected solve during budget fill L' + (li + 1));
    }
    const used = st.hCuts.length + st.vCuts.length;
    if (used < st.maxCuts) continue;
    if (st.solved) continue;
    /* find any remaining slot to attempt the (maxCuts+1)-th cut */
    let attempt = null;
    for (const s of slots) {
      const inH = st.hCuts.indexOf(s[1]) >= 0 && s[0] === 'h';
      const inV = st.vCuts.indexOf(s[1]) >= 0 && s[0] === 'v';
      if (!inH && !inV) { attempt = s; break; }
    }
    if (!attempt) continue;
    const histBefore = st.history.length;
    dragCut(attempt[0], attempt[1]);
    if (st.hCuts.length + st.vCuts.length !== st.maxCuts) throw new Error('budget exceed NOT rejected on L' + (li + 1) + ' (placeCut accepted cut ' + st.maxCuts + '+1)');
    if (st.history.length !== histBefore) throw new Error('rejected cut still pushed history');
    /* resetLevel clears */
    V.resetLevel();
    if (st.hCuts.length || st.vCuts.length || st.history.length) throw new Error('resetLevel did not clear');
    results.notes.push('L' + (li + 1) + ' negative: filled maxCuts=' + st.maxCuts + ' without solving (' + agree + ' engine-vs-independent checkSolved agreements), extra cut rejected, resetLevel clears');
    done = true;
  }
  if (!done) { results.fails.push('extra: no level admitted a budget-exceed negative'); results.fail++; results.failIdx.push('NEG'); }
  else extra++;

  /* L1: tap toggle-off an existing cut + undo + hint + real win after */
  V.startLevel(0); pumpFrames(6);
  const st = E();
  const lv0 = LEVELS[0];
  const cs = V.cellSize, ox = V.gridOffsetX, oy = V.gridOffsetY;
  dragCut('v', lv0.cols - 2 >= 1 ? (lv0.bestCuts.v[0] === lv0.cols - 2 ? 0 : lv0.cols - 2) : 0); // a v cut not in best (2x3: slots v0,v1)
  if (st.solved) throw new Error('L1 non-best v cut solved (unexpected)');
  const placedIdx = st.vCuts[0];
  tapAt(ox + (placedIdx + 1) * cs, oy + cs); // tap on the existing cut's gap -> toggle off
  if (st.vCuts.length !== 0) throw new Error('tap did not toggle off existing cut (vCuts=' + JSON.stringify(st.vCuts) + ')');
  if (st.history.length !== 2) throw new Error('history should have place+remove entries (got ' + st.history.length + ')');
  V.undoCut(); // undo the removal -> cut back? undo pops removal and re-places
  if (st.history.length !== 1) throw new Error('undoCut did not pop removal');
  V.undoCut(); // undo the placement
  if (st.vCuts.length !== 0 || st.history.length !== 0) throw new Error('undoCut did not restore empty');
  V.useHint(); // hint flashes a best cut, no crash
  if (!V.hintFlash.active) throw new Error('useHint did not flash a hint');
  pumpFrames(140); // 2000ms hint-glow timer etc.
  /* now actually win L1 via best cuts */
  for (const h of lv0.bestCuts.h) dragCut('h', h);
  for (const v of lv0.bestCuts.v) dragCut('v', v);
  if (!st.solved) throw new Error('L1 best cuts after undo/hint did not solve');
  pumpFrames(100);
  if (!getEl('win-modal').classList.contains('active')) throw new Error('L1 win modal missing after undo/hint path');
  extra++;
  results.notes.push('L1 extra: tap-toggle-off + undoCut x2 + useHint flash + best-cut win all OK');
} catch (e) { results.fail++; results.failIdx.push('EXTRA'); results.fails.push('extra: ' + String(e.message).slice(0, 150)); }
results.pass += extra;

const out = { pass: results.pass, fail: results.fail, total: results.pass + results.fail, failIdx: results.failIdx, verdict: results.fail === 0 ? 'PASS' : 'FAIL' };
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (30 levels: minCuts independently re-derived + bestCuts replayed via real drag input to engine checkSolved win + 3-star persistence; negatives: pre-final-cut no-win, budget-exceed reject, tap-off/undo/hint), verdict=' + out.verdict);
results.notes.forEach(n => console.log('  ' + n));
results.fails.slice(0, 12).forEach(f => console.log('  FAIL ' + f));
if (harnessErrors.length) console.log('harness errors: ' + JSON.stringify(harnessErrors.slice(0, 5)));
out.extra = { harnessErrors: harnessErrors.slice(0, 5), notes: results.notes.slice(0, 8), fails: results.fails.slice(0, 12) };
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
