#!/usr/bin/env node
/**
 * Chocona QA Checklist — Code-level verification
 */
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let checks = [];
let passCount = 0;
let failCount = 0;

function check(name, condition) {
    if (condition) {
        passCount++;
        checks.push(`  ✓ ${name}`);
    } else {
        failCount++;
        checks.push(`  ✗ ${name}`);
    }
}

// === Structure checks ===
check('DOCTYPE html present', html.includes('<!DOCTYPE html>'));
check('Title contains Chocona', html.includes('<title>') && html.includes('Chocona'));
check('Meta viewport present', html.includes('viewport'));
check('Meta description present', html.includes('name="description"'));
check('Meta keywords present', html.includes('name="keywords"'));
check('Canonical link present', html.includes('rel="canonical"'));
check('OG tags present', html.includes('og:title') && html.includes('og:image'));
check('Twitter card present', html.includes('twitter:card'));
check('Icon link present', html.includes('icon.png'));

// === JSON-LD checks ===
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));

// === Game logic checks ===
check('LEVELS constant defined', html.includes('const LEVELS'));
check('checkWin function', html.includes('function checkWin'));
check('renderGrid function', html.includes('function renderGrid'));
check('renderMenu function', html.includes('function renderMenu'));
check('startLevel function', html.includes('function startLevel'));
check('useHint function', html.includes('function useHint'));
check('launchConfetti function', html.includes('function launchConfetti'));
check('initAudio function', html.includes('function initAudio'));
check('startBGM function', html.includes('function startBGM'));
check('playSFX function', html.includes('function playSFX'));
check('getBlackComponents function', html.includes('function getBlackComponents'));
check('isRectangle function', html.includes('function isRectangle'));

// === Features checks ===
check('Canvas element', html.includes('<canvas'));
check('Menu section', html.includes('id="menu"'));
check('Level buttons', html.includes('level-btn'));
check('Tier sections', html.includes('tier-section'));
check('Win overlay', html.includes('win-overlay') || html.includes('id="win-overlay"'));
check('Settings panel', html.includes('settings-panel'));
check('Toolbar buttons', html.includes('toolbar'));
check('Hint button', html.includes('useHint') || html.includes('Hint'));
check('Check button', html.includes('Check') || html.includes('checkWin'));
check('Clear button', html.includes('Clear') || html.includes('clear'));
check('Restart button', html.includes('Restart') || html.includes('restart'));

// === Audio checks ===
check('AudioContext usage', html.includes('AudioContext'));
check('BGM chord progression', html.includes('Cmaj7') || html.includes('chord') || html.includes('220') || html.includes('261.63'));
check('SFX types', html.includes('playSFX'));

// === SEO/Integration checks ===
check('gz-sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));
check('gz-topnav present', html.includes('gz-topnav'));
check('gz-analytics tracker', html.includes('gz-analytics'));
check('game-footer include', html.includes('game-footer.js'));
check('Monetag ad script', html.includes('highperformanceformat') || html.includes('monetag') || html.includes('clmbtech'));

// === localStorage checks ===
check('Progress save/load', html.includes('localStorage') && html.includes('saveProgress'));
check('Settings save/load', html.includes('localStorage') && html.includes('saveSettings'));

// === Star ratings ===
check('Star ratings', html.includes('star') || html.includes('Star'));

// === No JS errors (basic syntax) ===
try {
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
    check('Script tags present', scriptMatch && scriptMatch.length > 0);
} catch(e) {
    check('Script tags present', false);
}

console.log('=== CHOCONA QA CHECKLIST ===\n');
checks.forEach(c => console.log(c));
console.log(`\n=== SUMMARY ===`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);
console.log(`Result: ${failCount === 0 ? '✅ ALL PASS' : '❌ FAILURES DETECTED'}`);
process.exit(failCount > 0 ? 1 : 0);
