#!/usr/bin/env node
/* GENERATED in-engine verifier for peg-solitaire — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox (top-level var/function globals, no
 * surgery). Per board 0..7: startBoard(idx), then an INDEPENDENT peg-solitaire solver
 * (DFS over jump moves with a failed-position memo table; moves mirror the engine's own
 * getValidMoves semantics: peg + adjacent peg + empty landing hole) searches for a full
 * solution reaching exactly 1 peg (the engine's win condition: checkGameState fires onWin
 * only at pegCount===1). The solution is then REPLAYED through the engine's own makeMove
 * (which runs the engine's own checkGameState -> onWin via its setTimeout chain): the
 * #win-modal must lose 'hidden', progress.boards[idx].stars must become 3, the next board
 * must unlock, and the save must persist to localStorage 'peg-solitaire-save'.
 * Unsolvable boards are proven by memoized exhaustion; a search cap hit is labeled
 * INCONCLUSIVE rather than unwinnable.
 * Usage: node peg-solitaire/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'peg-solitaire';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

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
  Error, TypeError, alert: (m) => { sandbox.__lastAlert = String(m); }, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function () { const freq = { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, cancelScheduledValues: () => {} };
      return { createOscillator: () => ({ connect: () => {}, frequency: freq, detune: freq, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
        createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
        destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100, currentTime: 0 }; },
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
try { vm.runInContext(code, ctx, { filename: 'peg-solitaire-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
if(typeof init==='function')init(); /* engine binds init on DOMContentLoaded, which the sandbox never fires */
let pass=0,fail=0,fails=[],failIdx=[];
const notes=[];
const issues=[];
const GLOBAL_DL=Date.now()+100000;
function solveBoard(rows,cols,grid0,pegs0,budgetMs){
 /* independent DFS with failed-position memo (position graph is a DAG: pegs strictly
  * decrease, so memoizing failures is sound). Moves mirror getValidMoves (index.html:693). */
 const grid=grid0.map(function(r){return r.slice()});
 const memo=new Set();
 const path=[];
 var nodes=0,hit=false;const CAP=40000000;const DL=Date.now()+budgetMs;
 const DIRS=[[-1,0],[1,0],[0,-1],[0,1]];
 function key(){
  var s='';
  for(var r=0;r<rows;r++){for(var c=0;c<cols;c++){var v=grid[r][c];s+=(v===1?'1':(v===0?'0':'.'))}s+='|'}
  return s;
 }
 function rec(pegs){
  if(pegs===1)return true;
  if(++nodes>CAP){hit=true;return false}
  if((nodes&8191)===0&&Date.now()>DL){hit=true;return false}
  if(Date.now()>GLOBAL_DL){hit=true;return false}
  const k=key();
  if(memo.has(k))return false;
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){
   if(grid[r][c]!==1)continue;
   for(var d=0;d<4;d++){
    var mr=r+DIRS[d][0],mc=c+DIRS[d][1],dr=r+DIRS[d][0]*2,dc=c+DIRS[d][1]*2;
    if(mr<0||mr>=rows||mc<0||mc>=cols||dr<0||dr>=rows||dc<0||dc>=cols)continue;
    if(grid[mr][mc]!==1||grid[dr][dc]!==0)continue;
    grid[r][c]=0;grid[mr][mc]=0;grid[dr][dc]=1;
    path.push({fromR:r,fromC:c,toR:dr,toC:dc,midR:mr,midC:mc});
    if(rec(pegs-1))return true;
    path.pop();
    grid[dr][dc]=0;grid[mr][mc]=1;grid[r][c]=1;
   }
  }
  memo.add(k);
  return false;
 }
 const ok=rec(pegs0);
 return {ok:ok,path:path,hit:hit,nodes:nodes,memo:memo.size,capKind:(nodes>CAP?'40M-node':'time')};
}
const NB=BOARDS.length;
function parityAllows(idx){
 /* 3-color invariant: coloring holes by (r-c) mod 3, every horizontal/vertical jump removes
  * one peg from each of two colors and adds one of the third, so ALL THREE peg-count
  * parities flip on every move. Reaching 1 peg takes pegs-1 moves; the required final
  * parity vector is a unit vector. Validated: English Cross (solvable) passes. */
 const b=BOARDS[idx];
 const cnt=[0,0,0];
 for(var r=0;r<b.rows;r++)for(var c=0;c<b.cols;c++){
  if(b.grid[r][c]!==1)continue;
  cnt[((r-c)%3+3)%3]++;
 }
 const P=cnt[0]+cnt[1]+cnt[2];
 const k=(P-1)&1;
 const fin=cnt.map(function(x){return (x&1)^k});
 return {ok:(fin[0]+fin[1]+fin[2])===1,par:cnt.map(function(x){return x&1}).join(''),P:P};
}
for(var idx=0;idx<NB;idx++){
 const b=BOARDS[idx];
 try{
  const t0=Date.now();
  startBoard(idx);
  if(state.currentBoard!==idx)throw new Error('startBoard did not set currentBoard');
  var pegs0=0;for(var r=0;r<state.rows;r++)for(var c=0;c<state.cols;c++)if(state.grid[r][c]===1)pegs0++;
  if(pegs0<2)throw new Error('board has <2 pegs');
  const par=parityAllows(idx);
  if(!par.ok){
   fail++;failIdx.push(idx+1);
   fails.push('B'+(idx+1)+' ('+b.name+'): UNSOLVABLE (parity proof) — 3-color peg parity '+par.par+' with '+(par.P-1)+' moves to 1 peg can never end as a unit vector; no play sequence can win');
   document.getElementById('win-modal').classList.add('hidden');
   continue;
  }
  const remaining=Math.max(4000,GLOBAL_DL-Date.now());
  const budget=Math.min((idx===NB-1?95000:18000),remaining);
  const res=solveBoard(state.rows,state.cols,state.grid,pegs0,budget);
  if(!res.ok){
   if(res.hit){fail++;failIdx.push(idx+1);fails.push('B'+(idx+1)+' ('+b.name+'): INCONCLUSIVE — solver hit '+res.capKind+' cap after '+res.nodes+' nodes / '+res.memo+' memo positions');}
   else{fail++;failIdx.push(idx+1);fails.push('B'+(idx+1)+' ('+b.name+'): UNSOLVABLE — exhaustive memoized search ('+res.nodes+' nodes, '+res.memo+' positions) proves 1 peg cannot be reached; best play always strands pegs');}
   document.getElementById('win-modal').classList.add('hidden');
   continue;
  }
  /* replay the found solution through the engine's own makeMove (runs its own
   * checkGameState -> onWin chain via the immediate setTimeout stub) */
  for(var i=0;i<res.path.length;i++){
   const m=res.path[i];
   makeMove(m.fromR,m.fromC,m.toR,m.toC,m.midR,m.midC);
  }
  if(state.pegCount!==1)throw new Error('after solution replay pegCount='+state.pegCount+' (expected 1)');
  const wm=document.getElementById('win-modal');
  if(wm.classList.contains('hidden'))throw new Error('win modal not shown after 1-peg finish (gameOver='+state.gameOver+')');
  const bd=state.progress.boards[idx];
  if(bd.stars!==3)throw new Error('stars='+bd.stars+' (expected 3 for 1 peg)');
  const raw=localStorage.getItem('peg-solitaire-save');
  if(!raw||!JSON.parse(raw).boards[idx]||JSON.parse(raw).boards[idx].stars!==3)throw new Error('save not persisted to localStorage peg-solitaire-save');
  if(idx+1<NB&&!state.progress.boards[idx+1].unlocked)throw new Error('next board not unlocked');
  pass++;
  notes.push('B'+(idx+1)+' ('+b.name+', '+pegs0+' pegs): solved in '+res.path.length+' jumps, win modal + 3 stars + unlock + save OK ('+(Date.now()-t0)+'ms, '+res.nodes+' nodes)');
  document.getElementById('win-modal').classList.add('hidden');
 }catch(e){fail++;failIdx.push(idx+1);fails.push('B'+(idx+1)+' ('+b.name+') EX:'+String(e.message).slice(0,120));document.getElementById('win-modal').classList.add('hidden');}
}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,10),verdict:fail===0?'PASS':'FAIL',notes:notes,issues:issues,timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' boards (independent memoized solver + replay through engine makeMove -> win modal/3 stars/unlock/save), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).slice(0, 10).forEach(f => console.log('  FAIL ' + f));
if (result.issues && result.issues.length) console.log('issues: ' + JSON.stringify(result.issues));
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
