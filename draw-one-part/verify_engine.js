// draw-one-part per-game verifier — sweep 57 (2026-08-11)
//
// 30 LEVELS each: {prompt, icon, scene SVG, complete SVG, target:{x,y,r}, tier, hint?}
// Tests every level: all required fields present, target within 400x400 canvas.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const m = html.match(/const LEVELS = \[([\s\S]*?)\n\];/);
if (!m) { console.error('FAIL: no LEVELS'); process.exit(2); }

let LEVELS;
try {
  LEVELS = (new Function('return [' + m[1] + ']'))();
} catch(e) { console.error('FAIL: eval error:', e.message); process.exit(2); }

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  if (!L || typeof L !== 'object') { fail++; fails.push({i, issue: 'not object'}); continue; }
  if (typeof L.prompt !== 'string' || L.prompt.length < 5) { fail++; fails.push({i, issue: 'no prompt'}); continue; }
  if (typeof L.scene !== 'string' || L.scene.length < 10) { fail++; fails.push({i, issue: 'no scene'}); continue; }
  if (typeof L.complete !== 'string' || L.complete.length < 5) { fail++; fails.push({i, issue: 'no complete'}); continue; }
  if (!L.target || typeof L.target.x !== 'number' || typeof L.target.y !== 'number' || typeof L.target.r !== 'number') {
    fail++; fails.push({i, issue: 'no/invalid target'}); continue;
  }
  if (L.target.x < 0 || L.target.x > 400 || L.target.y < 0 || L.target.y > 400) {
    fail++; fails.push({i, issue: 'target out of canvas', target: L.target}); continue;
  }
  if (L.target.r < 5 || L.target.r > 200) {
    fail++; fails.push({i, issue: 'target r out of range', r: L.target.r}); continue;
  }
  pass++;
}
console.log(`Total: ${LEVELS.length}, PASS: ${pass}, FAIL: ${fail}`);
if (fails.length) console.log('Fails:', JSON.stringify(fails.slice(0, 3)));
process.exit(fail === 0 ? 0 : 1);
