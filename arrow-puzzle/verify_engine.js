#!/usr/bin/env node
/* GENERATED in-engine verifier for arrow-puzzle — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox (all top-level var/function -> globals,
 * no surgery needed). Per level (30 seeded levels + daily): startLevel(L,{rng}) gives a
 * deterministic lights-out board; independent solver enumerates the 4^N first-row tap patterns
 * and chases the residual down the rows (tap[r][c] forced by residual of (r-1,c)); apply the
 * found solution through the engine's own doTap(r,c,false) -> isSolved -> onWin must set
 * G.won, State.save.cleared[id], advance unlockedLevel, and persist.
 * Usage: node arrow-puzzle/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'arrow-puzzle';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY: engine is one big IIFE; export internals next to its own dispose export */
const SURGERY_ANCHOR = 'window.ArrowPuzzleDispose = dispose;';
if (!code.includes(SURGERY_ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(SURGERY_ANCHOR, SURGERY_ANCHOR + '\nwindow.__AP={getG:function(){return G},getState:function(){return State},startLevel:startLevel,doTap:doTap,playDaily:playDaily,getLevels:function(){return LEVELS},dirOf:dirOf,isSolved:isSolved,todayKey:todayKey};');

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
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
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
  Image: ImageStub, XMLSerializer: function () { return { serializeToString: () => '' }; },
  CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function () { return { createOscillator: () => ({ connect: () => {}, frequency: {}, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
      createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
      createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100 }; },
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, scrollTo: () => {}, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
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
    createElementNS: (ns, t) => mkEl({ tagName: t, namespaceURI: ns, parentElement: BODY, parentNode: BODY }),
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
try { vm.runInContext(code, ctx, { filename: 'arrow-puzzle-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const AP=window.__AP;
if(!AP)throw new Error('surgery exports missing');
let pass=0,fail=0,fails=[],failIdx=[];
const notes=[];
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function solveBoard(tiles,N,dirOfFn){
 /* returns tap-count grid (0..3) or null; enumerates 4^N first-row patterns then chases */
 const orig=[];
 for(let r=0;r<N;r++){orig.push([]);for(let c=0;c<N;c++)orig[r].push(dirOfFn(tiles[r][c]));}
 const D=[[0,0],[-1,0],[1,0],[0,-1],[0,1]];
 const add=function(st,r,c,v){for(let d=0;d<5;d++){const nr=r+D[d][0],nc=c+D[d][1];if(nr>=0&&nr<N&&nc>=0&&nc<N)st[nr][nc]=(st[nr][nc]+v)%4;}}
 let patterns=1;for(let c=0;c<N;c++)patterns*=4;
 for(let p=0;p<patterns;p++){
  const st=[];for(let r=0;r<N;r++){st.push(orig[r].slice());}
  const taps=[];for(let r=0;r<N;r++)taps.push(new Array(N).fill(0));
  let q=p;
  for(let c=0;c<N;c++){const v=q%4;q=(q/4)|0;if(v){add(st,0,c,v);taps[0][c]=v;}}
  let dead=false;
  for(let r=1;r<N&&!dead;r++){
   for(let c=0;c<N;c++){
    const v=(4-st[r-1][c])%4;
    if(v){add(st,r,c,v);taps[r][c]=v;}
   }
   for(let c=0;c<N;c++)if(st[r-1][c]!==0){dead=true;break;}
  }
  if(dead)continue;
  let ok=true;for(let r=0;r<N&&ok;r++)for(let c=0;c<N;c++)if(st[r][c]!==0){ok=false;break;}
  if(ok)return taps;
 }
 return null;
}
AP.getState().save.tutSeen=true;
const LEVELS=AP.getLevels();
for(let i=0;i<LEVELS.length;i++){
 const L=LEVELS[i];
 try{
  AP.startLevel(L,{rng:mul(L.id*7717+3)});
  const G=AP.getG();
  const N=G.N;
  if(!G.grid||G.grid.length!==N)throw new Error('no grid');
  if(AP.isSolved(G.grid,N))throw new Error('generated board already solved');
  const taps=solveBoard(G.grid,N,AP.dirOf);
  if(!taps)throw new Error('NO SOLUTION for '+N+'x'+N+' board');
  let tapsUsed=0;
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
   for(let k=0;k<taps[r][c];k++){AP.doTap(r,c,false);tapsUsed++;}
  }
  if(!G.won)throw new Error('engine did not register win');
  if(!AP.isSolved(G.grid,N))throw new Error('board not solved after taps');
  if(AP.getState().save.cleared[L.id]!==true)throw new Error('level not cleared');
  const expUnlock=Math.min(30,L.id+1);
  if((AP.getState().save.unlockedLevel||1)<expUnlock)throw new Error('unlock not advanced: '+AP.getState().save.unlockedLevel+'<'+expUnlock);
  pass++;
  if(L.id===1||L.id===30)notes.push('L'+L.id+' ('+N+'x'+N+'): solved '+tapsUsed+' taps, cleared=true');
 }catch(e){fail++;failIdx.push(L.id);fails.push('L'+L.id+' EX:'+String(e.message).slice(0,80));}
}
/* daily */
try{
 AP.playDaily();
 const G=AP.getG();
 const N=G.N;
 const taps=solveBoard(G.grid,N,AP.dirOf);
 if(!taps)throw new Error('daily NO SOLUTION');
 for(let r=0;r<N;r++)for(let c=0;c<N;c++)for(let k=0;k<taps[r][c];k++)AP.doTap(r,c,false);
 if(!G.won)throw new Error('daily win not registered');
 if(!AP.getState().save.dailyDone[AP.todayKey()])throw new Error('daily not marked done');
 pass++;
 notes.push('daily '+N+'x'+N+' solved, dailyDone[today]=true');
}catch(e){fail++;failIdx.push(99);fails.push('daily EX:'+String(e.message).slice(0,80));}
/* persistence */
try{
 const raw=localStorage.getItem('arrowPuzzle_v1');
 const sv=raw?JSON.parse(raw):null;
 if(!sv)throw new Error('no save');
 const clearedCount=Object.keys(sv.cleared).length;
 if(clearedCount<30)throw new Error('persisted cleared='+clearedCount);
 pass++;
 notes.push('persisted: '+clearedCount+'/30 cleared, unlockedLevel='+sv.unlockedLevel+', stars total='+Object.values(sv.stars).reduce(function(a,b){return a+b},0));
}catch(e){fail++;failIdx.push(100);fails.push('persist EX:'+String(e.message).slice(0,80));}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes,timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' items (30 seeded levels solved by independent chase solver + daily + persistence), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
