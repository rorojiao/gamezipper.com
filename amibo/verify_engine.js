// In-engine Node.js verifier for Amibo levels
// Loads the actual index.html game engine and validates LEVELS via vm.runInContext
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the <script> block containing the game logic
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Could not find main script block');
  process.exit(1);
}
let gameCode = scriptMatch[1];

// Convert const/var declarations to global so we can access them
gameCode = gameCode.replace(/^const LEVELS/m, 'var LEVELS');
gameCode = gameCode.replace(/^const STORAGE_KEY/m, 'var STORAGE_KEY');
gameCode = gameCode.replace(/^const SETTINGS_KEY/m, 'var SETTINGS_KEY');
gameCode = gameCode.replace(/^let state/m, 'var state');
gameCode = gameCode.replace(/^let progress/m, 'var progress');
gameCode = gameCode.replace(/^let settings/m, 'var settings');

// Set up a sandbox with minimal DOM stubs
const sandbox = {
  window: {},
  document: {
    getElementById: function() {
      return {
        textContent: '',
        clientWidth: 400,
        clientHeight: 400,
        getContext: function() {
          return {
            clearRect: function(){},
            fillRect: function(){},
            strokeRect: function(){},
            beginPath: function(){},
            moveTo: function(){},
            lineTo: function(){},
            arc: function(){},
            fill: function(){},
            stroke: function(){},
            fillText: function(){},
            save: function(){},
            restore: function(){},
            text: function(){}
          };
        },
        getBoundingClientRect: function() { return { left: 0, top: 0, width: 400, height: 400 }; },
        addEventListener: function(){},
        querySelectorAll: function() { return []; },
        style: {},
        appendChild: function(){},
        dataset: {},
        onclick: null,
      };
    },
    addEventListener: function(){},
    createElement: function() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        textContent: '',
        classList: { toggle: function(){}, add: function(){}, remove: function(){}, contains: function(){return false;} },
        animate: function(){},
        remove: function(){},
        querySelectorAll: function() { return []; },
        onclick: null,
        appendChild: function(){}
      };
    },
    querySelectorAll: function() { return []; },
  },
  AudioContext: function() { return { createGain: function(){ return { gain:{value:0,setValueAtTime:function(){},linearRampToValueAtTime:function(){},exponentialRampToValueAtTime:function(){}}, connect:function(){} }; }, createOscillator: function(){ return { frequency:{value:0}, type:'', connect:function(){}, start:function(){}, stop:function(){} }; }, currentTime: 0, destination: {} }; },
  webkitAudioContext: function() { return { createGain: function(){ return { gain:{value:0,setValueAtTime:function(){},linearRampToValueAtTime:function(){},exponentialRampToValueAtTime:function(){}}, connect:function(){} }; }, createOscillator: function(){ return { frequency:{value:0}, type:'', connect:function(){}, start:function(){}, stop:function(){} }; }, currentTime: 0, destination: {} }; },
  setInterval: function() { return 0; },
  clearInterval: function() {},
  setTimeout: function() { return 0; },
  localStorage: { getItem: function(){return null;}, setItem: function(){}, },
  console: console,
  JSON: JSON,
  Math: Math,
  Set: Set,
  Map: Map,
  Date: Date,
  Object: Object,
  Array: Array,
};

sandbox.window = sandbox;
sandbox.window.AudioContext = sandbox.AudioContext;
sandbox.window.webkitAudioContext = sandbox.webkitAudioContext;
sandbox.window.addEventListener = function(){};

vm.createContext(sandbox);

try {
  vm.runInContext(gameCode, sandbox);
} catch(e) {
  console.error('Error running game code:', e.message);
  process.exit(1);
}

// Now LEVELS should be defined in the sandbox
if (typeof sandbox.LEVELS === 'undefined') {
  console.error('LEVELS not defined after running game code');
  process.exit(1);
}

const LEVELS = sandbox.LEVELS;
let pass = 0, fail = 0;

// Use the engine's own functions for verification
const segmentsCross = sandbox.segmentsCross;
const isClueSatisfied = sandbox.isClueSatisfied;

LEVELS.forEach(function(lvl, idx) {
  const errors = [];
  
  // Simulate placing all solution segments and check win condition using engine logic
  // The engine's checkWin compares player segments to solution
  // We'll replicate the core checks using engine functions
  
  // Set up state as if player placed all solution segments
  const sol = lvl.solution;
  
  // 1. Check each clue is satisfied (engine function)
  // Need to set state.segments = sol for isClueSatisfied to work
  // But isClueSatisfied reads from global state — we need to manipulate it
  sandbox.state.segments = sol.slice();
  
  lvl.clues.forEach(function(cl) {
    if (!sandbox.isClueSatisfied(cl)) {
      errors.push('Clue (' + cl.r + ',' + cl.c + ')=' + cl.n + ' not satisfied by solution');
    }
  });
  
  // 2. Every segment crosses at least one same-length (engine segmentsCross)
  sol.forEach(function(seg, i) {
    let hasCross = false;
    for (let j = 0; j < sol.length; j++) {
      if (i === j) continue;
      if (segmentsCross(seg, sol[j]) && sol[j].len === seg.len) {
        hasCross = true;
        break;
      }
    }
    if (!hasCross) errors.push('Seg ' + i + ' (' + seg.orient + ' len=' + seg.len + ') no same-length crossing');
  });
  
  // 3. Connectivity
  const adj = {};
  sol.forEach(function(_, i) { adj[i] = []; });
  for (let i = 0; i < sol.length; i++) {
    for (let j = i + 1; j < sol.length; j++) {
      if (segmentsCross(sol[i], sol[j])) { adj[i].push(j); adj[j].push(i); }
    }
  }
  if (sol.length > 0) {
    const visited = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const u = queue.shift();
      adj[u].forEach(function(v) { if (!visited.has(v)) { visited.add(v); queue.push(v); } });
    }
    if (visited.size !== sol.length) errors.push('Disconnected: ' + visited.size + '/' + sol.length);
  }
  
  // 4. No cycle
  const edges = [];
  for (let i = 0; i < sol.length; i++) {
    for (const j of adj[i]) { if (i < j) edges.push([i, j]); }
  }
  const parent = sol.map(function(_, i) { return i; });
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra === rb) { errors.push('Cycle between ' + a + ' and ' + b); break; }
    parent[ra] = rb;
  }
  
  if (errors.length === 0) {
    pass++;
    console.log('\u2705 L' + lvl.id + ' (' + lvl.tier + ') ' + lvl.R + 'x' + lvl.C + ' ' + sol.length + ' segs — in-engine VALID');
  } else {
    fail++;
    console.log('\u274c L' + lvl.id + ' (' + lvl.tier + ') — ' + errors.length + ' errors:');
    errors.forEach(function(e) { console.log('   ' + e); });
  }
});

console.log('\n=== In-Engine Node.js Verifier Results ===');
console.log('PASS: ' + pass + '/' + LEVELS.length);
console.log('FAIL: ' + fail + '/' + LEVELS.length);
process.exit(fail > 0 ? 1 : 0);
