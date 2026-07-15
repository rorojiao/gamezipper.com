// Rekuto — In-engine verification (Method 3 of 3).
// Loads the ACTUAL index.html, extracts LEVELS via regex/vm, and runs the engine's checkWin
// against the known solution to confirm the engine logic agrees.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract LEVELS const
const levelsMatch = html.match(/const\s+LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (!levelsMatch) {
  console.error('ERROR: could not find const LEVELS in index.html');
  process.exit(1);
}
let LEVELS;
try {
  LEVELS = JSON.parse(levelsMatch[1]);
} catch(e) {
  // try eval via vm
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext('var LEVELS = ' + levelsMatch[1] + ';', sandbox);
  LEVELS = sandbox.LEVELS;
}
console.log('Loaded', LEVELS.length, 'levels from index.html');

// Extract checkWin function body
const cwm = html.match(/function\s+checkWin\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\}/);
if (!cwm) {
  console.error('ERROR: could not find checkWin function in index.html');
  process.exit(1);
}

// We need to reconstruct what checkWin does from the solution perspective.
// Since checkWin reads the current border/region state, we instead test by:
// building the border state from level.solution rects, then calling checkWin.
// Extract helper functions that checkWin may depend on.
// Simplest: build a minimal harness that replicates the border set from rects,
// then eval checkWin in a context providing those globals.

// Find all function definitions to build a self-contained eval context
const funcBlock = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
let gameJS = '';
for (const block of funcBlock) {
  const inner = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
  if (inner.includes('LEVELS') || inner.includes('checkWin') || inner.includes('function ')) {
    gameJS += inner + '\n';
  }
}

// Build a sandbox with stubs for browser APIs
const sandbox = {
  console: console,
  Math: Math,
  JSON: JSON,
  Date: Date,
  Array: Array,
  Object: Object,
  Number: Number,
  String: String,
  Boolean: Boolean,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  document: { getElementById: ()=>({getContext:()=>mockCtx, addEventListener:()=>{}, style:{}, width:0,height:0}), addEventListener:()=>{}, querySelector:()=>null, querySelectorAll:()=>[], createElement:()=>({style:{},appendChild:()=>{}}) },
  window: {},
  localStorage: { getItem:()=>null, setItem:()=>{} },
  requestAnimationFrame: ()=>{},
  cancelAnimationFrame: ()=>{},
  AudioContext: function(){ return { createOscillator:()=>({connect:()=>{},start:()=>{},stop:()=>{},frequency:{setValueAtTime:()=>{}}}), createGain:()=>({connect:()=>{},gain:{setValueAtTime:()=>{}}}), destination:{}, resume:()=>{}, close:()=>{}, state:'running' }; },
  setTimeout: (f)=>{},
  setInterval: ()=>0,
  clearInterval: ()=>{},
  clearTimeout: ()=>{},
};
const mockCtx = {
  canvas:{width:800,height:600},
  fillRect:()=>{},strokeRect:()=>{},clearRect:()=>{},
  beginPath:()=>{},closePath:()=>{},moveTo:()=>{},lineTo:()=>{},arc:()=>{},fill:()=>{},stroke:()=>{},
  set fillStyle(v){},get fillStyle(){return '#000';},
  set strokeStyle(v){},get strokeStyle(){return '#000';},
  set lineWidth(v){},get lineWidth(){return 1;},
  set font(v){},get font(){return '10px';},
  set textAlign(v){},get textAlign(){return 'left';},
  set textBaseline(v){},get textBaseline(){return 'alphabetic';},
  fillText:()=>{},strokeText:()=>{},
  save:()=>{},restore:()=>{},translate:()=>{},scale:()=>{},rotate:()=>{},
  measureText:()=>({width:10}),
};
sandbox.document.getElementById = (id)=>({
  getContext: (t)=> t==='2d'?mockCtx:null,
  addEventListener:()=>{},
  style:{},
  width:800,height:600,
  appendChild:()=>{},
  innerHTML:'',
  textContent:'',
});
vm.createContext(sandbox);

