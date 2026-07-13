#!/usr/bin/env node
/**
 * Stitches — In-engine verifier.
 * Loads the actual index.html, extracts the game logic via vm.runInContext,
 * then verifies isSolved() returns true when the recorded solution is applied,
 * and false for perturbations.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html','utf8');
const data = JSON.parse(fs.readFileSync('levels.json','utf8'));
const LEVELS = data.levels;

// Extract the <script> block (the main game script, before the external src scripts)
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if(!scriptMatch){ console.error('Could not find inline script'); process.exit(1); }
let gameCode = scriptMatch[1];

// We need a minimal DOM shim for the code to parse. Strip document/canvas usage
// by replacing with no-ops where needed. But the code references document at top-level
// (addEventListener, getElementById). We'll provide a sandbox with stubs.
const sandbox = {
  window: {},
  document: {
    addEventListener: ()=>{},
    getElementById: ()=>({ classList:{toggle:()=>{},add:()=>{},remove:()=>{}}, addEventListener:()=>{}, textContent:'', querySelectorAll:()=>[], appendChild:()=>{}, animate:()=>{} }),
    querySelectorAll: ()=>[],
    createElement: ()=>({ className:'', style:{}, classList:{toggle:()=>{},add:()=>{},remove:()=>{}}, appendChild:()=>{}, animate:()=>{}, setAttribute:()=>{} }),
    body: { appendChild:()=>{} },
  },
  canvas: { getContext: ()=>({ clearRect:()=>{}, fillRect:()=>{}, strokeRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, stroke:()=>{}, fill:()=>{}, arc:()=>{}, fillText:()=>{}, strokeText:()=>{} }), getBoundingClientRect:()=>({left:0,top:0,width:400,height:400}), width:400, height:400, addEventListener:()=>{} },
  ctx: { clearRect:()=>{}, fillRect:()=>{}, strokeRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, stroke:()=>{}, fill:()=>{}, arc:()=>{}, fillText:()=>{}, strokeText:()=>{}, strokeStyle:'',fillStyle:'',lineWidth:0,lineCap:'',font:'',textAlign:'',textBaseline:'' },
  localStorage: { getItem:()=>null, setItem:()=>{} },
  AudioContext: function(){ this.createOscillator=()=>({type:'',frequency:{value:0},connect:()=>{},start:()=>{},stop:()=>{}}); this.createGain=()=>({gain:{setValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{},linearRampToValueAtTime:()=>{}},connect:()=>{}}); this.currentTime=0; this.destination={}; },
  webkitAudioContext: function(){},
  requestAnimationFrame: ()=>0,
  cancelAnimationFrame: ()=>{},
  setInterval: ()=>0, clearInterval: ()=>{}, setTimeout: ()=>0, clearTimeout: ()=>{},
  console: console,
  Date: { now: ()=>0 },
  Math: Math,
  parseInt,
  JSON,
  Object,
  Array,
  String,
  Number,
};
sandbox.window = sandbox;
sandbox.self = sandbox;

const ctx = vm.createContext(sandbox);

// The game code calls loadLevel at the end which references DOM. We'll wrap in try.
// We need to expose isSolved, placeStitch, computeAdjSet etc. They are defined as top-level
// functions/vars in the script, so after running they live in the sandbox.
try {
  vm.runInContext(gameCode, ctx, {filename:'game.js'});
} catch(e) {
  // Expected: DOM access errors at init. That's fine if functions are already defined.
}

// Now the functions isSolved, computeAdjSet, normEdge etc should be in sandbox
if(typeof ctx.isSolved !== 'function'){
  console.error('isSolved not exposed. Available keys with isSolved:', Object.keys(ctx).filter(k=>k.toLowerCase().includes('solve')));
  // The script may have errored before defining. Let's check by listing function keys
  console.error('Function keys:', Object.keys(ctx).filter(k=>typeof ctx[k]==='function').slice(0,40));
  process.exit(1);
}

let pass=0, fail=0;
for(let i=0;i<LEVELS.length;i++){
  const lvl = LEVELS[i];
  // set up state as the game would after loadLevel
  ctx.state.level = lvl;
  ctx.state.stitches = [];
  // apply recorded solution
  for(const s of lvl.solution){
    ctx.state.stitches.push([s[0],s[1],s[2],s[3]]);
  }
  const ok = ctx.isSolved();
  // Also verify a wrong state (one stitch removed) is NOT solved
  ctx.state.stitches = lvl.solution.slice(0, lvl.solution.length-1);
  const notSolvedShort = !ctx.isSolved();
  // Restore
  ctx.state.stitches = lvl.solution.map(s=>[s[0],s[1],s[2],s[3]]);
  const reOk = ctx.isSolved();

  const good = ok && notSolvedShort && reOk;
  if(good) pass++; else fail++;
  console.log(`L${String(lvl.levelNum).padStart(2,'0')} ${lvl.tier.padEnd(9)} solution-isSolved=${ok} short-isNotSolved=${notSolvedShort} restore-isSolved=${reOk} ${good?'✓':'✗'}`);
}
console.log(`\n=== IN-ENGINE RESULT: ${pass}/${LEVELS.length} PASS, ${fail} FAIL ===`);
process.exit(fail>0?1:0);
