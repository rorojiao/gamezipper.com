#!/usr/bin/env node
/* River Crossing QA checklist — comprehensive checks against the 123+ item QA matrix. */
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
  } else {
    fail++;
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
  }
}

console.log("=== River Crossing QA Checklist ===\n");

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
check('title tag', /<title>[^<]+<\/title>/i.test(html) && /River Crossing/i.test(html));
check('meta description', /<meta name="description"/i.test(html));
check('og:type=website', /og:type.*website/i.test(html));
check('og:title', /og:title/i.test(html));
check('og:description', /og:description/i.test(html));
check('og:image', /og:image.*river-crossing/i.test(html));
check('og:url', /og:url.*river-crossing/i.test(html));
check('twitter:card', /twitter:card/i.test(html));
check('twitter:title', /twitter:title/i.test(html));
check('twitter:description', /twitter:description/i.test(html));
check('VideoGame JSON-LD', /"@type":"VideoGame"/i.test(html));
check('VideoGame description', /"@type":"VideoGame"[\s\S]*"description"/i.test(html));
check('VideoGame image', /"@type":"VideoGame"[\s\S]*"image"/i.test(html));
check('VideoGame publisher', /"@type":"VideoGame"[\s\S]*"GameZipper"/i.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/i.test(html));
check('FAQPage what is', /"@type":"FAQPage"[\s\S]*What is the River/i.test(html));
check('FAQPage how to play', /"@type":"FAQPage"[\s\S]*How do you play/i.test(html));
check('FAQPage free', /"@type":"FAQPage"[\s\S]*free/i.test(html));
check('FAQPage level count', /"@type":"FAQPage"[\s\S]*levels/i.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/i.test(html));
check('BreadcrumbList position 1', /position.:1/i.test(html));
check('BreadcrumbList GameZipper', /BreadcrumbList[\s\S]*GameZipper/i.test(html));
check('BreadcrumbList River', /BreadcrumbList[\s\S]*River/i.test(html));
check('no fake aggregateRating', !/aggregateRating/i.test(html));

