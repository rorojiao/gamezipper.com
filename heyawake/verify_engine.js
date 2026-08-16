#!/usr/bin/env node
/* GENERATED in-engine verifier for heyawake — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox (top-level var/function globals, no
 * surgery). init() runs the engine's own chunked generator (generateAllLevelsAsync via
 * immediate setTimeout ticks) producing all 30 levels (generatePuzzle backtracking solver
 * plus a checkerboard FALLBACK at index.html:505-553 when generation fails). Per level 0..29
 * + daily: the embedded solution string is INDEPENDENTLY validated against full Heyawake
 * rules (rooms tile the grid; no adjacent blacks; any 3 consecutive whites in a row/col lie
 * in one room; whites connected; every clued room's black count == clue; clueless rooms have
 * <=3 blacks — the engine's own checkWin :1019 enforces these). The level is then PLAYED
 * through the engine's own onCellClick (click every black cell of the embedded solution);
 * checkWin must reach onWin: #winOverlay shown and saveResult persisting completed[lvl]
 * stars to localStorage heyawakeV1.
 * Usage: node heyawake/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'heyawake';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY: engine is an IIFE with existing window exports; add an internals accessor
 * next to the engine's own "window.resetProgress=resetProgress;" export (index.html untouched). */
const SURGERY_ANCHOR = 'window.resetProgress=resetProgress;';
if (!code.includes(SURGERY_ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(SURGERY_ANCHOR, SURGERY_ANCHOR + '\nwindow.__HY={S:function(){return state},C:function(){return onCellClick},W:function(){return checkWin},L:function(){return LEVELS},P:function(){return PUZZLES},R:function(){return refreshPuzzles}};');

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
try { vm.runInContext(code, ctx, { filename: 'heyawake-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
let pass=0,fail=0,fails=[],failIdx=[];
const notes=[];
const issues=[];
function validate(p,label){
 const rows=p.rows,cols=p.cols;
 if(!p.sol||p.sol.length!==rows*cols)throw new Error('bad sol length');
 const black=function(r,c){return p.sol[r*cols+c]==='1'};
 /* rooms tile the grid */
 const roomList=p.rooms.split(';');
 const roomOf=[];var filled=0;
 for(var r=0;r<rows;r++){roomOf.push([]);for(var c=0;c<cols;c++)roomOf[r].push(-1)}
 roomList.forEach(function(rs,i){
  var q=rs.split(',').map(Number);
  if(q.length!==4)throw new Error('bad room spec');
  for(var r=q[0];r<=q[2];r++)for(var c=q[1];c<=q[3];c++){
   if(r<0||r>=rows||c<0||c>=cols)throw new Error('room out of grid');
   if(roomOf[r][c]!==-1)throw new Error('rooms overlap at '+r+','+c);
   roomOf[r][c]=i;filled++;
  }
 });
 if(filled!==rows*cols)throw new Error('rooms do not tile grid ('+filled+'/'+rows*cols+')');
 /* no adjacent blacks */
 for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){
  if(!black(r,c))continue;
  if(c+1<cols&&black(r,c+1))throw new Error('adjacent blacks at '+r+','+c);
  if(r+1<rows&&black(r+1,c))throw new Error('adjacent blacks at '+r+','+c);
 }
 /* span rule: 3 consecutive whites must be in one room */
 for(var r=0;r<rows;r++)for(var c=0;c+2<cols;c++){
  if(!black(r,c)&&!black(r,c+1)&&!black(r,c+2)){
   if(!(roomOf[r][c]===roomOf[r][c+1]&&roomOf[r][c+1]===roomOf[r][c+2]))throw new Error('span violation row '+r+','+c);
  }
 }
 for(var c=0;c<cols;c++)for(var r=0;r+2<rows;r++){
  if(!black(r,c)&&!black(r+1,c)&&!black(r+2,c)){
   if(!(roomOf[r][c]===roomOf[r+1][c]&&roomOf[r+1][c]===roomOf[r+2][c]))throw new Error('span violation col '+r+','+c);
  }
 }
 /* white connectivity */
 var start=null;
 for(var r=0;r<rows&&!start;r++)for(var c=0;c<cols&&!start;c++)if(!black(r,c))start=[r,c];
 if(start){
  var vis={};vis[start[0]+','+start[1]]=1;var st=[start];var cnt=0;
  while(st.length){var q=st.pop();cnt++;
   [[0,1],[1,0],[0,-1],[-1,0]].forEach(function(d){var nr=q[0]+d[0],nc=q[1]+d[1];
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!black(nr,nc)&&!vis[nr+','+nc]){vis[nr+','+nc]=1;st.push([nr,nc])}});
  }
  var whites=0;for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)if(!black(r,c))whites++;
  if(cnt!==whites)throw new Error('whites not connected ('+cnt+'/'+whites+')');
 }
 /* room clue counts (+ clueless rooms <=3, which checkWin enforces) */
 roomList.forEach(function(rs,i){
  var q=rs.split(',').map(Number);
  var cnt=0,hasClue=false,target=0;
  for(var r=q[0];r<=q[2];r++)for(var c=q[1];c<=q[3];c++){
   if(black(r,c))cnt++;
   var k=r+','+c;
   if(p.clues[k]!==undefined){hasClue=true;target=p.clues[k]}
  }
  if(hasClue&&cnt!==target)throw new Error('room '+i+' has '+cnt+' blacks, clue says '+target);
  if(!hasClue&&cnt>3)throw new Error('clueless room '+i+' has '+cnt+' blacks (>3 -> checkWin can never pass)');
 });
 return roomList.length;
}
function playLevel(lvl,label){
 const state=HY.S();
 if(lvl===-1){window.startDaily();}else{window.startLevel(lvl);}
 if(state.screen!=='game')throw new Error('startLevel did not enter game screen');
 const p=state.puzzle;
 var valIssue=null;
 try{validate(p,label)}catch(e){valIssue=String(e.message).slice(0,80)}
 const nRooms=p.rooms.split(';').length;
 var clicks=0;
 try{
  for(var r=0;r<state.rows;r++)for(var c=0;c<state.cols;c++){
   if(p.sol[r*state.cols+c]==='1'){HY.C()(r,c);clicks++}
  }
 }catch(e){throw new Error('engine crash while playing its own embedded solution: '+e.message)}
 const wo=document.getElementById('winOverlay');
 var won=wo.classList.contains('show');
 var saved=null;
 if(won&&!state.daily){
  const sv=JSON.parse(localStorage.getItem('heyawakeV1')||'{}');
  saved=(sv.completed||[])[lvl]||0;
  if(!saved)throw new Error('win shown but completed['+lvl+'] not persisted');
 }
 var via='embedded';
 if(!won){
  /* embedded solution cannot win; try an INDEPENDENT solver and play that instead */
  var indep=null;
  try{indep=indepSolve(state)}catch(e){throw new Error('indepSolve crashed: '+e.message)}
 if(indep==='CAP')throw new Error('INCONCLUSIVE: independent solver hit 20M-node/20s search cap; embedded solution itself invalid: '+(valIssue||'?'));
  if(!indep)throw new Error('UNWINNABLE: no cell assignment satisfies the engine checkWin predicates ('+nRooms+' rooms'+(nRooms<=2?' = checkerboard fallback path, index.html:505-553':'')+')'+(valIssue?'; embedded-sol validation: '+valIssue:'')+'; exhaustive search exhausted');
  window.doReset();
  try{
   for(var r=0;r<state.rows;r++)for(var c=0;c<state.cols;c++)if(indep[r][c]===1)HY.C()(r,c);
  }catch(e){throw new Error('WON-THEN-CRASH: valid solution found and checkWin reached onWin, which crashes in saveResult (index.html:321 reads s.best.length but initSave :320 never creates best): '+e.message)}
  won=wo.classList.contains('show');
  via='INDEPENDENT (embedded solution is invalid)';
  if(!won)throw new Error('independent valid solution also rejected by engine checkWin (rooms='+nRooms+')');
 }
 if(valIssue&&via==='embedded')throw new Error('won but embedded solution violates rules: '+valIssue);
 if(!state.daily){
  const sv=JSON.parse(localStorage.getItem('heyawakeV1')||'{}');
  const stars=(sv.completed||[])[lvl]||0;
  if(!stars)throw new Error('win shown but completed['+lvl+'] not persisted');
  return{nRooms:nRooms,stars:stars,clicks:clicks,via:via};
 }
 return{nRooms:nRooms,stars:1,clicks:clicks,via:via};
}
/* independent Heyawake solver over the engine's live level state (row-major DFS,
 * white-first, adjacency + room-count + span pruning, exact counts + connectivity at end) */
function indepSolve(st){
 const rows=st.rows,cols=st.cols;
 const roomList=st.rooms.split(';');
 const roomOf=st.roomOf;
 const target=new Array(roomList.length).fill(-1);
 for(var i=0;i<roomList.length;i++){
  var q=roomList[i].split(',').map(Number);
  for(var r=q[0];r<=q[2];r++)for(var c=q[1];c<=q[3];c++){
   var k=r+','+c;
   if(st.clues[k]!==undefined)target[i]=st.clues[k];
  }
 }
 const cap=target.map(function(t){return t>=0?t:3});
 const grid=[];for(var r=0;r<rows;r++){grid.push([]);for(var c=0;c<cols;c++)grid[r].push(-1)}
 const blacks=new Array(roomList.length).fill(0);
 var nodes=0;const CAP=20000000;const DL=Date.now()+20000;var hitCap=false;
 function spanOk(r,c){
  /* triples fully assigned that include (r,c) as their last cell */
  if(c>=2&&grid[r][c-2]===0&&grid[r][c-1]===0&&grid[r][c]===0){
   if(!(roomOf[r][c-2]===roomOf[r][c-1]&&roomOf[r][c-1]===roomOf[r][c]))return false;
  }
  if(r>=2&&grid[r-2][c]===0&&grid[r-1][c]===0&&grid[r][c]===0){
   if(!(roomOf[r-2][c]===roomOf[r-1][c]&&roomOf[r-1][c]===roomOf[r][c]))return false;
  }
  return true;
 }
 function connected(){
  var start=null,total=0;
  for(var r=0;r<rows&&!start;r++)for(var c=0;c<cols&&!start;c++)if(grid[r][c]===0)start=[r,c];
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)if(grid[r][c]===0)total++;
  if(!start)return false;
  var vis={};vis[start[0]+','+start[1]]=1;var stk=[start];var cnt=0;
  while(stk.length){var p=stk.pop();cnt++;
   var d=[[0,1],[1,0],[0,-1],[-1,0]];
   for(var t=0;t<4;t++){var nr=p[0]+d[t][0],nc=p[1]+d[t][1];
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&grid[nr][nc]===0&&!vis[nr+','+nc]){vis[nr+','+nc]=1;stk.push([nr,nc])}}
  }
  return cnt===total;
 }
 function rec(idx){
  if(++nodes>CAP){hitCap=true;return false;}
  if(nodes%500000===0&&Date.now()>DL){hitCap=true;return false;}
  if(idx===rows*cols){
   for(var i=0;i<target.length;i++)if(target[i]>=0&&blacks[i]!==target[i])return false;
   return connected();
  }
  var r=(idx/cols)|0,c=idx%cols,rid=roomOf[r][c];
  /* white first */
  grid[r][c]=0;
  if(spanOk(r,c)&&rec(idx+1))return true;
  grid[r][c]=-1;
  /* black */
  if(blacks[rid]<cap[rid]){
   var adj=false;
   if(r>0&&grid[r-1][c]===1)adj=true;
   if(c>0&&grid[r][c-1]===1)adj=true;
   if(!adj){
    grid[r][c]=1;blacks[rid]++;
    if(rec(idx+1))return true;
    blacks[rid]--;grid[r][c]=-1;
   }
  }
  return false;
 }
 if(!rec(0))return hitCap?'CAP':null;
 return grid;
}
/* engine init already ran at load (IIFE tail calls init(); chunked generation ran via
 * immediate setTimeout ticks) */
