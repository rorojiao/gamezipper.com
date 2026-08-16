#!/usr/bin/env node
/* soliten in-engine verifier — spec v3, type A (constructed-solution replay).
 * index.html inline game script (IIFE + 'use strict') loaded into vm sandbox; accessor
 * injected before the IIFE close (spec-approved anchor surgery) for let/const bindings.
 * Win rule (engine's own clearSelectedCards/checkWin): select cards until their sum is
 * EXACTLY 10 -> auto-clear (sum>10 deselects, combo lost); level complete when every
 * card cleared (all sums are 10, so a full clear requires the multiset to partition
 * into 10-summing groups). An INDEPENDENT backtracking partitioner (over value counts)
 * derives a group partition per level; every group is played through the engine's REAL
 * input path: canvas pointerdown at each card's center -> auto-check -> engine
 * clearSelectedCards (500ms timer) -> checkWin (600ms timer) -> showLevelComplete:
 * gameState==='complete', complete-overlay active, stars + bestScores persisted to
 * localStorage 'soliten_save'. Extra: over-10 selection rejected (deselect, nothing
 * cleared), partial selection state, undo restore, hint, no-moves finder sanity.
 * Usage: node soliten/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'soliten';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const gi = blocks.findIndex(b => b.includes('const LEVELS'));
if (gi < 0) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', extra: { error: 'game script block not found' } })); process.exit(1); }
const gb = blocks[gi];
const anchor = gb.lastIndexOf('})();');
blocks[gi] = gb.slice(0, anchor) + `
;globalThis.__V={
  LEVELS:LEVELS,
  get cards(){return cards}, get selectedCards(){return selectedCards},
  get gameState(){return gameState}, get currentLevel(){return currentLevel},
  get moves(){return moves}, get score(){return score}, get save(){return save},
  get hints(){return hints}, get animating(){return animating},
  startLevel:startLevel, setupLevel:setupLevel, findAnyCombo:findAnyCombo,
  doHint:doHint, doUndo:doUndo,
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
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 1000, right: 800, bottom: 1000 }),
    setAttribute() {}, getAttribute: () => null, focus() {}, blur() {}, click() {},
    getContext: () => CTX2D,
    offsetHeight: 0, offsetWidth: 0, clientWidth: 0, clientHeight: 0,
    width: 800, height: 1000, disabled: false,
  };
  el._listeners = listeners;
  return el;
}
const elsById = new Map();
const getEl = (id) => { if (!elsById.has(id)) elsById.set(id, mkEl(id)); return elsById.get(id); };
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
    getElementById: getEl, querySelector: () => mkEl(), querySelectorAll: () => [],
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
  innerWidth: 800, innerHeight: 1000, devicePixelRatio: 1, scrollX: 0, scrollY: 0, scrollTo() {},
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

/* ---- independent partitioner: split value multiset into 10-summing groups ---- */
function partition10(values) {
  const total = values.reduce((a, b) => a + b, 0);
  if (total % 10 !== 0) return { error: 'total sum ' + total + ' not divisible by 10' };
  const cnt = Array(10).fill(0);
  values.forEach(v => cnt[v]++);
  const groups = [];
  const solve = () => {
    let first = -1;
    for (let v = 1; v <= 9; v++) if (cnt[v] > 0) { first = v; break; }
    if (first === -1) return true; // all used
    // enumerate subsets containing `first` that sum to exactly 10 (as count tuples)
    const pick = [];
    const enumerate = (v, remaining) => {
      if (v > 9) {
        if (remaining !== 0) return;
        // apply
        for (let i = 1; i <= 9; i++) cnt[i] -= pick[i] || 0;
        groups.push(pick.slice());
        if (solve()) return true;
        groups.pop();
        for (let i = 1; i <= 9; i++) cnt[i] += pick[i] || 0;
        return;
      }
      const maxK = Math.min(cnt[v], Math.floor(remaining / v));
      for (let k = 0; k <= maxK; k++) {
        pick[v] = k;
        if (enumerate(v + 1, remaining - v * k)) return true;
        pick[v] = 0;
      }
      pick[v] = 0;
      return false;
    };
    return enumerate(1, 10);
  };
  if (!solve()) return { error: 'no partition into 10-sums exists' };
  return { groups };
}

