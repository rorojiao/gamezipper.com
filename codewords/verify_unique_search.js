#!/usr/bin/env node
'use strict';
/*
 * codewords — INDEPENDENT uniqueness solver (limit = 2, real backtracking search).
 *
 * Why this exists: codewords/verify.js proves uniqueness with *constraint
 * propagation only* (arc-consistency over the word list). Propagation can
 * reach a fixpoint with a single candidate per number and still miss a
 * second, search-only solution.
 *
 * This solver COUNTS solutions with a real backtracking search (limit 2) and
 * uses only: the grid, the dictionary, and the hints. It never reads
 * lv.s / lv.solution for the SEARCH — only to cross-check afterwards.
 *
 * Rules implemented (read from the engine, not from the level key names):
 *  - Each grid position holds a NUMBER; a number maps to exactly one LETTER.
 *  - assignLetter() deletes a letter from every OTHER number when it is
 *    assigned, so the number->letter map is a BIJECTION (verified: every
 *    shipped level's stored solution is injective).
 *  - Each row of numbers must spell a word present in the dictionary
 *    (codewords/wordlist.json).
 *  - Hints are PRE-ASSIGNED numbers and are immutable.
 *
 * CALIBRATION (Pitfall #88) — a fresh counter is unfalsifiable until it is
 * calibrated against a dataset a DIFFERENT implementation already settled:
 *  (a) SENSITIVITY: pin every number to the stored solution -> count == 1.
 *  (b) SENSITIVITY: strip the hints -> the count must go UP (never down).
 *  (c) NEGATIVE CONTROL: a deliberately ambiguous synthetic level must
 *      report >= 2.
 *
 * EXIT CODE: non-zero when any level is multi-solution / unsolvable /
 * timed-out, or when the stored solution is not a dictionary-valid answer,
 * or when any calibration fails.
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const levels = JSON.parse(fs.readFileSync(path.join(HERE, 'levels.json'), 'utf8'));
const WORDS = JSON.parse(fs.readFileSync(path.join(HERE, 'wordlist.json'), 'utf8'));
const WORDSET = new Set(WORDS);
const BY_LEN = new Map();
for (const w of WORDS) { if (!BY_LEN.has(w.length)) BY_LEN.set(w.length, []); BY_LEN.get(w.length).push(w); }
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

function countSolutions(grid, hints, limit, deadlineMs) {
  const rows = grid.map(r => r.map(String));            // number ids as strings
  const nums = [...new Set(rows.flat())].sort();
  if (!nums.length) return { count: 0, timedOut: false };
  const rowWordPool = rows.map(row => BY_LEN.get(row.length) || []);

  let count = 0, timedOut = false;
  const assign = new Map();

  // HINTS ARE PRE-ASSIGNED AND IMMUTABLE — seed them into the assignment.
  for (const [n, l] of Object.entries(hints || {})) {
    if (!nums.includes(String(n))) continue;
    assign.set(String(n), l);
  }
  const seen = new Set();
  for (const l of assign.values()) {
    if (seen.has(l)) return { count: 0, timedOut: false, conflict: true };
    seen.add(l);
  }

  function rowWords(idx) {
    const row = rows[idx]; const out = [];
    for (const w of rowWordPool[idx]) {
      let ok = true;
      for (let i = 0; i < row.length; i++) {
        const a = assign.get(row[i]);
        if (a !== undefined && w[i] !== a) { ok = false; break; }
      }
      if (ok) out.push(w);
    }
    return out;
  }
  function feasible() {
    for (let i = 0; i < rows.length; i++) if (!rowWords(i).length) return false;
    return true;
  }
  function leafValid() {
    for (let i = 0; i < rows.length; i++) {
      let word = '';
      for (const num of rows[i]) {
        const l = assign.get(num);
        if (l === undefined) return false;
        word += l;
      }
      if (!WORDSET.has(word)) return false;
    }
    return true;
  }

  function search() {
    if (timedOut || count >= limit) return;
    if (Date.now() > deadlineMs) { timedOut = true; return; }

    let best = null, bestSet = null;
    for (const num of nums) {
      if (assign.has(num)) continue;
      const s = new Set();
      for (let ri = 0; ri < rows.length; ri++) {
        const i = rows[ri].indexOf(num);
        if (i < 0) continue;
        for (const w of rowWords(ri)) s.add(w[i]);
      }
      if (!s.size) return;                 // dead end
      if (bestSet === null || s.size < bestSet.size) { best = num; bestSet = s; }
      if (s.size === 1) break;
    }
    if (best === null) {
      if (leafValid()) count++;
      return;
    }
    for (const letter of [...bestSet].sort()) {
      if (timedOut || count >= limit) break;
      let conflict = false;
      for (const [num, l] of assign) if (num !== best && l === letter) { conflict = true; break; }
      if (conflict) continue;
      assign.set(best, letter);
      if (feasible()) search();
      assign.delete(best);
    }
  }

  search();
  return { count, timedOut };
}

// ---------------- calibration ----------------
function calibrate() {
  let ok = true;
  // (c) NEGATIVE CONTROL: an ambiguous synthetic level must report >= 2
  const three = BY_LEN.get(3) || [];
  let neg = false;
  outer:
  for (const a of three) {
    for (const b of three) {
      if (a[1] === b[1] && a[2] === b[2] && a[0] !== b[0]) {
        const res = countSolutions([[1, 2, 3]], { 2: a[1], 3: a[2] }, 2, Date.now() + 5000);
        console.log(`  calib(negative): "${a}" vs "${b}" -> count=${res.count}`);
        if (res.count >= 2) neg = true;
        break outer;
      }
    }
  }
  if (!neg) { console.log('  calib(negative): FAILED — ambiguous level did not yield 2'); ok = false; }

  // (a)+(b) SENSITIVITY on a real level
  const lv = levels.levels[0];
  const withHints = countSolutions(lv.rows, lv.hints, 3, Date.now() + 60000);
  const noHints = countSolutions(lv.rows, {}, 3, Date.now() + 60000);
  const allPinned = countSolutions(lv.rows, lv.solution, 3, Date.now() + 60000);
  console.log(`  calib(sensitivity) L1: withHints=${withHints.count} noHints=${noHints.count} allPinned=${allPinned.count}`);
  if (allPinned.count !== 1) { console.log('  calib(sensitivity): FAILED — fully pinned level must have exactly 1 solution'); ok = false; }
  if (noHints.count < withHints.count) { console.log('  calib(sensitivity): FAILED — removing hints must not reduce the count'); ok = false; }
  return ok;
}

console.log('codewords independent uniqueness solver (limit=2, search — not propagation)');
const calibOk = calibrate();

const multi = [], unsolv = [], timeouts = [], badWords = [], badHints = [];
for (const lv of levels.levels) {
  const grid = lv.rows;
  const hints = lv.hints || {};
  for (let r = 0; r < grid.length; r++) {
    const w = grid[r].map(n => lv.solution[n]).join('');
    if (!WORDSET.has(w)) badWords.push(`L${lv.level} row${r} "${w}" not in dictionary`);
  }
  for (const [n, l] of Object.entries(hints)) {
    if (lv.solution[n] !== l) badHints.push(`L${lv.level} hint ${n}=${l} != solution ${lv.solution[n]}`);
  }
  const res = countSolutions(grid, hints, 2, Date.now() + 120000);
  if (res.timedOut) { timeouts.push(`L${lv.level}`); console.log(`  L${lv.level} TIMEOUT`); continue; }
  if (res.count === 0) { unsolv.push(`L${lv.level}`); }
  else if (res.count > 1) { multi.push(`L${lv.level}`); }
  console.log(`  L${lv.level} ${lv.tier}: solutions=${res.count}${res.count === 1 ? ' UNIQUE' : ''}`);
}

const out = {
  levels: levels.levels.length,
  calibrationPassed: calibOk,
  multiSolution: multi,
  unsolvable: unsolv,
  timeouts,
  badStoredWords: badWords,
  badHints,
  verdict: (multi.length + unsolv.length + timeouts.length + badWords.length + badHints.length) === 0 && calibOk ? 'PASS' : 'FAIL',
};
console.log(JSON.stringify(out));
process.exit(out.verdict === 'PASS' ? 0 : 1);
