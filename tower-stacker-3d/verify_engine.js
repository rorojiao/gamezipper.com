#!/usr/bin/env node
/* In-engine verifier for tower-stacker-3d — spec type B (skill/timing arcade, real input path).
 * Engine: crane oscillates ±140px at craneSpeed*55 px/s; tap canvas -> dropFloor(); landFloor()
 * grades overlap vs tower top: >=0.95 perfect (full width kept, combo/score), >=0.5 partial
 * (tower trimmed), else miss (top floor falls off; game over when tower empties).
 * Level complete at currentFloor >= target (setTimeout flips state to LEVELCOMPLETE; the next
 * render pass runs renderLevelComplete which awards stars: 3 when perfectThisLevel >= target).
 * Verification:
 *   1..30  every level startLevel()d, then a full playthrough driven ONLY by canvas
 *          pointerdown taps + the engine's own raf loop (pumped manually with controlled
 *          timestamps): tap when |craneX-topX| <= 2px (perfect window is 4px at width 80).
 *          Assert per level: levelComplete flag, state reaches LEVELCOMPLETE, all drops
 *          perfect (perfects===target, misses===0, towerFloors.length===target),
 *          save.stars[level]===3, highScores[level]>0 persisted.
 *   31     timing negative on a fresh level: tap only when crane is at the far end
 *          (|craneX|>120) -> miss -> tower stays empty -> gameOver flag + state GAMEOVER.
 *   32     daily challenge path: startDaily() played to completion (dailyCompleted stamped).
 *   33     save/reset path: save round-trips through localStorage; pause via Escape keydown.
 * Usage: node tower-stacker-3d/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'tower-stacker-3d';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const all = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = all.find(s => s.includes('function startLevel'));
if (!code) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['engine script not found'] })); process.exit(1); }
code += '\n;globalThis.__V={start:startLevel,daily:startDaily,gd:()=>gameData,st:()=>state,sv:()=>save,levels:()=>LEVELS};';

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], left: 0, top: 0, width: 800, height: 600, clientWidth: 800, clientHeight: 600,
    disabled: false, hidden: false, parentElement: null, parentNode: null, _l: null,
    classList: { _set: new Set(), add(...c) { c.forEach(x => this._set.add(x)); }, remove(...c) { c.forEach(x => this._set.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; }, contains(c) { return this._set.has(c); } },
    addEventListener(type, fn) { (this._l = this._l || {})[type] = (this._l[type] || []).concat(fn); },
    removeEventListener(type, fn) { if (this._l && this._l[type]) this._l[type] = this._l[type].filter(f => f !== fn); },
    fire(type, ev) { const l = (this._l && this._l[type]) || []; l.slice().forEach(f => f(ev)); return l.length; },
    dispatchEvent: () => false, setPointerCapture: () => {}, releasePointerCapture: () => {},
    appendChild: function (c) { c.parentElement = this; c.parentNode = this; this.children.push(c); return c; },
    removeChild: function (c) { this.children = this.children.filter(x => x !== c); return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 }),
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
/* manual raf pump */
const rafQ = [];
let now = 0;
const ctx = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Error, TypeError,
  Uint8Array, Uint32Array, Int32Array, Float32Array,
  alert: () => {}, prompt: () => '', confirm: () => true,
  setTimeout: f => { if (typeof f === 'function') f(); return 0; }, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: f => { rafQ.push(f); return rafQ.length; }, cancelAnimationFrame: () => {},
  performance: { now: () => now },
  addEventListener: () => {}, removeEventListener: () => {},
  devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720,
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
vm.createContext(ctx);
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); }
catch (e) { console.error('engine load error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', fails: ['load: ' + e.message] })); process.exit(1); }

const V = ctx.__V;
const gameCanvas = elsById.get('gc').children[0]; // created by init() via createElement('canvas')
function tap() { gameCanvas.fire('pointerdown', { clientX: 400, clientY: 300, preventDefault: () => {} }); }
function pump(dtSec, n) { for (let i = 0; i < n; i++) { now += dtSec * 1000; const q = rafQ.splice(0); q.forEach(f => f(now)); if (!rafQ.length) break; } }

const pass = []; const fail = [];
function check(name, fn) { try { const note = fn(); pass.push(name + (note ? ' — ' + note : '')); } catch (e) { fail.push(name + ': ' + String(e.message).slice(0, 180)); } }

