#!/usr/bin/env node
/**
 * Block Fit - Independent Node.js verifier.
 *
 * Solves each level with a backtracking algorithm (independent from in-engine)
 * and asserts exactly 1 valid solution.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TETROMINOES = {
  I: [[0,0],[1,0],[2,0],[3,0]],
  O: [[0,0],[0,1],[1,0],[1,1]],
  T: [[0,0],[0,1],[0,2],[1,1]],
  L: [[0,0],[1,0],[2,0],[2,1]],
  S: [[0,1],[0,2],[1,0],[1,1]],
};

function normalize(piece) {
  let minR = Infinity, minC = Infinity;
  for (const [r, c] of piece) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  return piece.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function rotateCW(piece) {
  return piece.map(([r, c]) => [-c, r]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function reflect(piece) {
  return piece.map(([r, c]) => [r, -c]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function allOrientations(name) {
  const base = TETROMINOES[name];
  const seen = new Set();
  const out = [];
  let cur = base;
  for (let i = 0; i < 4; i++) {
    const normed = normalize(cur);
    const norm = JSON.stringify(normed);
    if (!seen.has(norm)) { seen.add(norm); out.push(normed); }
    cur = rotateCW(cur);
  }
  cur = reflect(base);
  for (let i = 0; i < 4; i++) {
    const normed = normalize(cur);
    const norm = JSON.stringify(normed);
    if (!seen.has(norm)) { seen.add(norm); out.push(normed); }
    cur = rotateCW(cur);
  }
  return out;
}

function countSolutions(outline, pieces, cap=2) {
  const placements = {};
  const outlineSet = new Set(outline.map(([r,c]) => r*1000+c));
  for (const name of pieces) {
    placements[name] = [];
    for (const orient of allOrientations(name)) {
      for (const [ar, ac] of outline) {
        const placed = [];
        let ok = true;
        for (const [dr, dc] of orient) {
          const cell = (ar+dr)*1000 + (ac+dc);
          if (!outlineSet.has(cell)) { ok = false; break; }
          placed.push(cell);
        }
        if (ok) placements[name].push(placed);
      }
    }
  }
  const used = new Set();
  let count = 0;
  function backtrack(idx) {
    if (count >= cap+1) return;
    if (idx === pieces.length) { count++; return; }
    const name = pieces[idx];
    for (const placed of placements[name]) {
      let overlap = false;
      for (const c of placed) { if (used.has(c)) { overlap = true; break; } }
      if (overlap) continue;
      for (const c of placed) used.add(c);
      backtrack(idx+1);
      for (const c of placed) used.delete(c);
      if (count >= cap+1) return;
    }
  }
  backtrack(0);
  return count;
}

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = data.levels;

console.log(`Verifying ${levels.length} levels (independent solver)...\n`);

let passed = 0;
for (let i = 0; i < levels.length; i++) {
  const level = levels[i];
  const outline = level.outline;
  const solCount = countSolutions(outline, level.pieces);
  if (solCount === 1) {
    passed++;
  } else {
    console.log(`  [FAIL] level ${i+1}: ${solCount} solutions`);
  }
}

console.log(`\n${passed}/${levels.length} levels passed (each with exactly 1 solution)`);
process.exit(passed === levels.length ? 0 : 1);
