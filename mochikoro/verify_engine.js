// verify_engine.js — Method 3: In-engine verification via vm.runInContext
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract BOTH script blocks: (1) const LEVELS = ..., and (2) the engine code with checkWin.
const allScripts = [];
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
let m;
while ((m = scriptRe.exec(html)) !== null) {
  allScripts.push(m[1]);
}
const levelsScript = allScripts.find(s => s.includes('const LEVELS'));
const engineScript = allScripts.find(s => s.includes('function checkWin') && !s.includes('const LEVELS'));
if (!levelsScript || !engineScript) { console.error('Could not find LEVELS or engine script'); console.error('scripts found:', allScripts.length, 'levels:', !!levelsScript, 'engine:', !!engineScript); process.exit(1); }

// Combine both for execution, with LEVELS first
let engineCode = levelsScript + '\n;\n' + engineScript;

// Strip any remaining script tags after the engine block (they would fail to load in the sandbox)
// Actually the match stops at the </script> after checkWin, so we just need to ensure the engine code is self-contained
// Strip the final init() call so it doesn't run on load (no DOM)
// And any window.addEventListener for visibilitychange/beforeunload that requires DOM
let initLine = engineCode.lastIndexOf('init();');
if (initLine > 0) {
  engineCode = engineCode.substring(0, initLine);
}

// Sandbox stubs
const windowStub = {
  innerWidth: 800, innerHeight: 800,
  addEventListener: () => {},
  AudioContext: function() {
    return {
      createOscillator: () => ({connect:()=>{},frequency:{},type:'',start:()=>{},stop:()=>{}}),
      createGain: () => ({connect:()=>{},gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}}),
      destination: {}, currentTime: 0, close: () => {}
    };
  },
  webkitAudioContext: undefined,
};
const documentStub = {
  getElementById: () => ({
    getContext: () => makeCtx2dStub(),
    classList:{toggle:()=>{},add:()=>{},remove:()=>{},contains:()=>false},
    style:{}, textContent:'', innerHTML:'', addEventListener:()=>{}, getBoundingClientRect:()=>({left:0,top:0,width:500,height:500})
  }),
  addEventListener: () => {},
  createElement: () => ({
    className:'', style:{}, classList:{toggle:()=>{},add:()=>{},remove:()=>{}},
    appendChild: () => {},
    remove: () => {},
    animate: () => {},
  }),
  hidden: false,
  body: { appendChild: () => {} },
};
function makeCtx2dStub() {
  const noop = () => {};
  return new Proxy({}, {
    get(_t, prop) {
      if (prop === 'shadowColor' || prop === 'fillStyle' || prop === 'strokeStyle' ||
          prop === 'font' || prop === 'textBaseline' || prop === 'textAlign' || prop === 'lineCap') return '';
      if (prop === 'shadowBlur' || prop === 'lineWidth') return 0;
      if (prop === 'width' || prop === 'height') return 500;
      if (prop === 'gain') return {setValueAtTime:noop,linearRampToValueAtTime:noop,exponentialRampToValueAtTime:noop,value:0};
      if (prop === 'frequency') return {value:0};
      if (prop === 'style') return {};
      if (prop === 'classList') return {toggle:noop,add:noop,remove:noop,contains:()=>false};
      if (prop === 'animate') return noop;
      return noop;
    },
    set() { return true; }
  });
}
const localStorageStub = { getItem: () => null, setItem: () => {} };
const canvasStub = { width: 500, height: 500, getBoundingClientRect: () => ({left:0,top:0,width:500,height:500}), getContext: () => ({}), addEventListener: () => {} };

const sandbox = {
  window: windowStub,
  document: documentStub,
  localStorage: localStorageStub,
  console: console,
  setTimeout: () => {}, clearTimeout: () => {},
  setInterval: () => {}, clearInterval: () => {},
  Date: { now: () => 0 },
  Math: Math,
  JSON: JSON,
  Object: Object,
  Array: Array,
  Set: Set, Map: Map,
  Number: Number, String: String, Boolean: Boolean, Error: Error,
  Promise: Promise,
};
sandbox.globalThis = sandbox;
sandbox.window.document = documentStub;
sandbox.window.localStorage = localStorageStub;
sandbox.window.AudioContext = windowStub.AudioContext;

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(engineCode, ctx, { timeout: 5000 });
} catch(e) {
  console.error('Engine eval error:', e.message);
  // Continue — many DOM-dependent functions won't work in stub, but checkWin/computeRegionMap should work
}

const levelsCount = vm.runInContext('LEVELS.length', ctx);
console.log(`Loaded ${levelsCount} levels from engine`);

let pass = 0, fail = 0;
for (let i = 0; i < levelsCount; i++) {
  // Load level state
  vm.runInContext(`loadLevel(${i});`, ctx);
  // Apply the solution black cells
  const solArr = vm.runInContext(`LEVELS[${i}].solution_black`, ctx);
  vm.runInContext(`state.black = {}; state.clues = Object.assign({}, LEVELS[${i}].clues); won = false;`, ctx);
  for (const k of solArr) {
    vm.runInContext(`state.black[${JSON.stringify(k)}] = true;`, ctx);
  }
  // Run checkWin(false) — returns true/false (autocheck off so no win() side effect)
  let ok = false;
  let announce = true;
  try {
    if (announce) {
      // Capture showStatus side effect by overriding global showStatus
      vm.runInContext(`
        (function(){
          const orig = showStatus;
          window._statusMsg = '';
          showStatus = function(m) { window._statusMsg = m; };
        })();
      `, ctx);
    }
    ok = vm.runInContext('checkWin('+(announce?'true':'false')+')', ctx);
    if (!ok && announce) {
      const msg = vm.runInContext('window._statusMsg || "no message"', ctx);
      console.log(`L${i+1} ${vm.runInContext('LEVELS['+i+'].tier', ctx)} ${vm.runInContext('LEVELS['+i+'].R', ctx)}x${vm.runInContext('LEVELS['+i+'].C', ctx)}: FAIL — ${msg}`);
    }
  } catch(e) {
    console.error(`L${i+1}: checkWin error: ${e.message}`);
  }
  if (ok) {
    pass++;
  } else {
    fail++;
    const tier = vm.runInContext(`LEVELS[${i}].tier`, ctx);
    const R = vm.runInContext(`LEVELS[${i}].R`, ctx);
    const C = vm.runInContext(`LEVELS[${i}].C`, ctx);
    console.log(`L${i+1} ${tier} ${R}x${C}: FAIL — checkWin returned false`);
  }
}
console.log(`\n=== In-engine verify: ${pass}/${levelsCount} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
