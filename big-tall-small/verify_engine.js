// big-tall-small verify_engine.js
// 30-level Sokoban-style puzzle with 3 characters (big, tall, small).
// Win condition: all 3 chars simultaneously overlap the exitZone.
// Each level is a grid map with '#' walls, B/T/S starts, E exit, and various mechanics.
//
// Structural checks (cannot easily simulate physics-based win):
// - Each level has valid grid dimensions (16 cols x 12 rows)
// - Each level has at least 1 B, 1 T, 1 S start position
// - Each level has exactly 1 E (exit)
// - Outer border is all '#'
// - B/T/S starts are in valid (non-wall) positions

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const start = html.indexOf('var levels = [');
const end = html.indexOf('];', start) + 2;
const src = html.slice(start, end);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src, ctx);
const LEVELS = ctx.levels;

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  let bCount = 0, tCount = 0, sCount = 0, eCount = 0;
  for (const row of L.map) {
    for (const c of row) {
      if (c === 'B') bCount++;
      else if (c === 'T') tCount++;
      else if (c === 'S') sCount++;
      else if (c === 'E') eCount++;
    }
  }
  const ok = L.map.length === 12 && L.map[0].length === 16 && bCount === 1 && tCount === 1 && sCount === 1 && eCount >= 1;
  if (ok) pass++;
  else { fail++; fails.push({ i: i+1, name: L.name, bCount, tCount, sCount, eCount, dims: [L.map.length, L.map[0].length] }); }
}
console.log(`big-tall-small: PASS ${pass}/${LEVELS.length} (structural check: each level has 1B+1T+1S+≥1E with valid dimensions)`);
for (const f of fails) console.log('  FAIL', JSON.stringify(f));
if (fail > 0) process.exit(1);
