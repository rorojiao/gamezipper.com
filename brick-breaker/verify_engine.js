// brick-breaker per-game verifier — sweep 57 (2026-08-11)
//
// 50 LEVELS each call genLevel(arr) to populate global bricks[].
// Tests every level: bricks[] non-empty, all bricks within reachable playfield.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const m = html.match(/const LEVELS=\[([\s\S]*?)\n\];/);
if (!m) { console.error('FAIL: no LEVELS found'); process.exit(2); }

// Game constants
const COLS = 8;
const BRICK_W = 50, BRICK_H = 20, BRICK_PAD = 4, BRICK_TOP = 50;

let bricks;
function genLevel(arr) {
  bricks = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 0) continue;
    const col = i % COLS, row = Math.floor(i / COLS);
    bricks.push({x:col*(BRICK_W+BRICK_PAD)+BRICK_PAD/2+2, y:row*(BRICK_H+BRICK_PAD)+BRICK_TOP, w:BRICK_W, h:BRICK_H, hp:arr[i], maxHp:arr[i]});
  }
}

let LEVELS;
try {
  // The lazy-eval array `()=>genLevel([...])` — must call each fn
  LEVELS = (new Function('genLevel', 'return [' + m[1] + ']'))(genLevel);
} catch(e) { console.error('FAIL: eval error:', e.message); process.exit(2); }

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  try {
    LEVELS[i]();
    if (!bricks || bricks.length === 0) {
      fail++; fails.push({i, issue: 'no bricks'}); continue;
    }
    const maxX = Math.max(...bricks.map(b => b.x + b.w));
    const maxY = Math.max(...bricks.map(b => b.y + b.h));
    if (maxX > 500) { fail++; fails.push({i, issue: 'brick x>500', maxX}); continue; }
    if (maxY > 200) { fail++; fails.push({i, issue: 'brick y>200', maxY}); continue; }
    pass++;
  } catch(e) { fail++; fails.push({i, issue: 'exception: '+e.message}); }
}
console.log(`Total: ${LEVELS.length}, PASS: ${pass}, FAIL: ${fail}`);
if (fails.length) console.log('Fails:', JSON.stringify(fails.slice(0, 3)));
process.exit(fail === 0 ? 0 : 1);
