/**
 * Five Cells — Code-Level QA Checklist
 * Verifies all required systems are present in index.html
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let checks = [];
let passCount = 0;
let failCount = 0;

function check(name, condition, detail='') {
    const status = condition ? '✅' : '❌';
    if (condition) passCount++;
    else failCount++;
    checks.push(`${status} ${name}${detail ? ': ' + detail : ''}`);
}

// === SEO / Meta ===
check('DOCTYPE present', /<!DOCTYPE html>/i.test(html));
check('lang="en"', /<html\s+lang="en"/i.test(html));
check('charset UTF-8', /charset=["']?UTF-8/i.test(html));
check('viewport meta', /name=["']viewport["']/i.test(html));
check('theme-color meta', /name=["']theme-color["']/i.test(html));
check('canonical link', /rel=["']canonical["']/i.test(html));
check('og:title', /og:title/i.test(html));
check('og:description', /og:description/i.test(html));
check('og:image', /og:image/i.test(html));
check('og:url', /og:url/i.test(html));
check('twitter:card', /twitter:card/i.test(html));
check('favicon icon.png', /icon\.png/i.test(html));
check('keywords meta', /name=["']keywords["']/i.test(html));
check('description meta', /name=["']description["']/i.test(html));

// === JSON-LD ===
check('VideoGame schema', /"@type":"VideoGame"/.test(html));
check('FAQPage schema', /"@type":"FAQPage"/.test(html));
check('HowTo schema', /"@type":"HowTo"/.test(html));
check('BreadcrumbList schema', /"@type":"BreadcrumbList"/.test(html));

// === Accessibility ===
check('gz-sr-only H1', /gz-sr-only/.test(html) && /<h1/i.test(html));
check('GameZipper topnav', /gz-topnav/.test(html));

// === Game Systems ===
check('LEVELS data embedded', /var\s+LEVELS\s*=/.test(html));
check('Canvas element', /<canvas/i.test(html));
check('checkWin function', /function\s+checkWin/.test(html));
check('checkErrors function', /function\s+checkErrors/.test(html));
check('getRegions function', /function\s+getRegions/.test(html));
check('getBorderCount function', /function\s+getBorderCount/.test(html));
check('Hint system', /hint|showHint/i.test(html));
check('3-star rating', /star/i.test(html));
check('Level select', /level.select|levelSelect|level_select/i.test(html) || /ls-cell|level-select/.test(html));
check('Win overlay', /win.*overlay|overlay.*win|confetti/i.test(html));

// === Controls ===
check('Menu/Restart/Hint/Undo', /restart/i.test(html) && /hint/i.test(html) && /undo/i.test(html) && /menu/i.test(html));
check('Keyboard support', /addEventListener.*keydown|onkeydown|keyup/i.test(html));

// === Audio ===
check('Web Audio API', /AudioContext|webkitAudioContext/i.test(html));
check('BGM function', /bgm|music|playMusic/i.test(html));
check('SFX function', /sfx|playSound|soundEffect/i.test(html));

// === Persistence ===
check('localStorage save', /localStorage/i.test(html));
check('Save progress', /save.*progress|saveProgress|saveGame/i.test(html) || /setItem.*level/i.test(html));

// === Ads/Analytics ===
check('Monetag ad', /monetag|supercluster/i.test(html));
check('gz-analytics', /gz.*analytics|gamezipper.*track|analytics/i.test(html));

// === No rAF continuous render ===
check('No requestAnimationFrame loop', !/requestAnimationFrame\s*\(\s*function\s*\w*\s*\(\)\s*\{\s*requestAnimationFrame/.test(html));

// === Footer ===
check('game-footer', /game-footer/.test(html));
check('Back to GameZipper link', /href=["']\/["'][^>]*>[^<]*GameZipper/i.test(html));

// === Validate JS syntax ===
try {
    const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
    let allJS = '';
    if (scriptMatch) {
        for (const s of scriptMatch) {
            // Skip JSON-LD scripts
            if (/application\/ld\+json/.test(s)) continue;
            const inner = s.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            allJS += inner + '\n';
        }
    }
    // Try parsing
    new vm.Script(allJS);
    check('JavaScript syntax valid', true);
} catch(e) {
    check('JavaScript syntax valid', false, e.message.substring(0, 100));
}

console.log(`\n${'='.repeat(60)}`);
console.log(`  Five Cells — QA Checklist Report`);
console.log(`${'='.repeat(60)}\n`);

for (const c of checks) {
    console.log(`  ${c}`);
}

console.log(`\n${'='.repeat(60)}`);
console.log(`  PASSED: ${passCount}/${checks.length}`);
console.log(`  FAILED: ${failCount}/${checks.length}`);
console.log(`${'='.repeat(60)}\n`);

if (failCount > 0) {
    console.log('❌ QA FAILED');
    process.exit(1);
} else {
    console.log('✅ ALL QA CHECKS PASSED');
    process.exit(0);
}
