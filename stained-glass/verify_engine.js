#!/usr/bin/env node
/* GENERATED in-engine verifier for stained-glass — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox (all top-level var/function -> globals,
 * no surgery needed). Per level 0..29: startLevel(i) generates the puzzle (seeded), render()
 * lays out state._grid; independent checks validate the generated solution is a proper
 * 4-neighbor coloring with clues>0 and clues prefilled. Then the board is played through the
 * engine's own input path: for every non-clue cell, longPressIdx=idx + handlePointerUp()
 * taps cycle -1->0->1->...->nc-1->-1 until the cell holds the generator's solution color;
 * the engine's own checkWin() -> setTimeout(doWin,200) must flip screen to 'win', unhide
 * #winScreen and persist best['L'+i] to localStorage sg_progress.
 * Fairness audit: for tiers 1-3 (<=6x6) an independent solver counts (cap 2) proper colorings
 * consistent with the clues — checkWin is EXACT match, so multiple clue-consistent colorings
 * would mean a player's valid alternate coloring can never win (reported as issue, not fail).
 * Usage: node stained-glass/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'stained-glass';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');
/* no source surgery needed: top-level var/function declarations */

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
      createBiquadFilter: () => ({ connect: () => {}, frequency: { value: 0 }, Q: { value: 0 }, type: '', gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
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
try { vm.runInContext(code, ctx, { filename: 'stained-glass-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
let pass=0,fail=0,fails=[],failIdx=[];
const notes=[];
const issues=[];
function neighbors(idx,R,C){var r=(idx/C)|0,c=idx%C,n=[];if(r>0)n.push(idx-C);if(r<R-1)n.push(idx+C);if(c>0)n.push(idx-1);if(c<C-1)n.push(idx+1);return n}
/* independent coloring counter, capped at 2 solutions / node budget */
function countColorings(sol,clues,R,C,nc){
 const total=R*C;var found=0,nodes=0;
 var grid=new Array(total).fill(-1);
 for(var i=0;i<total;i++)if(clues[i])grid[i]=sol[i];
 function ok(idx,color){var nb=neighbors(idx,R,C);for(var k=0;k<nb.length;k++)if(grid[nb[k]]===color)return false;return true}
 function rec(){
  if(found>=2)return;
  if(++nodes>3000000){found=2;/*budget: treat as non-unique*/return}
  var idx=-1;
  /* pick the most-constrained unfilled cell */
  var bestDeg=-1;
  for(var i=0;i<total;i++){if(grid[i]<0){var deg=0;var nb=neighbors(i,R,C);for(var k=0;k<nb.length;k++)if(grid[nb[k]]>=0)deg++;if(deg>bestDeg){bestDeg=deg;idx=i}}}
  if(idx<0){found++;return}
  for(var c=0;c<nc&&found<2;c++){
   if(ok(idx,c)){grid[idx]=c;rec();grid[idx]=-1}
  }
 }
 rec();
 return found;
}
for(var li=0;li<LEVELS.length;li++){
 try{
  init(); /* engine normally runs this on DOMContentLoaded; sandbox never fires it */
  startLevel(li);
  const p=state.puzzle,R=p.rows,C=p.cols,total=R*C,nc=p.numColors;
  render();
  if(!state._grid)throw new Error('render left no _grid');
  /* independent validation of the generated puzzle */
  for(var i=0;i<total;i++){
   if(p.solution[i]<0||p.solution[i]>=nc)throw new Error('solution color out of range at '+i);
   var nb=neighbors(i,R,C);
   for(var k=0;k<nb.length;k++)if(p.solution[i]===p.solution[nb[k]])throw new Error('solution not a proper coloring ('+i+'~'+nb[k]+')');
  }
  var clueCount=0;for(var i=0;i<total;i++){if(p.clues[i]){clueCount++;if(state.playerGrid[i]!==p.solution[i])throw new Error('clue '+i+' not prefilled')}}
  if(clueCount===0)throw new Error('no clues');
  /* play through the engine input path: cycle each non-clue cell to its solution color */
  let taps=0;
  for(var i=0;i<total;i++){
   if(p.clues[i])continue;
   const t=p.solution[i];
   const need=((t-nc)%(nc+1)+(nc+1))%(nc+1); /* cycle -1->0->..->nc-1->-1, start -1 */
   for(var s=0;s<need;s++){
    longPressIdx=i;
    handlePointerUp({preventDefault:function(){}});
    taps++;
    if(state.playerGrid[i]===t)break;
   }
   if(state.playerGrid[i]!==t)throw new Error('cell '+i+' cycling stuck at '+state.playerGrid[i]+' want '+t);
  }
  if(!checkWin())throw new Error('checkWin false after filling solution');
  if(state.screen!=='win')throw new Error('doWin not reached (screen='+state.screen+')');
  const ws=document.getElementById('winScreen');
  if(ws.classList.contains('hidden'))throw new Error('winScreen still hidden');
  const saved=JSON.parse(localStorage.getItem('sg_progress')||'{}');
  if(!saved.best||!saved.best['L'+li])throw new Error('level best not persisted');
  /* fairness: count clue-consistent colorings (cap 2) on small tiers */
  if(total<=36){
   const n=countColorings(p.solution,p.clues,R,C,nc);
   if(n>=2)issues.push('L'+(li+1)+' ('+R+'x'+C+', nc='+nc+', clues='+clueCount+'): >=2 valid colorings match the clues, but checkWin requires EXACT match with the stored solution — an alternate valid coloring can never win');
  }
  pass++;
  if(li===0||li===29)notes.push('L'+(li+1)+' ('+R+'x'+C+'): won with '+taps+' taps + '+clueCount+' clues, best persisted');
 }catch(e){fail++;failIdx.push(li+1);fails.push('L'+(li+1)+' EX:'+String(e.message).slice(0,90));}
}
/* persistence aggregate */
try{
 const saved=JSON.parse(localStorage.getItem('sg_progress')||'{}');
 const n=Object.keys(saved.best||{}).length;
 if(n!==LEVELS.length)throw new Error('persisted best for '+n+'/'+LEVELS.length+' levels');
 pass++;notes.push('sg_progress has best for all '+n+' levels');
}catch(e){fail++;failIdx.push(-2);fails.push('persist EX:'+String(e.message).slice(0,80));}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes,issues:issues.slice(0,8),timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' items (30 levels played via pointer color-cycling to win + persistence), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
if (result.issues && result.issues.length) { console.log('fairness issues: ' + JSON.stringify(result.issues)); }
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