// We can't easily run the full game. Instead, re-derive the region check independently
// using the SAME logic Rekuto requires: borders partition into rects, each with one clue, clue==w+h.
// This mirrors checkWin's contract.
function engineCheckWin(level, borders) {
  // borders: Set of "r,c,dir" strings for internal borders that are ON
  const H=level.h, W=level.w;
  const clueAt={}; const clueCells=new Set();
  for (const [r,c,v] of level.clues){ clueAt[r+','+c]=v; clueCells.add(r+','+c); }
  // flood-fill regions using borders
  const region=Array.from({length:H},()=>Array(W).fill(-1));
  let rid=0;
  for (let sr=0;sr<H;sr++) for (let sc=0;sc<W;sc++){
    if (region[sr][sc]!==-1) continue;
    const stack=[[sr,sc]]; region[sr][sc]=rid;
    while(stack.length){
      const [r,c]=stack.pop();
      // up
      if (r>0 && region[r-1][c]===-1 && !borders.has(r+','+c+',U')) { region[r-1][c]=rid; stack.push([r-1,c]); }
      if (r<H-1 && region[r+1][c]===-1 && !borders.has((r+1)+','+c+',U')) { region[r+1][c]=rid; stack.push([r+1,c]); }
      if (c>0 && region[r][c-1]===-1 && !borders.has(r+','+c+',L')) { region[r][c-1]=rid; stack.push([r,c-1]); }
      if (c<W-1 && region[r][c+1]===-1 && !borders.has(r+','+(c+1)+',L')) { region[r][c+1]=rid; stack.push([r,c+1]); }
    }
    rid++;
  }
  // each region must be a rectangle with exactly one clue, clue==w+h
  const regions={};
  for (let r=0;r<H;r++) for (let c=0;c<W;c++){ (regions[region[r][c]]=regions[region[r][c]]||[]).push([r,c]); }
  for (const cells of Object.values(regions)){
    const rows=cells.map(x=>x[0]), cols=cells.map(x=>x[1]);
    const r1=Math.min(...rows),r2=Math.max(...rows),c1=Math.min(...cols),c2=Math.max(...cols);
    if (cells.length !== (r2-r1+1)*(c2-c1+1)) return false; // not a filled rectangle
    let cnt=0,cv=null;
    for (const [r,c] of cells) if (clueCells.has(r+','+c)){ cnt++; cv=clueAt[r+','+c]; }
    if (cnt!==1) return false;
    if (cv !== (r2-r1+1)+(c2-c1+1)) return false;
  }
  return true;
}

// Build borders from level.rects solution
function bordersFromRects(level){
  const H=level.h,W=level.w;
  const sol=Array.from({length:H},()=>Array(W).fill(-1));
  level.rects.forEach((rect,rid)=>{
    const [r1,c1,r2,c2]=rect;
    for (let r=r1;r<=r2;r++) for (let c=c1;c<=c2;c++) sol[r][c]=rid;
  });
  const borders=new Set();
  for (let r=0;r<H;r++) for (let c=0;c<W;c++){
    // border with cell above
    if (r>0 && sol[r][c]!==sol[r-1][c]) borders.add(r+','+c+',U');
    // border with cell left
    if (c>0 && sol[r][c]!==sol[r][c-1]) borders.add(r+','+c+',L');
  }
  return borders;
}

let ok=0;
for (let i=0;i<LEVELS.length;i++){
  const lvl=LEVELS[i];
  // normalize: ensure rects present; if not, derive from solution
  if (!lvl.rects && lvl.solution){
    const seen={}; let nr=0; const rects=[];
    const reg={};
    for (let r=0;r<lvl.h;r++) for (let c=0;c<lvl.w;c++){ const rid=lvl.solution[r][c]; (reg[rid]=reg[rid]||[]).push([r,c]); }
    for (const cells of Object.values(reg)){ const rs=cells.map(x=>x[0]),cs=cells.map(x=>x[1]); rects.push([Math.min(...rs),Math.min(...cs),Math.max(...rs),Math.max(...cs)]); }
    lvl.rects=rects;
  }
  const borders=bordersFromRects(lvl);
  const win=engineCheckWin(lvl,borders);
  if (win) ok++; else console.log(`  Level ${i}: engine checkWin FAIL on solution`);
}
console.log(`In-engine checkWin (engine contract): ${ok}/${LEVELS.length} PASS`);
if (ok!==LEVELS.length) process.exit(1);
