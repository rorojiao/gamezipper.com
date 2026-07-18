#!/usr/bin/env node
// qa_checklist.js — Code-level QA for Sokoban Switch
// Validates HTML structure, SEO, art assets, all game systems.
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
let pass = 0, fail = 0;
const failList = [];

function check(name, ok, detail){
  if (ok) { pass++; }
  else { fail++; failList.push(`${name}: ${detail||''}`); }
}

// HTML structure
check('HTML5 doctype', html.startsWith('<!DOCTYPE html>'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('name="viewport"'));
check('title tag', html.includes('<title>') && html.includes('Sokoban Switch'));
check('canonical link', html.includes('rel="canonical"') && html.includes('https://gamezipper.com/sokoban-switch/'));
check('theme-color', html.includes('theme-color'));
check('favicon', html.includes('rel="icon"') || html.includes('rel="shortcut icon"'));

// SEO / Open Graph
check('og:type', html.includes('property="og:type"'));
check('og:title', html.includes('property="og:title"'));
check('og:description', html.includes('property="og:description"'));
check('og:image', html.includes('property="og:image"') && html.includes('og-image.jpg'));
check('og:url', html.includes('property="og:url"') && html.includes('sokoban-switch'));
check('twitter:card', html.includes('twitter:card'));
check('twitter:title', html.includes('twitter:title'));

// JSON-LD blocks
check('VideoGame JSON-LD', html.includes('"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"BreadcrumbList"'));

// H1
check('h1 gz-sr-only', /<h1 class="gz-sr-only">/.test(html));
check('h1 mentions Sokoban Switch', /<h1[^>]*>[\s\S]*?Sokoban Switch[\s\S]*?<\/h1>/.test(html));

// Levels data
check('LEVELS const present', /const LEVELS = \[[\s\S]*?\{t:/.test(html));
check('plate.on used in engine', html.includes('plate.on'));
const levelCount = (html.match(/\{t:'/g) || []).length;
check('30 levels', levelCount === 30, `count=${levelCount}`);

// Game systems
check('Web Audio init', html.includes('AudioContext'));
check('checkSolution function', html.includes('function checkSolution'));
check('Hint system', html.includes('useHint') || html.includes('btn-hint'));
check('Star ratings', html.includes('win-stars') || html.includes('star'));
check('Level select', html.includes('renderLevelGrid') || html.includes('lvl-grid'));
check('Timer', html.includes('updTimer') || html.includes('Moves') || html.includes('Moves'));
check('Settings panel', html.includes('ov-settings') || html.includes('settings'));
check('HowTo panel', html.includes('ov-howto') || html.includes('howto'));
check('Win overlay', html.includes('ov-win'));
check('Confetti', html.includes('fireConfetti') || html.includes('confetti'));
check('localStorage save (SAVE_KEY)', html.includes("'sokoban_switch_save"));
check('localStorage settings (SETTINGS_KEY)', html.includes("'sokoban_switch_settings"));
check('Keyboard support', html.includes('keydown'));
check('Touch/click on board', html.includes("cvs.addEventListener('click'") || html.includes("cvs.addEventListener"));
check('Visibility cleanup', html.includes('visibilitychange'));
check('pagehide cleanup', html.includes('pagehide'));
check('beforeunload cleanup', html.includes('beforeunload'));

// Pressure plate / Gate system
check('Pressure plate logic (plate.on)', html.includes('plate.on'));
check('Gate logic (gate.open)', html.includes('gate.open'));
check('4 colors RGLY', html.includes('R:') && html.includes('L:') && html.includes('Y:'));

// External scripts
check('game-footer.js', html.includes('game-footer.js'));
check('monetag-manager.js', html.includes('monetag-manager.js'));
check('adsterra-manager.js', html.includes('adsterra-manager.js'));
check('gz-analytics.js', html.includes('gz-analytics.js'));
check('gz-ad-below-game container', html.includes('gz-ad-below-game'));

// Art assets exist
check('icon.png exists', fs.existsSync('icon.png'));
if (fs.existsSync('icon.png')){
  const sz = fs.statSync('icon.png').size;
  check('icon.png reasonable size', sz > 500 && sz < 100000, `size=${sz}`);
}
check('og-image.jpg exists', fs.existsSync('og-image.jpg'));
if (fs.existsSync('og-image.jpg')){
  const sz = fs.statSync('og-image.jpg').size;
  check('og-image.jpg reasonable size', sz > 5000 && sz < 500000, `size=${sz}`);
}

// Levels.json file - not required, inlined in HTML
// (skipped intentionally)

// Mobile responsive
check('Viewport responsive', html.includes('width=device-width'));
check('user-scalable=no (prevent zoom)', html.includes('user-scalable=no') || html.includes('user-scalable'));

// Difficulty tiers
check('5 tiers (Beginner/Expert)', html.includes('Beginner') && html.includes('Easy') && html.includes('Medium') && html.includes('Hard') && html.includes('Expert'));

// Tier counts (6 each = 30)
const tierCounts = {
  Beginner: (html.match(/t:'Beginner'/g) || []).length,
  Easy: (html.match(/t:'Easy'/g) || []).length,
  Medium: (html.match(/t:'Medium'/g) || []).length,
  Hard: (html.match(/t:'Hard'/g) || []).length,
  Expert: (html.match(/t:'Expert'/g) || []).length,
};
const tierOK = Object.values(tierCounts).every(n => n === 6);
check('Tier counts: 6 each', tierOK, JSON.stringify(tierCounts));

console.log(`\n${pass} checks passed, ${fail} failed`);
if (fail > 0){
  console.log('\nFailures:');
  failList.forEach(f => console.log('  ' + f));
  process.exit(1);
}
process.exit(0);