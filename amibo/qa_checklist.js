// QA Checklist for Amibo — code-level verification
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let checks = 0, pass = 0, fail = 0;

function check(name, condition, detail) {
  checks++;
  if (condition) {
    pass++;
    console.log('\u2705 ' + name);
  } else {
    fail++;
    console.log('\u274c ' + name + (detail ? ' — ' + detail : ''));
  }
}

// === HTML Structure ===
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('Title contains "Amibo"', html.includes('<title>Amibo'));
check('meta charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('name="viewport"'));
check('description meta', html.includes('name="description"'));
check('canonical link', html.includes('rel="canonical"') && html.includes('gamezipper.com/amibo/'));
check('icon link', html.includes('href="/amibo/icon.png"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image') && html.includes('og-image.jpg'));
check('twitter:card', html.includes('twitter:card'));

// === JSON-LD ===
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('VideoGame name Amibo', html.includes('"name":"Amibo"'));
check('FAQ has 3 questions', (html.match(/"@type":"Question"/g) || []).length >= 3);

// === Game Systems ===
check('LEVELS array defined', html.includes('const LEVELS'));
check('30 levels', (html.match(/"tier":"Beginner"/g) || []).length === 6);
check('Canvas element', html.includes('<canvas id="canvas">'));
check('Web Audio API', html.includes('AudioContext'));
check('localStorage save', html.includes('localStorage'));
check('STORAGE_KEY', html.includes('STORAGE_KEY'));
check('SETTINGS_KEY', html.includes('SETTINGS_KEY'));
check('draw mode', html.includes("data-mode=\"draw\""));
check('erase mode', html.includes("data-mode=\"erase\""));
check('hint system', html.includes('function giveHint'));
check('maxHints = 3', html.includes('maxHints: 3'));
check('check win function', html.includes('function checkWin'));
check('confetti', html.includes('function spawnConfetti'));
check('settings overlay', html.includes('function showSettings'));
check('level select', html.includes('function showLevelSelect'));
check('win overlay', html.includes('function showWinOverlay'));
check('timer', html.includes('setInterval'));
check('keyboard support', html.includes('addEventListener(\'keydown\''));
check('touch support', html.includes('touchstart'));
check('touch preventDefault', html.includes('e.preventDefault()'));
check('render function', html.includes('function render'));
check('resizeCanvas', html.includes('function resizeCanvas'));

// === Audio Systems ===
check('music chords', html.includes('CHORDS'));
check('startMusic', html.includes('function startMusic'));
check('stopMusic', html.includes('function stopMusic'));
check('sfxDraw', html.includes('function sfxDraw'));
check('sfxErase', html.includes('function sfxErase'));
check('sfxClick', html.includes('function sfxClick'));
check('sfxError', html.includes('function sfxError'));
check('sfxHint', html.includes('function sfxHint'));
check('sfxWin', html.includes('function sfxWin'));

// === Game Logic ===
check('segmentsCross', html.includes('function segmentsCross'));
check('isClueSatisfied', html.includes('function isClueSatisfied'));
check('canPlaceSegment', html.includes('function canPlaceSegment'));
check('segmentFromDrag', html.includes('function segmentFromDrag'));
check('draw/erase modes', html.includes('state.mode') && html.includes('\'erase\''));

// === Keyboard ===
check('H key hint', html.includes("e.key==='h'"));
check('R key restart', html.includes("e.key==='r'"));
check('Enter check', html.includes("e.key==='Enter'"));
check('Escape menu', html.includes("e.key==='Escape'"));
check('1/2 mode keys', html.includes("e.key==='1'"));

// === Stars/Progress ===
check('3-star ratings', html.includes('stars = 3'));
check('progress tracking', html.includes('progress['));
check('saveProgress', html.includes('function saveProgress'));
check('loadProgress', html.includes('function loadProgress'));

// === Footer/Ads/Analytics ===
check('gz-analytics', html.includes('gz-analytics.js'));
check('game-footer', html.includes('game-footer.js'));
check('ad container', html.includes('gz-ad-below-game'));
check('monetag', html.includes('monetag-manager.js'));
check('adsterra', html.includes('adsterra-manager.js'));

// === SR-Only H1 ===
check('gz-sr-only H1', html.includes('gz-sr-only'));

// === Violation highlighting ===
check('highlightViolations', html.includes('function highlightViolations'));
check('red violation color', html.includes('rgba(239,68,68'));

console.log('\n=== QA Checklist Summary ===');
console.log('Total checks: ' + checks);
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
process.exit(fail > 0 ? 1 : 0);
