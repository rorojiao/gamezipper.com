#!/usr/bin/env node
/* dominosa in-engine verifier (wave-A3). Levels are generated deterministically at
 * runtime (generateLevel: seededRandom(lvl*12345+67890) tiling + shuffled domino set),
 * levels.json is not used by the engine. Per level 1..30: loadLevel runs the engine's
 * own generator, an INDEPENDENT exact-cover solver (first-empty-cell DFS, domino-type
 * bitmask — the engine forbids reusing a domino type, so a win == a perfect tiling of
 * the full set) finds a solution, which is then PLAYED through the engine's real input
 * path: pointerdown events on the canvas (handlePointerDown -> getCell -> select/place,
 * type-reuse rejection included). PASS requires checkWin to fire (win-screen active) and
 * completedLevels[lvl] persisted to localStorage dominosa-progress.
 * Usage: node dominosa/verify_engine.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'dominosa';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
const ANCHOR = 'window.toggleSettings = toggleSettings;';
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__DM={state:state,loadLevel:loadLevel,canvas:CANVAS};');

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
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width || 400, height: el.height || 300, right: el.width || 400, bottom: el.height || 300 }),
    setAttribute() {}, getAttribute: () => '', focus() {}, blur() {},
    getContext: () => new Proxy({}, { get(t, p) { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }),
    clientWidth: 400, clientHeight: 200, width: 400, height: 300, offsetWidth: 10,
  };
  Object.assign(el, extra || {});
  return el;
}
const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, mkEl(id)); return els.get(id); };
const canvasEl = mkEl('domino-canvas', { width: 240, height: 180 });
els.set('domino-canvas', canvasEl);
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
    getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
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
const DM = ctx.window.__DM;
if (!DM) { console.error('no engine export'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const state = DM.state;

/* independent exact-cover dominosa solver */
function solveDominosa(grid, rows, cols, maxNum) {
  const typeIdx = new Map();
  let nt = 0;
  for (let a = 0; a <= maxNum; a++) for (let b = a; b <= maxNum; b++) typeIdx.set(a * 100 + b, nt++);
  const total = rows * cols;
  const covered = new Uint8Array(total);
  const usedMask = [0];
  const pairs = [];
  let nodes = 0; const CAP = 5e6; const DL = Date.now() + 40000; let capped = false;
  const tid = (i, j) => { const a = grid[i], b = grid[j]; return typeIdx.get(a <= b ? a * 100 + b : b * 100 + a); };
  function rec(pos) {
    if (++nodes > CAP || (nodes % 8192 === 0 && Date.now() > DL)) { capped = true; return false; }
    while (pos < total && covered[pos]) pos++;
    if (pos === total) return true;
    const r = (pos / cols) | 0, c = pos % cols;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= rows || nc >= cols) continue;
      const np = nr * cols + nc;
      if (covered[np]) continue;
      const t = tid(pos, np);
      if (usedMask[0] & (1 << t)) continue;
      covered[pos] = covered[np] = 1; usedMask[0] |= (1 << t); pairs.push([pos, np]);
      if (rec(pos + 1)) return true;
      covered[pos] = covered[np] = 0; usedMask[0] &= ~(1 << t); pairs.pop();
    }
    return false;
  }
  const ok = rec(0);
  return ok ? pairs : (capped ? 'CAP' : null);
}

let pass = 0, fail = 0; const fails = [], notes = [];
for (let lvl = 1; lvl <= 30; lvl++) {
  try {
    DM.loadLevel(lvl);
    if (!state.grid || !state.grid.length) throw new Error('generateLevel failed');
    const rows = state.rows, cols = state.cols;
    const flat = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) flat.push(state.grid[r][c]);
    const t0 = Date.now();
    const sol = solveDominosa(flat, rows, cols, state.maxNum);
    if (!Array.isArray(sol)) throw new Error(sol === 'CAP' ? 'solver cap (INCONCLUSIVE)' : 'UNWINNABLE: no perfect domino-set tiling exists');
    const solveMs = Date.now() - t0;
    /* play through real pointer path */
    const cs = DM.canvas.width / cols;
    for (const [a, b] of sol) {
      const r1 = (a / cols) | 0, c1 = a % cols, r2 = (b / cols) | 0, c2 = b % cols;
      canvasEl.dispatch('pointerdown', { preventDefault() {}, clientX: c1 * cs + cs / 2, clientY: r1 * cs + cs / 2 });
      canvasEl.dispatch('pointerdown', { preventDefault() {}, clientX: c2 * cs + cs / 2, clientY: r2 * cs + cs / 2 });
    }
    if (state.placements.length !== rows * cols / 2) throw new Error('placements ' + state.placements.length + ' != ' + rows * cols / 2);
    if (!getEl('win-screen').classList.contains('active')) throw new Error('checkWin did not show win-screen');
    const sv = JSON.parse(ctx.localStorage.getItem('dominosa-progress') || '{}');
    const rec = (sv.completedLevels || {})[lvl];
    if (!rec || !rec.stars) throw new Error('win shown but progress not persisted');
    if (rec.stars !== 3) throw new Error('expected 3 stars (no hints), got ' + rec.stars);
    pass++;
    if (lvl === 1 || lvl === 30) notes.push('L' + lvl + ' (' + rows + 'x' + cols + ' max' + state.maxNum + '): solved in ' + solveMs + 'ms, won via pointer pairs, stars=' + rec.stars);
    /* back to a neutral screen for next level */
    getEl('win-screen').classList.remove('active');
    getEl('game-screen').classList.add('active');
  } catch (e) {
    fail++; fails.push('L' + lvl + ' EX: ' + String(e.message).slice(0, 140));
  }
}
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails.slice(0, 31);
console.log(SLUG + ': ' + pass + '/30 levels independently solved (exact-cover dominosa) and won through the engine pointer path');
notes.forEach(n => console.log('  ' + n));
(fails || []).slice(0, 15).forEach(f => console.log('  FAIL ' + f));
if (ctx.__timerErrs.length) console.log('timer errors: ' + JSON.stringify(ctx.__timerErrs.slice(0, 5)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
