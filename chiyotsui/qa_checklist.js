// qa_checklist.js — Code-level QA checklist for Chiyotsui
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
  
  // Interaction modes
  ['Shade mode', html.includes('Shade')],
  ['Erase mode', html.includes('Erase')],
  ['mode switching', html.includes('state.mode')],
  
  // Keyboard
  ['keyboard 1', html.includes("e.key==='1'")],
  ['keyboard 2', html.includes("e.key==='2'")],
  ['keyboard H', html.includes("e.key==='h'")],
  ['keyboard R', html.includes("e.key==='r'")],
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
  ['hint counter', html.includes('hintInfo')],
  ['level info', html.includes('lvlInfo')],
  ['toast', html.includes('toast')],
  ['menu overlay', html.includes('menuOverlay')],
  ['settings overlay', html.includes('settingsOverlay')],
  ['win overlay', html.includes('winOverlay')],
  ['win stars', html.includes('winStars')],
  ['next level button', html.includes('btnNext')],
  ['replay button', html.includes('btnReplay')],
  
  // Region rendering
  ['REGION_COLORS', html.includes('REGION_COLORS')],
  ['region borders', html.includes('state.region')],
  
  // Art assets
  ['icon.png', fs.existsSync('icon.png')],
  ['og-image.jpg', fs.existsSync('og-image.jpg')],
  
  // Footer
  ['footer', html.includes('gz-footer')],
  ['GameZipper link', html.includes('gamezipper.com')],
  
  // Cleanup
  ['beforeunload', html.includes('beforeunload')],
  
  // Touch support
  ['touch-action', html.includes('touch-action')],
  ['pointerdown', html.includes('pointerdown')],
];

let pass = 0;
let fail = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (ok) pass++; else fail++;
}
console.log(`\n${pass}/${checks.length} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
