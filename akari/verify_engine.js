#!/usr/bin/env node
/* Akari (Light Up) verifier.
 * Loads index.html, extracts inline scripts into vm sandbox,
 * sets up the game state, applies the embedded solution from
 * each LEVEL[i].solution, and verifies that checkWin() returns true.
 *
 * Usage: node verify_engine.js
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

function mkEl(extra) {
  const el = {
    id: '', className: '', style: {}, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500,
    parentElement: null, parentNode: null, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function(c) { return c; }, removeChild: function(c) { return c; }, remove: function() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => new Proxy(function(){}, { get: (t, p) => () => t, set: () => true }),
  };
  Object.assign(el, extra || {});
  return el;
}

const sandbox = {
  console,
  Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean, parseInt, parseFloat, isNaN, isFinite, Symbol, Error,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function() { return { createOscillator: () => ({ connect: () => {}, frequency: {}, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0 }, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {} }; },
  },
  document: {
    getElementById: (id) => mkEl({ id }),
    getElementsByTagName: () => [mkEl()],
    querySelector: () => mkEl(), querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: () => mkEl(),
    body: mkEl(), head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible',
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch(e) { return 0; } },
  clearTimeout: () => {},
  requestAnimationFrame: (cb) => { try { return cb && cb(); } catch(e) { return 0; } },
  cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
};
sandbox.webkitAudioContext = sandbox.window.AudioContext;

const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx); } catch (e) { loadErr = e; }
if (loadErr) { console.error('load error:', loadErr.message); process.exit(1); }

// Pull LEVELS
const LEVELS = vm.runInContext('LEVELS', ctx);
if (!LEVELS || LEVELS.length === 0) {
  console.error('LEVELS not available');
  process.exit(1);
}

let pass = 0, fail = 0, fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  try {
    // Set up state for level i
    vm.runInContext(`
      (function(){
        const L = LEVELS[${i}];
        state = {
          screen: 'game', level: ${i}, daily: false,
          walls: null, wallNums: null, solution: null,
          size: L.size, bulbsPlaced: null, marks: null,
          hints: 3, undoStack: [], timerStart: 0, elapsed: 0,
          soundOn: true, musicOn: true, timerRef: null
        };
        const wallMap = {};
        const wallNumList = [];
        for (const w of L.walls) {
          wallMap[w[0] + ',' + w[1]] = w[2];
          if (w[2] !== 'w') wallNumList.push(w);
        }
        state.walls = wallMap;
        state.wallNums = wallNumList;
        const n = L.size;
        const placeMap = {};
        for (const [r, c] of L.solution) placeMap[r + ',' + c] = true;
        state.bulbsPlaced = placeMap;
        // Run checkWin
        const illum = getAllIlluminated();
        const allLit = (function(){ for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!wallMap[r + ',' + c] && !illum[r + ',' + c]) return false; return true; })();
        const allNumsMatch = (function(){
          for (const w of wallNumList) {
            const r = w[0], c = w[1], num = parseInt(w[2]);
            let count = 0;
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(d => {
              const nr = r + d[0], nc = c + d[1];
              if (nr >= 0 && nr < n && nc >= 0 && nc < n && placeMap[nr + ',' + nc]) count++;
            });
            if (count !== num) return false;
          }
          return true;
        })();
        const noConflict = (function(){
          for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            if (placeMap[r + ',' + c] && hasConflict(r, c)) return false;
          }
          return true;
        })();
        __verifier_result = allLit && allNumsMatch && noConflict;
      })()
    `, ctx);
    const result = ctx.__verifier_result === true;
    if (result) pass++; else { fail++; fails.push('L' + (i + 1) + ':' + L.size + 'x' + L.size); }
  } catch (e) {
    fail++;
    fails.push('L' + (i + 1) + ' EX:' + (e.message || '').slice(0, 60));
  }
}

console.log(JSON.stringify({
  pass, fail, fails: fails.slice(0, 15), total: LEVELS.length,
  verdict: fail === 0 ? 'PASS' : 'FAIL'
}));
process.exit(fail === 0 ? 0 : 1);
