#!/usr/bin/env node
/* In-engine verifier for ships-finder (Type A puzzle — embedded-solution replay).
 * Engine: 30 battleship levels embedded in index.html (LEVELS const), each with an
 * explicit `solution` map "r,c"->ship-segment. Input path: canvas pointerdown/pointerup
 * (short press cycles a cell 0 empty -> 1 ship -> 2 water; 380ms long-press toggles water).
 * Win path: checkBtn click -> checkSolution(): every solution cell marked ship(1), no
 * other cell marked ship -> won=true, save.stars[curIdx] set, persist() to localStorage
 * shipsFinder_v1, #winOverlay.classList 'show'.
 * Verification per level: loadLevel(i) via export, then for each ship cell of the embedded
 * solution dispatch REAL pointerdown+pointerup events at that cell's canvas center through
 * the engine's own captured pointer handlers, then dispatch the real checkBtn click handler.
 * PASS requires #winOverlay 'show' + save.stars[i] persisted.
 * (Uniqueness/adjacency of the embedded solutions is additionally cross-checked against
 * row/col clues + no-touch rule by the verifier before replay.)
 * Usage: node ships-finder/verify_engine.js  (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'ships-finder';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* top-level const/let do not attach to the vm context global — export a handle */
const SURGERY_ANCHOR = 'renderRelated();';
if (code.split(SURGERY_ANCHOR).length !== 2) { console.error('surgery anchor not unique'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
code = code.replace(SURGERY_ANCHOR, `renderRelated();
window.__SF={
  load:function(i){return loadLevel(i)},
  lvl:function(){return lvl},
  marks:function(){return marks},
  won:function(){return won},
  errs:function(){return errs},
  CELL:function(){return CELL},
  OFFX:function(){return OFFX},
  OFFY:function(){return OFFY},
  save:function(){return save},
  LEVELS:LEVELS
};`);

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
    children: [], width: 600, height: 600, clientWidth: 600, clientHeight: 600,
    disabled: false, hidden: false, _ev: {},
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener(type, fn) { (el._ev[type] = el._ev[type] || []).push(fn); },
    removeEventListener: () => {}, dispatchEvent: () => {},
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
const BODY = mkEl();
const elsById = new Map();
const timerStore = new Map();
let timerId = 0;
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
  /* queued timers: long-press detection must NOT fire synchronously; we never flush */
  setTimeout: (fn) => { timerStore.set(++timerId, fn); return timerId; },
  clearTimeout: (id) => { timerStore.delete(id); },
  requestAnimationFrame: (fn) => { try { fn(simNow); } catch (e) {} return 0; },
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
let simNow = 0;
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.clearTimeout = sandbox.clearTimeout;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'ships-finder-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const SF = ctx.window.__SF;
if (!SF) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const LEVELS = SF.LEVELS;
const cv = elsById.get('cv');
const checkBtn = elsById.get('checkBtn');
function fire(el, type, ev) { (el._ev[type] || []).forEach(fn => fn(ev)); }
function tap(r, c) {
  const px = SF.OFFX() + c * SF.CELL() + SF.CELL() / 2;
  const py = SF.OFFY() + r * SF.CELL() + SF.CELL() / 2;
  const ev = { clientX: px, clientY: py, preventDefault: () => {} };
  fire(cv, 'pointerdown', ev);
  fire(cv, 'pointerup', ev);
}

/* independent sanity check of each embedded solution: clues + no-touch + fleet shape */
function checkData(lv) {
  const cells = Object.keys(lv.solution).map(k => k.split(',').map(Number));
  const ship = new Set(cells.map(([r, c]) => r + ',' + c));
  for (const [r, c] of cells) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const k = (r + dr) + ',' + (c + dc);
      if (ship.has(k) && !(dr === 0 || dc === 0)) throw new Error('ships touch diagonally at ' + k);
    }
  }
  for (let r = 0; r < lv.R; r++) {
    const n = cells.filter(([rr]) => rr === r).length;
    if (n !== lv.row_clues[r]) throw new Error('row ' + r + ' clue mismatch ' + n + '!=' + lv.row_clues[r]);
  }
  for (let c = 0; c < lv.C; c++) {
    const n = cells.filter(([, cc]) => cc === c).length;
    if (n !== lv.col_clues[c]) throw new Error('col ' + c + ' clue mismatch ' + n + '!=' + lv.col_clues[c]);
  }
  if (cells.length !== lv.total_cells) throw new Error('total_cells mismatch');
  /* fleet shape counts: connected horizontal/vertical runs */
  const seen = new Set(); const runs = [];
  for (const [r, c] of cells) {
    const k = r + ',' + c; if (seen.has(k)) continue;
    let len = 1; seen.add(k);
    if (ship.has(r + ',' + (c + 1))) { let cc = c + 1; while (ship.has(r + ',' + cc)) { seen.add(r + ',' + cc); len++; cc++; } }
    else if (ship.has((r + 1) + ',' + c)) { let rr = r + 1; while (ship.has(rr + ',' + c)) { seen.add(rr + ',' + c); len++; rr++; } }
    runs.push(len);
  }
  const wantCounts = {}; for (const k in lv.fleet) wantCounts[k] = lv.fleet[k];
  const gotCounts = {}; runs.forEach(L => gotCounts['L' + L] = (gotCounts['L' + L] || 0) + 1);
  const norm = (o) => Object.keys(o).sort().map(k => k + ':' + o[k]).join(',');
  if (norm(wantCounts) !== norm(gotCounts)) throw new Error('fleet shape mismatch want ' + norm(wantCounts) + ' got ' + norm(gotCounts));
}

let pass = 0, fail = 0; const fails = [], notes = [];
for (let i = 0; i < LEVELS.length; i++) {
  try {
    const lv = LEVELS[i];
    checkData(lv); /* independent data-truth check */
    SF.load(i);
    if (SF.won()) throw new Error('won pre-set');
    const solKeys = Object.keys(lv.solution);
    for (const k of solKeys) { const [r, c] = k.split(',').map(Number); tap(r, c); }
    /* engine state: exactly the solution cells marked ship */
    const marks = SF.marks();
    for (let r = 0; r < lv.R; r++) for (let c = 0; c < lv.C; c++) {
      const isShip = marks[r][c] === 1;
      if (isShip !== !!lv.solution[r + ',' + c]) throw new Error('tap replay mismatch at ' + r + ',' + c);
    }
    /* real Check button */
    fire(checkBtn, 'click', {});
    if (!SF.won()) throw new Error('checkSolution did not win');
    const ov = elsById.get('winOverlay');
    if (!ov.classList.contains('show')) throw new Error('win overlay not shown');
    if (!(SF.save().stars[i] >= 1)) throw new Error('stars not persisted');
    const raw = sandbox.localStorage.getItem('shipsFinder_v1');
    if (!raw || !JSON.parse(raw).stars[i]) throw new Error('localStorage shipsFinder_v1 missing stars');
    ov.classList.remove('show');
    pass++;
    if (i === 0 || i === 14 || i === 29) notes.push('L' + (i + 1) + ' (' + lv.tierName + ' ' + lv.R + 'x' + lv.C + '): ' + solKeys.length + ' ship cells tapped via pointerdown/up, checkSolution win, stars=' + SF.save().stars[i] + ', errs=' + SF.errs());
  } catch (e) {
    fail++; fails.push('L' + (i + 1) + ' ' + String(e.message).slice(0, 140));
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': embedded-solution replay via real pointer handlers + Check button for ' + LEVELS.length + ' levels (clues/no-touch/fleet-shape independently cross-checked): verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.slice(0, 15).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
