#!/usr/bin/env node
// In-engine verification (Method 3): load the ACTUAL index.html engine via vm,
// then run checkSolution against the stored solution for every level.
// Engine uses compact keys: {R,C,n,g,b,c,t,i} and an expand() function.
// The engine declares `let lv`, `let grid`, `let cur` — lexical bindings — so we
// inject a small runner loop INTO the context to call expand() + checkSolution().
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const engineScript = inlineScripts.find(s => s.includes('function checkSolution') && s.includes('const LEVELS'));
if (!engineScript) { console.error('Cannot find engine script with LEVELS + checkSolution'); process.exit(1); }

function stubEl(){
  const el = {
    style: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} },
    appendChild(){}, removeChild(){}, setAttribute(){}, addEventListener(){}, removeEventListener(){},
    getContext: () => null,
    onclick: null, textContent: '', innerHTML: '', value: '', checked: false,
    children: [], querySelectorAll: () => [], querySelector: () => null,
    dataset: {}, focus(){}, blur(){},
  };
  return el;
}
const noop = () => {};
const sandbox = {
  console: console,
  document: {
    createElement: stubEl,
    getElementById: () => stubEl(),
    querySelector: () => null,
    querySelectorAll: () => [],
    body: { addEventListener: noop, appendChild: noop, classList: { add: noop, remove: noop } },
    addEventListener: noop,
  },
  window: { addEventListener: noop, removeEventListener: noop },
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
  requestAnimationFrame: noop, cancelAnimationFrame: noop,
  Date, Math, JSON, Array, Object, String, Number, Boolean, Map, Set, RegExp, Error, WeakMap, WeakSet,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
  AudioContext: function(){
    this.createGain = () => ({ connect: noop, gain: { value: 0 }, disconnect: noop });
    this.createOscillator = () => ({ connect: noop, frequency: { value: 0 }, type: '', start: noop, stop: noop });
    this.createBufferSource = () => ({ connect: noop, buffer: null, start: noop, stop: noop });
    this.destination = {}; this.state = 'running'; this.close = noop; this.resume = noop;
  },
  navigator: { vibrate: noop, userAgent: 'node' },
  location: { href: '', search: '' },
  confetti: noop,
  performance: { now: () => Date.now() },
};
sandbox.window = Object.assign({}, sandbox.window, sandbox);
vm.createContext(sandbox);

// Convert `const LEVELS` to `var LEVELS` so we can reference it from injected code.
const engineScriptVar = engineScript.replace('const LEVELS', 'var LEVELS');
try {
  vm.runInContext(engineScriptVar, sandbox, { timeout: 15000 });
} catch(e) {
  console.error('Engine load error:', e.message);
  console.error(e.stack);
  process.exit(1);
}

// Inject a runner that lives in the same lexical scope as `lv`/`grid`.
// It expands each compact level, builds the matching grid (stored black -> 'B', else 'W'),
// then calls checkSolution() and records the result.
const runner = `
  __verifyResults = [];
  for (var __i = 0; __i < LEVELS.length; __i++) {
    var __compact = LEVELS[__i];
    var __lv = expand(__compact);
    lv = __lv;
    grid = [];
    for (var r = 0; r < __lv.R; r++) {
      grid[r] = [];
      for (var c = 0; c < __lv.C; c++) {
        grid[r][c] = __lv.black.has(r + ',' + c) ? 'B' : 'W';
      }
    }
    var __res = checkSolution();
    __verifyResults.push({
      idx: __i,
      R: __lv.R, C: __lv.C, n: __lv.n, tier: __lv.tier,
      ok: __res.ok, msg: __res.msg
    });
  }
`;
try {
  vm.runInContext(runner, sandbox, { timeout: 30000 });
} catch(e) {
  console.error('Runner error:', e.message);
  console.error(e.stack);
  process.exit(1);
}

const results = sandbox.__verifyResults || [];
let pass = 0, fail = 0;
for (const r of results) {
  if (r.ok) { pass++; console.log('L' + (r.idx+1) + ' ' + r.R + 'x' + r.C + ' ' + r.n + 'reg ' + r.tier + ': PASS'); }
  else { fail++; console.log('L' + (r.idx+1) + ' ' + r.R + 'x' + r.C + ' ' + r.n + 'reg ' + r.tier + ': FAIL - ' + r.msg); }
}
console.log('\nMethod 3 (in-engine checkSolution, ACTUAL index.html engine via vm): ' + pass + '/' + (pass+fail) + ' PASS, ' + fail + ' FAIL');
process.exit(fail > 0 ? 1 : 0);
