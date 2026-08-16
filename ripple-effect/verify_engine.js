#!/usr/bin/env node
/* GENERATED in-engine verifier for ripple-effect — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox. Engine is an IIFE (const G=(()=>{...})()),
 * so SOURCE SURGERY injects globalThis.__RE right before the "PUBLIC API" return (index.html
 * on disk untouched). The engine's own generateLevel (seeded regions + backtracking solution +
 * clue removal) is slow (L6 alone ~45s), so the verifier runs it in PARALLEL WORKER PROCESSES
 * (same file, RE_WORKER env) and then injects the results into the parent engine's own
 * state.levelCache — startLevel then takes the engine's own cached-revisit branch
 * (initGameState(id, cache)) exactly as an in-browser replay would. Per level 1..30 + daily:
 * independent rule validation (regions tile the grid; solution is a permutation of 1..regionSize
 * per region; equal values in a row/col are farther apart than their value; >=1 given per
 * region), then PLAYED through the engine's own input path: state.selectedCell={r,c} +
 * placeNumber(solution[r][c]) for every non-given cell; checkWin -> onLevelComplete must set
 * save.levelProgress[id].completed and persist to localStorage rippleEffectSave_v1.
 * Generation wall-times are reported; >8s = in-browser "Generating puzzle..." stall (content note).
 * Usage: node ripple-effect/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { fork } = require('child_process');
const os = require('os');

const SLUG = 'ripple-effect';
const SLUG_DIR = __dirname;

/* ------------------------------------------------------------------ *
 * shared: engine loading (source surgery exports __RE)               *
 * ------------------------------------------------------------------ */
function loadEngine() {
  const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let code = scripts.join('\n');
  const SURGERY_ANCHOR = '/* ========== PUBLIC API ========== */';
  if (!code.includes(SURGERY_ANCHOR)) throw new Error('surgery anchor not found');
  code = code.replace(SURGERY_ANCHOR, 'globalThis.__RE={generateLevel,LEVELS,state,placeNumber,startLevel,startDaily,dailyConfig:function(){const t=new Date();const seed=t.getFullYear()*10000+(t.getMonth()+1)*100+t.getDate();const size=8+Math.floor((t.getDay()+t.getDate())%3)*2;return{id:"daily",size:size,difficulty:.45,seed:seed}}};\n' + SURGERY_ANCHOR);
  return code;
}

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

