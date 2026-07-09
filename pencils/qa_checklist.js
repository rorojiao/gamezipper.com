// QA Checklist for Pencils puzzle game
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

let checks = 0;
let passed = 0;
let failed = [];

function check(name, condition) {
    checks++;
    if (condition) {
        passed++;
        console.log(`  ✅ ${name}`);
    } else {
        failed.push(name);
        console.log(`  ❌ ${name}`);
    }
}

console.log('=== Pencils QA Checklist ===\n');

// 1. HTML Structure
console.log('1. HTML Structure:');
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('UTF-8 charset', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('viewport'));
check('title tag', html.includes('<title>') && html.includes('Pencils'));
check('canonical link', html.includes('canonical'));
check('og:image', html.includes('og:image'));
check('theme-color', html.includes('theme-color'));

// 2. SEO / JSON-LD
console.log('\n2. SEO / JSON-LD:');
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('gz-sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));

// 3. Game Systems
console.log('\n3. Game Systems:');
check('Canvas element', html.includes('gameCanvas'));
check('LEVELS data', html.includes('const LEVELS'));
check('Level count = 30', levels.length === 30);
check('loadLevel function', html.includes('function loadLevel'));
check('render function', html.includes('function render'));
check('checkWin function', html.includes('function checkWin'));
check('Hint system', html.includes('function doHint'));
check('Restart', html.includes('function doRestart'));
check('Undo', html.includes('function doUndo'));
check('Erase mode', html.includes('function doErase'));
check('Level select', html.includes('function showLevelSelect'));
check('Settings panel', html.includes('function showSettings'));
check('Star ratings', html.includes('star-filled'));
check('Confetti', html.includes('function spawnConfetti'));
check('localStorage save', html.includes('saveProgress'));
check('Keyboard support', html.includes('keydown'));

// 4. Audio
console.log('\n4. Audio:');
check('Web Audio init', html.includes('function initAudio'));
check('SFX draw', html.includes('function sfxDraw'));
check('SFX win', html.includes('function sfxWin'));
check('SFX error', html.includes('function sfxError'));
check('BGM start', html.includes('function startBgm'));
check('BGM stop', html.includes('function stopBgm'));
check('Chord progression', html.includes('chords'));

// 5. Integration
console.log('\n5. Integration:');
check('Monetag script', html.includes('monetag-manager.js'));
check('gz-analytics', html.includes('gz-analytics.js'));
check('game-footer', html.includes('game-footer.js'));
check('gz-ad-below-game', html.includes('gz-ad-below-game'));
check('gz-topnav', html.includes('gz-topnav'));

// 6. Level Data Validation
console.log('\n6. Level Data:');
const tiers = {};
levels.forEach(lv => {
    tiers[lv.tier] = (tiers[lv.tier] || 0) + 1;
});
check('Beginner tier (6 levels)', tiers['Beginner'] === 6);
check('Easy tier (6 levels)', tiers['Easy'] === 6);
check('Medium tier (6 levels)', tiers['Medium'] === 6);
check('Hard tier (6 levels)', tiers['Hard'] === 6);
check('Expert tier (6 levels)', tiers['Expert'] === 6);
check('All levels have pencils', levels.every(lv => lv.pencils.length > 0));
check('All pencils have tips', levels.every(lv => lv.pencils.every(p => p.tip && p.tip.length === 2)));
check('All pencils have bodies', levels.every(lv => lv.pencils.every(p => p.body && p.body.length > 0)));
check('All pencils have solution lines', levels.every(lv => lv.pencils.every(p => p.solution_line && p.solution_line.length === p.number)));

// 7. Full Coverage Verification
console.log('\n7. Coverage:');
let allCovered = true;
levels.forEach((lv, idx) => {
    const grid = Array(lv.rows).fill(null).map(() => Array(lv.cols).fill(false));
    for (const p of lv.pencils) {
        for (const c of p.body) grid[c[0]][c[1]] = true;
        for (const c of p.solution_line) grid[c[0]][c[1]] = true;
    }
    const covered = grid.flat().filter(x => x).length;
    if (covered !== lv.rows * lv.cols) {
        allCovered = false;
        console.log(`  ❌ Level ${idx+1}: ${covered}/${lv.rows*lv.cols} covered`);
    }
});
check('All 30 levels fully covered', allCovered);

// Summary
console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed}/${checks} checks passed`);
if (failed.length > 0) {
    console.log('FAILED:');
    failed.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
} else {
    console.log('✅ ALL CHECKS PASSED');
}
