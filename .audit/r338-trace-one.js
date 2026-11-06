#!/usr/bin/env node
/**
 * R338 — trace ONE level end-to-end to find out whether the "propagation
 * contradiction" is a bug in MY propagator or a defect in the shipped data.
 *
 * A valid clue system (one whose stored solution satisfies every clue) must
 * never produce a contradiction under sound propagation. If it does, one of
 * the two is wrong and the difference is the whole verdict.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'sym-a-pix', 'levels.json'), 'utf8'));
const name = process.argv[2] || 'Ring';
const lvl = S.levels.find(l => l.name === name) || S.levels[3];
const n = lvl.n;

console.log('level', lvl.name, n + 'x' + n);
console.log('solution:');
for (let r = 0; r < n; r++) console.log('   ', lvl.solution[r].map(v => v ? '#' : '.').join(''));
console.log('clues:');
for (let r = 0; r < n; r++) console.log('   ', lvl.clues[r].map(v => String(v)).join(' '));

function nbrIdx(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < n && nc >= 0 && nc < n) out.push([nr, nc]);
  }
  return out;
}

// recompute the true clue of every cell from the solution
console.log('\ntrue clue (from solution) vs shipped clue:');
let mismatch = 0;
for (let r = 0; r < n; r++) {
  let row = [];
  for (let c = 0; c < n; c++) {
    let cnt = 0;
    for (const [nr, nc] of nbrIdx(r, c)) cnt += lvl.solution[nr][nc];
    row.push(cnt);
    if (cnt !== lvl.clues[r][c]) { mismatch++; console.log(`   MISMATCH (${r},${c}) shipped=${lvl.clues[r][c]} true=${cnt}`); }
  }
  console.log('   ', row.map(v => String(v)).join(' '));
}
console.log('mismatches:', mismatch);

// step-by-step propagation trace
const state = Array.from({ length: n }, () => new Array(n).fill(-1));
let trace = [];
let iter = 0;
let contra = null;
outer:
while (true) {
  iter++;
  if (iter > 50) { contra = { type: 'no-progress' }; break; }
  let changed = false;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = lvl.clues[r][c];
      let s = 0; const unk = [];
      for (const [nr, nc] of nbrIdx(r, c)) {
        if (state[nr][nc] === 1) s++;
        else if (state[nr][nc] === -1) unk.push([nr, nc]);
      }
      if (s > v) { contra = { type: 'over', r, c, v, s, state: state.map(x => x.join('')) }; break outer; }
      if (s + unk.length < v) { contra = { type: 'short', r, c, v, s, unk: unk.length, state: state.map(x => x.join('')) }; break outer; }
      if (!unk.length) continue;
      if (s === v) {
        for (const [nr, nc] of unk) { if (state[nr][nc] === -1) { state[nr][nc] = 0; changed = true; trace.push(`iter${iter}: clue(${r},${c})=${v} s=${s} -> (${nr},${nc})=EMPTY`); } }
      } else if (s + unk.length === v) {
        for (const [nr, nc] of unk) { if (state[nr][nc] === -1) { state[nr][nc] = 1; changed = true; trace.push(`iter${iter}: clue(${r},${c})=${v} s=${s} unk=${unk.length} -> (${nr},${nc})=FILLED`); } }
      }
    }
  }
  if (!changed) break;
}
console.log('\ntrace (' + trace.length + ' steps):');
trace.slice(0, 40).forEach(t => console.log('   ', t));
console.log('\nfinal state:');
for (let r = 0; r < n; r++) console.log('   ', state[r].map(v => v === 1 ? '#' : v === 0 ? '.' : '?').join(''));
console.log('contradiction:', JSON.stringify(contra));
