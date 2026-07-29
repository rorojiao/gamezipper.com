#!/usr/bin/env node
'use strict';

const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('dotchi-loop');
const total = engine.run('LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const accepted = engine.run(`
    loadLevel(${i});
    edges = new Set(LEVELS[${i}].solution.map(edge => ekey([edge[0], edge[1]], [edge[2], edge[3]])));
    checkSolution(true);
  `);
  if (!accepted) throw new Error(`Level ${i + 1}: production checkSolution rejected its stored loop`);
  passed++;
}

console.log(`In-engine production checkSolution: ${passed}/${total} stored loops accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
