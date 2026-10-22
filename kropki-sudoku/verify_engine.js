#!/usr/bin/env node
/* GENERATED in-engine verifier for kropki-sudoku — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox, applies each level's embedded
 * solution through the engine's own APIs, and asserts the win predicate.
 * Per level: loadLevel(i); G.board = L.solution; checkWin() sets G.finished; plus independent kropki dot checks (1=consecutive, 2=double) against solution; dot-0 anomalies counted as warnDot0.
 * Usage: node kropki-sudoku/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* no source surgery needed */

function mkAny() {
  const f = function () { return anyP; };
  const anyP = new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === 'length') return 0;
      if (!(p in t)) t[p] = mkAny();
      return t[p];
    },
    set() { return true; },
    apply() { return anyP; },
  });
  return anyP;
}

function mkEl(extra) {
  const el = {
    id: '', className: '', style: {}, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}

const BODY = mkEl();
const DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL;
DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;

function ImageStub() { const o = { width: 0, height: 0, onload: null, onerror: null, addEventListener: () => {} }; let _src = ''; Object.defineProperty(o, 'src', { get: () => _src, set: (v) => { _src = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; }

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function () { return { createOscillator: () => ({ connect: () => {}, frequency: {}, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
      createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
      createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100 }; },
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
  },
  document: {
    getElementById: (id) => mkEl({ id, parentElement: BODY, parentNode: BODY }),
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete',
    cookie: '',
  },
  adsbygoogle: { push: () => {} },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { return 0; } },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.setInterval = sandbox.setInterval;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.message); process.exit(1); }

const DRIVER = "(function(){\nlet pass=0,fail=0,fails=[],failIdx=[],warnDot0=0;\nfor(let i=0;i<LEVELS.length;i++){const L=LEVELS[i];let why='';\n try{\n  loadLevel(i);\n  G.board=L.solution.map(function(r){return r.slice();});\n  let givensOK=true,dotsOK=true;\n  for(let r=0;r<L.n;r++)for(let c=0;c<L.n;c++){if(L.puzzle[r][c]&&L.puzzle[r][c]!==L.solution[r][c]){givensOK=false;why='given@'+r+','+c;}}\n  function rel(a,b){const cons=Math.abs(a-b)===1;const dbl=(a===2*b||b===2*a);return {cons:cons,dbl:dbl};}\n  for(let r=0;r<L.n;r++)for(let c=0;c<L.n-1;c++){const d=L.hdots[r][c];if(d===undefined)continue;const rr=rel(L.solution[r][c],L.solution[r][c+1]);\n   if(d===1&&!rr.cons){dotsOK=false;why='hdot1@'+r+','+c;} if(d===2&&!rr.dbl){dotsOK=false;why='hdot2@'+r+','+c;} if(d===0&&(rr.cons||rr.dbl))warnDot0++;}\n  for(let r=0;r<L.n-1;r++)for(let c=0;c<L.n;c++){const d=L.vdots[r][c];if(d===undefined)continue;const rr=rel(L.solution[r][c],L.solution[r+1][c]);\n   if(d===1&&!rr.cons){dotsOK=false;why='vdot1@'+r+','+c;} if(d===2&&!rr.dbl){dotsOK=false;why='vdot2@'+r+','+c;} if(d===0&&(rr.cons||rr.dbl))warnDot0++;}\n  checkWin();\n  if(G.finished===true&&givensOK&&dotsOK)pass++;else{fail++;failIdx.push(i+1);fails.push('L'+(i+1)+(G.finished===true?'':' noWin')+(givensOK?' ':' '+why)+(dotsOK?' ':' dot:'+why));}\n }catch(e){fail++;failIdx.push(i+1);fails.push('L'+(i+1)+' EX:'+String(e.message).slice(0,60));}\n}\nreturn {pass:pass,fail:fail,total:LEVELS.length,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',warnDot0:warnDot0};\n})()";

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
if (result.info) console.log(result.info);
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
for (const k of ['warnDot0', 'extra']) if (result[k] !== undefined) out[k] = result[k];
console.log('kropki-sudoku in-engine verification: ' + out.pass + '/' + out.total + ' levels, verdict=' + out.verdict);

/* ==================================================================== *
 * R329 — UNIQUENESS GATE.
 *
 * Everything above is VACUOUS with respect to uniqueness: it injects the
 * STORED solution and checks it wins. It therefore cannot detect a
 * multi-solution level -- and this game's checkWin() is a pure
 * solution-compare (`board[r][c] !== solution[r][c]`), so uniqueness is
 * load-bearing. The page claims "each puzzle has a unique solution verified
 * by an independent solver"; that claim was FALSE for 9 of 27 levels while
 * this gate reported PASS. A no-op gate (Pitfall #62) wearing a PASS costume.
 *
 * The counter below is INDEPENDENT of the engine sandbox: it re-implements
 * the rule from the level data (latin square + boxes + kropki dots), stops
 * at 2 solutions, and re-validates every grid it emits with a from-scratch
 * validator before counting it. If the counter ever emits an invalid grid it
 * exits 3, because that means the COUNTER is wrong -- not the data.
 *
 * Negative test that licenses trusting it:
 *   node verify_engine.js <pre-fix index.html>   -> must FAIL on those 9 levels
 * ==================================================================== */
function extractLevels(h) {
  const i = h.indexOf('var LEVELS=');
  if (i < 0) return null;
  const s = h.indexOf('[', i);
  let depth = 0, j = s;
  for (; j < h.length; j++) {
    if (h[j] === '[') depth++;
    else if (h[j] === ']') { depth--; if (depth === 0) break; }
  }
  return JSON.parse(h.slice(s, j + 1));
}

function countSolutions(L, limit) {
  const n = L.n, br = L.box_r, bc = L.box_c;
  const idx = new Map();
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { idx.set(r + ',' + c, cells.length); cells.push(r * n + c); }
  const peers = cells.map(function (i) {
    const r = Math.floor(i / n), c = i % n, p = new Set();
    for (let k = 0; k < n; k++) {
      p.add(idx.get(r + ',' + k));
      p.add(idx.get(k + ',' + c));
      // Map.get takes ONE argument -- idx.get(a, b) silently returns
      // idx.get(String(a)), i.e. undefined, which drops box peers and lets an
      // invalid grid through. Always build the key explicitly.
      const br2 = Math.floor(r / br) * br + Math.floor(k / bc);
      const bc2 = Math.floor(c / bc) * bc + (k % bc);
      p.add(idx.get(String(br2) + ',' + String(bc2)));
    }
    p.delete(i); // a cell is never its own peer
    return p;
  });
  const cons = new Map(cells.map(function (i) { return [i, []]; }));
  const link = function (a, b, d) { cons.get(a).push({ o: b, d: d }); cons.get(b).push({ o: a, d: d }); };
  for (let r = 0; r < n; r++) for (let c = 0; c < n - 1; c++) { const d = L.hdots[r][c]; if (d) link(idx.get(r + ',' + c), idx.get(r + ',' + (c + 1)), d); }
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n; c++) { const d = L.vdots[r][c]; if (d) link(idx.get(r + ',' + c), idx.get((r + 1) + ',' + c), d); }
  const dotOk = function (a, b, d) { return d === 1 ? Math.abs(a - b) === 1 : (a === 2 * b || b === 2 * a); };

  const dom = new Map(cells.map(function (i) { return [i, new Set(Array.from({ length: n }, function (_, k) { return k + 1; }))]; }));
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (L.puzzle[r][c]) { const k = idx.get(r + ',' + c); dom.get(k).clear(); dom.get(k).add(L.puzzle[r][c]); }

  const asg = new Map(), out = [];
  const ok = function (i, v) {
    if (!dom.get(i).has(v)) return false;
    for (const p of peers[i]) if (asg.get(p) === v) return false;
    for (const cn of cons.get(i)) { const w = asg.get(cn.o); if (w !== undefined && !dotOk(v, w, cn.d)) return false; }
    return true;
  };
  const bt = function () {
    if (out.length >= limit) return;
    let best = null, bd = null;
    for (const i of cells) {
      if (asg.has(i)) continue;
      const d = new Set(Array.from(dom.get(i)).filter(function (v) { return ok(i, v); }));
      if (!d.size) return;
      if (!bd || d.size < bd.size) { best = i; bd = d; if (bd.size === 1) break; }
    }
    if (best === null) {
      const g = [];
      for (let r = 0; r < n; r++) g.push(cells.slice(r * n, (r + 1) * n).map(function (i) { return asg.get(i); }));
      out.push(g);
      return;
    }
    for (const v of Array.from(bd).sort(function (a, b) { return a - b; })) {
      asg.set(best, v); bt(); asg.delete(best);
      if (out.length >= limit) return;
    }
  };
  bt();
  return out;
}

function validateGrid(g, L) {
  const n = L.n, br = L.box_r, bc = L.box_c;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!(g[r][c] >= 1 && g[r][c] <= n)) return 'value out of range';
  for (let r = 0; r < n; r++) if (new Set(g[r]).size !== n) return 'row ' + r;
  for (let c = 0; c < n; c++) { const s = new Set(); for (let r = 0; r < n; r++) s.add(g[r][c]); if (s.size !== n) return 'col ' + c; }
  for (let r0 = 0; r0 < n; r0 += br) for (let c0 = 0; c0 < n; c0 += bc) {
    const s = new Set();
    for (let r = r0; r < r0 + br; r++) for (let c = c0; c < c0 + bc; c++) s.add(g[r][c]);
    if (s.size !== n) return 'box ' + r0 + ',' + c0;
  }
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (L.puzzle[r][c] && L.puzzle[r][c] !== g[r][c]) return 'given ' + r + ',' + c;
  for (let r = 0; r < n; r++) for (let c = 0; c < n - 1; c++) { const d = L.hdots[r][c]; if (!d) continue; const a = g[r][c], b = g[r][c + 1]; if (!(d === 1 ? Math.abs(a - b) === 1 : a === 2 * b || b === 2 * a)) return 'hdot ' + r + ',' + c; }
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n; c++) { const d = L.vdots[r][c]; if (!d) continue; const a = g[r][c], b = g[r + 1][c]; if (!(d === 1 ? Math.abs(a - b) === 1 : a === 2 * b || b === 2 * a)) return 'vdot ' + r + ',' + c; }
  return null;
}

