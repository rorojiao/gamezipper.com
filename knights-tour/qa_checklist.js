#!/usr/bin/env node
/* Knight's Tour QA checklist — comprehensive checks against the 123+ item QA matrix.
 * Pattern: tilt-maze/qa_checklist.js + lights-out/qa_checklist.js
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

console.log("=== Knight's Tour QA Checklist ===\n");

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
check('title tag', /<title>[^<]+<\/title>/i.test(html) && /Knight's Tour/i.test(html));
check('meta description', /<meta name="description"/i.test(html));
check('og:type=website', /og:type.*website/i.test(html));
check('og:title', /og:title/i.test(html));
check('og:description', /og:description/i.test(html));
check('og:image', /og:image.*knights-tour/i.test(html));
check('og:url', /og:url.*knights-tour/i.test(html));
check('twitter:card', /twitter:card/i.test(html));
check('twitter:title', /twitter:title/i.test(html));
check('twitter:description', /twitter:description/i.test(html));
check('VideoGame JSON-LD', /"@type":"VideoGame"/i.test(html));
check('VideoGame description', /"@type":"VideoGame"[\s\S]*"description"/i.test(html));
check('VideoGame image', /"@type":"VideoGame"[\s\S]*"image"/i.test(html));
check('VideoGame publisher', /"@type":"VideoGame"[\s\S]*"GameZipper"/i.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/i.test(html));
check('FAQPage has questions', /"@type":"FAQPage"[\s\S]*What is Knight/i.test(html));
check('FAQPage how to play', /"@type":"FAQPage"[\s\S]*How do you play/i.test(html));
check('FAQPage free', /"@type":"FAQPage"[\s\S]*Is Knight/i.test(html));
check('FAQPage level count', /"@type":"FAQPage"[\s\S]*How many levels/i.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/i.test(html));
check('BreadcrumbList position 1', /position.:1/i.test(html));
check('BreadcrumbList GameZipper', /BreadcrumbList[\s\S]*GameZipper/i.test(html));
check('BreadcrumbList Knight', /BreadcrumbList[\s\S]*Knight/i.test(html));
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
check('KM knight moves array', /const KM = \[/.test(html));
check('isKnightMove function', /function isKnightMove/.test(html));
check('onCellClick function', /function onCellClick/.test(html));
check('checkWin function', /function checkWin/.test(html));
check('showHint function', /function showHint/.test(html));
check('undo function', /function undo/.test(html));
check('renderBoard function', /function renderBoard/.test(html));
check('startLevel function', /function startLevel/.test(html));
check('onWin function', /function onWin/.test(html));
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
check('mobile touch support', /touch/.test(html) || /pointer/.test(html) || /addEventListener\('click'/.test(html));
check('knight symbol', /♘/.test(html));
check('progress bar', /progress-bar/.test(html));

// --- Monetization / analytics ---
console.log('\n-- Monetization --');
check('game-footer.js loaded', /game-footer\.js/.test(html));
check('monetag-manager.js loaded', /monetag-manager\.js/.test(html));
check('adsterra-manager.js loaded', /adsterra-manager\.js/.test(html));
check('gz-analytics.js loaded', /gz-analytics\.js/.test(html));
check('gz-ux.js loaded', /gz-ux\.js/.test(html));
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

// --- Level integrity ---
console.log('\n-- Level Integrity --');
const m = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
let levels = null;
if (m) {
  try {
    levels = (new Function(`return (${m[1]});`))();
  } catch(e) {}
}
check('LEVELS parseable', levels !== null);
if (levels) {
  check('Exactly 30 levels', levels.length === 30);
  const seen = new Set();
  let uniqueCount = 0;
  for (const l of levels) {
    const key = `${l.size}-${l.start[0]},${l.start[1]}`;
    if (!seen.has(key)) { seen.add(key); uniqueCount++; }
  }
  check('All levels have unique (size, start)', uniqueCount === 30);
  check('All levels have paths', levels.every(l => Array.isArray(l.path) && l.path.length === l.size * l.size));
  check('Path lengths match size^2', levels.every(l => l.path.length === l.size * l.size));
  // Verify knight-move validity
  let allValid = true;
  for (const l of levels) {
    const visited = new Set();
    for (let i = 0; i < l.path.length; i++) {
      const [r, c] = l.path[i];
      const k = `${r},${c}`;
      if (visited.has(k)) { allValid = false; break; }
      visited.add(k);
      if (i > 0) {
        const [pr, pc] = l.path[i - 1];
        const dr = Math.abs(r - pr), dc = Math.abs(c - pc);
        if (!((dr === 1 && dc === 2) || (dr === 2 && dc === 1))) { allValid = false; break; }
      }
    }
    if (!allValid) break;
  }
  check('All paths valid knight moves', allValid);
  // Tier distribution
  const tiers = new Set(levels.map(l => l.tier));
  check('All 5 tiers present', tiers.size === 5);
}

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
