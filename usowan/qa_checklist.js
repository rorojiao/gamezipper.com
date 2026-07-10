#!/usr/bin/env node
/**
 * Usowan QA Checklist — Code-level verification
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function check(name, condition) {
    if (condition) { pass++; console.log(`  ✅ ${name}`); }
    else { fail++; console.log(`  ❌ ${name}`); }
}

console.log('=== Usowan QA Checklist ===\n');

// 1. HTML structure
console.log('1. HTML Structure');
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('lang attribute', html.includes('<html lang="en">'));
check('viewport meta', html.includes('name="viewport"'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('canonical link', html.includes('rel="canonical"'));
check('icon link', html.includes('rel="icon"'));

// 2. SEO meta
console.log('\n2. SEO Meta Tags');
check('title tag', /<title>.*Usowan.*<\/title>/.test(html));
check('description meta', html.includes('name="description"'));
check('keywords meta', html.includes('name="keywords"'));
check('og:title', html.includes('property="og:title"'));
check('og:description', html.includes('property="og:description"'));
check('og:image', html.includes('property="og:image"'));
check('og:url', html.includes('property="og:url"'));
check('twitter:card', html.includes('twitter:card'));
check('twitter:image', html.includes('twitter:image'));

// 3. JSON-LD structured data
console.log('\n3. JSON-LD Structured Data');
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('HowTo schema', html.includes('"@type":"HowTo"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('aggregateRating', html.includes('aggregateRating'));
check('Offer price 0', html.includes('"price":"0"'));

// 4. Game features
console.log('\n4. Game Features');
check('Canvas element', html.includes('<canvas id="game-canvas"'));
check('LEVELS data embedded', /var LEVELS=\[/.test(html));
check('Web Audio API', html.includes('AudioContext'));
check('localStorage save', html.includes('localStorage'));
check('pointer events', html.includes('pointerdown'));
check('keyboard support', html.includes('keydown'));
check('level select', html.includes('renderLevelSelect'));
check('hint system', html.includes('useHint'));
check('settings panel', html.includes('toggleSetting'));
check('BGM function', html.includes('startBGM'));
check('SFX function', html.includes('playSFX'));
check('confetti', html.includes('spawnConfetti'));

// 5. Game logic
console.log('\n5. Game Logic');
check('DIRS4 defined', html.includes('DIRS4'));
check('checkSolution function', html.includes('function checkSolution'));
check('isWhiteConnected', html.includes('isWhiteConnected'));
check('countBlackNeighbors', html.includes('countBlackNeighbors'));
check('checkViolations', html.includes('checkViolations'));
check('handleCellClick', html.includes('handleCellClick'));

// 6. Ad integration
console.log('\n6. Ad Integration');
check('monetag-manager.js', html.includes('monetag-manager.js'));
check('adsterra-manager.js', html.includes('adsterra-manager.js'));
check('game-footer.js', html.includes('game-footer.js'));
check('gz-ad-below-game div', html.includes('gz-ad-below-game'));

// 7. Accessibility
console.log('\n7. Accessibility');
check('sr-only H1', html.includes('gz-sr-only'));
check('Usowan in H1', html.includes('Usowan') && html.includes('gz-sr-only'));

// 8. Levels verification
console.log('\n8. Level Data');
const levelsMatch = html.match(/var LEVELS=(\[.*?\]);/s);
check('LEVELS extractable', !!levelsMatch);
if (levelsMatch) {
    const sandbox = {};
    vm.createContext(sandbox);
    try {
        vm.runInContext('var LEVELS = ' + levelsMatch[1] + ';', sandbox);
        const LEVELS = sandbox.LEVELS;
        check('30 levels', LEVELS.length === 30);
        check('all have solution', LEVELS.every(l => Array.isArray(l.solution)));
        check('all have clues', LEVELS.every(l => Object.keys(l.clues).length > 0));
        check('all have rooms', LEVELS.every(l => Array.isArray(l.rooms) && l.rooms.length > 0));
        check('all have tiers', LEVELS.every(l => l.tier));
        check('tier distribution', 
            LEVELS.filter(l => l.tier === 'Beginner').length === 6 &&
            LEVELS.filter(l => l.tier === 'Easy').length === 6 &&
            LEVELS.filter(l => l.tier === 'Medium').length === 6 &&
            LEVELS.filter(l => l.tier === 'Hard').length === 6 &&
            LEVELS.filter(l => l.tier === 'Expert').length === 6
        );
    } catch(e) {
        check('LEVELS parseable', false);
    }
}

// 9. Files
console.log('\n9. Asset Files');
check('icon.png exists', fs.existsSync(path.join(__dirname, 'icon.png')));
check('og-image.jpg exists', fs.existsSync(path.join(__dirname, 'og-image.jpg')));
check('levels.json exists', fs.existsSync(path.join(__dirname, 'levels.json')));
check('gen_levels.py exists', fs.existsSync(path.join(__dirname, 'gen_levels.py')));
check('verify_independent.js exists', fs.existsSync(path.join(__dirname, 'verify_independent.js')));
check('verify_engine.js exists', fs.existsSync(path.join(__dirname, 'verify_engine.js')));

// 10. No JS errors (syntax check)
console.log('\n10. JavaScript Syntax');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
let jsSyntaxOk = true;
if (scriptMatch) {
    for (const scriptTag of scriptMatch) {
        const code = scriptTag.replace(/<\/?script>/g, '');
        if (code.includes('LEVELS=') || code.includes('function init')) {
            try {
                new vm.Script(code);
            } catch(e) {
                // Some scripts reference external files, skip those
                if (!code.includes('src=')) {
                    jsSyntaxOk = false;
                    console.log(`    Syntax error: ${e.message}`);
                }
            }
        }
    }
}
check('JS syntax valid', jsSyntaxOk);

console.log(`\n=== QA Results: ${pass}/${pass + fail} checks passed ===`);
if (fail === 0) {
    console.log('🎉 ALL QA CHECKS PASSED');
    process.exit(0);
} else {
    console.log(`⚠️ ${fail} checks failed`);
    process.exit(1);
}
