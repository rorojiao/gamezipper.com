// qa_checklist.js - Code-level QA checklist for Tilepaint
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let checks = 0;
let passed = 0;
let errors = [];

function check(name, condition) {
  checks++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    errors.push(name);
    console.log(`  ❌ ${name}`);
  }
}

console.log('=== Tilepaint QA Checklist ===\n');

// 1. Required HTML structure
console.log('1. HTML Structure:');
check('Has DOCTYPE', html.includes('<!DOCTYPE html>'));
check('Has <html> with lang', html.includes('<html lang="en">'));
check('Has viewport meta', html.includes('name="viewport"'));
check('Has theme-color meta', html.includes('name="theme-color"'));
check('Has canonical link', html.includes('rel="canonical"'));
check('Has favicon link', html.includes('rel="icon"'));
check('Has og:image', html.includes('og:image'));
check('Has og:title', html.includes('og:title'));
check('Has og:description', html.includes('og:description'));

// 2. SEO Meta
console.log('\n2. SEO Meta:');
check('Has title tag', /<title>[^<]+<\/title>/.test(html));
check('Has meta description', html.includes('name="description"'));
check('Has meta keywords', html.includes('name="keywords"'));

// 3. JSON-LD
console.log('\n3. JSON-LD Structured Data:');
check('Has VideoGame schema', html.includes('"@type":"VideoGame"'));
check('Has FAQPage schema', html.includes('"@type":"FAQPage"'));
check('Has HowTo schema', html.includes('"@type":"HowTo"'));
check('Has BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));

// 4. Game code
console.log('\n4. Game Code:');
check('Has LEVELS array', html.includes('const LEVELS'));
check('Has checkWin function', html.includes('function checkWin'));
check('Has toggleTile function', html.includes('function toggleTile'));
check('Has renderGrid function', html.includes('function renderGrid'));
check('Has startLevel function', html.includes('function startLevel'));
check('Has hint system', html.includes('function useHint'));
check('Has localStorage save', html.includes('localStorage.setItem'));
check('Has localStorage load', html.includes('localStorage.getItem'));
check('Has audio context init', html.includes('AudioContext'));
check('Has music system', html.includes('function startMusic'));
check('Has keyboard support', html.includes('addEventListener(\'keydown\''));

// 5. UI Elements
console.log('\n5. UI Elements:');
check('Has menu screen', html.includes('id="menu-screen"'));
check('Has game screen', html.includes('id="game-screen"'));
check('Has canvas element', html.includes('id="game-canvas"'));
check('Has hint button', html.includes('id="btn-hint"'));
check('Has check button', html.includes('id="btn-check"'));
check('Has clear button', html.includes('id="btn-clear"'));
check('Has restart button', html.includes('id="btn-restart"'));
check('Has menu button', html.includes('id="btn-menu"'));
check('Has win overlay', html.includes('id="win-overlay"'));
check('Has level select screen', html.includes('id="levelselect-screen"'));

// 6. External scripts
console.log('\n6. External Integration:');
check('Has gz-analytics.js', html.includes('gz-analytics.js'));
check('Has game-footer.js', html.includes('game-footer.js'));
check('Has monetag-manager.js', html.includes('monetag-manager.js'));

// 7. Mobile support
console.log('\n7. Mobile Support:');
check('Has touch events', html.includes('touchstart'));
check('Has touchend handler', html.includes('touchend'));
check('Has contextmenu prevention', html.includes('contextmenu'));
check('Has viewport maximum-scale', html.includes('maximum-scale=1'));

// 8. Level data
console.log('\n8. Level Data:');
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
check('LEVELS data embedded', !!levelsMatch);
if (levelsMatch) {
  try {
    const levels = JSON.parse(levelsMatch[1]);
    check('Has 30 levels', levels.length === 30);
    check('Has 5 tiers', new Set(levels.map(l => l.tier)).size === 5);
    check('Level 1 is Beginner', levels[0].tier === 'Beginner');
    check('Level 30 is Expert', levels[29].tier === 'Expert');
    check('All have tiles', levels.every(l => Array.isArray(l.tiles)));
    check('All have clues', levels.every(l => Array.isArray(l.clues)));
    check('All have solution', levels.every(l => Array.isArray(l.solution)));
    check('All have tileColors', levels.every(l => Array.isArray(l.tileColors)));
  } catch(e) {
    check('LEVELS JSON valid', false);
    console.log('    Error:', e.message);
  }
}

// 9. Accessibility
console.log('\n9. Accessibility:');
check('Has gz-sr-only H1', html.includes('gz-sr-only'));
check('Has semantic structure', html.includes('<h1') || html.includes('gz-sr-only'));

// 10. No common errors
console.log('\n10. Code Quality:');
check('No console.log in production code', !/console\.log\(/.test(html.replace(/<script[^>]*>/g, '').replace(/\/\/.*console/g, '')));
check('No TODO comments', !/TODO|FIXME|HACK/.test(html));
check('Escaped quotes in JSON-LD', !html.includes('{\"@context\":\"https://schema.org\"')); // should be escaped properly

// 11. Content section
console.log('\n11. Content Section:');
check('Has How to Play section', html.includes('How to Play Tilepaint'));
check('Has Tips & Strategy', html.includes('Tips') && html.includes('Strategy'));
check('Has FAQ', html.includes('Frequently Asked Questions'));
check('Has FAQ about mobile', html.includes('mobile') || html.includes('tablet'));

// 12. JS errors check (static)
console.log('\n12. JS Syntax Check:');
// Extract script blocks
const scriptMatches = html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g) || [];
const inlineScripts = scriptMatches.filter(s => !s.includes('src=') && !s.includes('application/ld+json'));
check('Has inline scripts', inlineScripts.length > 0);

// Try to parse main script
const mainScriptMatch = html.match(/<script>\s*\/\/ LEVELS DATA[\s\S]*?<\/script>/);
if (mainScriptMatch) {
  try {
    const code = mainScriptMatch[0].replace(/<\/?script[^>]*>/g, '');
    new vm.Script(code);
    check('Main script syntax valid', true);
  } catch(e) {
    check('Main script syntax valid', false);
    console.log('    Syntax error:', e.message);
  }
}

// Final report
console.log('\n' + '='.repeat(50));
console.log(`QA RESULT: ${passed}/${checks} checks passed`);
if (errors.length > 0) {
  console.log('Failed checks:');
  errors.forEach(e => console.log(`  - ${e}`));
}
console.log('='.repeat(50));
process.exit(passed === checks ? 0 : 1);
