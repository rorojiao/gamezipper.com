#!/usr/bin/env node
/**
 * Shingoki In-Engine Verification — Phase 6
 * Loads the actual index.html game engine via vm.runInContext
 * and verifies checkSolution() returns true for all 30 levels
 * when the solution edges are pre-drawn.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/msdn/gamezipper.com/shingoki/index.html', 'utf8');

// Extract main script block
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
let gameCode = '';
let maxLen = 0;
scriptMatch.forEach(function(block) {
  const code = block.replace(/<\/?script>/g, '');
  if (code.length > maxLen) { maxLen = code.length; gameCode = code; }
});

// Minimal DOM mock
function El() {
  return {
    textContent: '', style: {}, classList: { add: function(){}, remove: function(){}, toggle: function(){} },
    addEventListener: function(){}, appendChild: function(){}, querySelectorAll: function(){ return []; },
    getBoundingClientRect: function(){ return { left: 0, top: 0, width: 500, height: 500 }; },
    innerHTML: '', className: '', id: '',
    clientWidth: 480, clientHeight: 800, offsetWidth: 480, offsetHeight: 800,
    getContext: function() { return mockCtx; }
  };
}

const mockCtx = {
  clearRect: function(){}, fillRect: function(){}, beginPath: function(){},
  arc: function(){}, fill: function(){}, stroke: function(){},
  moveTo: function(){}, lineTo: function(){}, strokeRect: function(){},
  fillText: function(){}, save: function(){}, restore: function(){},
  translate: function(){}, rotate: function(){}, scale: function(){},
  set fillStyle(v){}, get fillStyle(){ return ''; },
  set strokeStyle(v){}, get strokeStyle(){ return ''; },
  set lineWidth(v){}, get lineWidth(){ return 1; },
  set font(v){}, get font(){ return ''; },
  set textAlign(v){}, get textAlign(){ return ''; },
  set textBaseline(v){}, get textBaseline(){ return ''; },
  set lineCap(v){}, get lineCap(){ return ''; },
};

const elements = {};
function getElementById(id) {
  if (!elements[id]) elements[id] = El();
  return elements[id];
}

const ctx = {
  window: {
    devicePixelRatio: 1,
    addEventListener: function(){},
    innerWidth: 480, innerHeight: 800,
    AudioContext: function(){ return { currentTime: 0, createGain: function(){ return { gain: { value: 0, setValueAtTime: function(){}, linearRampToValueAtTime: function(){}, exponentialRampToValueAtTime: function(){} }, connect: function(){} }; }, createOscillator: function(){ return { frequency: { value: 0, exponentialRampToValueAtTime: function(){} }, connect: function(){}, start: function(){}, stop: function(){}, type: '' }; }, destination: {}, close: function(){ return Promise.resolve(); } }; },
    webkitAudioContext: function(){ return this.AudioContext(); }
  },
  document: {
    getElementById: getElementById,
    querySelectorAll: function(){ return []; },
    createElement: function(tag) { return El(); },
    head: { appendChild: function(){} },
    body: { appendChild: function(){}, addEventListener: function(){} },
    readyState: 'complete',
    addEventListener: function(){}
  },
  console: console,
  setTimeout: setTimeout,
  setInterval: function() { return 0; },
  clearInterval: function() {},
  clearTimeout: function() {},
  Date: { now: function() { return 0; } },
  Math: Math,
  JSON: JSON,
  localStorage: { getItem: function() { return null; }, setItem: function(){} },
  requestAnimationFrame: function() { return 0; },
  cancelAnimationFrame: function() {},
  screen: { width: 480, height: 800 }
};

vm.createContext(ctx);

try {
  vm.runInContext(gameCode, ctx);
} catch(e) {
  console.log('Engine load error: ' + e.message);
  process.exit(1);
}

// Now test: for each level, pre-draw solution edges and call checkSolution(true)
let passCount = 0;
const totalLevels = vm.runInContext('LEVELS.length', ctx);
console.log('Testing ' + totalLevels + ' levels via in-engine checkSolution()');
console.log('======================================================');

for (let i = 0; i < totalLevels; i++) {
  vm.runInContext('curLevel = ' + i, ctx);
  vm.runInContext('edges = new Set()', ctx);
  
  // Pre-draw solution edges
  const result = vm.runInContext(
    'var L = LEVELS[' + i + ']; ' +
    'var solEdges = L.solution.map(function(e){ ' +
    '  var a = e[0]*1000+e[1], b = e[2]*1000+e[3]; ' +
    '  return a < b ? a+"-"+b : b+"-"+a; ' +
    '}); ' +
    'solEdges.forEach(function(k){ edges.add(k); }); ' +
    'checkSolution(true)',
    ctx
  );
  
  const levelNum = i + 1;
  const tier = vm.runInContext('LEVELS[' + i + '].tier', ctx);
  const R = vm.runInContext('LEVELS[' + i + '].R', ctx);
  const C = vm.runInContext('LEVELS[' + i + '].C', ctx);
  
  if (result) {
    console.log('L' + levelNum + ' (' + tier + ' ' + R + 'x' + C + '): PASS');
    passCount++;
  } else {
    console.log('L' + levelNum + ' (' + tier + ' ' + R + 'x' + C + '): FAIL');
  }
}

console.log('\n' + passCount + '/' + totalLevels + ' levels PASSED via in-engine checkSolution()');
console.log(passCount === totalLevels ? '\nALL LEVELS VERIFIED (in-engine)' : '\nSOME LEVELS FAILED');
