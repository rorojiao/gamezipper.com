#!/usr/bin/env node
/* In-Engine verifier: runs the actual checkWin() / applyTilt() from the game's
 * JavaScript by reading the inline LEVELS array in index.html and the JS engine code.
 * Since we use vanilla JS with no bundler, we extract the function bodies via regex
 * and run them on each level using a vm.runInContext sandbox.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'index.html');

if (!fs.existsSync(HTML_PATH)) {
  console.error(`index.html not found at ${HTML_PATH}`);
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf8');

// Extract inline LEVELS array (between markers)
const levelsMatch = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (!levelsMatch) {
  console.error('Could not find LEVELS array in index.html');
  process.exit(1);
}

// Extract engine function bodies (between markers)
function extractFn(name) {
  const re = new RegExp(`function ${name}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const m = html.match(re);
  if (!m) return null;
  return `function ${name}(${m[1]}) {${m[2]}\n}`;
}

const tiltFnSrc = extractFn('tiltGrid');
const checkWinFnSrc = extractFn('checkWin');

if (!tiltFnSrc || !checkWinFnSrc) {
  console.error('Could not extract tiltGrid/checkWin functions');
  process.exit(1);
}

// Run in vm context
const vm = require('vm');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(`${tiltFnSrc}\n${checkWinFnSrc}`, ctx);

const LEVELS = vm.runInContext(levelsMatch[1], ctx);

let passed = 0;
const failed = [];

for (let i = 0; i < LEVELS.length; i++) {
  const lvl = LEVELS[i];
  const sol = lvl.solution;
  let grid = lvl.grid.map(r => r.split(''));
  let valid = true;
  for (const d of sol) {
    const result = ctx.tiltGrid(grid, d);
    if (!result.valid) {
      valid = false;
      break;
    }
    grid = result.grid;
  }
  const win = ctx.checkWin(grid);
  if (valid && win) {
    passed++;
  } else {
    failed.push([i + 1, lvl.tier, valid ? 'NO_WIN' : 'INVALID_MOVE']);
  }
}

console.log(`=== Tilt Maze In-Engine Verifier ===`);
console.log(`Total: ${LEVELS.length}, Passed: ${passed}, Failed: ${failed.length}`);
if (failed.length > 0) {
  for (const [id, tier, reason] of failed) {
    console.log(`  L${id} (${tier}): FAIL — ${reason}`);
  }
  process.exit(1);
} else {
  console.log(`ALL ${LEVELS.length} LEVELS PASS IN-ENGINE ✓`);
}