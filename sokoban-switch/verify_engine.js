#!/usr/bin/env node
// verify_engine.js — Uses the engine's own checkSolution via the in-page engine code
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// We only need solver functions + COLORS/COLOR_KEYS/PAR
// Extract just those from the page
function extractFunction(code, name){
  const idx = code.indexOf(`function ${name}(`);
  if (idx < 0) return '';
  let depth = 0, i = idx, start = idx;
  while (i < code.length){
    if (code[i] === '{') depth++;
    else if (code[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  return code.slice(start, i+1);
}
const solverFns = ['parseLevel','cloneGrid','findPlayer','findBoxes','updatePlates','updateGates','isBlocked','isSolved','movePlayer','checkSolution','gridKey'];
let engineCode = `
const COLORS = { R:{name:'red',hex:'#ff5050',light:'#ffa0a0',dark:'#a02020'}, G:{name:'green',hex:'#50e060',light:'#a0f0a0',dark:'#20a030'}, L:{name:'blue',hex:'#5080ff',light:'#a0b8ff',dark:'#2050c0'}, Y:{name:'yellow',hex:'#f5d040',light:'#fff0a0',dark:'#a08020'} };
const COLOR_KEYS = ['R','G','L','Y'];
const PAR = { Beginner:[9,9,10,10,11,11], Easy:[13,14,15,15,16,17], Medium:[18,20,22,22,24,26], Hard:[25,28,30,32,35,38], Expert:[35,38,42,45,48,52] };
`;
for (const fn of solverFns){
  engineCode += extractFunction(html, fn) + '\n';
}

const lvlMatch = html.match(/const LEVELS = \[([\s\S]*?)\n\];/);
const levelsCode = 'globalThis.LEVELS = [' + lvlMatch[1] + '\n];';  // assign to global

// Set up minimal DOM
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => {
      if (id === 'cvs') {
        return {
          width: 640, height: 640,
          getContext: () => new Proxy({}, { get: () => () => {} }),
          getBoundingClientRect: () => ({left:0, top:0, width:640, height:640}),
          addEventListener: () => null,
        };
      }
      return new Proxy({}, { get: () => () => null });
    },
    addEventListener: () => null,
    querySelectorAll: () => [],
    hidden: false
  },
  localStorage: { getItem: () => null, setItem: () => null },
  requestAnimationFrame: () => null,
  AudioContext: function() { return new Proxy({}, { get: () => () => null }); },
  alert: () => null,
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Math, Date, Number, Object, Array, String, JSON, Map, Set, Promise,
  Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array,
};
sandbox.window = sandbox;

// Use isolated vm context with all globals
const ctx = vm.createContext(sandbox);
// Run levels and engine separately; functions become global
vm.runInContext(levelsCode, ctx);
vm.runInContext(engineCode, ctx);
console.log('After eval: LEVELS type=', typeof ctx.LEVELS, 'parseLevel type=', typeof ctx.parseLevel);
const LEVELS = ctx.LEVELS;
console.log('=== verify_engine.js ===\n');
console.log(`Loaded ${LEVELS.length} levels\n`);

let pass = 0, fail = 0;
const solvedKeys = new Set();

for (let i=0; i<LEVELS.length; i++){
  const lv = LEVELS[i];
  const code = `
    (() => {
      const grid = parseLevel(LEVELS[${i}]);
      updatePlates(grid);
      updateGates(grid);
      const result = checkSolution(grid);
      // Find solved state key
      const visited = new Set([gridKey(grid)]);
      const queue = [grid];
      const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
      let endKey = '';
      let safety = 30000;
      bfs: while (queue.length > 0 && safety-- > 0){
        const cur = queue.shift();
        for (const [dx,dy] of dirs){
          const next = cloneGrid(cur);
          const r = movePlayer(next, dx, dy);
          if (!r.ok) continue;
          const k = gridKey(next);
          if (visited.has(k)) continue;
          visited.add(k);
          if (isSolved(next)){endKey = k; break bfs;}
          queue.push(next);
        }
      }
      return {result, endKey};
    })()
  `;
  let out;
  try {
    out = vm.runInContext(code, ctx);
  } catch(e){
    console.error(`L${i+1} error:`, e.message);
    fail++;
    continue;
  }

  const idx = String(i+1).padStart(2);
  if (out.result === 'solved'){
    const isDup = solvedKeys.has(out.endKey);
    console.log(`  L${idx} ${(lv.t||'').padEnd(9)} ${lv.name.padEnd(18)} SOLVED${isDup?' [DUP]':''}`);
    solvedKeys.add(out.endKey);
    pass++;
  } else if (out.result === 'unsolvable') {
    console.log(`  L${idx} ${(lv.t||'').padEnd(9)} ${lv.name.padEnd(18)} UNSOLVABLE`);
    fail++;
  } else {
    console.log(`  L${idx} ${(lv.t||'').padEnd(9)} ${lv.name.padEnd(18)} TIMEOUT (engine cap)`);
    fail++;
  }
}

console.log(`\n${pass}/${LEVELS.length} levels solved`);
console.log(`Unique solved states: ${solvedKeys.size}/${pass}`);
if (fail > 0){
  console.log(`\n${fail} levels FAILED`);
  process.exit(1);
}
console.log('\nverify_engine.js PASSED');
process.exit(0);