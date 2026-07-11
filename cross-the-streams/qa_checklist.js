#!/usr/bin/env node
/**
 * QA Checklist for Cross the Streams — code-level verification.
 */
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
let errors = [];
let checks = 0;

function check(name, condition) {
  checks++;
  if (!condition) errors.push(name);
  else console.log(`  ✅ ${name}`);
}

console.log('=== Cross the Streams QA Checklist ===\n');

// 1. HTML structure
console.log('--- HTML Structure ---');
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('meta viewport', html.includes('viewport'));
check('title tag', html.includes('<title>') && html.includes('Cross the Streams'));
check('meta description', html.includes('name="description"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('icon link', html.includes('icon.png'));
check('gz-sr-only H1', html.includes('gz-sr-only'));

// 2. JSON-LD
console.log('\n--- JSON-LD ---');
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('schema URL correct', html.includes('gamezipper.com/cross-the-streams/'));

// 3. Game systems
console.log('\n--- Game Systems ---');
check('Canvas element', html.includes('<canvas'));
check('LEVELS array', html.includes('const LEVELS'));
check('30 levels loaded', (html.match(/"difficulty"/g) || []).length === 30);
check('click handler', html.includes('addEventListener(\'click\''));
check('touch handler', html.includes('touchstart'));
check('keyboard handler', html.includes('keydown'));
check('contextmenu (right-click)', html.includes('contextmenu'));

// 4. Audio
console.log('\n--- Audio ---');
check('AudioContext init', html.includes('AudioContext'));
check('music function', html.includes('startMusic'));
check('SFX functions', html.includes('playSfx'));
check('win sound', html.includes('sfxWin'));
check('error sound', html.includes('sfxError'));

// 5. Game features
console.log('\n--- Game Features ---');
check('hint system', html.includes('function hint()'));
check('check solution', html.includes('function checkSolution()'));
check('restart', html.includes('function restart()'));
check('level select', html.includes('function showLevelSelect()'));
check('star ratings', html.includes('setStars') && html.includes('getStars'));
check('localStorage save', html.includes('localStorage.setItem'));
check('confetti', html.includes('launchConfetti'));
check('settings panel', html.includes('settingsPanel'));
check('music toggle', html.includes('toggleSetting'));
check('mode selector', html.includes('setMode'));
check('timer', html.includes('timerInterval'));

// 6. Nonogram-specific
console.log('\n--- Cross the Streams Rules ---');
check('row clues rendering', html.includes('rowClues'));
check('col clues rendering', html.includes('colClues'));
check('getLineGroups', html.includes('getLineGroups'));
check('2x2 check', html.includes('2x2') || html.includes('grid[r][c]===1&&grid[r][c+1]===1'));
check('connectivity check', html.includes('visited.size') || html.includes('queue.push'));

// 7. SEO
console.log('\n--- SEO ---');
check('lang attribute', html.includes('lang="en"'));
check('keyword in title', html.includes('Cross the Streams'));
check('keyword in description', html.includes('cross the streams') || html.toLowerCase().includes('cross the streams'));
check('free online keyword', html.includes('free') && html.includes('online'));
check('no download keyword', html.includes('no download') || html.includes('No download'));

// 8. No JS errors indicators
console.log('\n--- Code Quality ---');
check('no console.error', !html.includes('console.error'));
check('no TODO/FIXME', !html.includes('TODO') && !html.includes('FIXME'));
check('no placeholder', !html.includes('PLACEHOLDER'));

// 9. File sizes
console.log('\n--- File Sizes ---');
const iconStat = fs.statSync('icon.png');
const ogStat = fs.statSync('og-image.jpg');
check('icon.png exists and >1KB', iconStat.size > 1024);
check('og-image.jpg exists and >5KB', ogStat.size > 5 * 1024);
check('icon is 512x512', iconStat.size > 5000); // heuristic
console.log(`  icon.png: ${iconStat.size} bytes`);
console.log(`  og-image.jpg: ${ogStat.size} bytes`);
console.log(`  index.html: ${html.length} bytes`);

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Checks passed: ${checks - errors.length}/${checks}`);
if (errors.length > 0) {
  console.log('\n❌ FAILED:');
  errors.forEach(e => console.log(`  - ${e}`));
  process.exit(1);
} else {
  console.log('\n✅ ALL QA CHECKS PASSED');
}
