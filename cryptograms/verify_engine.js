#!/usr/bin/env node
// Cryptograms verifier — sweep 56
// Validates: PUZZLES array parse cleanly, every puzzle has id/quote/author/category,
// unique IDs, alphabetic content (cipher-able text).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const idxPath = path.join(__dirname, 'index.html');
const src = fs.readFileSync(idxPath, 'utf8');

const m = src.match(/const PUZZLES = (\[[\s\S]*?\]);/);
if (!m) { console.error('FAIL: PUZZLES array not found'); process.exit(1); }

// Balanced-bracket extraction
let body = m[1];
body = body.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

let PUZZLES;
try { PUZZLES = vm.runInNewContext('(' + body + ')', {}); }
catch (e) { console.error('FAIL: PUZZLES parse error:', e.message); process.exit(1); }

const report = {
  puzzles_count: PUZZLES.length,
  unique_ids: 0,
  with_quote: 0,
  with_author: 0,
  with_category: 0,
  with_difficulty: 0,
  alphabetic_quote: 0,
  id_dups: [],
  malformed: [],
};

const idSet = new Map();
for (let i = 0; i < PUZZLES.length; i++) {
  const P = PUZZLES[i];
  if (!P || typeof P !== 'object') { report.malformed.push(i); continue; }
  if (P.id !== undefined) {
    if (idSet.has(P.id)) report.id_dups.push(P.id);
    else { idSet.set(P.id, true); report.unique_ids++; }
  }
  if (typeof P.quote === 'string' && P.quote.length > 0) {
    report.with_quote++;
    if (/^[A-Za-z .,!?'"()\-:;0-9]+$/.test(P.quote)) report.alphabetic_quote++;
  }
  if (typeof P.author === 'string' && P.author.length > 0) report.with_author++;
  if (typeof P.category === 'string' && P.category.length > 0) report.with_category++;
  if (typeof P.difficulty === 'string') report.with_difficulty++;
}

console.log(JSON.stringify(report, null, 2));
const ok = report.puzzles_count > 0 &&
           report.unique_ids === report.puzzles_count &&
           report.with_quote === report.puzzles_count &&
           report.with_author === report.puzzles_count &&
           report.with_category === report.puzzles_count &&
           report.alphabetic_quote === report.puzzles_count &&
           report.malformed.length === 0;
console.log('VERDICT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
