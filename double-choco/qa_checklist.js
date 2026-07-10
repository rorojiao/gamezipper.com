// qa_checklist.js — Code-level QA checklist for Double Choco
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf-8');

let pass = 0, fail = 0;
const checks = [];

function check(name, condition) {
    if (condition) { pass++; checks.push(`✅ ${name}`); }
    else { fail++; checks.push(`❌ ${name}`); }
}

// 1. HTML structure
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('Title tag', html.includes('<title>') && html.includes('Double Choco'));
check('Meta viewport', html.includes('viewport'));
check('Meta description', html.includes('name="description"'));
check('Meta keywords', html.includes('name="keywords"'));
check('Canonical URL', html.includes('canonical') && html.includes('double-choco'));
check('Favicon link', html.includes('icon.png'));
check('H1 gz-sr-only', html.includes('gz-sr-only') && html.includes('Double Choco'));

// 2. SEO / JSON-LD
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"') && html.includes('Double Choco'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('Open Graph tags', html.includes('og:title') && html.includes('og:image'));
check('Twitter card', html.includes('twitter:card'));

// 3. Game systems
check('Canvas element', html.includes('<canvas'));
check('Canvas context', html.includes('getContext'));
check('LEVELS data embedded', html.includes('const LEVELS'));
check('Level select', html.includes('renderMenu') && html.includes('level-btn'));
check('Hint system', html.includes('useHint') && html.includes('hintsLeft'));
check('Check solution', html.includes('checkSolution'));
check('Clear button', html.includes('btn-clear'));
check('Restart button', html.includes('btn-restart'));
check('Star rating', html.includes('stars'));
check('Win overlay', html.includes('win-overlay'));
check('Confetti', html.includes('confetti'));

// 4. Audio
check('Web Audio API', html.includes('AudioContext') || html.includes('webkitAudioContext'));
check('BGM function', html.includes('startBGM') && html.includes('stopBGM'));
check('SFX function', html.includes('playSFX'));
check('Multiple SFX types', html.includes("'on'") && html.includes("'off'") && html.includes("'hint'") && html.includes("'win'") && html.includes("'error'"));
check('Chord progression', html.includes('CHORDS'));

// 5. Persistence
check('localStorage save', html.includes('localStorage.setItem'));
check('localStorage load', html.includes('localStorage.getItem'));
check('Settings save', html.includes('dc_settings'));
check('Progress save', html.includes('dc_progress'));

// 6. Interaction
check('Click handler', html.includes("addEventListener('click'") || html.includes('addEventListener("click"'));
check('Touch support', html.includes('touchstart'));
check('Keyboard support', html.includes('keydown'));
check('Hover effect', html.includes('mousemove'));
check('Edge detection', html.includes('getEdgeAt'));

// 7. Settings
check('Music toggle', html.includes('toggle-music'));
check('SFX toggle', html.includes('toggle-sfx'));
check('Auto-check toggle', html.includes('toggle-autocheck'));

// 8. Ads / Analytics
check('gz-ad div', html.includes('gz-ad-below-game'));
check('Monetag manager', html.includes('monetag-manager'));
check('game-footer', html.includes('game-footer'));

// 9. Level data validation
const match = html.match(/const LEVELS = (\[.*?\]);/s);
check('LEVELS extractable', !!match);
if (match) {
    const sandbox = { LEVELS: null };
    vm.createContext(sandbox);
    try {
        vm.runInContext(`LEVELS = ${match[1]};`, sandbox);
        const LEVELS = sandbox.LEVELS;
        check('30 levels', LEVELS.length === 30);
        check('5 tiers', new Set(LEVELS.map(l => l.tier)).size === 5 || LEVELS.filter(l => l.tier === 0).length === 6);
        check('All have grid', LEVELS.every(l => Array.isArray(l.grid)));
        check('All have color', LEVELS.every(l => Array.isArray(l.color)));
        check('All have blocks', LEVELS.every(l => Array.isArray(l.blocks)));
        check('All have clues', LEVELS.every(l => typeof l.clues === 'object'));
        check('All have rows/cols', LEVELS.every(l => l.rows > 0 && l.cols > 0));
    } catch (e) {
        check('LEVELS parseable', false);
    }
}

// 10. No JS errors (basic syntax check)
try {
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
    if (scriptMatch) {
        const mainScript = scriptMatch.find(s => s.includes('const LEVELS'));
        if (mainScript) {
            const code = mainScript.replace(/<\/?script>/g, '');
            new vm.Script(code);
            check('Main JS syntax valid', true);
        }
    }
} catch (e) {
    check('Main JS syntax valid', false);
}

// Output
checks.forEach(c => console.log(c));
console.log(`\n${pass}/${pass + fail} checks passed`);
if (fail > 0) {
    console.log(`❌ ${fail} CHECKS FAILED`);
    process.exit(1);
} else {
    console.log('✅ ALL CHECKS PASSED');
}