function buildSandbox() {
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
      AudioContext: function () { return { createOscillator: () => { const freq = { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, cancelScheduledValues: () => {} }; return { connect: () => {}, frequency: freq, detune: freq, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }; },
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
  return { sandbox, timerErrors };
}

function makeCtx() {
  const { sandbox, timerErrors } = buildSandbox();
  const ctx = vm.createContext(sandbox);
  const code = loadEngine();
  vm.runInContext(code, ctx, { filename: 'ripple-effect-bundle.js' });
  return { ctx, timerErrors };
}

/* ------------------------------------------------------------------ *
 * WORKER MODE: run the engine's own generateLevel for assigned ids   *
 * ------------------------------------------------------------------ */
if (process.env.RE_WORKER) {
  const ids = JSON.parse(process.env.RE_WORKER);
  const { ctx } = makeCtx();
  ctx.__flush = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  vm.runInContext(`(function(){
    const RE=globalThis.__RE;const flush=globalThis.__flush;
    const cfgs=${JSON.stringify(ids)}.map(function(id){return id==='daily'?RE.dailyConfig():RE.LEVELS.find(function(l){return l.id===id})});
    for(const cfg of cfgs){
      const t0=Date.now();
      const d=RE.generateLevel(cfg);
      console.error('[worker] L'+cfg.id+' gen '+(Date.now()-t0)+'ms ok='+!!d);
      flush({id:cfg.id,ms:Date.now()-t0,data:d});
    }
  })()`, ctx);
  process.exit(0);
}

/* ------------------------------------------------------------------ *
 * PARENT MODE                                                        *
 * ------------------------------------------------------------------ */
const { ctx, timerErrors } = makeCtx();

/* level ids + daily */
const LEVEL_IDS = vm.runInContext('globalThis.__RE.LEVELS.map(l=>l.id)', ctx);
const ALL_IDS = LEVEL_IDS.concat(['daily']);
const WORKERS = Math.min(Math.max(1, parseInt(process.env.RE_WORKERS_N, 10) || 8), os.cpus().length);

const CACHE_PATH = path.join(SLUG_DIR, '..', '_optimization', 'evidence', 'ripple-effect', 'gen_cache.json');
const KILL_MS = process.env.RE_FILL ? 540000 : 105000;
const genResults = {}; /* id -> {ms, data|null} */
let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch (e) { cache = {}; }
for (const id of ALL_IDS) if (cache[id] && cache[id].data) genResults[id] = { ms: cache[id].ms, data: cache[id].data };
/* only generate what the cache is missing */
const TODO = ALL_IDS.filter(id => !genResults[id]);
const assign = Array.from({ length: WORKERS }, () => []);
TODO.forEach((id, i) => assign[i % WORKERS].push(id));
let workersLeft = assign.filter(a => a.length).length;
const tStart = Date.now();

if (workersLeft === 0) { console.error('no levels'); process.exit(1); }

for (const ids of assign) {
  if (!ids.length) continue;
  const child = fork(__filename, [], { env: Object.assign({}, process.env, { RE_WORKER: JSON.stringify(ids) }), stdio: ['inherit', 'pipe', 'inherit', 'ipc'] });
  let buf = '';
  const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) {} }, KILL_MS);
  child.stdout.on('data', d => {
    buf += d;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
      if (!line.trim()) continue;
      try { const item = JSON.parse(line); genResults[item.id] = { ms: item.ms, data: item.data }; } catch (e) {}
    }
  });
  child.on('exit', () => {
    clearTimeout(timer);
    if (--workersLeft === 0) parentContinue();
  });
}

