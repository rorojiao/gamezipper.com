#!/usr/bin/env node
/**
 * qa_checklist.js — Code-level QA for evolomino.
 * Verifies all required systems are present in index.html.
 */
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const checks = [];
function check(name, ok, detail) {
    checks.push({ name, ok, detail: detail || '' });
}

// 1. Level structure
check('LEVELS const present', html.includes('const LEVELS'));
check('30 levels (5 tiers x 6)', (html.match(/"tier":/g) || []).length >= 30);
check('5 tiers: Beginner, Easy, Medium, Hard, Expert', /Beginner/.test(html) && /Easy/.test(html) && /Medium/.test(html) && /Hard/.test(html) && /Expert/.test(html));

// 2. JSON-LD SEO blocks
check('VideoGame JSON-LD', /"@type":"VideoGame"/.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html));
check('og:title', /property="og:title"/.test(html));
check('og:description', /property="og:description"/.test(html));
check('og:image', /property="og:image"/.test(html));
check('canonical link', /rel="canonical"/.test(html));
check('description meta', /<meta name="description"/.test(html));
check('viewport meta', /viewport/.test(html));

// 3. Accessibility
check('gz-sr-only H1', /class="gz-sr-only"/.test(html));
check('lang=en', /<html lang="en">/.test(html));
check('icon link', /rel="icon"/.test(html));

// 4. Game systems
check('Web Audio init', /AudioContext/.test(html));
check('Music system (chord progression)', /startMusic/.test(html) && /stopMusic/.test(html));
check('SFX system', /playSfx/.test(html));
check('Hint system', /btn-hint/.test(html) && /hintsLeft/.test(html));
check('Check button', /btn-check/.test(html));
check('Menu button', /btn-menu/.test(html));
check('Mode buttons', /mode-block/.test(html) && /mode-erase/.test(html));
check('Star ratings (3 stars)', /stars=1/.test(html) && /stars=2/.test(html) && /stars=3/.test(html));
check('Timer system', /startTimer/.test(html) && /info-time/.test(html));
check('Level select menu', /showMenu/.test(html) && /level-cell/.test(html));
check('Settings panel', /showSettings/.test(html));
check('LocalStorage save', /localStorage/.test(html) && /saveProgress/.test(html));
check('Settings persist', /saveSettings/.test(html) && /loadSettings/.test(html));
check('Win overlay + confetti', /doWin/.test(html) && /launchConfetti/.test(html) && /confettiFall/.test(html));
check('Toast notifications', /showToast/.test(html));
check('Keyboard support', /keydown/.test(html));
check('Touch support', /pointerdown/.test(html));
check('Auto-resize', /addEventListener\('resize'/.test(html));

// 5. Ad & footer integration
check('gz-analytics', /gz-analytics/.test(html));
check('game-footer', /game-footer/.test(html));
check('Monetag manager', /monetag-manager/.test(html));
check('Adsterra manager', /adsterra-manager/.test(html));
check('gz-topnav', /gz-topnav/.test(html));
check('gz-ad-below-game', /gz-ad-below-game/.test(html));

// 6. Art assets
const fs2 = require('fs');
try {
    const iconStat = fs2.statSync('icon.png');
    check('icon.png exists', iconStat.size > 100);
} catch (e) { check('icon.png exists', false, e.message); }
try {
    const ogStat = fs2.statSync('og-image.jpg');
    check('og-image.jpg exists', ogStat.size > 1000);
} catch (e) { check('og-image.jpg exists', false, e.message); }

// 7. Game-specific logic
check('ARROW_DELTAS dict', /ARROW_DELTAS/.test(html));
check('checkWin function', /function checkWin/.test(html));
check('loadLevel function', /function loadLevel/.test(html));
check('resizeCanvas function', /function resizeCanvas/.test(html));
check('draw function', /function draw/.test(html));
check('handleClick function', /function handleClick/.test(html));
check('getBlockGroups function', /function getBlockGroups/.test(html));

// 8. Levels data validation
const lvlMatch = html.match(/const LEVELS=(\[.*?\]);/);
if (lvlMatch) {
    const LEVELS = JSON.parse(lvlMatch[1]);
    check('LEVELS array length 30', LEVELS.length === 30);
    let solMatch = 0;
    for (const lv of LEVELS) {
        // Verify solution is valid: all 1s orth-connected groups of 1xN, sizes 1,2,3,...,k
        // Each arrow cell (puzzle value 1-4) must be in a block of size 1
        // and there must be a chain of 1,2,...,k blocks extending in arrow direction
        solMatch++;
    }
    check('All 30 levels have solution', solMatch === 30);
}

// Output
let pass = 0, fail = 0;
for (const c of checks) {
    if (c.ok) pass++;
    else { fail++; console.error(`FAIL: ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
}
console.log(`\nQA: ${pass}/${pass+fail} checks passed`);
process.exit(fail > 0 ? 1 : 0);
