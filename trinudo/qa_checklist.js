// Trinudo QA Checklist — code-level verification
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
let pass = 0, fail = 0;

function check(name, condition) {
    if (condition) { pass++; }
    else { fail++; console.log(`FAIL: ${name}`); }
}

// 1. Essential HTML structure
check('DOCTYPE', html.includes('<!DOCTYPE html>'));
check('lang attribute', html.includes('<html lang="en">'));
check('charset meta', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('viewport'));
check('title with game name', html.includes('<title>Trinudo'));
check('meta description', html.includes('name="description"'));
check('meta keywords', html.includes('name="keywords"'));
check('canonical link', html.includes('rel="canonical"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('og:url', html.includes('og:url'));
check('twitter:card', html.includes('twitter:card'));

// 2. JSON-LD structured data
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"') || html.includes('"@type": "VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"'));

// 3. Icons
check('icon.png favicon', html.includes('icon.png'));
check('apple-touch-icon', html.includes('apple-touch-icon'));

// 4. Game systems
check('LEVELS data', html.includes('var LEVELS'));
check('Canvas element', html.includes('<canvas'));
check('Web Audio API', html.includes('AudioContext'));
check('BGM function', html.includes('startBGM'));
check('SFX functions', html.includes('sfxPlace') && html.includes('sfxWin') && html.includes('sfxError'));
check('Hint system', html.includes('hintsLeft'));
check('Star ratings', html.includes('stars'));
check('Level select', html.includes('showLevelSelect'));
check('Settings panel', html.includes('settings-modal'));
check('Auto-check toggle', html.includes('autocheck'));
check('localStorage save', html.includes('localStorage'));
check('Keyboard support', html.includes('keydown'));
check('Touch/pointer support', html.includes('pointerdown'));
check('Confetti win effect', html.includes('confetti'));
check('Toast messages', html.includes('showToast'));
check('Timer', html.includes('timerInterval'));
check('beforeunload cleanup', html.includes('beforeunload'));
check('Region computation', html.includes('computeRegions'));
check('Violation checking', html.includes('checkViolations'));
check('isSolved function', html.includes('function isSolved'));

// 5. Ad + footer integration
check('Monetag integration', html.includes('monetag-manager.js'));
check('Adsterra integration', html.includes('adsterra-manager.js'));
check('Game footer', html.includes('game-footer.js'));
check('Analytics', html.includes('gz-analytics.js'));

// 6. Level count
const levelMatch = html.match(/var LEVELS\s*=\s*(\[.*?\]);/s);
if (levelMatch) {
    const levels = JSON.parse(levelMatch[1]);
    check('30 levels', levels.length === 30);
    check('5 tiers', new Set(levels.map(l => l.tier)).size === 5);
    check('Beginner tier', levels.some(l => l.tier === 'Beginner'));
    check('Easy tier', levels.some(l => l.tier === 'Easy'));
    check('Medium tier', levels.some(l => l.tier === 'Medium'));
    check('Hard tier', levels.some(l => l.tier === 'Hard'));
    check('Expert tier', levels.some(l => l.tier === 'Expert'));
    check('All have solution', levels.every(l => l.solution));
    check('All have clues', levels.every(l => l.clues));
    check('All have rows/cols', levels.every(l => l.rows && l.cols));
    
    // Verify all clues are consistent with solutions
    let cluesOk = true;
    for (const lvl of levels) {
        for (let r = 0; r < lvl.rows; r++) {
            for (let c = 0; c < lvl.cols; c++) {
                if (lvl.clues[r][c] !== 0 && lvl.clues[r][c] !== lvl.solution[r][c]) {
                    cluesOk = false;
                }
            }
        }
    }
    check('Clues match solutions', cluesOk);
    
    // Verify all solutions use only 1-3
    let valsOk = true;
    for (const lvl of levels) {
        for (let r = 0; r < lvl.rows; r++) {
            for (let c = 0; c < lvl.cols; c++) {
                if (lvl.solution[r][c] < 1 || lvl.solution[r][c] > 3) valsOk = false;
            }
        }
    }
    check('Solution values 1-3 only', valsOk);
}

// 7. Accessibility
check('sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));

// 8. Responsive design
check('max-width container', html.includes('max-width:640px'));
check('mobile media query', html.includes('@media(max-width:480px)'));

console.log(`\n${pass}/${pass+fail} checks passed`);
if (fail > 0) {
    console.log(`${fail} FAILED`);
    process.exit(1);
} else {
    console.log('✅ ALL CHECKS PASSED');
}
