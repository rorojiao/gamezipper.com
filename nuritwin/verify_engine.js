// In-engine verifier: loads actual index.html LEVELS and runs the game's verification logic
// Uses vm.runInContext to execute the game's checkSolution against each level's solution
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/msdn/gamezipper.com/nuritwin/index.html', 'utf8');

// Extract the main script block
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('nuritwin');
const gameJs = scriptMatch[1];

// Set up a sandbox that mimics the browser just enough
const sandbox = {
  window: { addEventListener: ()=>{}, AudioContext: function(){ this.createOscillator=()=>({connect:()=>{},frequency:{value:0},type:'',start:()=>{},stop:()=>{}}); this.createGain=()=>({connect:()=>{},gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}}); this.destination={}; this.state='running'; this.currentTime=0; this.resume=()=>{}; } },
  document: {
    getElementById: () => ({
      textContent: '',
      classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{} },
      style: {},
      addEventListener: ()=>{},
      getContext: () => ({ fillRect:()=>{},strokeRect:()=>{},beginPath:()=>{},arc:()=>{},fill:()=>{},stroke:()=>{},moveTo:()=>{},lineTo:()=>{},fillText:()=>{} }),
      parentElement: { clientWidth: 500 },
      width: 0, height: 0,
    }),
    addEventListener: ()=>{},
    querySelector: () => null,
    querySelectorAll: () => [],
  },
  localStorage: { getItem:()=>null, setItem:()=>{} },
  AudioContext: function(){ this.createOscillator=()=>({connect:()=>{},frequency:{value:0},type:'',start:()=>{},stop:()=>{}}); this.createGain=()=>({connect:()=>{},gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}}); this.destination={}; this.state='running'; this.currentTime=0; this.resume=()=>{}; },
  setInterval: ()=>0, clearInterval: ()=>{},
  setTimeout: (fn)=>fn(), 
  requestAnimationFrame: ()=>0, cancelAnimationFrame: ()=>{},
  performance: { now: () => 0 },
  Date: { now: () => 0 },
  console: console,
  Math: Math,
  parseInt, parseFloat, isNaN,
};
sandbox.window.AudioContext = sandbox.AudioContext;
sandbox.webkitAudioContext = sandbox.AudioContext;

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(gameJs, ctx);
} catch (e) {
  console.log('Error running game JS:', e.message);
  process.exit(1);
}

// Now PUZZLES is defined in the sandbox
const PUZZLES = ctx.PUZZLES;
if (!PUZZLES) { console.log('PUZZLES not defined'); process.exit(1); }
console.log('Loaded', PUZZLES.length, 'puzzles from engine');

let allOk = true;
for (let i = 0; i < PUZZLES.length; i++) {
  const p = PUZZLES[i];
  // Set up state as if the player filled in the correct solution
  ctx.state.level = i;
  ctx.state.rows = p.rows;
  ctx.state.cols = p.cols;
  ctx.state.regions = p.regions;
  ctx.state.sol = p.sol;
  ctx.state.clues = p.clues;
  ctx.state.grid = [];
  for (let r = 0; r < p.rows; r++) {
    ctx.state.grid[r] = [];
    for (let c = 0; c < p.cols; c++) {
      ctx.state.grid[r][c] = p.sol[r * p.cols + c];
    }
  }
  ctx.state.hintCells = {};
  // Run the engine's checkSolution (silent = true)
  const result = ctx.checkSolution(true);
  if (result) {
    console.log(`L${i+1}: PASS (${p.rows}x${p.cols}, tier ${p.tier})`);
  } else {
    console.log(`L${i+1}: FAIL — engine checkSolution returned false`);
    allOk = false;
  }
}
console.log(allOk ? '\nALL 30 LEVELS PASS ENGINE checkSolution' : '\nSOME LEVELS FAILED ENGINE CHECK');
process.exit(allOk ? 0 : 1);
