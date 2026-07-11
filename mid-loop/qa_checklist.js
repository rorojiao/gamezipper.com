#!/usr/bin/env node
/*
 * Mid-Loop QA checklist — code-level verification.
 * Checks: HTML structure, JSON-LD blocks, SEO meta tags, required systems,
 * no obvious JS errors, assets present.
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function check(name, cond, detail) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== Mid-Loop QA Checklist ===\n');

console.log('HTML Structure:');
check('<!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
check('<html lang="en">', html.includes('<html lang="en">'));
check('<head> section', html.includes('<head>') && html.includes('</head>'));
check('<body> section', html.includes('<body>') && html.includes('</body>'));
check('canonical link', html.includes('rel="canonical" href="https://gamezipper.com/mid-loop/"'));
check('gz-sr-only H1', html.includes('class="gz-sr-only"'));

console.log('\nSEO Meta:');
check('title tag', /<title>[^<]+<\/title>/.test(html));
check('meta description', html.includes('name="description"'));
check('meta keywords', html.includes('name="keywords"'));
check('og:title', html.includes('property="og:title"'));
check('og:description', html.includes('property="og:description"'));
check('og:image', html.includes('property="og:image"'));
check('twitter:card', html.includes('name="twitter:card"'));
check('theme-color', html.includes('name="theme-color"'));

console.log('\nJSON-LD:');
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('aggregateRating', html.includes('"aggregateRating"'));

console.log('\nGame Systems:');
check('LEVELS array defined', html.includes('var LEVELS = ['));
check('30 levels', (html.match(/{r:\d+,c:\d+,tier:/g) || []).length >= 30);
check('Canvas element', html.includes('<canvas id="puzzle-canvas"'));
check('Web Audio init', html.includes('function initAudio'));
check('BGM (ambient chords)', html.includes('bgmChords'));
check('SFX functions', html.includes('sndDraw') && html.includes('sndWin'));
check('checkSolved function', html.includes('function checkSolved'));
check('checkDotStatus function', html.includes('function checkDotStatus'));
check('Hint system', html.includes('function showHint'));
check('Undo system', html.includes('function undo'));
check('Star ratings', html.includes('star-filled'));
check('Level select', html.includes('tier-grid'));
check('Timer', html.includes('function startTimer'));
check('Settings panel', html.includes('settings-overlay'));
check('localStorage save', html.includes('localStorage.setItem'));
check('Keyboard support', html.includes('addEventListener(\'keydown\''));
check('Confetti', html.includes('spawnConfetti'));

console.log('\nInteraction:');
check('Draw tool', html.includes('draw-tool'));
check('Erase tool', html.includes('erase-tool'));
check('Pointer events', html.includes('pointerdown'));
check('Touch support', html.includes('touch-action'));

console.log('\nIntegrations:');
check('gz-analytics.js', html.includes('/gz-analytics.js'));
check('game-footer.js', html.includes('/game-footer.js'));
check('adsterra-manager.js', html.includes('/adsterra-manager.js'));
check('monetag-manager.js', html.includes('/monetag-manager.js'));
check('rAF guard', html.includes('_origRAF'));

console.log('\nAssets:');
check('icon.png exists', fs.existsSync('icon.png'));
check('og-image.jpg exists', fs.existsSync('og-image.jpg'));
check('favicon.svg ref', html.includes('href="/favicon.svg"'));

console.log('\n=== QA RESULT: ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail === 0 ? 0 : 1);
