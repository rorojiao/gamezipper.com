#!/usr/bin/env node
// qa_checklist.js — Code-level QA checklist for Scrin
// Validates all required systems are present in the code.

const fs = require('fs');

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} — ${detail || 'failed'}`); }
}

const html = fs.readFileSync('index.html', 'utf8');
const levelsData = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

// === HTML structure ===
check('HTML doctype present', html.startsWith('<!DOCTYPE html>'));
check('Title contains "Scrin"', html.includes('<title>Scrin'));
check('Meta description', html.includes('meta name="description"'));
check('Canonical link', html.includes('rel="canonical"') && html.includes('gamezipper.com/scrin/'));
check('Viewport meta', html.includes('name="viewport"'));

// === SEO / JSON-LD ===
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('Open Graph title', html.includes('property="og:title"'));
check('Open Graph image', html.includes('property="og:image"') && html.includes('/scrin/og-image.jpg'));

// === Art assets ===
check('icon.png exists', fs.existsSync('icon.png'));
check('og-image.jpg exists', fs.existsSync('og-image.jpg'));
check('favicon-32.png exists', fs.existsSync('favicon-32.png'));
if (fs.existsSync('icon.png')) {
  const size = fs.statSync('icon.png').size;
  check('icon.png size > 1KB', size > 1024, `size=${size}`);
}
if (fs.existsSync('og-image.jpg')) {
  const size = fs.statSync('og-image.jpg').size;
  check('og-image.jpg size > 5KB', size > 5000, `size=${size}`);
}

// === Game systems ===
check('30 levels', levelsData.length === 30, `count=${levelsData.length}`);
check('5 tiers (Beginner/Easy/Medium/Hard/Expert)',
  ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'].every(t => levelsData.some(L => L.tier === t)));
check('All levels have rows/cols', levelsData.every(L => L.rows > 0 && L.cols > 0));
check('All levels have clues', levelsData.every(L => L.clues && L.clues.length > 0));
check('All levels have solutions', levelsData.every(L => L.solution && L.solution.length > 0));
check('Clues within grid bounds', levelsData.every(L => L.clues.every(cl => cl.r >= 0 && cl.r < L.rows && cl.c >= 0 && cl.c < L.cols)));
check('Solutions cover all cells', levelsData.every(L => {
  const total = L.solution.reduce((s, r) => s + (r.r1 - r.r0 + 1) * (r.c1 - r.c0 + 1), 0);
  return total === L.rows * L.cols;
}));

// === Engine features ===
check('Canvas rendering', html.includes('canvas') && html.includes('getContext'));
check('Border drawing (toggleBorder)', html.includes('toggleBorder'));
check('Hint system (giveHint)', html.includes('giveHint'));
check('Check button (checkAndMaybeWin)', html.includes('checkAndMaybeWin'));
check('Clear button', html.includes('clearAll'));
check('Region detection (computeRegions)', html.includes('computeRegions'));
check('Rectangle check (isRectangle)', html.includes('isRectangle'));
check('Win detection', html.includes('state.won') && html.includes('allValid'));
check('3-star rating', html.includes('computeStars'));
check('Timer', html.includes('startTimer') && html.includes('timer'));
check('Level select (menuOverlay)', html.includes('menuOverlay') && html.includes('tierList'));
check('Keyboard support', html.includes('keydown') && html.includes('Escape'));
check('Web Audio API (music)', html.includes('AudioContext') && html.includes('startMusic'));
check('Web Audio API (sfx)', html.includes('playClick') && html.includes('playError') && html.includes('playWin'));
check('localStorage save', html.includes('localStorage') && html.includes('SAVE_KEY'));
check('Settings panel', html.includes('settingsPanel'));
check('Music toggle', html.includes('musicToggle'));
check('SFX toggle', html.includes('sfxToggle'));
check('Autocheck toggle', html.includes('autocheckToggle'));
check('Mode buttons (place/erase)', html.includes('placeBtn') && html.includes('eraseBtn'));
check('Hint counter UI', html.includes('id="hints"'));
check('Tier label UI', html.includes('id="tier"'));
check('Level number UI', html.includes('id="lvlNum"'));
check('Touch support', html.includes('pointerdown'));
check('Responsive resize', html.includes('addEventListener(\'resize\''));
check('Game footer', html.includes('game-footer.js'));
check('Analytics', html.includes('gz-analytics.js'));
check('Monetag ad', html.includes('monetag-manager.js'));
check('Adsterra', html.includes('adsterra-manager.js'));
check('Ad placeholder div', html.includes('gz-ad-below-game'));

// === Difficulty progression ===
const tiers = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
const tierCounts = tiers.map(t => levelsData.filter(L => L.tier === t).length);
check('Each tier has 6 levels', tierCounts.every(c => c === 6), `counts=${tierCounts.join(',')}`);
const tierSizes = tiers.map(t => {
  const ls = levelsData.filter(L => L.tier === t);
  return [ls[0].rows, ls[0].cols];
});
check('Tier size progression (5x5→5x6→7x7→8x8→9x9)',
  JSON.stringify(tierSizes) === JSON.stringify([[5,5],[5,6],[7,7],[8,8],[9,9]]),
  `sizes=${tierSizes.map(s=>s.join('x')).join(',')}`);

console.log(`\nResult: ${passed} passed, ${failed} failed (${passed}/${passed+failed})`);
process.exit(failed === 0 ? 0 : 1);
