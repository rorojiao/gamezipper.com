#!/usr/bin/env node
/* GENERATED in-engine verifier for compound-word — pattern follows akari/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox. Plays the entire database through the
 * engine's own input path: per category startCategory(cat) -> for the current puzzle type each
 * letter of puzzle.bridge via typeLetter (auto-submits via its own setTimeout) -> onCorrect ->
 * markSolved. Asserts every one of the 180 puzzles is accepted, all 18 categories reach
 * completed==total, state.totalSolved===180, progress persisted to localStorage, plus the
 * daily puzzle is submittable. Also checks puzzle key uniqueness (data integrity).
 * Usage: node compound-word/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'compound-word';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* no source surgery needed: top-level function declarations */

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
try { vm.runInContext(code, ctx, { filename: 'compound-word-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
let pass=0,fail=0,fails=[],failIdx=[],idx=0;
const notes=[];
const issues=[];
/* data integrity: unique puzzle keys, sane fields */
const seen={};let dup=0,bad=0;
for(const p of PUZZLES){
 if(!p.left||!p.bridge||!p.right||!/^[A-Z]+$/.test(p.bridge))bad++;
 const k=p.left+'|'+p.bridge+'|'+p.right;
 if(seen[k]){dup++;issues.push('duplicate puzzle '+k);}else seen[k]=1;
}
if(bad)issues.push(bad+' puzzles with empty/non-alpha bridge');
if(dup===0&&bad===0)notes.push('data: '+PUZZLES.length+' puzzles, all keys unique');
for(const cat of CATEGORIES){
 idx++;
 try{
  const total=getCatPuzzles(cat).length;
  if(total===0)throw new Error('no puzzles');
  let guard=total*3+5;
  let solvedHere=0;
  while(getCatStats(cat).completed<total){
   if(guard--<0)throw new Error('loop guard, completed='+getCatStats(cat).completed+'/'+total);
   startCategory(cat);
   const p=getCurrentPuzzle();
   if(!p)throw new Error('no current puzzle');
   if(isPuzzleSolved(p))throw new Error('startCategory returned already-solved puzzle while cat incomplete');
   for(const ch of p.bridge){typeLetter(ch);}
   if(!isPuzzleSolved(p))throw new Error('answer not accepted: '+p.left+'['+p.bridge+']'+p.right);
   solvedHere++;
  }
  if(state.catProgress[cat].completed!==total)throw new Error('catProgress mismatch');
  notes.push(cat+': '+solvedHere+' accepted');
  pass++;
 }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' '+cat+' EX:'+String(e.message).slice(0,80));}
}
/* global: full database solved + persisted */
idx++;
try{
 if(state.totalSolved!==PUZZLES.length)throw new Error('totalSolved='+state.totalSolved+' expected '+PUZZLES.length);
 const notSolved=PUZZLES.filter(p=>!isPuzzleSolved(p));
 if(notSolved.length)throw new Error(notSolved.length+' puzzles not marked solved');
 const raw=localStorage.getItem('compound_word_save');
 if(!raw)throw new Error('save not persisted');
 const sv=JSON.parse(raw);
 if(sv.totalSolved!==PUZZLES.length)throw new Error('persisted totalSolved='+sv.totalSolved);
 pass++;
 notes.push('all '+PUZZLES.length+' puzzles solved + persisted, coins='+state.coins);
}catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' global EX:'+String(e.message).slice(0,80));}
/* daily puzzle is submittable through the same path */
idx++;
try{
 startDaily();
 const p=getCurrentPuzzle();
 if(!p)throw new Error('no daily puzzle');
 const wasSolved=isPuzzleSolved(p);
 for(const ch of p.bridge){typeLetter(ch);}
 if(!isPuzzleSolved(p))throw new Error('daily answer not accepted');
 if(!wasSolved&&state.lastDailyDate!==new Date().toISOString().slice(0,10))throw new Error('daily date not tracked');
 pass++;
 notes.push('daily puzzle accepted ('+p.left+'['+p.bridge+']'+p.right+')');
}catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' daily EX:'+String(e.message).slice(0,80));}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes.slice(0,20),issues:issues.slice(0,10),timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' items (18 categories played to completion + global 180-solved + daily), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
if (result.issues && result.issues.length) console.log('data issues: ' + JSON.stringify(result.issues));
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
