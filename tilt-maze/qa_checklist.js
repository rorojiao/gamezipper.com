#!/usr/bin/env node
/* Tilt Maze QA checklist — comprehensive checks against the 123+ item QA matrix.
 * Mirrors the pattern from pentomino/qa_checklist.js.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'index.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

let pass = 0, fail = 0;
const failures = [];

function check(name, predicate, detail) {
  if (predicate) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

console.log('=== Tilt Maze QA Checklist ===\n');

// --- HTML structure ---
console.log('-- HTML Structure --');
check('DOCTYPE present', /^<!DOCTYPE html>/i.test(html));
check('lang attribute', /<html\s+lang=/i.test(html));
check('UTF-8 charset', /charset=["']?UTF-8/i.test(html));
check('viewport meta', /viewport[^>]*width=device-width/i.test(html));
check('theme-color meta', /name="theme-color"/i.test(html));
check('canonical link', /<link rel="canonical"/i.test(html));
check('gz-sr-only H1', /<h1 class="gz-sr-only">/i.test(html));

// --- SEO ---
console.log('\n-- SEO --');
check('title tag', /<title>[^<]+<\/title>/i.test(html) && /Tilt Maze/i.test(html));
check('meta description', /<meta name="description"/i.test(html));
check('og:type=website', /og:type.*website/i.test(html));
check('og:title', /og:title/i.test(html));
check('og:description', /og:description/i.test(html));
check('og:image', /og:image.*tilt-maze/i.test(html));
check('og:url', /og:url.*tilt-maze/i.test(html));
check('twitter:card', /twitter:card/i.test(html));
check('twitter:title', /twitter:title/i.test(html));
check('twitter:description', /twitter:description/i.test(html));
check('VideoGame JSON-LD', /"@type":"VideoGame"/i.test(html));
check('VideoGame description', /"@type":"VideoGame"[\s\S]*"description"/i.test(html));
check('VideoGame image', /"@type":"VideoGame"[\s\S]*"image"/i.test(html));
check('VideoGame publisher', /"@type":"VideoGame"[\s\S]*"GameZipper"/i.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/i.test(html));
check('FAQPage has questions', /"@type":"FAQPage"[\s\S]*What is Tilt Maze/i.test(html));
check('FAQPage how to play', /"@type":"FAQPage"[\s\S]*How do you play/i.test(html));
check('FAQPage free', /"@type":"FAQPage"[\s\S]*Is Tilt Maze free/i.test(html));
check('FAQPage level count', /"@type":"FAQPage"[\s\S]*How many levels/i.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/i.test(html));
check('BreadcrumbList position 1', /position.:1/i.test(html));
check('BreadcrumbList GameZipper', /BreadcrumbList[\s\S]*GameZipper/i.test(html));
check('BreadcrumbList Tilt Maze', /BreadcrumbList[\s\S]*Tilt Maze/i.test(html));
check('no fake aggregateRating', !/aggregateRating/i.test(html));

// --- Game systems ---
console.log('\n-- Game Systems --');
check('LEVELS array present', /const LEVELS = \[/.test(html));
check('30 levels in array', (html.match(/\"id\":\d+/g) || []).length === 30);
check('Beginner tier', /\"Beginner\"/.test(html));
check('Easy tier', /\"Easy\"/.test(html));
check('Medium tier', /\"Medium\"/.test(html));
check('Hard tier', /\"Hard\"/.test(html));
check('Expert tier', /\"Expert\"/.test(html));
check('tiltGrid function', /function tiltGrid/.test(html));
check('checkWin function', /function checkWin/.test(html));
check('AudioContext init', /AudioContext|webkitAudioContext/.test(html));
check('Web Audio music', /createOscillator/.test(html));
check('SFX system', /function playSfx|playSfx\s*\(/.test(html));
check('localStorage save', /localStorage/.test(html));
check('SAVE_KEY present', /SAVE_KEY/.test(html));
check('hintsLeft counter', /hintsLeft/.test(html));
check('undo functionality', /function undo/.test(html));
check('hint system', /function showHint/.test(html));
check('confetti win', /spawnConfetti|confetti/i.test(html));
check('3-star ratings', /stars/.test(html) && /★/.test(html));
check('level select screen', /levelSelect/.test(html));
check('game screen', /gameScreen/.test(html));
check('title screen', /titleScreen/.test(html));
check('help screen', /helpScreen/.test(html));
check('win overlay', /winOverlay/.test(html));
check('next/replay/levels btns', /winNextBtn/.test(html) && /winReplayBtn/.test(html) && /winLevelsBtn/.test(html));
check('mobile touch support', /touch/.test(html) || /pointer/.test(html));
check('arrow key support', /keydown/.test(html) && /arrowup/.test(html));
check('WASD support', /keydown/.test(html) && /w: 'N'/.test(html) && /s: 'S'/.test(html) && /d: 'E'/.test(html));
check('on-screen tilt pad', /tilt-btn/.test(html) && /data-dir/.test(html));
check('on-screen N button', /btnUp/.test(html));
check('on-screen S button', /btnDown/.test(html));
check('on-screen E button', /btnRight/.test(html));
check('on-screen W button', /btnLeft/.test(html));

// --- Monetization / analytics ---
console.log('\n-- Monetization --');
check('game-footer.js loaded', /game-footer\.js/.test(html));
check('monetag-manager.js loaded', /monetag-manager\.js/.test(html));
check('adsterra-manager.js loaded', /adsterra-manager\.js/.test(html));
check('gz-analytics.js loaded', /gz-analytics\.js/.test(html));
check('gz-ad-below-game div', /gz-ad-below-game/.test(html));
check('no 1ktower zombie', !/1ktower/.test(html));
check('no libtl zombie', !/libtl/.test(html));
check('no m2d.m2cdn zombie', !/m2d\.m2cdn/.test(html));
check('no goomaphy zombie', !/goomaphy/.test(html));
check('no propellerads zombie', !/propellerads/.test(html));
check('no adskeeper zombie', !/adskeeper/.test(html));

// --- Audio cleanup ---
console.log('\n-- Audio Cleanup --');
check('beforeunload cleanup', /beforeunload/.test(html));
check('pagehide cleanup', /pagehide/.test(html));
check('visibilitychange handler', /visibilitychange/.test(html));
check('audioCtx.close on unload', /audioCtx\.close/.test(html));
check('no AudioContext leak', /audioCtx\.suspend|audioCtx\.close/.test(html));

// --- Art assets ---
console.log('\n-- Art Assets --');
const iconExists = fs.existsSync(path.join(__dirname, 'icon.png'));
const ogExists = fs.existsSync(path.join(__dirname, 'og-image.jpg'));
check('icon.png exists', iconExists);
check('og-image.jpg exists', ogExists);
if (iconExists) {
  const sz = fs.statSync(path.join(__dirname, 'icon.png')).size;
  check('icon.png < 100KB', sz < 100 * 1024, `${sz} bytes`);
}
if (ogExists) {
  const sz = fs.statSync(path.join(__dirname, 'og-image.jpg')).size;
  check('og-image.jpg < 200KB', sz < 200 * 1024, `${sz} bytes`);
}

// --- File size ---
console.log('\n-- File Size --');
const htmlSize = html.length;
check('HTML < 100KB', htmlSize < 100 * 1024, `${htmlSize} bytes`);

// --- Final ---
console.log(`\n=== SUMMARY ===`);
console.log(`Pass: ${pass}, Fail: ${fail}, Total: ${pass + fail}`);
if (fail > 0) {
  console.log('\nFAILURES:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${pass} CHECKS PASSED`);
}