/* Shared vm harness for verify_engine.js authors — require() this instead of pasting the sandbox.
 * Provides: bootGame(slug) -> {ctx, api, el, dispatchKey, dispatchPointerAt, pump, readLS, call(fExpr)}
 * The sandbox stubs match _optimization/scripts/verifier-spec.md v3 (canvas Proxy incl gradients,
 * localStorage map, seeded Math.random, immediate setTimeout with error capture). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = path.resolve(__dirname, '..', '..');

function makeEl(extra) {
  const listeners = {};
  const el = {
    id: '', className: '', textContent: '', innerHTML: '', value: '',
    style: { setProperty() {} }, dataset: {},
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c); } },
    children: [], width: 480, height: 640, clientWidth: 480, clientHeight: 640, offsetWidth: 480, offsetHeight: 640, scrollWidth: 480, scrollHeight: 640,
    disabled: false, hidden: false, checked: false,
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}, /* dispatch binds the element as `this` — engines rely on it (e.g. btnStart's this.disabled) */
    dispatch(t, ev) { ev = ev || {}; ev.preventDefault = ev.preventDefault || (() => {}); const el = this; (listeners[t] || []).forEach(f => f.call(el, ev)); return true; },
    getContext: () => mk2d(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 640 }),
    appendChild(c) { this.children.push(c); if (c && c.parentNode !== this) { c.parentNode = c.parentElement = this; } return c; }, insertBefore(c, ref) { const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); if (c && c.parentNode !== this) { c.parentNode = c.parentElement = this; } return c; }, get nextSibling() { if (this.parentNode && this.parentNode.children) { const i = this.parentNode.children.indexOf(this); return this.parentNode.children[i + 1] || null; } return null; }, removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }, remove() { if (this.parentElement) this.parentElement.removeChild(this); }, parentElement: null,
    focus() {}, blur() {}, click() { this.dispatch('click'); },
    insertAdjacentHTML() {}, insertAdjacentElement() {}, closest() { return null; }, contains() { return false; }, matches() { return false; },
    setAttribute(k, v) { this['__attr_' + k] = v; if (k === 'id') this.id = v; }, getAttribute(k) { return this['__attr_' + k] === undefined ? null : this['__attr_' + k]; }, removeAttribute(k) { delete this['__attr_' + k]; }, hasAttribute(k) { return this['__attr_' + k] !== undefined; },
    querySelector: () => makeEl(), querySelectorAll: () => [],
  };
  // dynamic script/link loading: onload fires on the NEXT pump frame (browsers load
  // asynchronously; engines assign .onload AFTER .src, so a synchronous fire would miss it)
  let _src = '';
  try {
    Object.defineProperty(el, 'src', { get: () => _src, set(v) { _src = v; module.exports.__pendingOnloads.push(() => { if (typeof el.onload === 'function') { try { el.onload(); } catch (e) {} } }); } });
  } catch (e) {}
  return Object.assign(el, extra || {});
}
function mk2d() {
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get: (t, p) => {
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => grad;
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'canvas') return { width: 480, height: 640 };
      if (typeof p === 'string' && !(p in t)) return () => 1;
      return t[p];
    },
    set: () => true,
  });
}
function mkAudio() {
  const node = () => ({ connect() { return node(); }, disconnect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, type: 'sine', playbackRate: { value: 1, setValueAtTime() {} } });
  return { currentTime: 0, state: 'running', sampleRate: 44100, destination: node(), resume() { return Promise.resolve(); }, suspend() { return Promise.resolve(); }, close() { return Promise.resolve(); }, createGain: node, createOscillator: node, createBufferSource: node, createAnalyser: node, createBiquadFilter: node, createDynamicsCompressor: node, createDelay: node, createBuffer: () => ({ getChannelData: () => new Float32Array(64) }), decodeAudioData: () => Promise.resolve({ getChannelData: () => new Float32Array(64) }), listener: { setPosition() {}, setOrientation() {} } };
}
function bootGame(slug, opts) {
  opts = opts || {};
  const loadErrorsLater = [];
  const html = fs.readFileSync(path.join(REPO, slug, 'index.html'), 'utf8');
  // inline scripts (skipping ld+json) + LOCAL external scripts (src without a scheme) in DOM order
  const scripts = [];
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || '', body = m[2];
    if (/application\/ld\+json/.test(attrs)) continue;
    const src = (attrs.match(/src="([^"]+)"/) || [])[1];
    if (src) {
      if (/^https?:|^\/\//.test(src)) continue; // external CDN — page must work without it
      const clean = src.split('?')[0].split('#')[0];
      const local = clean.startsWith('/') ? path.join(REPO, clean) : path.join(REPO, slug, clean);
      try { scripts.push(fs.readFileSync(local, 'utf8')); } catch (e) { loadErrorsLater.push('src ' + src + ': ' + e.code); }
    } else if (body.trim()) scripts.push(body);
  }
  const els = {};
  let seed = opts.seed || 424242;
  const rafQ = [];
  const timers = [];
  const sandbox = {
    console: { log() {}, error: (...a) => { (sandbox.__errors = sandbox.__errors || []).push(a.map(String).join(' ')); }, warn() {} },
    Date, JSON, Math,
    setTimeout: (f, ms) => { const id = (timers._seq = (timers._seq || 0) + 1); timers.push({ f, at: (sandbox.__now || 0) + (ms || 0), id }); return id; }, // return the id actually stored — the old off-by-one made every clearTimeout kill the WRONG timer (go-fish's aiTimer clear cancelled unrelated callbacks and froze games)
    clearTimeout: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    setInterval: (f, ms) => { const id = (timers._seq = (timers._seq || 0) + 1) + 1000000; timers.push({ f, at: (sandbox.__now || 0) + (ms || 1), every: ms || 1, id }); return id; },
    clearInterval: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    requestAnimationFrame: (f) => { rafQ.push(f); return rafQ.length; }, cancelAnimationFrame() {},
    requestIdleCallback: (f) => { try { f({ didTimeout: false, timeRemaining: () => 50 }); } catch (e) {} return 0; }, cancelIdleCallback() {},
    BroadcastChannel: function () { this.postMessage = () => {}; this.onmessage = null; this.close = () => {}; this.addEventListener = () => {}; this.removeEventListener = () => {}; },
    URL, URLSearchParams, structuredClone: (o) => JSON.parse(JSON.stringify(o)), TextEncoder, TextDecoder, btoa: (s) => Buffer.from(String(s), 'binary').toString('base64'), atob: (s) => Buffer.from(String(s), 'base64').toString('binary'),
    performance: { now: () => sandbox.__now || 0 },
    __now: 0,
    localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; }, key: i => Object.keys(m)[i] || null, get length() { return Object.keys(m).length; }, _m: m }; })(),
    sessionStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; }, key: i => Object.keys(m)[i] || null, get length() { return Object.keys(m).length; } }; })(),
    navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {}, platform: 'linux' },
    location: { href: 'http://localhost/' + slug + '/', search: '', hash: '', origin: 'http://localhost', protocol: 'http:', host: 'localhost', pathname: '/' + slug + '/', reload() {}, assign() {}, replace() {} },
    document: {
      getElementById: (id) => {
        if (!els[id]) { els[id] = makeEl({ id }); els[id].parentNode = els[id].parentElement = sandbox.document.body; } // site-infra scripts walk .parentNode to inject banners
        return els[id];
      },
      querySelector: (sel) => {
        const idm = /^#([A-Za-z][\w-]*)$/.exec(sel);
        if (idm) { if (!els[idm[1]]) { els[idm[1]] = makeEl({ id: idm[1] }); els[idm[1]].parentNode = els[idm[1]].parentElement = sandbox.document.body; } return els[idm[1]]; } // #id aliases getElementById (engines bind via $()); parentNode wired for ad-infra walks
        const k = 'q:' + sel;
        if (!els[k]) { els[k] = makeEl({ className: String(sel).replace(/^\./, '') }); els[k].parentElement = els[k].parentNode = sandbox.document.body; } // site-infra scripts inject banners via canvasWrap.parentNode (real DOM always has one)
        return els[k];
      },
      querySelectorAll: (sel) => {
        const key = 'qa:' + sel;
        if (!els[key]) {
          const n = (opts.qsAll && opts.qsAll[sel]) || 6;
          const arr = []; for (let i = 0; i < n; i++) arr.push(makeEl({ className: String(sel).replace(/^\./, '') }));
          els[key] = arr;
        }
        return els[key];
      },
      addEventListener(t, f) { (this.__dls = this.__dls || {})[t] = (this.__dls[t] || []).concat(f); },
      removeEventListener() {},
      dispatch(t, ev) { ev = ev || {}; ev.preventDefault = ev.preventDefault || (() => {}); ((this.__dls || {})[t] || []).forEach(f => { try { f.call(this, ev); } catch (e) {} }); return true; },
      createElement: () => makeEl(), createElementNS: () => makeEl(),
      createTextNode: t => ({ textContent: t }),
      body: makeEl(), head: makeEl(), documentElement: makeEl(),
      hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
    },
    alert() {}, confirm: () => true, prompt: () => '',
    getComputedStyle: () => ({ getPropertyValue: () => '', display: 'block', opacity: '1', width: '480px', height: '640px', transform: 'none' }), matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {}, removeListener() {} }),
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
    XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
    addEventListener(t, f) { (this.__wls = this.__wls || {})[t] = (this.__wls[t] || []).concat(f); },
    removeEventListener() {}, dispatchEvent(ev) { ev = ev || {}; ev.preventDefault = ev.preventDefault || (() => {}); ((this.__wls || {})[ev.type] || []).forEach(f => { try { f(ev); } catch (e) {} }); return true; },
    MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
    ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
    IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
    Image: function () { const o = { onload: null, onerror: null, width: 0, height: 0 }; let s = ''; Object.defineProperty(o, 'src', { get: () => s, set(v) { s = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; },
    CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
    AudioContext: function () { return mkAudio(); }, webkitAudioContext: function () { return mkAudio(); },
    innerWidth: (opts.viewport && opts.viewport[0]) || 480, innerHeight: (opts.viewport && opts.viewport[1]) || 640, devicePixelRatio: 1,
    screen: { width: 480, height: 640 },
    adsbygoogle: { push() {} },
    __rafQ: rafQ, __timers: timers, __els: els,
  };
  // virtual clock: engines mixing Date.now() with timers/rAF must observe the pump's time
  class VDate extends Date { static now() { return sandbox.__now || 0; } constructor(...a) { super(...(a.length ? a : [sandbox.__now || 0])); } }
  sandbox.Date = VDate;
  sandbox.Math = Object.create(Math);
  sandbox.Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  if (opts.seedLS) for (const [k, v] of Object.entries(opts.seedLS)) sandbox.localStorage.setItem(k, v); // returning-player state
  // browsers expose every element id as a window property (named access); engines rely on it
  for (const m of html.matchAll(/\sid="([A-Za-z][A-Za-z0-9_-]*)"/g)) { const id = m[1]; if (!(id in sandbox)) { sandbox[id] = els[id] || (els[id] = makeEl({ id })); } }
  for (const id in els) { if (!els[id].parentNode) els[id].parentNode = els[id].parentElement = sandbox.document.body; } // every element has a parent in a real DOM (mancala measures canvas.parentElement.clientWidth)
  const ctx = vm.createContext(sandbox);
  const loadErrors = [];
  if (opts.vendor) for (const [name, file] of Object.entries(opts.vendor)) {
    // run vendored libs in a bare context, then expose on the game sandbox
    const vctx = vm.createContext({ console: { log() {}, error() {} }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, performance: { now: () => 0 }, document: { addEventListener() {}, removeEventListener() {}, createElement: () => ({ style: {} }), documentElement: { style: {} } }, navigator: { userAgent: 'node' }, Math, Date, JSON });
    vctx.window = vctx; vctx.self = vctx; vctx.globalThis = vctx;
    try { vm.runInContext(fs.readFileSync(path.join(REPO, '_optimization', 'vendor', file), 'utf8'), vctx, { filename: file }); sandbox[name] = vctx[name] || vctx.window[name]; }
    catch (e) { loadErrors.push('vendor ' + name + ': ' + e.message); }
  }
  // opts.inject: append an export shim INSIDE a chosen script's scope (IIFE internals access).
  //   { anchor: 'window.RT = ', exports: 'globalThis.__X={state:()=>state};' } -> after the anchor line
  if (opts.inject) {
    const at = scripts.findIndex(sc => sc.includes(opts.inject.anchor));
    if (at >= 0) {
      const sc = scripts[at];
      const pos = sc.indexOf(opts.inject.anchor);
      // insert after the anchor's FULL statement: if the anchor opens a block (function/if),
      // skip to its balanced closing brace; else end of line
      let insertAt = sc.indexOf('\n', pos);
      const brace0 = sc.indexOf('{', pos);
      if (brace0 >= 0 && brace0 < insertAt) {
        let d = 0, j = brace0;
        for (; j < sc.length; j++) { if (sc[j] === '{') d++; else if (sc[j] === '}') { d--; if (!d) break; } }
        insertAt = j + 1;
      }
      scripts[at] = sc.slice(0, insertAt) + '\n;' + opts.inject.exports + '\n' + sc.slice(insertAt);
    } else loadErrorsLater.push('inject-anchor-missing: ' + opts.inject.anchor);
  }
  scripts.forEach((sc, i) => { try { vm.runInContext(sc, ctx, { filename: slug + '-' + i + '.js' }); } catch (e) { loadErrors.push('script#' + i + ': ' + String(e.message)); } });
  // real browsers always fire DOMContentLoaded after parsing — engines assign their
  // canvas/listeners inside it (solitaire-roguelite: canvas stays null without this)
  const dcl = (host, name) => { try { ((host.__wls || {})[name] || []).forEach(f => f.call(host, { type: name })); } catch (e) { loadErrors.push(name + ': ' + String(e.message)); } };
  dcl(sandbox.document, 'DOMContentLoaded'); // document listeners
  dcl(sandbox, 'DOMContentLoaded'); // window listeners (solitaire-roguelite wires canvas here)
  dcl(sandbox, 'load'); // balls-vs-bricks registers its rAF loop on window 'load'
  loadErrors.push(...loadErrorsLater);
  const api = {
    ctx, sandbox, els, loadErrors, rafQ, timers,
    /** pump n rAF frames (each frame advances __now by 16.67ms and fires due timers) */
    pump(n) { for (let i = 0; i < n; i++) { sandbox.__now += 16.67;
      { const q = module.exports.__pendingOnloads.splice(0); q.forEach(f => { try { f(); } catch (e) {} }); } // deferred dynamic-script onload
      const due = []; // snapshot first: callbacks mutate the timer list (clearTimeout/extra setTimeout)
      for (let j = timers.length - 1; j >= 0; j--) { const t = timers[j]; if (t && t.at <= sandbox.__now) { if (t.every) { t.at += t.every; } else { timers.splice(j, 1); } due.push(t); } }
      for (const t of due) { try { t.f(); } catch (e) { sandbox.__errors = (sandbox.__errors || []).concat('timer: ' + e.message + ' @ ' + String(e.stack || '').split('\n')[1]); } }
      const q = rafQ.splice(0); q.forEach(f => { try { f(sandbox.__now); } catch (e) { sandbox.__errors = (sandbox.__errors || []).concat('raf: ' + e.message + ' @ ' + String(e.stack || '').split('\n')[1]); } }); } },
    /** evaluate an expression inside the vm (reads engine internals after an export surgery) */
    call(expr) { return vm.runInContext(expr, ctx); },
    /** dispatch a keyboard event to the element that owns key listeners (canvas/document/body fallback chain) */
    key(k, type) {
      const targets = ['document', 'window', 'body'].map(t => sandbox.document[t]);
      for (const t of targets) { if (t && t.dispatch) { t.dispatch(type || 'keydown', { key: k, code: k, preventDefault() {} }); return; } }
      // fallback: any element with keydown listeners
      for (const id in els) { if (els[id].dispatch) els[id].dispatch(type || 'keydown', { key: k, code: k, preventDefault() {} }); }
    },
    ls: sandbox.localStorage,
  };
  return api;
}
module.exports = { bootGame, makeEl, mk2d, REPO, __pendingOnloads: [] };
