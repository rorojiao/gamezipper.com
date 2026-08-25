#!/usr/bin/env node
// Code-level QA checklist for Arukone (Number Link).
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const failList = [];

function check(name, ok, detail) {
  if (ok) pass++;
  else { fail++; failList.push(name + ': ' + detail); }
}

// HTML structure
check('HTML5 doctype', html.startsWith('<!DOCTYPE html>'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('name="viewport"'));
check('title tag', html.includes('<title>') && html.includes('Arukone'));
check('canonical link', html.includes('rel="canonical"') && html.includes('https://gamezipper.com/arukone/'));
check('theme-color', html.includes('theme-color'));
check('favicon', html.includes('rel="icon"'));

// SEO / Open Graph
check('og:type', html.includes('property="og:type"'));
check('og:title', html.includes('property="og:title"'));
check('og:description', html.includes('property="og:description"'));
check('og:image', html.includes('property="og:image"') && html.includes('og-image.jpg'));
check('og:url', html.includes('property="og:url"'));
check('twitter:card', html.includes('twitter:card'));

// JSON-LD blocks
check('VideoGame JSON-LD', html.includes('"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"BreadcrumbList"'));

// Levels data
check('LEVELS array present', html.includes('var LEVELS='));
check('30 levels present', (html.match(/\"i\":/g) || []).length >= 30 || (html.match(/\[\d+,\"[A-Z][a-z]+\",\d+/g) || []).length >= 30);

// Game systems
check('Web Audio init', html.includes('AudioContext'));
check('Music chord array', html.includes('chords=[') || html.includes('var chords') || html.includes('CHORDS'));
check('checkSolution function', html.includes('checkSolution'));
check('Hint system', html.includes('showHint') || html.includes('useHint'));
check('Star ratings', html.includes('winStars') || html.includes('win-stars'));
check('Level select', html.includes('renderLevelSelect'));
check('Win overlay', html.includes('winOverlay'));
check('Confetti', html.includes('spawnConfetti'));
check('localStorage save', html.includes('arukone_progress') || html.includes('saveProgress'));
check('Touch/click on board', html.includes("canvas.addEventListener('pointerdown'"));
check('Drag handling', html.includes('onPointerMove'));
check('5 tiers', html.includes('Beginner') && html.includes('Expert'));

// External scripts
check('games-data.js', html.includes('games-data.js'));
check('game-footer.js', html.includes('game-footer.js'));
check('monetag-manager.js', html.includes('monetag-manager.js'));
check('gz-analytics.js', html.includes('gz-analytics.js'));

// Art assets exist
check('icon.png exists', fs.existsSync(path.join(__dirname, 'icon.png')));
check('og-image.jpg exists', fs.existsSync(path.join(__dirname, 'og-image.jpg')));
if (fs.existsSync(path.join(__dirname, 'icon.png'))) {
  const sz = fs.statSync(path.join(__dirname, 'icon.png')).size;
  check('icon.png reasonable size', sz > 1000 && sz < 100000, 'size=' + sz);
}
if (fs.existsSync(path.join(__dirname, 'og-image.jpg'))) {
  const sz = fs.statSync(path.join(__dirname, 'og-image.jpg')).size;
  check('og-image.jpg reasonable size', sz > 5000 && sz < 500000, 'size=' + sz);
}

// Levels.json
check('levels.json exists', fs.existsSync(path.join(__dirname, 'levels.json')));
if (fs.existsSync(path.join(__dirname, 'levels.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json')));
  check('levels.json has 30 levels', data.levels && data.levels.length === 30);
  for (const lv of data.levels) {
    check(`L${lv.i} has pairs`, Array.isArray(lv.p) && lv.p.length > 0);
    check(`L${lv.i} solution size N*N`, Array.isArray(lv.g) && lv.g.length === lv.r);
  }
}

// Size check
check('index.html < 100KB', html.length < 100000, 'size=' + html.length);

console.log('\n' + pass + ' checks passed, ' + fail + ' failed');
if (fail > 0) {
  console.log('\nFailures:');
  failList.forEach(f => console.log('  ' + f));
  process.exit(1);
}
process.exit(0);
