const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SLUG = 'castle-wall';
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
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, screen: { width: 1280, height: 720 },
  adsbygoogle: { push() {} },
  __timerErrors: [], __getEl: getEl,
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx, { filename: 'engine.js' }); }
catch (e) { console.error('engine load error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* Driver: replay each level's embedded solution path (lv.path) through the engine's real
 * toggleSeg interaction (the exact function pointer-down invokes), then doCheck() must
 * reach winLevel: #win-modal shown, G.completed[i] set, save persisted to localStorage
 * SAVE_KEY. Also independently re-validates the embedded path against clue semantics
 * (white/black arrow targets on/off path, path avoids clue cells, clean S->G chain). */
const DRIVER = `
(function () {
  var pass = 0, fail = 0, fails = [], notes = [];
  var DIRV2 = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
  function indepValidate(lv) {
    var cells = {}; lv.path.forEach(function (p) { cells[p[0] + ',' + p[1]] = 1; });
    for (var i = 0; i < lv.clues.length; i++) {
      var cl = lv.clues[i], dv = DIRV2[cl.d];
      if (cells[cl.r + ',' + cl.c]) throw new Error('path enters clue cell ' + cl.r + ',' + cl.c);
      var tr = cl.r + cl.n * dv[0], tc = cl.c + cl.n * dv[1];
      if (tr < 0 || tr >= lv.r || tc < 0 || tc >= lv.c) throw new Error('clue target out of bounds');
      var on = !!cells[tr + ',' + tc];
      if (cl.color === 'white' && !on) throw new Error('white clue at ' + cl.r + ',' + cl.c + ' dir ' + cl.d + ' n' + cl.n + ' target off-path');
      if (cl.color === 'black' && on) throw new Error('black clue at ' + cl.r + ',' + cl.c + ' target on-path');
    }
    for (var s = 0; s < lv.path.length - 1; s++) {
      var a = lv.path[s], b = lv.path[s + 1];
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) throw new Error('path step not adjacent at ' + s);
    }
    if (lv.path[0][0] !== lv.start[0] || lv.path[0][1] !== lv.start[1]) throw new Error('path does not begin at start');
    var last = lv.path[lv.path.length - 1];
    if (last[0] !== lv.goal[0] || last[1] !== lv.goal[1]) throw new Error('path does not end at goal');
    var seen = {}; for (var q = 0; q < lv.path.length; q++) { var k = lv.path[q][0] + ',' + lv.path[q][1]; if (seen[k]) throw new Error('path revisits ' + k); seen[k] = 1; }
    return lv.path.length;
  }
  for (var li = 0; li < LEVELS.length; li++) {
    try {
      var lv = LEVELS[li];
      var plen = indepValidate(lv);
      loadLevel(li);
      if (G.screen !== 'game') throw new Error('loadLevel did not enter game screen');
      for (var s = 0; s < lv.path.length - 1; s++) toggleSeg(lv.path[s], lv.path[s + 1]);
      var segCount = Object.keys(G.segs).length;
      if (segCount !== lv.path.length - 1) throw new Error('toggleSeg placed ' + segCount + ' of ' + (lv.path.length - 1) + ' segments (blocked by clue cell?)');
      doCheck();
      var wm = document.getElementById('win-modal');
      if (wm.classList.contains('hidden')) throw new Error('doCheck on embedded solution did not win (#win-modal hidden)');
      if (!G.completed[String(li)]) throw new Error('win not recorded in G.completed');
      var sv = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      if (!sv.completed || !sv.completed[String(li)]) throw new Error('win not persisted to localStorage ' + SAVE_KEY);
      hideModal('win-modal');
      stopTimer();
      pass++;
      if (li < 2 || li === LEVELS.length - 1) notes.push('L' + (li + 1) + ' (' + lv.r + 'x' + lv.c + '): ' + plen + '-cell embedded path independently valid + won via toggleSeg/doCheck');
    } catch (e) { fail++; fails.push('L' + (li + 1) + ': ' + String(e.message).slice(0, 140)); try { hideModal('win-modal'); stopTimer(); } catch (e2) {} }
  }
  return { pass: pass, fail: fail, total: pass + fail, fails: fails, notes: notes,
    summary: pass + '/' + LEVELS.length + ' levels: embedded path replayed via toggleSeg -> doCheck win + persisted' };
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
