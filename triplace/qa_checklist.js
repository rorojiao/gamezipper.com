// qa_checklist.js — Code-level QA for Triplace
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}`); }
}

console.log('=== Triplace QA Checklist ===\n');

// 1. HTML structure
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('lang attribute', html.includes('<html lang="en">'));
check('meta viewport', html.includes('name="viewport"'));
check('meta description', html.includes('name="description"'));
check('canonical URL', html.includes('canonical" href="https://gamezipper.com/triplace/'));
check('og:title', html.includes('og:title'));
check('og:image', html.includes('og:image'));
check('theme-color', html.includes('theme-color'));
check('gz-sr-only H1', html.includes('class="gz-sr-only"'));
check('gz-topnav', html.includes('id="gz-topnav"'));

// 2. JSON-LD
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));

// 3. Game systems
check('Canvas element', html.includes('id="gameCanvas"'));
check('AudioContext init', html.includes('new (window.AudioContext'));
check('startMusic function', html.includes('function startMusic'));
check('stopMusic function', html.includes('function stopMusic'));
check('playSfx function', html.includes('function playSfx'));
check('sfxPaint defined', html.includes('function sfxPaint'));
check('sfxErase defined', html.includes('function sfxErase'));
check('sfxWin defined', html.includes('function sfxWin'));
check('sfxError defined', html.includes('function sfxError'));
check('sfxHint defined', html.includes('function sfxHint'));

// 4. Game logic
check('LEVELS data', html.includes('const LEVELS='));
check('loadLevel function', html.includes('function loadLevel'));
check('render function', html.includes('function render'));
check('handlePaint function', html.includes('function handlePaint'));
check('isComplete function', html.includes('function isComplete'));
check('checkSolution function', html.includes('function checkSolution'));
check('onWin function', html.includes('function onWin'));
check('giveHint function', html.includes('function giveHint'));
check('restartLevel function', html.includes('function restartLevel'));

// 5. UI elements
check('Level select', html.includes('id="levelSelect"'));
check('Settings panel', html.includes('id="settings"'));
check('Hint button', html.includes('id="btnHint"'));
check('Check button', html.includes('id="btnCheck"'));
check('Restart button', html.includes('id="btnRestart"'));
check('Mode bar (Draw/New/Erase)', html.includes('id="btnDraw"') && html.includes('id="btnNew"') && html.includes('id="btnErase"'));
check('HUD pieces counter', html.includes('id="hudPieces"'));
check('HUD timer', html.includes('id="hudTime"'));
check('Star ratings', html.includes('star-filled') && html.includes('star-empty'));

// 6. Persistence
check('localStorage settings', html.includes("localStorage.getItem('triplace_settings'"));
check('localStorage progress', html.includes("localStorage.getItem('triplace_progress'"));

// 7. Touch/pointer support
check('pointerdown event', html.includes('pointerdown'));
check('pointermove event', html.includes('pointermove'));
check('pointerup event', html.includes('pointerup'));
check('touch-action none', html.includes('touch-action:none'));

// 8. Keyboard support
check('keydown listener', html.includes("addEventListener('keydown'"));
check('Escape key', html.includes("e.key==='Escape'"));
check('H for hint', html.includes("e.key==='h'||e.key==='H'"));
check('R for restart', html.includes("e.key==='r'||e.key==='R'"));
check('Enter for check', html.includes("e.key==='Enter'"));

// 9. Footer/analytics
check('game-footer.js', html.includes('game-footer.js'));
check('gz-analytics.js', html.includes('gz-analytics.js'));

// 10. beforeunload cleanup
check('beforeunload cleanup', html.includes('beforeunload'));

// Count LEVELS
const levelsMatch = html.match(/const LEVELS=(\[.*?\]);/s);
if (levelsMatch) {
    try {
        const levels = eval(levelsMatch[1]);
        check(`30 levels present (${levels.length} found)`, levels.length === 30);
        check('All levels have rows', levels.every(l => l.r > 0));
        check('All levels have cols', levels.every(l => l.c > 0));
        check('All levels have blacks', levels.every(l => l.b.length > 0));
        check('All levels have clues', levels.every(l => l.k.length > 0));
        check('All levels have solution', levels.every(l => l.s !== undefined));
    } catch(e) {
        check('LEVELS parseable', false);
    }
}

// Count functions
check('isConnected helper', html.includes('function isConnected'));
check('countGroup helper', html.includes('function countGroup'));
check('eraseCell helper', html.includes('function eraseCell'));
check('isAdjacentToGroup helper', html.includes('function isAdjacentToGroup'));
check('updatePieceCount helper', html.includes('function updatePieceCount'));
check('formatTime helper', html.includes('function formatTime'));
check('showToast helper', html.includes('function showToast'));
check('buildLevelSelect helper', html.includes('function buildLevelSelect'));

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
