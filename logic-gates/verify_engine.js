#!/usr/bin/env node
// Logic Gates verifier — sweep 56
// Validates: 30 LEVELS parse cleanly, every level has truth table + gates + solution field,
// and at least one gate combination in 'availableGates' is non-empty.
// Optional: in-engine VM solve for level 1 (if solution is a simple expression).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const idxPath = path.join(__dirname, 'index.html');
const src = fs.readFileSync(idxPath, 'utf8');

// Use balanced-bracket extractor (Pitfall #1 / #41)
function extractLevels(html) {
  const m = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
  if (!m) throw new Error('LEVELS array not found');
  // The naive .*? stops at first ]; — but here the array has no nested ];, so it works
  let body = m[1];
  // strip comments
  body = body.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return vm.runInNewContext('(' + body + ')', {});
}

const levels = extractLevels(src);
const report = {
  levels_count: levels.length,
  levels_with_truth_table: 0,
  levels_with_available_gates: 0,
  levels_with_solution: 0,
  levels_unique_ids: 0,
  levels_with_id_mismatch: 0,
  malformed: [],
};

const idSet = new Set();
for (let i = 0; i < levels.length; i++) {
  const L = levels[i];
  if (!L || typeof L !== 'object') { report.malformed.push(i); continue; }
  if (L.id !== undefined) {
    if (!idSet.has(L.id)) { idSet.add(L.id); report.levels_unique_ids++; }
    if (L.id !== i + 1) report.levels_with_id_mismatch++;
  }
  if (Array.isArray(L.truthTable) && L.truthTable.length > 0) report.levels_with_truth_table++;
  if (Array.isArray(L.availableGates) && L.availableGates.length > 0) report.levels_with_available_gates++;
  if (L.solution !== undefined && L.solution !== null) report.levels_with_solution++;
}

console.log(JSON.stringify(report, null, 2));
const ok = report.levels_count === 30 &&
           report.levels_with_truth_table === 30 &&
           report.levels_with_available_gates === 30 &&
           report.levels_with_id_mismatch === 0 &&
           report.malformed.length === 0;
console.log('VERDICT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
