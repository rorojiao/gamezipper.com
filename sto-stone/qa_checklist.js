// Sto-stone QA Checklist — Code-level verification
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let checks = 0, passed = 0, failed = 0;

function check(name, condition) {
    checks++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== Sto-stone QA Checklist ===\n');

// 1. HTML structure
console.log('1. HTML Structure:');
check('Has <!DOCTYPE html>', html.includes('<!DOCTYPE html>'));
check('Has <html lang="en">', html.includes('<html lang="en">'));
check('Has <meta charset="UTF-8">', html.includes('charset="UTF-8"'));
check('Has viewport meta', html.includes('viewport'));
check('Has canonical link', html.includes('rel="canonical"'));
check('Has og:title', html.includes('og:title'));
check('Has og:description', html.includes('og:description'));
check('Has og:image', html.includes('og:image'));
check('Has twitter:card', html.includes('twitter:card'));
check('Has theme-color', html.includes('theme-color'));
check('Has favicon', html.includes('rel="icon"'));

// 2. SEO JSON-LD
console.log('\n2. SEO JSON-LD:');
check('Has VideoGame schema', html.includes('"@type":"VideoGame"'));
check('Has FAQPage schema', html.includes('"@type":"FAQPage"'));
check('Has HowTo schema', html.includes('"@type":"HowTo"'));
check('Has BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('Has gz-sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));

// 3. Game functionality
console.log('\n3. Game Functionality:');
check('Has LEVELS data', html.includes('const LEVELS='));
check('Has canvas element', html.includes('<canvas id="game-canvas"'));
check('Has menu screen', html.includes('id="menu-screen"'));
check('Has level select screen', html.includes('id="level-select-screen"'));
check('Has game screen', html.includes('id="game-screen"'));
check('Has win overlay', html.includes('id="win-overlay"'));
check('Has settings panel', html.includes('id="settings-panel"'));
check('Has fill/erase tools', html.includes('ctrl-fill') && html.includes('ctrl-erase'));
check('Has hint button', html.includes('ctrl-hint'));
check('Has check button', html.includes('ctrl-check'));
check('Has restart button', html.includes('ctrl-restart'));

// 4. Audio
console.log('\n4. Audio:');
check('Has Web Audio init', html.includes('AudioContext'));
check('Has SFX functions', html.includes('sfxFill') && html.includes('sfxWin'));
check('Has music start/stop', html.includes('startMusic') && html.includes('stopMusic'));
check('Has music toggle', html.includes('toggle-music'));
check('Has SFX toggle', html.includes('toggle-sfx'));

// 5. Keyboard support
console.log('\n5. Keyboard Support:');
check('Has H key hint', html.includes("e.key==='h'"));
check('Has R key restart', html.includes("e.key==='r'"));
check('Has Escape menu', html.includes('Escape'));
check('Has Enter check', html.includes('Enter'));

// 6. Storage
console.log('\n6. Storage:');
check('Has localStorage save', html.includes('localStorage.setItem'));
check('Has localStorage load', html.includes('localStorage.getItem'));

// 7. JS syntax check
console.log('\n7. JavaScript Syntax:');
// Extract script content
const scriptMatch = html.match(/<script>([\s\S]+?)<\/script>\s*<\/body>/);
if (scriptMatch) {
    try {
        new Function(scriptMatch[1]);
        check('Script syntax valid', true);
    } catch(e) {
        check('Script syntax valid', false);
        console.log(`    Error: ${e.message}`);
    }
} else {
    check('Script found', false);
}

// 8. Assets
console.log('\n8. Assets:');
const iconPath = path.join(__dirname, 'icon.png');
const ogPath = path.join(__dirname, 'og-image.jpg');
check('icon.png exists', fs.existsSync(iconPath));
check('og-image.jpg exists', fs.existsSync(ogPath));
if (fs.existsSync(iconPath)) {
    const sz = fs.statSync(iconPath).size;
    check(`icon.png size OK (${sz} bytes)`, sz > 1000 && sz < 100000);
}
if (fs.existsSync(ogPath)) {
    const sz = fs.statSync(ogPath).size;
    check(`og-image.jpg size OK (${sz} bytes)`, sz > 5000 && sz < 200000);
}

// Summary
console.log('\n=== Summary ===');
console.log(`Total: ${checks}, Passed: ${passed}, Failed: ${failed}`);
console.log(failed === 0 ? '\n✅ ALL CHECKS PASSED' : `\n❌ ${failed} CHECKS FAILED`);
process.exit(failed === 0 ? 0 : 1);
