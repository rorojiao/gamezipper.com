#!/usr/bin/env node
'use strict';

const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('toichika');
const total = engine.run('LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const result = engine.run(`
    loadLevel(${i});
    for (const arrow of solution) gridArrows[arrow.r][arrow.c] = arrow.d;
    checkSolution();
  `);
  if (!result || !result.ok) throw new Error(`Level ${i + 1}: production checkSolution rejected its stored arrows`);
  passed++;
}

console.log(`In-engine production checkSolution: ${passed}/${total} stored arrow sets accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
