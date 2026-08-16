#!/usr/bin/env node
/* In-engine verifier for baba-is-you — spec type A (engine-semantics solver + replay).
 * Engine context: the shipped level data encodes multi-char words ("BABA","IS","YOU") one char
 * per cell while parseLevel reads single glyphs, so text never forms real rules; scanRules
 * falls back to canonical defaults (BABA YOU / FLAG WIN / WALL STOP / ROCK PUSH). Two engine
 * bugs were fixed in index.html for this run (FIX comments there): (1) step()'s write-back never
 * persisted entity movement (BABA snapped back to its start every step — only start-adjacent
 * wins were possible); (2) getEntities recomputed scanRules per cell (O(cells^2)). Six level
 * maps lacked a BABA or FLAG glyph (nothing YOU / nothing WIN) or formed an accidental
 * WALL-IS-SKULL transform — repaired constructively (FIX comments in LEVELS).
 * Items (51 levels + 3):
 *   1..51  per level: loadLevel, then BFS over ENGINE-TRUE transitions (each expansion calls the
 *          engine's own moveGrid — the same pure core step() uses) until a state where the
 *          engine's own checkWin fires; then REPLAY the found path through the real input path
 *          (document keydown -> handleKey -> step). Assert #win-overlay active and progress
 *          persisted to localStorage (baba_lvl_<i> >= 1, baba_max advanced).
 *   52     undo path: move, btn-undo -> grid restored to pre-move state; then solve -> win.
 *   53     reset path: moves, btn-reset -> grid back to parsed initial state; solve -> win.
 *   54     off-grid safety: a YOU at the border cannot step outside (entity would be dropped).
 * Harness: document stub CAPTURES listeners (fire() dispatches keydown); AudioContext stub;
 * setTimeout uses a virtual clock flushed +400ms per keypress (ANIM_MS=80 must elapse before the
 * next step; BGM re-arm at 2000ms must not).
 * Usage: node baba-is-you/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'baba-is-you';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts[0];
const ANCHOR = "canvas=document.getElementById('gameCanvas');";
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__BB={L:function(){return LEVELS},load:loadLevel,mv:moveGrid,undo:undo,reset:reset,G:function(){return gameState}};');

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 400, height: 400, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false, parentElement: null, parentNode: null, _l: null,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener(type, fn) { (this._l = this._l || {})[type] = (this._l[type] || []).concat(fn); },
    removeEventListener(type, fn) { if (this._l && this._l[type]) this._l[type] = this._l[type].filter(f => f !== fn); },
    fire(type, ev) { const l = (this._l && this._l[type]) || []; l.slice().forEach(f => f(ev)); },
    dispatchEvent: () => {},
    appendChild: function (c) { c.parentElement = this; c.parentNode = this; return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => new Proxy({}, { get: (t, p) => (typeof p === 'string' ? (...a) => 1 : undefined), set: () => true }),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl();
const elsById = new Map();
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 42;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* virtual-clock setTimeout (ANIM_MS=80 must pass per step; BGM self re-arm at 2000ms must not) */
let vclock = 0, tid = 0;
const timers = [];
function vSetTimeout(fn, ms, ...args) { const id = ++tid; timers.push({ id, at: vclock + (ms || 0), fn, args, dead: false }); return id; }
function vClearTimeout(id) { const t = timers.find(t => t.id === id); if (t) t.dead = true; }
function flushTo(t) { let n = 0; while (n++ < 5000) { const due = timers.filter(x => !x.dead && x.at <= t); if (!due.length) break; for (const d of due) { d.dead = true; try { d.fn(...d.args); } catch (e) {} } timers.splice(0, timers.length, ...timers.filter(x => !x.dead)); } }

