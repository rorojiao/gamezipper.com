#!/usr/bin/env node
/* GENERATED static verifier for contexto — pattern follows catch-the-cat/verify_engine.js.
 * Contexto is a daily/practice word-guessing game driven by an embedded semantic dictionary.
 * No fixed LEVELS catalog; instead, every guess uses getRank(guess, secret).
 * Verifier checks:
 *   1. Required source symbols are present (CATEGORIES, CATEGORY_WORDS, ALL_WORDS, etc.)
 *   2. addCategory() is called for enough categories to populate dictionary
 *   3. Dictionary is loaded into DOM (via buildDictionary + buildWordLists)
 *   4. getDailyWord / getRandomWord / submitGuess are wired
 *   5. Game UI elements (gameInput, submitBtn, hintBtn, dailyBtn, practiceBtn) exist in HTML
 *   6. HTML chrome (monetag, gz-ad-below-game, game-footer) present
 * Usage: node contexto/verify_engine.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');

// Extract main game script (the big IIFE that defines all game state)
const re = /<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g;
let mainScript = null;
let m;
while ((m = re.exec(html)) !== null) {
  if (m[1].includes('const CATEGORIES') || m[1].includes('buildDictionary')) {
    mainScript = m[1];
    break;
  }
}

const checks = [];
function addCheck(name, ok) { checks.push({name, ok}); }

addCheck('main game IIFE found', mainScript !== null);
addCheck('CATEGORIES const declared', mainScript && /const CATEGORIES = \{/.test(mainScript));
addCheck('CATEGORY_WORDS const declared', mainScript && /const CATEGORY_WORDS = \{}/.test(mainScript));
addCheck('addCategory function defined', mainScript && /function addCategory/.test(mainScript));
addCheck('buildDictionary function defined', mainScript && /function buildDictionary\(\)/.test(mainScript));
addCheck('buildWordLists function defined', mainScript && /function buildWordLists/.test(mainScript));
addCheck('ALL_WORDS declared', mainScript && /let ALL_WORDS = \[\]/.test(mainScript));
addCheck('WORD_TO_CATS declared', mainScript && /let WORD_TO_CATS = \{}/.test(mainScript));
addCheck('SIMILARITY_CACHE declared', mainScript && /let SIMILARITY_CACHE = \{}/.test(mainScript));
addCheck('getRank function defined', mainScript && /function getRank\(/.test(mainScript));
addCheck('getTemperature function defined', mainScript && /function getTemperature/.test(mainScript));
addCheck('getDailyWord function defined', mainScript && /function getDailyWord/.test(mainScript));
addCheck('getRandomWord function defined', mainScript && /function getRandomWord/.test(mainScript));
addCheck('submitGuess function defined', mainScript && /function submitGuess/.test(mainScript));
addCheck('renderGuess function defined', mainScript && /function renderGuess/.test(mainScript));
addCheck('gameInput element present', /id="gameInput"/.test(html));
addCheck('submitBtn element present', /id="submitBtn"/.test(html));
addCheck('hintBtn element present', /id="hintBtn"/.test(html));
addCheck('dailyBtn element present', /id="dailyBtn"/.test(html));
addCheck('practiceBtn element present', /id="practiceBtn"/.test(html));
addCheck('newGameBtn element present', /id="newGameBtn"/.test(html));
addCheck('shareBtn element present', /id="shareBtn"/.test(html));
addCheck('monetag-manager.js loaded', /monetag-manager/.test(html));
addCheck('gz-ad-below-game div present', /id="gz-ad-below-game"/.test(html));
addCheck('game-footer.js loaded', /game-footer\.js/.test(html));
addCheck('h1 with title', /<h1[^>]*>Contexto/i.test(html));
// Count addCategory calls (categories registered)
if (mainScript) {
  const calls = mainScript.match(/addCategory\(/g) || [];
  addCheck('addCategory called 20+ times (>=20 cats)', calls.length >= 20);
  // CATEGORIES supercat keys
  const catsMatch = mainScript.match(/const CATEGORIES = \{([\s\S]*?)\n\};/);
  if (catsMatch) {
    const keys = catsMatch[1].match(/^\s*(\w+):/gm) || [];
    addCheck('CATEGORIES has 5+ super-categories', keys.length >= 5);
  }
}

let pass = 0, fail = 0, fails = [];
for (const c of checks) {
  if (c.ok) pass++;
  else { fail++; fails.push(c.name); }
}
if (fail > 0) for (const f of fails) console.log('FAIL: ' + f);
console.log(`contexto static verification: ${pass}/${pass+fail} checks, verdict=${fail===0?'PASS':'FAIL '+fail}`);
process.exit(fail === 0 ? 0 : 1);