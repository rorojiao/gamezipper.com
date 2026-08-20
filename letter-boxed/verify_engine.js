#!/usr/bin/env node
/* GENERATED in-engine verifier for letter-boxed — pattern follows catch-the-cat/verify_engine.js.
 * 30 word-chain puzzles. Rule: each word uses only puzzle letters; consecutive letters
 * must come from DIFFERENT sides; each word is a real English word; chain first-letter
 * = previous-word last-letter; solution set covers ALL puzzle letters.
 * Usage: node letter-boxed/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');

// Extract PUZZLES (balanced bracket)
const start = html.indexOf('const PUZZLES = [');
let depth = 0, end = -1, inStr = false, strCh = '';
for (let i = start + 'const PUZZLES = '.length; i < html.length; i++) {
  const c = html[i];
  if (inStr) { if (c === strCh && html[i-1] !== '\\') inStr = false; continue; }
  if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
  if (c === '[' || c === '{') depth++;
  else if (c === ']' || c === '}') { depth--; if (c === ']' && depth === 0) { end = i + 1; break; } }
}
const code = html.slice(start + 'const PUZZLES = '.length, end);
const PUZZLES = vm.runInNewContext('(' + code.match(/^(\[[\s\S]*\]);?\s*$/)[1] + ')', {}, {timeout: 5000});

// Extract dictionary
const dm = html.match(/const DICT_STR = "([\s\S]*?)";/);
const DICT = new Set(dm[1].split(/\s+/));

function sideOfLetter(p, letter) {
  for (let s = 0; s < 4; s++) if (p.sides[s].includes(letter)) return s;
  return -1;
}

let pass = 0, fail = 0, failDetails = [];
for (let i = 0; i < PUZZLES.length; i++) {
  const p = PUZZLES[i];
  const allLetters = new Set();
  p.sides.forEach(s => s.forEach(l => allLetters.add(l.toUpperCase())));
  
  let solsValid = true, bad = null;
  for (const w of p.solutions) {
    if (w.length < 3) { solsValid = false; bad = w; break; }
    if (!DICT.has(w.toLowerCase())) { solsValid = false; bad = w + '(not in dict)'; break; }
    let prevSide = -1;
    for (const ch of w) {
      const uch = ch.toUpperCase();
      if (!allLetters.has(uch)) { solsValid = false; bad = w + '(' + uch + ' not on sides)'; break; }
      const s = sideOfLetter(p, uch);
      if (s === prevSide) { solsValid = false; bad = w + '(consec same side)'; break; }
      prevSide = s;
    }
    if (!solsValid) break;
  }
  
  const used = new Set();
  for (const w of p.solutions) for (const ch of w) used.add(ch.toUpperCase());
  const coversAll = [...allLetters].every(l => used.has(l));
  
  let consecValid = true;
  for (let j = 1; j < p.solutions.length; j++) {
    const prevLast = p.solutions[j-1].slice(-1).toUpperCase();
    const currFirst = p.solutions[j][0].toUpperCase();
    if (prevLast !== currFirst) { consecValid = false; break; }
  }
  
  if (solsValid && coversAll && consecValid) pass++;
  else {
    fail++;
    failDetails.push({i: i+1, sols: p.solutions, solsValid, coversAll, consecValid, bad});
  }
}

if (failDetails.length > 0) {
  for (const d of failDetails) {
    console.log('FAIL L' + d.i + ': ' + d.sols.join(',') + ' solsValid=' + d.solsValid + ' coversAll=' + d.coversAll + ' consecValid=' + d.consecValid + ' bad=' + d.bad);
  }
}
console.log(`letter-boxed in-engine verification: ${pass}/${PUZZLES.length} levels, verdict=${fail===0?'PASS':'FAIL '+fail}`);
process.exit(fail === 0 ? 0 : 1);