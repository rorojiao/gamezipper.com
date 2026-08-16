#!/usr/bin/env node
/* GENERATED in-engine verifier for minesweeper — pattern follows akari/verify_engine.js.
 * Engine lives in external game.js (index.html only holds SEO/canvas shell), so we load
 * index.html inline scripts PLUS the local game.js into a vm sandbox.
 * Proves per difficulty (beginner/intermediate/expert, 3 seeded boards each):
 *   P1 first-click-safe: after first reveal at (2,2), no mine in the 3x3 around it, gameState 'playing'.
 *   P2 win reachable: reveal every non-mine cell via handleCellClick -> checkWin sets gameState='won',
 *      bestWins[difficulty] incremented, win overlay shown.
 *   P3 flag-toggle before first reveal is harmless (toggle on/off, game still winnable).
 * Usage: node minesweeper/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'minesweeper';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* external engine file (deferred src=game.js) — load it too */
const engineSrc = fs.readFileSync(path.join(SLUG_DIR, 'game.js'), 'utf8');
code += '\n;\n' + engineSrc;
/* no source surgery needed: game.js has top-level function declarations (global) */

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
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 40,
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
/* seeded Math clone — never mutate host Math */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
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
try { vm.runInContext(code, ctx, { filename: 'minesweeper-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, failIdx: [1], verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const DIFFS=['beginner','intermediate','expert'];
let pass=0,fail=0,fails=[],failIdx=[],idx=0;
const notes=[];
for(const diff of DIFFS){
 for(let trial=0;trial<3;trial++){
  idx++;
  try{
   Math.random=mulberry32Local(9000+trial*17+DIFFS.indexOf(diff)*7);
   newGame(diff);
   const cfg=DIFFICULTIES[diff];
   if(gameState!=='idle')throw new Error('newGame state');
   /* P3: flag then unflag before first reveal must stay harmless */
   if(trial===0){toggleFlag(0,0);toggleFlag(0,0);}
   const fr=2,fc=2;
   handleCellClick(fr,fc);
   if(gameState!=='playing')throw new Error('firstClick lost state='+gameState);
   if(!board[fr][fc].revealed)throw new Error('firstClick not revealed');
   /* P1: first-click-safe — no mine within 3x3 of first click */
   let mineNear=false;
   for(let r=fr-1;r<=fr+1;r++)for(let c=fc-1;c<=fc+1;c++){
    if(r>=0&&r<cfg.rows&&c>=0&&c<cfg.cols&&board[r][c].mine)mineNear=true;
   }
   if(mineNear)throw new Error('P1 mine in first-click 3x3');
   /* P2: reveal every non-mine cell through the engine's own click handler */
   for(let r=0;r<cfg.rows;r++)for(let c=0;c<cfg.cols;c++){
    if(board[r][c].mine)continue;
    if(board[r][c].revealed)continue;
    handleCellClick(r,c);
    if(gameState==='lost')throw new Error('lost while revealing safe cell '+r+','+c);
   }
   if(gameState!=='won')throw new Error('P2 no win, state='+gameState);
   if(!(bestWins[diff]>=1))throw new Error('win not recorded in bestWins');
   const ov=document.getElementById('game-over-overlay');
   if(!ov||ov.style.display!=='flex')throw new Error('win overlay not shown');
   notes.push(diff+'#'+trial+': win OK (mines='+cfg.mines+')');
   pass++;
  }catch(e){fail++;failIdx.push(idx);fails.push('#'+idx+' '+diff+'#'+trial+' EX:'+String(e.message).slice(0,80));}
 }
}
function mulberry32Local(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
return {pass:pass,fail:fail,total:pass+fail,failIdx:failIdx,fails:fails.slice(0,15),verdict:fail===0?'PASS':'FAIL',notes:notes.slice(0,6),timerErrors:(globalThis.__timerErrors||[]).slice(0,5)};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, failIdx: result.failIdx || [], verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' boards (3 per difficulty), first-click-safe + win-reachable, verdict=' + out.verdict);
if (result.timerErrors && result.timerErrors.length) console.log('timer errors: ' + JSON.stringify(result.timerErrors));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
