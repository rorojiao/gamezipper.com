const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SLUG = 'canal-lock';
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

/* Driver: for each of the 30 levels (LC) run an independent BFS over the engine's own
 * move semantics (doIn/doOut/doGate preconditions + cwc() goal), then replay the optimal
 * move sequence through the engine's real interaction API and require cwc()===true,
 * the win overlay to activate and progress to persist to localStorage cl_p.
 * Also plays the daily (sd/sdl) variant. */
const DRIVER = `
(function () {
  var pass = 0, fail = 0, fails = [], notes = [];
  var CAP = 400000;
  function solveBFS(L) {
    var N = L.chambers;
    function key(lv, rm) { var g = ''; for (var x = 0; x < N - 1; x++) g += rm[x] ? '1' : '0'; return lv.join('') + '|' + g; }
    function isGoal(lv, rm) {
      for (var c = 0; c < N; c++) if (lv[c] !== L.target[c]) return false;
      for (var g = 0; g < N - 1; g++) if (L.gates.indexOf(g) >= 0 && !rm[g]) return false;
      return true;
    }
    var q = [{ lv: L.init.slice(), rm: {}, path: [] }];
    var seen = {}; seen[key(q[0].lv, q[0].rm)] = 1;
    var nodes = 0;
    while (q.length) {
      if (++nodes > CAP) throw new Error('BFS cap hit');
      var cur = q.shift();
      if (isGoal(cur.lv, cur.rm)) return cur;
      var succ = [];
      for (var c = 0; c < N; c++) if (L.inlets.indexOf(c) >= 0 && cur.lv[c] < 3) succ.push({ t: 'i', i: c, lv: cur.lv[c] + 1 });
      for (var c2 = 0; c2 < N; c2++) if (L.outlets.indexOf(c2) >= 0 && cur.lv[c2] > 0) succ.push({ t: 'o', i: c2, lv: cur.lv[c2] - 1 });
      for (var g = 0; g < N - 1; g++) if (L.gates.indexOf(g) >= 0 && !cur.rm[g] && cur.lv[g] === cur.lv[g + 1]) succ.push({ t: 'g', i: g });
      for (var k = 0; k < succ.length; k++) {
        var s = succ[k], lv2 = cur.lv.slice(), rm2 = {};
        for (var x in cur.rm) rm2[x] = cur.rm[x];
        if (s.t === 'g') rm2[s.i] = 1; else lv2[s.i] = s.lv;
        var kk = key(lv2, rm2);
        if (seen[kk]) continue;
        seen[kk] = 1;
        q.push({ lv: lv2, rm: rm2, path: cur.path.concat([s]) });
      }
    }
    return null;
  }
  function replay(path) {
    for (var s = 0; s < path.length; s++) {
      var m = path[s], ok;
      if (m.t === 'i') ok = doIn(m.i); else if (m.t === 'o') ok = doOut(m.i); else ok = doGate(m.i);
      if (!ok) throw new Error('engine rejected BFS move ' + m.t + m.i + ' at step ' + s);
    }
  }
  function lsParse(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } }
  init();
  var opt = [];
  for (var li = 0; li < 30; li++) {
    try {
      stl(li);
      var L = LC[li];
      var goal = solveBFS(L);
      if (!goal) throw new Error('UNWINNABLE: exhaustive BFS over doIn/doOut/doGate semantics found no target+gates state');
      replay(goal.path);
      if (cwc() !== true) throw new Error('BFS goal state rejected by engine cwc()');
      var wo = document.getElementById('wo');
      if (!wo.classList.contains('active')) throw new Error('cwc true but win overlay #wo not active');
      var sv = lsParse('cl_p')['l' + (li + 1)];
      if (!sv || !sv.s) throw new Error('win shown but cl_p progress not persisted');
      pass++;
      opt.push(goal.path.length - L.par);
      if (li < 2 || li === 29) notes.push('L' + (li + 1) + ' "' + L.name + '": optimal ' + goal.path.length + ' moves (par ' + L.par + ') stars=' + sv.s);
    } catch (e) { fail++; fails.push('L' + (li + 1) + ': ' + String(e.message).slice(0, 150)); }
  }
  try {
    sd(); sdl();
    var L = LC[ds % 30];
    var goal = solveBFS(L);
    if (!goal) throw new Error('daily: UNWINNABLE');
    replay(goal.path);
    if (cwc() !== true) throw new Error('daily: cwc rejected');
    if (!lsParse('cl_p')['daily' + ds]) throw new Error('daily win not persisted');
    pass++; notes.push('daily (level ' + ((ds % 30) + 1) + '): won in ' + goal.path.length + ' moves, persisted');
  } catch (e) { fail++; fails.push('daily: ' + String(e.message).slice(0, 150)); }
  var over = opt.filter(function (d) { return d > 0; }).length;
  if (opt.length === 30) notes.push('optimal-vs-par: ' + (30 - over) + '/30 levels solvable within par');
  return { pass: pass, fail: fail, total: pass + fail, fails: fails, notes: notes,
    summary: pass + '/30 levels BFS-solved + replayed via doIn/doOut/doGate to engine cwc() win + daily' };
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
