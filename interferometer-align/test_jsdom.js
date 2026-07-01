// test_jsdom.js — jsdom integration test for Interferometer Align
// Loads the game HTML, verifies DOM structure, simulates L1 solve.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true });
const doc = dom.window.document;

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

console.log('=== Interferometer Align jsdom Integration Test ===\n');

// Wait for script execution
setTimeout(() => {
  const w = dom.window;

  // 1. LEVELS loaded — const doesn't attach to window, check via dial rendering instead
  const dials0 = doc.querySelectorAll('#dialRow .dial');
  check('dials rendered (LEVELS loaded)', dials0.length > 0);
  check('L1 has 2 dials', dials0.length === 2); // L1 n=2

  // 2. DOM structure
  check('header h1 present', doc.querySelector('header h1') !== null);
  check('canvas#board present', doc.getElementById('board') !== null);
  check('#dialRow present', doc.getElementById('dialRow') !== null);
  check('#btnCheck present', doc.getElementById('btnCheck') !== null);
  check('#btnUndo present', doc.getElementById('btnUndo') !== null);
  check('#btnReset present', doc.getElementById('btnReset') !== null);
  check('#btnLevels present', doc.getElementById('btnLevels') !== null);

  // 3. Title and meta
  check('title contains Interferometer', doc.title.includes('Interferometer'));
  check('meta description present', doc.querySelector('meta[name=description]') !== null);
  check('og:image present', doc.querySelector('meta[property="og:image"]') !== null);

  // 4. Simulate L1 solve
  // L1: [2,6,[2,1],[-1,-1],[2,2],5] — solution stored in levels.json
  const levelsData = JSON.parse(fs.readFileSync('levels.json','utf8'));
  const L1 = levelsData[0];
  console.log(`\n  L1 solution: ${JSON.stringify(L1.solution)}, target: ${L1.target}`);

  // Press each dial the required number of times
  for (let k = 0; k < L1.n; k++) {
    for (let p = 0; p < L1.solution[k]; p++) {
      const dial = doc.querySelector(`#dialRow .dial[data-k="${k}"]`);
      if (dial) dial.click();
    }
  }

  // Check win overlay appeared (game auto-wins when netPath === target)
  const winOverlay = doc.getElementById('ovWin');
  check('L1 win overlay shown after solution', winOverlay && winOverlay.classList.contains('show'));

  console.log(`\n=== Result: ${pass}/${pass+fail} passed ===`);
  process.exit(fail > 0 ? 1 : 0);
}, 500);