const CATALOG = process.argv[2] || path.join(SLUG_DIR, 'index.html');
const LEVELS2 = extractLevels(fs.readFileSync(CATALOG, 'utf8'));
if (!LEVELS2) { console.error('LEVELS not found in ' + CATALOG); process.exit(2); }
const u = { pass: 0, multi: [], zero: [], storedBad: [] };
for (const L of LEVELS2) {
  const sv = validateGrid(L.solution, L);
  if (sv) { u.storedBad.push({ id: L.id, why: sv }); continue; }
  const sols = countSolutions(L, 2);
  for (const g of sols) {
    const bad = validateGrid(g, L);
    if (bad) { console.error('L' + L.id + ' counter emitted an INVALID grid (' + bad + ') -- the COUNTER is wrong'); process.exit(3); }
  }
  if (sols.length === 0) u.zero.push(L.id);
  else if (sols.length >= 2) u.multi.push(L.id);
  else u.pass++;
}
const uniqOK = u.multi.length === 0 && u.zero.length === 0 && u.storedBad.length === 0;
console.log('  in-engine (stored solution loads, dots hold, checkWin fires): ' + out.pass + '/' + out.total + (out.fail === 0 ? ' OK' : ' FAIL ' + JSON.stringify(out.failIdx)));
console.log('  stored solution invalid : ' + (u.storedBad.length ? JSON.stringify(u.storedBad) : 'none'));
console.log('  unique solution         : ' + u.pass + '/' + LEVELS2.length);
console.log('  MULTI-solution levels   : ' + (u.multi.length ? JSON.stringify(u.multi) : 'none'));
console.log('  UNSOLVABLE levels       : ' + (u.zero.length ? JSON.stringify(u.zero) : 'none'));
const finalVerdict = (out.fail === 0 && uniqOK) ? 'PASS' : 'FAIL';
console.log('  verdict=' + finalVerdict);
console.log(JSON.stringify({ inEngine: out.pass, total: LEVELS2.length, unique: u.pass, multi: u.multi, zero: u.zero, storedBad: u.storedBad, verdict: finalVerdict }));
process.exit(finalVerdict === 'PASS' ? 0 : 1);
