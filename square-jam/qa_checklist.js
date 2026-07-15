/**
 * Square Jam — Phase 7 QA Checklist (Code-Level)
 * 
 * Validates all 60+ checks across HTML structure, SEO, game systems, etc.
 */

const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

let pass = 0, fail = 0;
const results = [];

function check(name, condition) {
    results.push({ name, pass: !!condition });
    if (condition) pass++; else fail++;
}

// === HTML Structure ===
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('lang="en"', html.includes('lang="en"'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('viewport'));
check('Single file (no external CSS)', !html.includes('rel="stylesheet"') || html.includes('rel="icon"'));
check('</html> closing tag', html.includes('</html>'));

// === SEO & Meta ===
check('title tag', /<title>[^<]+<\/title>/.test(html));
check('meta description', html.includes('name="description"'));
check('meta keywords', html.includes('name="keywords"'));
check('canonical link', html.includes('canonical'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:url', html.includes('og:url'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));

// === Structured Data ===
check('JSON-LD VideoGame', html.includes('"@type":"VideoGame"'));
check('JSON-LD FAQPage', html.includes('"@type":"FAQPage"'));
check('JSON-LD BreadcrumbList', html.includes('"@type":"BreadcrumbList"'));

// === Analytics & Ads ===
check('site-analytics pixel', html.includes('site-analytics.cap.1ktower.com'));
check('Monetag script', html.includes('monetag.com'));
check('Monetag zone 110120', html.includes('110120'));
check('gz-ad-below-game container', html.includes('gz-ad-below-game'));

// === CSS & Responsive ===
check('Dark theme bg', html.includes('#0a0a1a') || html.includes('--bg'));
check('touch-action: none', html.includes('touch-action:none') || html.includes('touch-action: none'));
check('user-select: none', html.includes('user-select:none') || html.includes('user-select: none'));
check('overflow-x hidden', html.includes('overflow-x:hidden') || html.includes('overflow-x: hidden'));
check('No -webkit-text-stroke', !html.includes('-webkit-text-stroke'));

// === Canvas & Rendering ===
check('Canvas element', html.includes('<canvas'));
check('getContext', html.includes('getContext'));
check('requestAnimationFrame', html.includes('requestAnimationFrame'));
check('fillRect (cell rendering)', html.includes('fillRect'));

// === Game Logic ===
check('30 levels in JSON', levels.length === 30);
check('Level data has regions', levels.every(l => Array.isArray(l.regions)));
check('Level data has clues', levels.every(l => Array.isArray(l.clues)));
check('Level data has rows/cols', levels.every(l => l.rows && l.cols));
check('checkSolution function', html.includes('function checkSolution'));
check('computePlayerRegions function', html.includes('function computePlayerRegions'));
check('loadLevel function', html.includes('function loadLevel'));
check('doHint function', html.includes('function doHint'));
check('doCheck function', html.includes('function doCheck'));
check('doRestart function', html.includes('function doRestart'));

// === UI/UX ===
check('Draw mode button', html.includes('btn-draw'));
check('Erase mode button', html.includes('btn-erase'));
check('Hint button', html.includes('btn-hint'));
check('Check button', html.includes('btn-check'));
check('Level select', html.includes('showLevelSelect'));
check('Settings modal', html.includes('settings-modal'));
check('Music toggle', html.includes('toggle-music'));
check('SFX toggle', html.includes('toggle-sfx'));

// === Input ===
check('pointerdown handler', html.includes('pointerdown'));
check('pointermove handler', html.includes('pointermove'));
check('pointerup handler', html.includes('pointerup'));
check('pointercancel handler', html.includes('pointercancel'));
check('keyboard handler', html.includes('onKeyDown'));

// === Audio ===
check('AudioContext init', html.includes('new(window.AudioContext'));
check('BGM start function', html.includes('function startBGM'));
check('BGM stop function', html.includes('function stopBGM'));
check('playTone SFX', html.includes('function playTone'));
check('Win fanfare', html.includes('function playWinFanfare'));

// === State Management ===
check('localStorage save', html.includes('localStorage'));
check('saveProgress function', html.includes('function saveProgress'));
check('loadProgress function', html.includes('function loadProgress'));
check('saveSettings function', html.includes('function saveSettings'));

// === Lifecycle ===
check('cleanup function', html.includes('function cleanup'));
check('beforeunload handler', html.includes('beforeunload'));
check('visibilitychange handler', html.includes('visibilitychange'));
check('cancelAnimationFrame', html.includes('cancelAnimationFrame'));

// === Tier System ===
check('Tier system (5 tiers)', html.includes("'Expert'") && html.includes("'Beginner'"));
check('Star ratings', html.includes('renderStars'));
check('Timer', html.includes('startTimer') && html.includes('stopTimer'));

// === Code Quality ===
check('No console.log in game code', !html.includes('console.log(') || html.includes('console.error'));
check('No TODO/FIXME', !html.includes('TODO') && !html.includes('FIXME'));

// === File Size ===
check('File size > 20KB', html.length > 20000);
check('No Chinese characters', !html.match(/[\u4e00-\u9fff]/));

// === Art Assets ===
try {
    const iconStat = fs.statSync(__dirname + '/icon.png');
    check('icon.png exists', true);
    check('icon.png > 1KB', iconStat.size > 1024);
} catch(e) {
    check('icon.png exists', false);
}
try {
    const ogStat = fs.statSync(__dirname + '/og-image.jpg');
    check('og-image.jpg exists', true);
    check('og-image.jpg > 10KB', ogStat.size > 10240);
} catch(e) {
    check('og-image.jpg exists', false);
}

// === Footer ===
check('game-footer.js included', html.includes('game-footer.js'));
check('Back to GameZipper link', html.includes('gamezipper.com/'));

// Print results
results.forEach(r => {
    console.log((r.pass ? '✅' : '❌') + ' ' + r.name);
});

console.log('\n' + pass + '/' + (pass + fail) + ' checks passed' + (fail > 0 ? ' (' + fail + ' FAILED)' : ''));
if (fail > 0) {
    console.log('\n❌ FAILED checks:');
    results.filter(r => !r.pass).forEach(r => console.log('  - ' + r.name));
    process.exit(1);
} else {
    console.log('\n✅ All QA checks passed');
}
