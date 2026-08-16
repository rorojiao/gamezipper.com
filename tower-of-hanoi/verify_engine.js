#!/usr/bin/env node
/* In-engine verifier for tower-of-hanoi — spec type A (solver replay through real input path).
 * 27 levels: tiers 1-3 are 3-rod Hanoi (optimal 2^d-1), tiers 4-6 are 4-rod (Reve's puzzle,
 * 3-star threshold floor(2^d*0.7)). For every level:
 *   - solve with the correct solver (classic 3-rod recursion, or Frame-Stewart for 4 rods)
 *     and replay EVERY move through the engine's real canvas pointerdown handler
 *     (handlePointerDown: select rod -> drop rod), then assert checkWin fired:
 *     #win-overlay gets class 'active', #win-moves = move count, progress persisted
 *     to localStorage with stars[level]===3 (solver moves <= optimal for all 27 levels,
 *     proving the 3-star threshold is achievable, not just winnable).
 *   - advance via the real #next-level-btn click handler; also verify unlock progression
 *     (state.unlocked) through the saved progress.
 *   - negative: mid-solve board is not a win; illegal drop (bigger onto smaller) is rejected
 *     and leaves the board unchanged.
 * Usage: node tower-of-hanoi/verify_engine.js   (cwd anywhere; reads index.html next to it)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'tower-of-hanoi';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts[0];

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], left: 0, top: 0, width: 400, height: 400, clientWidth: 400, clientHeight: 400,
    disabled: false, hidden: false, parentElement: null, parentNode: null, _l: null,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener(type, fn) { (this._l = this._l || {})[type] = (this._l[type] || []).concat(fn); },
    removeEventListener(type, fn) { if (this._l && this._l[type]) this._l[type] = this._l[type].filter(f => f !== fn); },
    fire(type, ev) { const l = (this._l && this._l[type]) || []; l.slice().forEach(f => f(ev)); return l.length; },
    dispatchEvent: () => false, setPointerCapture: () => {}, releasePointerCapture: () => {},
    appendChild: function (c) { c.parentElement = this; c.parentNode = this; this.children.push(c); return c; },
    removeChild: function (c) { this.children = this.children.filter(x => x !== c); return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
    setAttribute: () => {}, getAttribute: () => '', focus: () => {}, blur: () => {}, click() { this.fire('click', { target: this }); },
    getContext: () => new Proxy({}, { get: (t, p) => (typeof p === 'string' ? (...a) => ({ addColorStop: () => {} }) : undefined), set: () => true }),
  };
  Object.assign(el, extra || {});
  return el;
}
const elsById = new Map();
const docEl = () => mkEl();
const BODY = mkEl({ tagName: 'BODY' });
const storage = (() => { const m = {}; return {
  getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; })();
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 42;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const ctx = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Error, TypeError,
  Uint8Array, Uint32Array, Int32Array, Float32Array,
  alert: () => {}, prompt: () => '', confirm: () => true,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  addEventListener: () => {}, removeEventListener: () => {},
  devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720,
  localStorage: storage,
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate: () => {} },
  document: {
    getElementById: id => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY })); return elsById.get(id); },
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: t => mkEl({ tagName: t }), createTextNode: t => ({ textContent: t }),
    body: BODY, head: docEl(), documentElement: docEl(),
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);

let failed = false;
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); }
catch (e) { console.error('engine load error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['load: ' + e.message] })); process.exit(1); }

const canvas = elsById.get('game-canvas');
if (!canvas) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['game-canvas never requested'] })); process.exit(1); }
const D = {
  clickBtn: id => elsById.get(id).fire('click', { target: elsById.get(id) }),
};
function rodX(rods, i) { const sp = 400 / (rods + 1); return sp * (i + 1); }
function tapRod(rods, i) { return canvas.fire('pointerdown', { clientX: rodX(rods, i), clientY: 300, preventDefault: () => {} }); }

/* solvers */
function hanoi3(n, from, to, via, out) { if (n === 0) return; hanoi3(n - 1, from, via, to, out); out.push([from, to]); hanoi3(n - 1, via, to, from, out); }
const fsMemo = new Map();
function fsMoves(n, from, to, a, b, out) {
  // Frame-Stewart for 4 rods; k split known optimal for n<=6
  if (n === 0) return;
  if (n === 1) { out.push([from, to]); return; }
  const ks = { 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3 };
  const k = ks[n] !== undefined ? ks[n] : Math.floor(n / 2);
  fsMoves(k, from, a, to, b, out);        // k smallest: from -> spare A (4 rods)
  hanoi3(n - k, from, to, b, out);        // n-k largest: from -> to (3 rods, B as via)
  fsMoves(k, a, to, from, b, out);        // k smallest: spare A -> to (4 rods)
}

