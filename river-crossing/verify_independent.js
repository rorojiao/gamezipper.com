#!/usr/bin/env node
/* River Crossing independent verifier (Node.js, reads inline LEVELS from index.html).
 * Validates each level's recorded solution is correct and computes min-length solutions.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract LEVELS array from index.html
function extractLevels() {
  const m = HTML.match(/const LEVELS = (\[[\s\S]*?\]);\s*\n/);
  if (!m) throw new Error('LEVELS not found in index.html');
  return JSON.parse(m[1]);
}

function isValidAlone(bank, constraints) {
  if (bank.length <= 1) return true;
  for (const c of constraints) {
    if (c.every(p => bank.includes(p))) return false;
  }
  return true;
}

function verifySolution(lvl) {
  const pieces = lvl.pieces;
  const constraints = lvl.constraints;
  const cap = lvl.cap;
  let left = [...pieces];
  let side = 'L';
  for (let i = 0; i < lvl.moves.length; i++) {
    const [nextSide, carried] = lvl.moves[i];
    if (carried.length > cap) return { ok: false, reason: `move ${i+1}: cap ${cap} exceeded` };
    // Pieces carried must be on current side
    for (const c of carried) {
      const idx = (side === 'L' ? left : pieces.filter(p => !left.includes(p))).indexOf(c);
      if (idx === -1) return { ok: false, reason: `move ${i+1}: piece ${c} not on ${side} side` };
    }
    // Apply move
    if (side === 'L') {
      left = left.filter(p => !carried.includes(p));
    } else {
      for (const c of carried) {
        if (!left.includes(c)) left.push(c);
      }
    }
    side = nextSide;
    // Old side is alone
    const aloneBank = (side === 'R') ? left : pieces.filter(p => !left.includes(p));
    if (!isValidAlone(aloneBank, constraints)) {
      return { ok: false, reason: `move ${i+1}: alone bank invalid ${JSON.stringify(aloneBank)}` };
    }
  }
  if (left.length === 0) return { ok: true };
  return { ok: false, reason: `final state: ${left.length} pieces still on left` };
}

function bfsCount(pieces, constraints, cap, targetDist) {
  const start = { left: new Set(pieces), side: 'L' };
  const startKey = JSON.stringify([...start.left].sort()) + '|' + start.side;
  const visited = new Map();
  visited.set(startKey, 0);
  const frontier = [{ state: start, path: [] }];
  let goals = 0;
  while (frontier.length > 0 && goals < 10) {
    const { state, path } = frontier.shift();
    const dist = path.length;
    if (dist >= targetDist) continue;
    const bank = state.side === 'L' ? [...state.left] : pieces.filter(p => !state.left.has(p));
    for (let r = 0; r <= Math.min(cap, bank.length); r++) {
      const combs = combinations(bank, r);
      for (const carried of combs) {
        const carriedSet = new Set(carried);
        let newLeft = new Set(state.left);
        if (state.side === 'L') {
          for (const c of carriedSet) newLeft.delete(c);
        } else {
          for (const c of carriedSet) newLeft.add(c);
        }
        const newSide = state.side === 'L' ? 'R' : 'L';
        const aloneBank = (newSide === 'R') ? [...newLeft] : pieces.filter(p => !newLeft.has(p));
        if (!isValidAlone(aloneBank, constraints)) continue;
        const newKey = JSON.stringify([...newLeft].sort()) + '|' + newSide;
        const newDist = dist + 1;
        if (visited.has(newKey) && visited.get(newKey) <= newDist) continue;
        visited.set(newKey, newDist);
        const newPath = [...path, [newSide, carried]];
        if (newLeft.size === 0) {
          if (newDist === targetDist) goals++;
        } else {
          frontier.push({ state: { left: newLeft, side: newSide }, path: newPath });
        }
      }
    }
  }
  return goals;
}

function* combinations(arr, k) {
  if (k === 0) { yield []; return; }
  if (k > arr.length) return;
  for (let i = 0; i <= arr.length - k; i++) {
    for (const tail of combinations(arr.slice(i + 1), k - 1)) {
      yield [arr[i], ...tail];
    }
  }
}

const levels = extractLevels();
let pass = 0, fail = 0;
console.log(`Verifying ${levels.length} levels...`);
for (const lvl of levels) {
  const result = verifySolution(lvl);
  if (result.ok) {
    pass++;
    const goals = bfsCount(lvl.pieces, lvl.constraints, lvl.cap, lvl.n_moves);
    if (goals === 0) {
      fail++;
      console.log(`  ✗ L${lvl.id} (${lvl.tier}): recorded solution is valid but BFS finds 0 at min-dist ${lvl.n_moves}`);
    }
  } else {
    fail++;
    console.log(`  ✗ L${lvl.id} (${lvl.tier}): ${result.reason}`);
  }
}
console.log(`\n${pass}/${pass + fail} levels verified (recorded solution is valid + BFS confirms reachability)`);
if (fail > 0) process.exit(1);