/* click a card through the engine's real canvas pointerdown handler */
function clickCard(c) {
  getEl('gameCanvas').dispatch('pointerdown', { clientX: c.x + c.w / 2, clientY: c.y + c.h / 2, pointerId: 1, button: 0 });
}

const results = { pass: 0, fail: 0, failIdx: [], fails: [], notes: [] };
const T0 = Date.now();
const LEVELS = V.LEVELS;

/* ---- extra pass on L1 first (also seeds past the tutorial): negatives + undo + win ---- */
let extra = 0;
try {
  V.startLevel(0);
  pumpFrames(10);
  const st = () => V;
  if (V.gameState !== 'playing') throw new Error('not playing after startLevel');
  const cards0 = V.cards.slice();
  /* negative: over-10 selection (9+8 on L1: [1,9,2,8,...]) */
  const c9 = cards0.find(c => c.value === 9), c8 = cards0.find(c => c.value === 8 && c !== c9);
  clickCard(c9); clickCard(c8); // sum 17 -> invalid branch
  pumpFrames(10);
  if (V.selectedCards.length !== 0) throw new Error('over-10 selection not deselected');
  if (V.cards.some(c => c.cleared)) throw new Error('over-10 selection cleared something');
  /* partial selection persists then deselect on re-tap */
  const c2 = cards0.find(c => c.value === 2);
  clickCard(c2);
  if (V.selectedCards.length !== 1) throw new Error('partial select failed');
  clickCard(c2);
  if (V.selectedCards.length !== 0) throw new Error('re-tap deselect failed');
  /* hint */
  const hintsBefore = V.hints;
  V.doHint();
  if (V.hints !== hintsBefore - 1) throw new Error('doHint did not consume a hint');
  /* clear one group then undo restores */
  const c1 = cards0.find(c => c.value === 1 && !c.selected);
  clickCard(c1); clickCard(c9);
  pumpFrames(45); // 500ms clear timer
  const liveCards = () => V.cards.filter(c => !c.cleared && !c.clearing); // engine's own remaining predicate (checkWin/checkNoMoves)
  if (liveCards().length !== cards0.length - 2) throw new Error('group not cleared (live=' + liveCards().length + ')');
  const movesAfter = V.moves;
  V.doUndo();
  if (liveCards().length !== cards0.length) throw new Error('undo did not restore cards');
  if (V.moves !== movesAfter - 1) throw new Error('undo did not decrement moves');
  /* now finish L1 fully */
  const part = partition10(LEVELS[0].cards);
  if (part.error) throw new Error(part.error);
  const pool = V.cards.slice();
  for (const g of part.groups) {
    const vals = [];
    for (let v = 1; v <= 9; v++) for (let k = 0; k < (g[v] || 0); k++) vals.push(v);
    for (const val of vals) {
      const card = pool.find(p => p.value === val && !p.cleared && !p.clearing);
      if (!card) throw new Error('pool exhausted mid-group');
      pool.splice(pool.indexOf(card), 1);
      clickCard(card);
    }
    pumpFrames(45); // 500ms removal timer + checkWin scheduling
  }
  pumpFrames(60); // 600ms showLevelComplete
  if (V.gameState !== 'complete') throw new Error('L1 not complete after full partition replay');
  if (!getEl('complete-overlay').classList.contains('active')) throw new Error('complete overlay not shown');
  const saved = JSON.parse(sandbox.localStorage.getItem('soliten_save') || '{}');
  if (!saved.levelStars || !saved.levelStars['1']) throw new Error('L1 stars not persisted');
  extra++;
  results.notes.push('L1 extra: over-10 reject + partial/deselect + hint + undo-restore + full win, stars=' + saved.levelStars['1']);
} catch (e) { results.fail++; results.failIdx.push('EXTRA'); results.fails.push('extra: ' + String(e.message).slice(0, 150)); }
results.pass += extra;