function parentContinue() {
  for (const id of ALL_IDS) {
    const r = genResults[id];
    if (r && r.data && !(cache[id] && cache[id].data)) cache[id] = { ms: r.ms };
    if (r && r.data) cache[id] = { ms: cache[id] ? cache[id].ms : r.ms, data: r.data };
  }
  try { fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true }); fs.writeFileSync(CACHE_PATH, JSON.stringify(cache)); } catch (e) {}
  const genMs = {};
  for (const id of ALL_IDS) genMs[id] = genResults[id] ? genResults[id].ms : null;

  /* inject generated data into the engine's own levelCache (its cached-revisit path) */
  const inject = [];
  for (const id of ALL_IDS) {
    const r = genResults[id];
    if (!r || !r.data) continue;
    inject.push({ key: id === 'daily' ? 'daily_' + vm.runInContext('globalThis.__RE.dailyConfig().seed', ctx) : id, data: r.data });
  }
  vm.runInContext(`(function(){for(const e of ${JSON.stringify(inject)}){globalThis.__RE.state.levelCache[e.key]=e.data;}})()`, ctx);

  const DRIVER = `(function(){
  'use strict';
  const RE=globalThis.__RE;
  if(!RE)throw new Error('surgery exports missing');
  let pass=0,fail=0,fails=[],failIdx=[];
  const notes=[];
  const issues=[];
  const genMissing=${JSON.stringify(ALL_IDS.filter(id => !(genResults[id] && genResults[id].data)))};
  function validate(data){
   const{size,regions,regionMap,solution,puzzle}=data;
   const seen=new Set();
   for(let rid=0;rid<regions.length;rid++){
    for(const cell of regions[rid]){const k=cell[0]+','+cell[1];if(seen.has(k))throw new Error('cell in two regions');seen.add(k);if(regionMap[cell[0]][cell[1]]!==rid)throw new Error('regionMap mismatch');}
   }
   if(seen.size!==size*size)throw new Error('regions do not tile the grid ('+seen.size+'/'+(size*size)+')');
   for(let rid=0;rid<regions.length;rid++){
    const vals=regions[rid].map(function(cell){return solution[cell[0]][cell[1]]}).sort(function(a,b){return a-b});
    for(let v=1;v<=vals.length;v++)if(vals[v-1]!==v)throw new Error('region '+rid+' values '+vals.join(','));
   }
   for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const v=solution[r][c];
    for(let cc=c+1;cc<size;cc++)if(solution[r][cc]===v&&cc-c<=v)throw new Error('row ripple violation at '+r+','+c+'/'+cc);
    for(let rr=r+1;rr<size;rr++)if(solution[rr][c]===v&&rr-r<=v)throw new Error('col ripple violation at '+r+','+c+'/'+rr);
   }
   for(let rid=0;rid<regions.length;rid++){
    if(!regions[rid].some(function(cell){return puzzle[cell[0]][cell[1]]}))throw new Error('region '+rid+' has no given');
   }
  }
  function playAndAssert(id){
   const ck=id==='daily'?'daily_'+RE.dailyConfig().seed:id;
   if(!RE.state.levelCache[ck])throw new Error('engine generateLevel did not finish within the 105s worker budget for '+id);
   if(id==='daily'){RE.startDaily();}else{RE.startLevel(id);}
   const st=RE.state;
   if(!st.levelData)throw new Error('no levelData (generation missing/failed: '+genMissing.join(',')+')');
   const data=st.levelData;
   validate(data);
   const{size,solution,puzzle}=data;
   let placed=0,givens=0;
   for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    if(puzzle[r][c]){givens++;continue}
    st.selectedCell={r:r,c:c};
    RE.placeNumber(solution[r][c]);
    placed++;
   }
   for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(st.playerGrid[r][c]!==solution[r][c])throw new Error('final grid != solution at '+r+','+c);
   const lid=st.dailyMode?'daily':st.currentLevel;
   const lp=st.save.levelProgress[lid];
   if(!lp||lp.completed!==true)throw new Error('levelProgress['+lid+'].completed not set');
   const raw=localStorage.getItem('rippleEffectSave_v1');
   if(!raw||!JSON.parse(raw).levelProgress[lid])throw new Error('progress not persisted');
   return{placed:placed,givens:givens,size:size,stars:lp.stars};
  }
  for(const L of RE.LEVELS){
   try{
    const res=playAndAssert(L.id);
    pass++;
    if(L.id===1||L.id===30)notes.push('L'+L.id+' ('+res.size+'x'+res.size+'): '+res.placed+' placed + '+res.givens+' givens, completed=true, stars='+res.stars);
   }catch(e){fail++;failIdx.push(L.id);fails.push('L'+L.id+' EX:'+String(e.message).slice(0,90));}
  }
  try{
   const res=playAndAssert('daily');
   pass++;notes.push('daily: completed=true');
  }catch(e){fail++;failIdx.push(99);fails.push('daily EX:'+String(e.message).slice(0,90));}
  const slow=Object.entries(${JSON.stringify(genMs)}).filter(function(e){return e[1]!==null&&e[1]>8000}).map(function(e){return e[0]+':'+(e[1]/1000).toFixed(1)+'s'});
  if(slow.length)issues.push('slow generation (>8s, in-browser blocks on the Generating puzzle... toast): '+slow.join(', '));
  const missing=genMissing.filter(function(id){return id!=='daily'});
  if(missing.length)issues.push('generation did not finish within 105s worker budget: '+missing.join(','));
  return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes,issues:issues,timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
  })()`;

  let result;
  try { result = vm.runInContext(DRIVER, ctx); }
  catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
  if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
  const genNote = ALL_IDS.map(id => id + ':' + (genMs[id] === null ? 'n/a' : genMs[id] + 'ms')).join(' ');
  console.log(SLUG + ' in-engine verification: ' + result.pass + '/' + result.total + ' items (30 levels independently validated + played via placeNumber + daily; engine generateLevel run in 8 parallel workers), verdict=' + result.verdict);
  console.log('  generation wall-times (engine generateLevel): ' + genNote);
  (result.notes || []).forEach(n => console.log('  ' + n));
  if (result.issues && result.issues.length) console.log('issues: ' + JSON.stringify(result.issues));
  if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
  const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
  if (result.fails && result.fails.length) out.fails = result.fails;
  console.log(JSON.stringify(out));
  process.exit(out.fail === 0 ? 0 : 1);
}
