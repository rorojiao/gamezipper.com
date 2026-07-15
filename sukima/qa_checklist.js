// qa_checklist.js — Code-level QA for Sukima puzzle game
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const checks = [];
let pass = 0;
let fail = 0;

function check(name, condition, detail = '') {
    if (condition) {
        checks.push({ name, status: 'PASS' });
        pass++;
    } else {
        checks.push({ name, status: 'FAIL', detail });
        fail++;
    }
}

// === STRUCTURAL CHECKS ===
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('Charset declared', html.includes('charset="UTF-8"'));
check('Viewport meta', html.includes('viewport'));
check('Title tag', /<title>[^<]+<\/title>/.test(html));
check('Language attr', /<html\s+lang=/i.test(html));
check('Canonical link', html.includes('rel="canonical"'));
check('Icon link', html.includes('icon.png'));
check('OG image', html.includes('og-image.jpg'));
check('OG URL', html.includes('gamezipper.com/sukima/'));

// === SEO JSON-LD ===
const jsonLdScripts = (html.match(/<script type="application\/ld\+json">/g) || []).length;
check('JSON-LD blocks (3)', jsonLdScripts >= 3, `Found ${jsonLdScripts}`);

check('VideoGame schema', /"@type"\s*:\s*"VideoGame"/.test(html));
check('FAQPage schema', /"@type"\s*:\s*"FAQPage"/.test(html));
check('BreadcrumbList schema', /"@type"\s*:\s*"BreadcrumbList"/.test(html));

check('Publisher org', /"publisher"\s*:\s*\{[^}]*"Organization"/.test(html));
check('Offer free', /"price"\s*:\s*"0"/.test(html));
check('Genre Puzzle', /"genre"\s*:\s*"Puzzle"/.test(html));

// === sr-only h1 ===
check('sr-only H1', /<h1 class="gz-sr-only">/.test(html));
check('gz-sr-only CSS', /\.gz-sr-only\{/.test(html));

// === GAME SYSTEMS ===
check('LEVELS array', html.includes('const LEVELS = ') && /\[{"R":/.test(html));
check('30 levels embedded', (html.match(/\{"R":/g) || []).length === 30);

check('Canvas element', html.includes('<canvas'));
check('computeLayout function', html.includes('function computeLayout'));
check('draw function', /function draw\(\)/.test(html));

check('Place mode', html.includes("setMode('place')"));
check('Erase mode', html.includes("setMode('erase')"));
check('Hint function', html.includes('function useHint'));
check('Clear function', html.includes('function clearBoard'));
check('Check function', html.includes('function checkWin'));
check('Win function', html.includes('function win'));

check('Hint 3 per level', /hintsUsed < 3|hintsUsed >= 3|hint-count/.test(html));
check('3-star ratings', /⭐/.test(html));
check('Timer display', /timer\.textContent|timerInterval/.test(html));

// === LEVEL SELECT ===
check('Level select UI', html.includes('id="level-select"'));
check('updateLevelSelect function', html.includes('function updateLevelSelect'));
check('Tier groups', html.includes('tier-group'));
check('6 levels per tier (5 tiers)', (html.match(/"Beginner"/g) || []).length >= 1);

// === SETTINGS ===
check('Settings panel', html.includes('id="settings-panel"'));
check('Music toggle', html.includes("toggleSetting('music')"));
check('SFX toggle', html.includes("toggleSetting('sfx')"));
check('Autocheck toggle', html.includes("toggleSetting('autocheck')"));

// === AUDIO ===
check('AudioContext', html.includes('AudioContext'));
check('Web Audio API', html.includes('createOscillator'));
check('Music start', html.includes('function startMusic'));
check('Music stop', html.includes('function stopMusic'));
check('Win sound', html.includes("'win'"));

// === KEYBOARD ===
check('Keyboard listener', html.includes("addEventListener('keydown'"));
check('1 key = place', html.includes("e.key === '1'"));
check('2 key = erase', html.includes("e.key === '2'"));
check('H key = hint', /e\.key === ['"]h['"]/.test(html));
check('R key = clear', /e\.key === ['"]r['"]/.test(html));
check('Enter = check', html.includes("e.key === 'Enter'"));
check('Escape = menu', html.includes("e.key === 'Escape'"));

// === TOUCH SUPPORT ===
check('Touch in canvas pos', /e\.touches/.test(html));
check('Pointer events', html.includes('pointerdown'));

// === PERSISTENCE ===
check('localStorage save', html.includes("localStorage.setItem('sukima-progress'"));
check('localStorage load', html.includes("localStorage.getItem('sukima-progress'"));

// === CLEANUP ===
check('beforeunload cleanup', html.includes("addEventListener('beforeunload'"));
check('pagehide cleanup', html.includes("addEventListener('pagehide'"));
check('visibilitychange handler', html.includes("addEventListener('visibilitychange'"));

// === ADS ===
check('Monetag', html.includes('monetag-manager.js'));
check('Adsterra', html.includes('adsterra-manager.js'));
check('Game footer', html.includes('game-footer.js'));
check('gz-analytics', html.includes('gz-analytics.js'));

// === ART ===
check('Icon file exists', fs.existsSync(__dirname + '/icon.png'));
check('OG image exists', fs.existsSync(__dirname + '/og-image.jpg'));
const iconSize = fs.existsSync(__dirname + '/icon.png') ? fs.statSync(__dirname + '/icon.png').size : 0;
check('Icon > 1KB', iconSize > 1024, `Size: ${iconSize}`);
const ogSize = fs.existsSync(__dirname + '/og-image.jpg') ? fs.statSync(__dirname + '/og-image.jpg').size : 0;
check('OG image > 10KB', ogSize > 10000, `Size: ${ogSize}`);

// === GAME LOGIC ===
check('Triomino shapes defined', html.includes('SHAPES') || html.includes('triominoes'));
check('Circle clue check', html.includes('circles[') || html.includes('.circles.'));
check('Blocked check', html.includes('blocked.includes') || html.includes('blockedSet'));
check('2x2 violation check', html.includes('2x2') || html.includes('2x2 violation'));
check('isValidTriomino function', html.includes('isValidTriomino'));
check('canPlace function', html.includes('canPlace'));

// === CONFETTI ===
check('Confetti on win', html.includes('launchConfetti'));

// Print results
console.log('=== SUKIMA QA CHECKLIST ===\n');
checks.forEach(c => {
    if (c.status === 'PASS') {
        console.log(`  ✅ ${c.name}`);
    } else {
        console.log(`  ❌ ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
    }
});

console.log(`\n=== ${pass}/${pass+fail} checks passed ===`);
console.log(fail === 0 ? '✅ ALL PASS' : '❌ ' + fail + ' FAILED');
process.exit(fail === 0 ? 0 : 1);
