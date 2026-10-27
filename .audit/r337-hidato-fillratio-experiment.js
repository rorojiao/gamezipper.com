#!/usr/bin/env node
/**
 * R337 — EXPERIMENT: can Hidato's levels be made genuinely unique by raising
 * the clue density (fillRatio)? If yes, the FAQ's "exactly one solution path"
 * becomes TRUE and the hint bug's root cause disappears.
 *
 * Uses the CALIBRATED counter. Reports, per tier config, how many of the
 * tier's levels are UNIQUE / MULTI / UNPROVEN at each candidate fillRatio.
 *
 * Time budget: the counter is exponential, so this is sampled (the first
 * `probe` levels of each tier), not exhaustive.
 */
const { loadEngine, countSolutions, calibrate } = require('./r337-hidato-counter.js');
const generatePuzzle = loadEngine();

const cal = calibrate(generatePuzzle);
if (!cal.pass) { console.log('CALIBRATION FAILED — abort'); process.exit(3); }
console.log('calibration OK\n');

const TIERS = [
  { name: 'Easy', size: 5, count: 8 },
  { name: 'Medium', size: 7, count: 8 },
  { name: 'Hard', size: 9, count: 8 },
  { name: 'Expert', size: 10, count: 6 },
];

const RATIOS = [0.55, 0.62, 0.70, 0.78, 0.85];
const PROBE = 4;   // levels sampled per tier per ratio

for (const t of TIERS) {
  console.log('=== ' + t.name + ' (' + t.size + 'x' + t.size + ') ===');
  for (const ratio of RATIOS) {
    let uniq = 0, multi = 0, unproven = 0, givens = 0;
    for (let k = 0; k < PROBE; k++) {
      const idx = TIERS.indexOf(t) * 100 + k;
      const puz = generatePuzzle(t.size, ratio, (idx + 1) * 1009 + 7);
      const r = countSolutions(puz, { cap: 2, budgetMs: 8000 });
      givens += puz.given.flat().filter(v => v !== null).length;
      if (r.timedOut) unproven++;
      else if (r.sols.length === 0) unproven++;   // treat as not-proven-unique
      else if (r.sols.length >= 2) multi++;
      else uniq++;
    }
    console.log('  fillRatio=' + ratio.toFixed(2) +
      '  avgGivens=' + (givens / PROBE).toFixed(1) +
      '  unique=' + uniq + ' multi=' + multi + ' unproven=' + unproven + '/' + PROBE);
  }
}
