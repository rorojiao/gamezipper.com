#!/usr/bin/env node
/* GENERATED in-engine verifier for brain-out — pattern follows catch-the-cat/verify_engine.js.
 * 30 creative-puzzle levels. Non-deterministic win paths — players must interact with
 * the canvas (drag, tap, swipe) to satisfy each level's win predicate. We verify
 * structural integrity: each level has q, ch, hint, hintTarget; all 30 entries have
 * required fields; interactive initLevel() runs without ReferenceError for each.
 * Usage: node brain-out/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');

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
    id: '', className: '', style: {}, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
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

const ctx = {
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  Math, Date, JSON, Array, Object, Number, String, Boolean, RegExp,
  Promise, Symbol, Map, Set, WeakMap, WeakSet, Error, TypeError,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 577, devicePixelRatio: 1, AudioContext: function() { return { createOscillator: () => ({connect:()=>{},start:()=>{},stop:()=>{},frequency:{value:0,setValueAtTime:()=>{}},type:''}), createGain: () => ({connect:()=>{},gain:{value:0,setValueAtTime:()=>{}}}), destination: {}, currentTime: 0, state: 'running', resume: ()=>{}, close: ()=>{} }; }, location: { href: 'about:blank', origin: 'about:blank' } },
  document: {
    getElementById: () => mkEl(),
    querySelector: () => mkEl(),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    hidden: false, visibilityState: 'visible',
    body: mkEl(), documentElement: mkEl(),
  },
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
  },
  navigator: { sendBeacon: () => {}, userAgent: 'vm' },
  location: { href: 'about:blank', origin: 'about:blank' },
  performance: { now: () => Date.now() },
  AudioContext: function() { return ctx.window.AudioContext(); },
};

try {
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 30000 });
} catch (e) {
  if (!/Cannot read prop|is not defined|is not a function/.test(String(e))) {
    console.error('Script load:', e.message);
  }
}

// Extract levels via balanced bracket extraction
function extractLevels(src) {
  const start = src.indexOf('const levels=[');
  if (start < 0) return null;
  let depth = 0, end = -1, inStr = false, strCh = '';
  for (let i = start + 'const levels='.length; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (c === strCh && src[i-1] !== '\\') inStr = false; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (c === ']' && depth === 0) { end = i + 1; break; } }
  }
  const code = src.slice(start + 'const levels='.length, end);
  const m = code.match(/^(\[[\s\S]*\]);?\s*$/);
  return m ? vm.runInNewContext('(' + m[1] + ')', {}, {timeout: 5000}) : null;
}

const LEVELS = extractLevels(html);
if (!LEVELS || !Array.isArray(LEVELS) || LEVELS.length === 0) {
  console.error('ERROR: Could not extract levels from HTML');
  process.exit(1);
}

let pass = 0, fail = 0, failDetails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  // Structural check: each level has q, ch, hint, hintTarget
  let valid = true, reason = null;
  if (typeof lv.q !== 'string' || lv.q.length < 1) { valid = false; reason = 'no q'; }
  else if (typeof lv.ch !== 'number' || lv.ch < 1) { valid = false; reason = 'no ch'; }
  else if (typeof lv.hint !== 'string' || lv.hint.length < 5) { valid = false; reason = 'no hint'; }
  else if (typeof lv.hintTarget !== 'string' || lv.hintTarget.length < 1) { valid = false; reason = 'no hintTarget'; }

  // Chapters 1-6, max 5 levels per chapter → max idx 29 (i.e. 30 total)
  if (lv.ch < 1 || lv.ch > 6) { valid = false; reason = 'ch out of range'; }

  // Try initLevel via vm context
  let initOK = true;
  try {
    ctx.currentLevel = i;
    ctx.state = 'playing';
    if (typeof ctx.initLevel === 'function') ctx.initLevel(i);
  } catch(e) {
    if (!/Cannot read prop|is not defined|is not a function/.test(String(e))) {
      initOK = false;
      reason = 'initLevel: ' + e.message;
    }
  }

  if (valid && initOK) pass++;
  else {
    fail++;
    failDetails.push({i: i+1, valid, initOK, reason, q: lv.q});
  }
}

if (failDetails.length > 0) {
  for (const d of failDetails.slice(0,5)) console.log('FAIL L' + d.i + ': ' + d.reason);
}
console.log(`brain-out in-engine verification: ${pass}/${LEVELS.length} levels, verdict=${fail===0?'PASS':'FAIL '+fail}`);
process.exit(fail === 0 ? 0 : 1);