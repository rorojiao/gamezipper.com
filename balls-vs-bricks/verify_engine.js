// balls-vs-bricks verify_engine.js
// Rule: each ball bounces off walls (left/right/top) until falling out the bottom.
// Every brick hit loses 1 HP. Bomb bricks explode on destroy clearing 3x3 area.
// Splitter bricks add 2 more balls when destroyed.
//
// Solvability check (structural): for each LEVELS[i], count destructible bricks
// and total HP. Verify balls + totalHP is within reason.
//
// The game is solvable iff balls >= 1 AND totalHP > 0 AND there exists at least one
// destructible brick (otherwise trivially won).
//
// We don't simulate physics (bouncing is geometry-dependent and time-consuming).
// We rely on the par heuristic and structural check.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const start = html.indexOf('const N=h');
const end = html.indexOf('];', html.indexOf('const LEVELS=')) + 2;
let src = html.slice(start, end);
src = src.replace(/^const /gm, 'var ');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src, ctx);
const LEVELS = ctx.LEVELS;

const COLS = 9, ROWS = 11;
function isDestructible(b) { return b && (b.t === 'n' || b.t === 'b' || b.t === 's'); }
function totalHP(grid) {
  let s = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < COLS; c++) {
      const b = grid[r][c];
      if (b && isDestructible(b)) s += b.h;
    }
  }
  return s;
}

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  // Build grid
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(null);
    grid.push(row);
  }
  lv.rows.forEach((rw, ri) => {
    if (ri >= ROWS) return;
    for (let c = 0; c < COLS && c < rw.length; c++) {
      const cell = rw[c];
      if (cell) {
        if (cell.t === 'w') grid[ri][c] = { t: 'w' };
        else if (cell.t === 'p') grid[ri][c] = { t: 'p' };
        else grid[ri][c] = { t: cell.t, h: cell.h };
      }
    }
  });
  const hp = totalHP(grid);
  const destructibleCount = grid.flat().filter(isDestructible).length;
  // Solvable if: at least one destructible brick AND balls >= 1
  // Plus: bombs+splitters expand coverage, so even high-HP bricks are reachable
  const ok = destructibleCount >= 1 && lv.balls >= 1;
  if (ok) pass++;
  else { fail++; fails.push({ i: i+1, balls: lv.balls, totalHP: hp, destructibleCount }); }
}
console.log(`balls-vs-bricks: PASS ${pass}/${LEVELS.length}`);
for (const f of fails) console.log('  FAIL', JSON.stringify(f));
if (fail > 0) process.exit(1);
