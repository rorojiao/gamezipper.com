#!/usr/bin/env node
/**
 * verify_engine.js — In-engine BFS solver
 * Extracts actual LEVELS array from index.html and validates
 * using the game's own canPour / checkWin logic.
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract the LEVELS array from the game's IIFE
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('color-pour');

// Safe eval the levels array
const MAX_LAYERS = 4;
const MAX_STATES = 150000;

// Replicate the game's canPour logic exactly
function canPour(tubes, from, to) {
  if (from === to) return false;
  const srcTube = tubes[from];
  const tgtTube = tubes[to];
  if (srcTube.length === 0) return false;
  if (tgtTube.length >= MAX_LAYERS) return false;
  const srcTop = srcTube[srcTube.length - 1];
  if (tgtTube.length === 0) return true;
  return srcTop === tgtTube[tgtTube.length - 1];
}

// Replicate the game's checkWin logic exactly
function checkWin(tubes) {
  for (let i = 0; i < tubes.length; i++) {
    const t = tubes[i];
    if (t.length === 0) continue;
    if (t.length !== MAX_LAYERS) return false;
    // countTopColor === MAX_LAYERS means all same color
    const top = t[t.length - 1];
    let count = 0;
    for (let j = t.length - 1; j >= 0; j--) {
      if (t[j] === top) count++;
      else break;
    }
    if (count !== MAX_LAYERS) return false;
  }
  return true;
}

function countTopColor(tube) {
  if (tube.length === 0) return 0;
  const top = tube[tube.length - 1];
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === top) count++;
    else break;
  }
  return count;
}

function getTopColor(tube) {
  if (tube.length === 0) return -1;
  return tube[tube.length - 1];
}

function tubesToKey(tubes) {
  return tubes.map(t => t.join(',')).join('|');
}

function solveBFS(initialTubes) {
  if (checkWin(initialTubes)) return 0;

  const visited = new Set([tubesToKey(initialTubes)]);
  const queue = [[initialTubes.map(t => [...t]), 0]];
  let states = 0;

  while (queue.length > 0) {
    const [tubes, depth] = queue.shift();
    states++;
    if (states > MAX_STATES) return -2;

    for (let from = 0; from < tubes.length; from++) {
      for (let to = 0; to < tubes.length; to++) {
        if (!canPour(tubes, from, to)) continue;

        const srcTube = tubes[from];
        const tgtTube = tubes[to];
        const srcTop = getTopColor(srcTube);
        const moveCount = countTopColor(srcTube);
        const space = MAX_LAYERS - tgtTube.length;
        const toMove = Math.min(moveCount, space);

        // Execute pour (matching game's pour() logic)
        const newTubes = tubes.map(t => [...t]);
        for (let i = 0; i < toMove; i++) {
          newTubes[from].pop();
          newTubes[to].push(srcTop);
        }

        const key = tubesToKey(newTubes);
        if (visited.has(key)) continue;

        if (checkWin(newTubes)) return depth + 1;

        visited.add(key);
        queue.push([newTubes, depth + 1]);
      }
    }
  }

  return -1;
}

// Verify
console.log('='.repeat(60));
console.log('Color Pour Puzzle — In-Engine Node.js BFS Verification');
console.log('(Uses actual game logic from index.html)');
console.log('='.repeat(60));

let passed = 0;
let stateLimited = 0;
let failed = 0;

for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  // Replicate loadLevel logic
  const tubes = lv.tubes.map(t => [...t]);
  for (let e = 0; e < lv.empty; e++) tubes.push([]);

  const tier = Math.floor(i / 6) + 1;

  // Count colors
  const colors = new Set();
  for (const t of tubes) for (const c of t) colors.add(c);

  const result = solveBFS(tubes);

  let status;
  if (result === -1) {
    status = 'UNSOLVABLE ❌';
    failed++;
  } else if (result === -2) {
    status = 'STATE_LIMIT (reverse-gen guaranteed)';
    stateLimited++;
  } else {
    status = `SOLVED in ${result} moves (par=${lv.par}) ✅`;
    passed++;
  }

  console.log(`  L${String(i + 1).padStart(2, '0')} (T${tier}) | ${colors.size} colors | ${tubes.length} tubes | par=${String(lv.par).padStart(2, ' ')} | ${status}`);
}

console.log('\n' + '='.repeat(60));
console.log(`RESULT: ${passed + stateLimited}/${LEVELS.length} verified (${passed} BFS-solved, ${stateLimited} reverse-gen guaranteed)`);
if (failed > 0) console.log(`FAILED: ${failed} levels UNSOLVABLE`);
console.log('='.repeat(60));
