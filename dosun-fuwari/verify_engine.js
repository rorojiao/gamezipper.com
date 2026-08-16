#!/usr/bin/env node
/* dosun-fuwari in-engine verifier (wave-A3). 42 main levels + 6 daily pool, each with an
 * embedded solution (cell -> 1 balloon / 2 iron). Per level the embedded solution is
 * INDEPENDENTLY validated against full Dosun-Fuwari rules (regions partition all
 * non-wall cells; every region exactly 1 balloon + 1 iron; a balloon needs
 * edge/wall/balloon directly above, an iron needs edge/wall/iron directly below), then
 * PLAYED through the engine's real input path: pointerdown events on the canvas board
 * (pointerToCell -> cycleCell 0->1->2). PASS requires the engine's own isComplete to
 * accept the final board (onWin -> overlayWin shown) and, for main levels,
 * save.progress[tier-n] persisted to localStorage dosun_fuwari_save_v1.
 * Also exercises the engine's playDaily() date-driven flow.
 * Usage: node dosun-fuwari/verify_engine.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'dosun-fuwari';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

function mkEl(id, extra) {
  const listeners = {};
  const el = {
    id: id || '', textContent: '', innerHTML: '', value: '', disabled: false, hidden: false,
    style: { setProperty() {} }, dataset: {}, className: '', onclick: null,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, dispatch(t, ev) { (listeners[t] || []).forEach(f => f(ev || { preventDefault() {} })); },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width || 400, height: el.height || 300 }),
    setAttribute() {}, getAttribute: () => '', focus() {}, blur() {},
    getContext: () => new Proxy({}, { get(t, p) { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }),
    clientWidth: 600, clientHeight: 400, width: 400, height: 300, offsetWidth: 10,
  };
  Object.assign(el, extra || {});
  return el;
}
const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
const boardEl = mkEl('board', { width: 400, height: 400 });
els.set('board', boardEl);
const MathClone = Object.assign(Object.create(Math), Math);
const ctx = {
  console: { log() {}, error() {}, warn() {} }, Date, JSON, Math: MathClone,
  setTimeout: (f) => { if (typeof f === 'function') { try { f(); } catch (e) { ctx.__timerErrs.push(String(e && e.message)); } } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '' },
  document: {
    getElementById: getEl, querySelector: () => mkEl('board-wrap', { clientWidth: 600 }), querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, createElement: t => mkEl(t),
    body: mkEl('body'), documentElement: mkEl('html'), hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  AudioContext: undefined, webkitAudioContext: undefined, alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  __timerErrs: [], adsbygoogle: { push() {} },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
for (const fn of ['cycleCell', 'loadLevel', 'playDaily', 'isComplete']) {
  if (typeof ctx[fn] !== 'function') { console.error('missing engine fn: ' + fn); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
}
/* const/let top-level bindings live in the vm context's lexical environment, not on the
 * global object — fetch them through a snippet run in the same context. */
