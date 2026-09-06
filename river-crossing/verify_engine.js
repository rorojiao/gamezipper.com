#!/usr/bin/env node
/* River Crossing in-engine verifier.
 * Loads index.html, extracts the embedded LEVELS array, and runs the same
 * state-machine simulation as verify_independent.js. This is the "in-engine"
 * pass — the JS engine that ships in the browser sees exactly this data.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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
  let left = new Set(pieces);
  let side = 'L';
  for (let i = 0; i < lvl.moves.length; i++) {
    const [nextSide, carried] = lvl.moves[i];
    if (carried.length > cap) return { ok: false, reason: `move ${i+1}: cap ${cap} exceeded` };
    // Pieces carried must be on current side
    const bank = side === 'L' ? [...left] : pieces.filter(p => !left.has(p));
    for (const c of carried) {
      if (!bank.includes(c)) return { ok: false, reason: `move ${i+1}: piece ${c} not on ${side} side` };
    }
    // Apply move
    if (side === 'L') {
      for (const c of carried) left.delete(c);
    } else {
      for (const c of carried) left.add(c);
    }
    side = nextSide;
    // Old side is alone
    const aloneBank = side === 'R' ? [...left] : pieces.filter(p => !left.has(p));
    if (!isValidAlone(aloneBank, constraints)) {
      return { ok: false, reason: `move ${i+1}: alone bank invalid ${JSON.stringify(aloneBank)}` };
    }
  }
  if (left.size === 0) return { ok: true };
  return { ok: false, reason: `final state: ${left.size} pieces still on left` };
}

function main() {
  const m = HTML.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);\s*\n/);
  if (!m) {
    console.error('FAIL: could not find const LEVELS in index.html');
    process.exit(1);
  }
  let levels;
  try {
    levels = JSON.parse(m[1]);
  } catch (e) {
    console.error('FAIL: LEVELS is not valid JSON:', e.message);
    process.exit(1);
  }
  let pass = 0, fail = 0;
  for (const lvl of levels) {
    const result = verifySolution(lvl);
    if (result.ok) {
      pass++;
    } else {
      fail++;
      console.log(`  ✗ L${lvl.id} (${lvl.tier}): ${result.reason}`);
    }
  }
  console.log(`${pass}/${pass + fail} levels verified via in-engine JS engine`);
  if (fail > 0) process.exit(1);
}

main();
