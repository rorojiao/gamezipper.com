#!/usr/bin/env node
/* GENERATED in-engine verifier for parking-jam — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox, applies each level's embedded
 * solution through the engine's own APIs, and asserts the win predicate.
 * Per level: startLevel(i); apply L.solution exit order via engine canCarExit() legality then mark exited; checkAllExited() must be true.
 * Usage: node parking-jam/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
const SURGERY = [
 [
  "function canCarExit(carIdx){",
  "window.__VE_park=function(){return {LEVELS:LEVELS,startLevel:startLevel,canCarExit:canCarExit,checkAllExited:checkAllExited,gridCars:function(){return gridCars;}};};\nfunction canCarExit(carIdx){"
 ]
];
for (const [find, repl] of SURGERY) {
  if (!code.includes(find)) { console.error('surgery anchor missing: ' + JSON.stringify(find.slice(0, 50))); process.exit(1); }
  code = code.replace(find, repl);
}


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

const DRIVER = "(function(){\nconst VE=window.__VE_park;let pass=0,fail=0,fails=[],failIdx=[];\nlet totCars=0,totDec=0,degenerate=[];\nfor(let i=0;i<VE().LEVELS.length;i++){const L=VE().LEVELS[i];\n try{\n  VE().startLevel(i);\n  const gc=VE().gridCars();\n  let seqOK=true,why='';\n  for(let s=0;s<L.solution.length;s++){const ci=L.solution[s];\n   if(!VE().canCarExit(ci)){seqOK=false;why='car'+ci+'@step'+s;break;}\n   gc[ci].exited=true;}\n  const allOut=VE().checkAllExited()===true;\n  /* R325 P0 REGRESSION GATE.\n   * The shipped catalog used to hold exactly ONE car on all 30 levels, and canCarExit()\n   * additionally pinned every car to a single exit lane, so the only shippable level was a\n   * single car: one tap, no ordering, and the advertised 'clear all cars in the right order'\n   * mechanic never happened. A verifier that only replays level.solution[] cannot see that --\n   * a one-car level replays perfectly. So also assert, using the engine's OWN canCarExit, that\n   * the ordering constraint is real: at t=0 the movable cars must be a STRICT subset. */\n  VE().startLevel(i);\n  const gc0=VE().gridCars();\n  let openAt0=0;\n  for(let ci=0;ci<gc0.length;ci++){ if(VE().canCarExit(ci)) openAt0++; }\n  totCars+=gc0.length; totDec+=(gc0.length-openAt0);\n  if(gc0.length<2||openAt0>=gc0.length){ degenerate.push('L'+(i+1)+' cars='+gc0.length+' openAt0='+openAt0); }\n  if(seqOK&&allOut)pass++;else{fail++;failIdx.push(i+1);fails.push('L'+(i+1)+(seqOK?'':' '+why)+(allOut?'':' notAllExited'));}\n }catch(e){fail++;failIdx.push(i+1);fails.push('L'+(i+1)+' EX:'+String(e.message).slice(0,60));}\n}\nreturn {pass:pass,fail:fail,total:VE().LEVELS.length,failIdx:failIdx,fails:fails.slice(0,15),\n        extra:{cars:totCars,decisionPoints:totDec,degenerateLevels:degenerate.length},verdict:fail===0&&degenerate.length===0?'PASS':'FAIL'};\n})()";

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
if (result.info) console.log(result.info);
/* R325: the exit code must follow the driver's OWN verdict, not just the replay count.
 * A one-car level replays its solution perfectly, so `fail === 0` alone cannot see the
 * degeneracy; the driver also reports extra.degenerateLevels. Wiring only `fail` here made
 * the gate report FAIL while still exiting 0 -- i.e. it could never fail a build, which is the
 * no-op-gate defect in its purest form. Verified with a negative test: pointing the verifier at
 * the old catalog now exits 1. */
const extra = result.extra || {};
const degenerate = Array.isArray(extra.degenerateLevels) ? extra.degenerateLevels.length
                : (extra.degenerateLevels || 0);
const failed = result.fail > 0 || degenerate > 0 || result.verdict !== 'PASS';
const out = {
  pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [],
  verdict: failed ? 'FAIL' : 'PASS',
};
if (result.fails && result.fails.length) out.fails = result.fails;
if (extra.cars !== undefined) out.cars = extra.cars;
if (extra.decisionPoints !== undefined) out.decisionPoints = extra.decisionPoints;
out.degenerateLevels = degenerate;
if (degenerate) {
  out.degenerateSample = Array.isArray(extra.degenerateLevels)
    ? extra.degenerateLevels.slice(0, 6) : undefined;
  console.error('DEGENERATE CATALOG: ' + degenerate + ' level(s) have <2 cars or no ordering ' +
    'constraint (R325 P0 regression): ' + JSON.stringify(out.degenerateSample || ''));
}
for (const k of ['warnDot0']) if (result[k] !== undefined) out[k] = result[k];
console.log('parking-jam in-engine verification: ' + out.pass + '/' + out.total + ' levels, verdict=' + out.verdict);
console.log(JSON.stringify(out));
process.exit(failed ? 1 : 0);
