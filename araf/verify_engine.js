#!/usr/bin/env node
/* In-engine verifier for araf — spec type A (embedded-solution replay).
 * Araf rules: draw walls on cell edges to divide the grid into regions; every region must contain
 * EXACTLY 2 clues, and its area must be strictly BETWEEN the two clue numbers (> max, < sum).
 * The level data embeds `sol` = region id per cell. Items (30 levels + 3 tool-path items):
 *   1..30  per level, INDEPENDENTLY: sol partitions the grid; every region is 4-connected;
 *          exactly 2 clues per region; area > maxClue and area < sumClue. Then REPLAY through
 *          the engine's real input path: derive the wall set from sol (every internal edge whose
 *          adjacent cells have different sol ids), place each wall by firing pointerdown/up on
 *          the canvas (routed through getEdgeFromPoint -> toggleWall), then click #btn-check ->
 *          doCheck -> checkSolution().valid must be true -> onWin: state.completed[idx],
 *          localStorage araf_save, #win-overlay display:flex.
 *   31     one-wall-shy negative on a fresh L2: all walls but one -> doCheck must NOT win;
 *          final wall -> win (guards against a trivially-true checkSolution).
 *   32     hint path (2 doHint walls added from sol, rest placed manually -> win, 2 hints used).
 *   33     undo path (wrong wall placed -> invalid check, undo restores -> solve -> win) and
 *          reset path (partial walls, doReset clears -> solve -> win).
 * Usage: node araf/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'araf';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts[0];
const ANCHOR = '/* === Init === */\nloadState();';
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__ARF={L:function(){return LEVELS},load:loadLevel,walls:function(){return state.walls},S:function(){return state},chk:checkSolution,doCheck:doCheck,hint:doHint,undo:doUndo,reset:doReset,regions:computeRegions,CS:function(){return cellSize},CV:function(){return canvas}};');

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
    setPointerCapture: () => {}, releasePointerCapture: () => {},
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
  setTimeout: (fn, ms, ...args) => { try { return fn && fn(...args); } catch (e) {} return 0; }, clearTimeout: () => {},
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
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
try { vm.runInContext(code, ctx, { filename: 'araf-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const AR=window.__ARF;
let pass=0,fail=0,fails=[],notes=[];
function validateSol(lv,label){
 var n=lv.n,sol=lv.sol;
 if(sol.length!==n*n)throw new Error('sol length '+sol.length+' != '+(n*n));
 var groups={};
 for(var i=0;i<n*n;i++){var k=sol[i];(groups[k]=groups[k]||[]).push(i);}
 /* each group 4-connected and in-bounds */
 for(var k in groups){
  var cells=groups[k];
  var inSet={};cells.forEach(function(i){inSet[i]=1;});
  var seen={};seen[cells[0]]=1;var q=[cells[0]],cnt=1;
  while(q.length){
   var cur=q.shift(),r=Math.floor(cur/n),c=cur%n;
   [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(function(p){
    var rr=p[0],cc=p[1];
    if(rr<0||rr>=n||cc<0||cc>=n)return;
    var idx=rr*n+cc;
    if(inSet[idx]&&!seen[idx]){seen[idx]=1;q.push(idx);cnt++;}
   });
  }
  if(cnt!==cells.length)throw new Error('region '+k+' not 4-connected ('+cnt+'/'+cells.length+')');
 }
 /* clues: exactly 2 per region, area strictly between max and sum */
 var clueMap={};
 lv.clues.forEach(function(cl){var idx=cl[0]*n+cl[1];if(clueMap[idx]!==undefined)throw new Error('duplicate clue at '+cl);clueMap[idx]=cl[2];});
 var clueCount=0;for(var kk in clueMap)clueCount++;
 if(clueCount!==lv.clues.length)throw new Error('clue map size mismatch');
 for(var k2 in groups){
  var cl=groups[k2].filter(function(i){return clueMap[i]!==undefined;}).map(function(i){return clueMap[i];});
  if(cl.length!==2)throw new Error('region '+k2+' has '+cl.length+' clues (need exactly 2)');
  var area=groups[k2].length,mx=Math.max(cl[0],cl[1]),sm=cl[0]+cl[1];
  if(area<=mx)throw new Error('region '+k2+' area '+area+' not > max clue '+mx);
  if(area>=sm)throw new Error('region '+k2+' area '+area+' not < clue sum '+sm);
 }
 return Object.keys(groups).length;
}
function neededWalls(lv){
 var n=lv.n,sol=lv.sol,ws=[];
 for(var r=0;r<n;r++)for(var c=0;c<n;c++){
  if(c+1<n&&sol[r*n+c]!==sol[r*n+c+1])ws.push([r,c,r,c+1]);
  if(r+1<n&&sol[r*n+c]!==sol[(r+1)*n+c])ws.push([r,c,r+1,c]);
 }
 return ws;
}
function clickEdge(edge){
 var cv=AR.CV(),rect=cv.getBoundingClientRect(),cs=AR.CS();
 var px,py;
 if(edge[0]!==edge[2]){px=2+edge[1]*cs+cs/2;py=2+edge[2]*cs;} /* rows differ -> horizontal wall at row boundary y=(r2)*cs, click mid-column */
 else{px=2+edge[3]*cs;py=2+edge[0]*cs+cs/2;} /* cols differ -> vertical wall at column boundary x=(c2)*cs, click mid-row */
 var sx=cv.width/rect.width,sy=cv.height/rect.height;
 var ev={clientX:px/sx+rect.left,clientY:py/sy+rect.top,pointerId:1,preventDefault:function(){}};
 cv.fire('pointerdown',ev);
 cv.fire('pointerup',{preventDefault:function(){}});
}
function placeWalls(ws){
 ws.forEach(function(w){clickEdge(w);});
}
function doCheck(){document.getElementById('btn-check').fire('click',{});}
function hideWin(){document.getElementById('win-overlay').style.display='none';}
function playLevel(li,skipLast){
 var lv=AR.L()[li];
 var nRegions=validateSol(lv,'L'+(li+1));
 AR.load(li);
 var ws=neededWalls(lv);
 var toPlace=skipLast?ws.slice(0,ws.length-1):ws;
 placeWalls(toPlace);
 /* every placed wall present, and no other walls */
 var wallCount=0;var w=AR.walls();for(var k in w)if(w[k])wallCount++;
 if(wallCount!==toPlace.length){var miss=toPlace.filter(function(w){return !AR.walls()[w.join(',')];});var extra=[];var wq=AR.walls();for(var qk in wq){if(wq[qk]&&!toPlace.some(function(w){return w.join(',')===qk;}))extra.push(qk);}throw new Error('wall count '+wallCount+' != placed '+toPlace.length+'; missing='+JSON.stringify(miss)+' extra='+JSON.stringify(extra));}
 doCheck();
 var S=AR.S();
 if(skipLast){
  if(S.checkResult&&S.checkResult.valid)throw new Error('checkSolution accepted a one-wall-shy board');
  var ov=document.getElementById('win-overlay');
  if(ov.style.display==='flex')throw new Error('win overlay shown on incomplete board');
  clickEdge(ws[ws.length-1]);
  doCheck();
 }
 if(!S.checkResult||!S.checkResult.valid)throw new Error('checkSolution rejected the embedded solution');
 if(!S.completed[li])throw new Error('onWin did not mark level completed');
 var sv=JSON.parse(localStorage.getItem('araf_save')||'{}');
 if(!(sv.completed&&sv.completed[li]))throw new Error('completion not persisted to localStorage araf_save');
 var ov2=document.getElementById('win-overlay');
 if(ov2.style.display!=='flex')throw new Error('win overlay not shown');
 hideWin();
 return {walls:ws.length,regions:nRegions};
}
var lvls=AR.L();
if(lvls.length!==30)throw new Error('LEVELS.length='+lvls.length);
for(var li=0;li<lvls.length;li++){
 try{
  var res=playLevel(li,false);
  pass++;
  if(li===0||li===12||li===29)notes.push('L'+(li+1)+' ('+lvls[li].n+'x'+lvls[li].n+'): sol validated ('+res.regions+' regions, all 2-clue/area-between), '+res.walls+' walls placed via pointer events -> checkSolution valid -> win');
 }catch(e){fail++;fails.push('L'+(li+1)+': '+String(e.message).slice(0,120));hideWin();}
}
/* one-wall-shy negative + completion on L2 */
try{
 playLevel(1,true);
 pass++;
 notes.push('L2 one-wall-shy: doCheck correctly refused; final wall -> win');
}catch(e){fail++;fails.push('negative: '+String(e.message).slice(0,120));hideWin();}
/* hint path on L1 */
try{
 var lv=AR.L()[0];
 AR.load(0);
 AR.hint();AR.hint();
 if(AR.S().hintsUsed!==2)throw new Error('hintsUsed='+AR.S().hintsUsed);
 var ws=neededWalls(lv).filter(function(w){return !AR.walls()[w.join(',')];});
 placeWalls(ws);
 doCheck();
 if(!AR.S().completed[0])throw new Error('hint-assisted solve did not win');
 if(AR.S().hintsUsed!==2)throw new Error('hints reset during solve');
 hideWin();
 pass++;
}catch(e){fail++;fails.push('hint-path: '+String(e.message).slice(0,120));hideWin();}
/* undo path on L3: wrong wall -> invalid; undo; solve */
try{
 var lv=AR.L()[2],sol=lv.sol,n=lv.n;
 AR.load(2);
 var wrong=null;
 for(var r=0;r<n&&!wrong;r++)for(var c=0;c+1<n;c++){if(sol[r*n+c]===sol[r*n+c+1]){wrong=[r,c,r,c+1];break;}}
 if(!wrong)throw new Error('no same-region adjacent pair found');
 clickEdge(wrong);
 doCheck();
 if(AR.S().checkResult&&AR.S().checkResult.valid)throw new Error('board with a region split by a wrong wall accepted');
 if(document.getElementById('win-overlay').style.display==='flex')throw new Error('win shown on wrong-wall board');
 AR.undo();
 if(AR.walls()[wrong.join(',')])throw new Error('undo did not remove the wrong wall');
 var ws2=neededWalls(lv);
 placeWalls(ws2);
 doCheck();
 if(!AR.S().completed[2])throw new Error('post-undo solve did not win');
 hideWin();
 pass++;
}catch(e){fail++;fails.push('undo-path: '+String(e.message).slice(0,120));hideWin();}
/* reset path on L4 */
try{
 var lv=AR.L()[3];
 AR.load(3);
 clickEdge(neededWalls(lv)[0]);
 clickEdge(neededWalls(lv)[1]);
 AR.reset();
 var cnt=0;var w3=AR.walls();for(var k in w3)if(w3[k])cnt++;
 if(cnt)throw new Error('reset left '+cnt+' walls');
 placeWalls(neededWalls(lv));
 doCheck();
 if(!AR.S().completed[3])throw new Error('post-reset solve did not win');
 hideWin();
 pass++;
}catch(e){fail++;fails.push('reset-path: '+String(e.message).slice(0,120));hideWin();}
return {pass:pass,fail:fail,total:pass+fail,fails:fails,notes:notes,verdict:(fail===0?'PASS':'FAIL')};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (30 levels: sol partition/connectivity/2-clues-per-region/area-between validated + wall replay via pointer events to checkSolution win; one-wall-shy negative, hint/undo/reset paths), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
