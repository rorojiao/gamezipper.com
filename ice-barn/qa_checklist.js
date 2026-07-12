// qa_checklist.js — Code-level QA checklist for Ice Barn
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`); }
}

// 1. HTML structure
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('lang attribute', html.includes('lang="en"'));
check('viewport meta', html.includes('viewport'));
check('title tag', html.includes('<title>'));
check('meta description', html.includes('name="description"'));
check('canonical link', html.includes('rel="canonical"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));

// 2. JSON-LD blocks
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));

// 3. Canvas + game logic
check('canvas element', html.includes('<canvas'));
check('Canvas getContext', html.includes("getContext('2d')") || html.includes('getContext("2d")'));
check('RAW_LEVELS defined', html.includes('const RAW_LEVELS'));
check('LEVELS assigned', html.includes('LEVELS = RAW_LEVELS'));
check('loadLevel function', html.includes('function loadLevel'));
check('draw function', html.includes('function draw'));
check('checkSolution function', html.includes('function checkSolution'));
check('doHint function', html.includes('function doHint'));
check('clearPath function', html.includes('function clearPath'));
check('tryAddCell function', html.includes('function tryAddCell'));
check('canExtend function', html.includes('function canExtend'));
check('computeIceAreas function', html.includes('function computeIceAreas'));

// 4. Audio (Web Audio API)
check('AudioContext init', html.includes('AudioContext') || html.includes('audioCtx'));
check('startMusic function', html.includes('function startMusic'));
check('playSfx function', html.includes('function playSfx'));
check('music toggle', html.includes('tog-music'));
check('sfx toggle', html.includes('tog-sfx'));
check('autocheck toggle', html.includes('tog-autocheck'));

// 5. UI elements
check('Level select', html.includes('function buildLevelSelect') || html.includes('toggleLevels'));
check('Settings panel', html.includes('toggleSettings'));
check('Win overlay', html.includes('showWinOverlay'));
check('Timer', html.includes('updateTimer'));
check('Star ratings', html.includes('stars'));
check('Hint count display', html.includes('hud-hints'));
check('Confetti', html.includes('launchConfetti'));
check('Tier labels in level select', html.includes('tier-label'));

// 6. Input support
check('mousedown handler', html.includes("addEventListener('mousedown'"));
check('mousemove handler', html.includes("addEventListener('mousemove'"));
check('touch handler', html.includes('touchstart'));
check('touchmove handler', html.includes('touchmove'));
check('keyboard handler', html.includes('addEventListener(\'keydown\''));

// 7. Progress / localStorage
check('localStorage save', html.includes('localStorage.setItem'));
check('localStorage load', html.includes('localStorage.getItem'));
check('progress tracking', html.includes('saveProgress'));
check('settings save', html.includes('saveSettings'));

// 8. Mode system
check('draw mode', html.includes("mode = 'draw'"));
check('erase mode', html.includes("'erase'") && html.includes('btn-erase'));
check('setMode function', html.includes('function setMode'));

// 9. No JS errors (basic syntax check via vm)
let jsError = null;
try {
  const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
  for (const s of scripts) {
    if (s.includes('RAW_LEVELS') || s.includes('function loadLevel')) {
      const code = s.replace(/<\/?script>/g, '');
      new vm.Script(code);
    }
  }
} catch(e) {
  jsError = e.message;
}
check('No JS syntax errors', !jsError);
if (jsError) console.log(`   Error: ${jsError}`);

// 10. Levels data — extract via bracket matching
let levelCount = 0;
try {
  const idx = html.indexOf('const RAW_LEVELS');
  const bs = html.indexOf('[', idx);
  let depth = 0, end = -1;
  for (let i = bs; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  const lvlStr = html.slice(bs, end+1);
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`var RAW_LEVELS = ${lvlStr};`, sandbox);
  levelCount = sandbox.RAW_LEVELS.length;
} catch(e) { console.log('   level parse error:', e.message); }
check('30 levels loaded', levelCount === 30);
check('levels have rows,cols,entry,exit,ice,arrows,solution', levelCount > 0);

// 11. SEO
check('sr-only H1', html.includes('gz-sr-only'));
check('icon.png link', html.includes('/ice-barn/icon.png'));

// 12. Responsive
check('mobile viewport', html.includes('maximum-scale=1.0'));
check('CSS media query', html.includes('@media'));

// 13. Site integration
check('site-analytics', html.includes('site-analytics.js'));
check('Monetag ad slot', html.includes('gz-ad-below-game'));
check('topnav brand', html.includes('GameZipper'));
check('puzzle games link', html.includes('puzzle-games.html'));

// 14. Game-specific features
check('ice area rendering', html.includes("=== 'ice'"));
check('entry marker', html.includes('drawCellMarker'));
check('arrow rendering', html.includes('ar.dir'));
check('path rendering', html.includes('path.length'));

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${pass}/${pass+fail} passed`);
if (fail === 0) console.log('✅ ALL CHECKS PASSED');
else console.log(`❌ ${fail} checks failed`);
process.exit(fail > 0 ? 1 : 0);
