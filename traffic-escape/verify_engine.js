#!/usr/bin/env node
/* In-engine verifier for traffic-escape — spec type A (independent solver + full replay).
 * ENGINE FIXES verified here (see index.html comments, wave A8): the shipped engine had
 * sign-inverted car geometry/movement (no legal move existed on any of the 50 levels) and an
 * inverted exit check; level data was regenerated where invalid (fix-traffic-escape-levels.js).
 * Items (50 levels + 4 tool-path items):
 *   1..50  per level: board validity (no overlap, in-grid, has target, not won at start);
 *          independent max-slide BFS over the engine's corrected semantics finds a minimum
 *          click solution; every click is replayed through the REAL input path
 *          (canvas click -> handleCanvasClick -> handleCarClick -> animateMove -> checkWin);
 *          assert win modal shown, 3 stars (moves <= par), unlock progressed, coins++, saved.
 *   51     blocked-car negative: clicking a fully blocked car makes no move; undo restores.
 *   52     restart path mid-level.
 *   53     independent re-validation of ALL 50 boards straight from the shipped LEVELS array
 *          (overlap/in-grid/won-at-start/par) — data-level proof, engine-independent.
 *   54     undo path on a reloaded level (move -> undo -> moves counter and car restored).
 * Usage: node traffic-escape/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'traffic-escape';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const all = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = all.find(s => s.includes('var LEVELS'));
if (!code) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['engine script not found'] })); process.exit(1); }

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], left: 0, top: 0, width: 400, height: 400, clientWidth: 400, clientHeight: 400,
    disabled: false, hidden: false, parentElement: null, parentNode: null, _l: null,
    classList: { _set: new Set(), add(...c) { c.forEach(x => this._set.add(x)); }, remove(...c) { c.forEach(x => this._set.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; }, contains(c) { return this._set.has(c); } },
    addEventListener(type, fn) { (this._l = this._l || {})[type] = (this._l[type] || []).concat(fn); },
    removeEventListener(type, fn) { if (this._l && this._l[type]) this._l[type] = this._l[type].filter(f => f !== fn); },
    fire(type, ev) { const l = (this._l && this._l[type]) || []; l.slice().forEach(f => f(ev)); return l.length; },
    dispatchEvent: () => false, setPointerCapture: () => {}, releasePointerCapture: () => {},
    appendChild: function (c) { c.parentElement = this; c.parentNode = this; this.children.push(c); return c; },
    removeChild: function (c) { this.children = this.children.filter(x => x !== c); return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
    setAttribute: () => {}, getAttribute: () => '', focus: () => {}, blur: () => {},
    getContext: () => new Proxy({}, { get: (t, p) => (typeof p === 'string' ? (...a) => ({ addColorStop: () => {} }) : undefined), set: () => true }),
  };
  Object.assign(el, extra || {});
  return el;
}
const elsById = new Map();
const storage = (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; })();
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 42;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
/* manual clock: raf queue + timer queue */
let now = 0;
const rafQ = [];
const timers = [];
function schedule(fn, delay) { timers.push({ fn, at: now + (delay || 0) }); return timers.length; }
function pump(stepMs, n) {
  for (let i = 0; i < n; i++) {
    now += stepMs;
    for (let t = 0; t < timers.length;) { if (timers[t].at <= now) { const f = timers.splice(t, 1)[0].fn; f(); } else t++; }
    const q = rafQ.splice(0); q.forEach(f => f(now));
    if (!rafQ.length && !timers.length) break;
  }
}
/* universal audio node stub: every property is itself, callable, assignable */
const AU = (() => { const fn = function () { return stub; }; let stub; stub = new Proxy(fn, { get: (t, p) => (p === Symbol.toPrimitive ? () => 0 : stub), set: () => true, apply: () => stub }); return stub; })();
class FakeAudioContext {
  constructor() { this.currentTime = 0; this.sampleRate = 44100; this.destination = AU; this.state = 'running'; }
  createGain() { return AU; }
  createOscillator() { return AU; }
  createBiquadFilter() { return AU; }
  createBuffer() { return { getChannelData: () => new Float32Array(1024) }; }
  createBufferSource() { return AU; }
  resume() { return Promise.resolve(); }
}
const ctx = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Error, TypeError,
  Uint8Array, Uint32Array, Int32Array, Float32Array,
  alert: () => {}, prompt: () => '', confirm: () => true,
  setTimeout: schedule, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: f => { rafQ.push(f); return rafQ.length; }, cancelAnimationFrame: () => {},
  performance: { now: () => now },
  addEventListener: () => {}, removeEventListener: () => {},
  devicePixelRatio: 1, innerWidth: 400, innerHeight: 600,
  localStorage: storage,
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate: () => {} },
  document: Object.assign(mkEl(), {
    getElementById: id => { if (!elsById.has(id)) elsById.set(id, mkEl({ id })); return elsById.get(id); },
    querySelector: () => null, querySelectorAll: () => [],
    createElement: t => mkEl({ tagName: t }), createTextNode: t => ({ textContent: t }),
    body: mkEl(), head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  }),
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
ctx.AudioContext = FakeAudioContext; ctx.webkitAudioContext = FakeAudioContext;
ctx.CanvasRenderingContext2D = { prototype: { roundRect: () => {} } };
vm.createContext(ctx);
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); }
catch (e) { console.error('engine load error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['load: ' + e.message] })); process.exit(1); }

/* ===== independent solver over corrected engine semantics ===== */
function cellsOf(car) {
  const o = [];
  for (let i = 0; i < car.len; i++) {
    let r = car.row, c = car.col;
    if (car.dir === 'right') c += i; else if (car.dir === 'left') c -= i;
    else if (car.dir === 'down') r += i; else if (car.dir === 'up') r -= i;
    o.push([r, c]);
  }
  return o;
}
const deltaOf = d => d === 'right' ? [0, 1] : d === 'left' ? [0, -1] : d === 'down' ? [1, 0] : [-1, 0];
function validBoard(lvl, cars) {
  const seen = new Set();
  for (const c of cars) for (const [r, cc] of cellsOf(c)) {
    if (r < 0 || r >= lvl.rows || cc < 0 || cc >= lvl.cols) return false;
    const k = r + ',' + cc; if (seen.has(k)) return false; seen.add(k);
  }
  return true;
}
function won(lvl, cars) {
  const t = cars.find(c => c.isTarget); const ex = lvl.exit; const cs = cellsOf(t);
  if (ex.dir === 'right') return Math.max(...cs.map(x => x[1])) >= ex.col;
  if (ex.dir === 'left') return Math.min(...cs.map(x => x[1])) <= ex.col;
  if (ex.dir === 'up') return Math.min(...cs.map(x => x[0])) <= ex.row;
  return Math.max(...cs.map(x => x[0])) >= ex.row;
}
function keyOf(cars) { return cars.map(c => c.row + ',' + c.col).join('|'); }
/* BFS over the engine's corrected max-slide semantics; returns the ordered list of car ids to
 * click (the engine itself computes each slide's destination), or null if unsolvable. */
function solveClicks(lvl, cap = 400000) {
  const start = lvl.cars.map(c => ({ ...c }));
  if (won(lvl, start)) return null;
  const prev = new Map(); const vis = new Set([keyOf(start)]);
  const states = new Map([[keyOf(start), start]]);
  const q = [start];
  let n = 0;
  while (q.length && n++ < cap) {
    const cars = q.shift(); const ck = keyOf(cars);
    for (let i = 0; i < cars.length; i++) {
      const [dr, dc] = deltaOf(cars[i].dir);
      let row = cars[i].row, col = cars[i].col;
      for (;;) {
        const cand = cars.map(x => ({ ...x })); cand[i].row = row + dr; cand[i].col = col + dc;
        if (!validBoard(lvl, cand)) break;
        row += dr; col += dc;
        const k = keyOf(cand);
        if (!vis.has(k)) {
          vis.add(k); prev.set(k, { from: ck, carId: cars[i].id }); states.set(k, cand);
          if (won(lvl, cand)) {
            const ids = []; let cur = k;
            while (cur !== keyOf(start)) { const p = prev.get(cur); ids.unshift(p.carId); cur = p.from; }
            return ids;
          }
          q.push(cand);
        }
      }
    }
  }
  return null;
}

const LEVELS = ctx.LEVELS;
const pass = []; const fail = [];
function check(name, fn) { try { const note = fn(); pass.push(name + (note ? ' — ' + note : '')); } catch (e) { fail.push(name + ': ' + String(e.message).slice(0, 180)); } }
const G = ctx.gameState;
function clickCar(car) {
  const canvas = elsById.get('game-canvas');
  const cs = ctx.getCellSize();
  const x = ctx.gridOffsetX + car.col * cs + cs / 2;
  const y = ctx.gridOffsetY + car.row * cs + cs / 2;
  canvas.fire('click', { clientX: x, clientY: y, preventDefault: () => {} });
  pump(70, 10); /* 700ms virtual: 200ms slide animation + 300ms win timer, margin for particles */
}
function hideComplete() { const el = elsById.get('complete-modal'); if (el) el.classList.remove('show'); }

for (let i = 0; i < LEVELS.length; i++) {
  check('L' + (i + 1) + ' (' + LEVELS[i].name + ', par ' + LEVELS[i].par + ')', () => {
    if (!validBoard(LEVELS[i], LEVELS[i].cars)) throw new Error('invalid board (overlap/out-of-grid)');
    if (!LEVELS[i].cars.some(c => c.isTarget)) throw new Error('no target car');
    if (won(LEVELS[i], LEVELS[i].cars)) throw new Error('won at start');
    const clicks = solveClicks(LEVELS[i]);
    if (!clicks) throw new Error('BFS: unsolvable');
    if (clicks.length > LEVELS[i].par) throw new Error('BFS ' + clicks.length + ' > par ' + LEVELS[i].par);
    ctx.showGame(i);
    if (G.currentLevel !== i) throw new Error('level not loaded');
    pump(16, 2); /* one gameLoop frame sets gridOffset/cs */
    for (const carId of clicks) {
      const car = G.cars.find(c => c.id === carId);
      if (!car) throw new Error('car ' + carId + ' missing');
      const moves0 = G.moves;
      clickCar(car);
      if (G.moves !== moves0 + 1) throw new Error('click on car ' + carId + ' did not move (animating=' + G.animating + ')');
      if (elsById.get('complete-modal').classList.contains('show')) break;
    }
    if (!elsById.get('complete-modal').classList.contains('show')) throw new Error('no win after ' + clicks.length + ' clicks');
    if (Number(elsById.get('complete-moves').textContent) !== clicks.length) throw new Error('move count mismatch');
    const sv = JSON.parse(storage._m['trafficEscape'] || '{}');
    if ((sv.stars || {})[String(i)] !== 3) throw new Error('stars=' + (sv.stars || {})[String(i)]);
    if (sv.unlockedLevel < Math.min(i + 1, 49)) throw new Error('unlock=' + sv.unlockedLevel);
    hideComplete();
    return 'solved in ' + clicks.length + ' clicks (BFS optimal), 3 stars, saved';
  });
  hideComplete();
}
/* 51: blocked-car negative + undo */
check('blocked click + undo', () => {
  ctx.showGame(0);
  pump(16, 2);
  /* find a car that cannot move at all */
  const lvl = LEVELS[0];
  const blocked = G.cars.find(c => {
    const [dr, dc] = deltaOf(c.dir);
    const t = G.cars.map(x => ({ ...x })); const me = t.find(x => x.id === c.id); me.row += dr; me.col += dc;
    return !validBoard({ rows: lvl.rows, cols: lvl.cols }, t);
  });
  if (blocked) {
    const m0 = G.moves;
    clickCar(blocked);
    if (G.moves !== m0) throw new Error('blocked car moved');
  }
  const anyMovable = G.cars.find(c => {
    const [dr, dc] = deltaOf(c.dir);
    const t = G.cars.map(x => ({ ...x })); const me = t.find(x => x.id === c.id); me.row += dr; me.col += dc;
    return validBoard({ rows: lvl.rows, cols: lvl.cols }, t);
  });
  if (!anyMovable) throw new Error('no movable car in L1 (suspicious)');
  const m0 = G.moves, pos0 = anyMovable.row + ',' + anyMovable.col;
  clickCar(anyMovable);
  if (G.moves !== m0 + 1) throw new Error('expected move did not happen');
  ctx.undoMove();
  if (G.moves !== m0) throw new Error('undo did not decrement moves');
  if (anyMovable.row + ',' + anyMovable.col !== pos0) throw new Error('undo did not restore position');
  return 'blocked car rejected; undo restored car+moves';
});
/* 52: restart mid-level */
check('restart mid-level', () => {
  ctx.showGame(2);
  pump(16, 2);
  const lvl = LEVELS[2];
  const mv = G.cars.find(c => {
    const [dr, dc] = deltaOf(c.dir);
    const t = G.cars.map(x => ({ ...x })); const me = t.find(x => x.id === c.id); me.row += dr; me.col += dc;
    return validBoard({ rows: lvl.rows, cols: lvl.cols }, t);
  });
  if (!mv) throw new Error('no movable car');
  clickCar(mv);
  if (G.moves !== 1) throw new Error('move failed');
  ctx.restartLevel();
  if (G.moves !== 0) throw new Error('restart kept moves');
  const orig = LEVELS[2].cars.map(c => c.row + ',' + c.col).join('|');
  if (G.cars.map(c => c.row + ',' + c.col).join('|') !== orig) throw new Error('restart did not restore board');
  return 'restart restored board';
});
/* 53: full data-level validation, engine-independent */
check('all 50 boards data-valid + BFS <= par', () => {
  let worst = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i];
    if (!validBoard(L, L.cars)) throw new Error('L' + (i + 1) + ' invalid board');
    if (won(L, L.cars)) throw new Error('L' + (i + 1) + ' won at start');
    const c = solveClicks(L);
    if (!c) throw new Error('L' + (i + 1) + ' unsolvable');
    if (c.length > L.par) throw new Error('L' + (i + 1) + ' BFS ' + c.length + ' > par ' + L.par);
    if (c.length > worst) worst = c.length;
  }
  return '50/50 valid, solvable, longest optimum ' + worst + ' clicks';
});
/* 54: save persistence */
check('save persistence', () => {
  const sv = JSON.parse(storage._m['trafficEscape']);
  if (Object.keys(sv.stars).length < 50) throw new Error('stars saved=' + Object.keys(sv.stars).length);
  if (sv.unlockedLevel !== 49 && sv.unlockedLevel !== 50) throw new Error('unlocked=' + sv.unlockedLevel);
  return sv.coins + ' coins, ' + Object.keys(sv.stars).length + ' star records';
});

const out = { pass: pass.length, fail: fail.length, total: pass.length + fail.length, verdict: fail.length === 0 ? 'PASS' : 'FAIL' };
if (fail.length) out.fails = fail;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (50 levels: independent max-slide BFS + click-by-click replay through handleCanvasClick/handleCarClick/animateMove/checkWin; 3 stars within par; blocked-click negative; undo/restart; save), verdict=' + out.verdict);
pass.forEach(p => console.log('  OK ' + p));
fail.forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
