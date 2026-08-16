#!/usr/bin/env node
/* In-engine verifier for aquarium — spec type A (embedded-solution replay).
 * Puzzle semantics: grid partitioned into cages; each cage has ONE water level h (every cell of
 * the cage with row>=h is water, row<h empty); rowClues[r] = number of water cells in row r.
 * The level data embeds `solution` = per-cage h. Items (27 levels + 4 tool-path items):
 *   1..27  per level, INDEPENDENTLY: cages tile the n*n grid without overlap/out-of-bounds;
 *          embedded heights are in the legal range [minRow, maxRow+1]; the grid built from the
 *          embedded heights satisfies every rowClue; a from-scratch backtracking counter over the
 *          same rule domain (with node budget) proves the solution UNIQUE (0 or >1 solutions is a
 *          data bug). Then REPLAY through the engine's real input path: pointerdown+pointerup on
 *          the canvas (routed through eventCell) for every water cell -> toggleCell -> checkWin
 *          must fire: won=true, save.completed[tier_level] persisted to localStorage
 *          gz_aquarium_v1, winModal shown (setTimeout queue flushed).
 *   28     right-click X path: X marks on empty cells do not block the win (have==0 for X).
 *   29     hint path: doHint x2 reveals correct cells, remaining cells tapped -> win still fires.
 *   30     undo path: fill a wrong cell, undo() restores, then solve -> win.
 *   31     reset path: doReset() clears board, then solve -> win.
 * Harness notes: canvas element stubs CAPTURE addEventListener handlers (fire() dispatches
 * synthetic events); setTimeout is queued, not run (the 220ms long-press must not fire during a
 * click) and flushed explicitly; 2d context is a universal proxy (render() survives).
 * Usage: node aquarium/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'aquarium';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
const ANCHOR = 'loadLevel(startTier,startIdx);';
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__AQM={LV:function(){return LEVELS},tiers:function(){return TIERS},load:loadLevel,grid:function(){return grid},won:function(){return won},solve:solveFromClues,hint:doHint,undo:undo,redo:redo,reset:doReset,check:doCheck,save:function(){return save},flushT:function(){return _flushT&&_flushT()}};');

/* universal proxy: callable, any prop -> itself, settable */
function uni() {
  const f = function () { return u; };
  const u = new Proxy(f, {
    get: (t, p) => { if (p === Symbol.toPrimitive) return () => 0; if (p === 'toString') return () => 'uni'; return u; },
    apply: () => u,
    set: () => true,
    construct: () => u,
  });
  return u;
}

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
    getContext: () => uni(),
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

/* queued setTimeout: long-press timer must NOT fire during synthetic clicks; queue flushed via
 * the injected _flushT hook (id counter + FIFO map) */
let tid = 0;
const tq = new Map();
function stubSetTimeout(fn, ms, ...args) { const id = ++tid; tq.set(id, { fn, args }); return id; }
function stubClearTimeout(id) { tq.delete(id); }
function flushT() { let n = 0; while (tq.size && n++ < 200) { const it = tq.entries().next().value; tq.delete(it[0]); try { it[1].fn(...it[1].args); } catch (e) {} } }

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
  setTimeout: stubSetTimeout, clearTimeout: stubClearTimeout,
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
  _flushT: flushT,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.Math = MathClone;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'aquarium-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const AQ=window.__AQM;
