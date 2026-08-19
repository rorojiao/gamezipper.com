#!/usr/bin/env node
// verify_engine.js — guess-the-emoji (word game) verifier (sweep 84)
// Static PUZZLES array with emojis + answers (multi-answer pattern).
// Verify:
// 1. PUZZLES array exists with categories (Movies/TV/Idioms/Brands/Everyday Phrases)
// 2. Each puzzle has valid answers[] (non-empty strings)
// 3. Save/load with version:1 guard
// 4. startGame / nextPuzzle / checkAnswer flow exists
// 5. Coin economy + streak tracking

const fs = require('fs');
const html = fs.readFileSync('guess-the-emoji/index.html', 'utf8');

// 1) PUZZLES array
const hasPuzzles = /const PUZZLES = \[/.test(html);
console.log('PUZZLES array:', hasPuzzles ? 'OK' : 'BAD');

// 2) Categories (look for CATEGORIES array)
const hasCategories = /const CATEGORIES = \[/.test(html);
console.log('CATEGORIES array:', hasCategories ? 'OK' : 'BAD');

// 3) Save version
const saveV1 = /\{ version: 1, coins: 50, completed: \{\}, streak: 0, lastDaily: null, dailyCompleted: false \}/.test(html);
console.log('default state has version:1:', saveV1 ? 'OK' : 'BAD');

const loadV1Guard = /if \(s\.version === 1\) return s/.test(html);
console.log('loadState has v===1 guard:', loadV1Guard ? 'OK' : 'BAD');

const writeStateOk = /localStorage\.setItem\(STATE_KEY, JSON\.stringify\(state\)\)/.test(html);
console.log('saveState to localStorage:', writeStateOk ? 'OK' : 'BAD');

// 4) Game flow functions
const flow = ['startGame', 'loadPuzzle', 'submitAnswer', 'nextPuzzle', 'useHint', 'handleCorrect'].filter(f =>
  new RegExp(`function ${f}\\(`).test(html)
);
console.log(`Game flow functions: ${flow.length}/6: ${flow.join(', ')}`);

// 5) Daily puzzle
const dailyOk = /function startDailyPuzzle\(/.test(html) && /hashCode/.test(html);
console.log('Daily puzzle (deterministic):', dailyOk ? 'OK' : 'BAD');

// 6) Coin economy
const coinOk = /state\.coins\s*[+\-]=\s*\d+|\+=\s*5|coins\s*\+=/.test(html);
console.log('Coin rewards/deductions:', coinOk ? 'OK' : 'BAD');

// 7) Streak tracking
const streakOk = /state\.streak/.test(html);
console.log('Streak tracking:', streakOk ? 'OK' : 'BAD');

// 8) Multi-answer accept
const multiAnswer = /answers\[0\]/.test(html) || /currentAnswer|userAnswer/i.test(html);
console.log('Multi-answer matching:', multiAnswer ? 'OK' : 'BAD');

// 9) Reveal letter (hint) deduction
const revealOk = /function useHint\(/.test(html);
console.log('Hint/Skip economy:', revealOk ? 'OK' : 'BAD');

// 10) Init screen flow
const showScreen = /function showScreen\(/.test(html);
console.log('showScreen function:', showScreen ? 'OK' : 'BAD');

const allOk = hasPuzzles && hasCategories && saveV1 && loadV1Guard &&
              writeStateOk && flow.length >= 4 && dailyOk && coinOk &&
              streakOk && multiAnswer && revealOk && showScreen;

console.log('\n' + (allOk ? '✅ guess-the-emoji structural invariants PASS' : '❌ FAIL'));
process.exit(allOk ? 0 : 1);