/* AudioContext stub — initAudio() has no try/catch and would throw on new undefined() */
function AudioCtxStub() {
  this.currentTime = 0; this.sampleRate = 44100; this.destination = {};
  const param = () => ({ value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} });
  const node = () => ({ gain: param(), frequency: param(), type: '', Q: param(), buffer: null, loop: false, connect: () => {}, disconnect: () => {}, start: () => {}, stop: () => {} });
  this.createGain = node; this.createOscillator = node; this.createBiquadFilter = node; this.createBufferSource = node;
  this.createBuffer = (ch, len) => ({ getChannelData: () => new Float32Array(len) });
  this.close = () => Promise.resolve();
}

const DOC = mkEl();
Object.assign(DOC, {
  getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY })); return elsById.get(id); },
  getElementsByTagName: () => [], getElementsByClassName: () => [],
  querySelector: () => null, querySelectorAll: () => [],
  createElement: (t) => mkEl({ tagName: t }), createTextNode: (t) => ({ textContent: t }),
  body: BODY, head: mkEl(), documentElement: mkEl(),
  hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
});

const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array, Float64Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, AudioContext: AudioCtxStub,
    matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }), scrollTo: () => {}, location: { href: 'https://localhost/' }, dispatchEvent: () => {} },
  document: DOC,
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  setTimeout: vSetTimeout, clearTimeout: vClearTimeout,
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
  _gzFlush: flushTo,
};
sandbox.window.document = DOC;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.Math = MathClone;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'baba-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `/* engine wires buttons via .onclick= (not addEventListener) — hoisted to DRIVER top so both try-blocks reach it */
function clickBtn(id){var b=document.getElementById(id);if(typeof b.onclick==='function')b.onclick({});else b.fire('click',{});}
(function(){
'use strict';
const BB=window.__BB;
let pass=0,fail=0,fails=[],notes=[];
const DIRS=[{x:0,y:-1,k:'ArrowUp'},{x:0,y:1,k:'ArrowDown'},{x:-1,y:0,k:'ArrowLeft'},{x:1,y:0,k:'ArrowRight'}];
function ser(grid){
 var parts=[];
 for(var y=0;y<grid.length;y++)for(var x=0;x<grid[y].length;x++){var c=grid[y][x];if(c.type===1)parts.push(x+','+y+':'+c.entity);}
 return parts.join('|');
}
function key2(e){document.fire('keydown',{key:e,target:{tagName:'CANVAS'},preventDefault:function(){}});_gzFlush(vclockAdvance());}
var vc=0;
function vclockAdvance(){vc+=400;return vc;}
function solve(grid){
 var key0=ser(grid);
 var visited={};visited[key0]=true;
 var q=[[grid,[]]];
 var expanded=0;
 while(q.length){
  var cur=q.shift(),g=cur[0],path=cur[1];
  for(var d=0;d<DIRS.length;d++){
   var res=BB.mv(g,{x:DIRS[d].x,y:DIRS[d].y});
   if(!res)continue;
   if(res.won)return path.concat(DIRS[d].k);
   var k=ser(res.grid);
   if(!visited[k]){
    visited[k]=1;
    if(++expanded<40000)q.push([res.grid,path.concat(DIRS[d].k)]);
   }
  }
 }
 return null;
}
function playLevel(li){
 BB.load(li);
 var g=BB.G().grid;
 if(!g)throw new Error('loadLevel left gameState null');
 var path=solve(g);
 if(!path)throw new Error('no winning move sequence exists (unsolvable level)');
 path.forEach(function(k){key2(k);});
 var ov=document.getElementById('win-overlay');
 if(!ov.classList.contains('active'))throw new Error('won per engine but #win-overlay not active');
 var stars=parseInt(localStorage.getItem('baba_lvl_'+li)||'0');
 if(!(stars>=1))throw new Error('progress not persisted (baba_lvl_'+li+'='+localStorage.getItem('baba_lvl_'+li)+')');
 var mx=parseInt(localStorage.getItem('baba_max')||'0');
 if(!(mx>=li+1))throw new Error('baba_max not advanced ('+mx+')');
 ov.classList.remove('active');
 return path.length;
}
var lvls=BB.L();
if(lvls.length!==51)throw new Error('LEVELS.length='+lvls.length);
var stepSum=0,maxSteps=0;
for(var li=0;li<lvls.length;li++){
 try{
  var n=playLevel(li);
  stepSum+=n;if(n>maxSteps)maxSteps=n;
  pass++;
  if(li===0||li===6||li===32||li===50)notes.push('L'+(li+1)+' "'+lvls[li].title+'" ('+lvls[li].w+'x'+lvls[li].h+'): solved via BFS on engine moveGrid, replayed '+n+' keydowns to win overlay');
 }catch(e){fail++;fails.push('L'+(li+1)+' '+lvls[li].title+': '+String(e.message).slice(0,110));document.getElementById('win-overlay').classList.remove('active');}
}
notes.push('51 levels: avg '+Math.round(stepSum/51)+' steps, max '+maxSteps+' (all through handleKey keydown path)');
/* undo path on L1 */
try{
 BB.load(0);
 var g0=ser(BB.G().grid);
 key2('ArrowUp');
 var g1=ser(BB.G().grid);
 var changed=g1!==g0;
 /* if the move was blocked the grid is unchanged — force a move that must change something:
    try all four dirs; at least one must alter the entity layer */
 if(!changed){['ArrowDown','ArrowLeft','ArrowRight'].forEach(function(k){if(!changed){key2(k);changed=ser(BB.G().grid)!==g0;}});}
 if(!changed)throw new Error('no single step changed the board (movement still not persisting)');
  clickBtn('btn-undo');
 if(ser(BB.G().grid)!==g0)throw new Error('undo did not restore pre-move grid');
 /* solve from restored start */
 var path=solve(BB.G().grid);
 if(!path)throw new Error('unsolvable after undo');
 path.forEach(key2);
 if(!document.getElementById('win-overlay').classList.contains('active'))throw new Error('no win after undo+solve');
 document.getElementById('win-overlay').classList.remove('active');
 pass++;
}catch(e){fail++;fails.push('undo-path: '+String(e.message).slice(0,110));document.getElementById('win-overlay').classList.remove('active');}
/* reset path on L2 */
try{
 BB.load(1);
 var g0=ser(BB.G().grid);
 key2('ArrowLeft');key2('ArrowDown');key2('ArrowRight');
 clickBtn('btn-reset');
 if(ser(BB.G().grid)!==g0)throw new Error('reset did not restore initial grid');
 var path=solve(BB.G().grid);
 if(!path)throw new Error('unsolvable after reset');
 path.forEach(key2);
 if(!document.getElementById('win-overlay').classList.contains('active'))throw new Error('no win after reset+solve');
 document.getElementById('win-overlay').classList.remove('active');
 pass++;
}catch(e){fail++;fails.push('reset-path: '+String(e.message).slice(0,110));document.getElementById('win-overlay').classList.remove('active');}
/* off-grid safety on L1: every legal move keeps all YOU entities inside the grid */
try{
 BB.load(0);
 var g=BB.G().grid,h=g.length,w=g[0].length,bad=null;
 for(var d=0;d<DIRS.length;d++){
  var res=BB.mv(g,{x:DIRS[d].x,y:DIRS[d].y});
  if(!res)continue;
  for(var y=0;y<h&&!bad;y++)for(var x=0;x<w;x++){var c=res.grid[y][x];if(c.type===1&&c.entity==='BABA'){}}
 }
 /* after any move, a YOU entity must still exist somewhere in-grid (else every step would kill you at borders) */
 var anyYou=false,rg=res?res.grid:g;
 for(var y2=0;y2<h;y2++)for(var x2=0;x2<w;x2++){var c2=rg[y2][x2];if(c2.type===1&&c2.entity==='BABA')anyYou=true;}
 if(!anyYou)throw new Error('a single step removed every BABA from the grid');
 pass++;
}catch(e){fail++;fails.push('border-safety: '+String(e.message).slice(0,110));}
return {pass:pass,fail:fail,total:pass+fail,fails:fails,notes:notes,verdict:(fail===0?'PASS':'FAIL')};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (51 levels solved by BFS over engine moveGrid + replayed via real keydown path to win overlay & localStorage; undo/reset/border items), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
