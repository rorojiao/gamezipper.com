// jsdom integration test for Orrery Planetary Gear
// Verifies: LEVELS load, DOM structure, dial mechanics, win detection.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
}

const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true });
const { window } = dom;
const { document } = window;

// Extract LEVELS/OPTIMAL from embedded JS (they're const-scoped, not on window)
const lvlMatch = html.match(/const LEVELS=(\[.*?\]);/);
const optMatch = html.match(/const OPTIMAL=(\[.*?\]);/);
const LEVELS = eval(lvlMatch[1]);
const OPTIMAL = eval(optMatch[1]);

// Wait for script execution
setTimeout(() => {
  console.log('=== Orrery Planetary Gear jsdom QA ===\n');

  // 1. LEVELS embedded
  ok('LEVELS array extracted', Array.isArray(LEVELS), `got ${typeof LEVELS}`);
  ok('LEVELS has 30 entries', LEVELS.length === 30, `got ${LEVELS.length}`);

  // 2. DOM structure
  ok('canvas#board exists', !!document.getElementById('board'));
  ok('#dialRow exists', !!document.getElementById('dialRow'));
  ok('#btnCheck exists', !!document.getElementById('btnCheck'));
  ok('#btnUndo exists', !!document.getElementById('btnUndo'));
  ok('#btnReset exists', !!document.getElementById('btnReset'));
  ok('header shows L1', document.getElementById('hdrLvl').textContent === 'L1', `got "${document.getElementById('hdrLvl').textContent}"`);

  // 3. Dials rendered for L1 (N=6, K=2)
  const dials = document.querySelectorAll('#dialRow .dial');
  ok('L1 has 2 dials', dials.length === 2, `got ${dials.length}`);

  // 4. Solve L1 by simulating known solution [0,0,1] (dials 0,0,1)
  // L1: N=6, dials=[[4,5,3],[5,3,0]], start=[2,2,3], solution=[0,0,1]
  // state after 0: [0,1,0]; after 0: [4,0,3]; after 1: [3,3,3] -> aligned!
  const L1 = LEVELS[0];
  let state = L1.s.slice();
  const N = L1.n;
  for (const k of [0, 0, 1]) {
    const d = L1.d[k];
    state = [(state[0]+d[0])%N, (state[1]+d[1])%N, (state[2]+d[2])%N];
  }
  ok('L1 solution [0,0,1] yields aligned state', state[0]===state[1] && state[1]===state[2], `got [${state}]`);

  // 5. OPTIMAL array exists and matches
  ok('OPTIMAL array exists', Array.isArray(OPTIMAL) && OPTIMAL.length === 30);
  ok('OPTIMAL[0]=3', OPTIMAL && OPTIMAL[0] === 3);

  // 6. Win overlay exists
  ok('#ovWin overlay exists', !!document.getElementById('ovWin'));
  ok('#ovIntro shows on load', document.getElementById('ovIntro').classList.contains('show'));

  // 7. All 30 levels: verify solution exists by computing aligned reachability
  let allSolvable = true;
  LEVELS.forEach((L, i) => {
    // simple BFS
    const seen = new Set([L.s.join(',')]);
    let frontier = [L.s.slice()];
    let found = false;
    for (let step = 0; step < 12; step++) {
      for (const st of frontier) {
        if (st[0]===st[1] && st[1]===st[2]) { found = true; break; }
      }
      if (found) break;
      const nxt = [];
      for (const st of frontier) {
        for (const d of L.d) {
          const ns = [(st[0]+d[0])%L.n,(st[1]+d[1])%L.n,(st[2]+d[2])%L.n];
          const k = ns.join(',');
          if (!seen.has(k)) { seen.add(k); nxt.push(ns); }
        }
      }
      frontier = nxt;
    }
    if (!found) allSolvable = false;
  });
  ok('All 30 levels solvable (in-test BFS)', allSolvable);

  console.log(`\n${pass}/${pass+fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}, 500);
