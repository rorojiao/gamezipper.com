// Phase 6: Level solvability verification for domino-chain
// Extracts the REAL simulateLevel + LEVELS from the HTML (via vm mock)
// and confirms every level's solution reaches all goals.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/msdn/gamezipper.com/domino-chain/index.html', 'utf8');

// grab the largest inline <script> block (the game logic)
const blocks = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
let game = '', best = 0;
for (const b of blocks) {
  const code = b.replace(/^<script>/, '').replace(/<\/script>$/, '');
  if (code.length > best) { best = code.length; game = code; }
}
if (!game) { console.log('ERROR: no game script found'); process.exit(1); }

// strip the boot() call so no DOM init runs
game = game.replace(/\nboot\(\);\s*$/m, '\n');

// minimal DOM mock
function El(){ return {
  getContext: () => ({ setTransform(){}, clearRect(){}, save(){}, restore(){}, translate(){}, rotate(){}, transform(){}, scale(){}, fillRect(){}, strokeRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, arc(){}, arcTo(){}, closePath(){}, fill(){}, stroke(){}, fillText(){}, measureText:()=>({width:0}), createLinearGradient:()=>({addColorStop(){}}), setLineDash(){}, quadraticCurveTo(){}, bezierCurveTo(){} }),
  style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false}},
  addEventListener(){}, removeEventListener(){}, appendChild(){}, removeChild(){},
  querySelectorAll:()=>[], querySelector:()=>null,
  getBoundingClientRect:()=>({left:0,top:0,width:480,height:440}),
  innerHTML:'', textContent:'', width:480, height:440, clientWidth:480, clientHeight:440,
  setAttribute(){}, getAttribute(){return null;}
}; }
const docStub = {
  getElementById: El, createElement: El,
  addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>null,
  hidden:false, readyState:'complete', body:{appendChild(){}}, head:{appendChild(){}}
};
const winStub = {
  addEventListener(){}, removeEventListener(){},
  devicePixelRatio:1, innerWidth:480, innerHeight:800,
  AudioContext:function(){return {createOscillator:()=>({connect(){},start(){},stop(){},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}}),createBuffer:()=>({getChannelData:()=>new Float32Array(100)}),createBufferSource:()=>({connect(){},start(){}}),createBiquadFilter:()=>({connect(){},type:'',frequency:{value:0}}),destination:{},sampleRate:44100,state:'running',resume(){},close(){}};},
  webkitAudioContext:function(){return {};},
  localStorage:{ getItem:()=>null, setItem(){}, removeItem(){} }
};
const ctx = vm.createContext({ window:winStub, document:docStub, console:console, performance:{now:()=>0}, setTimeout:setTimeout, clearTimeout:clearTimeout, setInterval:setInterval, clearInterval:clearInterval, Math:Math, Date:Date, JSON:JSON });
try { vm.runInContext(game, ctx); }
catch(e){ console.log('LOAD ERROR:', e.message); process.exit(1); }

const LEVELS = vm.runInContext('LEVELS', ctx);
const simulateLevel = vm.runInContext('simulateLevel', ctx);

console.log('Levels found:', LEVELS.length);
let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  if (!lv.sol || !lv.sol.length) { console.log('L'+(i+1)+' ('+lv.name+'): NO SOLUTION DATA — SKIP'); fail++; continue; }
  // detect duplicate placement cells in solution
  const seen = {}; let dup = false;
  for (const s of lv.sol) { const k=s.r+','+s.c; if(seen[k]) dup=true; seen[k]=1; }
  const placements = lv.sol.map(s=>({r:s.r,c:s.c,t:s.t}));
  const res = simulateLevel(lv, placements);
  const starsGot = Object.keys(res.stars).length;
  const goalsGot = Object.keys(res.goals).length;
  const ok = res.ok;
  const tag = (ok?'OK  ':'FAIL') + (dup?' DUPCELL':'');
  console.log('L'+String(i+1).padStart(2)+' '+lv.name.padEnd(16)+' chain='+String(res.chainLen).padStart(3)+' goals='+goalsGot+'/'+lv.goals.length+' stars='+starsGot+'/'+lv.stars.length+' tray std='+lv.tray.standard+'/sp='+lv.tray.splitter+'/br='+lv.tray.bridge+'  '+tag);
  if (ok && !dup) pass++; else fail++;
}
console.log('\n'+pass+'/'+LEVELS.length+' solvable' + (fail?'  ('+fail+' FAILED)':'  ALL GOOD'));
