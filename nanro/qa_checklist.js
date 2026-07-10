// Nanro QA Checklist — code-level automated checks
// Run: node qa_checklist.js
const fs = require('fs');
const vm = require('vm');

let passCount = 0, failCount = 0;
const results = [];

function check(name, cond) {
    if (cond) { passCount++; results.push('\u2705 ' + name); }
    else { failCount++; results.push('\u274c ' + name); }
}

try {
    const html = fs.readFileSync('/home/msdn/gamezipper.com/nanro/index.html', 'utf8');

    // 1. HTML Structure
    check('Has DOCTYPE', html.includes('<!DOCTYPE html>'));
    check('Has lang attribute', /<html\s+lang=/.test(html));
    check('Has charset meta', html.includes('charset="UTF-8"') || html.includes('charset=\'UTF-8\''));
    check('Has viewport meta', html.includes('viewport'));
    check('Has canonical link', html.includes('rel="canonical"') || html.includes('rel=\'canonical\''));
    
    // 2. SEO
    check('Has title tag', /<title>.*<\/title>/.test(html));
    check('Has meta description', /name="description"/.test(html));
    check('Has meta keywords', /name="keywords"/.test(html));
    check('Has og:title', html.includes('og:title'));
    check('Has og:description', html.includes('og:description'));
    check('Has og:image', html.includes('og:image'));
    check('Has og:url', html.includes('og:url'));
    check('Has twitter:card', html.includes('twitter:card'));
    
    // 3. Structured Data
    check('Has VideoGame schema', html.includes('"@type":"VideoGame"'));
    check('Has FAQPage schema', html.includes('"@type":"FAQPage"'));
    check('Has HowTo schema', html.includes('"@type":"HowTo"'));
    check('Has BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
    
    // 4. Mobile Support
    check('Has touch-action:none', html.includes('touch-action:none'));
    check('Has user-select:none', html.includes('user-select:none'));
    check('Has theme-color', html.includes('theme-color'));
    check('Has maximum-scale', html.includes('maximum-scale'));
    
    // 5. Canvas Game
    check('Has canvas element', html.includes('<canvas'));
    check('Has getContext', html.includes('getContext'));
    check('Has pointer event handler', html.includes('pointerdown'));
    
    // 6. Game Logic
    check('Has LEVELS data', html.includes('const LEVELS='));
    check('Has init() function', html.includes('function init('));
    check('Has renderGrid() function', html.includes('function renderGrid('));
    check('Has handleClick() function', html.includes('function handleClick('));
    check('Has checkWin() function', html.includes('function checkWin('));
    check('Has startLevel() function', html.includes('function startLevel('));
    check('Has showMenu() function', html.includes('function showMenu('));
    check('Has level select', html.includes('showLevelSelect'));
    check('Has hint system', html.includes('doHint'));
    check('Has check/errors', html.includes('checkErrors') || html.includes('doCheck'));
    check('Has restart', html.includes('doRestart') || html.includes('Restart'));
    
    // 7. Audio
    check('Has AudioContext', html.includes('AudioContext'));
    check('Has playTone function', html.includes('function playTone'));
    check('Has sfxPlace', html.includes('sfxPlace'));
    check('Has sfxError', html.includes('sfxError'));
    check('Has sfxWin', html.includes('sfxWin'));
    check('Has BGM', html.includes('startBGM') && html.includes('stopBGM'));
    check('Has music toggle', html.includes('toggle-music'));
    check('Has sfx toggle', html.includes('toggle-sfx'));
    
    // 8. Persistence
    check('Has localStorage save', html.includes("localStorage.setItem"));
    check('Has localStorage load', html.includes("localStorage.getItem"));
    check('Saves progress', html.includes('saveProgress'));
    check('Loads progress', html.includes('loadProgress'));
    
    // 9. Accessibility & UI
    check('Has sr-only heading', html.includes('sr-only'));
    check('Has back to home link', html.includes('gamezipper.com'));
    check('Has win overlay', html.includes('win-overlay'));
    check('Has settings modal', html.includes('settings-modal'));
    check('Has toast notifications', html.includes('showToast'));
    
    // 10. Ad Integration
    check('Has ad container', html.includes('gz-ad-below-game'));
    check('Has monetag script', html.includes('monetag-manager') || html.includes('monetag'));
    
    // 11. Level Validation
    var match = html.match(/const LEVELS=(\[.*?\]);/);
    if (match) {
        var ctx = { console: console };
        vm.createContext(ctx);
        vm.runInContext('var LEVELS=' + match[1] + ';', ctx);
        var LEVELS = ctx.LEVELS;
        
        check('Has 30 levels', LEVELS.length === 30);
        check('Level 1 is beginner', LEVELS[0] && LEVELS[0].difficulty === 'beginner');
        check('Level 30 is expert', LEVELS[29] && LEVELS[29].difficulty === 'expert');
        check('All have region_map', LEVELS.every(function(l) { return l.region_map; }));
        check('All have solution', LEVELS.every(function(l) { return l.solution; }));
        check('All have clues', LEVELS.every(function(l) { return l.clues; }));
        check('All have rows/cols', LEVELS.every(function(l) { return l.rows && l.cols; }));
        check('All have num_regions', LEVELS.every(function(l) { return l.num_regions; }));
    } else {
        for (var i = 0; i < 8; i++) check('Level data check ' + i, false);
    }
    
    // 12. Performance
    check('No external CSS files', !html.includes('rel="stylesheet"') || html.includes('style>'));
    check('Inline styles', html.includes('<style>'));
    check('Reasonable size (<100KB)', html.length < 102400);
    
} catch (e) {
    check('File readable', false);
    console.log('Error:', e.message);
}

console.log('=== Nanro QA Checklist ===');
console.log('Passed: ' + passCount + '/' + (passCount + failCount));
console.log('Failed: ' + failCount);
console.log('');
results.forEach(function(r) { console.log(r); });
console.log('');
if (failCount === 0) console.log('=== ALL CHECKS PASSED ===');
else { console.log('=== ' + failCount + ' CHECK(S) FAILED ==='); process.exit(1); }
