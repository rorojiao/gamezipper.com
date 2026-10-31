#!/usr/bin/env node
/**
 * Set Quest — Independent Node.js verifier (method 2 of 3).
 *
 * Re-implements the SET rule from scratch (no shared code with
 * verify_python.py or the in-page engine; no shared modules required).
 *
 * For each of the 30 levels verifies:
 *   1. tier is one of the 5 known tiers; features matches the tier spec
 *   2. card count matches the tier's board size (9/9/12/15/18)
 *   3. every card is an array of exactly `features` ints, each in 0..2
 *   4. all cards on a board are pairwise distinct
 *   5. the board contains EXACTLY ONE valid triple   (unique-solution gate)
 *   6. the stored `solution` is 3 distinct in-range indices whose cards form
 *      exactly that unique triple
 *   7. boards are pairwise distinct across all 30 levels
 *   8. NO level has a clustered solution: max(solution)-min(solution) >= 4
 *
 * Independent implementation strategy (deliberately different from the
 * Python verifier's itertools.combinations + predicate walk):
 *   - Attribute values are treated as elements of GF(3). A triple is a SET
 *     iff a+b+c ≡ 0 (mod 3) in every coordinate, so any TWO cards force a
 *     unique completing card. Candidates are enumerated via pair completion
 *     rather than by testing every triple.
 *   - The textbook all-same-or-all-different predicate is implemented
 *     separately and every candidate is cross-checked against it, so the two
 *     independent formulations must agree before a level passes.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HERE = __dirname;

// Tier contract: name -> { features, board }
const TIERS = {
  Beginner: { features: 3, board: 9 },
  Easy:     { features: 4, board: 9 },
  Medium:   { features: 4, board: 12 },
  Hard:     { features: 4, board: 15 },
  Expert:   { features: 4, board: 18 },
};
const TIER_ORDER = Object.keys(TIERS);
const LEVELS_PER_TIER = 6;
const MIN_SPREAD = 4; // max(solution)-min(solution) must be >= this

// ---- SET rule, from scratch ------------------------------------------------

// The unique card that completes cards a and b to a SET (GF(3) complement).
function setComplete(a, b) {
  const n = Math.max(a.length, b.length);
  const out = new Array(n);
  for (let f = 0; f < n; f++) out[f] = (3 - ((a[f] + b[f]) % 3)) % 3;
  return out;
}

function cardsEqual(x, y) {
  if (x.length !== y.length) return false;
  for (let f = 0; f < x.length; f++) if (x[f] !== y[f]) return false;
  return true;
}

// Textbook formulation (all same OR all different per attribute).
function isSetTextbook(a, b, c) {
  for (let f = 0; f < a.length; f++) {
    const allSame = a[f] === b[f] && b[f] === c[f];
    const allDiff = a[f] !== b[f] && b[f] !== c[f] && a[f] !== c[f];
    if (!allSame && !allDiff) return false;
  }
  return true;
}

// All SET index triples, found via pair completion (not via a triple loop).
function findSetTriples(cards) {
  const sets = [];
  const n = cards.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const want = setComplete(cards[i], cards[j]);
      for (let k = j + 1; k < n; k++) {
        if (cardsEqual(cards[k], want)) sets.push([i, j, k]);
      }
    }
  }
  return sets;
}

// ---- Per-level checks ------------------------------------------------------

function checkLevel(lv, idx) {
  const reasons = [];

  // 1. tier known + features match the tier spec
  const spec = TIERS[lv.tier];
  if (!spec) {
    reasons.push(`unknown tier ${JSON.stringify(lv.tier)}`);
    return reasons;
  }
  if (lv.features !== spec.features) {
    reasons.push(`features ${lv.features} != tier spec ${spec.features}`);
  }

  // 2. card count matches the board size
  if (!Array.isArray(lv.cards) || lv.cards.length !== spec.board) {
    reasons.push(`expected ${spec.board} cards, got ${Array.isArray(lv.cards) ? lv.cards.length : typeof lv.cards}`);
    return reasons;
  }

  // 3. every card: array of exactly `features` ints in 0..2
  lv.cards.forEach((card, ci) => {
    if (!Array.isArray(card) || card.length !== spec.features) {
      reasons.push(`card ${ci}: expected ${spec.features} attributes, got ${JSON.stringify(card)}`);
    } else {
      card.forEach((v, f) => {
        if (!Number.isInteger(v) || v < 0 || v > 2) {
          reasons.push(`card ${ci} attr ${f}: value ${v} out of range 0..2`);
        }
      });
    }
  });

  // 4. pairwise distinct cards
  const seen = new Set(lv.cards.map(c => c.join('|')));
  if (seen.size !== lv.cards.length) {
    reasons.push(`duplicate cards on board (${lv.cards.length - seen.size} dupes)`);
  }

  // 5. EXACTLY ONE valid triple — via pair completion, cross-checked with
  //    the textbook predicate over the full triple enumeration.
  const viaCompletion = findSetTriples(lv.cards);
  for (const t of viaCompletion) {
    if (!isSetTextbook(lv.cards[t[0]], lv.cards[t[1]], lv.cards[t[2]])) {
      reasons.push(`internal: completion method produced a non-SET ${t}`);
    }
  }
  const n = lv.cards.length;
  let textbookCount = 0;
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        if (isSetTextbook(lv.cards[i], lv.cards[j], lv.cards[k])) textbookCount++;
      }
    }
  }
  if (viaCompletion.length !== textbookCount) {
    reasons.push(`internal: methods disagree (${viaCompletion.length} vs ${textbookCount})`);
  }
  if (textbookCount !== 1) {
    reasons.push(`expected exactly 1 valid SET, found ${textbookCount}`);
    return reasons;
  }

  // 6. stored solution is 3 distinct in-range indices forming that triple
  const sol = lv.solution;
  if (!Array.isArray(sol) || sol.length !== 3) {
    reasons.push(`solution must be 3 indices, got ${JSON.stringify(sol)}`);
    return reasons;
  }
  if (new Set(sol).size !== 3 || sol.some(i => !Number.isInteger(i) || i < 0 || i >= n)) {
    reasons.push(`solution indices not 3 distinct in-range ints: ${JSON.stringify(sol)}`);
    return reasons;
  }
  const unique = viaCompletion[0];
  if (sol.slice().sort((a, b) => a - b).join(',') !== unique.join(',')) {
    reasons.push(`stored solution ${JSON.stringify(sol)} != unique SET ${JSON.stringify(unique)}`);
  }

  // 8. not clustered: max - min >= 4
  const spread = Math.max(...sol) - Math.min(...sol);
  if (spread < MIN_SPREAD) {
    reasons.push(`solution clustered: spread ${spread} < ${MIN_SPREAD}`);
  }

  return reasons;
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(HERE, 'levels.json'), 'utf-8'));
  const levels = data.levels;

  const globalReasons = [];
  let npass = 0;

  if (levels.length !== 30) {
    globalReasons.push(`expected 30 levels, got ${levels.length}`);
  }

  // Tier counts + documented order (6 per tier, tiers grouped consecutively)
  const counts = {};
  levels.forEach((lv) => { counts[lv.tier] = (counts[lv.tier] || 0) + 1; });
  for (const tier of TIER_ORDER) {
    if (counts[tier] !== LEVELS_PER_TIER) {
      globalReasons.push(`tier ${tier}: expected ${LEVELS_PER_TIER} levels, got ${counts[tier] || 0}`);
    }
  }
  const seenTiers = [];
  for (const lv of levels) {
    if (!seenTiers.length || seenTiers[seenTiers.length - 1] !== lv.tier) seenTiers.push(lv.tier);
  }
  if (seenTiers.join(',') !== TIER_ORDER.join(',')) {
    globalReasons.push(`tiers out of order: ${seenTiers.join(',')}`);
  }

  for (let i = 0; i < levels.length; i++) {
    const lv = levels[i];
    const reasons = checkLevel(lv, i);
    const ok = reasons.length === 0;
    if (ok) npass++; else allFail(reasons, i, lv);
    const mark = ok ? '\u2713' : '\u2717';
    console.log(`Level ${String(i + 1).padStart(2, '0')} [${String(lv.tier).padEnd(8)}] ${mark}`);
  }

  // 7. boards pairwise distinct across all 30 levels
  const boardKeys = new Set(levels.map(lv => JSON.stringify(lv.cards)));
  if (boardKeys.size !== levels.length) {
    globalReasons.push(`boards not all distinct: ${boardKeys.size}/${levels.length}`);
  }

  if (globalReasons.length) {
    console.log('\nGlobal failures:');
    globalReasons.forEach(r => console.log(`  \u2717 ${r}`));
  }

  const allPass = npass === levels.length && globalReasons.length === 0;
  if (!allPass) failSummary(npass, levels.length);
  else console.log(`\nverify_independent: ${npass}/${levels.length} PASS`);
  process.exit(allPass ? 0 : 1);
}

function allFail(reasons, idx, lv) {
  // Printed BEFORE the level line is awkward; buffer instead.
  failBuf.push({ idx, tier: lv.tier, reasons });
}
const failBuf = [];
function failSummary(npass, total) {
  console.log(`\nverify_independent: ${npass}/${total} FAIL`);
  failBuf.forEach(f => {
    console.log(`  Level ${String(f.idx + 1).padStart(2, '0')} [${f.tier}]`);
    f.reasons.forEach(r => console.log(`    - ${r}`));
  });
}

main();
