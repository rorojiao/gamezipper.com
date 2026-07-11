#!/usr/bin/env node
/**
 * Kazunori — QA Checklist (Phase 7)
 * Code-level verification of all required systems.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let checks = [];
let passCount = 0;
let failCount = 0;

function check(name, condition) {
    const pass = !!condition;
    checks.push({ name, pass });
    if (pass) passCount++; else failCount++;
    console.log(`  ${pass ? '✅' : '❌'} ${name}`);
}

console.log('=== KAZUNORI QA CHECKLIST ===\n');

// 1. HTML structure
check('Has DOCTYPE', html.includes('<!DOCTYPE html>'));
check('Has lang="en"', html.includes('<html lang="en">'));
check('Has viewport meta', html.includes('name="viewport"'));
check('Has charset UTF-8', html.includes('charset="UTF-8"'));

// 2. SEO
check('Has title tag', /<title>[^<]+<\/title>/.test(html));
check('Has meta description', html.includes('name="description"'));
check('Has meta keywords', html.includes('name="keywords"'));
check('Has canonical link', html.includes('rel="canonical"'));
check('Has og:title', html.includes('og:title'));
check('Has og:description', html.includes('og:description'));
check('Has og:image', html.includes('og:image'));
check('Has twitter:card', html.includes('twitter:card'));

// 3. JSON-LD
check('Has VideoGame schema', html.includes('"@type":"VideoGame"') || html.includes('"@type": "VideoGame"'));
check('Has FAQPage schema', html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"'));
check('Has HowTo schema', html.includes('"@type":"HowTo"') || html.includes('"@type": "HowTo"'));
check('Has BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"'));

// 4. Accessibility
check('Has sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));

// 5. Game systems
check('Has Canvas element', html.includes('<canvas'));
check('Has LEVELS data', html.includes('const LEVELS'));
check('Has Web Audio API', html.includes('AudioContext'));
check('Has startLevel function', html.includes('function startLevel'));
check('Has checkSolution function', html.includes('function checkSolution'));
check('Has useHint function', html.includes('function useHint'));
check('Has restartLevel function', html.includes('function restartLevel'));
check('Has goToMenu function', html.includes('function goToMenu'));
check('Has buildMenu function', html.includes('function buildMenu'));
check('Has render function', html.includes('function render'));

// 6. Audio systems
check('Has SFX object', html.includes('const SFX'));
check('Has startMusic function', html.includes('function startMusic'));
check('Has stopMusic function', html.includes('function stopMusic'));
check('Has chord progression', html.includes('CHORDS'));

// 7. Input
check('Has pointer event handling', html.includes('pointerdown'));
check('Has keyboard support', html.includes('addEventListener(\'keydown\''));

// 8. Persistence
check('Has localStorage save', html.includes('localStorage'));
check('Has progress tracking', html.includes('kazunori_progress'));

// 9. UI elements
check('Has number pad', html.includes('number-pad'));
check('Has settings panel', html.includes('settings-panel'));
check('Has toolbar', html.includes('toolbar'));
check('Has overlay (win screen)', html.includes('overlay'));
check('Has toast notifications', html.includes('toast'));
check('Has confetti', html.includes('confetti'));

// 10. Game features
check('Has hints system', html.includes('hintsLeft'));
check('Has star ratings', html.includes('stars'));
check('Has level select', html.includes('level-grid'));
check('Has tier sections', html.includes('tier-section'));
check('Has settings toggles (music)', html.includes('music-toggle'));
check('Has settings toggles (sfx)', html.includes('sfx-toggle'));
check('Has settings toggles (autocheck)', html.includes('autocheck-toggle'));

// 11. Footer
check('Has game footer', html.includes('game-footer'));
check('Footer links to GameZipper', html.includes('gamezipper.com'));

// 12. Icon
check('Has icon link', html.includes('icon.png'));

// 13. 30 levels
// The LEVELS JSON is embedded with template literal concatenation, extract from the JSON data
const levelMatch2 = html.match(/const LEVELS(\s*=\s*)(\[[\s\S]*?\]);/);
let has30Levels = false;
try {
    // Try to extract and parse the levels array
    const startIdx = html.indexOf('const LEVELS');
    const bracketStart = html.indexOf('[', startIdx);
    if (bracketStart !== -1) {
        // Find matching closing bracket
        let depth = 0;
        let endIdx = bracketStart;
        for (let i = bracketStart; i < html.length; i++) {
            if (html[i] === '[') depth++;
            else if (html[i] === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
        }
        const jsonStr = html.substring(bracketStart, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        has30Levels = parsed.length === 30;
    }
} catch(e) { has30Levels = false; }
check('Has 30 levels embedded', has30Levels);

// 14. No broken references
check('No undefined onclick references to missing functions', !html.includes('onclick="undefined'));

console.log(`\n=== QA RESULTS ===`);
console.log(`PASS: ${passCount}/${checks.length}`);
console.log(`FAIL: ${failCount}/${checks.length}`);

if (failCount > 0) {
    console.log('\n❌ FAILED CHECKS:');
    checks.filter(c => !c.pass).forEach(c => console.log(`  ❌ ${c.name}`));
    process.exit(1);
} else {
    console.log('\n✅ ALL QA CHECKS PASSED');
}
