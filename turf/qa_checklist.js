// qa_checklist.js — Code-level QA checklist for Turf
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  // HTML structure
  ['DOCTYPE', html.includes('<!DOCTYPE html>')],
  ['lang attr', html.includes('<html lang="en">')],
  ['viewport meta', html.includes('viewport')],
  ['charset', html.includes('charset="UTF-8"')],
  ['canonical', html.includes('canonical')],
  ['gz-sr-only H1', html.includes('gz-sr-only')],
  
  // SEO / JSON-LD
  ['VideoGame schema', html.includes('"@type":"VideoGame"')],
  ['FAQPage schema', html.includes('"@type":"FAQPage"')],
  ['BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"')],
  ['og:title', html.includes('og:title')],
  ['og:description', html.includes('og:description')],
  ['og:image', html.includes('og:image')],
  ['twitter:card', html.includes('twitter:card')],
  
  // Canvas
  ['Canvas element', html.includes('<canvas')],
  ['getContext', html.includes("getContext('2d')") || html.includes('getContext("2d")')],
  
  // Game systems
  ['LEVELS const', html.includes('const LEVELS')],
  ['30 levels', (html.match(/"id":\d+/g) || []).length >= 30],
  ['checkWin function', html.includes('function checkWin')],
  ['draw function', html.includes('function draw')],
  ['initLevel function', html.includes('function initLevel')],
  ['handlePointer', html.includes('handlePointer')],
  ['giveHint', html.includes('giveHint') || html.includes('function giveHint')],
  ['clearAll', html.includes('clearAll')],
  ['getStars', html.includes('getStars')],
  ['onWin', html.includes('onWin')],
  ['buildLevelSelect', html.includes('buildLevelSelect')],
  ['resize function', html.includes('function resize')],
  
  // Turf-specific: shade modes
  ['Black button', html.includes('blackBtn')],
  ['White button', html.includes('whiteBtn')],
  ['Mode switching', html.includes('state.mode') || html.includes('currentMode')],
  
  // Turf-specific: connectivity check
  ['BFS/DFS connectivity', html.includes('bfs') || html.includes('dfs') || html.includes('floodFill')],
  ['White connected', html.includes('white.*connected') || html.includes('isConnected.*0')],
  ['Black connected', html.includes('black.*connected') || html.includes('isConnected.*1')],
  
  // Keyboard
  ['keyboard B', html.includes("e.key==='b'") || html.includes("e.key==='B'")],
  ['keyboard W', html.includes("e.key==='w'") || html.includes("e.key==='W'")],
  ['keyboard H', html.includes("e.key==='h'") || html.includes("e.key==='H'")],
  ['keyboard R', html.includes("e.key==='r'") || html.includes("e.key==='R'")],
  ['keyboard Enter', html.includes("e.key==='Enter'")],
  ['keyboard Escape', html.includes("e.key==='Escape'")],
  
  // Audio
  ['AudioContext', html.includes('AudioContext')],
  ['startMusic', html.includes('startMusic')],
  ['stopMusic', html.includes('stopMusic')],
  ['playTone', html.includes('playTone')],
  ['playClick', html.includes('playClick')],
  ['playErase', html.includes('playErase')],
  ['playHint', html.includes('playHint')],
  ['playError', html.includes('playError')],
  ['playWin', html.includes('playWin')],
  
  // localStorage
  ['SAVE_KEY', html.includes('SAVE_KEY')],
  ['loadSave', html.includes('loadSave')],
  ['saveProgress', html.includes('saveProgress')],
  ['saveSettings', html.includes('saveSettings')],
  
  // Settings
  ['music toggle', html.includes('toggleMusic')],
  ['sfx toggle', html.includes('toggleSfx')],
  ['auto-check toggle', html.includes('toggleAuto')],
  
  // UI elements
  ['timer', html.includes('timer')],
  ['hint counter', html.includes('hints')],
  ['level info', html.includes('lvlNum')],
  ['toast', html.includes('toast')],
  ['menu overlay', html.includes('menuOverlay')],
  ['settings overlay', html.includes('settingsOverlay')],
  ['win overlay', html.includes('winOverlay')],
  ['win stars', html.includes('stars') || html.includes('winStars')],
  ['next level button', html.includes('btnNext')],
  ['replay button', html.includes('btnReplay')],
  
  // Clue rendering
  ['clue rendering', html.includes('clue') || html.includes('value')],
  ['clue colors', html.includes('clueColor') || html.includes('COLORS')],
  
  // Art assets
  ['icon.png', fs.existsSync('icon.png')],
  ['og-image.jpg', fs.existsSync('og-image.jpg')],
  
  // Footer
  ['footer', html.includes('gz-footer')],
  ['GameZipper link', html.includes('gamezipper.com')],
  
  // Cleanup
  ['cleanup on exit', html.includes('window.addEventListener("beforeunload"') || html.includes('onbeforeunload')],
];

console.log('=== Turf QA Checklist ===\n');

let passCount = 0;
let failCount = 0;

for (const [name, passed] of checks) {
  const status = passed ? '✓' : '✗';
  console.log(`${status} ${name}`);
  if (passed) passCount++;
  else failCount++;
}

console.log(`\n=== Summary ===`);
console.log(`PASS: ${passCount}`);
console.log(`FAIL: ${failCount}`);
console.log(`TOTAL: ${checks.length}`);
console.log(`RATE: ${(passCount / checks.length * 100).toFixed(1)}%`);

if (failCount > 0) {
  console.log('\n❌ QA FAILED - Fix issues before deployment');
  process.exit(1);
} else {
  console.log('\n✅ ALL CHECKS PASSED');
}