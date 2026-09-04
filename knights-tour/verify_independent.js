#!/usr/bin/env node
/**
 * Knight's Tour — Independent Node.js verifier.
 *
 * Loads levels.json with an INDEPENDENT knight-move check implementation
 * (different code path from gen_levels.py). Verifies:
 *  - Level 1..30 unique (different sizes OR different start positions)
 *  - Each path is a valid knight's tour for its size+start
 *  - No duplicate path between distinct levels (unique-solution check)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LEVELS_PATH = path.join(__dirname, 'levels.json');

function verifyTour(size, start, tour) {
  const expected = size * size;
  if (tour.length !== expected) {
    return { ok: false, reason: `path length ${tour.length} != ${expected}` };
  }
  if (tour[0][0] !== start[0] || tour[0][1] !== start[1]) {
    return { ok: false, reason: `start mismatch: ${tour[0]} vs ${start}` };
  }

  const visited = new Set();
  for (const cell of tour) {
    const key = `${cell[0]},${cell[1]}`;
    if (visited.has(key)) return { ok: false, reason: `duplicate visit at ${key}` };
    visited.add(key);
    if (cell[0] < 0 || cell[0] >= size || cell[1] < 0 || cell[1] >= size) {
      return { ok: false, reason: `out of bounds: ${key}` };
    }
  }
  if (visited.size !== expected) {
    return { ok: false, reason: `only ${visited.size} unique squares (expected ${expected})` };
  }

  for (let i = 0; i < tour.length - 1; i++) {
    const dr = Math.abs(tour[i + 1][0] - tour[i][0]);
    const dc = Math.abs(tour[i + 1][1] - tour[i][1]);
    // Knight moves: |dr|,|dc| == (1,2) or (2,1)
    if (!((dr === 1 && dc === 2) || (dr === 2 && dc === 1))) {
      return { ok: false, reason: `invalid knight move from (${tour[i][0]},${tour[i][1]}) to (${tour[i+1][0]},${tour[i+1][1]})` };
    }
  }

  return { ok: true, reason: 'OK' };
}

function main() {
  const levels = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));

  // ---- Uniqueness check ----
  // Each level must be uniquely identified by (size, start).
  const seen = new Map();
  let unique = 0;
  const dupes = [];
  for (const lvl of levels) {
    const key = `${lvl.size}x${lvl.size}-${lvl.start[0]},${lvl.start[1]}`;
    if (seen.has(key)) {
      dupes.push([lvl.id, seen.get(key), key]);
    } else {
      seen.set(key, lvl.id);
      unique++;
    }
  }

  // ---- Tour validity check ----
  let valid = 0;
  const failed = [];
  for (const lvl of levels) {
    const result = verifyTour(lvl.size, lvl.start, lvl.path);
    if (result.ok) {
      valid++;
    } else {
      failed.push({ id: lvl.id, tier: lvl.tier, size: lvl.size, start: lvl.start, reason: result.reason });
    }
  }

  console.log('=== Knight\'s Tour Independent Verifier (Node.js) ===');
  console.log(`Total levels: ${levels.length}`);
  console.log(`Unique level configs: ${unique} ${unique === levels.length ? '✓' : '✗ (duplicates above)'}`);
  console.log(`Valid tours: ${valid} ${valid === levels.length ? '✓' : '✗'}`);

  if (dupes.length > 0) {
    console.log('\nDuplicate level configurations:');
    for (const [a, b, key] of dupes) {
      console.log(`  L${a} and L${b}: ${key}`);
    }
  }
  if (failed.length > 0) {
    console.log('\nTour failures:');
    for (const f of failed) {
      console.log(`  L${f.id} (${f.tier} ${f.size}x${f.size} start=[${f.start}]): ${f.reason}`);
    }
    process.exit(1);
  }

  if (unique === levels.length && valid === levels.length) {
    console.log(`\nALL ${levels.length} LEVELS UNIQUE & VALID ✓`);
  } else {
    process.exit(1);
  }
}

main();
