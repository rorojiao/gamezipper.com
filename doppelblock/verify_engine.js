#!/usr/bin/env node
// Method 3: In-engine verification — load actual index.html via vm.runInContext,
// extract LEVELS + checkSolution function, verify each level.

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the inline LEVELS const + checkSolution function
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('doppelblock');
const checkMatch = html.match(/function checkSolution\(\)\s*\{[\s\S]*?^\}/m);
if (!checkMatch) { console.error('checkSolution not found'); process.exit(1); }

const ctx = { console, document: { addEventListener: () => {}, querySelectorAll: () => [], getElementById: () => ({ classList: { add: () => {}, remove: () => {} }, textContent: '', onclick: null }) }, window: { addEventListener: () => {} }, localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(ctx);
// Inject minimal stubs and the LEVELS + checkSolution
vm.runInContext(`
  const levels = ${JSON.stringify(LEVELS)};
  ${checkMatch[0]}
`, ctx);

const checkSolution = ctx.checkSolution;
if (typeof checkSolution !== 'function') { console.error('checkSolution not loaded'); process.exit(1); }

let nPass = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const N = lv.n;
  // Convert engine format → engine grid
  // Black is at lv.b; prefilled at lv.p; solution is lv.s (flat array).
  // Build a fake "grid" by setting prefilled + solution
  // Actually, checkSolution reads lv (the engine's expanded level) and a separate grid global.
  // We need to call it the way the engine does. Looking at the engine, checkSolution is called
  // against a module-scoped `lv` and `grid`. So we'll set those.
  const blackSet = new Set(lv.b.map(([r, c]) => r + ',' + c));
  const prefilledMap = {};
  for (const [r, c, v] of (lv.p || [])) prefilledMap[r + ',' + c] = v;
  const grid = [];
  for (let r = 0; r < N; r++) {
    grid.push([]);
    for (let c = 0; c < N; c++) {
      if (blackSet.has(r + ',' + c)) grid[r].push(0);  // black cells: any value, checkSolution skips
      else if (prefilledMap[r + ',' + c] !== undefined) grid[r].push(prefilledMap[r + ',' + c]);
      else grid[r].push(lv.s[r * N + c]);
    }
  }
  ctx.lv = {
    i: lv.i, tier: lv.t, N: N,
    black: blackSet,
    prefilled: new Set((lv.p || []).map(([r, c, v]) => r + ',' + c + ':' + v)),
    clues: lv.c,
    solution: lv.s,
  };
  ctx.grid = grid;
  let res;
  try { res = checkSolution(); } catch (e) { console.error(`L${i + 1}: error`, e.message); continue; }
  const ok = res && res.ok;
  if (ok) nPass++;
  console.log(`  L${String(i + 1).padStart(2, ' ')} N=${N}: ${ok ? 'PASS' : 'FAIL'} reason=${res ? res.reason : 'unknown'}`);
}
console.log(`\n${nPass}/${LEVELS.length} levels PASS`);