/* play one level with perfect timing; returns {frames, taps} */
function playPerfect(levelIdx) {
  V.start(levelIdx);
  const gd = V.gd();
  if (V.st() !== 'PLAYING') throw new Error('state=' + V.st());
  let taps = 0, guard = 0;
  while (!gd.levelComplete && guard++ < 20000) {
    if (!gd.dropping) {
      const topX = gd.towerFloors.length ? gd.towerFloors[gd.towerFloors.length - 1].x : 0;
      if (Math.abs(gd.craneX - topX) <= 2) { tap(); taps++; pump(1 / 60, 1); continue; }
    }
    pump(1 / 240, 1);
  }
  if (!gd.levelComplete) throw new Error('not complete after guard');
  pump(1 / 60, 5); // let setTimeout flip state + render pass award stars
  return { taps, gd };
}

const LEVELS = V.levels();
for (let l = 1; l <= LEVELS.length; l++) {
  check('L' + l + ' (biome ' + LEVELS[l - 1].biome + ', target ' + LEVELS[l - 1].target + ')', () => {
    const r = playPerfect(l);
    const gd = r.gd;
    if (V.st() !== 'LEVELCOMPLETE') throw new Error('state=' + V.st());
    if (gd.misses !== 0) throw new Error(gd.misses + ' misses');
    if (gd.perfects !== gd.target) throw new Error('perfects=' + gd.perfects + '/' + gd.target);
    if (gd.towerFloors.length !== gd.target) throw new Error('floors=' + gd.towerFloors.length);
    const sv = V.sv();
    if (sv.stars[l] !== 3) throw new Error('stars=' + sv.stars[l]);
    if (!(sv.highScores[l] > 0)) throw new Error('highScore missing');
    return r.taps + ' taps, score ' + gd.score + ', 3 stars';
  });
}
/* 31: timing negative -> miss -> game over */
check('miss -> gameOver', () => {
  V.start(1);
  const gd = V.gd();
  let guard = 0;
  while (!gd.gameOver && guard++ < 60000) {
    if (!gd.dropping && Math.abs(gd.craneX) > 120) { tap(); pump(1 / 60, 1); continue; }
    pump(1 / 240, 1);
  }
  pump(1 / 60, 3);
  if (!gd.gameOver) throw new Error('gameOver flag not set');
  if (V.st() !== 'GAMEOVER') throw new Error('state=' + V.st());
  if (gd.towerFloors.length !== 0) throw new Error('tower not empty');
  return 'state GAMEOVER reached via real miss path';
});
/* 32: daily path */
check('daily challenge complete', () => {
  V.daily();
  const gd = V.gd();
  if (V.st() !== 'DAILY' && V.st() !== 'PLAYING') throw new Error('state=' + V.st());
  let guard = 0;
  while (!gd.levelComplete && guard++ < 20000) {
    if (!gd.dropping) {
      const topX = gd.towerFloors.length ? gd.towerFloors[gd.towerFloors.length - 1].x : 0;
      if (Math.abs(gd.craneX - topX) <= 2) { tap(); pump(1 / 60, 1); continue; }
    }
    pump(1 / 240, 1);
  }
  pump(1 / 60, 5);
  if (!gd.levelComplete) throw new Error('daily not complete');
  const today = new Date().toISOString().slice(0, 10);
  if (!V.sv().dailyCompleted.includes(today)) throw new Error('dailyCompleted missing ' + today);
  return 'target ' + gd.target + ', dailyCompleted stamped';
});
/* 33: save round-trip + pause */
check('save persist + pause', () => {
  const raw = storage._m['tower-stacker-3d-save'];
  if (!raw) throw new Error('no save');
  const parsed = JSON.parse(raw);
  if (Object.keys(parsed.stars).length < 30) throw new Error('stars saved=' + Object.keys(parsed.stars).length);
  V.start(5);
  const kd = (ctx.document._l && ctx.document._l.keydown) || [];
  if (!kd.length) throw new Error('no keydown handler registered');
  kd.forEach(f => f({ code: 'Escape', preventDefault: () => {} }));
  if (V.st() !== 'PAUSED') throw new Error('pause state=' + V.st());
  kd.forEach(f => f({ code: 'Escape', preventDefault: () => {} }));
  if (V.st() !== 'PLAYING') throw new Error('resume state=' + V.st());
  return '30 star records persisted; Escape pauses/resumes';
});

const out = { pass: pass.length, fail: fail.length, total: pass.length + fail.length, verdict: fail.length === 0 ? 'PASS' : 'FAIL' };
if (fail.length) out.fails = fail;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (30 levels all-perfect playthrough via canvas taps + engine raf pump; 3 stars/highScores persisted; miss->gameOver negative; daily complete; save + pause paths), verdict=' + out.verdict);
pass.forEach(p => console.log('  OK ' + p));
fail.forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
