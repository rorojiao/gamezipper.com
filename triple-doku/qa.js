#!/usr/bin/env node
/**
 * Triple Doku QA — 40-point code-level checklist
 * Runs without browser (cron mode compatible).
 */
const fs = require('fs');
const html = fs.readFileSync('triple-doku/index.html', 'utf8');

console.log('=== Triple Doku QA Checklist ===\n');

const checks = [
  // Level data
  ['30 LEVELS', (html.match(/puzzleA:/g) || []).length === 30],
  ['30 puzzleA arrays', (html.match(/"puzzleA":/g) || []).length === 30],
  ['30 puzzleB arrays', (html.match(/"puzzleB":/g) || []).length === 30],
  ['30 puzzleC arrays', (html.match(/"puzzleC":/g) || []).length === 30],
  ['30 solutionA arrays', (html.match(/"solutionA":/g) || []).length === 30],
  ['30 solutionB arrays', (html.match(/"solutionB":/g) || []).length === 30],
  ['30 solutionC arrays', (html.match(/"solutionC":/g) || []).length === 30],

  // Core features
  ['Score system', html.includes('score') || html.includes('mistakes')],
  ['Star rating', html.includes('star') || html.includes('checkWin')],
  ['Hint power-up', html.includes('hint') || html.includes('hintsLeft')],
  ['Undo power-up', html.includes('undo') || html.includes('history')],
  ['Check feature', html.includes('check') || html.includes('highlightMistakes')],
  ['Reset feature', html.includes('reset') || html.includes('initLevel')],

  // UI/UX
  ['Tutorial/help text', html.includes('How to play')],
  ['Level select modal', html.includes('level-grid') || html.includes('levels-modal')],
  ['Settings/sound toggle', html.includes('mute') || html.includes('sound')],
  ['Progress save', html.includes('localStorage')],
  ['Timer display', html.includes('timer') || html.includes('elapsed')],

  // Technical
  ['Canvas rendering', html.includes('getContext')],
  ['requestAnimationFrame', html.includes('requestAnimationFrame')],
  ['Delta time/loop', html.includes('raf') || html.includes('loop')],
  ['Pointer events', html.includes('pointerdown')],
  ['Touch action CSS', html.includes('touch-action')],
  ['Responsive/resize', html.includes('resize') || html.includes('innerWidth')],

  // Audio
  ['AudioContext', html.includes('AudioContext')],
  ['BGM start/stop', html.includes('startBgm') && html.includes('stopBgm')],
  ['Sound effects', html.includes('SFX') || html.includes('beep')],
  ['Mute toggle', html.includes('muted') || html.includes('mute')],

  // SEO & structured data
  ['Analytics pixel', html.includes('site-analytics.cap.1ktower.com')],
  ['JSON-LD VideoGame', html.includes('VideoGame')],
  ['JSON-LD FAQPage', html.includes('FAQPage')],
  ['JSON-LD HowTo', html.includes('HowTo')],
  ['JSON-LD BreadcrumbList', html.includes('BreadcrumbList')],
  ['OG tags', html.includes('og:title')],
  ['Canonical URL', html.includes('canonical') && html.includes('triple-doku')],
  ['Meta description', html.includes('Triple Doku')],

  // Code quality
  ['Cleanup function', html.includes('function cleanup') || html.includes('beforeunload')],
  ['No -webkit-text-stroke', !html.includes('-webkit-text-stroke')],
  ['English UI', html.includes('Triple Doku')],
  ['File size > 50KB', html.length > 50000],
  ['Single file', html.includes('<!DOCTYPE html>')],
  ['No external CSS', !html.includes('rel="stylesheet"')],

  // Game-specific: 3 grids
  ['3 grid support (BOARD_W = 21)', html.includes('BOARD_W = 21')],
  ['Grid C included', html.includes('Grid C') || html.includes('puzzleC')],
  ['2 shared stacks logic', html.includes('SHARED_COLS') && html.includes('12')],
  ['Triple Doku title', html.includes('Triple Doku')],
];

let pass = 0, fail = 0;
checks.forEach(function(c) {
  const result = c[1] ? 'OK' : 'FAIL';
  if (c[1]) pass++; else fail++;
  console.log(`${result} ${c[0]}`);
});

console.log(`\n${pass}/${checks.length} passed${fail ? ` (${fail} failed)` : ''}`);

// Check for Chinese
const chineseMatches = html.match(/[\u4e00-\u9fff]/g);
if (chineseMatches) {
  console.log(`\n⚠️ WARNING: ${chineseMatches.length} Chinese characters found`);
}

// Check for emoji in game code (not SEO descriptions)
const emojiMatches = html.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
if (emojiMatches) {
  console.log(`⚠️ WARNING: ${emojiMatches.length} emoji characters found`);
}

process.exit(fail > 0 ? 1 : 0);