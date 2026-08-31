#!/usr/bin/env node
/**
 * Pentomino Fill - Independent Node.js verifier.
 *
 * Re-implements the solver from scratch (no shared code with Python).
 * For each level, confirms outline + specified pieces yields exactly 1 valid
 * placement.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PENTOMINOES = {
  F: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 0]],
  I: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  L: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
  N: [[0, 1], [1, 1], [2, 1], [3, 0], [3, 1]],
  P: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  T: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
  U: [[0, 0], [0, 1], [1, 0], [2, 0], [2, 1]],
  V: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  W: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  X: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  Y: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 1]],
  Z: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
};

function normalize(piece) {
  let minR = Infinity, minC = Infinity;
  for (const [r, c] of piece) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  const out = [];
  for (const [r, c] of piece) out.push([r - minR, c - minC]);
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return JSON.stringify(out);
}

function rotateCW(piece) {
  return piece.map(([r, c]) => [-c, r]);
}

function reflect(piece) {
  return piece.map(([r, c]) => [r, -c]);
}

function allOrientations(name) {
  const base = PENTOMINOES[name];
  const seen = new Set();
  const orientations = [];
  let cur = base;
  for (let i = 0; i < 4; i++) {
    const normed = normalize(cur);
    if (!seen.has(normed)) {
      seen.add(normed);
      orientations.push(JSON.parse(normed));
    }
    cur = rotateCW(cur);
  }
  cur = reflect(base);
  for (let i = 0; i < 4; i++) {
    const normed = normalize(cur);
    if (!seen.has(normed)) {
      seen.add(normed);
      orientations.push(JSON.parse(normed));
    }
    cur = rotateCW(cur);
  }
  return orientations;
}

function countUniqueSolutions(outlineSet, pieces, cap = 2) {
  const placements = {};
  for (const name of pieces) {
    const orientList = allOrientations(name);
    const placementsForName = [];
    for (const orient of orientList) {
      for (const cellStr of outlineSet) {
        const [ar, ac] = cellStr.split(',').map(Number);
        const placed = [];
        let ok = true;
        for (const [dr, dc] of orient) {
          const cell = `${ar + dr},${ac + dc}`;
          if (!outlineSet.has(cell)) {
            ok = false;
            break;
          }
          placed.push(cell);
        }
        if (ok) {
          const key = placed.slice().sort().join('|');
          placementsForName.push({ key, placed });
        }
      }
    }
    // Dedupe
    const seen = new Set();
    const unique = [];
    for (const p of placementsForName) {
      if (!seen.has(p.key)) {
        seen.add(p.key);
        unique.push(p);
      }
    }
    placements[name] = unique;
  }

  const solutions = [];

  function backtrack(idx, usedSet, current) {
    if (solutions.length >= cap) return;
    if (idx === pieces.length) {
      solutions.push(current.slice().sort().join('|'));
      return;
    }
    const name = pieces[idx];
    for (const { placed } of placements[name]) {
      let conflict = false;
      for (const cell of placed) {
        if (usedSet.has(cell)) { conflict = true; break; }
      }
      if (conflict) continue;
      const newUsed = new Set(usedSet);
      for (const cell of placed) newUsed.add(cell);
      current.push(name + ':' + placed.slice().sort().join(','));
      backtrack(idx + 1, newUsed, current);
      current.pop();
    }
  }

  backtrack(0, new Set(), []);
  return solutions.length;
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf-8'));
  const levels = data.levels;

  let allPass = true;
  for (let i = 0; i < levels.length; i++) {
    const lv = levels[i];
    const rows = lv.rows;
    const cols = lv.cols;
    const pieces = lv.pieces;

    // Build outline set
    const outlineSet = new Set();
    for (let r = 0; r < rows; r++) {
      const row = lv.outline[r];
      for (let c = 0; c < cols; c++) {
        if (row[c] === '#') outlineSet.add(`${r},${c}`);
      }
    }

    const nSols = countUniqueSolutions(outlineSet, pieces, 2);
    const ok = nSols === 1;
    if (!ok) allPass = false;
    const mark = ok ? '\u2713' : '\u2717';
    console.log(`Level ${String(i + 1).padStart(2)} [${lv.tier.padEnd(8)}] ${mark} (${nSols} solutions)`);
  }

  console.log(`\n${allPass ? 'PASS' : 'FAIL'}: ${levels.length} levels (independent Node.js solver)`);
  process.exit(allPass ? 0 : 1);
}

main();
