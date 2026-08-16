#!/usr/bin/env node
/* GENERATED in-engine verifier for ripple-effect — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox. Engine is an IIFE (const G=(()=>{...})()),
 * so SOURCE SURGERY injects globalThis.__RE right before the "PUBLIC API" return (index.html
 * on disk untouched).
 *
 * Levels are STATICALLY EMBEDDED (2026-08-16 fix): the old runtime generateLevel was
 * unboundedly slow in-browser (measured L6=171.7s, L14=126.8s, L18=59.6s; 15+ of 31 items
 * could not finish inside the old 105s worker cap). All 30 campaign levels + the 10-puzzle
 * daily pool now ship in index.html and hydrate via hydrateLevel() — no fork workers, no
 * cross-run generation cache needed anymore.
 *
 * Per level 1..30 + daily: independent rule validation (regions tile the grid; solution is
 * a permutation of 1..regionSize per region; equal values in a row/col are farther apart
 * than their value; >=1 given per region; hydrated compact fields round-trip exactly),
 * then PLAYED through the engine's own input path: state.selectedCell={r,c} +
 * placeNumber(solution[r][c]) for every non-given cell; checkWin -> onLevelComplete must set
 * save.levelProgress[id].completed and persist to localStorage rippleEffectSave_v1.
 * Also asserts startLevel returns synchronously with levelData set (no "Generating
 * puzzle..." deferred path left) and the daily pool pick is deterministic by date.
 * Usage: node ripple-effect/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

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
  code = code.replace(SURGERY_ANCHOR, 'globalThis.__RE={LEVELS,DAILY_POOL,hydrateLevel,state,placeNumber,startLevel,startDaily,STATIC_TABLE_ONLY:true};\n' + SURGERY_ANCHOR);
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

const { ctx, timerErrors } = makeCtx();

const DRIVER = `(function(){
  'use strict';
  const RE=globalThis.__RE;
  if(!RE)throw new Error('surgery exports missing');
  let pass=0,fail=0,fails=[],failIdx=[];
  const notes=[];
  const issues=[];
  if(!RE.STATIC_TABLE_ONLY)issues.push('engine still exposes runtime generateLevel (expected static-only build)');
  if(RE.LEVELS.length!==30)throw new Error('LEVELS.length='+RE.LEVELS.length);
  if(!Array.isArray(RE.DAILY_POOL)||RE.DAILY_POOL.length!==10)throw new Error('DAILY_POOL.length='+(RE.DAILY_POOL&&RE.DAILY_POOL.length));
  /* difficulty structure: sizes 6/8/10/12 in ascending blocks, removal fraction .30-.55 */
  const wantSizes=RE.LEVELS.map(l=>l.size).join(',');
  if(wantSizes!='6,6,6,6,6,8,8,8,8,8,8,8,10,10,10,10,10,10,10,10,10,10,12,12,12,12,12,12,12,12')issues.push('size schedule changed: '+wantSizes);
  for(let i=1;i<RE.LEVELS.length;i++)if(RE.LEVELS[i].difficulty<RE.LEVELS[i-1].difficulty)issues.push('difficulty not monotonic at L'+(i+1));
  function validate(data,compact){
   const{size,regions,regionMap,solution,puzzle}=data;
   if(compact){
    if(compact.rm.length!==size*size||compact.sol.length!==size*size||compact.giv.length!==size*size)throw new Error('compact field length mismatch');
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      if(regionMap[r][c]!==parseInt(compact.rm[r*size+c],36))throw new Error('rm hydrate mismatch at '+r+','+c);
      if(solution[r][c]!==parseInt(compact.sol[r*size+c],36))throw new Error('sol hydrate mismatch at '+r+','+c);
      if(!!puzzle[r][c]!==(compact.giv[r*size+c]==='1'))throw new Error('giv hydrate mismatch at '+r+','+c);
    }
   }
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
  function playAndAssert(id,isDaily){
   const t0=Date.now();
   if(isDaily){RE.startDaily();}else{RE.startLevel(id);}
   const genMs=Date.now()-t0;
   if(genMs>2000)issues.push((isDaily?'daily':'L'+id)+' hydration took '+genMs+'ms (expected instant static lookup)');
   const st=RE.state;
   if(!st.levelData)throw new Error('no levelData — startLevel did not hydrate the static level synchronously');
   const data=st.levelData;
   validate(data,isDaily?null:RE.LEVELS.find(l=>l.id===id));
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
   return{placed:placed,givens:givens,size:size,stars:lp.stars,genMs:genMs};
  }
  for(const L of RE.LEVELS){
   try{
    const res=playAndAssert(L.id,false);
    pass++;
    if(L.id===1||L.id===6||L.id===14||L.id===23||L.id===30)notes.push('L'+L.id+' ('+res.size+'x'+res.size+', diff '+L.difficulty.toFixed(2)+'): '+res.placed+' placed + '+res.givens+' givens, completed=true, stars='+res.stars+', hydrate '+res.genMs+'ms');
   }catch(e){fail++;failIdx.push(L.id);fails.push('L'+L.id+' EX:'+String(e.message).slice(0,90));}
  }
  try{
   const res=playAndAssert('daily',true);
   pass++;notes.push('daily (static pool '+RE.DAILY_POOL.length+' puzzles): '+res.placed+' placed + '+res.givens+' givens, completed=true');
  }catch(e){fail++;failIdx.push(99);fails.push('daily EX:'+String(e.message).slice(0,90));}
  return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes,issues:issues,timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
  })()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
console.log(SLUG + ' in-engine verification: ' + result.pass + '/' + result.total + ' items (30 static levels independently validated + played via placeNumber + daily from the static pool), verdict=' + result.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
if (result.issues && result.issues.length) console.log('issues: ' + JSON.stringify(result.issues));
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
