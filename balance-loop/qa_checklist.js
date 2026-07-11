#!/usr/bin/env node
/**
 * QA Checklist for Balance Loop
 * Code-level verification of all required systems.
 */
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

const checks = [];
let passCount = 0;
let failCount = 0;

function check(name, condition) {
  const result = !!condition;
  checks.push({ name, pass: result });
  if (result) passCount++; else failCount++;
  console.log(`${result ? '✅' : '❌'} ${name}`);
}

// 1. HTML structure
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('Title tag', /<title>.*Balance Loop.*<\/title>/.test(html));
check('Meta viewport', html.includes('viewport'));
check('Meta description', html.includes('name="description"'));
check('Meta keywords', html.includes('name="keywords"'));
check('Canonical link', html.includes('rel="canonical"'));
check('OG title', html.includes('og:title'));
check('OG description', html.includes('og:description'));
check('OG image', html.includes('og:image'));
check('Twitter card', html.includes('twitter:card'));
check('Theme color', html.includes('theme-color'));
check('Favicon link', html.includes('icon.png'));
check('Apple touch icon', html.includes('apple-touch-icon'));

// 2. JSON-LD structured data
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));

// 3. SEO
check('H1 sr-only', html.includes('gz-sr-only'));
check('Preconnect fonts', html.includes('preconnect'));

// 4. Game systems
check('Canvas element', html.includes("getElementById('c')"));
check('LEVELS array', html.includes('const LEVELS'));
check('Web Audio API', html.includes('AudioContext'));
check('Music system', html.includes('startMusic'));
check('SFX system', html.includes('playSFX'));
check('Hint system', html.includes('useHint'));
check('Check/win system', html.includes('checkWin'));
check('Level select', html.includes('levelSelect'));
check('Stars/ratings', html.includes('stars'));
check('Settings', html.includes('settings'));
check('localStorage save', html.includes('localStorage'));
check('Touch support', html.includes('touchstart'));
check('Mouse support', html.includes('mousedown'));
check('Keyboard support', html.includes('keydown'));
check('Undo system', html.includes('undoLast'));
check('Mode toggle (draw/erase)', html.includes("'erase'"));
check('Confetti', html.includes('confetti') || html.includes('Confetti') || html.includes('winAnim'));
check('Timer', html.includes('startTime'));
check('Tier system', html.includes('TIER_NAMES'));
check('Drag drawing', html.includes('handleDragMove'));

// 5. External integrations
check('gz-analytics tracker', html.includes('gz-analytics.js'));
check('game-footer', html.includes('game-footer.js'));
check('monetag-manager', html.includes('monetag-manager.js'));
check('gz-ad-below-game div', html.includes('gz-ad-below-game'));

// 6. No obvious JS errors
check('No unclosed script', (html.match(/<script/g) || []).length === (html.match(/<\/script>/g) || []).length);

// 7. Levels data present
check('Has 30 levels (by solution count)', (html.match(/"solution":/g) || []).length >= 30);

// 8. Art assets exist
try {
  const iconStat = fs.statSync(__dirname + '/icon.png');
  check('icon.png exists', iconStat.size > 1000);
} catch(e) { check('icon.png exists', false); }
try {
  const ogStat = fs.statSync(__dirname + '/og-image.jpg');
  check('og-image.jpg exists', ogStat.size > 1000);
} catch(e) { check('og-image.jpg exists', false); }

console.log('\n' + '='.repeat(50));
console.log(`QA Checklist: ${passCount} pass, ${failCount} fail out of ${checks.length} checks`);
if (failCount > 0) {
  console.log('\nFailed checks:');
  checks.filter(c => !c.pass).forEach(c => console.log(`  ❌ ${c.name}`));
}
process.exit(failCount > 0 ? 1 : 0);
