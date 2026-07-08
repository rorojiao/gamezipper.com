#!/usr/bin/env node
/**
 * QA Checklist for Anglers — code-level verification.
 */
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL: ${name}`); }
}

// 1. HTML structure
check('DOCTYPE', html.includes('<!DOCTYPE html>'));
check('lang attr', html.includes('<html lang="en">'));
check('viewport meta', html.includes('name="viewport"'));
check('canonical link', html.includes('rel="canonical"'));
check('title tag', /<title>Anglers/.test(html));
check('description meta', /name="description"/.test(html));

// 2. OG/Twitter
check('og:type', html.includes('og:type'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:url', html.includes('og:url'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));
check('twitter:title', html.includes('twitter:title'));

// 3. JSON-LD
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('HowTo schema', html.includes('"@type":"HowTo"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('gz-sr-only H1', html.includes('class="gz-sr-only"'));

// 4. Game engine
check('LEVELS defined', /const LEVELS\s*=/.test(html));
check('30 levels', (html.match(/"id":\d+/g) || []).length >= 30);
check('STORAGE_KEY', html.includes('STORAGE_KEY'));
check('Canvas board', html.includes('canvas'));
check('2d context', html.includes("getContext('2d')"));
check('pointer events', html.includes('pointerdown'));
check('Web Audio', html.includes('AudioContext'));
check('localStorage', html.includes('localStorage'));

// 5. Game features
check('hint button', html.includes('hintBtn'));
check('undo button', html.includes('undoBtn'));
check('restart button', html.includes('restartBtn'));
check('menu/level select', html.includes('menuBtn'));
check('music toggle', html.includes('musicBtn'));
check('sound toggle', html.includes('soundBtn'));
check('win overlay', html.includes('winOverlay'));
check('3-star rating', html.includes('winStars'));
check('keyboard support', html.includes('addEventListener(\'keydown\''));

// 6. SEO content
check('How to Play section', html.includes('How to Play Anglers'));
check('Tips section', html.includes('Tips'));
check('About section', html.includes('About the Puzzle'));
check('Related Games', html.includes('Related Games'));
check('internal links', /href="\/[a-z]/.test(html));

// 7. Ad/analytics integration
check('adsterra manager', html.includes('adsterra-manager.js'));
check('monetag manager', html.includes('monetag-manager.js'));
check('game footer', html.includes('game-footer.js'));
check('analytics', html.includes('gz-analytics.js'));
check('ad slot', html.includes('gz-ad-below-game'));

// 8. No syntax errors (basic check)
const scriptMatch = html.match(/<script>([\s\S]+)<\/script>\s*<\/body>/);
check('closing script tag', scriptMatch !== null);
check('IIFE wrapper', /\(function\(\)\{/.test(html));
check('strict mode', html.includes("'use strict'"));

// 9. Asset references
check('icon reference', html.includes('/anglers/icon.png'));
check('og-image reference', html.includes('/anglers/og-image.jpg'));

console.log(`\nQA RESULT: ${pass}/${pass+fail} checks passed`);
if (fail > 0) console.log(`${fail} FAILURES`);
process.exit(fail > 0 ? 1 : 0);