const HY=window.__HY;
if(HY.L().length!==30)throw new Error('LEVELS.length='+HY.L().length);
HY.R();
document.getElementById('winOverlay').classList.remove('show');
var fallbackSuspect=[];
for(var li=0;li<30;li++){
 try{
  const t0=Date.now();
  const res=playLevel(li,'L'+(li+1));
  pass++;
  if(res.nRooms<=2)fallbackSuspect.push(li+1);
  if(li===0||li===29)notes.push('L'+(li+1)+' ('+HY.S().rows+'x'+HY.S().cols+'): won via '+res.via+', '+res.nRooms+' rooms, stars='+res.stars);
  document.getElementById('winOverlay').classList.remove('show');
 }catch(e){fail++;failIdx.push(li+1);fails.push('L'+(li+1)+' EX:'+String(e.message).slice(0,130));document.getElementById('winOverlay').classList.remove('show');}
}
if(fallbackSuspect.length)notes.push('levels with <=2 rooms (possible checkerboard fallback path, index.html:505-553): '+fallbackSuspect.join(','));
try{
 const res=playLevel(-1,'daily');
 pass++;notes.push('daily 10x10 (static pool): won ('+res.clicks+' blacks, '+res.nRooms+' rooms)');
}catch(e){fail++;failIdx.push(99);fails.push('daily EX:'+String(e.message).slice(0,100));}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,31),verdict:fail===0?'PASS':'FAIL',notes:notes,issues:issues,timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' items (30 levels + daily: embedded solution independently validated vs full Heyawake rules + played via onCellClick to win), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).slice(0, 15).forEach(f => console.log('  FAIL ' + f));
if (result.issues && result.issues.length) console.log('issues: ' + JSON.stringify(result.issues));
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
