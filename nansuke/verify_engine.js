// verify_engine.js — In-engine verifier. Loads the actual index.html via
// vm.runInContext, populates the grid with the level solution, and calls
// the engine's isComplete() to confirm the engine accepts the solution.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the <script> blocks (inline only)
const scriptRegex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
const scripts = [];
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  // skip external src scripts
  const tag = html.substring(m.index, m.index + m[0].indexOf(m[1]));
  if (/src\s*=/.test(tag)) continue;
  scripts.push(m[1]);
}

// Build a sandbox with minimal DOM stubs
const sandbox = {
  window: {},
  document: {
    getElementById: function() {
      return {
        textContent: '', innerHTML: '', className: '', style: {}, classList: {
          add: function(){}, remove: function(){}, toggle: function(){}, contains: function(){return false;}
        },
        appendChild: function(){}, addEventListener: function(){},
        clientWidth: 500, width: 500, height: 500, getContext: function(){return ctxStub;},
        getBoundingClientRect: function(){return {left:0,top:0};}
      };
    },
    querySelectorAll: function(){return [];},
    querySelector: function(){return null;},
    addEventListener: function(){},
    createElement: function(){return {className:'',textContent:'',style:{},classList:{add:function(){},remove:function(){},toggle:function(){}},appendChild:function(){},addEventListener:function(){}};},
  },
  localStorage: { getItem: function(){return null;}, setItem: function(){}, },
  AudioContext: function(){return {currentTime:0,destination:{},createOscillator:function(){return {connect:function(){},frequency:{setValueAtTime:function(){}},type:'',start:function(){},stop:function(){}};},createGain:function(){return {connect:function(){},gain:{setValueAtTime:function(){},linearRampToValueAtTime:function(){},exponentialRampToValueAtTime:function(){}}};}};},
  requestAnimationFrame: function(){return 1;},
  cancelAnimationFrame: function(){},
  setTimeout: function(){return 0;},
  clearTimeout: function(){},
  console: console,
  JSON: JSON,
  Math: Math,
  Date: { now: function(){return 0;} },
};
sandbox.window = sandbox;
sandbox.self = sandbox;

const ctxStub = {
  clearRect: function(){}, fillRect: function(){}, strokeRect: function(){},
  save:function(){},restore:function(){},translate:function(){},rotate:function(){},
  fillText:function(){}, strokeText:function(){},
  fillStyle:'', strokeStyle:'', lineWidth:1, font:'', textAlign:'', textBaseline:'',
};

const ctx = vm.createContext(sandbox);
// Run each script
for (const s of scripts) {
  try { vm.runInContext(s, ctx, {timeout: 5000}); }
  catch(e) { /* ignore DOM errors */ }
}

// Now test each level
const levels = ctx.LEVELS;
if (!levels) { console.error('❌ LEVELS not loaded'); process.exit(1); }

let allPass = true;
for (let li = 0; li < levels.length; li++) {
  const lv = levels[li];
  // load the level
  try {
    ctx.loadLevel(li);
  } catch(e) { /* may error on canvas, ignore */ }
  // populate the grid with the solution
  for (let r = 0; r < lv.R; r++) {
    for (let c = 0; c < lv.C; c++) {
      const sd = lv.solution[r][c];
      if (sd === '#') {
        ctx.state.cellDigit[r][c] = '#';
      } else {
        ctx.state.cellDigit[r][c] = sd;
        // mark cellNum so isComplete counting works: set cellNum to the number
        // that covers this cell. We need to find which placed number covers it.
      }
    }
  }
  // set cellNum for each cell by reconstructing entries
  const ents = ctx.getEntries();
  const allEntries = ents.hEntries.concat(ents.vEntries);
  for (const run of allEntries) {
    let numStr = '';
    for (const cell of run) numStr += ctx.state.cellDigit[cell[0]][cell[1]];
    // mark every cell of this run with this number
    for (const cell of run) ctx.state.cellNum[cell[0]][cell[1]] = numStr;
    ctx.state.usedNums.add(numStr);
  }
  // call isComplete
  let result;
  try { result = ctx.isComplete(); } catch(e) { result = 'ERROR: ' + e.message; }
  const ok = result === true;
  if (!ok) allPass = false;
  console.log(`Level ${li + 1} (${lv.tier} ${lv.R}x${lv.C}): isComplete=${result} ${ok ? '✅' : '❌'}`);
}
console.log(allPass ? '\n✅ ALL 30 LEVELS PASS in-engine isComplete()' : '\n❌ SOME LEVELS FAILED in-engine');
process.exit(allPass ? 0 : 1);
