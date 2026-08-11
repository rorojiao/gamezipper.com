// pocket-sort per-game verifier — sweep 57 (2026-08-11)
//
// 30 LEVELS each: {c:colors, pc:perColor, ex:extras, par:parMoves, sp:specials[]}
// Tests every level: structural fields valid, c in range, specials recognized.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const m = html.match(/var LEVELS = \[([\s\S]*?)\n\];/);
if (!m) { console.error('FAIL: no LEVELS'); process.exit(2); }

let LEVELS;
try {
  LEVELS = (new Function('return [' + m[1] + ']'))();
} catch(e) { console.error('FAIL: eval error:', e.message); process.exit(2); }

const validSpecials = new Set(['frost', 'hide', 'link', 'star', 'combo']);

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  if (!L || typeof L !== 'object') { fail++; fails.push({i, issue: 'not an object'}); continue; }
  if (typeof L.c !== 'number' || L.c < 2 || L.c > 12) { fail++; fails.push({i, issue: 'c out of range', c: L.c}); continue; }
  if (typeof L.pc !== 'number' || L.pc < 1 || L.pc > 8) { fail++; fails.push({i, issue: 'pc out of range', pc: L.pc}); continue; }
  if (typeof L.ex !== 'number' || L.ex < 0 || L.ex > 6) { fail++; fails.push({i, issue: 'ex out of range', ex: L.ex}); continue; }
  if (typeof L.par !== 'number' || L.par < 1) { fail++; fails.push({i, issue: 'par invalid', par: L.par}); continue; }
  if (!Array.isArray(L.sp)) { fail++; fails.push({i, issue: 'sp not array'}); continue; }
  let bad = false;
  for (const s of L.sp) {
    if (!validSpecials.has(s)) { fail++; fails.push({i, issue: 'unknown special: '+s}); bad = true; break; }
  }
  if (bad) continue;
  // Sanity: total columns = c + 2*ex; balls per color = pc. Each main color gets 1 column of capacity pc.
  // Extras are 2*ex, used as auxiliary space. If pc > column-cap, level may be unsolvable.
  pass++;
}
console.log(`Total: ${LEVELS.length}, PASS: ${pass}, FAIL: ${fail}`);
if (fails.length) console.log('Fails:', JSON.stringify(fails.slice(0, 3)));
process.exit(fail === 0 ? 0 : 1);
