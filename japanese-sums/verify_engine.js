// Per-game engine verifier: confirms each level's stored partial solution lv.s
// makes checkWin=true (when injected as the player's grid).
// The stored solution lv.s IS a valid partial Japanese Sums solution (verified
// manually for L1; full independent uniqueness verified in verify_unique.js).
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

function mkEl() {
  return new Proxy({
    style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], parentElement: null, parentNode: null,
    width: 0, height: 0, clientWidth: 500, clientHeight: 500,
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    getContext: () => new Proxy({}, { get: () => () => {}, set: () => true }),
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function(c) { return c; }, removeChild: function(c) { return c; }, remove: function() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '', className: '',
  }, { get(t, p) { if (p in t) return t[p]; return () => t; }, set: () => true });
}
const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean, parseInt, parseFloat, isNaN, isFinite, Symbol,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function() { return { createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {} }; } },
  document: { getElementById: () => mkEl(), getElementsByTagName: () => [mkEl()], querySelector: () => mkEl(), querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {}, createElement: () => mkEl(), body: mkEl(), head: mkEl(), documentElement: mkEl(), hidden: false, visibilityState: 'visible' },
  localStorage: { getItem: () => null, setItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch(e) { return 0; } },
  clearTimeout: () => {}, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
};
sandbox.webkitAudioContext = sandbox.window.AudioContext;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx); } catch (e) { console.error('engine load error:', e.message); process.exit(1); }

let pass = 0, fail = 0, fails = [];
const det = vm.runInContext(`({
  LEVELSLen: typeof LEVELS !== 'undefined' ? LEVELS.length : 0,
})`, ctx);

// Verify that the stored lv.s satisfies isLineSatisfied (clues match + no repeats)
// for all rows + cols.
for (let i = 0; i < det.LEVELSLen; i++) {
  const ok = vm.runInContext(`(function(){
    const L = LEVELS[${i}];
    level = L;
    grid = L.s.map(r => r.slice());
    try {
      for (let r = 0; r < L.N; r++) if (!isLineSatisfied('row', r)) return false;
      for (let c = 0; c < L.N; c++) if (!isLineSatisfied('col', c)) return false;
      return true;
    } catch(e) { return false; }
  })()`, ctx);
  if (ok) pass++;
  else { fail++; fails.push(`L${i+1}`); }
}
console.log(`Japanese Sums in-engine: ${pass}/${det.LEVELSLen} PASS`);
if (fail) console.log('Fails:', fails.slice(0, 5));
process.exit(fail === 0 ? 0 : 1);
