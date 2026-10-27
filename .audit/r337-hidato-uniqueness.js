#!/usr/bin/env node
/**
 * R337 — Hidato uniqueness sweep (uses the shared, calibrated counter).
 * Emits: multi / unique / unproven / zero per level.
 */
const fs = require('fs');
const path = require('path');
const { loadEngine, countSolutions, calibrate } = require('./r337-hidato-counter.js');

const ROOT = path.resolve(__dirname, '..');
const generatePuzzle = loadEngine();

console.log('=== CALIBRATION ===');
const cal = calibrate(generatePuzzle);
for (const c of cal.checks) console.log('  ' + (c.ok ? 'PASS' : 'FAIL') + '  ' + c.name + (c.info ? '  (' + c.info + ')' : ''));
console.log('CALIBRATION ' + (cal.pass ? 'ALL PASS' : 'FAILED'));
if (!cal.pass) { console.log('ABORT — an uncalibrated counter may not be trusted'); process.exit(3); }

const TIERS = [
  { name: 'Easy', size: 5, count: 8, fillRatio: 0.55 },
  { name: 'Medium', size: 7, count: 8, fillRatio: 0.45 },
  { name: 'Hard', size: 9, count: 8, fillRatio: 0.38 },
  { name: 'Expert', size: 10, count: 6, fillRatio: 0.32 },
];

console.log('\n=== HIDATO LEVELS ===');
let multi = [], unproven = [], zero = [], uniq = [], invalidTotal = 0;
const detail = [];
for (let idx = 0; idx < 30; idx++) {
  let acc = 0, cfg = null;
  for (const t of TIERS) { if (idx < acc + t.count) { cfg = { tier: t }; break; } acc += t.count; }
  const seed = (idx + 1) * 1009 + 7;
  const puz = generatePuzzle(cfg.tier.size, cfg.tier.fillRatio, seed);
  const r = countSolutions(puz, { cap: 2, budgetMs: 25000 });
  invalidTotal += r.invalidEmitted;
  let status;
  // Pitfall #70: TIMEOUT is UNPROVEN, never ZERO — and must be checked first.
  if (r.timedOut) { status = 'UNPROVEN'; unproven.push(idx + 1); }
  else if (r.sols.length === 0) { status = 'ZERO'; zero.push(idx + 1); }
  else if (r.sols.length >= 2) { status = 'MULTI'; multi.push(idx + 1); }
  else { status = 'UNIQUE'; uniq.push(idx + 1); }
  detail.push({ L: idx + 1, tier: cfg.tier.name, size: puz.size, N: puz.N,
    givens: puz.given.flat().filter(v => v !== null).length, sols: r.sols.length, timedOut: r.timedOut, status });
  console.log('  L' + String(idx + 1).padStart(2) + ' ' + cfg.tier.name.padEnd(8) + puz.size + 'x' + puz.size +
    ' N=' + String(puz.N).padStart(3) + ' givens=' + String(puz.given.flat().filter(v => v !== null).length).padStart(2) +
    ' sols=' + (r.timedOut ? 'TIMEOUT' : r.sols.length) + ' nodes=' + String(r.nodes).padStart(9) + '  ' + status);
}
console.log('\nSUMMARY  unique=' + JSON.stringify(uniq) + '\n         multi=' + JSON.stringify(multi) +
  '\n         unproven=' + JSON.stringify(unproven) + '\n         zero=' + JSON.stringify(zero));
console.log('invalid grids emitted by the counter (must be 0) = ' + invalidTotal);
fs.writeFileSync(path.join(ROOT, '.audit/r337-hidato-uniqueness.json'), JSON.stringify({ detail, multi, unproven, zero, unique: uniq }, null, 1));
console.log('CLAIM "exactly one solution path" is ' +
  (multi.length ? 'FALSE — ' + multi.length + '/30 levels admit >=2 solutions (multi=' + multi.join(',') + ')'
   : unproven.length ? 'NOT PROVEN for ' + unproven.join(',')
   : 'SUPPORTED'));
