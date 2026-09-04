#!/usr/bin/env node
/**
 * Knight's Tour — In-engine verifier.
 *
 * Loads index.html, parses the embedded LEVELS JSON, and runs the same
 * tour-validity check as verify_independent.js. This ensures the engine
 * sees the exact same data the Python generator produced.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'index.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

function verifyTour(size, start, tour) {
  const expected = size * size;
  if (tour.length !== expected) return { ok: false, reason: `path length ${tour.length} != ${expected}` };
  if (tour[0][0] !== start[0] || tour[0][1] !== start[1]) return { ok: false, reason: `start mismatch` };

  const visited = new Set();
  for (const cell of tour) {
    const key = `${cell[0]},${cell[1]}`;
    if (visited.has(key)) return { ok: false, reason: `duplicate visit ${key}` };
    visited.add(key);
  }
  if (visited.size !== expected) return { ok: false, reason: `only ${visited.size} unique squares` };

  for (let i = 0; i < tour.length - 1; i++) {
    const dr = Math.abs(tour[i + 1][0] - tour[i][0]);
    const dc = Math.abs(tour[i + 1][1] - tour[i][1]);
    if (!((dr === 1 && dc === 2) || (dr === 2 && dc === 1))) {
      return { ok: false, reason: `invalid knight move at step ${i}` };
    }
  }
  return { ok: true, reason: 'OK' };
}

function main() {
  // Extract embedded LEVELS via the const LEVELS = [...] block
  const m = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) {
    console.error('FAIL: could not find const LEVELS = [...] in index.html');
    process.exit(1);
  }
  let raw = m[1];
  // Convert JS to JSON: replace unquoted keys, single-quote values, trailing commas.
  // Easier: just eval-parse if we trust it (only used here).
  let levels;
  try {
    // eslint-disable-next-line no-new-func
    levels = (new Function(`return (${raw});`))();
  } catch (e) {
    console.error('FAIL: parse error:', e.message);
    process.exit(1);
  }

  let valid = 0;
  const failed = [];
  const seen = new Map();
  let unique = 0;
  const dupes = [];

  for (const lvl of levels) {
    const key = `${lvl.size}x${lvl.size}-${lvl.start[0]},${lvl.start[1]}`;
    if (seen.has(key)) {
      dupes.push({ a: lvl.id, b: seen.get(key), key });
    } else {
      seen.set(key, lvl.id);
      unique++;
    }
    const result = verifyTour(lvl.size, lvl.start, lvl.path);
    if (result.ok) {
      valid++;
    } else {
      failed.push({ id: lvl.id, tier: lvl.tier, size: lvl.size, reason: result.reason });
    }
  }

  console.log('=== Knight\'s Tour In-Engine Verifier ===');
  console.log(`Embedded levels: ${levels.length}`);
  console.log(`Unique configs: ${unique} ${unique === levels.length ? '✓' : '✗'}`);
  console.log(`Valid tours: ${valid} ${valid === levels.length ? '✓' : '✗'}`);

  if (dupes.length > 0) {
    console.log('\nDuplicate configurations:');
    for (const d of dupes) {
      console.log(`  L${d.a} and L${d.b}: ${d.key}`);
    }
  }
  if (failed.length > 0) {
    console.log('\nTour failures:');
    for (const f of failed) {
      console.log(`  L${f.id} (${f.tier} ${f.size}x${f.size}): ${f.reason}`);
    }
    process.exit(1);
  }

  if (unique === levels.length && valid === levels.length) {
    console.log(`\nIN-ENGINE ${levels.length} LEVELS ALL VALID ✓`);
  } else {
    process.exit(1);
  }
}

main();