const pass = []; const fail = [];
function check(name, fn) {
  try { const note = fn(); pass.push(name + (note ? ' — ' + note : '')); }
  catch (e) { fail.push(name + ': ' + String(e.message).slice(0, 160)); }
}

const RODS_BY_TIER = { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4 };
const DISKS = [3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6];
const LEVELS = []; { let idx = 0; for (let t = 1; t <= 6; t++) for (let i = 0; i < (t <= 4 ? 5 : t === 5 ? 4 : 3); i++) LEVELS.push({ tier: t, disks: DISKS[idx], rods: RODS_BY_TIER[t] }), idx++; }

let notes = [];
for (let lvl = 1; lvl <= LEVELS.length; lvl++) {
  const L = LEVELS[lvl - 1];
  check('L' + lvl + ' (t' + L.tier + ', ' + L.disks + 'd/' + L.rods + 'r)', () => {
    if (lvl > 1) D.clickBtn('next-level-btn');
    if (Number(elsById.get('level-display').textContent) !== lvl) throw new Error('level-display=' + elsById.get('level-display').textContent);
    if (Number(elsById.get('optimal').textContent) < 1) throw new Error('bad optimal');
    // negative: fresh board is not a win
    if (elsById.get('win-overlay').classList.contains('active')) throw new Error('win shown before any move');
    // one legal move (rod0->rod2 for 3 rods, rod0->rod1 for 4) then no win
    const moves = [];
    if (L.rods === 3) hanoi3(L.disks, 0, 2, 1, moves); else fsMoves(L.disks, 0, L.rods - 1, 1, 2, moves);
    const optimal = Number(elsById.get('optimal').textContent);
    if (moves.length > optimal) throw new Error('solver ' + moves.length + ' > optimal ' + optimal + ' (3-star unreachable)');
    tapRod(L.rods, moves[0][0]); tapRod(L.rods, moves[0][1]);
    if (elsById.get('win-overlay').classList.contains('active')) throw new Error('win after 1 move');
    // illegal drop: put bigger onto smaller (undo our first move target first is complex) —
    // simpler: try rod0->rod1 where rod1 top is smaller than any movable disk => engine must reject.
    // After move[0] (rod0->last for 3-rod: disk1 moved), attempt rod0(top=disk2) -> rod(top=disk1):
    tapRod(L.rods, 0); tapRod(L.rods, moves[0][1]);
    // that drop IS legal (2>... wait disk2 onto disk1 is illegal). disk numbers: smaller number = smaller disk.
    // rod0 top after moving disk1 away is disk2; target top is disk1; disk2 > disk1 => illegal => moves stays 1.
    if (Number(elsById.get('moves').textContent) !== 1) throw new Error('illegal drop accepted (moves=' + elsById.get('moves').textContent + ')');
    for (let i = 1; i < moves.length; i++) { tapRod(L.rods, moves[i][0]); tapRod(L.rods, moves[i][1]); }
    if (Number(elsById.get('moves').textContent) !== moves.length) throw new Error('moves=' + elsById.get('moves').textContent + ' expected ' + moves.length);
    if (!elsById.get('win-overlay').classList.contains('active')) throw new Error('no win after full solution (' + moves.length + ' moves)');
    if (Number(elsById.get('win-moves').textContent) !== moves.length) throw new Error('win-moves mismatch');
    const save = JSON.parse(storage._m['tower-of-hanoi']);
    if (save.stars[String(lvl)] !== 3) throw new Error('stars=' + save.stars[String(lvl)] + ' (expected 3, solver ' + moves.length + ' <= optimal ' + optimal + ')');
    if (save.bestMoves[String(lvl)] !== moves.length) throw new Error('bestMoves not recorded');
    const expectUnlocked = Math.min(lvl + 1, LEVELS.length);
    if (save.unlocked !== expectUnlocked) throw new Error('unlocked=' + save.unlocked + ' expected ' + expectUnlocked);
    return moves.length + ' moves (optimal ' + optimal + '), 3 stars, win + save OK';
  });
  elsById.get('win-overlay').classList.remove('active');
}
/* reset path: mid-level reset restores start state */
check('reset mid-level', () => {
  D.clickBtn('reset-btn');
  if (Number(elsById.get('level-display').textContent) !== LEVELS.length) throw new Error('reset changed level');
  if (Number(elsById.get('moves').textContent) !== 0) throw new Error('reset did not zero moves');
  return 'level ' + LEVELS.length + ' board cleared';
});

const out = { pass: pass.length, fail: fail.length, total: pass.length + fail.length, verdict: fail.length === 0 ? 'PASS' : 'FAIL' };
if (fail.length) out.fails = fail;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (27 levels solved via 3-rod/Frame-Stewart solver, every move replayed through canvas pointerdown; 3 stars + bestMoves + unlock progression persisted; illegal-drop negative; reset path), verdict=' + out.verdict);
pass.forEach(p => console.log('  OK ' + p));
fail.forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
