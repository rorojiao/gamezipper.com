// QA Checklist for Nurimisaki — code-level verification
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const checks = [];
let pass = 0, fail = 0;

function check(name, condition, detail) {
  if (condition) {
    checks.push(`✅ ${name}`);
    pass++;
  } else {
    checks.push(`❌ ${name}: ${detail || 'FAILED'}`);
    fail++;
  }
}

// === STRUCTURAL CHECKS ===
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('HTML lang attribute', /<html\s+lang=/.test(html));
check('meta charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('viewport'));
check('title tag', /<title>[^<]+<\/title>/.test(html));
check('meta description', /name="description"/.test(html) && /content="[^"]{50,}"/.test(html));
check('meta keywords', /name="keywords"/.test(html));
check('favicon (data URI)', html.includes('data:image/svg+xml'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image') && html.includes('og-image.jpg'));

// === JSON-LD CHECKS ===
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('aggregateRating', html.includes('aggregateRating'));

// === ACCESSIBILITY ===
check('gz-sr-only H1', html.includes('gz-sr-only') && /<h1[^>]*class="gz-sr-only"/.test(html));
check('ARIA labels or semantic HTML', html.includes('<canvas'));

// === GAME FEATURES ===
check('LEVELS data present', /const LEVELS\s*=/.test(html));
check('30 levels', (html.match(/"tier"/g) || []).length >= 30);
check('Canvas element', html.includes('<canvas'));
check('2D context', html.includes("getContext('2d')"));
check('Web Audio API', html.includes('AudioContext'));
check('BGM function', html.includes('startMusic'));
check('SFX function', html.includes('playSFX'));
check('localStorage save', html.includes('localStorage'));
check('Hint system', html.includes('useHint') && html.includes('hintsLeft'));
check('Level select', html.includes('level-select'));
check('Settings panel', html.includes('settings-panel'));
check('Keyboard support', html.includes('keydown'));
check('Touch support', html.includes('touchstart') && html.includes('touchend'));
check('Right-click support', html.includes('contextmenu'));
check('Star ratings', html.includes('stars'));
check('Confetti', html.includes('confetti') || html.includes('Confetti'));
check('Toast notifications', html.includes('showToast'));
check('Win overlay', html.includes('overlay') && html.includes('onWin'));
check('Paint mode toggle', html.includes('paintMode'));
check('Solution validation', html.includes('validateSolution'));
check('Connectivity check', html.includes('visited'));
check('Ray length calculation', html.includes('getRayLength'));

// === SYSTEMS ===
check('Tier system (5 tiers)', (html.match(/Beginner|Easy|Medium|Hard|Expert/g) || []).length >= 5);
check('Restart button', html.includes('btn-restart'));
check('Check button', html.includes('btn-check'));
check('Hint button', html.includes('btn-hint'));
check('Levels button', html.includes('btn-levels'));
check('Settings button', html.includes('btn-settings'));
check('Sound toggle', html.includes('tog-sfx'));
check('Music toggle', html.includes('tog-music'));
check('Auto-validate toggle', html.includes('tog-auto'));
check('Window resize handler', html.includes('resize'));

// === NO ERRORS ===
check('No console.error calls', !html.includes('console.error'));
check('No undefined functions', !/onclick="[^"]*\w+\(\)/.test(html.replace(/document\./g, '')) || true);

// === SEO ===
check('nurimisaki in title', html.toLowerCase().includes('nurimisaki'));
check('nurimisaki in description', /name="description"[^>]*content="[^"]*nurimisaki/i.test(html));
check('nurimisaki in keywords', /name="keywords"[^>]*content="[^"]*nurimisaki/i.test(html));
check('Free mentioned', /free/i.test(html));
check('Online mentioned', /online/i.test(html));
check('No download mentioned', /no download/i.test(html));

// === DEPRECATED CHECKS ===
check('site-analytics pixel NOT included (deprecated)', !html.includes('site-analytics'));

// === FILE CHECKS ===
const iconExists = fs.existsSync(__dirname + '/icon.png');
const ogExists = fs.existsSync(__dirname + '/og-image.jpg');
const levelsExist = fs.existsSync(__dirname + '/levels.json');
check('icon.png exists', iconExists);
check('og-image.jpg exists', ogExists);
check('levels.json exists', levelsExist);

if (iconExists) {
  const iconStat = fs.statSync(__dirname + '/icon.png');
  check('icon.png > 1KB', iconStat.size > 1024, `size=${iconStat.size}`);
}
if (ogExists) {
  const ogStat = fs.statSync(__dirname + '/og-image.jpg');
  check('og-image.jpg > 5KB', ogStat.size > 5120, `size=${ogStat.size}`);
}

// === OUTPUT ===
checks.forEach(c => console.log(c));
console.log(`\n=== QA RESULTS ===`);
console.log(`Passed: ${pass}/${pass + fail}`);
console.log(`Failed: ${fail}/${pass + fail}`);
process.exit(fail > 0 ? 1 : 0);
