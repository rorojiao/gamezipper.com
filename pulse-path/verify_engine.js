#!/usr/bin/env node
'use strict';

const { loadProductionEngine, runIndependentVerifier } = require('../.audit/gz-production-engine.js');

const engine = loadProductionEngine('pulse-path');
const total = engine.run('window.__PULSE_TEST__.LEVELS.length');
let passed = 0;

for (let i = 0; i < total; i++) {
  const result = engine.run(`(() => {
    const T = window.__PULSE_TEST__;
    const level = T.LEVELS[${i}];
    const solutionCount = T.countSolutions(level);
    if (solutionCount !== 1) return { ok: false, reason: 'solution count=' + solutionCount };
    if (!T.replaySolution(${i})) return { ok: false, reason: 'replaySolution rejected stored path' };
    T.startLevel(${i});
    for (const step of level.solution) {
      if (!T.fireDirection(step.dir)) return { ok: false, reason: 'fireDirection rejected ' + step.dir };
    }
    const state = T.getState();
    return { ok: state.won === true && state.moves === level.par, moves: state.moves };
  })()`);
  if (!result || !result.ok) throw new Error(`Level ${i + 1}: production Pulse Path engine rejected its stored solution (${result && result.reason || 'win/move mismatch'})`);
  passed++;
}

console.log(`In-engine production replay: ${passed}/${total} unique stored paths accepted`);
console.log('Independent validator:');
runIndependentVerifier(__dirname);
