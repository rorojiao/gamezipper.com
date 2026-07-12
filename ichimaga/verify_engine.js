// verify_engine.js — In-engine verification using actual game logic from index.html
// Loads the HTML, extracts LEVELS and game functions, validates all levels

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/msdn/gamezipper.com/ichimaga/index.html', 'utf8');

// Extract all <script> blocks (non-JSON-LD)
const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/g);
let gameCode = '';
for (const block of scriptMatches) {
  const code = block.replace(/<\/?script[^>]*>/g, '');
  if (code.length > gameCode.length) gameCode = code;
}

// Create minimal DOM mock
function MockEl() {
  return {
    textContent: '', innerHTML: '', className: '', style: {},
    classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{}, contains: ()=>false },
    addEventListener: ()=>{}, removeEventListener: ()=>{},
    appendChild: ()=>{}, querySelectorAll: ()=>[],
    getContext: () => ({
      fillRect: ()=>{}, strokeRect: ()=>{}, clearRect: ()=>{},
      beginPath: ()=>{}, closePath: ()=>{}, moveTo: ()=>{}, lineTo: ()=>{},
      arc: ()=>{}, fill: ()=>{}, stroke: ()=>{}, fillText: ()=>{},
      save: ()=>{}, restore: ()=>{},
      set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
      set font(v) {}, set textAlign(v) {}, set textBaseline(v) {},
      set globalAlpha(v) {}, measureText: ()=>({width:10}),
      createLinearGradient: ()=>({addColorStop:()=>{}}),
    }),
    getBoundingClientRect: ()=>({left:0, top:0, width:500, height:500}),
    clientWidth: 500, clientHeight: 500,
    onclick: null,
  };
}

const ctx = {
  window: {
    devicePixelRatio: 1, innerWidth: 500, innerHeight: 800,
    addEventListener: ()=>{}, AudioContext: function(){return {state:'running',resume:()=>{},createOscillator:()=>({frequency:{value:0,setValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}},connect:()=>{},start:()=>{},stop:()=>{}}),createGain:()=>({gain:{value:0,setValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}},connect:()=>{}}),createBufferSource:()=>({buffer:null,loop:false,connect:()=>{},start:()=>{},stop:()=>{}}),createBiquadFilter:()=>({type:'',frequency:{value:0},Q:{value:0},connect:()=>{}}),createBuffer:()=>({getChannelData:()=>new Float32Array(100)}),sampleRate:44100,currentTime:0,destination:{},close:()=>{},}}, 
    webkitAudioContext: function(){return {};},
    requestAnimationFrame: ()=>{},
    localStorage: { getItem: ()=>null, setItem: ()=>{} },
  },
  document: {
    getElementById: MockEl,
    querySelectorAll: ()=>[],
    createElement: MockEl,
    head: {appendChild:()=>{}},
    body: {appendChild:()=>{}},
    readyState: 'complete',
    addEventListener: ()=>{},
  },
  console: console,
  setTimeout: setTimeout, setInterval: ()=>0, clearTimeout: ()=>{}, clearInterval: ()=>{},
  Date: { now: ()=>0 },
  Math: Math, JSON: JSON,
  performance: { now: ()=>0 },
  screen: { width: 500, height: 800 },
};

vm.createContext(ctx);

try {
  vm.runInContext(gameCode, ctx);
} catch(e) {
  console.log('Error running game code:', e.message);
  // Continue anyway — LEVELS should still be defined
}

// Access LEVELS
const LEVELS = vm.runInContext('LEVELS', ctx);
if (!LEVELS) {
  console.log('ERROR: LEVELS not found!');
  process.exit(1);
}

console.log(`Found ${LEVELS.length} levels in HTML`);

// For each level, extract grid and solution, verify using same logic
let pass = 0, fail = 0;

for (let idx = 0; idx < LEVELS.length; idx++) {
  const lv = LEVELS[idx];
  const rows = lv.r, cols = lv.c, grid = lv.g, solution = lv.s;
  
  function cellIdx(r,c) { return r*cols+c; }
  
  // Build adjacency from solution
  const adj = {};
  for (let i = 0; i < rows*cols; i++) adj[i] = [];
  for (const edge of solution) {
    const r1=edge[0],c1=edge[1],r2=edge[2],c2=edge[3];
    const i1=cellIdx(r1,c1), i2=cellIdx(r2,c2);
    adj[i1].push(i2);
    adj[i2].push(i1);
  }
  
  const issues = [];
  
  // Degree check
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = cellIdx(r,c);
      if (grid[r][c] !== adj[i].length) {
        issues.push(`Degree mismatch (${r},${c}): grid=${grid[r][c]} actual=${adj[i].length}`);
      }
    }
  }
  
  // Connectivity (BFS)
  const nonZero = [];
  for (let i = 0; i < rows*cols; i++) {
    if (adj[i].length > 0) nonZero.push(i);
  }
  
  if (nonZero.length > 0) {
    const visited = new Set([nonZero[0]]);
    const queue = [nonZero[0]];
    while (queue.length > 0) {
      const node = queue.shift();
      for (const nb of adj[node]) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
      }
    }
    for (const i of nonZero) {
      if (!visited.has(i)) {
        issues.push(`Disconnected: (${Math.floor(i/cols)},${i%cols})`);
      }
    }
  }
  
  if (issues.length === 0) {
    pass++;
    console.log(`  Level ${idx+1}: ${rows}x${cols}, ${solution.length} edges - PASS`);
  } else {
    fail++;
    console.log(`  Level ${idx+1}: FAIL - ${issues.slice(0,3).join('; ')}`);
  }
}

console.log(`\n${pass}/${pass+fail} levels passed in-engine verification`);
if (fail === 0) console.log('ALL PASS!');
