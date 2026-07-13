#!/usr/bin/env node
// In-engine verifier (Method 3): loads the actual index.html game engine via vm,
// injects the stored solution into gridArrows, and calls the game's own checkSolution().
// Confirms the engine agrees the designed solution is valid for all 30 levels.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>\n(const LEVELS[\s\S]*?)<\/script>/);
if (!m) { console.error('Could not extract inline script'); process.exit(1); }
let code = m[1];

// Stub out DOM/browser APIs the engine touches at load + during our calls.
const noop = () => {};
const elStub = new Proxy({}, {
  get: (t, p) => {
    if (p === 'classList') return { add: noop, remove: noop, toggle: noop, contains: () => false };
    if (p === 'style') return {};
    if (p === 'getContext') return () => ctxStub;
    if (p === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 400, height: 400 });
    if (p === 'addEventListener') return noop;
    if (p === 'appendChild') return noop;
    if (p === 'querySelectorAll') return () => [];
    if (p === 'textContent' || p === 'innerHTML') return '';
    return noop;
  },
  set: () => true
});
const ctxStub = new Proxy({}, { get: () => noop, set: () => true });

const documentStub = {
  getElementById: () => elStub,
  querySelectorAll: () => [],
  addEventListener: noop,
  body: { addEventListener: noop },
  createElement: () => elStub,
};
const windowStub = { addEventListener: noop };
const sandbox = {
  document: documentStub,
  window: windowStub,
  localStorage: { getItem: () => null, setItem: noop },
  setInterval: () => 0, clearInterval: noop, setTimeout: noop, clearTimeout: noop,
  AudioContext: function(){ return { createOscillator:()=>({connect:noop,frequency:{},start:noop,stop:noop,type:''}), createGain:()=>({connect:noop,gain:{setValueAtTime:noop,exponentialRampToValueAtTime:noop}}), currentTime:0, destination:{} }; },
  Math: Math, Date: Date, JSON: JSON, console: console, Array: Array, Object: Object,
};
sandbox.webkitAudioContext = sandbox.AudioContext;
windowStub.AudioContext = sandbox.AudioContext;

const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx); } catch (e) { console.error('Engine load error:', e.message); process.exit(1); }

// Now drive the engine per level.
let pass = 0, fail = 0;
const N = vm.runInContext('LEVELS.length', ctx);
for (let i = 0; i < N; i++) {
  // load level i, then set gridArrows to the stored solution, then checkSolution()
  const driver = `
    loadLevel(${i});
    // clear then place the designed solution
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) gridArrows[r][c] = null;
    for (const s of solution) gridArrows[s.r][s.c] = s.d;
    (function(){ const res = checkSolution(); return JSON.stringify(res); })();
  `;
  let out;
  try { out = vm.runInContext(driver, ctx); } catch (e) { console.log(`L${i+1}: ENGINE ERROR ${e.message}`); fail++; continue; }
  const res = JSON.parse(out);
  if (res.ok) { pass++; console.log(`L${i+1}: engine checkSolution() = OK`); }
  else { fail++; console.log(`L${i+1}: engine REJECTED designed solution: ${res.msg}`); }
}
console.log(`\nIN-ENGINE: ${pass}/${N} designed solutions accepted by the game's own checkSolution(). FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
