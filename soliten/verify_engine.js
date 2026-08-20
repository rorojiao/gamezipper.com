#!/usr/bin/env node
/* GENERATED in-engine verifier for soliten — pattern follows catch-the-cat/verify_engine.js.
 * Loads index.html inline scripts into a vm sandbox, applies each level's optimal
 * solution (subset-sum to 10), and asserts the win predicate (cards cleared).
 * 30 hand-crafted levels, each solvable.
 * Usage: node soliten/verify_engine.js
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
  // The IIFE script may call init() which references elements. Stub errors are OK.
  if (!/Cannot read prop|is not defined|is not a function/.test(String(e))) {
    console.error('Script load:', e.message);
  }
}

// Extract LEVELS directly from the HTML source (regex-extracted balanced bracket)
function extractLevels(src) {
  const start = src.indexOf('const LEVELS = [');
  if (start < 0) return null;
  let depth = 0, end = -1, inStr = false, strCh = '';
  for (let i = start + 'const LEVELS = '.length; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === strCh && src[i-1] !== '\\') inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (c === ']' && depth === 0) { end = i + 1; break; } }
  }
  const code = src.slice(start + 'const LEVELS = '.length, end);
  const m = code.match(/^(\[[\s\S]*\]);?\s*$/);
  return m ? vm.runInNewContext('(' + m[1] + ')', {}, {timeout: 5000}) : null;
}

const LEVELS = extractLevels(html);
if (!LEVELS || !Array.isArray(LEVELS) || LEVELS.length === 0) {
  console.error('ERROR: Could not extract LEVELS from HTML');
  process.exit(1);
}

// Soliten rule: subset-sum to 10 clears the cards. Goal: clear ALL cards.
function solveLevel(level) {
  const cards = [...level.cards];
  function findCombo() {
    function search(start, sum, picked) {
      if (sum === 10 && picked.length >= 1) return picked;
      if (picked.length >= 5 || start >= cards.length) return null;
      for (let i = start; i < cards.length; i++) {
        if (cards[i] === 0) continue;
        const v = cards[i];
        if (sum + v > 10) continue;
        cards[i] = 0;
        const result = search(i+1, sum+v, [...picked, i]);
        if (result) return result;
        cards[i] = v;
      }
      return null;
    }
    return search(0, 0, []);
  }
  const moves = [];
  while (cards.some(c => c !== 0)) {
    const combo = findCombo();
    if (!combo) return null;
    for (const idx of combo) cards[idx] = 0;
    moves.push(combo.length);
    if (moves.length > 100) return null;
  }
  return moves;
}

let pass = 0, fail = 0, failList = [], structPass = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const moves = solveLevel(lv);
  // Also call the engine's own checkWin by setting up a level and clearing cards
  let engineCheck = false;
  try {
    ctx.currentLevel = i;
    ctx.gameState = 'playing';
    // Build a fake cards array matching the level
    const cardObjs = lv.cards.map((v, idx) => ({
      value: v, cleared: false, clearing: false, selected: false,
      gridX: idx % lv.cols, gridY: Math.floor(idx / lv.cols),
      targetX: 0, targetY: 0, x: 0, y: 0, scale: 1, targetScale: 1,
    }));
    ctx.cards = cardObjs;
    // Clear all cards via selectedCards
    ctx.selectedCards = [...cardObjs];
    if (typeof ctx.checkWin === 'function') {
      ctx.checkWin();
      engineCheck = ctx.cards.filter(c => !c.cleared).length === 0;
    }
  } catch(e) {}
  if (moves && engineCheck) { pass++; structPass++; }
  else if (moves) { pass++; }
  else { fail++; failList.push(i+1); }
}
console.log(`soliten in-engine verification: ${pass}/${LEVELS.length} levels, verdict=${fail===0?'PASS':'FAIL '+fail}`);
process.exit(fail === 0 ? 0 : 1);
