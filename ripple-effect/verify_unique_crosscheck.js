#!/usr/bin/env node
/**
 * CROSS-CHECK for ripple-effect/verify_unique_search.js.
 *
 * The unique-solution counter is MY implementation of the rules. To make sure
 * a rival solution is genuinely rule-valid (and not an artifact of a
 * mis-specified rule), each rival grid is re-checked with the rule code
 * lifted VERBATIM from the game's shipped verifier
 * (ripple-effect/verify_engine.js :: validate(), lines 198-232).
 *
 * If the shipped validator REJECTS a rival grid, then my counter's rule
 * reading is wrong (or the rival is genuinely invalid) and the uniqueness
 * verdict is not trustworthy.
 *
 * Independently, this also exercises the sensitivity property: for a
 * multi-solution level, ADDING the rival's differing cells as givens must
 * collapse the count to exactly 1 (otherwise the level is not actually
 * ambiguous in a way a player would notice).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

// ---- lift the shipped validator's rule code verbatim -----------------------
const verSrc = fs.readFileSync(path.join(HERE, 'verify_engine.js'), 'utf8');
const start = verSrc.indexOf('function validate(data,compact){');
if (start < 0) { console.error('could not lift validate() from verify_engine.js'); process.exit(2); }
// brace-match to find the end of the function
let depth = 0, i = verSrc.indexOf('{', start), end = -1;
for (; i < verSrc.length; i++) {
  if (verSrc[i] === '{') depth++;
  else if (verSrc[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const validateSrc = verSrc.slice(start, end);

// ---- load the levels + my counter ------------------------------------------
const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const LEVELS = eval('(' + html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);\s*\n/)[1] + ')');

// reuse the counter by importing its internals through a child process is
// fragile; instead re-implement the decode here and CALL the counter module
// via a tiny shim that exposes countSolutions.
const counterSrc = fs.readFileSync(path.join(HERE, 'verify_unique_search.js'), 'utf8');
// expose countSolutions + decodeLevel + validate for reuse
const patched = counterSrc
  .replace("'use strict';", "'use strict';\nmodule.exports={countSolutions,decodeLevel,validate};")
  // the shim lives outside the game dir, so pin the level file to an absolute path
  .replace("path.join(HERE, 'index.html')", "require('path').join('/home/junze/gamezipper.com/ripple-effect', 'index.html')")
  .replace(/^\/\/ -+ calibration ---[\s\S]*$/m, '');
const Module = require('module');
const modPath = path.join(require('os').tmpdir(), 'r334-rip-counter-shim-' + process.pid + '.js');
fs.writeFileSync(modPath, patched);
const counter = require(modPath);
fs.unlinkSync(modPath);

// ---- build the engine-shaped data object the shipped validate() expects ---
function buildData(lv) {
  const n = lv.n;
  const regions = [], regionMap = [], solution = [], puzzle = [];
  for (let r = 0; r < n; r++) {
    regionMap.push([]); solution.push([]); puzzle.push([]);
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const rid = lv.cells[i].region;
      regionMap[r].push(rid);
      while (regions.length <= rid) regions.push([]);
      regions[rid].push([r, c]);
      solution[r].push(lv.cells[i].sol);
      puzzle[r].push(lv.cells[i].given);
    }
  }
  return { size: n, regions, regionMap, solution, puzzle, maxNum: lv.maxNum };
}

// run the shipped validator against an arbitrary grid.
// NOTE: validate() uses `return` statements, so it must stay a function
// declaration (an IIFE wrapper would break the early returns).
const shippedValidate = eval('(' + validateSrc + ')');

let rivalRejected = 0, rivalsChecked = 0, sensitivityFail = 0;

for (const e of LEVELS) {
  const lv = counter.decodeLevel(e);
  const res = counter.countSolutions(lv, { limit: 2, budgetMs: 30000 });
  if (res.count < 2) continue;

  const rival = res.solutions[1];   // the SECOND solution = a different grid
  if (!rival) continue;
  const data = buildData(lv);
  // keep a copy of the STORED solution for the disagreement diff
  const storedSolution = data.solution.map(r => r.slice());
  // overwrite the data's solution with the rival grid, keep regionMap/puzzle
  for (let r = 0; r < lv.n; r++) for (let c = 0; c < lv.n; c++) data.solution[r][c] = rival[r][c];
  rivalsChecked++;
  try {
    shippedValidate(data, null);
    console.log('  L' + e.id + ': rival grid ACCEPTED by the shipped verifier (rule-valid)');
  } catch (err) {
    rivalRejected++;
    console.log('  L' + e.id + ': rival grid REJECTED by the shipped verifier -> ' + err.message);
  }

  // SENSITIVITY: add the rival's differing cells as givens; the count must
  // collapse to exactly 1 (or 0), proving the level was genuinely ambiguous.
  const diff = [];
  for (let r = 0; r < lv.n; r++) for (let c = 0; c < lv.n; c++) {
    if (rival[r][c] !== storedSolution[r][c]) diff.push([r, c]);
  }
  if (diff.length === 0) { console.log('    NOTE: rival is byte-identical to the stored solution (duplicate emission)'); }
  const lv2 = counter.decodeLevel(e);
  for (const [r, c] of diff) {
    const cell = lv2.cells[r * lv2.n + c];
    cell.given = true;
    cell.sol = rival[r][c];
  }
  const res2 = counter.countSolutions(lv2, { limit: 3, budgetMs: 30000 });
  const ok = res2.count === 1;
  if (!ok) sensitivityFail++;
  console.log('    sensitivity: +' + diff.length + ' givens from the disagreement set -> count=' + res2.count
    + (ok ? ' (collapsed to 1, OK)' : ' (EXPECTED 1)'));
}

console.log('---');
console.log('rivals cross-checked against the shipped verifier : ' + rivalsChecked);
console.log('rivals REJECTED by the shipped verifier           : ' + rivalRejected);
console.log('sensitivity failures (count did not collapse to 1): ' + sensitivityFail);
console.log(rivalRejected === 0 && sensitivityFail === 0 ? 'CROSS-CHECK: PASS' : 'CROSS-CHECK: FAIL');
process.exit(rivalRejected === 0 && sensitivityFail === 0 ? 0 : 1);
