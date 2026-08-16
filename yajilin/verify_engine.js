#!/usr/bin/env node
/* GENERATED in-engine verifier for yajilin — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox (top-level var/function globals, no
 * surgery). Because the engine's own genPuzzle (index.html:185) runs up to 200 attempts of
 * an UNBOUNDED exhaustive Hamiltonian-cycle DFS (findHC:216) per level — some seeds hang for
 * minutes — each level is verified in a CHILD PROCESS with a kill timer (same file,
 * YAJ_WORKER env), in parallel across CPUs.
 * Per level 0..29 + daily, in the worker:
 *   1. init(); startLevel(idx) — the engine's own generator (genPuzzle -> shaded set +
 *      arrow clues + its own hc). startLevel failure (genPuzzle null -> showTitle) is a
 *      content FAIL: the level button does nothing.
 *   2. Independent validation: every arrow clue counts exactly n of the generator's shaded
 *      cells in its ray; shaded cells pairwise non-adjacent.
 *   3. KEY check: cellAction (:443) refuses to mark clue cells and checkWin (:494) requires
 *      every non-shaded non-clue cell to be loop-marked as ONE cycle — so winning needs a
 *      Hamiltonian cycle over grid - shaded - clues. The engine's own hc (findHC :216 blocks
 *      only shaded cells; clues are placed after by makeClues :248) ignores clues and is
 *      unplayable whenever a clue sits on it. An independent Warnsdorff+pruning DFS searches
 *      the cycle; if the intended shading admits none, a bounded search over alternate
 *      shadings (non-adjacent, all clue counts == n) tries to find ANY winnable state.
 *   4. A found solution is PLAYED through the engine's own cellAction (shade the shaded set,
 *      then loop-mark the cycle) and checkWin must fire showWin: #winOv shown and
 *      save.lv[idx] stars persisted to localStorage yajilinV1.
 * Usage: node yajilin/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { fork } = require('child_process');
const os = require('os');

const SLUG = 'yajilin';
const SLUG_DIR = __dirname;

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

function makeCtx() {
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
  const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const code = scripts.join('\n');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx, { filename: 'yajilin-bundle.js' });
  return { ctx };
}

const WORKER_DRIVER = `(function(){
'use strict';
const IDX=__IDX__;
const LEVEL_N=IDX===-1?'daily':'L'+(IDX+1);
function findCycle(w,h,blocked,deadline){
 var cells=[],idxOf={};
 for(var r=0;r<h;r++)for(var c=0;c<w;c++){var k=r+','+c;if(!blocked.has(k)){idxOf[k]=cells.length;cells.push([r,c])}}
 var N=cells.length;
 if(N<4||N%2!==0)return {cycle:null,reason:'free='+N+(N%2?' (odd — bipartite grid admits no cycle)':'')};
 var adj=new Array(N);
 for(var i=0;i<N;i++){
  var r=cells[i][0],c=cells[i][1],a=[];
  var d=[[0,1],[1,0],[0,-1],[-1,0]];
  for(var t=0;t<4;t++){var nr=r+d[t][0],nc=c+d[t][1];var id=idxOf[nr+','+nc];if(id!==undefined)a.push(id)}
  adj[i]=a;
 }
 var deg0=adj.map(function(a){return a.length});
 for(var i=0;i<N;i++)if(deg0[i]<2)return {cycle:null,reason:'degree<2'};
 var s=0;for(var i=1;i<N;i++)if(deg0[i]<deg0[s])s=i;
 var onPath=new Uint8Array(N);
 var path=[];
 var nodes=0;
 var CAP=2000000;
 var aborted=false;
 function unvis(i){var d=0;var a=adj[i];for(var t=0;t<a.length;t++)if(!onPath[a[t]])d++;return d}
 function dfs(u){
  if(path.length===N){
   var a=adj[u];for(var t=0;t<a.length;t++)if(a[t]===s)return true;
   return false;
  }
  if(++nodes>CAP){aborted=true;return false}
  if((nodes&2047)===0&&Date.now()>deadline){aborted=true;return false}
  var cand=[];
  var a=adj[u];
  for(var t=0;t<a.length;t++){var v=a[t];if(!onPath[v])cand.push(v)}
  cand.sort(function(x,y){return unvis(x)-unvis(y)});
  for(var ci=0;ci<cand.length;ci++){
   var v=cand[ci];
   onPath[v]=1;path.push(v);
   var dead=false;
   if((nodes&63)===0){
    for(var i=0;i<N&&!dead;i++){
     if(onPath[i])continue;
     var av=unvis(i);
     var a2=adj[i];for(var t=0;t<a2.length;t++)if(a2[t]===u){av++;break}
     if(av<2)dead=true;
    }
   }
   if(!dead&&dfs(v))return true;
   onPath[v]=0;path.pop();
  }
  return false;
 }
 onPath[s]=1;path.push(s);
 if(!dfs(s))return {cycle:null,reason:aborted?'search budget exceeded':'exhausted (proven none)'};
 return {cycle:path.map(function(i){return cells[i]}),reason:''};
}
init();
save.tut=true;
startLevel(IDX);
if(S.screen!=='game')return {idx:IDX,ok:false,msg:'startLevel failed: genPuzzle returned null (200 attempts), engine bounces to title screen — level unplayable'};
const w=S.w,h=S.h;
var dMap={U:[-1,0],D:[1,0],L:[0,-1],R:[0,1]};
var shadeSet=new Set(S.shaded.map(function(s){return s[0]+','+s[1]}));
for(var i=0;i<S.clues.length;i++){
 var cl=S.clues[i],cnt=0;
 var cr=cl.r+dMap[cl.d][0],cc=cl.c+dMap[cl.d][1];
 while(cr>=0&&cr<h&&cc>=0&&cc<w){if(shadeSet.has(cr+','+cc))cnt++;cr+=dMap[cl.d][0];cc+=dMap[cl.d][1]}
 if(cnt!==cl.n)return {idx:IDX,ok:false,msg:'clue ('+cl.r+','+cl.c+') '+cl.d+'='+cl.n+' sees '+cnt+' of the generator shaded cells'};
}
var d4=[[0,1],[1,0],[0,-1],[-1,0]];
for(const k of shadeSet){
 var p=k.split(','),r=+p[0],c=+p[1];
 for(var t=0;t<4;t++){var nr=r+d4[t][0],nc=c+d4[t][1];if(shadeSet.has(nr+','+nc))return {idx:IDX,ok:false,msg:'adjacent shaded '+k+'~'+nr+','+nc}}
}
var hcSet=new Set(S.hc);
var cluesOnHc=0;
for(var i=0;i<S.clues.length;i++)if(hcSet.has(S.clues[i].r+','+S.clues[i].c))cluesOnHc++;
function blockedFrom(shades){
 var b=new Set(shades);
 for(var i=0;i<S.clues.length;i++)b.add(S.clues[i].r+','+S.clues[i].c);
 return b;
}
var res=findCycle(w,h,blockedFrom(shadeSet),Date.now()+9000);
var usedAlt=false;
if(!res.cycle){
 /* bounded search over alternate shadings consistent with all clue counts */
 var nonClue=[];
 var clueAt={};
 for(var i=0;i<S.clues.length;i++)clueAt[S.clues[i].r+','+S.clues[i].c]=S.clues[i];
 for(var r=0;r<h;r++)for(var c=0;c<w;c++){if(!clueAt[r+','+c])nonClue.push([r,c])}
 /* rays through each cell, per clue: cell contributes to clue k iff on its ray */
 var contrib=nonClue.map(function(){return []});
 for(var ci=0;ci<S.clues.length;ci++){
  var cl=S.clues[ci];
  var cr=cl.r+dMap[cl.d][0],cc=cl.c+dMap[cl.d][1];
  while(cr>=0&&cr<h&&cc>=0&&cc<w){
   var k=cr+','+cc;
   if(!clueAt[k]){var ni=nonClue.findIndex(function(p){return p[0]===cr&&p[1]===cc});contrib[ni].push(ci)}
   cr+=dMap[cl.d][0];cc+=dMap[cl.d][1];
  }
 }
 var counts=new Array(S.clues.length).fill(0);
 var curShades=[];
 var altDeadline=Date.now()+12000;
 var tried=0;
 function altDFS(pos){
  /* all counts satisfied exactly? */
  if(Date.now()>altDeadline)return null;
  var allEq=true,anyOver=false;
  for(var q=0;q<counts.length;q++){if(counts[q]>S.clues[q].n){anyOver=true;break}if(counts[q]!==S.clues[q].n)allEq=false}
  if(anyOver)return null;
  if(allEq&&curShades.length>=1){
   tried++;
   var shades=curShades.map(function(p){return [p[0],p[1]]});
   var b=blockedFrom(new Set(shades.map(function(p){return p[0]+','+p[1]})));
   var rr=findCycle(w,h,b,altDeadline);
   if(rr.cycle)return {shades:shades,cycle:rr.cycle};
   /* fall through: keep exploring (more cells that contribute to no ray stay valid) */
  }
  if(pos>=nonClue.length)return null;
  var p=nonClue[pos];
  /* skip: cell adjacent to already-shaded? (still allow deeper) */
  var adjShaded=false;
  for(var t=0;t<4;t++){var nr=p[0]+d4[t][0],nc=p[1]+d4[t][1];if(curShades.some(function(q){return q[0]===nr&&q[1]===nc})){adjShaded=true;break}}
  if(!adjShaded){
   curShades.push(p);
   for(var q=0;q<contrib[pos].length;q++)counts[contrib[pos][q]]++;
   var got=altDFS(pos+1);
   if(got)return got;
   curShades.pop();
   for(var q=0;q<contrib[pos].length;q++)counts[contrib[pos][q]]--;
  }
  return altDFS(pos+1);
 }
 var alt=altDFS(0);
 if(alt){
  usedAlt=true;
  /* play the alternate: reset grids then shade alt.shades */
  for(var r=0;r<h;r++)for(var c=0;c<w;c++){S.shadeGrid[r][c]=0;S.loopGrid[r][c]=0}
  S.mode='shade';
  for(const s of alt.shades)cellAction(s[0],s[1]);
  S.mode='loop';
  var cycSet=new Set(alt.cycle.map(function(p){return p[0]+','+p[1]}));
  for(var r=0;r<h;r++)for(var c=0;c<w;c++){
   if(clueAt[r+','+c])continue;
   if(cycSet.has(r+','+c)&&!S.loopGrid[r][c])cellAction(r,c);
  }
 }else{
  return {idx:IDX,ok:false,msg:'no winnable state: intended shading has no cycle over grid-shaded-clues ('+res.reason+', cluesOnEngineHc='+cluesOnHc+') and bounded alternate-shading search found none ('+tried+' candidates)'};
 }
}else{
 S.mode='shade';
 for(const s of S.shaded)cellAction(s[0],s[1]);
 S.mode='loop';
 var cycSet=new Set(res.cycle.map(function(p){return p[0]+','+p[1]}));
 var clueAt={};
 for(var i=0;i<S.clues.length;i++)clueAt[S.clues[i].r+','+S.clues[i].c]=S.clues[i];
 for(var r=0;r<h;r++)for(var c=0;c<w;c++){
  if(clueAt[r+','+c])continue;
  if(cycSet.has(r+','+c)&&!S.loopGrid[r][c])cellAction(r,c);
 }
}
const wo=document.getElementById('winOv');
if(!wo.classList.contains('show'))return {idx:IDX,ok:false,msg:'winOv not shown after playing solution (cluesOnEngineHc='+cluesOnHc+')'};
var starsNote='';
if(IDX>=0){
 const sv=JSON.parse(localStorage.getItem('yajilinV1')||'{}');
 if(!(sv.lv&&sv.lv[IDX]>=1))return {idx:IDX,ok:false,msg:'save.lv['+IDX+'] not persisted'};
 starsNote='stars='+sv.lv[IDX];
}
return {idx:IDX,ok:true,msg:(usedAlt?'won via ALTERNATE shading':'won on intended shading')+'; engine hc crosses '+cluesOnHc+' clue cells'+(starsNote?', '+starsNote:'')};
})()`.replace('"use strict";', '');

/* ------------------------------------------------------------------ *
 * WORKER MODE                                                        *
 * ------------------------------------------------------------------ */
if (process.env.YAJ_WORKER) {
  const idxs = JSON.parse(process.env.YAJ_WORKER);
  for (const idx of idxs) {
    const t0 = Date.now();
    let out;
    try {
      const { ctx } = makeCtx();
      out = vm.runInContext(String(WORKER_DRIVER).replace('__IDX__', String(idx)), ctx);
    } catch (e) {
      out = { idx, ok: false, msg: 'EX:' + String(e && e.message).slice(0, 140) };
    }
    out.ms = Date.now() - t0;
    process.stdout.write(JSON.stringify(out) + '\n'); /* flush per level so a later hang cannot lose completed levels */
  }
  process.exit(0);
}


/* ------------------------------------------------------------------ *
 * PARENT MODE                                                        *
 * ------------------------------------------------------------------ */
const ALL = [];
for (let i = 0; i < 30; i++) ALL.push(i);
ALL.push(-1); /* daily */
const WORKERS = Math.min(8, os.cpus().length);
const assign = Array.from({ length: WORKERS }, () => []);
ALL.forEach((id, i) => assign[i % WORKERS].push(id));

const results = {};
let left = assign.filter(a => a.length).length;
const killed = new Set();

for (const ids of assign) {
  if (!ids.length) continue;
  const child = fork(__filename, [], { env: Object.assign({}, process.env, { YAJ_WORKER: JSON.stringify(ids) }), stdio: ['inherit', 'pipe', 'inherit', 'ipc'] });
  let buf = '';
  child.stdout.on('data', d => {
    buf += d;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
      try { const item = JSON.parse(line); results[item.idx] = item; } catch (e) {}
    }
  });
  const timer = setTimeout(() => {
    ids.forEach(id => killed.add(id));
    try { child.kill('SIGKILL'); } catch (e) {}
  }, 100000);
  child.on('exit', () => {
    clearTimeout(timer);
    /* results already collected incrementally; unreported ids become TIMEOUT */
    if (--left === 0) report();
  });
}

function report() {
  let pass = 0, fail = 0;
  const failIdx = [], fails = [], notes = [], issues = [];
  for (const id of ALL) {
    const r = results[id];
    const label = id === -1 ? 'daily' : 'L' + (id + 1);
    if (!r) {
      fail++; failIdx.push(id === -1 ? 99 : id + 1);
      fails.push(label + ': worker killed at 100s — engine search (genPuzzle/findHC) does not terminate; in-browser this hangs the tab');
      continue;
    }
    if (r.ok) {
      pass++;
      if (id === 0 || id === 29 || id === -1) notes.push(label + ' (' + r.ms + 'ms): ' + r.msg);
      else if (/ALTERNATE/.test(r.msg)) notes.push(label + ' (' + r.ms + 'ms): ' + r.msg);
    } else {
      fail++; failIdx.push(id === -1 ? 99 : id + 1);
      fails.push(label + ' (' + r.ms + 'ms): ' + r.msg);
    }
  }
  const uniqFails = [...new Set(fails.map(f => f.replace(/^(\S+) \(\d+ms\): /, '').slice(0, 60)))];
  uniqFails.forEach(f => issues.push(f));
  console.log(SLUG + ' in-engine verification: ' + pass + '/' + (pass + fail) + ' items (30 levels + daily, per-level child processes: engine genPuzzle + independent clue/non-adjacency validation + independent Hamiltonian cycle over grid-shaded-clues + played via cellAction to win), verdict=' + (fail === 0 ? 'PASS' : 'FAIL'));
  (notes || []).forEach(n => console.log('  ' + n));
  fails.slice(0, 40).forEach(f => console.log('  FAIL ' + f));
  const out = { pass, fail, total: pass + fail, failIdx, verdict: fail === 0 ? 'PASS' : 'FAIL' };
  if (fails.length) out.fails = fails.slice(0, 15);
  console.log(JSON.stringify(out));
  process.exit(fail === 0 ? 0 : 1);
}
