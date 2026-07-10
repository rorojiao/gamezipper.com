// QA Checklist for Nagareru
const fs = require('fs');
const path = require('path');

let checks = 0, pass = 0, fail = 0;

function check(name, condition) {
    checks++;
    if (condition) {
        pass++;
        console.log(`✅ ${name}`);
    } else {
        fail++;
        console.log(`❌ ${name}`);
    }
}

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// 1. HTML structure
check('Has DOCTYPE', html.includes('<!DOCTYPE html>'));
check('Has charset', html.includes('charset="UTF-8"'));
check('Has viewport', html.includes('viewport'));
check('Has theme-color', html.includes('theme-color'));

// 2. SEO meta
check('Has description meta', /name="description"/.test(html) && html.includes('Nagareru'));
check('Has keywords meta', /name="keywords"/.test(html));
check('Has canonical link', html.includes('rel="canonical"'));
check('Has og:title', html.includes('og:title'));
check('Has og:description', html.includes('og:description'));
check('Has og:image', html.includes('og:image'));
check('Has og:url', html.includes('og:url'));
check('Has twitter:card', html.includes('twitter:card'));

// 3. JSON-LD
check('Has VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('Has FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('Has HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('Has BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));

// 4. Accessibility
check('Has gz-sr-only H1', html.includes('class="gz-sr-only"') && html.includes('<h1'));

// 5. Game data
check('Has LEVELS data', /const LEVELS\s*=/.test(html));
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
if (levelsMatch) {
    const levels = JSON.parse(levelsMatch[1]);
    check('Has 30 levels', levels.length === 30);
    check('Level 1 has loop', Array.isArray(levels[0].loop) && levels[0].loop.length > 0);
    check('Level 1 has winds', Array.isArray(levels[0].winds));
    check('Level 1 has solution', Array.isArray(levels[0].sol) && levels[0].sol.length > 0);

    // Check tier sizes
    const sizes = levels.map(l => l.r);
    check('Has 4x4 levels', sizes.includes(4));
    check('Has 4x6 levels', sizes.includes(4) && levels.some(l => l.r===4 && l.c===6));
    check('Has 6x6 levels', sizes.includes(6) && levels.some(l => l.r===6 && l.c===6));
    check('Has 4x8 levels', sizes.includes(4) && levels.some(l => l.r===4 && l.c===8));
} else {
    check('LEVELS parseable', false);
}

// 6. Canvas game
check('Has canvas element', html.includes('<canvas'));
check('Has canvas id', html.includes('id="game-canvas"'));

// 7. Game systems
check('Has hint system', html.includes('useHint'));
check('Has check/win system', html.includes('checkWin'));
check('Has restart', html.includes('loadLevel(currentLevel)'));
check('Has level select', html.includes('showLevelSelect'));
check('Has localStorage save', html.includes('localStorage'));
check('Has keyboard support', html.includes('addEventListener(\'keydown\''));
check('Has Web Audio', html.includes('AudioContext'));
check('Has BGM', html.includes('startMusic'));
check('Has SFX', html.includes('playTone'));
check('Has confetti', html.includes('confetti'));

// 8. Site integration
check('Has gz-analytics script', html.includes('gz-analytics.js'));
check('Has game-footer script', html.includes('game-footer.js'));
check('Has monetag script', html.includes('monetag-manager.js'));
check('Has gz-ad-below-game div', html.includes('gz-ad-below-game'));

// 9. Game-specific features
check('Has wind constraint logic', html.includes('windCells') && html.includes('windBands'));
check('Has loop solution check', html.includes('loopSolution'));
check('Has path undo', html.includes('ctrl-undo'));
check('Has clear button', html.includes('ctrl-clear'));

// 10. JS syntax check (extract and verify)
const scriptMatch = html.match(/<script>\s*const LEVELS[\s\S]*?<\/script>/);
if (scriptMatch) {
    const script = scriptMatch[0].replace('<script>','').replace('</script>','');
    try {
        new Function(script);
        check('Inline JS syntax valid', true);
    } catch(e) {
        check('Inline JS syntax valid', false);
        console.log('  Syntax error:', e.message);
    }
}

// 11. Assets
check('icon.png exists', fs.existsSync(path.join(__dirname, 'icon.png')));
check('og-image.jpg exists', fs.existsSync(path.join(__dirname, 'og-image.jpg')));

console.log(`\n${pass}/${checks} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);