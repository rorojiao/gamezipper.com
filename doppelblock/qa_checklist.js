#!/usr/bin/env node
// Doppelblock QA checklist - 50+ code-level checks
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
let nPass = 0, nFail = 0;
const fail = [];
function check(name, ok, detail) {
  if (ok) { nPass++; }
  else { nFail++; fail.push(name + (detail ? ' (' + detail + ')' : '')); }
}

// HTML structure
check('doctype', /<!DOCTYPE html>/i.test(html));
check('lang=en', /<html lang="en">/.test(html));
check('charset UTF-8', /charset="UTF-8"/.test(html));
check('viewport meta', /viewport/.test(html));
check('title', /<title>.*Doppelblock.*<\/title>/.test(html));
check('description meta', /<meta name="description"/.test(html));
check('canonical link', /<link rel="canonical"/.test(html));
check('og:type', /og:type/.test(html));
check('og:title', /og:title/.test(html));
check('og:description', /og:description/.test(html));
check('og:image', /og:image/.test(html));
check('og:url', /og:url/.test(html));
check('twitter:card', /twitter:card/.test(html));
check('theme-color', /theme-color/.test(html));
check('favicon', /rel="icon"/.test(html));

// JSON-LD blocks
check('JSON-LD VideoGame', /"@type":"VideoGame"/.test(html));
check('JSON-LD FAQPage', /"@type":"FAQPage"/.test(html));
check('JSON-LD BreadcrumbList', /"@type":"BreadcrumbList"/.test(html));
check('VideoGame name', /"name":"Doppelblock"/.test(html));
check('VideoGame no fake aggregateRating', !/aggregateRating/.test(html) || !/"ratingValue"/.test(html));
check('Breadcrumb GameZipper', /gamezipper\.com/.test(html));
check('Breadcrumb Doppelblock', /doppelblock/.test(html));

// Game systems
check('LEVELS const', /const LEVELS =/.test(html));
check('LEVELS has 30', (html.match(/"i":(\d+)/g) || []).length >= 30);
check('SAVE_KEY', /SAVE_KEY = 'doppelblock_save_v1'/.test(html));
check('SETTINGS_KEY', /SETTINGS_KEY = 'doppelblock_settings_v1'/.test(html));
check('loadSave / saveSave', /loadSave\(\)|saveSave\(\)/.test(html));
check('loadSet / saveSet', /loadSet\(\)|saveSet\(\)/.test(html));
check('localStorage usage', /localStorage\.(getItem|setItem)/.test(html));

// Audio
check('Web Audio AudioContext', /new \(window\.AudioContext/.test(html));
check('sfx function', /function sfx\(/.test(html));
check('chord progression', /CHORDS = \[/.test(html));
check('Cmaj7 progression', /261\.63.*329\.63.*392.*493\.88/.test(html));
check('music start/stop', /startMusic|stopMusic/.test(html));

// Canvas rendering
check('canvas element', /<canvas id="board"/.test(html));
check('draw function', /function draw\(\)/.test(html));
check('cell drawing loop', /for \(let r = 0; r < K/.test(html));
check('black cell render', /isBlack|black/.test(html));
check('digit cell render', /fillText.*v/.test(html));
check('clue rendering', /lv\.clues/.test(html));

// Interaction
check('click handler', /addEventListener\('click'/.test(html));
check('touch handler', /addEventListener\('touchend'/.test(html));
check('keyboard handler', /addEventListener\('keydown'/.test(html));
check('digit mode', /mode-digit/.test(html));
check('erase mode', /mode-erase/.test(html));

// Validation
check('checkSolution function', /function checkSolution\(\)/.test(html));
check('row uniqueness check', /seen\.has\(v\)/.test(html));
check('column uniqueness check', /Column \$\{c \+ 1\}/.test(html));
check('clue verification', /lv\.clues\.rL\[r\]/.test(html));

// Save/load systems
check('progress localStorage', /progress\[lv\.i\]/.test(html));
check('star rating', /stars.*3|'\u2605'\.repeat/.test(html));
check('time tracking', /startTime|Date\.now\(\)/.test(html));

// UI elements
check('level select screen', /screen-levels/.test(html));
check('game screen', /screen-game/.test(html));
check('menu screen', /screen-menu/.test(html));
check('win overlay', /ov-win/.test(html));
check('settings overlay', /ov-settings/.test(html));
check('howto overlay', /ov-howto/.test(html));
check('tier label rendering', /tier-label/.test(html));
check('lvl-btn class', /class="lvl-btn"/.test(html));
check('confetti canvas', /id="confetti"/.test(html));

// Monetag/Adsterra
check('Monetag manager', /monetag-manager\.js/.test(html));
check('Adsterra manager', /adsterra-manager\.js/.test(html));
check('Game footer', /game-footer\.js/.test(html));

// Related games
check('related games section', /gz-related-games/.test(html));
check('related card grid', /gz-related-grid/.test(html));

// Game-specific content
check('5x5 Beginner mention', /Beginner/.test(html));
check('5x5 Easy mention', /Easy/.test(html));
check('6x6 Medium mention', /Medium/.test(html));
check('7x7 Hard mention', /Hard/.test(html));
check('7x7 Expert mention', /Expert/.test(html));

// Accessibility
check('sr-only h1', /gz-sr-only/.test(html));

// Cleanup
check('beforeunload handler', /beforeunload/.test(html));
check('pagehide handler', /pagehide/.test(html));
check('visibilitychange handler', /visibilitychange/.test(html));

// Asset references
check('icon.png referenced', /icon\.png/.test(html) || /doppelblock\/icon/.test(html));
check('og-image.jpg referenced', /og-image\.jpg/.test(html) || /doppelblock\/og-image/.test(html));

// Integrity
check('No fake aggregateRating', !/aggregateRating.*ratingValue/.test(html));
check('Levels inlined as const LEVELS', /const LEVELS = \[/.test(html));
check('No console errors expected', !/console\.error/.test(html) || /console\.error\(['"]?debug/i.test(html));

console.log(`\n${nPass}/${nPass + nFail} checks PASS`);
if (nFail > 0) {
  console.log('\nFAILED:');
  fail.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
} else {
  console.log('All checks passed ✓');
}