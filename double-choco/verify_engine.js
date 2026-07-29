#!/usr/bin/env node
'use strict';

const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('double-choco');
const total = engine.run('LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const accepted = engine.run(`
    startLevel(${i});
    userBorders = new Set(prefilledBorders);
    checkSolution();
  `);
  if (!accepted) throw new Error(`Level ${i + 1}: production checkSolution rejected its generated borders`);
  passed++;
}

console.log(`In-engine production checkSolution: ${passed}/${total} stored solutions accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
