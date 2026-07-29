#!/usr/bin/env node
'use strict';

const path = require('path');
const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('cross-the-streams');
const total = engine.run('LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const accepted = engine.run(`
    loadLevel(${i});
    grid = LEVELS[${i}].solution.map(row => row.slice());
    checkSolution();
    won === true;
  `);
  if (!accepted) throw new Error(`Level ${i + 1}: production checkSolution rejected its stored solution`);
  passed++;
}

console.log(`In-engine production checkSolution: ${passed}/${total} stored solutions accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
