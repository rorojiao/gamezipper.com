// Patch hotaru-beam/index.html LEVELS: keep L1 (verified solvable), replace
// L2..L30 with validated regenerated levels from _regen.json; emit _solutions.json
'use strict';
const fs = require('fs');
const src = fs.readFileSync('hotaru-beam/index.html', 'utf8');
const regen = JSON.parse(fs.readFileSync('hotaru-beam/_regen.json', 'utf8'));
const start = src.indexOf('var LEVELS=[');
const end = src.indexOf('];', start) + 2;
const block = src.slice(start, end);
// L1 block = from 'var LEVELS=[' through the first ']},\n' after the header comment
const firstLevelEnd = block.indexOf(']},') + 3;
const header = block.slice(0, firstLevelEnd); // var LEVELS=[ ... {id:1,...]},
const lines = [];
lines.push('  // P0 fix 2026-08-25: levels 2-30 as shipped were UNSOLVABLE under the engine\'s');
lines.push('  // own checkSolved semantics (e.g. L2: the num-0 down-circle forced the full');
lines.push('  // right-hand column, colliding with the num-1 up-circle whose single-bend');
lines.push('  // continuation reaches no circle — a forced contradiction; L3-L7 confirmed');
lines.push('  // by exhaustive clean-model search). Regenerated solution-first: each level');
lines.push('  // is built from a constructed valid path/cycle, dirs/nums derived FROM that');
lines.push('  // solution, and validated against a faithful port of checkSolved. Original');
lines.push('  // tier / grid size / circle count / numbered density preserved per level.');
for (let id = 2; id <= 30; id++) {
  const g = regen[String(id)];
  if (!g) throw new Error('missing regen for L' + id);
  const lv = g.lv;
  const cs = lv.circles.map(c => `{r:${c.r},c:${c.c},dir:'${c.dir}',num:${c.num}}`);
  lines.push(`  {id:${lv.id},tier:${lv.tier},gridR:${lv.gridR},gridC:${lv.gridC},circles:[`);
  for (let i = 0; i < cs.length; i += 2) {
    const pair = cs.slice(i, i + 2).join(',');
    lines.push('    ' + pair + (i + 2 < cs.length ? ',' : ''));
  }
  lines.push('  ]},');
}
const newBlock = header + '\n' + lines.join('\n') + '\n];';
fs.writeFileSync('hotaru-beam/index.html', src.slice(0, start) + newBlock + src.slice(end));
// solutions for all 30: L1 = 3x3 perimeter (validated), 2-30 from regen
const sols = {};
{
  const edges = [];
  for (let c = 0; c < 3; c++) { edges.push(`0,${c}-0,${c + 1}`); edges.push(`3,${c}-3,${c + 1}`); }
  for (let r = 0; r < 3; r++) { edges.push(`${r},0-${r + 1},0`); edges.push(`${r},3-${r + 1},3`); }
  sols[1] = edges;
}
for (let id = 2; id <= 30; id++) sols[id] = regen[String(id)].edges;
fs.writeFileSync('hotaru-beam/_solutions.json', JSON.stringify(sols));
console.log('patched LEVELS (L1 kept, 2-30 replaced); solutions for ' + Object.keys(sols).length + ' levels written');
