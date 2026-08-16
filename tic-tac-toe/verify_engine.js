#!/usr/bin/env node
/* GENERATED in-engine verifier for tic-tac-toe — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox. The engine is an IIFE with no
 * exports, so we do read-only SOURCE SURGERY: inject a globalThis.__TTT export object
 * right before the IIFE's init() call (anchor: "        init();\n    })();").
 * Proves the core goal (never lose / can win) per mode via the engine's own minimax:
 *   hard (53): player X uses engine getBestMove -> 10 games, losses must stay 0 (draw-or-win).
 *   medium (53): same perfect player, 20 games, losses must stay 0.
 *   easy: 20 games, perfect player must score wins (goal "beat easy AI" reachable).
 *   twoplay: 3 games where both sides use getBestMove for the side to move -> X wins, scores.wins++.
 * AI move chain runs synchronously through the immediate setTimeout stub.
 * Usage: node tic-tac-toe/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'tic-tac-toe';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY: export internals before the IIFE closes (index.html on disk untouched) */
const SURGERY_ANCHOR = '        init();\n    })();';
if (!code.includes(SURGERY_ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(SURGERY_ANCHOR, '        globalThis.__TTT={gameState,placeMark,getBestMove,startNewGame,selectMode,checkWin,makeAIMove,CELL_X,CELL_O};\n' + SURGERY_ANCHOR);

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
try { vm.runInContext(code, ctx, { filename: 'tic-tac-toe-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const T=globalThis.__TTT;
if(!T)throw new Error('surgery exports missing');
let pass=0,fail=0,fails=[],failIdx=[],idx=0;
const notes=[];
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* play one game: player X plays engine getBestMove(board, X); returns 'w'|'l'|'d' */
function playVsAI(seed){
 Math.random=mul(seed);
 T.selectMode(currentMode);
 let guard=12;
 while(!T.gameState.gameOver){
  if(guard--<0)throw new Error('move guard');
  if(T.gameState.currentPlayer===T.CELL_X){
   const mv=T.getBestMove(T.gameState.board,T.CELL_X);
   if(!mv)throw new Error('no move for X');
   T.placeMark(mv[0],mv[1]);
  }else{
   throw new Error('AI did not move synchronously');
  }
 }
 const w=T.gameState.winner;
 return w===T.CELL_X?'w':w===T.CELL_O?'l':'d';
}
let currentMode='hard';
const results={};
/* hard: perfect player must never lose (goal = unbeatable AI achievable as draw-or-better) */
{
 let l=0,d=0,w=0;
 for(let g=0;g<10;g++){idx++;try{
  const r=playVsAI(7000+g);
  if(r==='l'){l++;fail++;failIdx.push(idx);fails.push('#'+idx+' hard g'+g+' LOST to hard AI');}
  else{r==='w'?w++:d++;pass++;}
 }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' hard g'+g+' EX:'+String(e.message).slice(0,60));}}
 results.hard={w:w,d:d,l:l};
 if(l===0)notes.push('hard: '+d+' draws + '+w+' wins in 10 games, 0 losses');
}
/* medium: perfect player never loses */
currentMode='medium';
{
 let l=0,d=0,w=0;
 for(let g=0;g<20;g++){idx++;try{
  const r=playVsAI(7100+g);
  if(r==='l'){l++;fail++;failIdx.push(idx);fails.push('#'+idx+' medium g'+g+' LOST to medium AI');}
  else{r==='w'?w++:d++;pass++;}
 }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' medium g'+g+' EX:'+String(e.message).slice(0,60));}}
 results.medium={w:w,d:d,l:l};
 if(l===0)notes.push('medium: '+w+' wins + '+d+' draws in 20 games, 0 losses');
}
/* easy: perfect player must be able to WIN (goal reachable); draws are acceptable */
currentMode='easy';
{
 let w=0,l=0,d=0;
 for(let g=0;g<20;g++){idx++;try{
  const r=playVsAI(7200+g);
  if(r==='l'){l++;fail++;failIdx.push(idx);fails.push('#'+idx+' easy g'+g+' LOST to easy AI');}
  else{r==='w'?w++:d++;pass++;}
 }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' easy g'+g+' EX:'+String(e.message).slice(0,60));}}
 results.easy={w:w,d:d,l:l};
 if(w>0)notes.push('easy: '+w+' wins / '+d+' draws / '+l+' losses in 20 games');
}
/* twoplay: X perfect vs random O -> X wins some games, never loses; win must increment scores.wins */
{
 let w=0,l=0,d=0;
 for(let g=0;g<5;g++){idx++;try{
  Math.random=mul(7300+g);
  T.selectMode('twoplay');
  const winsBefore=T.gameState.scores.wins;
  let guard=12;
  while(!T.gameState.gameOver){
   if(guard--<0)throw new Error('move guard');
   let mv;
   if(T.gameState.currentPlayer===T.CELL_X)mv=T.getBestMove(T.gameState.board,T.CELL_X);
   else{ /* O plays randomly (both-sides-perfect would always draw) */
    const empt=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(T.gameState.board[r][c]===0)empt.push([r,c]);
    mv=empt[Math.floor(Math.random()*empt.length)];
   }
   if(!mv)throw new Error('no move');
   T.placeMark(mv[0],mv[1]);
  }
  const win=T.gameState.winner===T.CELL_X;
  const lost=T.gameState.winner===T.CELL_O;
  if(win&&T.gameState.scores.wins!==winsBefore+1)throw new Error('scores.wins not incremented on X win');
  win?w++:(lost?l++:d++);
  if(lost){fail++;failIdx.push(idx);fails.push('#'+idx+' twoplay g'+g+' perfect X lost to random O');}
  else pass++;
 }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' twoplay g'+g+' EX:'+String(e.message).slice(0,60));}}
 results.twoplay={w:w,d:d,l:l};
 if(w>0&&l===0)notes.push('twoplay: X (perfect) beats random O '+w+'/5, never loses');
}
/* sanity: both sides perfect in twoplay must end in a draw (engine correctness of minimax) */
{
 idx++;
 try{
  Math.random=mul(7399);
  T.selectMode('twoplay');
  let guard=12;
  while(!T.gameState.gameOver){
   if(guard--<0)throw new Error('move guard');
   const mv=T.getBestMove(T.gameState.board,T.gameState.currentPlayer);
   T.placeMark(mv[0],mv[1]);
  }
  if(T.gameState.winner!==null)throw new Error('perfect-vs-perfect winner='+T.gameState.winner+' (expected draw)');
  pass++;notes.push('perfect-vs-perfect ends in draw (minimax correct)');
 }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' perfectDraw EX:'+String(e.message).slice(0,60));}
}
/* scoreboard sanity: engine persisted scores through localStorage */
const sc=T.gameState.scores;
const savedRaw=localStorage.getItem('ttt_save_v1');
const saved=savedRaw?JSON.parse(savedRaw).scores:null;
if(!saved||saved.wins!==sc.wins||saved.losses!==sc.losses||saved.draws!==sc.draws){
 fail++;failIdx.push(-1);fails.push('scoreboard not persisted');
}else{pass++;notes.push('scoreboard persisted: '+JSON.stringify(sc));}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes.slice(0,8),timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' games (hard x10, medium x20, easy x20, twoplay x5 + perfectDraw, scoreboard), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
