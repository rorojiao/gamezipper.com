#!/usr/bin/env node
'use strict';
// Independent Codewords verifier — checks all levels for validity + uniqueness
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const WORDS = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'wordlist.json'), 'utf8')));

let allPass = true;
let totalLevels = data.levels.length;

for (const lv of data.levels) {
  const issues = [];

  // 1. Check grid dimensions
  if (lv.rows.length !== lv.numRows) issues.push(`row count ${lv.rows.length} != ${lv.numRows}`);
  for (const row of lv.rows) {
    if (row.length !== lv.wordLen) issues.push(`word length mismatch`);
  }

  // 2. Check all words are valid
  for (let r = 0; r < lv.rows.length; r++) {
    const word = lv.rows[r].map(n => lv.solution[n]).join('');
    if (!WORDS.has(word)) issues.push(`invalid word: "${word}"`);
  }

  // 3. Check hints are correct
  for (const [num, letter] of Object.entries(lv.hints)) {
    if (lv.solution[num] !== letter) issues.push(`hint ${num}=${letter} but solution=${lv.solution[num]}`);
  }

  // 4. Check number-letter consistency (same number always maps to same letter)
  const numCheck = {};
  for (const row of lv.rows) {
    for (const n of row) {
      const expected = lv.solution[n];
      if (numCheck[n] && numCheck[n] !== expected) issues.push(`number ${n} maps to multiple letters`);
      numCheck[n] = expected;
    }
  }

  // 5. Check uniqueness via independent solver
  // (Simple constraint propagation, different implementation from gen.js)
  const ALPHA2 = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const possible = {};
  const allNums = Object.keys(lv.solution).map(Number);
  for (const n of allNums) {
    possible[n] = lv.hints[n] ? new Set([lv.hints[n]]) : new Set(ALPHA2);
  }

  let changed = true, iter = 0;
  while (changed && iter++ < 40) {
    changed = false;
    for (const row of lv.rows) {
      // Find words matching current constraints
      const len = row.length;
      let candidates = [];
      // Build candidates from WORDS set
      for (const w of WORDS) {
        if (w.length !== len) continue;
        let ok = true;
        for (let i = 0; i < len; i++) {
          if (!possible[row[i]].has(w[i])) { ok = false; break; }
        }
        if (ok) candidates.push(w);
      }
      if (candidates.length === 0) { issues.push('no matching words during solve'); break; }
      // Restrict
      for (let i = 0; i < len; i++) {
        const n = row[i];
        const valid = new Set(candidates.map(w => w[i]));
        for (const l of [...possible[n]]) {
          if (!valid.has(l)) { possible[n].delete(l); changed = true; }
        }
      }
    }
  }

  let solved = true;
  for (const n of allNums) {
    if (possible[n].size !== 1) { solved = false; break; }
    // Verify the solved letter matches solution
    if (possible[n].size === 1) {
      const letter = [...possible[n]][0];
      if (letter !== lv.solution[n]) issues.push(`solver found ${n}=${letter} but solution=${lv.solution[n]}`);
    }
  }
  if (!solved) issues.push('not uniquely solvable by propagation');

  const status = issues.length === 0 ? 'PASS' : 'FAIL';
  if (issues.length > 0) allPass = false;
  console.log(`L${lv.level} ${lv.tier}: ${status}${issues.length ? ' — ' + issues.join('; ') : ''}`);
}

console.log(`\n${allPass ? 'ALL PASS' : 'SOME FAILED'} — ${totalLevels} levels verified`);
process.exit(allPass ? 0 : 1);
