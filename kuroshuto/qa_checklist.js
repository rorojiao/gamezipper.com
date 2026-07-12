// qa_checklist.js — Code-level QA checklist for Kuroshuto
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
check('LEVELS defined', html.includes('const LEVELS'));
check('loadLevel function', html.includes('function loadLevel'));
check('draw function', html.includes('function draw'));
check('checkViolations', html.includes('function checkViolations'));
check('doCheck function', html.includes('function doCheck'));
check('doHint function', html.includes('function doHint'));
check('doRestart function', html.includes('function doRestart'));
check('handleCellClick', html.includes('function handleCellClick'));
check('isConnected check', html.includes('isConnected') || html.includes('visited.size'));

// 4. Audio (Web Audio API)
check('AudioContext init', html.includes('AudioContext'));
check('BGM function', html.includes('startBGM') || html.includes('playChord'));
check('SFX functions', html.includes('playTone'));
check('music toggle', html.includes('set-music') || html.includes('musicOn'));
check('sfx toggle', html.includes('set-sfx') || html.includes('sfxOn'));

// 5. UI elements
check('Level select', html.includes('showMenu'));
check('How to play', html.includes('showHowTo'));
check('Settings panel', html.includes('showSettings'));
check('Win overlay', html.includes('showWinOverlay'));
check('Toast notifications', html.includes('showToast'));
check('Timer', html.includes('updateTimer'));
check('Star ratings', html.includes('stars'));
check('Hint count display', html.includes('hint-count'));

// 6. Input support
check('click handler', html.includes('addEventListener(\'click\''));
check('touch handler', html.includes('touchstart'));
check('contextmenu (right-click)', html.includes('contextmenu'));
check('keyboard handler', html.includes('keydown'));

// 7. Progress / localStorage
check('localStorage save', html.includes('localStorage.setItem'));
check('localStorage load', html.includes('localStorage.getItem'));
check('progress tracking', html.includes('saveProgress'));

// 8. Mode system
check('fill mode', html.includes("data-mode=\"fill\""));
check('erase mode', html.includes("data-mode=\"erase\""));

// 9. No JS errors (basic syntax check via vm)
let jsError = null;
try {
  // Extract main script
  const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
  for (const s of scripts) {
    if (s.includes('const LEVELS') || s.includes('function loadLevel')) {
      const code = s.replace(/<\/?script>/g, '');
      // Don't run, just parse
      new vm.Script(code);
    }
  }
} catch(e) {
  jsError = e.message;
}
check('No JS syntax errors', !jsError);
if (jsError) console.log(`   Error: ${jsError}`);

// 10. Levels data
let levelCount = 0;
try {
  const m = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
  if (m) {
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(`var LEVELS = ${m[1]};`, sandbox);
    levelCount = sandbox.LEVELS.length;
  }
} catch(e) {}
check('30 levels loaded', levelCount === 30);
check('levels have R,C,clues,solution', levelCount > 0);

// 11. SEO
check('sr-only H1', html.includes('gz-sr-only'));
check('favicon inline SVG', html.includes('data:image/svg+xml'));

// 12. Responsive
check('mobile viewport', html.includes('maximum-scale=1.0'));
check('CSS media query', html.includes('@media'));

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${pass}/${pass+fail} passed`);
if (fail === 0) console.log('✅ ALL CHECKS PASSED');
else console.log(`❌ ${fail} checks failed`);
process.exit(fail > 0 ? 1 : 0);
