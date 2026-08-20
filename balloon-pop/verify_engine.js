// balloon-pop verify_engine.js
// Rule: each dart flies along a straight line with gravity. It pops every balloon it
// touches. Player must pop `target` normal balloons (g=gold, n=normal, s=star, b=bomb).
// Bombs reset combo but don't subtract from popped count.
//
// Solvability invariant: target ≤ count(normal) + count(gold) — because gold balloons
// ALSO count toward popped (only bombs don't count).
// Stars give +5 points but don't count toward popped.
// Movement and wind make aim harder but don't change solvability (player can wait).

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/(?:const|var|let)\s+LEVELS\s*=\s*(\[[\s\S]*?\])\s*;/);
if (!m) { console.error('FAIL: cannot extract LEVELS'); process.exit(1); }
const LEVELS = eval('(' + m[1] + ')');

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const counts = { n: 0, g: 0, s: 0, b: 0 };
  for (const row of lv.map) for (const c of row) if (counts[c] !== undefined) counts[c]++;
  const poppable = counts.n + counts.g;  // gold counts toward popped too
  const ok = lv.target <= poppable && lv.darts >= 1 && lv.map.length === 5 && lv.map[0].length === 5;
  if (ok) pass++;
  else { fail++; fails.push({ i: i+1, ...counts, target: lv.target, darts: lv.darts }); }
}
console.log(`balloon-pop: PASS ${pass}/${LEVELS.length}`);
for (const f of fails) console.log('  FAIL', JSON.stringify(f));
if (fail > 0) process.exit(1);
