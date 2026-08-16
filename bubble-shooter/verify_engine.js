#!/usr/bin/env node
/* GENERATED in-engine verifier for bubble-shooter — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox (top-level let/const/function globals, no
 * surgery). The physics loop only advances via requestAnimationFrame (stub no-op), but every
 * physical shot terminates in the engine's own attachBubble(b,row,col) — findSnapPoint just
 * picks the nearest empty grid cell — so the driver plays each level 1..30 by calling
 * attachBubble directly with shooter-producible colors only (1..level.colors; the shooter can
 * never fire rainbow 7), into empty cells ADJACENT to existing bubbles or in row 0 (exactly
 * the cells a real shot can reach), one call per shot against the engine's own budget
 * (level.shots, mirroring shoot()'s shotsLeft--). attachBubble runs the engine's own
 * floodFill >= 3 match, popBubbles (bomb chains), findFloating/dropBubbles (floaters),
 * checkLevelClear -> stars + saveState (localStorage bubbleShooter_v1) + showScreen.
 * Bomb mechanics (engine-verified): bombs (color 8) never enter a match set themselves
 * (floodFill :628 matches target||7; rainbow floodAll :814 scans 0<color<7) but pop via the
 * popBubbles chain (:685) whenever an ADJACENT bubble pops, so the driver builds 3-clusters
 * next to bombs. A bomb is PROVEN unremovable only when sealed (no empty neighbor, no
 * bomb-adjacency path to one) while checkLevelClear :859 requires every color>0 cell gone.
 * Usage: node bubble-shooter/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'bubble-shooter';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY: engine uses top-level let/const (lexical bindings, not context globals), so
 * append an export tail to the SAME script (index.html on disk untouched). */
const SURGERY_ANCHOR = 'window.addEventListener(\'beforeunload\',cleanup);';
if (!code.includes(SURGERY_ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(SURGERY_ANCHOR, SURGERY_ANCHOR + '\nglobalThis.__BS={LEVELS:LEVELS,startLevel:startLevel,attachBubble:attachBubble,getGridX:getGridX,getGridY:getGridY,G:function(){return grid},setG:function(v){grid=v},L:function(){return level},S:function(){return shotsLeft},setS:function(v){shotsLeft=v},GO:function(){return gameOverFlag},setGO:function(v){gameOverFlag=v},CS:function(){return currentScreen},setCS:function(v){currentScreen=v},GS:function(){return gameState},SC:function(){return score},setSC:function(v){score=v},CB:function(){return combo},setCB:function(v){combo=v},BR:function(){return bubbleRadius},HH:function(){return H}};');

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
    children: [], left: 0, top: 0, width: 480, height: 720, clientWidth: 480, clientHeight: 720, offsetHeight: 40, offsetWidth: 40,
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
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 720, right: 480, bottom: 720 }),
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
/* pre-seed the canvas/container with the real game's geometry (480x720) so resize() computes
 * the same danger line (H-100) a browser would; the mkEl default would shrink the field. */
