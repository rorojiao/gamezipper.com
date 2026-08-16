#!/usr/bin/env node
/* GENERATED in-engine verifier for memory-match — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox and plays each difficulty with a
 * perfect-memory player (engine's own flipCard/checkMatch chain, immediate setTimeout stub):
 * for each of 4 difficulties x 2 seeded decks: startGame() -> flip both cards of each pair
 * -> every checkMatch matches -> matched===totalPairs -> state='complete' + saveBest persists.
 * Usage: node memory-match/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'memory-match';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* no source surgery needed: functions are top-level declarations */

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
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 40,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
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

const elsById = new Map();
const timerErrors = [];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const MathClone = Object.assign(Object.create(Math), Math);

const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function () { return { createOscillator: () => ({ connect: () => {}, frequency: {}, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
      createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
      createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100 }; },
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY, parentNode: BODY })); return elsById.get(id); },
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
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) { timerErrors.push(String(e && e.message)); return 0; } },
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
  __timerErrors: timerErrors,
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
try { vm.runInContext(code, ctx, { filename: 'memory-match-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
let pass=0,fail=0,fails=[],failIdx=[],idx=0;
const notes=[];
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
for(let d=0;d<difficulties.length;d++){
 for(let trial=0;trial<2;trial++){
  idx++;
  try{
   Math.random=mul(4100+d*13+trial*101);
   selDiff=d;selTheme=trial%themeKeys.length;
   startGame();
   if(state!=='playing')throw new Error('startGame state='+state);
   if(lockBoard)throw new Error('board still locked after peek timeout');
   if(cards.length!==cols*rows)throw new Error('deck size '+cards.length);
   if((cols*rows)%2!==0)throw new Error('odd cell count');
   /* perfect-memory player: flip the two cards of each pair back-to-back */
   let guard=cards.length*cards.length+10;
   while(matched<totalPairs){
    if(guard--<0)throw new Error('flip loop guard');
    if(lockBoard)throw new Error('locked mid-play');
    let pi=-1;
    for(let i=0;i<cards.length;i++){if(!cards[i].matched&&!cards[i].flipped){pi=i;break;}}
    if(pi<0)throw new Error('no card to flip, matched='+matched+'/'+totalPairs);
    const emoji=cards[pi].emoji;
    let pj=-1;
    for(let j=0;j<cards.length;j++){if(j!==pi&&!cards[j].matched&&cards[j].emoji===emoji){pj=j;break;}}
    if(pj<0)throw new Error('pair partner missing for '+emoji);
    flipCard(pi);
    flipCard(pj);
    /* checkMatch runs synchronously through the immediate setTimeout stub */
    if(!cards[pi].matched||!cards[pj].matched)throw new Error('perfect pair failed to match');
    if(first!==null||second!==null)throw new Error('selection not cleared');
   }
   if(state!=='complete')throw new Error('state after all pairs = '+state+' (matched='+matched+'/'+totalPairs+')');
   if(moves!==totalPairs)throw new Error('perfect play moves='+moves+' expected='+totalPairs);
   const key=selDiff+'_'+selTheme;
   if(!bestScores[key]||bestScores[key].moves!==totalPairs)throw new Error('saveBest not persisted');
   notes.push(difficulties[d].name+'#'+trial+': complete OK ('+totalPairs+' pairs, '+moves+' moves)');
   pass++;
  }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' '+difficulties[d].name+'#'+trial+' EX:'+String(e.message).slice(0,80)+((typeof lockBoard!=='undefined'&&lockBoard)?' [lockBoard stuck=true]':''));}
 }
}
const te=(globalThis.__timerErrors||[]);
let rootCause=null;
if(fail>0&&te.some(function(x){return x.indexOf('comboTimer2')>=0})){
 rootCause='ENGINE BUG index.html:419 "if(comboTimer2)" references comboTimer2 which is never declared anywhere (only lines 419-420). First matched pair throws ReferenceError inside the setTimeout(checkMatch,1100) callback; checkMatch aborts before its cleanup (first=null/second=null/lockBoard=false at line 449), lockBoard stays true from line 377, every later flipCard returns at the line-370 guard -> game soft-locks after the first match. Same bug class as the "Bug #23" overlay defect documented in the engine comment at lines 253-255.';
}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes.slice(0,6),timerErrors:te.slice(0,5),rootCause:rootCause};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
if (result.rootCause) out.rootCause = result.rootCause;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' decks (perfect-memory player, 4 difficulties x 2 decks), verdict=' + out.verdict);
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
if (result.rootCause) console.log('ROOT CAUSE: ' + result.rootCause);
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