/* ---- main: all 30 levels, full partition replay to engine win ---- */
for (let i = 0; i < LEVELS.length; i++) {
  try {
    if (Date.now() - T0 > 100000) throw new Error('global time cap');
    const lv = LEVELS[i];
    const part = partition10(lv.cards);
    if (part.error) throw new Error(part.error + ' (unsolvable level data)');
    const expectedGroups = lv.cards.reduce((a, b) => a + b, 0) / 10;
    if (part.groups.length !== expectedGroups) throw new Error('partition size mismatch');

    getEl('complete-overlay').classList.remove('active'); // mirror next-level UI flow
    V.startLevel(i);
    pumpFrames(10);
    if (V.cards.length !== lv.cards.length) throw new Error('setupLevel card count wrong');

    const pool = V.cards.slice();
    let groups = 0;
    for (const g of part.groups) {
      const vals = [];
      for (let v = 1; v <= 9; v++) for (let k = 0; k < (g[v] || 0); k++) vals.push(v);
      for (const val of vals) {
        const card = pool.find(p => p.value === val && !p.cleared && !p.clearing);
        if (!card) throw new Error('no remaining card with value ' + val);
        pool.splice(pool.indexOf(card), 1);
        clickCard(card);
      }
      groups++;
      pumpFrames(45);
      if (V.animating) pumpFrames(45);
    }
    pumpFrames(60); // 600ms showLevelComplete after last checkWin
  if (V.gameState !== 'complete') throw new Error('gameState=' + V.gameState + ' after full replay (' + groups + ' groups)');
  const liveLeft = V.cards.filter(c => !c.cleared && !c.clearing).length;
  if (liveLeft !== 0) throw new Error('cards still in play: ' + liveLeft);
    if (!getEl('complete-overlay').classList.contains('active')) throw new Error('complete overlay not shown');
    const saved = JSON.parse(sandbox.localStorage.getItem('soliten_save') || '{}');
    const stars = saved.levelStars && saved.levelStars['' + (i + 1)];
    if (!stars) throw new Error('stars not persisted');
    const expStars = V.moves <= lv.par ? 3 : (V.moves <= lv.par + 2 ? 2 : 1);
    if (stars < expStars) throw new Error('stars=' + stars + ' below engine-formula expectation ' + expStars + ' (moves=' + V.moves + ' par=' + lv.par + ')');
    results.pass++;
    if (i === 0 || i === 14 || i === 29) results.notes.push('L' + (i + 1) + ': partition ' + part.groups.length + ' groups replayed via card clicks -> complete, moves=' + V.moves + '/par ' + lv.par + ', stars=' + stars);
  } catch (e) {
    results.fail++; results.failIdx.push(i + 1); results.fails.push('L' + (i + 1) + ': ' + String(e.message).slice(0, 150));
  }
}
const out = { pass: results.pass, fail: results.fail, total: results.pass + results.fail, failIdx: results.failIdx, verdict: results.fail === 0 ? 'PASS' : 'FAIL' };
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (30 levels: independent 10-sum partition replayed through real card-click path to engine clearSelectedCards/checkWin complete + star persistence; extra: over-10 reject, deselect, hint, undo), verdict=' + out.verdict);
results.notes.forEach(n => console.log('  ' + n));
results.fails.slice(0, 12).forEach(f => console.log('  FAIL ' + f));
if (harnessErrors.length) console.log('harness errors: ' + JSON.stringify(harnessErrors.slice(0, 5)));
out.extra = { harnessErrors: harnessErrors.slice(0, 5), notes: results.notes.slice(0, 8), fails: results.fails.slice(0, 12) };
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
