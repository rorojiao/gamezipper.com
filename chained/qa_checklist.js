#!/usr/bin/env node
/**
 * qa_checklist.js — Code-level QA checklist for Chained.
 * Verifies all required systems, JSON-LD, assets, and features.
 */
const fs = require('fs');

let checks = 0, passed = 0, failed = 0;

function check(name, condition) {
    checks++;
    if (condition) { passed++; console.log(`  ✓ ${name}`); }
    else { failed++; console.log(`  ✗ ${name}`); }
}

const html = fs.readFileSync('index.html', 'utf8');
const iconExists = fs.existsSync('icon.png');
const ogExists = fs.existsSync('og-image.jpg');
const levelsExists = fs.existsSync('levels.json');

console.log('=== Chained QA Checklist ===\n');

// 1. HTML structure
console.log('--- HTML Structure ---');
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('meta charset UTF-8', html.includes('charset="UTF-8"'));
check('meta viewport', html.includes('name="viewport"'));
check('title tag', html.includes('<title>') && html.includes('Chained'));
check('meta description', html.includes('name="description"'));
check('canonical link', html.includes('rel="canonical"') && html.includes('/chained/'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image') && html.includes('/chained/og-image.jpg'));
check('favicon SVG', html.includes('rel="icon"'));
check('gz-sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));

// 2. JSON-LD
console.log('\n--- JSON-LD Structured Data ---');
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('VideoGame name', html.includes('"name":"Chained"'));
check('FAQPage Q&A', html.includes('"acceptedAnswer"'));
check('BreadcrumbList items', html.includes('"itemListElement"'));

// 3. Game systems
console.log('\n--- Game Systems ---');
check('Canvas element', html.includes('<canvas'));
check('Web Audio API', html.includes('AudioContext') || html.includes('webkitAudioContext'));
check('Music (chords)', html.includes('chords'));
check('SFX system', html.includes('playSfx'));
check('fill SFX', html.includes("'fill'"));
check('erase SFX', html.includes("'erase'"));
check('hint SFX', html.includes("'hint'"));
check('win SFX', html.includes("'win'"));
check('error SFX', html.includes("'error'"));
check('localStorage save', html.includes('localStorage'));
check('Settings panel', html.includes('showSettings'));
check('Music toggle', html.includes('musicOn'));
check('SFX toggle', html.includes('sfxOn'));
check('Auto-check toggle', html.includes('autoCheck'));
check('Hint system', html.includes('hintsLeft'));
check('3 hints per level', html.includes('hintsLeft=3'));
check('Check button', html.includes('btn-check'));
check('Menu button', html.includes('btn-menu'));
check('Hint button', html.includes('btn-hint'));
check('Mode buttons (fill/white/erase)', html.includes('mode-fill') && html.includes('mode-white') && html.includes('mode-erase'));
check('Timer', html.includes('timerInterval') && html.includes('startTimer'));
check('Level select', html.includes('showMenu') && html.includes('level-cell'));
check('Tier grouping', html.includes('tier-header'));
check('3-star ratings', html.includes('stars'));
check('Confetti win', html.includes('confetti') && html.includes('launchConfetti'));
check('Toast messages', html.includes('showToast'));
check('Keyboard support', html.includes('keydown'));
check('Key 1 = fill', html.includes("'1'") && html.includes('fill'));
check('Key 2 = white', html.includes("'2'") && html.includes('white'));
check('Key H = hint', html.includes("'h'") || html.includes("'H'"));
check('Key R = restart', html.includes("'r'") || html.includes("'R'"));
check('Key Enter = check', html.includes('Enter'));
check('Key Esc = menu', html.includes('Escape'));
check('Touch support', html.includes('pointerdown'));
check('Resize handler', html.includes('resize'));

// 4. Level data
console.log('\n--- Level Data ---');
check('levels.json exists', levelsExists);
if (levelsExists) {
    const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
    check('30 levels', levels.length === 30);
    check('5 tiers', new Set(levels.map(l => l.tier)).size === 5);
    check('Beginner tier', levels.some(l => l.tier === 'Beginner'));
    check('Easy tier', levels.some(l => l.tier === 'Easy'));
    check('Medium tier', levels.some(l => l.tier === 'Medium'));
    check('Hard tier', levels.some(l => l.tier === 'Hard'));
    check('Expert tier', levels.some(l => l.tier === 'Expert'));
    check('All have solution', levels.every(l => l.solution && l.solution.length > 0));
    check('All have clues', levels.every(l => l.clues && Object.keys(l.clues).length > 0));
    check('All have R,C', levels.every(l => l.R && l.C));
}

// 5. Art assets
console.log('\n--- Art Assets ---');
check('icon.png exists', iconExists);
if (iconExists) {
    const stat = fs.statSync('icon.png');
    check('icon.png > 1KB', stat.size > 1000);
}
check('og-image.jpg exists', ogExists);
if (ogExists) {
    const stat = fs.statSync('og-image.jpg');
    check('og-image.jpg > 5KB', stat.size > 5000);
}

// 6. External integrations
console.log('\n--- External Integrations ---');
check('gz-analytics.js', html.includes('gz-analytics.js'));
check('game-footer.js', html.includes('game-footer.js'));
check('monetag-manager.js', html.includes('monetag-manager.js'));
check('ad slot div', html.includes('gz-ad-below-game'));
check('gz-topnav', html.includes('gz-topnav'));
check('GameZipper link', html.includes('gamezipper.com'));

// 7. Game logic
console.log('\n--- Game Logic ---');
check('LEVELS array in HTML', html.includes('const LEVELS='));
check('checkWin function', html.includes('function checkWin'));
check('loadLevel function', html.includes('function loadLevel'));
check('draw function', html.includes('function draw'));
check('handleClick function', html.includes('function handleClick'));
check('doWin function', html.includes('function doWin'));
check('getBlocks function', html.includes('function getBlocks'));
check('Solution comparison', html.includes('lv.solution'));

// Summary
console.log('\n=== QA SUMMARY ===');
console.log(`Total: ${checks}, Passed: ${passed}, Failed: ${failed}`);
console.log(failed === 0 ? '\n✅ ALL CHECKS PASSED' : `\n❌ ${failed} CHECKS FAILED`);
process.exit(failed === 0 ? 0 : 1);
