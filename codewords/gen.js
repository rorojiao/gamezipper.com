#!/usr/bin/env node
'use strict';
// Codewords Generator v3 — optimized with position-letter index + greedy hints
const fs = require('fs');
const path = require('path');

const WORDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'wordlist.json'), 'utf8'));

// ── Build position-letter index ────────────────────────────
// idx[len][pos][letter] = Set of word indices matching that pos=letter
const byLen = {};
const idx = {};
for (let wi = 0; wi < WORDS.length; wi++) {
  const w = WORDS[wi];
  const l = w.length;
  if (!byLen[l]) { byLen[l] = []; idx[l] = {}; }
  const widx = byLen[l].length;
  byLen[l].push(w);
  if (!idx[l][0]) for (let p = 0; p < l; p++) idx[l][p] = {};
  for (let p = 0; p < l; p++) {
    const c = w[p];
    if (!idx[l][p][c]) idx[l][p][c] = new Set();
    idx[l][p][c].add(widx);
  }
}
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

// ── PRNG ───────────────────────────────────────────────────
function mulberry32(s) {
  return function() { s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
}
function shuffle(a, r) { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

// ── Propagation solver using position-letter index ──────────
// Returns: null = contradiction, object = {solved: bool, possible: Map}
function propagate(rows, hintMap, allNums) {
  const possible = {};
  for (const n of allNums) possible[n] = hintMap[n] ? new Set([hintMap[n]]) : new Set(ALPHA);

  let changed = true, iter = 0;
  while (changed && iter++ < 30) {
    changed = false;
    for (const nums of rows) {
      const len = nums.length;
      if (!idx[len]) return null;

      // Find matching word indices via set intersection
      let matching = null;
      for (let i = 0; i < len; i++) {
        if (possible[nums[i]].size === 1) {
          const letter = [...possible[nums[i]]][0];
          const set = idx[len][i][letter];
          if (!set) return null;
          if (matching) { // intersect
            const next = new Set();
            for (const w of matching) if (set.has(w)) next.add(w);
            matching = next;
          } else matching = new Set(set);
          if (matching.size === 0) return null;
        }
      }

      // Collect valid letters at each position
      if (matching) {
        const validAtPos = [];
        for (let i = 0; i < len; i++) validAtPos[i] = new Set();
        for (const wi of matching) {
          const word = byLen[len][wi];
          for (let i = 0; i < len; i++) validAtPos[i].add(word[i]);
        }
        for (let i = 0; i < len; i++) {
          const n = nums[i];
          for (const letter of [...possible[n]]) {
            if (!validAtPos[i].has(letter)) {
              possible[n].delete(letter);
              changed = true;
              if (possible[n].size === 0) return null;
            }
          }
        }
      }
    }
  }

  let solved = true;
  for (const n of allNums) if (possible[n].size !== 1) { solved = false; break; }
  return { solved, possible };
}

// ── Greedy hint selection ──────────────────────────────────
// Start with target hints, add more if needed for uniqueness
function findMinimalHints(rows, solution, allNums, targetHints, rng) {
  // Sort numbers by letter frequency (reveal common letters first for better deduction)
  const shuffled = shuffle(allNums, rng);

  // Try with exactly targetHints first
  for (let extra = 0; extra <= 5; extra++) {
    const numHints = targetHints + extra;
    const hintNums = shuffled.slice(0, numHints);
    const hintMap = {};
    for (const n of hintNums) hintMap[n] = solution[n];

    const result = propagate(rows, hintMap, allNums);
    if (result && result.solved) return hintMap;
  }
  return null;
}

// ── Generate puzzle ────────────────────────────────────────
function generatePuzzle(numRows, wordLen, numHints, seed) {
  const rng = mulberry32(seed);
  const candidates = byLen[wordLen] || [];
  if (candidates.length < numRows * 2) return null;

  for (let attempt = 0; attempt < 80; attempt++) {
    const pool = shuffle(candidates, rng);
    const chosen = [];
    const usedLetters = new Set();
    for (const w of pool) {
      if (chosen.length >= numRows) break;
      const wl = new Set(w.split(''));
      if (chosen.length < 2 || [...wl].some(l => usedLetters.has(l))) {
        chosen.push(w); wl.forEach(l => usedLetters.add(l));
      }
    }
    if (chosen.length < numRows) continue;

    // Assign shuffled numbers to letters
    const letterList = [...usedLetters].sort();
    const numbers = shuffle(letterList.map((_, i) => i + 1), rng);
    const l2n = {}, n2l = {};
    for (let i = 0; i < letterList.length; i++) { l2n[letterList[i]] = numbers[i]; n2l[numbers[i]] = letterList[i]; }

    const rows = chosen.map(w => w.split('').map(l => l2n[l]));
    const allNums = Object.keys(n2l).map(Number);
    const uniqueCount = letterList.length;
    if (uniqueCount < 8 || uniqueCount > 22) continue;

    const hints = findMinimalHints(rows, n2l, allNums, numHints, rng);
    if (hints) {
      return { rows, words: chosen, solution: n2l, hints, uniqueLetters: uniqueCount };
    }
  }
  return null;
}

// ── Generate 27 levels ─────────────────────────────────────
const TIERS = [
  { name: 'Beginner', rows: 4, wordLen: 4, hints: 2, count: 4, baseSeed: 1000 },
  { name: 'Easy',     rows: 5, wordLen: 5, hints: 2, count: 4, baseSeed: 2000 },
  { name: 'Medium',   rows: 6, wordLen: 5, hints: 3, count: 5, baseSeed: 3000 },
  { name: 'Hard',     rows: 6, wordLen: 6, hints: 3, count: 5, baseSeed: 4000 },
  { name: 'Expert',   rows: 7, wordLen: 6, hints: 3, count: 5, baseSeed: 5000 },
  { name: 'Master',   rows: 7, wordLen: 7, hints: 4, count: 4, baseSeed: 6000 },
];

console.log('Generating Codewords levels...\n');
const levels = [];
let levelIdx = 0, failed = 0;

for (const tier of TIERS) {
  for (let i = 0; i < tier.count; i++) {
    levelIdx++;
    const seed = tier.baseSeed + i * 17 + levelIdx * 31;
    let puzzle = null;
    for (let s = seed; s < seed + 200 && !puzzle; s++) puzzle = generatePuzzle(tier.rows, tier.wordLen, tier.hints, s);
    if (puzzle) {
      levels.push({
        level: levelIdx, tier: tier.name, wordLen: tier.wordLen, numRows: tier.rows,
        rows: puzzle.rows, words: puzzle.words, solution: puzzle.solution,
        hints: puzzle.hints, uniqueLetters: puzzle.uniqueLetters,
      });
      console.log(`  L${levelIdx} ${tier.name}: [${puzzle.words.join(', ')}] ${puzzle.uniqueLetters}L ${Object.keys(puzzle.hints).length}h`);
    } else { console.error(`  L${levelIdx} ${tier.name}: FAILED!`); failed++; }
  }
}

fs.writeFileSync(path.join(__dirname, 'levels.json'), JSON.stringify({ game: 'Codewords', totalLevels: levels.length, tiers: TIERS.map(t => t.name), levels }, null, 2));
console.log(`\nDone: ${levels.length}/27 levels, ${failed} failed`);
if (levels.length < 27) process.exit(1);