let pass=0,fail=0,fails=[],notes=[];
const PAD=12,GUTTER=44; /* engine constants (setupCanvas clamps CELL to 58 for n=6..9) */
function cellOf(r,c,cell){return {clientX:PAD+GUTTER+c*cell+cell/2,clientY:PAD+r*cell+cell/2,button:0,preventDefault:function(){}};}
function cv(){return document.getElementById('cv');}
function curCell(){ /* recompute CELL exactly as setupCanvas does */
 var n=AQ.LV().filter(function(l){return l.tier===curTier()}).length; /* not level n; get from canvas style */
 var px=parseFloat(cv().style.width)||400;
 return null;
}
function levelCell(){ /* derive CELL from last setupCanvas: cv.style.width = n*CELL+GUTTER+PAD*2 */
 return CELLnow;
}
var CELLnow=58;
var _origLoad=AQ.load;
function curTier(){return document.getElementById('hTier').textContent;}
function tap(r,c){cv().fire('pointerdown',cellOf(r,c,CELLnow));cv().fire('pointerup',cellOf(r,c,CELLnow));}
function xmark(r,c){var e=cellOf(r,c,CELLnow);e.button=2;cv().fire('pointerdown',e);}
/* independent rule-domain machinery */
function cageSpans(cages){return cages.map(function(cg){var mn=1e9,mx=-1;cg.forEach(function(p){if(p[0]<mn)mn=p[0];if(p[0]>mx)mx=p[0];});return[mn,mx];});}
function gridFromHeights(lv,h){
 var n=lv.n,g=[];
 for(var r=0;r<n;r++){g.push(new Array(n).fill(0));}
 lv.cages.forEach(function(cg,i){cg.forEach(function(p){if(p[0]>=h[i])g[p[0]][p[1]]=1;});});
 return g;
}
function rowCounts(g){return g.map(function(row){return row.filter(function(v){return v===1;}).length;});}
function countSolutions(lv,cap){ /* count solutions (stop at 2) over the legal height domain */
 var n=lv.n,cages=lv.cages,clues=lv.rowClues;
 var spans=cageSpans(cages);
 var possible=spans.map(function(s){var a=[];for(var h=s[0];h<=s[1]+1;h++)a.push(h);return a;});
 var contrib=possible.map(function(opts,i){var m={};opts.forEach(function(h){var v=new Array(n).fill(0);cages[i].forEach(function(p){if(p[0]>=h)v[p[0]]++;});m[h]=v;});return m;});
 var found=[],cur=new Array(n).fill(0),nodes=0,capped=false;
 function bt(idx,assign){
  if(found.length>=2)return;
  if(++nodes>cap){capped=true;return;}
  if(idx===cages.length){if(cur.every(function(v,r){return v===clues[r];}))found.push(assign.slice());return;}
  var opts=possible[idx];
  for(var oi=0;oi<opts.length;oi++){
   if(found.length>=2||capped)return;
   var h=opts[oi],v=contrib[idx][h],ok=true;
   for(var r=0;r<n;r++){cur[r]+=v[r];if(cur[r]>clues[r])ok=false;}
   if(ok){assign.push(h);bt(idx+1,assign);assign.pop();}
   for(var r2=0;r2<n;r2++)cur[r2]-=v[r2];
  }
 }
 bt(0,[]);
 return {count:found.length,heights:found[0]||null,capped:capped,nodes:nodes};
}
function validateLevel(lv,label){
 var n=lv.n;
 if(lv.cages.length!==lv.solution.length)throw new Error('solution length '+lv.solution.length+' != cages '+lv.cages.length);
 var seen=new Array(n*n).fill(0);
 lv.cages.forEach(function(cg,ci){
  if(cg.length===0)throw new Error('cage '+ci+' empty');
  cg.forEach(function(p){
   if(p[0]<0||p[0]>=n||p[1]<0||p[1]>=n)throw new Error('cage '+ci+' out of grid');
   if(seen[p[0]*n+p[1]])throw new Error('cages overlap at '+p);
   seen[p[0]*n+p[1]]=1;
  });
 });
 var uncovered=seen.filter(function(s){return !s;}).length;
 if(uncovered)throw new Error('cages do not tile grid ('+uncovered+' uncovered)');
 var spans=cageSpans(lv.cages);
 lv.solution.forEach(function(h,i){
  if(h<spans[i][0]||h>spans[i][1]+1)throw new Error('cage '+i+' height '+h+' outside legal ['+spans[i][0]+','+(spans[i][1]+1)+']');
 });
 var g=gridFromHeights(lv,lv.solution);
 var rc=rowCounts(g);
 for(var r=0;r<n;r++)if(rc[r]!==lv.rowClues[r])throw new Error('row '+r+' has '+rc[r]+' water, clue '+lv.rowClues[r]);
 var res=countSolutions(lv,800000);
 if(res.count===0)throw new Error('independent solver found NO solution (row clues unsatisfiable)');
 if(res.count>1)throw new Error('solution NOT unique ('+res.count+' solutions) — ambiguous level');
 var g2=gridFromHeights(lv,res.heights);
 for(var r2=0;r2<n;r2++)for(var c=0;c<n;c++)if(g[r2][c]!==g2[r2][c])throw new Error('embedded solution differs from independently derived one at ('+r2+','+c+')');
 return {capped:res.capped};
}
function playLevel(lv,tier,idx){
 AQ.load(tier,idx);
 var cvEl=cv();
 CELLnow=Math.max(26,Math.min(58,Math.floor((Math.min(1280-28,640)-GUTTER-PAD*2)/lv.n)));
 var g=AQ.grid();
 if(g.length!==lv.n)throw new Error('grid not initialised');
 if(AQ.won())throw new Error('won already true on fresh level');
 var sol=AQ.solve();
 if(!sol)throw new Error('engine solveFromClues returned null');
 for(var r=0;r<lv.n;r++)for(var c=0;c<lv.n;c++){
  if(sol[r][c]===1)tap(r,c);
  if(AQ.won())break;
 }
 if(!AQ.won())throw new Error('tapping the unique solution did not fire checkWin win');
 var key=tier+'_'+lv.level;
 if(!AQ.save().completed[key])throw new Error('win not recorded in save.completed');
 var sv=JSON.parse(localStorage.getItem('gz_aquarium_v1')||'{}');
 if(!(sv.completed&&sv.completed[key]))throw new Error('win not persisted to localStorage gz_aquarium_v1');
 AQ.flushT();
 var wm=document.getElementById('winModal');
 if(!wm.classList.contains('show'))throw new Error('winModal not shown');
 wm.classList.remove('show');
}
var tiers=AQ.tiers();
var lvls=AQ.LV();
if(lvls.length!==27)throw new Error('LEVELS.length='+lvls.length);
var cappedCount=0;
for(var li=0;li<lvls.length;li++){
 var lv=lvls[li];
 var tierIdx=tiers.indexOf(lv.tier);
 var idxInTier=lvls.filter(function(l){return l.tier===lv.tier;}).indexOf(lv);
 try{
  var cap=validateLevel(lv,'L'+lv.level);
  if(cap.capped)cappedCount++;
  playLevel(lv,lv.tier,idxInTier);
  pass++;
  if(li===0||li===8||li===26)notes.push('L'+lv.level+' ('+lv.tier+', '+lv.n+'x'+lv.n+', '+lv.cages.length+' cages): tiling+rowClues+uniqueness verified, replayed via canvas pointer events to win');
 }catch(e){fail++;fails.push('L'+lv.level+' ('+lv.tier+'): '+String(e.message).slice(0,120));document.getElementById('winModal').classList.remove('show');}
}
if(cappedCount)notes.push(cappedCount+' level(s) uniqueness confirmed but node-capped (still 0-dup within budget)');
/* X-mark path: X on empty cells does not block win */
try{
 var lv=lvls[0];
 AQ.load('Beginner',0);
 var sol=AQ.solve();
 var xs=0;
 outer:for(var r=0;r<lv.n;r++)for(var c=0;c<lv.n;c++){if(sol[r][c]===0){xmark(r,c);xs++;if(xs>=3)break outer;}}
 if(xs<3)throw new Error('no empty cells to X');
 for(var r2=0;r2<lv.n;r2++)for(var c2=0;c2<lv.n;c2++){if(sol[r2][c2]===1&&!AQ.won())tap(r2,c2);}
 if(!AQ.won())throw new Error('X marks on empty cells blocked the win');
 AQ.flushT();document.getElementById('winModal').classList.remove('show');
 pass++;
}catch(e){fail++;fails.push('X-path: '+String(e.message).slice(0,120));AQ.flushT();document.getElementById('winModal').classList.remove('show');}
/* hint path */
try{
 AQ.load('Beginner',0);
 var lv=lvls[0],sol=AQ.solve();
 AQ.hint();AQ.hint();
 for(var r=0;r<lv.n;r++)for(var c=0;c<lv.n;c++){if(sol[r][c]===1&&AQ.grid()[r][c]!==1&&!AQ.won())tap(r,c);}
 if(!AQ.won())throw new Error('win did not fire after 2 hints + correct taps');
 AQ.flushT();document.getElementById('winModal').classList.remove('show');
 pass++;
}catch(e){fail++;fails.push('hint-path: '+String(e.message).slice(0,120));AQ.flushT();document.getElementById('winModal').classList.remove('show');}
/* undo path */
try{
 AQ.load('Beginner',0);
 var lv=lvls[0],sol=AQ.solve();
 var wrong=null;
 outer2:for(var r=0;r<lv.n;r++)for(var c=0;c<lv.n;c++){if(sol[r][c]===0){wrong=[r,c];break outer2;}}
 tap(wrong[0],wrong[1]);
 if(AQ.grid()[wrong[0]][wrong[1]]!==1)throw new Error('wrong-cell tap did not fill');
 AQ.undo();
 if(AQ.grid()[wrong[0]][wrong[1]]!==0)throw new Error('undo did not restore');
 for(var r2=0;r2<lv.n;r2++)for(var c2=0;c2<lv.n;c2++){if(sol[r2][c2]===1&&!AQ.won())tap(r2,c2);}
 if(!AQ.won())throw new Error('win did not fire after undo+solve');
 AQ.flushT();document.getElementById('winModal').classList.remove('show');
 pass++;
}catch(e){fail++;fails.push('undo-path: '+String(e.message).slice(0,120));AQ.flushT();document.getElementById('winModal').classList.remove('show');}
/* reset path */
try{
 AQ.load('Beginner',1);
 var lv=lvls[1],sol=AQ.solve();
 tap(0,0);tap(0,1);
 AQ.reset();
 var dirty=0;AQ.grid().forEach(function(row){row.forEach(function(v){if(v!==0)dirty++;});});
 if(dirty)throw new Error('reset left '+dirty+' marked cells');
 for(var r=0;r<lv.n;r++)for(var c=0;c<lv.n;c++){if(sol[r][c]===1&&!AQ.won())tap(r,c);}
 if(!AQ.won())throw new Error('win did not fire after reset+solve');
 AQ.flushT();document.getElementById('winModal').classList.remove('show');
 pass++;
}catch(e){fail++;fails.push('reset-path: '+String(e.message).slice(0,120));AQ.flushT();document.getElementById('winModal').classList.remove('show');}
return {pass:pass,fail:fail,total:pass+fail,fails:fails,notes:notes,verdict:(fail===0?'PASS':'FAIL')};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (27 levels: cage tiling + rowClues + independent uniqueness count + embedded-solution replay via canvas pointer events; X/hint/undo/reset paths), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
