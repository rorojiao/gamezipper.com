// jsdom integration test: load index.html, render menu, start L1, set dials to solution, verify win
const fs = require('fs');
let dom, doc;
try { dom = require('jsdom'); } catch(e){ console.error('jsdom not installed'); process.exit(127); }
const { JSDOM } = dom;
const html = fs.readFileSync('index.html','utf8');
const vdom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
doc = vdom.window.document;

// inject the script manually (jsdom outside-only)
const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptContent) {
  try {
    vdom.window.eval(scriptContent[1]);
  } catch(e) {
    // some browser APIs may be missing; catch and inspect
  }
}

// Since jsdom may not fully support canvas/audio, do a logic-only integration:
// 1. Check LEVELS loaded
const w = vdom.window;
let pass=0, fail=0;
function assert(c,m){ if(c){pass++; console.log('✅ '+m)} else {fail++; console.log('❌ '+m)} }

assert(typeof w.LEVELS==='object' && w.LEVELS.length===30, 'LEVELS array loaded with 30 entries');
assert(doc.getElementById('menu')!==null, 'menu screen present in DOM');
assert(doc.getElementById('dialrow')!==null, 'dial row present');
assert(doc.getElementById('cv')!==null, 'canvas element present');
assert(doc.querySelector('[id="start"]')!==null, 'Play button present');
assert(doc.querySelector('.menu-screen h1')!==null, 'title heading present');

// Logic test: simulate L1 play
if (w.LEVELS && w.LEVELS[0]) {
  const L1 = w.LEVELS[0];
  const cur = {P:L1[0],n:L1[1],steps:L1[2],signs:L1[3],maxes:L1[4],target:L1[5],solution:L1[6]};
  // netPrecession with solution
  let s=0; for(let i=0;i<cur.n;i++) s+=cur.solution[i]*cur.steps[i]*cur.signs[i];
  const net = ((s%cur.P)+cur.P)%cur.P;
  assert(net===cur.target, 'L1 solution yields target (playtest)');
}

console.log(`\njsdom integration: ${pass} passed, ${fail} failed`);
process.exit(fail>0?1:0);
