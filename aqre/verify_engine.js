#!/usr/bin/env node
/* In-engine verifier for aqre — spec type A (embedded-solution replay).
 * Loads index.html inline script into a vm sandbox; requestAnimationFrame runs synchronously so
 * layoutCanvas/draw execute. Per level 0..23:
 *   1. the embedded `solution` is INDEPENDENTLY validated vs the engine's own win predicate
 *      (rooms tile the grid without overlap; no 3 consecutive blacks in any row/col; every clued
 *      room's black count == clue; nBlack metadata consistent);
 *   2. the level is PLAYED through the engine's real interaction path onPointer (tap every
 *      solution-black cell with a synthetic pointer event routed through cellFromEvent);
 *      checkWin must fire onWin: ovWin overlay shown, SAVE.progress[idx] persisted to
 *      localStorage aqre_progress_v1.
 * Extra items: hint path (3 useHint reveals then solve), undo/reset path on level 1.
 * Usage: node aqre/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'aqre';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
const ANCHOR = "document.body.removeEventListener('pointerdown',init);},{once:true});";
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__AQ={G:function(){return G},start:startLevel,L:function(){return LEVELS},CW:checkWin,P:onPointer,H:useHint,U:undo,RS:reset,SV:function(){return SAVE}};');

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], width: 400, height: 400, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false, parentElement: null, parentNode: null,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    appendChild: function (c) { c.parentElement = this; c.parentNode = this; return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => new Proxy({}, { get: (t, p) => (typeof p === 'string' && p !== 'fillStyle' ? (...a) => 1 : undefined), set: () => true }),
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

const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }), scrollTo: () => {}, location: { href: 'https://localhost/' }, dispatchEvent: () => {} },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY })); return elsById.get(id); },
    getElementsByTagName: () => [], getElementsByClassName: () => [],
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t }), createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) {} return 0; }, clearTimeout: () => {},
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: (fn) => { try { fn && fn(); } catch (e) {} return 0; }, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.Math = MathClone;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'aqre-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const AQ=window.__AQ;
let pass=0,fail=0,fails=[],notes=[];
function validate(lvl,label){
 var rows=lvl.rows,cols=lvl.cols,sol=lvl.solution;
 if(!sol||sol.length!==rows*cols)throw new Error('bad solution length');
 var seen=new Array(rows*cols).fill(0);
 lvl.rooms.forEach(function(rm){
  if(rm.length!==4)throw new Error('bad room spec');
  for(var r=rm[0];r<=rm[2];r++)for(var c=rm[1];c<=rm[3];c++){
   if(r<0||r>=rows||c<0||c>=cols)throw new Error('room out of grid');
   if(seen[r*cols+c])throw new Error('rooms overlap at '+r+','+c);
   seen[r*cols+c]=1;
  }
 });
 var zeros=seen.filter(function(s){return !s}).length;
 if(zeros)throw new Error('rooms do not tile grid ('+zeros+' uncovered)');
 for(var r=0;r<rows;r++)for(var c=0;c+2<cols;c++){
  if(sol[r*cols+c]===1&&sol[r*cols+c+1]===1&&sol[r*cols+c+2]===1)throw new Error('3-black run row '+r+','+c);
 }
 for(var c=0;c<cols;c++)for(var r=0;r+2<rows;r++){
  if(sol[r*cols+c]===1&&sol[(r+1)*cols+c]===1&&sol[(r+2)*cols+c]===1)throw new Error('3-black run col '+r+','+c);
 }
 Object.keys(lvl.clues).forEach(function(k){
  var rm=lvl.rooms[+k];var cnt=0;
  for(var r=rm[0];r<=rm[2];r++)for(var c=rm[1];c<=rm[3];c++)if(sol[r*cols+c]===1)cnt++;
  if(cnt!==lvl.clues[k])throw new Error('room '+k+' has '+cnt+' blacks, clue '+lvl.clues[k]);
  if(cnt>(rm[2]-rm[0]+1)*(rm[3]-rm[1]+1))throw new Error('clue exceeds room size');
 });
 var nb=sol.filter(function(v){return v===1}).length;
 if(nb!==lvl.nBlack)throw new Error('nBlack metadata '+lvl.nBlack+' != actual '+nb);
}
function tap(r,c){
 var G=AQ.G();
 var cs=G.cs,W=G.W;
 var xc=c*cs+cs/2,yc=r*cs+cs/2;
 var rect={left:0,top:0,width:400,height:400};
 var sx=Gcanvas().width/rect.width,sy=Gcanvas().height/rect.height;
 AQ.P({clientX:xc/sx,clientY:yc/sy,preventDefault:function(){}});
}
function Gcanvas(){return document.getElementById('board');}
function playLevel(li,label){
 var lvl=AQ.L()[li];
 validate(lvl,label);
 AQ.start(li);
 var G=AQ.G();
 if(G.lvl!==lvl)throw new Error('startLevel did not load level');
 var n=0;
 for(var i=0;i<lvl.solution.length;i++){
  if(lvl.solution[i]===1){tap(Math.floor(i/lvl.cols),i%lvl.cols);n++;}
 }
 if(!G.won)throw new Error('embedded solution tapped via onPointer did not reach onWin');
 var ov=document.getElementById('ovWin');
 if(!ov.classList.contains('show'))throw new Error('won but ovWin overlay not shown');
 var sv=JSON.parse(localStorage.getItem('aqre_progress_v1')||'{}');
 var prog=(sv.progress||{})[li];
 if(!prog||!prog.stars)throw new Error('win not persisted to aqre_progress_v1 progress['+li+']');
 ov.classList.remove('show');
 return {taps:n,stars:prog.stars};
}
var lvls=AQ.L();
if(lvls.length!==24)throw new Error('LEVELS.length='+lvls.length);
for(var li=0;li<lvls.length;li++){
 try{
  var res=playLevel(li,'L'+(li+1));
  pass++;
  if(li===0||li===23)notes.push('L'+(li+1)+' ('+lvls[li].rows+'x'+lvls[li].cols+' '+lvls[li].tier+'): won via '+res.taps+' onPointer taps, stars='+res.stars);
 }catch(e){fail++;fails.push('L'+(li+1)+': '+String(e.message).slice(0,120));document.getElementById('ovWin').classList.remove('show');}
}
/* extra: hint path — 3 useHint reveals then solve via taps */
try{
 var lvl=AQ.L()[0];
 AQ.start(0);
 var G=AQ.G();
 AQ.H();AQ.H();AQ.H();
 if(G.hintsUsed!==3)throw new Error('hintsUsed='+G.hintsUsed);
 for(var i=0;i<lvl.solution.length;i++)if(lvl.solution[i]===1&&G.states[i]!==1)tap(Math.floor(i/lvl.cols),i%lvl.cols);
 if(!G.won)throw new Error('hint-assisted solve did not win');
 if(G.hintsUsed!==3)throw new Error('hints reset during solve');
 document.getElementById('ovWin').classList.remove('show');
 pass++;
}catch(e){fail++;fails.push('hint-path: '+String(e.message).slice(0,120));document.getElementById('ovWin').classList.remove('show');}
/* extra: undo/reset path — tap wrong cells, undo one, reset board, then solve */
try{
 var lvl=AQ.L()[0];
 AQ.start(0);
 var G=AQ.G();
 tap(0,0);tap(0,1);
 AQ.U();
 if(G.history.length!==1)throw new Error('undo did not pop history');
 AQ.RS();
 if(G.states.some(function(s){return s===1}))throw new Error('reset left black cells');
 for(var i=0;i<lvl.solution.length;i++)if(lvl.solution[i]===1)tap(Math.floor(i/lvl.cols),i%lvl.cols);
 if(!G.won)throw new Error('post-reset solve did not win');
 document.getElementById('ovWin').classList.remove('show');
 pass++;
}catch(e){fail++;fails.push('undo-reset-path: '+String(e.message).slice(0,120));document.getElementById('ovWin').classList.remove('show');}
return {pass:pass,fail:fail,total:pass+fail,fails:fails,notes:notes,verdict:(fail===0?'PASS':'FAIL')};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (24 levels: embedded solution validated vs tiling/no-3-run/room-count + played via onPointer to onWin; hint & undo/reset paths), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
