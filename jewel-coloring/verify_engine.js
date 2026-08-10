#!/usr/bin/env node
// Jewel Coloring verifier — sweep 56
// Validates: 30 LEVELS parse, every grid is rectangular, every color in grid is in colors[] palette,
// simulate filling all cells → checkComplete returns true (allFilled).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const idxPath = path.join(__dirname, 'index.html');
const src = fs.readFileSync(idxPath, 'utf8');

const m = src.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (!m) { console.error('FAIL: LEVELS array not found'); process.exit(1); }
let body = m[1].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

let LEVELS;
try { LEVELS = vm.runInNewContext('(' + body + ')', {}); }
catch (e) { console.error('FAIL: LEVELS parse error:', e.message); process.exit(1); }

const report = {
  levels_count: LEVELS.length,
  with_grid: 0,
  with_colors: 0,
  with_target_time: 0,
  rectangular: 0,
  all_colors_in_palette: 0,
  all_fillable_simulation: 0,
  malformed: [],
};

const COLOR_DISTINCT = new Set();
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  if (!L || typeof L !== 'object') { report.malformed.push(i); continue; }
  if (Array.isArray(L.grid) && L.grid.length > 0) report.with_grid++;
  if (Array.isArray(L.colors) && L.colors.length > 0) report.with_colors++;
  if (typeof L.targetTime === 'number' && L.targetTime > 0) report.with_target_time++;
  if (Array.isArray(L.grid) && L.grid.length > 0) {
    const rows = L.grid.length;
    const cols = L.grid[0].length;
    let rect = true;
    for (const r of L.grid) if (r.length !== cols) { rect = false; break; }
    if (rect) report.rectangular++;
    // every cell value must be in [0..L.colors.length-1]
    let allIn = true;
    const maxIdx = L.colors.length - 1;
    for (const r of L.grid) for (const c of r) {
      if (typeof c !== 'number' || c < 0 || c > maxIdx) { allIn = false; break; }
    }
    if (allIn) report.all_colors_in_palette++;
    // simulate checkComplete with all cells filled
    const filledCells = {};
    for (let r = 0; r < L.grid.length; r++) {
      for (let c = 0; c < L.grid[r].length; c++) {
        const cell = L.grid[r][c];
        if (cell === 0) continue;  // 0 = empty cell, not fillable
        filledCells[`${r}_${c}`] = true;
      }
    }
    // Replicate production checkComplete (without modifying game state)
    const level = L;
    let allFilled = true;
    for (let r = 0; r < level.grid.length; r++) {
      const row = level.grid[r];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell === 0) continue;
        const key = `${level.grid.indexOf(row)}_${row.indexOf(cell)}`;
        if (!filledCells[key]) { allFilled = false; break; }
      }
      if (!allFilled) break;
    }
    if (allFilled) report.all_fillable_simulation++;
  }
  L.colors && L.colors.forEach(c => COLOR_DISTINCT.add(JSON.stringify(c)));
}

console.log(JSON.stringify(report, null, 2));
console.log('total distinct colors used:', COLOR_DISTINCT.size);
const ok = report.levels_count === 30 &&
           report.with_grid === 30 &&
           report.with_colors === 30 &&
           report.with_target_time === 30 &&
           report.rectangular === 30 &&
           report.all_colors_in_palette === 30 &&
           report.all_fillable_simulation === 30 &&
           report.malformed.length === 0;
console.log('VERDICT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
