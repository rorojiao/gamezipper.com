// qa_checklist.js — Code-level QA checklist for Myopia
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('myopia/index.html', 'utf8');
let pass = 0, fail = 0;
const results = [];

function check(name, cond) {
    if (cond) { pass++; results.push(`✅ ${name}`); }
    else { fail++; results.push(`❌ ${name}`); }
}

// 1. HTML structure
check('Has <!DOCTYPE html>', html.includes('<!DOCTYPE html>'));
check('Has <html lang="en">', html.includes('<html lang="en">'));
check('Has viewport meta', html.includes('viewport'));
check('Has canonical link', html.includes('rel="canonical"'));
check('Has theme-color', html.includes('theme-color'));

// 2. SEO meta tags
check('Has title with Myopia', html.includes('<title>') && html.includes('Myopia'));
check('Has meta description', html.includes('name="description"'));
check('Has meta keywords', html.includes('name="keywords"'));
check('Has og:title', html.includes('og:title'));
check('Has og:description', html.includes('og:description'));
check('Has og:image', html.includes('og:image'));
check('Has og:url', html.includes('og:url'));
check('Has twitter:card', html.includes('twitter:card'));

// 3. JSON-LD structured data
check('Has VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('Has FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('Has HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('Has BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('Has gz-sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));

// 4. Game functionality
check('Has canvas element', html.includes('<canvas'));
check('Has LEVELS array', html.includes('var LEVELS='));
check('Has init() function', html.includes('function init('));
check('Has loadLevel function', html.includes('function loadLevel('));
check('Has checkSolution function', html.includes('function checkSolution('));
check('Has useHint function', html.includes('function useHint('));
check('Has clearBoard function', html.includes('function clearBoard('));
check('Has setMode function', html.includes('function setMode('));
check('Has level select', html.includes('level-select'));
check('Has settings panel', html.includes('settings-panel'));
check('Has win overlay', html.includes('win-overlay'));

// 5. Audio
check('Has Web Audio setup', html.includes('AudioContext'));
check('Has playSfx function', html.includes('function playSfx('));
check('Has startMusic function', html.includes('function startMusic('));
check('Has stopMusic function', html.includes('function stopMusic('));
check('Has win SFX', html.includes("'win'"));
check('Has draw SFX', html.includes("'draw'"));
check('Has hint SFX', html.includes("'hint'"));

// 6. Persistence
check('Has localStorage save', html.includes('localStorage.setItem'));
check('Has localStorage load', html.includes('localStorage.getItem'));
check('Saves progress', html.includes('myopia_progress'));
check('Saves settings', html.includes('myopia_settings'));
check('Saves current level', html.includes('myopia_current'));

// 7. Level data integrity
const match = html.match(/var LEVELS=(\[[\s\S]*?\]);/);
check('LEVELS extractable', !!match);
if (match) {
    const sandbox = {};
    vm.createContext(sandbox);
    try {
        vm.runInContext('var LEVELS = ' + match[1] + ';', sandbox);
        const levels = sandbox.LEVELS;
        check('Has 30 levels', levels.length === 30);
        check('All levels have rows', levels.every(l => l.rows > 0));
        check('All levels have cols', levels.every(l => l.cols > 0));
        check('All levels have edges', levels.every(l => l.edges.length > 0));
        check('All levels have clues', levels.every(l => Object.keys(l.clues).length > 0));
        check('All levels have tier', levels.every(l => l.tier));
        check('Has 5 tiers', new Set(levels.map(l => l.tier)).size === 5);
        check('Levels numbered 1-30', levels.every((l, i) => l.level === i + 1));
    } catch (e) {
        check('LEVELS parse OK', false);
    }
}

// 8. Monetization + Analytics
check('Has gz-analytics script', html.includes('gz-analytics.js'));
check('Has game-footer script', html.includes('game-footer.js'));
check('Has monetag script', html.includes('monetag-manager.js'));
check('Has gz-ad-below-game div', html.includes('gz-ad-below-game'));

// 9. No obvious JS errors
check('No unclosed script tags', (html.match(/<script/g) || []).length === (html.match(/<\/script>/g) || []).length);

// 10. Keyboard support
check('Has keyboard handler', html.includes('addEventListener(\'keydown\''));

// Output
results.forEach(r => console.log(r));
console.log(`\n${pass}/${pass + fail} checks passed (${fail} failed)`);
process.exit(fail > 0 ? 1 : 0);
