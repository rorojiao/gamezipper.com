#!/usr/bin/env node
'use strict';

const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('shirokuro');
const total = engine.run('LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const accepted = engine.run(`
    loadLevel(${i});
    edges = new Map(LEVELS[${i}].solution.map(edge => [ekey([edge[0], edge[1]], [edge[2], edge[3]]), 'verify']));
    checkSolution(true);
  `);
  if (!accepted) throw new Error(`Level ${i + 1}: production checkSolution rejected its stored lines`);
  passed++;
}

console.log(`In-engine production checkSolution: ${passed}/${total} stored line sets accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
