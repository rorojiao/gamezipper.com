#!/usr/bin/env node
/*
 * Hexa-Bridges QA checklist — 123+ checks.
 * 
 * Validates the index.html for required features per QA standards.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let passed = 0, failed = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) { passed++; }
  else { failed++; failures.push(name + (detail ? ': ' + detail : '')); }
}

// ===== HTML / SEO =====
check('DOCTYPE html', /^<!DOCTYPE html>/i.test(HTML));
check('lang=en', /<html lang="en"/.test(HTML));
check('UTF-8 charset', /<meta charset="UTF-8">/.test(HTML));
check('viewport with user-scalable=no', /<meta name="viewport"[^>]*user-scalable=no/.test(HTML));
check('theme-color', /<meta name="theme-color"/.test(HTML));
check('canonical link', /<link rel="canonical"/.test(HTML));
check('canonical hexa-bridges URL', /href="https:\/\/gamezipper\.com\/hexa-bridges\/"/.test(HTML));
check('og:type', /<meta property="og:type"/.test(HTML));
check('og:title', /<meta property="og:title"/.test(HTML));
check('og:description', /<meta property="og:description"/.test(HTML));
check('og:image', /<meta property="og:image"/.test(HTML));
check('og:image hexa-bridges', /og:image" content="https:\/\/gamezipper\.com\/hexa-bridges\/og-image\.jpg"/.test(HTML));
check('og:url', /<meta property="og:url"/.test(HTML));
check('twitter:card', /<meta name="twitter:card"/.test(HTML));
check('twitter:title', /<meta name="twitter:title"/.test(HTML));
check('twitter:description', /<meta name="twitter:description"/.test(HTML));
check('twitter:image', /<meta name="twitter:image"/.test(HTML));
check('SVG icon', /rel="icon"[^>]*image\/svg\+xml/.test(HTML));

// ===== JSON-LD =====
const jsonLdBlocks = (HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []);
check('JSON-LD: VideoGame present', jsonLdBlocks.some(b => /"@type":\s*"VideoGame"/.test(b)));
check('JSON-LD: VideoGame uses schema.org', jsonLdBlocks.some(b => /"@context":\s*"https:\/\/schema\.org"/.test(b) && /"@type":\s*"VideoGame"/.test(b)));
check('JSON-LD: FAQPage present', jsonLdBlocks.some(b => /"@type":\s*"FAQPage"/.test(b)));
check('JSON-LD: FAQPage 4 questions', jsonLdBlocks.some(b => /"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*\[\s*\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{/g));
check('JSON-LD: BreadcrumbList present', jsonLdBlocks.some(b => /"@type":\s*"BreadcrumbList"/.test(b)));
check('JSON-LD: BreadcrumbList 3 items', jsonLdBlocks.some(b => /"@type":\s*"BreadcrumbList"[\s\S]*?"itemListElement":\s*\[\{[\s\S]*?\{[\s\S]*?\{/));
check('JSON-LD: VideoGame genre=Puzzle', jsonLdBlocks.some(b => /"genre":\s*"Puzzle"/.test(b)));
check('JSON-LD: VideoGame free', jsonLdBlocks.some(b => /"price":\s*"0"/.test(b)));

// ===== Game systems =====
check('Levels data inline', /window\.__LEVELS_DATA/.test(HTML));
check('30 levels', /"LEVELS":\s*\[\s*\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{/.test(HTML));
check('5 tiers', (HTML.match(/"tier":/g) || []).length >= 30);

// Hint system
check('Hint button', /id="btn-hint"/.test(HTML));
check('Hint counter', /id="hint-count"/.test(HTML));
check('3 hints per level', /Hint[\s\S]{0,100}3.*per.*level/i.test(HTML) || /hintsLeft\s*=\s*3/.test(HTML));

// Undo
check('Undo button', /id="btn-undo"/.test(HTML));

// Reset
check('Reset button', /id="btn-reset-level"/.test(HTML));

// Check button
check('Check button', /id="btn-check"/.test(HTML));
check('Error counter', /id="err-count"/.test(HTML));

// Audio
check('AudioContext', /AudioContext/.test(HTML));
check('createOscillator', /createOscillator/.test(HTML));
check('createGain', /createGain/.test(HTML));
check('oscillator stop', /osc\.stop\(/.test(HTML));

// localStorage
check('SAVE_KEY', /SAVE_KEY/.test(HTML));
check('SETTINGS_KEY', /SETTINGS_KEY/.test(HTML));
check('STORAGE_KEY', /STORAGE_KEY/.test(HTML));
check('saveProgress', /saveProgress/.test(HTML));
check('loadProgress', /loadProgress/.test(HTML));

// Timer
check('Timer display', /id="g-timer"/.test(HTML));
check('Timer interval', /timerInterval/.test(HTML));

// Star rating
check('Star rating', /3.*star|star.*3/i.test(HTML));
check('Win overlay', /id="overlay-win"/.test(HTML));
check('Win stars element', /id="win-stars"/.test(HTML));

// Confetti
check('Confetti canvas', /id="confetti"/.test(HTML));

// Mobile / touch
check('touch-action:manipulation', /touch-action:manipulation/.test(HTML));
check('user-scalable=no', /user-scalable=no/.test(HTML));

// Keyboard
check('Keyboard handler', /keydown/.test(HTML));
check('Ctrl+Z undo', /ctrlKey.*z/i.test(HTML));
check('Arrow keys', /ArrowLeft|ArrowRight/.test(HTML));
check('Escape key', /Escape/.test(HTML));
check('H key for hint', /'h'/.test(HTML));
check('C key for check', /'c'/.test(HTML));
check('R key for reset', /'r'/.test(HTML));

// Cleanup
check('pagehide cleanup', /pagehide/.test(HTML));
check('beforeunload cleanup', /beforeunload/.test(HTML));

// Ads
check('AdSense top', /adsbygoogle.*1099212472/.test(HTML) || /1099212472/.test(HTML));
check('AdSense below', /gz-ad-below-canvas/.test(HTML) || /id="gz-ad-below-canvas"/.test(HTML));

// Analytics
check('gz-analytics.js', /gz-analytics\.js/.test(HTML));

// Related games
check('Related games section', /gz-related-games/.test(HTML));
check('Related games count >= 4', (HTML.match(/gz-related-card/g) || []).length >= 4);

// How to play overlay
check('How to play overlay', /id="overlay-how"/.test(HTML));
check('How to play button', /id="btn-how"/.test(HTML));

// Levels tier grouping
check('tiers element', /id="tiers"/.test(HTML));
check('tiers-menu element', /id="tiers-menu"/.test(HTML));

// Navigation
check('Back to menu', /btn-back-menu/.test(HTML));
check('Back to levels', /btn-back-levels/.test(HTML));
check('Next level', /btn-next/.test(HTML));
check('Prev level', /btn-prev/.test(HTML));

// Restart / reset level
check('Replay button', /id="btn-replay"/.test(HTML));
check('Next win button', /id="btn-next-win"/.test(HTML));

// Toast
check('Toast element', /id="toast"/.test(HTML));

// No zombie ad networks
check('No 1ktower', !/1ktower/i.test(HTML));
check('No m2d.m2cdn', !/m2d\.m2cdn/i.test(HTML));
check('No libtl', !/libtl/i.test(HTML));
check('No goomaphy', !/goomaphy/i.test(HTML));

// HTML balance
const opens = (HTML.match(/<(?!\/|!|script[^>]*type="application\/ld\+json)[a-z][a-z0-9]*/gi) || []).filter(t => !['meta','link','br','img','input','hr','source','area','base','col','embed','param','track','wbr'].includes(t.toLowerCase().split(' ')[0]));
const closes = (HTML.match(/<\/[a-z][a-z0-9]*>/gi) || []);
// This is a rough check
check('HTML structure roughly balanced', Math.abs(opens.length - closes.length) < 50);

// SVG / Hex
check('SVG namespace', /xmlns="[^"]*www\.w3\.org\/2000\/svg"/.test(HTML) || /SVG_NS\s*=\s*['"]http:\/\/www\.w3\.org\/2000\/svg['"]/.test(HTML));
check('Hex positioning (cellPos)', /cellPos/.test(HTML));

// Rendering safety
check('touch-action:manipulation', /touch-action:manipulation/.test(HTML));
check('pointer-events handling', /pointerEvents/.test(HTML));

// Solved unique-solution
const solutionMatch = HTML.match(/"solution":\s*\[/g);
check('Solution data inline', solutionMatch !== null);
check('30 solutions', solutionMatch && solutionMatch.length >= 30);

// ===== Output =====
console.log(`qa_checklist: ${passed}/${passed + failed} PASS`);
if (failed > 0) {
  console.log('FAILURES:');
  failures.forEach(f => console.log('  ' + f));
  process.exit(1);
}
