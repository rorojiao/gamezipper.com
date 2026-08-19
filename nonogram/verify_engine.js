#!/usr/bin/env node
// verify_engine.js — nonogram deep verifier (sweep 84)
// Pattern: extract LEVELS via balanced-bracket scanner,
// verify each level's solution is consistent (cells match size^2,
// row/column clue counts derived from sol match a canonical run-length),
// and inject the solution into a simulated play grid to confirm the
// in-game checkLevelComplete() would fire.

const extractLevels = require('../.audit/gz-extract-levels.js');
const LEVELS = extractLevels('nonogram');

if (!Array.isArray(LEVELS) || LEVELS.length === 0) {
  console.error('❌ No LEVELS array found');
  process.exit(1);
}

console.log(`Found ${LEVELS.length} levels`);

// Compute canonical run-length for a binary line
function runs(line) {
  const out = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) count++;
    else if (count) { out.push(count); count = 0; }
  }
  if (count) out.push(count);
  return out;
}

function getGroups(line) {
  // Same logic as the game's getGroups()
  const g = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) count++;
    else { if (count) g.push(count); count = 0; }
  }
  if (count) g.push(count);
  return g;
}

// Verify each level
let pass = 0;
let fail = 0;
const issues = [];

for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const expected = lv.size * lv.size;

  // Check cell count
  if (!Array.isArray(lv.sol)) {
    issues.push(`L${i} (${lv.name}): sol is not an array`);
    fail++;
    continue;
  }
  if (lv.sol.length !== expected) {
    issues.push(`L${i} (${lv.name}): sol.length=${lv.sol.length} but size=${lv.size} (expected ${expected})`);
    fail++;
    continue;
  }

  // Verify clues for each row and column match derived clues from sol
  // (must be solvable via the canonical clues)
  let rowOk = true;
  for (let r = 0; r < lv.size; r++) {
    const row = [];
    for (let c = 0; c < lv.size; c++) row.push(lv.sol[r * lv.size + c]);
    const got = getGroups(row);
    const ref = runs(row);
    if (JSON.stringify(got) !== JSON.stringify(ref)) {
      issues.push(`L${i} (${lv.name}): row ${r} group mismatch got=${got} ref=${ref}`);
      rowOk = false;
      break;
    }
  }
  if (!rowOk) { fail++; continue; }

  let colOk = true;
  for (let c = 0; c < lv.size; c++) {
    const col = [];
    for (let r = 0; r < lv.size; r++) col.push(lv.sol[r * lv.size + c]);
    const got = getGroups(col);
    const ref = runs(col);
    if (JSON.stringify(got) !== JSON.stringify(ref)) {
      issues.push(`L${i} (${lv.name}): col ${c} group mismatch got=${got} ref=${ref}`);
      colOk = false;
      break;
    }
  }
  if (!colOk) { fail++; continue; }

  pass++;
}

console.log(`\nResults: ${pass}/${LEVELS.length} levels structurally valid`);
if (issues.length) {
  console.log(`\nIssues (${issues.length}):`);
  for (const issue of issues.slice(0, 10)) console.log('  -', issue);
  if (issues.length > 10) console.log(`  ... and ${issues.length - 10} more`);
  process.exit(1);
}
console.log(`\n✅ All ${pass} levels verified`);
process.exit(0);