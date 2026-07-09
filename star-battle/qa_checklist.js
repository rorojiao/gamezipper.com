#!/usr/bin/env node
/**
 * Star Battle — Code-Level QA Checklist
 * Verifies structural integrity, SEO, assets, and code quality of index.html.
 */
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
let checks = 0, pass = 0, fail = 0;

function check(name, condition, detail) {
  checks++;
  if (condition) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

console.log('=== Star Battle QA Checklist ===\n');

// 1. HTML structure
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('UTF-8 charset', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('viewport'));
check('lang attribute', html.includes('<html lang="en">'));
check('theme-color', html.includes('theme-color'));

// 2. SEO meta tags
check('title tag', /<title>[^<]+<\/title>/.test(html));
check('meta description', html.includes('name="description"'));
check('meta keywords', html.includes('name="keywords"'));
check('canonical link', html.includes('rel="canonical"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:url', html.includes('og:url'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));

// 3. JSON-LD structured data
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('aggregateRating', html.includes('aggregateRating'));
check('Offer price 0', html.includes('"price":"0"'));

// 4. Assets references
check('icon.png referenced', html.includes('/star-battle/icon.png'));
check('og-image.jpg referenced', html.includes('/star-battle/og-image.jpg'));
check('apple-touch-icon', html.includes('apple-touch-icon'));

// 5. Game features
check('LEVELS data embedded', /const\s+LEVELS\s*=/.test(html));
check('Canvas element', html.includes('<canvas'));
check('Web Audio API', html.includes('AudioContext'));
check('localStorage save', html.includes('localStorage'));
check('click handler', html.includes('addEventListener(\'click\''));
check('touch handler', html.includes('touchstart'));
check('keyboard handler', html.includes('keydown'));
check('hint system', html.includes('useHint'));
check('checkWin function', html.includes('function checkWin'));
check('violation detection', html.includes('findViolations'));
check('confetti', html.includes('confetti'));
check('settings toggles', html.includes('toggle-music'));

// 6. Level count
const levelMatch = html.match(/const\s+LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (levelMatch) {
  const levels = eval(levelMatch[1]);
  check('30 levels', levels.length === 30, `got ${levels.length}`);
  check('all have solution', levels.every(l => l.solution && l.solution.length > 0));
  check('all have regions', levels.every(l => l.regions && l.regions.length > 0));
  check('all have tier', levels.every(l => l.tier));
  check('all have size', levels.every(l => l.size > 0));
  check('all have stars_per', levels.every(l => l.stars_per > 0));
  // Tiers
  const tiers = [...new Set(levels.map(l => l.tier))];
  check('5 tiers', tiers.length === 5, `got ${tiers.join(',')}`);
}

// 7. Integration scripts
check('gz-analytics.js', html.includes('gz-analytics.js'));
check('game-footer.js', html.includes('game-footer.js'));
check('monetag-manager.js', html.includes('monetag-manager.js'));
check('ad div', html.includes('gz-ad-below-game'));

// 8. gz-sr-only H1
check('gz-sr-only H1', html.includes('gz-sr-only'));

// 9. No obvious JS errors (basic syntax check)
try {
  // Extract the main script block
  const scriptMatch = html.match(/<script>\s*\(function\(\)\{[\s\S]*?\}\)\(\);\s*<\/script>/);
  check('main IIFE script present', !!scriptMatch);
} catch (e) {
  check('main IIFE script present', false, e.message);
}

// 10. Assets exist
check('icon.png exists', fs.existsSync('icon.png'));
check('og-image.jpg exists', fs.existsSync('og-image.jpg'));
if (fs.existsSync('icon.png')) {
  const stat = fs.statSync('icon.png');
  check('icon.png > 1KB', stat.size > 1024, `${stat.size} bytes`);
}
if (fs.existsSync('og-image.jpg')) {
  const stat = fs.statSync('og-image.jpg');
  check('og-image.jpg > 5KB', stat.size > 5120, `${stat.size} bytes`);
}

// 11. Deprecated checks
check('NO site-analytics pixel', !html.includes('site-analytics.js'), 'should not include deprecated pixel');

console.log(`\n=== QA Results: ${pass}/${checks} PASSED, ${fail} FAILED ===`);
process.exit(fail > 0 ? 1 : 0);
