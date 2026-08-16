#!/usr/bin/env node
/* In-engine verifier for rubiks-cube (Type A/B: solve engine-scrambled cubes).
 * Engine: 2x2..5x5 Rubik's cube in an IIFE. scramble() applies 20+n*5 random
 * outer-layer moves (Math.random seeded in the verifier sandbox for determinism)
 * and sets S.scrambled=true. Solving happens through the REAL user input paths:
 *   - keyboard: onKey({key:'u'|..., shiftKey}) -> doMoveAnim(face, cw, 0, true, true)
 *   - pointer:  onPD/onPM/onPU drag on a face sticker -> doMoveAnim
 * checkSolve() (called by doMoveAnim after every animated move) is the engine's
 * OWN win detection: isSolved(S.cube) && S.scrambled -> S.scrambled=false,
 * sfxSolve, showToast('Solved in N moves! ...'), saveBest() persists to
 * localStorage 'rc-best-<n>' + 'rc-bests', confetti.
 * Verification per size n in [2,3,4,5]:
 *   1. surgery-injected move recorder captures the scramble sequence (doMove hook)
 *   2. for n=3 one extra move is made through the pointer-drag path (onPD/onPU)
 *   3. the exact inverse sequence is replayed key-by-key through onKey
 *   4. PASS requires: engine isSolved(S.cube)===true AND S.scrambled===false
 *      (flipped only by the engine's own checkSolve) AND 'Solved in' toast text
 *      persisted AND localStorage rc-bests/<n> + rc-best-<n> written.
 * Also proves scramble actually leaves the cube unsolved, and that undo()
 * reverses a move. Usage: node rubiks-cube/verify_engine.js (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'rubiks-cube';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
/* only the game script contains doMoveAnim */
const gameIdx = scripts.findIndex(s => s.includes('function doMoveAnim'));
if (gameIdx < 0) fail0('game script not found');
let code0 = scripts[gameIdx];

/* --- string surgery (in-memory only) --- */
const MV_HOOK_OLD = 'function doMove(cube,n,face,layer,cw){';
if (!code0.includes(MV_HOOK_OLD)) fail0('doMove anchor missing');
code0 = code0.replace(MV_HOOK_OLD,
  'function doMove(cube,n,face,layer,cw){globalThis.__MVS=globalThis.__MVS||[];globalThis.__MVS.push({f:face,l:(layer===undefined?0:layer),cw:cw});');
const TAIL_ANCHOR = 'init();\n})();';
const tailAt = code0.lastIndexOf(TAIL_ANCHOR);
if (tailAt < 0) fail0('IIFE tail anchor missing');
const tail = `globalThis.__RC={
  S:S,mk:mkCube,doMove:doMove,solved:isSolved,scramble:scramble,reset:resetCube,
  key:function(e){onKey(e)},undo:function(){undo()},
  pd:function(e){onPD(e)},pm:function(e){onPM(e)},pu:function(e){onPU(e)},
  setSize:function(n){S.n=n;resetCube();updBests()},
  clr:function(){globalThis.__MVS=[]},
  mv:function(){return (globalThis.__MVS||[]).map(function(m){return {f:m.f,l:m.l,cw:m.cw}})}
};
init();
})();`;
code0 = code0.slice(0, tailAt) + tail;
const code = scripts.map((s, i) => (i === gameIdx ? code0 : s)).join('\n');

function fail0(msg) { console.error(msg); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* --- sandbox --- */
function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], width: 400, height: 400, clientWidth: 400, clientHeight: 400, offsetWidth: 400, offsetHeight: 400,
    disabled: false, hidden: false, scrollTop: 0, scrollHeight: 0,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
function mkAny() {
  const f = function () { return anyP; };
  const anyP = new Proxy(f, {
    get(t, p) { if (p === Symbol.toPrimitive) return () => 0; if (p === 'length') return 0; if (!(p in t)) t[p] = mkAny(); return t[p]; },
    set() { return true; }, apply() { return anyP; },
  });
  return anyP;
}
const BODY = mkEl(); const DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL; DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
const elsById = new Map();
const seedBox = { seed: 20260816 };
const MathClone = Object.assign(Object.create(Math), Math);
MathClone.random = () => { seedBox.seed = (seedBox.seed * 1664525 + 1013904223) >>> 0; return seedBox.seed / 4294967296; };
const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 900, innerHeight: 900,
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    location: { href: 'https://localhost/', hash: '', search: '' }, dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY, parentNode: BODY })); return elsById.get(id); },
    getElementsByTagName: () => [mkEl({ parentElement: BODY })], getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createElementNS: (ns, t) => mkEl({ tagName: t, namespaceURI: ns, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { return 0; } }, clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => 1000 },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.Math = MathClone;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'rubiks-cube-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const RC = ctx.__RC;