// --- Game systems ---
console.log('\n-- Game Systems --');
check('LEVELS array present', /const LEVELS = \[/.test(html));
check('30 levels in array', (html.match(/"id":\d+/g) || []).length === 30);
check('Beginner tier', /"Beginner"/.test(html));
check('Easy tier', /"Easy"/.test(html));
check('Medium tier', /"Medium"/.test(html));
check('Hard tier', /"Hard"/.test(html));
check('Expert tier', /"Expert"/.test(html));
check('cap field in levels', (html.match(/"cap":/g) || []).length === 30);
check('pieces array in levels', (html.match(/"pieces":/g) || []).length === 30);
check('constraints array in levels', (html.match(/"constraints":/g) || []).length === 30);
check('moves in levels', (html.match(/"moves":/g) || []).length === 30);
check('isValidBank function', /function isValidBank/.test(html));
check('onGo function', /function onGo/.test(html));
check('onUndo function', /function onUndo/.test(html));
check('onPieceClick function', /function onPieceClick/.test(html));
check('setupLevel function', /function setupLevel/.test(html));
check('renderScene function', /function renderScene/.test(html));
check('onWin function', /function onWin/.test(html));
check('showHint function', /function showHint/.test(html));
check('pieceEmoji function', /function pieceEmoji/.test(html));
check('AudioContext init', /AudioContext|webkitAudioContext/.test(html));
check('Web Audio music', /createOscillator/.test(html));
check('SFX system', /function playSfx/.test(html));
check('localStorage save', /localStorage/.test(html));
check('SAVE_KEY present', /SAVE_KEY/.test(html));
check('hintsLeft counter', /hintsLeft/.test(html));
check('undo functionality', /function onUndo/.test(html));
check('hint system', /function showHint/.test(html));
check('confetti/win system', /onWin/.test(html));
check('star ratings', /stars/.test(html) && /★/.test(html));
check('level select screen', /levelSelect/.test(html));
check('game screen', /gameScreen/.test(html));
check('title screen', /titleScreen/.test(html));
check('help screen', /helpScreen/.test(html));
check('win overlay', /winOverlay/.test(html));
check('next/replay/levels btns', /winNextBtn/.test(html) && /winReplayBtn/.test(html) && /winLevelsBtn/.test(html));
check('mobile touch support', /touch|pointer|addEventListener\('click'/.test(html));
check('keyboard support', /keydown/.test(html));
check('Enter/Space = Go', /Enter.*onGo|onGo.*Enter/.test(html));
check('ESC = menu', /Escape.*levelSelect|levelSelect.*Escape/.test(html));
check('U = undo', /key === 'u'/.test(html));
check('R = restart', /key === 'r'/.test(html));
check('H = hint', /key === 'h'/.test(html));
check('confetti win animation', /scene.*solved|solved/.test(html));
check('progress bar', /progressFill/.test(html));
check('move log', /moveLog/.test(html));
check('touch-action manipulation', /touch-action/.test(html));
check('user-select none', /user-select:none/.test(html));
check('bank visuals', /class="bank/.test(html));
check('boat visuals', /class="boat/.test(html));
check('river background', /scene/.test(html));
check('wave animation', /@keyframes wave/.test(html));

// --- Mobile / responsive ---
console.log('\n-- Mobile --');
check('viewport-fit=cover', /viewport-fit=cover/i.test(html));
check('safe-area-inset', /safe-area-inset/.test(html));
check('max-width container', /max-width:\s*560px/.test(html));
check('aspect-ratio usage', /aspect-ratio/.test(html));
check('responsive font-size', /\d+vw|clamp\(/.test(html));

// --- Audio cleanup ---
console.log('\n-- Audio Cleanup --');
check('AudioContext close on beforeunload', /beforeunload.*close|close.*beforeunload/.test(html) || /state\.audio\.close/.test(html));
check('visibilitychange handler', /visibilitychange/.test(html));
check('stop music on hide', /document\.hidden.*stopAmbientMusic|stopAmbientMusic.*document\.hidden/.test(html) || /stopAmbientMusic\(\);[\s\S]{0,200}document\.hidden/.test(html));

// --- Accessibility ---
console.log('\n-- Accessibility --');
check('aria-label on menu', /aria-label="Menu"/.test(html));
check('aria-label on hint', /aria-label="Hint"/.test(html));
check('aria-label on undo', /aria-label="Undo"/.test(html));
check('aria-label on restart', /aria-label="Restart"/.test(html));
check('role attribute', /role=/.test(html) || /aria-/.test(html));

// --- Game design ---
console.log('\n-- Game Design --');
check('Wolf-Goat-Cabbage classic', /wolf.*goat.*cabbage/i.test(html));
check('Fox-Chicken-Grain', /fox.*chicken.*grain/i.test(html));
check('Cat-Mouse-Cheese', /cat.*mouse.*cheese/i.test(html));
check('5 tiers defined', (html.match(/(Beginner|Easy|Medium|Hard|Expert)/g) || []).length >= 10);
check('Boat cap 1 + 2', (html.match(/"cap":\s*[12]/g) || []).length === 30);
check('30 puzzles advertised', /30\s*puzzles/.test(html));
check('piece class with name', /\.piece\.wolf|\.piece\.goat|\.piece\.cabbage|\.piece\.fox|\.piece\.cat/.test(html));
check('Wolf-Goat-Cabbage in desc', /wolf.*goat.*cabbage/i.test(html));

// --- File size ---
console.log('\n-- File Size --');
const sz = fs.statSync(HTML_PATH).size;
check('index.html under 100KB', sz < 100 * 1024, `${sz} bytes`);
check('icon.png under 50KB', (() => {
  try { return fs.statSync(path.join(__dirname, 'icon.png')).size < 50 * 1024; }
  catch (e) { return false; }
})());
check('og-image.jpg under 200KB', (() => {
  try { return fs.statSync(path.join(__dirname, 'og-image.jpg')).size < 200 * 1024; }
  catch (e) { return false; }
})());

// --- No zombie ad networks ---
console.log('\n-- No Zombie Ad Networks --');
check('no 1ktower', !/1ktower/i.test(html));
check('no propellerads', !/propellerads/i.test(html));
check('no adskeeper', !/adskeeper/i.test(html));
check('no m2d.m2cdn', !/m2d\.m2cdn/i.test(html));
check('no libtl', !/libtl/i.test(html));
check('no goomaphy', !/goomaphy/i.test(html));

// --- Required GameZipper integrations ---
console.log('\n-- GameZipper Integrations --');
check('gz-ux script', /gz-ux\.js/.test(html));
check('gz-ad-below-game', /gz-ad-below-game/.test(html));
check('gz-sr-only H1', /gz-sr-only/.test(html));

// --- Save/load ---
console.log('\n-- Save/Load --');
check('save data structure', /saveData/.test(html));
check('load save', /loadSave/.test(html));
check('write save', /writeSave/.test(html));
check('cleared levels tracking', /saveData\.cleared/.test(html));
check('star tracking', /saveData\.stars/.test(html));
check('settings persistence', /SETTINGS_KEY/.test(html));

// --- Final report ---
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
