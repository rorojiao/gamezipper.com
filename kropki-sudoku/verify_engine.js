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
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
