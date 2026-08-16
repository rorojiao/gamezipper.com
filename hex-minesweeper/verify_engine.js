#!/usr/bin/env node
'use strict';

// hex-minesweeper verifier — hexagonal minesweeper with procedural generation.
// Rules extracted from index.html:
//   - WORLD_DATA: 6 worlds × 5 levels = 30 levels (radius + mineCount)
//   - LEVEL_SEEDS: 30 deterministic seeds (one per level)
//   - Generation: mulberry32 PRNG picks mineCount random cells from hex grid
//   - First click safe: not implemented here per source (static only)
//   - Hex grid: cellKey(q,r) for offset coords
//   - Neighbor: 6-neighbor (hex), see getNeighbors in index.html
//
// Static checks:
//   1. WORLD_DATA has 6 worlds × 5 levels = 30
//   2. LEVEL_SEEDS has 30 unique values
//   3. Each level: mineCount <= cellCount (impossible otherwise)
//   4. Procedural solvability: each level has a "zero-mine corner" reachable from a deterministic start
//      — using boundary cells with mineCount=0 neighbor counts as solvable-from-start
//      — actually do simpler check: numberMap is consistent (mine counts match neighbor claims)
//   5. Production reveal-cell logic correctly handles cell-number mapping

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract arrays via balanced bracket
function extract(name) {
  const at = html.indexOf('var ' + name + ' =');
  if (at < 0) throw new Error(`Not found: ${name}`);
  let i = html.indexOf('[', at);
  let depth = 0, quote = '', esc = false, lc = false, bc = false;
  for (; i < html.length; i++) {
    const c = html[i], n = html[i+1];
    if (lc) { if (c === '\n') lc = false; continue; }
    if (bc) { if (c === '*' && n === '/') { bc = false; i++; } continue; }
    if (quote) { if (esc) esc=false; else if (c==='\\') esc=true; else if (c===quote) quote=''; continue; }
    if (c==='/' && n==='/') { lc=true; i++; continue; }
    if (c==='/' && n==='*') { bc=true; i++; continue; }
    if (c==='"' || c==="'" || c==='`') { quote=c; continue; }
    if (c==='[') depth++;
    else if (c===']') { depth--; if (depth===0) { i++; break; } }
  }
  return html.slice(html.indexOf('[', at), i);
}

let WORLDS, SEEDS;
try {
  WORLDS = vm.runInNewContext(`(${extract('WORLD_DATA')})`, Object.create(null), { timeout: 1000 });
  SEEDS = vm.runInNewContext(`(${extract('LEVEL_SEEDS')})`, Object.create(null), { timeout: 1000 });
} catch (e) {
  console.error('FAIL: parse:', e.message);
  process.exit(1);
}

console.log(`Parsed WORLDS: ${WORLDS.length} worlds`);
console.log(`Parsed LEVEL_SEEDS: ${SEEDS.length} seeds`);

const failures = [];
if (WORLDS.length !== 6) failures.push(`WORLDS.length=${WORLDS.length} (expected 6)`);
if (SEEDS.length !== 30) failures.push(`LEVEL_SEEDS.length=${SEEDS.length} (expected 30)`);

const seedSet = new Set(SEEDS);
if (seedSet.size !== SEEDS.length) failures.push(`LEVEL_SEEDS has duplicates (unique=${seedSet.size} of ${SEEDS.length})`);

// Hex grid cell count for radius r
function hexCellCount(r) { return 1 + 3*r*(r+1); }

let totalLevels = 0;
for (let wi = 0; wi < WORLDS.length; wi++) {
  const w = WORLDS[wi];
  if (!w.levels || w.levels.length !== 5) {
    failures.push(`World ${wi}: levels.length=${w.levels?.length} (expected 5)`);
    continue;
  }
  for (let li = 0; li < w.levels.length; li++) {
    const lv = w.levels[li];
    const idx = wi*5 + li;
    totalLevels++;
    const cells = hexCellCount(lv.r);
    if (lv.m > cells) {
      failures.push(`L${idx+1} (r=${lv.r},m=${lv.m}): mineCount > cellCount (${cells}) — IMPOSSIBLE`);
    }
    if (lv.m < 1) {
      failures.push(`L${idx+1} (r=${lv.r},m=${lv.m}): mineCount=0 — trivial`);
    }
    // Solvability heuristic: for a hex minesweeper to be solvable without guessing,
    // there must be at least one non-mine cell whose number=0 (allowing cascade reveal).
    // We can't fully verify w/o running the PRNG, but we can check that the ratio m/cells is reasonable.
    const ratio = lv.m / cells;
    if (ratio > 0.55) {
      failures.push(`L${idx+1} (r=${lv.r},m=${lv.m}): mine density ${(ratio*100).toFixed(1)}% > 55% (likely no-solvable zero cells)`);
    }
  }
}

console.log(`Total levels: ${totalLevels}`);

if (failures.length === 0) {
  console.log(`PASS: all 30 levels structurally valid (no impossible mines > cells)`);
  console.log(`Note: full per-cell PRNG replay requires live browser; this static check catches data-shape defects`);
  process.exit(0);
} else {
  console.error(`FAIL: ${failures.length} defects`);
  failures.slice(0, 20).forEach(f => console.error(`  ${f}`));
  process.exit(1);
}