const GAME_DATA = vm.runInContext('GAME_DATA', ctx);
if (!GAME_DATA || !GAME_DATA.levels) { console.error('GAME_DATA not accessible'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* independent rule validation of an embedded solution */
function validate(lvl) {
  const R = lvl.R, C = lvl.C, N = R * C;
  const walls = new Set(lvl.walls || []);
  const cellRegion = new Int8Array(N).fill(-1);
  lvl.regions.forEach((reg, ri) => reg.forEach(i => {
    if (i < 0 || i >= N) throw new Error('region cell OOB');
    if (cellRegion[i] !== -1) throw new Error('regions overlap at ' + i);
    if (walls.has(i)) throw new Error('region contains wall cell ' + i);
    cellRegion[i] = ri;
  }));
  for (let i = 0; i < N; i++) if (!walls.has(i) && cellRegion[i] === -1) throw new Error('cell ' + i + ' in no region');
  const sol = lvl.solution || {};
  const b = new Array(lvl.regions.length).fill(0), ir = new Array(lvl.regions.length).fill(0);
  for (const k in sol) {
    const i = +k;
    if (i < 0 || i >= N) throw new Error('solution cell OOB');
    if (walls.has(i)) throw new Error('solution marks wall cell ' + i);
    if (cellRegion[i] === -1) throw new Error('solution cell outside regions');
    if (sol[k] === 1) b[cellRegion[i]]++;
    else if (sol[k] === 2) ir[cellRegion[i]]++;
    else throw new Error('bad solution value ' + sol[k]);
  }
  for (let ri = 0; ri < lvl.regions.length; ri++) {
    if (b[ri] !== 1 || ir[ri] !== 1) throw new Error('region ' + ri + ' has ' + b[ri] + ' balloons/' + ir[ri] + ' irons (need 1/1)');
  }
  const cells = new Int8Array(N);
  for (const k in sol) cells[+k] = sol[k];
  const isWall = i => walls.has(i);
  const above = i => (Math.floor(i / C) === 0 ? -1 : i - C);
  const below = i => (Math.floor(i / C) === R - 1 ? -1 : i + C);
  for (let i = 0; i < N; i++) {
    if (cells[i] === 1) { const u = above(i); if (!(u === -1 || isWall(u) || cells[u] === 1)) throw new Error('balloon ' + i + ' unsupported above'); }
    if (cells[i] === 2) { const d = below(i); if (!(d === -1 || isWall(d) || cells[d] === 2)) throw new Error('iron ' + i + ' unsupported below'); }
  }
  return lvl.regions.length;
}

/* replay the embedded solution via real pointerdown events */
function playLevel(lvl, label) {
  ctx.loadLevel(lvl);
  const R = lvl.R, C = lvl.C;
  const cs = boardEl.width / C;
  const sol = lvl.solution || {};
  for (const k in sol) {
    const i = +k, clicks = sol[k] === 2 ? 2 : 1;
    const r = Math.floor(i / C), c = i % C;
    for (let n = 0; n < clicks; n++) {
      boardEl.dispatch('pointerdown', { preventDefault() {}, clientX: c * cs + cs / 2, clientY: r * cs + cs / 2 });
    }
  }
  if (!ctx.isComplete()) throw new Error('engine isComplete rejects final board');
  if (!getEl('overlayWin').classList.contains('show')) throw new Error('onWin did not show overlayWin');
  getEl('overlayWin').classList.remove('show');
}

let pass = 0, fail = 0; const fails = [], notes = [];
const all = [];
GAME_DATA.levels.forEach((l, i) => all.push([l, l.tier + '-' + l.n + ' (#' + (i + 1) + ')', true]));
for (const [lvl, label, isMain] of all) {
  try {
    const nRegions = validate(lvl);
    playLevel(lvl, label);
    if (isMain) {
      const sv = JSON.parse(ctx.localStorage.getItem('dosun_fuwari_save_v1') || '{}');
      const rec = (sv.progress || {})[lvl.tier + '-' + lvl.n];
      if (!rec || !rec.stars) throw new Error('win shown but progress not persisted');
    }
    pass++;
    if (label.includes('#1') || label.includes('#' + GAME_DATA.levels.length)) notes.push(label + ' (' + lvl.R + 'x' + lvl.C + ', ' + nRegions + ' regions): embedded solution valid, won via pointer cycles');
  } catch (e) {
    fail++; fails.push(label + ' EX: ' + String(e.message).slice(0, 130));
  }
}
/* daily pool levels (not persisted) */
for (let di = 0; di < (GAME_DATA.daily || []).length; di++) {
  const lvl = GAME_DATA.daily[di];
  try {
    validate(lvl);
    playLevel(lvl, 'Daily-' + (di + 1));
    pass++;
  } catch (e) { fail++; fails.push('Daily-' + (di + 1) + ' EX: ' + String(e.message).slice(0, 130)); }
}
/* engine's own date-driven daily flow */
try {
  ctx.playDaily();
  const lvl = vm.runInContext('level', ctx);
  playLevel(lvl, 'playDaily(today)');
  notes.push('playDaily(): engine selected ' + lvl.seed + ', solved via pointer cycles');
  pass++;
} catch (e) { fail++; fails.push('playDaily EX: ' + String(e.message).slice(0, 130)); }

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails.slice(0, 55);
console.log(SLUG + ': ' + pass + '/' + (pass + fail) + ' (42 main + 6 daily pool + daily flow) embedded solutions independently validated vs full rules and won through engine pointer path');
notes.forEach(n => console.log('  ' + n));
(fails || []).slice(0, 15).forEach(f => console.log('  FAIL ' + f));
if (ctx.__timerErrs.length) console.log('timer errors: ' + JSON.stringify(ctx.__timerErrs.slice(0, 5)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