if (!RC) { console.error('exports missing'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

/* --- drive the engine --- */
let pass = 0, fail = 0; const fails = [], notes = [];
function check(name, fn) {
  try {
    const info = fn();
    pass++;
    if (info) notes.push(name + ': ' + info);
  } catch (e) {
    fail++; fails.push(name + ' ' + String(e.message).slice(0, 160));
  }
}
const KEY = (face, cw) => RC.key({ key: face.toLowerCase(), shiftKey: !cw, preventDefault: () => {} });

/* scenario per cube size: engine scramble (recorded) -> [n=3: one pointer-drag move]
 * -> inverse replayed through real keyboard input -> engine's own checkSolve fires */
for (const n of [2, 3, 4, 5]) {
  check('size ' + n + 'x' + n, () => {
    RC.setSize(n);
    if (RC.S.n !== n) throw new Error('setSize failed');
    RC.clr();
    RC.scramble();
    if (RC.S.anim) throw new Error('scramble animation never settled');
    if (!RC.S.scrambled) throw new Error('scramble did not set scrambled flag');
    if (RC.solved(RC.S.cube)) throw new Error('scramble left cube solved (unlucky seed)');
    let seq = RC.mv();
    const expectMoves = 20 + n * 5;
    if (seq.length < expectMoves) throw new Error('recorded scramble too short: ' + seq.length + '/' + expectMoves);
    if (n === 3) {
      /* one move through the pointer-drag path: pointerdown on an F sticker, drag right, up */
      RC.pd({ clientX: 100, clientY: 100, target: { dataset: { face: 'F' } } });
      RC.pu({ clientX: 150, clientY: 104, target: { dataset: { face: 'F' } } });
      const seq2 = RC.mv();
      if (seq2.length !== seq.length + 1) throw new Error('pointer-drag did not perform a move');
      seq = seq2;
    }
    /* replay exact inverse through the keyboard input path */
    const t0 = Date.now();
    for (let i = seq.length - 1; i >= 0; i--) {
      const m = seq[i];
      KEY(m.f, !m.cw);
      if (RC.S.anim) throw new Error('move animation stuck at step ' + i);
    }
    /* engine's OWN win detection must have fired inside the last move */
    if (!RC.solved(RC.S.cube)) throw new Error('cube not solved after inverse replay');
    if (RC.S.scrambled) throw new Error('checkSolve did not fire (scrambled flag still set)');
    const toast = elsById.get('toast');
    if (!toast || !/^Solved in \d+ moves!/.test(toast.textContent)) throw new Error('solve toast missing: ' + (toast && toast.textContent));
    const bests = JSON.parse(sandbox.localStorage.getItem('rc-bests') || '{}');
    const hist = JSON.parse(sandbox.localStorage.getItem('rc-best-' + n) || '[]');
    if (!(String(n) in bests)) throw new Error('rc-bests not persisted for n=' + n);
    if (!hist.length) throw new Error('rc-best-' + n + ' history not persisted');
    return 'solved in ' + seq.length + ' moves (' + RC.S.mc + ' counted), toast="' + toast.textContent.slice(0, 24) + '..." (' + (Date.now() - t0) + 'ms)';
  });
}

/* undo path: two keyboard moves then undo() must restore the solved cube */
check('undo restores state', () => {
  RC.setSize(3);
  RC.reset();
  RC.clr();
  KEY('U', true); KEY('R', true);
  if (RC.solved(RC.S.cube)) throw new Error('precondition: cube solved after 2 moves?');
  RC.undo(); RC.undo();
  if (!RC.solved(RC.S.cube)) throw new Error('undo x2 did not restore solved cube');
  if (RC.S.mc !== 0) throw new Error('move count not decremented');
  return 'undo verified';
});

const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL' };
if (fails.length) out.fails = fails;
console.log(SLUG + ': engine scramble + inverse replay via real key/drag input -> engine checkSolve (toast + best-time persistence) for sizes 2-5 + undo: verdict=' + out.verdict);
notes.forEach(n => console.log('  ' + n));
fails.forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
