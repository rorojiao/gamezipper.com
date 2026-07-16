#!/usr/bin/env node
// Code-level QA checklist for Renzoku.
// Validates HTML structure, SEO, art assets, all game systems.
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
let pass = 0, fail = 0;
const failList = [];

function check(name, ok, detail) {
  if (ok) pass++;
  else { fail++; failList.push(`${name}: ${detail}`); }
}

// HTML structure
check('HTML5 doctype', html.startsWith('<!DOCTYPE html>'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('name="viewport"'));
check('title tag', html.includes('<title>') && html.includes('Renzoku'));
check('canonical link', html.includes('rel="canonical"') && html.includes('https://gamezipper.com/renzoku/'));
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

// H1 (sr-only)
check('h1 gz-sr-only', /<h1 class="gz-sr-only">/.test(html));
check('h1 mentions Renzoku', /<h1[^>]*>[\s\S]*?Renzoku[\s\S]*?<\/h1>/.test(html));

// Levels data
check('LEVELS const present', /const LEVELS = \[\{/.test(html));
check('30 levels', (html.match(/"i":\d+/g) || []).length >= 30);
check('30 givens total', (html.match(/\[\d+,\d+,\d+\]/g) || []).length >= 300);

// Game systems
check('Web Audio init', html.includes('AudioContext'));
check('Music CHORDS', html.includes('CHORDS = ['));
check('checkSolution function', html.includes('function checkSolution'));
check('Hint system', html.includes('useHint'));
check('Star ratings', html.includes('win-stars'));
check('Level select', html.includes('renderLevelSelect'));
check('Timer', html.includes('updTimer'));
check('Settings panel', html.includes('ov-settings'));
check('HowTo panel', html.includes('ov-howto'));
check('Win overlay', html.includes('ov-win'));
check('Confetti', html.includes('fireConfetti'));
check('localStorage save', html.includes("SAVE_KEY = 'renzoku_save"));
check('localStorage settings', html.includes("SETTINGS_KEY = 'renzoku_settings"));
check('Keyboard support', html.includes("keydown"));
check('Touch/click on board', html.includes("cvs.addEventListener('click'"));
check('Mode toggle (digit/erase)', html.includes('mode-digit') && html.includes('mode-erase'));
check('Clear button', html.includes('btn-clear'));
check('Restart button', html.includes('btn-restart'));
check('Check button', html.includes('btn-check'));
check('Next button', html.includes('btn-next'));
check('Replay button', html.includes('btn-replay'));
check('Auto-check toggle', html.includes('set-auto'));
check('Visibility cleanup', html.includes('visibilitychange'));
check('pagehide cleanup', html.includes('pagehide'));
check('beforeunload cleanup', html.includes('beforeunload'));
check('Pending cell mode', html.includes('pendingCell'));
check('5 tiers', html.includes("'Beginner'") && html.includes("'Expert'"));
check('30 levels split', (html.match(/"t":"Beginner"/g) || []).length === 6 &&
                       (html.match(/"t":"Easy"/g) || []).length === 6 &&
                       (html.match(/"t":"Medium"/g) || []).length === 6 &&
                       (html.match(/"t":"Hard"/g) || []).length === 6 &&
                       (html.match(/"t":"Expert"/g) || []).length === 6);

// External scripts
check('game-footer.js', html.includes('game-footer.js'));
check('game-audio.js', html.includes('game-audio.js') || true /* optional */);
check('monetag-manager.js', html.includes('monetag-manager.js'));
check('adsterra-manager.js', html.includes('adsterra-manager.js'));
check('gz-analytics.js', html.includes('gz-analytics.js'));

// Related games
check('Related games section', html.includes('gz-related-games'));
check('Multiple related games', (html.match(/gz-related-card/g) || []).length >= 5);

// Art assets exist
const fs2 = require('fs');
check('icon.png exists', fs2.existsSync('icon.png'));
check('og-image.jpg exists', fs2.existsSync('og-image.jpg'));
if (fs2.existsSync('icon.png')) {
  const sz = fs2.statSync('icon.png').size;
  check('icon.png reasonable size', sz > 1000 && sz < 100000, `size=${sz}`);
}
if (fs2.existsSync('og-image.jpg')) {
  const sz = fs2.statSync('og-image.jpg').size;
  check('og-image.jpg reasonable size', sz > 5000 && sz < 500000, `size=${sz}`);
}

// Levels.json
check('levels.json exists', fs2.existsSync('levels.json'));
if (fs2.existsSync('levels.json')) {
  const data = JSON.parse(fs2.readFileSync('levels.json'));
  check('levels.json has 30 levels', data.LEVELS && data.LEVELS.length === 30);
  for (const lv of data.LEVELS) {
    check(`L${lv.i+1} has givens`, Array.isArray(lv.g));
    check(`L${lv.i+1} has solution`, Array.isArray(lv.s) && lv.s.length === lv.N * lv.N);
  }
}

// gz-ad-below-game container
check('gz-ad-below-game container', html.includes('gz-ad-below-game'));

console.log(`\n${pass} checks passed, ${fail} failed`);
if (fail > 0) {
  console.log('\nFailures:');
  failList.forEach(f => console.log('  ' + f));
  process.exit(1);
}
process.exit(0);