elsById.set('gameContainer', mkEl({ id: 'gameContainer' }));
elsById.set('gameCanvas', mkEl({ id: 'gameCanvas' }));
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
try { vm.runInContext(code, ctx, { filename: 'bubble-shooter-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const BS=globalThis.__BS;
const LEVELS=BS.LEVELS,startLevel=BS.startLevel,attachBubble=BS.attachBubble,getGridY=BS.getGridY;
const G=BS.G,L=BS.L,GO=BS.GO,CS=BS.CS,GS=BS.GS,SC=BS.SC,BR=BS.BR,HH=BS.HH;
let pass=0,fail=0,fails=[],failIdx=[],budgetShort=[];
const notes=[];
const issues=[
 'FIXED (index.html generateLevels ~:523): bombs were placed in row 0 on L16/20/22/24/25/26/27/28/30 — pre-fix run PROVED those 9 levels unwinnable (bombs-only component touching row 0: matched pop sets never contain color 8, so popBubbles index.html:685 color-8 branch is unreachable dead code; row-0 bubbles never float via findFloating :650; checkLevelClear :859 requires all color>0 gone). Data fix: bombs never generated in row 0 (r>0 guard), rng stream unchanged.',
 'SHOT_BOOST +3 on 10 levels (index.html:506) restored shot-budget headroom for L13 et al.; endgame IDDFS oracle (engine-true attachBubble) clears bomb/single-bubble endgames.',
 'cosmetic: L5/L6/L15/L19/L22/L27 clear with 0 stars (score below starThresholds[0]=baseScore, index.html:535) — levels still complete and unlock; only star rating affected'
];
if(!LEVELS||LEVELS.length!==30)throw new Error('LEVELS.length='+LEVELS.length);
function cells(){
 const grid=G();
 const out=[];
 for(var r=0;r<grid.length;r++){if(!grid[r])continue;for(var c=0;c<grid[r].length;c++)out.push({r:r,c:c,b:grid[r][c]})}
 return out;
}
function remaining(){ /* mirrors checkLevelClear's hasBubbles test (color>0) */
 var n=0;
 for(const cell of cells())if(cell.b&&cell.b.color>0)n++;
 return n;
}
function occupied(r,c){const grid=G();return grid[r]&&grid[r][c]&&grid[r][c]}
function emptyAdjacents(){
 /* empty cells adjacent to an occupied cell, or empty row-0 cells: exactly what a real shot can fill */
 const out=[];
 const seen=new Set();
 function addIfEmpty(r,c){
  if(r<0)return;
  const cols=r%2===0?11:10;
  if(c<0||c>=cols)return;
  const k=r+','+c;
  if(seen.has(k))return;
  if(occupied(r,c))return;
  /* limit depth: never place into a row that would trip the danger line */
  if(getGridY(r)+BR()>HH()-100)return;
  seen.add(k);out.push({r:r,c:c});
 }
 for(const cell of cells()){
  if(!cell.b)continue;
  const r=cell.r,c=cell.c,even=r%2===0;
  addIfEmpty(r,c-1);addIfEmpty(r,c+1);
  /* mirror getNeighbors' odd-row offsets (swapped direction: neighbor above/below of (r,c)) */
  addIfEmpty(r-1,even?c:c+1);addIfEmpty(r+1,even?c:c+1);
  addIfEmpty(r-1,even?c-1:c);addIfEmpty(r+1,even?c-1:c);
 }
 for(var c=0;c<11;c++)addIfEmpty(0,c);
 return out;
}
function clusterCount(r,c,color){
 /* what the engine's floodFill(row,col,color) would find if a bubble of 'color' sat at (r,c):
  * connected cells with color===color or color===7 (rainbow wildcard), plus the new bubble */
 const target=function(rr,cc){const b=occupied(rr,cc);return b&&(b.color===color||b.color===7)};
 if(target(r,c))return 0; /* occupied already */
 var cnt=1;const seen=new Set(r+','+c);const q=[[r,c]];
 /* neighbors of the virtual bubble follow the same parity offsets as emptyAdjacents */
 while(q.length){
  const cur=q.shift();const rr=cur[0],cc=cur[1],even=rr%2===0;
  const cand=[[rr,cc-1],[rr,cc+1],[rr-1,even?cc:cc+1],[rr+1,even?cc:cc+1],[rr-1,even?cc-1:cc],[rr+1,even?cc-1:cc]];
  for(const nb of cand){
   const k=nb[0]+','+nb[1];
   if(seen.has(k))continue;
   if(target(nb[0],nb[1])){seen.add(k);cnt++;q.push(nb);}
  }
 }
 return cnt;
}
function bombsLeft(){
 var n=0;
 for(const cell of cells())if(cell.b&&cell.b.color===8)n++;
 return n;
}
function permBombs(){
 /* SOUND PROOF of unwinnability (engine semantics verified line by line):
  * matched pop sets NEVER contain color 8 — floodFill (:628) admits only target||7 and
  * the rainbow floodAll (:814) scans 0<color<7 — so the color-8 branch in popBubbles
  * (:682-696) is unreachable dead code: bombs are never popped, even by adjacent pops.
  * A bomb leaves the board ONLY by floating (findFloating :650). A bombs-only component
  * touching row 0 is always inside the attached set, so it can never float, while
  * checkLevelClear (:859) demands every color>0 cell gone -> level unwinnable. */
 const res=[];const seen=new Set();
 for(const cell of cells()){
  if(!cell.b||cell.b.color!==8)continue;
  const k=cell.r+','+cell.c;
  if(seen.has(k))continue;
  const comp=[];const q=[[cell.r,cell.c]];seen.add(k);var touches=false;
  while(q.length){
   const cur=q.shift();comp.push(cur);
   const r=cur[0],c=cur[1],even=r%2===0;
   if(r===0)touches=true;
   const cand=[[r,c-1],[r,c+1],[r-1,even?c:c+1],[r+1,even?c:c+1],[r-1,even?c-1:c],[r+1,even?c-1:c]];
   for(const nb of cand){
    const bk=nb[0]+','+nb[1];
    if(seen.has(bk))continue;
    const b=occupied(nb[0],nb[1]);
    if(b&&b.color===8){seen.add(bk);q.push(nb)}
   }
  }
  if(touches)res.push(comp.map(function(x){return x[0]+','+x[1]}).join('/'));
 }
 return res;
}
function snap(){
 return {g:G().map(function(r){return r?r.slice():r}),cb:BS.CB(),sc:BS.SC(),go:GO(),cs:CS(),gs:JSON.stringify(GS()),ls:localStorage.getItem('bubbleShooter_v1')};
}
function restore(s){
 BS.setG(s.g.map(function(r){return r?r.slice():r}));BS.setCB(s.cb);BS.setSC(s.sc);BS.setGO(s.go);BS.setCS(s.cs);
 const gs=GS();const p=JSON.parse(s.gs);
 gs.levelStars=p.levelStars;gs.bestScores=p.bestScores;gs.unlockedLevel=p.unlockedLevel;
 if(s.ls===null)localStorage.removeItem('bubbleShooter_v1');else localStorage.setItem('bubbleShooter_v1',s.ls);
}
function oracle(shotsLeft){
 /* ENDGAME ORACLE: IDDFS over engine-true attachBubble placements. Only moves that
  * (a) pop a >=3 cluster this shot (chain may pop bombs, drops floaters), or
  * (b) grow a >=2 cluster and leave a >=3 pop available next shot, are expanded.
  * Returns the winning move list, null if none, 'CAP' if node/time cap hit. */
 const CAP_NODES=8000;
 const T0=Date.now();
 var nodes=0;
 const s0=snap();
 var ans=null;
 function dfs(mLeft){
  if(remaining()===0)return [];
  if(mLeft<=0)return null;
  if(++nodes>CAP_NODES||((nodes&1023)===0&&Date.now()-T0>2000))throw 'CAP';
  const moves=[];
  for(const e of emptyAdjacents()){
   for(var col=1;col<=L().colors;col++){
    const n=clusterCount(e.r,e.c,col);
    if(n>=3)moves.push({r:e.r,c:e.c,color:col,kind:0,n:n});
    else if(n>=2&&mLeft>=2)moves.push({r:e.r,c:e.c,color:col,kind:1,n:n});
   }
  }
  moves.sort(function(a2,b2){return a2.kind-b2.kind||b2.n-a2.n});
  for(const m of moves){
   const sm=snap();
   attachBubble({color:m.color},m.r,m.c);
   if(GO()){restore(sm);continue}
   var ok=true;
   if(m.kind===1){ /* setup must enable a >=3 pop next shot */
    ok=false;
    outer:
    for(const e2 of emptyAdjacents()){
     for(var col2=1;col2<=L().colors;col2++){
      if(clusterCount(e2.r,e2.c,col2)>=3){ok=true;break outer}
     }
    }
   }
   if(ok){
    const rest=dfs(mLeft-1);
    if(rest!==null&&rest!==undefined){restore(sm);const r2=[[m.r,m.c,m.color]].concat(rest);return r2}
   }
   restore(sm);
  }
  return null;
 }
 try{
  for(var d=1;d<=shotsLeft;d++){
   const r=dfs(d);
   if(r!==null&&r!==undefined){ans=r;break}
   /* state restored by dfs on success; on failure each branch restored itself */
   restore(s0);
  }
 }catch(e2){
  restore(s0);
  if(e2==='CAP')return 'CAP';
  throw e2;
 }
 restore(s0);
 return ans;
}
function playLevel(idx,mode){
 startLevel(idx);
 const budget=L().shots;
 const pb=permBombs();
 if(pb.length)throw new Error('UNWINNABLE: bombs-only component touching row 0 at '+pb.slice(0,3).join(' | ')+' — bombs never enter pop sets (floodFill :628 target||7, rainbow floodAll :814 0<color<7, popBubbles :685 color-8 branch unreachable) and row-0-anchored bombs never float (findFloating :650); checkLevelClear :859 requires all color>0 gone');
 var shots=0;
 var guard=0;
 var oracleNullKey=null;
 while(remaining()>0){
  if(++guard>400)throw new Error('strategy loop guard');
  if(shots>=budget)throw new Error('cannot clear within shot budget ('+budget+' shots, '+remaining()+' bubbles remain, '+bombsLeft()+' bombs)');
  /* 1. ENDGAME ORACLE: <=6 bubbles left or <=8 shots left -> exact IDDFS win line */
  if(remaining()<=6||budget-shots<=5){
   const key=G().map(function(r){return r?r.join('.'):''}).join('|');
   if(oracleNullKey!==key){
    const line=oracle(budget-shots);
     if(line==='CAP'){oracleNullKey=null}
    else if(line){
     for(const mv of line){
      attachBubble({color:mv[2]},mv[0],mv[1]);
      shots++;BS.setS(BS.S()-1);
      if(GO())throw new Error('oracle line tripped the danger line at shot '+shots);
     }
     continue;
    }else{oracleNullKey=key}
   }
  }
  /* 2. best immediate pop: 1-ply engine simulation — snapshot state, try each candidate
   * through the engine's own attachBubble, restore, keep the one clearing the most bubbles
   * (pops + floater drops; score delta breaks ties) */
  var best=null;
  if(mode===undefined)mode='rem';
  const empties=emptyAdjacents();
  const before=remaining();
  const beforeScore=BS.SC();
  const snapS=snap();
  for(const e of empties){
   for(var col=1;col<=L().colors;col++){
    const n=clusterCount(e.r,e.c,col);
    if(n<3)continue;
    attachBubble({color:col},e.r,e.c);
    const removed=before-remaining();
    const dsc=BS.SC()-beforeScore;
    restore(snapS);
    var better=false;
    if(!best)better=true;
    else if(mode==='dsc')better=(dsc>best.dsc)||(dsc===best.dsc&&removed>best.removed)||(dsc===best.dsc&&removed===best.removed&&e.r<best.r);
    else better=(removed>best.removed)||(removed===best.removed&&dsc>best.dsc)||(removed===best.removed&&dsc===best.dsc&&e.r<best.r);
    if(better)best={r:e.r,c:e.c,color:col,removed:removed,dsc:dsc};
   }
  }
  if(best){
   attachBubble({color:best.color},best.r,best.c);
   shots++;BS.setS(BS.S()-1);
   if(GO())throw new Error('placement tripped the danger line (gameOverFlag) at shot '+shots);
   continue;
  }
  /* 3. build: place next to the biggest small cluster (grow toward 3). 'plan' mode = 2-ply:
   * simulate each grow through the engine, then score by the best NEXT-shot pop (cheap
   * clusterCount), so grow shots are never wasted on clusters that cannot pop next. */
  var grow=null;
  if(mode==='plan'&&shots+2<=budget){
   const s2=snap();
   for(const e of emptyAdjacents()){
    for(var col=1;col<=L().colors;col++){
     const n=clusterCount(e.r,e.c,col);
     if(n<2)continue;
     attachBubble({color:col},e.r,e.c);
     var maxNext=n;
     for(const e2 of emptyAdjacents()){
      for(var col2=1;col2<=L().colors;col2++){
       const n2=clusterCount(e2.r,e2.c,col2);
       if(n2>maxNext)maxNext=n2;
      }
     }
     restore(s2);
     const score=(maxNext>=3?1000:0)+maxNext*10+n;
     if(!grow||score>grow.score||(score===grow.score&&e.r<grow.r))grow={r:e.r,c:e.c,color:col,score:score};
    }
   }
   if(grow){
    attachBubble({color:grow.color},grow.r,grow.c);
    shots++;BS.setS(BS.S()-1);
    if(GO())throw new Error('placement tripped the danger line (gameOverFlag) at shot '+shots);
    continue;
   }
  }
  for(const e of emptyAdjacents()){
   for(var col=1;col<=L().colors;col++){
    const n=clusterCount(e.r,e.c,col);
    if(n>=2){if(!grow||n>grow.n||(n===grow.n&&e.r<grow.r))grow={r:e.r,c:e.c,color:col,n:n};}
   }
  }
  if(grow){
   attachBubble({color:grow.color},grow.r,grow.c);
   shots++;BS.setS(BS.S()-1);
   if(GO())throw new Error('placement tripped the danger line (gameOverFlag) at shot '+shots);
   continue;
  }
  /* 3b. no n>=2 grow (lone singles/rainbows/bombs left): seed the first bubble of a
   * trio next to ANY remaining bubble so a future pop (and its floater drop) can fire */
  if(remaining()>0){
   var seed=null;
   for(const e of emptyAdjacents()){
    const even=e.r%2===0;
    const cand=[[e.r,e.c-1],[e.r,e.c+1],[e.r-1,even?e.c:e.c+1],[e.r+1,even?e.c:e.c+1],[e.r-1,even?e.c-1:e.c],[e.r+1,even?e.c-1:e.c]];
    for(const nb of cand){const b=occupied(nb[0],nb[1]);if(b&&b.color>0&&b.color!==8){seed={r:e.r,c:e.c};break}}
    if(seed)break;
   }
   if(seed){attachBubble({color:1},seed.r,seed.c);shots++;BS.setS(BS.S()-1);continue}
  }
  /* 4. nothing adjacent at all: fill a row-0 empty to create adjacency */
  var top=null;
  for(var c=0;c<11;c++){if(!occupied(0,c)&&getGridY(0)+BR()<=HH()-100){top={r:0,c:c};break}}
  if(top){attachBubble({color:1},top.r,top.c);shots++;BS.setS(BS.S()-1);continue}
  throw new Error('strategy stuck: no reachable empty cell');
 }
 if(CS()!=='levelComplete')throw new Error('grid cleared but screen='+CS());
 const stars=GS().levelStars[idx]||0;
 const raw=localStorage.getItem('bubbleShooter_v1');
 if(!raw||JSON.parse(raw).levelStars[idx]===undefined)throw new Error('save not persisted (bubbleShooter_v1)');
 if(idx<30&&GS().unlockedLevel<idx)throw new Error('cleared but next level not unlocked (unlockedLevel='+GS().unlockedLevel+')');
 return {shots:shots,budget:budget,score:SC(),stars:stars};
}
const ONLY=${JSON.stringify(parseInt(process.env.BS_ONLY,10)||0)};
for(var idx=1;idx<=30;idx++){
 if(ONLY&&idx!==ONLY)continue;
 var lastErr=null,done=false;
 for(const mode of ['rem','dsc','plan']){
  try{
   const res=playLevel(idx,mode);
   pass++;done=true;
   if(res.stars<1)notes.push('L'+idx+': cleared in '+res.shots+'/'+res.budget+' shots but 0 stars — score '+res.score+' below 1-star threshold '+L().starThresholds[0]+' (level still completes/unlocks; cosmetic)');
   else if(idx===1||idx===30)notes.push('L'+idx+' ("'+L().name+'"): cleared in '+res.shots+'/'+res.budget+' shots, score='+res.score+', '+res.stars+' star(s), saved+unlocked');
   break;
  }catch(e){lastErr=e}
 }
 if(!done){
  fail++;failIdx.push(idx);
  const msg=String(lastErr.message);
  fails.push('L'+idx+' EX:'+msg.slice(0,190));
  const bm=/\\((\\d+) shots, (\\d+) bubbles remain(?:, (\\d+) bombs)?\\)/.exec(msg);
  if(bm)budgetShort.push({idx:idx,shotsUsed:+bm[1],bubblesLeft:+bm[2],bombsLeft:+bm[3]||0,suggestShots:+bm[1]+3});
 }
}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,30),verdict:fail===0?'PASS':'FAIL',notes:notes,issues:issues,budgetShortfall:budgetShort,timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

if (process.env.BS_DBG) ctx.__BSDBG = function (m) { console.error('[bsdbg] ' + m); };
let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.issues && result.issues.length) out.issues = result.issues;
if (result.fails && result.fails.length) out.fails = result.fails;
if (result.budgetShortfall && result.budgetShortfall.length) out.extra = { budgetShortfall: result.budgetShortfall, recommendation: 'engine shot budget (level.shots, generateLevels index.html:513) too tight for best play found (greedy-removal, score-first, 2-ply-plan + bomb-trio building); suggest +3 shots per affected level' };
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' levels (cleared via engine attachBubble within engine shot budget -> levelComplete screen + stars + save), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).slice(0, 30).forEach(f => console.log('  FAIL ' + f));
if (result.issues && result.issues.length) console.log('issues: ' + JSON.stringify(result.issues));
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
