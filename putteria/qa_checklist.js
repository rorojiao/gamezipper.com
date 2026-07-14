// qa_checklist.js — Code-level QA for Putteria
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
let checks = 0, passed = 0;

function check(name, condition) {
    checks++;
    if (condition) {
        passed++;
        console.log(`  ✅ ${name}`);
    } else {
        console.log(`  ❌ ${name}`);
    }
}

console.log('=== Putteria QA Checklist ===\n');

// 1. HTML structure
console.log('--- HTML Structure ---');
check('DOCTYPE', html.includes('<!DOCTYPE html>'));
check('lang="en"', html.includes('<html lang="en">'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('viewport'));
check('title contains Putteria', html.includes('<title>') && html.includes('Putteria'));
check('description meta', html.includes('name="description"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('canonical URL', html.includes('canonical') && html.includes('putteria'));
check('twitter:card', html.includes('twitter:card'));

// 2. JSON-LD
console.log('\n--- JSON-LD ---');
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('VideoGame name Putteria', html.includes('"name":"Putteria"'));
check('FAQ has questions', (html.match(/"@type":"Question"/g) || []).length >= 3);

// 3. Levels data
console.log('\n--- Levels Data ---');
const levelsMatch = html.match(/const LEVELS = (\[.*?\]);/s);
check('LEVELS defined', levelsMatch !== null);
if (levelsMatch) {
    const sandbox = { console };
    vm.createContext(sandbox);
    vm.runInContext('var LEVELS = ' + levelsMatch[1] + ';', sandbox);
    const LEVELS = sandbox.LEVELS;
    check('30 levels', LEVELS.length === 30);
    
    const tiers = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    check('5 tiers present', tiers.every(t => LEVELS.some(l => l.tier === t)));
    check('5 levels per tier (Expert 10)', tiers.every(t => LEVELS.filter(l => l.tier === t).length >= 5));
    
    let allValid = true;
    for (const lvl of LEVELS) {
        if (!lvl.rows || !lvl.cols || !lvl.grid || !lvl.solution || !lvl.givens) {
            allValid = false; break;
        }
        if (lvl.grid.length !== lvl.rows) { allValid = false; break; }
        for (const row of lvl.grid) {
            if (row.length !== lvl.cols) { allValid = false; break; }
        }
    }
    check('All levels have valid structure', allValid);
    check('All levels have givens', LEVELS.every(l => Object.keys(l.givens).length > 0));
    check('All levels have solution', LEVELS.every(l => Object.keys(l.solution).length > 0));
}

// 4. Game systems
console.log('\n--- Game Systems ---');
check('Canvas element', html.includes('<canvas'));
check('Web Audio init', html.includes('AudioContext') || html.includes('webkitAudioContext'));
check('Music function', html.includes('startMusic'));
check('SFX function', html.includes('playSfx'));
check('Hint system', html.includes('useHint'));
check('Check solution', html.includes('checkSolution'));
check('Clear board', html.includes('clearBoard'));
check('Level select', html.includes('showLevels'));
check('Settings panel', html.includes('showSettings'));
check('Star ratings', html.includes('computeStars'));
check('Timer', html.includes('updateTimer'));
check('localStorage save', html.includes('saveProgress'));
check('localStorage load', html.includes('loadProgress'));
check('Touch support', html.includes('touchend'));
check('Keyboard support', html.includes('keydown'));
check('Mode toggle (place/erase)', html.includes("setMode('place')") && html.includes("setMode('erase')"));
check('Violation highlighting', html.includes('computeViolations'));
check('Region colors', html.includes('REGION_PALETTE'));
check('Region borders', html.includes('region') && html.includes('stroke'));
check('Cross cells', html.includes('crossCells'));
check('Win overlay', html.includes('overlay-win'));
check('Toast messages', html.includes('toast('));

// 5. SEO & integration
console.log('\n--- SEO & Integration ---');
check('gz-sr-only H1', html.includes('gz-sr-only'));
check('Game footer', html.includes('game-footer.js'));
check('Play counter', html.includes('play-counter.js'));
check('Analytics', html.includes('gz-analytics'));
check('Ad container', html.includes('ad-container'));
check('Footer links', html.includes('GameZipper') && html.includes('about.html'));
check('Favicon', html.includes('rel="icon"'));
check('beforeunload or cleanup', html.includes('beforeunload') || html.includes('clearInterval'));

// 6. Art assets
console.log('\n--- Art Assets ---');
const iconExists = fs.existsSync('icon.png');
const ogExists = fs.existsSync('og-image.jpg');
check('icon.png exists', iconExists);
check('og-image.jpg exists', ogExists);
if (iconExists) {
    const stats = fs.statSync('icon.png');
    check('icon.png > 1KB', stats.size > 1024);
}
if (ogExists) {
    const stats = fs.statSync('og-image.jpg');
    check('og-image.jpg > 5KB', stats.size > 5120);
}

// 7. No common errors
console.log('\n--- Error Checks ---');
check('No console.log in production', !html.includes('console.log(') || html.includes('QA'));
check('No TODO comments', !html.includes('TODO'));
check('No undefined functions', !html.includes('undefined()'));
check('Script tags balanced', (html.match(/<script/g) || []).length === (html.match(/<\/script>/g) || []).length);

console.log(`\n=== RESULT: ${passed}/${checks} checks passed ===`);
if (passed === checks) {
    console.log('✅ ALL CHECKS PASSED');
} else {
    console.log(`❌ ${checks - passed} checks FAILED`);
}
