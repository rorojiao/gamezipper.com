#!/usr/bin/env node
'use strict';

const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('rekuto');
const total = engine.run('LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const accepted = engine.run(`(() => {
    loadLevel(${i});
    const owner = Array.from({ length: R }, () => Array(C).fill(-1));
    LEVELS[${i}].rects.forEach((rect, id) => {
      const [r1, c1, r2, c2] = rect;
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) owner[r][c] = id;
    });
    for (let r = 1; r < R; r++) for (let c = 0; c < C; c++) {
      if (owner[r][c] !== owner[r - 1][c]) hBorders[r][c] = true;
    }
    for (let r = 0; r < R; r++) for (let c = 1; c < C; c++) {
      if (owner[r][c] !== owner[r][c - 1]) vBorders[r][c] = true;
    }
    return checkWin();
  })()`);
  if (!accepted) throw new Error(`Level ${i + 1}: production checkWin rejected its stored rectangles`);
  passed++;
}

console.log(`In-engine production checkWin: ${passed}/${total} stored rectangle tilings accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
