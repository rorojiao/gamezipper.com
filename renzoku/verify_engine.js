#!/usr/bin/env node
// Method 3: In-engine verification — load actual index.html,
// extract LEVELS + checkSolution function, verify each level
// against the actual game's rules.

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the inline LEVELS const + checkSolution function
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('renzoku');
const checkMatch = html.match(/function checkSolution\(\)\s*\{[\s\S]*?^\}/m);
if (!checkMatch) { console.error('checkSolution not found'); process.exit(1); }

const ctx = {
  console,
  document: {
    addEventListener: () => {},
    querySelectorAll: () => [],
    getElementById: () => ({
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      textContent: '', onclick: null,
    }),
  },
  window: { addEventListener: () => {} },
  localStorage: { getItem: () => null, setItem: () => {} },
};
vm.createContext(ctx);

vm.runInContext(`
  ${LEVELS[0]}
  ${checkMatch[0]}
`, ctx);

const checkSolution = ctx.checkSolution;
if (typeof checkSolution !== 'function') {
  console.error('checkSolution not loaded');
  process.exit(1);
}

let pass = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const N = lv.N;
  // Set up lv (the game's internal level object)
  ctx.lv = { i: lv.i, tier: lv.t, N: N, givens: lv.g, solution: lv.s };
  // Build grid: given cells filled, others null
  const grid = Array.from({length: N}, () => new Array(N).fill(null));
  for (const [r, c, v] of lv.g) grid[r][c] = v;
  // Then fill with solution (since checkSolution verifies the COMPLETE grid)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      grid[r][c] = lv.s[r * N + c];
    }
  }
  ctx.grid = grid;
  let res;
  try { res = checkSolution(); } catch (e) {
    console.error(`L${i+1}: error`, e.message);
    continue;
  }
  const ok = res && res.ok;
  if (ok) pass++;
  console.log(`  L${String(i+1).padStart(2,' ')} N=${N}: ${ok ? 'PASS' : 'FAIL'} reason=${res ? res.reason : 'unknown'}`);
}
console.log(`\n${pass}/${LEVELS.length} levels PASS`);