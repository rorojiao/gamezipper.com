#!/usr/bin/env node
// Kojun in-engine verifier — Shape 7 (single-level global state, isComplete + violations Set)
// Pattern: loadLevel(i) sets regionGrid/maxNum/currentLevel; then set grid = solution;
// isComplete() && violations.size === 0 is the win predicate.
// Sandbox: shared-vm-verify.js stubs (document/window/localStorage/canvas getContext/setTimeout/rAF/animate/appendChild).
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const SLUG = 'kojun';
const SLUG_DIR = path.join('/home/msdn/gamezipper.com', SLUG);
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
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
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function() { return { createOscillator: () => ({ connect: () => {}, frequency: {}, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {} }; } },
  document: {
    getElementById: () => mkEl(),
    getElementsByTagName: () => [mkEl()],
    querySelector: () => mkEl(), querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: () => mkEl(),
    body: { addEventListener: () => {}, appendChild: () => {}, removeChild: () => {} },
    head: mkEl(), documentElement: { addEventListener: () => {} }, hidden: false, visibilityState: 'visible',
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch(e) { return 0; } },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
};
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx); } catch (e) { console.error('engine load error:', e.message); process.exit(1); }

const driver = `
  (function(){
    let pass=0, fail=0, fails=[];
    for(let i=0;i<LEVELS.length;i++){
      const L=LEVELS[i];
      try {
        loadLevel(i);
        grid = L.solution.map(r=>r.slice());
        regionGrid = L.regions.map(r=>r.slice());
        violations = new Set();
        const ok = isComplete() && violations.size === 0;
        if(ok) pass++; else { fail++; fails.push('L'+(i+1)+':'+L.H+'x'+L.W); }
      } catch(e){ fail++; fails.push('L'+(i+1)+' EX:'+e.message.slice(0,60)); }
    }
    return JSON.stringify({pass,fail,fails:fails.slice(0,15),total:LEVELS.length});
  })()`;
try {
  const out = vm.runInContext(driver, ctx);
  const r = JSON.parse(out);
  console.log(`${r.pass}/${r.total} in-engine Kojun verification`);
  if (r.fail > 0) {
    console.log(`Fails: ${JSON.stringify(r.fails)}`);
    process.exit(1);
  }
  process.exit(0);
} catch (e) {
  console.error('verify error:', e.message);
  process.exit(1);
}
