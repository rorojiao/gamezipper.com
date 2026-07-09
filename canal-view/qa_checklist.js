#!/usr/bin/env node
/**
 * Canal View — Code-Level QA Checklist
 * Verifies all required systems and structure in index.html
 */

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let checks = [];
let pass = 0, fail = 0;

function check(name, condition) {
  checks.push({ name, pass: !!condition });
  if (condition) pass++; else fail++;
}

// === SEO & META ===
check('Title tag', /<title>Canal View/.test(html));
check('Meta description', /name="description"/.test(html) && /canal view/i.test(html.match(/name="description" content="([^"]+)"/)?.[1] || ''));
check('Meta keywords', /name="keywords"/.test(html));
check('Canonical URL', /rel="canonical" href="https:\/\/gamezipper\.com\/canal-view\/"/.test(html));
check('OG title', /property="og:title" content="Canal View/.test(html));
check('OG description', /property="og:description"/.test(html));
check('OG image', /property="og:image" content="https:\/\/gamezipper\.com\/canal-view\/og-image\.jpg"/.test(html));
check('OG url', /property="og:url" content="https:\/\/gamezipper\.com\/canal-view\/"/.test(html));
check('Twitter card', /name="twitter:card" content="summary_large_image"/.test(html));
check('Theme color', /name="theme-color"/.test(html));
check('Viewport', /name="viewport".*maximum-scale=1/.test(html));
check('gz-sr-only H1', /gz-sr-only/.test(html) && /<h1/.test(html));

// === JSON-LD STRUCTURED DATA ===
check('VideoGame schema', /"@type":\s*"VideoGame"/.test(html));
check('FAQPage schema', /"@type":\s*"FAQPage"/.test(html));
check('HowTo schema', /"@type":\s*"HowTo"/.test(html));
check('BreadcrumbList schema', /"@type":\s*"BreadcrumbList"/.test(html));
check('Offer with price 0', /"price":\s*"0"/.test(html));
check('AggregateRating', /aggregateRating/.test(html));

// === GAME STRUCTURE ===
check('Canvas element', /id="game-canvas"/.test(html));
check('LEVELS data embedded', /const LEVELS\s*=/.test(html));
check('Menu screen', /id="menu-screen"/.test(html));
check('Level select screen', /id="level-select-screen"/.test(html));
check('Game screen', /id="game-screen"/.test(html));
check('Win overlay', /id="win-overlay"/.test(html));
check('HUD with level/time/hints', /id="hud-level"/.test(html) && /id="hud-time"/.test(html) && /id="hud-hints"/.test(html));

// === GAME SYSTEMS ===
check('Start level function', /function startLevel/.test(html));
check('Check win function', /function checkWin/.test(html));
check('Violation checking', /function checkViolations/.test(html));
check('Hint system', /function useHint/.test(html));
check('Canvas resize', /function resizeCanvas/.test(html));
check('Board rendering', /function drawBoard/.test(html));
check('Audio init', /function initAudio/.test(html));
check('BGM start', /function startBGM/.test(html));
check('BGM stop', /function stopBGM/.test(html));
check('SFX function', /function playSFX/.test(html));
check('Progress save/load', /function saveProgress/.test(html) && /function loadProgress/.test(html));
check('Settings toggles', /toggle-sfx/.test(html) && /toggle-bgm/.test(html));
check('Level select rendering', /function renderLevelSelect/.test(html));
check('Screen management', /function showScreen/.test(html));
check('Cleanup function', /function cleanup/.test(html));

// === INTERACTION ===
check('Pointer down handler', /pointerdown/.test(html));
check('Context menu handler', /contextmenu/.test(html));
check('Touch events', /touchstart/.test(html) && /touchend/.test(html));
check('Keyboard support', /keydown/.test(html));
check('Window resize', /window\.addEventListener\('resize'/.test(html));
check('Visibility change', /visibilitychange/.test(html));

// === GAME RULES ===
check('Clue satisfaction check', /clue/.test(html) && /canalCount/.test(html));
check('2x2 detection', /player\[r\]\[c\]===1.*player\[r\+1\]\[c\]===1/.test(html));
check('Connectivity check', /visited/.test(html) && /canal/.test(html));

// === SITE CHROME ===
check('gz-analytics script', /gz-analytics\.js/.test(html));
check('game-footer script', /game-footer\.js/.test(html));
check('adsterra script', /adsterra-manager\.js/.test(html));
check('monetag script', /monetag-manager\.js/.test(html));
check('ad div container', /gz-ad-below-game/.test(html));
check('Home link', /href="\/"/.test(html));

// === ASSETS ===
const iconExists = fs.existsSync('icon.png');
const ogExists = fs.existsSync('og-image.jpg');
check('icon.png exists', iconExists);
check('og-image.jpg exists', ogExists);
if (iconExists) {
  const stats = fs.statSync('icon.png');
  check('icon.png > 1KB', stats.size > 1000);
}
if (ogExists) {
  const stats = fs.statSync('og-image.jpg');
  check('og-image.jpg > 5KB', stats.size > 5000);
}

// === LEVEL DATA ===
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
if (levelsMatch) {
  try {
    const vm = require('vm');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext('var L = ' + levelsMatch[1] + '; this.L = L;', sandbox);
    const levels = sandbox.L;
    check('30 levels', levels.length === 30);
    check('Level 1 is 5x5', levels[0].R === 5 && levels[0].C === 5);
    check('Level 30 is 9x9', levels[29].R === 9 && levels[29].C === 9);
    check('All levels have clues', levels.every(l => l.clues && l.clues.length > 0));
    check('All levels have shown mask', levels.every(l => l.shown && l.shown.length > 0));
    check('All levels have solution', levels.every(l => l.sol && l.sol.length > 0));
    check('5 tiers present', new Set(levels.map(l => l.tier)).size === 5);
  } catch(e) {
    check('Level data parseable', false);
  }
} else {
  check('Level data found', false);
}

// === REPORT ===
console.log('=== Canal View QA Checklist ===\n');
checks.forEach(c => {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
});
console.log(`\n${pass}/${checks.length} passed, ${fail} failed`);
console.log(`\n=== QA: ${fail === 0 ? 'PASS ✓' : 'FAIL ✗'} ===`);
process.exit(fail === 0 ? 0 : 1);
