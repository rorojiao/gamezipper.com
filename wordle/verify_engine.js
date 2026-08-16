// wordle verify_engine.js — confirms game loads + letterRank module-scope (Pitfall #55)
// Without this fix, submitGuess throws ReferenceError: letterRank is not defined
// and the game silently fails to advance.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join('/home/junze/gamezipper.com', 'wordle/index.html'), 'utf8');

// Static structural checks — confirm letterRank is at module scope (not inside renderKeyboard)
const checks = {
  hasLetterRankModuleScope: /^const letterRank=\{green:3,yellow:2,gray:1\};$/m.test(html),
  hasLetterRankNotInRenderKeyboard: !/function renderKeyboard\(\)\{[\s\S]*?const letterRank=\{green:3,yellow:2,gray:1\}[\s\S]*?\}/m.test(html),
  hasSubmitGuess: /function submitGuess\(/.test(html),
  hasUpdateKeyStates: /function updateKeyStates\(/.test(html),
  hasRenderKeyboard: /function renderKeyboard\(/.test(html),
  hasGetRandomWord: /function getRandomWord\(/.test(html),
  hasGetDailyWord: /function getDailyWord\(/.test(html),
  hasIsValidWord: /function isValidWord\(/.test(html),
  hasEvaluate: /function evaluate\(/.test(html),
  hasSaveGameState: /function saveGameState\(/.test(html),
  hasLoadGameState: /function loadGameState\(/.test(html),
  hasStartPractice: /function startPractice\(/.test(html),
  hasStartDaily: /function startDaily\(/.test(html),
};

const allOk = Object.values(checks).every(v => v === true);
console.log('Wordle structural checks:');
Object.entries(checks).forEach(([k, v]) => console.log(`  ${v ? '✓' : '✗'} ${k}`));
console.log(allOk ? 'PASS' : 'FAIL');
process.exit(allOk ? 0 : 1);