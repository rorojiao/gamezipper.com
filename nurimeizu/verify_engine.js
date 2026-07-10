// In-engine verifier: loads the actual index.html and runs checkSolution with the known solution
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS from the script
const levelsMatch = html.match(/const LEVELS = (\[.*?\]);/s);
if (!levelsMatch) { console.error('Could not extract LEVELS'); process.exit(1); }
const LEVELS = JSON.parse(levelsMatch[1]);

// Extract the script content between <script> (last one) and </script>
const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/g);
const gameScript = scriptMatches[scriptMatches.length-1].replace(/<\/?script>/g,'');

// We need to modify the script: remove loadLevel(0) at the end, and expose internal state
// Replace "loadLevel(0);" at the end with nothing
let modScript = gameScript.replace(/loadLevel\(0\);?\s*$/, '');

// Add helper at the end of script to test each level
modScript += `
function testLevel(i) {
  currentLevel = i;
  userPaint = {};
  isPlaying = true;
  hintCell = null;
  var lv = LEVELS[i];
  for (var rid = 0; rid < lv.rooms.length; rid++) {
    userPaint[rid] = lv.solution.includes(rid) ? 'black' : 'white';
  }
  return checkSolution(false);
}
`;

const fakeCanvas = {
  width: 500, height: 500,
  getContext: ()=>({
    fillRect:()=>{},strokeRect:()=>{},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},
    stroke:()=>{},fill:()=>{},arc:()=>{},closePath:()=>{},fillText:()=>{},
    set fillStyle(v){},get fillStyle(){return''},set strokeStyle(v){},get strokeStyle(){return''},
    set lineWidth(v){},get lineWidth(){return 1},set font(v){},get font(){return''},
    set textAlign(v){},get textAlign(){return'center'},set textBaseline(v){},get textBaseline(){return'middle'},
    setLineDash:()=>{}
  }),
  getBoundingClientRect:()=>({left:0,top:0,width:500,height:500}),
  addEventListener:()=>{}
};

const sandbox = {
  console: console,
  localStorage: { getItem: ()=>null, setItem: ()=>{} },
  document: {
    getElementById: function(id){
      if(id==='board') return fakeCanvas;
      return {
        textContent:'',innerHTML:'',className:'',style:{},
        classList:{add:()=>{},remove:()=>{},toggle:()=>{}},
        onclick:null, appendChild:()=>{}, querySelector:()=>null,
        getBoundingClientRect:()=>({left:0,top:0,width:500,height:500})
      };
    },
    createElement: ()=>({className:'',textContent:'',style:{},onclick:null,appendChild:()=>{},classList:{add:()=>{},remove:()=>{}}}),
    addEventListener: ()=>{},
    body: { appendChild:()=>{} }
  },
  window: {},
  AudioContext: function(){return {createGain:()=>({gain:{value:0},connect:()=>{}}),createOscillator:()=>({type:'',frequency:{value:0},connect:()=>{},start:()=>{},stop:()=>{}}),destination:{},currentTime:0};},
  setTimeout: setTimeout,
  setInterval: ()=>0,
  clearInterval: ()=>{},
  Set: Set, Map: Map, Math: Math, JSON: JSON, Date: Date
};

try {
  vm.createContext(sandbox);
  vm.runInContext(modScript, sandbox);
} catch(e) {
  console.error('Script eval error:', e.message);
  console.error(e.stack);
  process.exit(1);
}

// Now test each level
let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  try {
    const result = sandbox.testLevel(i);
    if (result === true) {
      pass++;
      console.log(`L${String(lv.num).padStart(2)} ${lv.tierName.padEnd(10)} ${lv.h}x${lv.w} IN-ENGINE PASS`);
    } else {
      fail++;
      console.log(`L${String(lv.num).padStart(2)} ${lv.tierName.padEnd(10)} ${lv.h}x${lv.w} IN-ENGINE FAIL`);
    }
  } catch(e) {
    fail++;
    console.log(`L${String(lv.num).padStart(2)} ERROR: ${e.message}`);
  }
}

console.log(`\n${pass}/${LEVELS.length} IN-ENGINE PASS`);
process.exit(fail > 0 ? 1 : 0);
