#!/usr/bin/env node
// Shirokuro in-engine verification
// Loads actual index.html LEVELS via vm.runInContext, applies solution edges, and checks checkSolution.

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the LEVELS const
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('shirokuro');
// Find the position of the next </script> after LEVELS
const levelsEnd = html.indexOf(LEVELS[0]) + LEVELS[0].length;
const scriptEnd = html.indexOf('</script>', levelsEnd);
let gameScript = html.substring(levelsEnd + 1, scriptEnd);

// Replace all 'const ' with 'var ' to allow var hoisting
gameScript = gameScript.replace(/\bconst\s+/g, 'var ');
// Replace 'let edges=' with 'var edges=' so we can override via context.edges
gameScript = gameScript.replace(/let edges=/g, 'var edges=');
// Also handle the multi-decl line that has 'edges=new Map()'
gameScript = gameScript.replace(
  /let curLevel=0, mode='draw', edges=new Map\(\), hintsLeft=3, hintEdges=\[\], startTime=0, timerInterval=null;/,
  'var curLevel=0, mode="draw", hintsLeft=3, hintEdges=[], startTime=0, timerInterval=null; var edges=new Map();'
);

// Stub out DOM elements so the script can run in Node
const stubEl = {
  getContext: () => new Proxy({}, { get: () => stubFn }),
  addEventListener: () => {},
  width: 500, height: 500,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
};
const stubFn = () => {};
const elementCache = {};
const getStubEl = (id) => {
  if (elementCache[id]) return elementCache[id];
  if (id === 'board') {
    elementCache[id] = stubEl;
    return stubEl;
  }
  if (['info-level','info-tier','info-time','hint-count','win-stars','win-time','toast','lvl-list'].includes(id)) {
    const el = {
      _text: '',
      get textContent() { return this._text; },
      set textContent(v) { this._text = v; },
      innerHTML: '',
      classList: { add: stubFn, remove: stubFn, toggle: stubFn }
    };
    elementCache[id] = el;
    return el;
  }
  if (['tog-music','tog-sfx','tog-auto'].includes(id)) {
    const el = { classList: { add: stubFn, remove: stubFn, toggle: stubFn } };
    elementCache[id] = el;
    return el;
  }
  if (id === 'btn-draw' || id === 'btn-erase') {
    const el = { classList: { add: stubFn, remove: stubFn, toggle: stubFn } };
    elementCache[id] = el;
    return el;
  }
  if (id === 'btn-check') {
    const el = { onclick: null };
    elementCache[id] = el;
    return el;
  }
  const el = { onclick: null, addEventListener: stubFn, classList: { add: stubFn, remove: stubFn, toggle: stubFn } };
  elementCache[id] = el;
  return el;
};
const documentStub = {
  getElementById: getStubEl,
  addEventListener: stubFn,
  hidden: false,
  body: { appendChild: stubFn, removeChild: stubFn },
  createElement: () => ({ classList: { add: stubFn, remove: stubFn }, style: {}, addEventListener: stubFn, remove: stubFn }),
};
const windowStub = {
  innerWidth: 1280, innerHeight: 800,
  addEventListener: stubFn,
  AudioContext: function() { return { createGain: () => ({gain:{setValueAtTime:stubFn,linearRampToValueAtTime:stubFn,value:0},connect:stubFn}), createOscillator: () => ({type:'',frequency:{value:0},connect:stubFn,start:stubFn,stop:stubFn,onended:null}), currentTime: 0, destination: {}, close: stubFn }; },
  webkitAudioContext: null,
};
const localStorageStub = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = v; },
};

// Build the context - explicitly pass LEVELS
const context = {
  document: documentStub,
  window: windowStub,
  localStorage: localStorageStub,
  setTimeout: (fn, t) => fn(),
  clearInterval: stubFn,
  setInterval: (fn, t) => fn(),
  Math, JSON, Array, Object, Map, Set, Number, String, Date, parseInt, parseFloat,
  console,
  LEVELS,
};
vm.createContext(context);

// Run the script
try {
  vm.runInContext(gameScript, context);
} catch (e) {
  console.error('Script error:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

// Now test each level: load solution edges, call checkSolution
let allPass = true;
const results = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  // Build edges Map for the solution
  const edges = new Map();
  for (const e of lv.solution) {
    const r1 = e[0], c1 = e[1], r2 = e[2], c2 = e[3];
    const k1 = r1 * 1000 + c1;
    const k2 = r2 * 1000 + c2;
    const key = k1 < k2 ? `${k1}-${k2}` : `${k2}-${k1}`;
    edges.set(key, 'user');
  }
  // Manually set state via context
  context.curLevel = i;
  context.edges = edges;
  // Call checkSolution(true)
  let pass;
  let reason = '';
  try {
    pass = context.checkSolution(true);
    if (!pass) {
      // Run again with silent=false to get the toast reason
      context.checkSolution(false);
      reason = context.document.getElementById('toast').textContent;
    }
  } catch (e) {
    reason = e.message;
    pass = false;
  }
  if (pass) {
    results.push(`L${i+1} ${lv.tier} ${lv.R}x${lv.C}: PASS (${lv.solution.length} edges)`);
  } else {
    results.push(`L${i+1} ${lv.tier} ${lv.R}x${lv.C}: FAIL (${reason})`);
    allPass = false;
  }
}

console.log(results.join('\n'));
console.log(`\n${allPass ? '✓ ALL 30 LEVELS PASS' : '✗ SOME LEVELS FAIL'}`);
process.exit(allPass ? 0 : 1);
