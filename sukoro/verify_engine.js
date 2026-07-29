#!/usr/bin/env node
'use strict';

const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('sukoro');
const total = engine.run('LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const accepted = engine.run(`
    loadLevel(${i});
    grid = solution.map(row => row.slice());
    checkWin();
    won === true;
  `);
  if (!accepted) throw new Error(`Level ${i + 1}: production checkWin rejected its stored solution`);
  passed++;
}

console.log(`In-engine production checkWin: ${passed}/${total} stored solutions accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
