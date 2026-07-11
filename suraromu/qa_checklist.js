#!/usr/bin/env node
/**
 * Suraromu — Code-level QA Checklist
 * Runs 50+ checks against index.html and levels.json.
 */
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
let pass = 0, fail = 0;
const errors = [];

function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; errors.push(name); }
}

// ===== HTML structure =====
check('DOCTYPE', html.includes('<!DOCTYPE html>'));
check('lang attr', html.includes('<html lang="en">'));
check('viewport meta', html.includes('viewport'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('theme-color', html.includes('theme-color'));
check('title tag', /<title>[^<]+<\/title>/.test(html));
check('description meta', html.includes('name="description"'));
check('keywords meta', html.includes('name="keywords"'));
check('canonical link', html.includes('rel="canonical"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:url', html.includes('og:url'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));

// ===== JSON-LD =====
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('HowTo JSON-LD', html.includes('"@type":"HowTo"'));

// ===== CSS / UI =====
check('canvas element', html.includes('id="puzzle-canvas"'));
check('menu screen', html.includes('id="menu-screen"'));
check('game screen', html.includes('id="game-screen"'));
check('win overlay', html.includes('id="win-overlay"'));
check('pause overlay', html.includes('id="pause-overlay"'));
check('howto overlay', html.includes('id="howto-overlay"'));
check('timer element', html.includes('id="timer"'));
check('hint button', html.includes('id="hint-btn"'));
check('check button', html.includes('id="check-btn"'));
check('back button', html.includes('id="back-btn'));
check('tier grid', html.includes('id="tier-grid"'));
check('continue button', html.includes('id="continue-btn"'));
check('gz-sr-only H1', html.includes('gz-sr-only'));

// ===== Game systems =====
check('Web Audio initAudio', html.includes('initAudio'));
check('beep function', html.includes('function beep'));
check('startBGM', html.includes('startBGM'));
check('stopBGM', html.includes('stopBGM'));
check('sndDraw', html.includes('sndDraw'));
check('sndWin', html.includes('sndWin'));
check('sndError', html.includes('sndError'));
check('sndHint', html.includes('sndHint'));
check('loadLevel function', html.includes('function loadLevel'));
check('render function', html.includes('function render'));
check('handleTap function', html.includes('function handleTap'));
check('checkWin function', html.includes('function checkWin'));
check('onWin function', html.includes('function onWin'));
check('giveHint function', html.includes('function giveHint'));
check('undo function', html.includes('function undo'));
check('saveProgress', html.includes('saveProgress'));
check('loadProgress', html.includes('loadProgress'));
check('localStorage save', html.includes("localStorage.setItem('suraromu"));
check('3-star ratings', html.includes('stars'));
check('level select tiers', html.includes('Beginner') && html.includes('Expert'));
check('keyboard support', html.includes('addEventListener(\'keydown\''));

// ===== LEVELS data =====
const m = html.match(/var LEVELS\s*=\s*(\[\[.*?\]\]);/s);
check('LEVELS array present', !!m);
if (m) {
  try {
    const LEVELS = JSON.parse(m[1]);
    check('30 levels', LEVELS.length === 30);
    check('all have 10 fields', LEVELS.every(L => L.length === 10));
    check('tier range 1-5', LEVELS.every(L => L[2] >= 1 && L[2] <= 5));
    check('all have start num', LEVELS.every(L => typeof L[6] === 'number' && L[6] >= 1));
    check('all have solution', LEVELS.every(L => typeof L[9] === 'string' && L[9].length > 0));
    check('all have gates', LEVELS.every(L => typeof L[7] === 'string'));
  } catch(e) {
    check('LEVELS parse', false);
    errors.push('LEVELS parse error: ' + e.message);
  }
}

// ===== Footer / ads =====
check('gz-analytics', html.includes('gz-analytics.js'));
check('game-footer', html.includes('game-footer.js'));
check('monetag-manager', html.includes('monetag-manager.js'));

// ===== No common errors =====
check('no site-analytics deprecated', !html.includes('site-analytics.gamezipper.com'));
check('no undefined function', !html.includes('undefined is not'));

// ===== Report =====
console.log(`\n=== QA CHECKLIST: ${pass} pass, ${fail} fail ===`);
if (fail > 0) {
  console.log('\nFAILED checks:');
  errors.forEach(e => console.log('  ✗ ' + e));
}
process.exit(fail > 0 ? 1 : 0);
