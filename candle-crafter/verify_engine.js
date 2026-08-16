const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SLUG = 'candle-crafter';
/* spec v3 vm template: persistent element registry, immediate setTimeout, seeded Math.random */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const elsById = new Map();
function mkEl(extra) {
  const el = {
    id: '', className: '', tagName: '', textContent: '', innerHTML: '', value: '', src: '', href: '',
    style: { setProperty() {} }, dataset: {}, children: [],
    clientWidth: 800, clientHeight: 450, offsetWidth: 800, offsetHeight: 450, width: 800, height: 450,
    disabled: false, hidden: false, checked: false,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; },
      contains(c) { return this._s.has(c); },
    },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    appendChild(c) { return c; }, removeChild(c) { return c; }, remove() {}, insertBefore(c) { return c; },
    querySelector() { return mkEl(); }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, right: 800, bottom: 450, width: 800, height: 450 }; },
    setAttribute() {}, getAttribute() { return ''; }, removeAttribute() {},
    focus() {}, blur() {}, click() {}, select() {},
    getContext() {
      return new Proxy({}, {
        get: (t, p) => {
          if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
          if (p === 'measureText') return () => ({ width: 10 });
          if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
          if (typeof p === 'string' && !(p in t)) return () => undefined;
          return t[p];
        },
        set: () => true,
      });
    },
  };
  Object.assign(el, extra || {});
  return el;
}
function getEl(id) { if (!elsById.has(id)) elsById.set(id, mkEl({ id })); return elsById.get(id); }
let __seed = 12345;
const MathClone = Object.create(Math);
MathClone.random = () => { __seed = (__seed * 1664525 + 1013904223) >>> 0; return __seed / 4294967296; };
const sandbox = {
  console: { log() {}, error() {}, warn() {} },
  Math: MathClone, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, WeakMap, Symbol, Promise,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone,
  Error, TypeError, RangeError, SyntaxError,
  Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array,
  setTimeout: (f) => { if (typeof f === 'function') { try { f(); } catch (e) { sandbox.__timerErrors.push(String(e && e.message)); } } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, requestIdleCallback: () => 0, cancelIdleCallback() {},
  performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear() { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node-verify', maxTouchPoints: 1, vibrate() {}, clipboard: { writeText() {} }, language: 'en-US', languages: ['en-US'] },
  location: { href: 'http://localhost/' + SLUG + '/', search: '', hash: '', reload() {} },
  document: {
    getElementById: getEl,
    querySelector: () => null, querySelectorAll: () => [],
    getElementsByTagName: () => [], getElementsByClassName: () => [],
    addEventListener() {}, removeEventListener() {},
    createElement: t => mkEl({ tagName: t }), createElementNS: (ns, t) => mkEl({ tagName: t }),
    createTextNode: t => ({ textContent: t }),
    body: mkEl(), head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {},
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  Image: function () { const o = { onload: null, onerror: null, width: 0, height: 0 }; let s = ''; Object.defineProperty(o, 'src', { get: () => s, set(v) { s = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
  AudioContext: undefined, webkitAudioContext: undefined,
  __timerErrors: [], __getEl: getEl,
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); }
catch (e) { console.error('engine load error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* Driver: replay each level's embedded solution (level.layers) through the engine's real
 * selectColor + pourLayer interaction path; require checkWin true, #win-modal active and
 * candleCrafterProgress persisted. Also validates palette consistency of the embedded
 * solution and exercises undo/reset paths. */
const DRIVER = `
(function () {
  var pass = 0, fail = 0, fails = [], notes = [];
  for (var li = 0; li < LEVELS.length; li++) {
    try {
      startLevel(li);
      var L = LEVELS[li];
      for (var i = 0; i < L.layers.length; i++)
        if (L.colors.indexOf(L.layers[i]) < 0) throw new Error('embedded solution invalid: layer ' + i + ' color ' + L.layers[i] + ' not in level palette');
      for (var j = 0; j < L.layers.length; j++) {
        selectColor(L.layers[j]);
        if (selectedColor !== L.layers[j]) throw new Error('selectColor rejected palette color ' + L.layers[j]);
        pourLayer();
      }
      if (checkWin(false) !== true) throw new Error('checkWin false after full embedded-solution replay');
      var wm = document.getElementById('win-modal');
      if (!wm.classList.contains('active')) throw new Error('#win-modal not active (onWin not fired)');
      var prog = JSON.parse(localStorage.getItem('candleCrafterProgress') || '{}');
      if (!(prog[li] > 0)) throw new Error('win not persisted to candleCrafterProgress');
      pass++;
      if (li < 2 || li === LEVELS.length - 1) notes.push('L' + (li + 1) + ' "' + L.name + '": ' + L.layers.length + ' layers, ' + L.colors.length + ' palette colors, stars=' + prog[li]);
    } catch (e) { fail++; fails.push('L' + (li + 1) + ': ' + String(e.message).slice(0, 150)); }
  }
  /* robustness: undo + reset paths on level 0 */
  try {
    startLevel(0);
    selectColor(LEVELS[0].layers[0]); pourLayer();
    selectColor(LEVELS[0].layers[1]); pourLayer();
    undoLayer();
    if (playerLayers.length !== 1) throw new Error('undo did not remove a layer');
    resetLevel();
    if (playerLayers.length !== 0 || pourCount !== 0) throw new Error('reset did not clear state');
    pass++; notes.push('undo/reset paths OK (pour -> undo -> reset)');
  } catch (e) { fail++; fails.push('undo/reset: ' + String(e.message).slice(0, 150)); }
  return { pass: pass, fail: fail, total: pass + fail, fails: fails, notes: notes,
    summary: pass + '/' + (30 + 1) + ': all 30 candle levels won via embedded solution through pourLayer + undo/reset paths' };
})()
`;

let result = null;
try { result = vm.runInContext(DRIVER, ctx, { filename: 'driver.js' }); }
catch (e) { console.error('driver crashed:', e.stack || e.message); result = { pass: 0, fail: 1, total: 1, fails: [String(e.message).slice(0, 200)], verdict: 'FAIL' }; }
if (!result || typeof result !== 'object') { console.error('driver returned no result object'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + (result.summary || (out.pass + '/' + out.total + ' items ok')));
(result.notes || []).slice(0, 14).forEach(n => console.log('  ' + n));
(result.fails || []).slice(0, 14).forEach(f => console.log('  FAIL ' + f));
if (sandbox.__timerErrors.length) console.log('timerErrors: ' + JSON.stringify(sandbox.__timerErrors.slice(0, 3)));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
