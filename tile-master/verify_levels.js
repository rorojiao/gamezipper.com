#!/usr/bin/env node
/**
 * verify_levels.js — Phase 6 level verification for Tile Master
 * Extracts LEVELS from index.html and validates:
 *   1. total tiles % 3 === 0
 *   2. unique types count
 *   3. visible tiles at start >= 30%
 *   4. Greedy solve simulation confirms solvability
 */
"use strict";
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract the LEVELS array
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('tile-master');
try {
  LEVELS = JSON.parse(m[1]);
} catch (e) {
  console.error('FAIL: LEVELS JSON parse error:', e.message);
  process.exit(1);
}

console.log('Extracted ' + LEVELS.length + ' levels\n');

let solvableCount = 0;
let structureOk = 0;

for (const lv of LEVELS) {
  const id = lv.id;
  const tiles = lv.tiles;
  const total = tiles.length;
  let problems = [];

  // 1. total % 3 === 0
  if (total % 3 !== 0) problems.push('total ' + total + ' not divisible by 3');
  // Total declared matches actual
  if (lv.total !== total) problems.push('declared total ' + lv.total + ' != actual ' + total);

  // 2. unique types
  const typesSet = new Set();
  tiles.forEach(t => typesSet.add(t.t));
  const uniqueTypes = typesSet.size;
  if (uniqueTypes !== lv.emojis.length) problems.push('unique types ' + uniqueTypes + ' != emojis.length ' + lv.emojis.length);
  // Each type count must be multiple of 3
  const typeCounts = {};
  tiles.forEach(t => { typeCounts[t.t] = (typeCounts[t.t]||0) + 1; });
  for (const [ty, c] of Object.entries(typeCounts)) {
    if (c % 3 !== 0) problems.push('type ' + ty + ' count ' + c + ' not multiple of 3');
  }

  // 3. visible tiles at start >= 30%
  const stacks = {};
  tiles.forEach(t => {
    const key = t.r + ',' + t.c;
    if (!stacks[key] || t.l > stacks[key]) stacks[key] = t.l;
  });
  let visible = 0;
  tiles.forEach(t => {
    if (t.l === stacks[t.r + ',' + t.c]) visible++;
  });
  const visRatio = visible / total;
  if (visRatio < 0.30) problems.push('visible ratio ' + visRatio.toFixed(2) + ' < 0.30');

  if (problems.length === 0) {
    structureOk++;
  } else {
    console.log('L' + id + ' STRUCTURE FAIL: ' + problems.join('; '));
  }

  // 4. Greedy solve simulation
  const solvable = simulateSolve(lv);
  if (solvable) {
    solvableCount++;
  } else {
    console.log('L' + id + ' NOT SOLVABLE by greedy sim');
  }
  process.stdout.write('.');
}

console.log('\n');
console.log('Structure OK: ' + structureOk + '/' + LEVELS.length);
console.log('Solvable:     ' + solvableCount + '/' + LEVELS.length);

if (structureOk === LEVELS.length && solvableCount === LEVELS.length) {
  console.log('\n*** ' + solvableCount + '/' + LEVELS.length + ' levels SOLVABLE ***');
  process.exit(0);
} else {
  console.log('\n*** VERIFICATION FAILED ***');
  process.exit(1);
}

/**
 * Simulate a solve. Strategy: at each step, prefer tapping a visible tile
 * whose type already has >= 1 in tray (greedy match). If tray has a type
 * with 2 already, tap a visible one of that type. Fallback: tap any visible.
 * Try multiple seeds / shuffles to confirm solvability.
 */
function simulateSolve(lv) {
  // Try up to 5 different greedy orders
  for (let attempt = 0; attempt < 5; attempt++) {
    if (trySolve(lv, attempt)) return true;
  }
  return false;
}

function trySolve(lv, seed) {
  // Clone tiles
  let tiles = lv.tiles.map((t, i) => ({ id:i, type:t.t, r:t.r, c:t.c, l:t.l, cleared:false }));
  let tray = []; // [{type, tileId}]

  function isCovered(t) {
    if (t.cleared) return true;
    for (const o of tiles) {
      if (o.id !== t.id && !o.cleared && o.r === t.r && o.c === t.c && o.l > t.l) return true;
    }
    return false;
  }

  let steps = 0;
  const maxSteps = tiles.length * 4 + 50;

  while (tiles.some(t => !t.cleared)) {
    if (steps++ > maxSteps) return false;
    // Auto-clear triples in tray
    const counts = {};
    tray.forEach(it => { counts[it.type] = (counts[it.type]||0) + 1; });
    let cleared = false;
    for (const ty in counts) {
      if (counts[ty] >= 3) {
        let removed = 0;
        for (let i = tray.length - 1; i >= 0 && removed < 3; i--) {
          if (tray[i].type === parseInt(ty)) { tray.splice(i, 1); removed++; }
        }
        cleared = true;
        break;
      }
    }
    if (cleared) continue;
    if (tray.length >= 7) return false; // tray full, fail

    // Pick a tile: prefer one whose type has >= 2 in tray (completes triple)
    const visible = tiles.filter(t => !t.cleared && !isCovered(t));
    if (visible.length === 0) return false;

    const trayCounts = {};
    tray.forEach(it => { trayCounts[it.type] = (trayCounts[it.type]||0) + 1; });

    let pick = null;
    // Priority 1: type with 2 in tray
    for (const t of visible) {
      if ((trayCounts[t.type]||0) >= 2) { pick = t; break; }
    }
    // Priority 2: type with 1 in tray
    if (!pick) {
      for (const t of visible) {
        if ((trayCounts[t.type]||0) >= 1) { pick = t; break; }
      }
    }
    // Priority 3: type with most copies visible on board (more likely to complete)
    if (!pick) {
      const visCounts = {};
      visible.forEach(t => { visCounts[t.type] = (visCounts[t.type]||0) + 1; });
      let best = -1;
      // Add a bit of seed-based variety
      const offset = seed * 7;
      visible.forEach((t, idx) => {
        const score = visCounts[t.type] * 10 + ((idx + offset) % 3);
        if (score > best) { best = score; pick = t; }
      });
    }
    if (!pick) return false;
    pick.cleared = true;
    tray.push({ type: pick.type, tileId: pick.id });
  }
  return true; // all cleared
}
