#!/usr/bin/env node
// QA checklist for Wanrumuwandoa — code-level structural verification of index.html
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ FAIL: ' + name); }
}

// 1. HTML structure
check('<!DOCTYPE html>', html.includes('<!DOCTYPE html>'));
check('<html lang=', /<html\s+lang=/.test(html));
check('<meta charset="UTF-8">', html.includes('charset="UTF-8"'));
check('<meta viewport', /name="viewport"/.test(html));
check('<title>', /<title>[^<]+<\/title>/.test(html));
check('<meta description', /name="description"/.test(html));
check('canonical link', /rel="canonical"/.test(html));
check('og:type', html.includes('og:type'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('og:url', html.includes('og:url'));
check('twitter:card', html.includes('twitter:card'));
check('theme-color', html.includes('theme-color'));

// 2. JSON-LD
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('publisher GameZipper', html.includes('"name":"GameZipper"'));

// 3. Engine
check('Canvas element', /<canvas/i.test(html));
check('LEVELS array', html.includes('const LEVELS') || html.includes('var LEVELS'));
check('checkSolution function', html.includes('function checkSolution'));
check('expand function', html.includes('function expand'));
check('loadLevel function', html.includes('function loadLevel'));
check('draw function', html.includes('function draw'));
check('layout function', html.includes('function layout'));
check('initAudio function', html.includes('function initAudio'));
check('startMusic function', html.includes('function startMusic'));
check('stopMusic function', html.includes('function stopMusic'));
check('sfx function', html.includes('function sfx'));
check('useHint function', html.includes('function useHint'));
check('doWin function', html.includes('function doWin'));
check('doCheck function', html.includes('function doCheck'));
check('flashGold function', html.includes('function flashGold'));

// 4. Game systems
check('hint system', html.includes('hintsLeft'));
check('star rating', html.includes('stars'));
check('timer', html.includes('timerInt') || html.includes('startTime'));
check('level select', html.includes('buildLevelSelect'));
check('keyboard support', html.includes('addEventListener(\'keydown\''));
check('localStorage save', html.includes('localStorage'));
check('confetti win', html.includes('confetti'));
check('touch/pointer support', html.includes('pointerdown') || html.includes('touchstart'));

// 5. Audio cleanup
check('beforeunload cleanup', html.includes('beforeunload'));
check('pagehide cleanup', html.includes('pagehide'));

// 6. SEO
check('gz-sr-only H1', html.includes('gz-sr-only') || /<h1/i.test(html));

// 7. Monetization / analytics
check('monetag-manager.js', html.includes('monetag-manager.js'));
check('game-footer.js', html.includes('game-footer.js'));
check('gz-analytics.js', html.includes('gz-analytics.js'));

// 8. Art assets referenced
check('og-image.jpg referenced', html.includes('og-image.jpg'));

// 9. Levels (30)
const levelCount = (html.match(/"i":\d+/g) || []).length;
check('30 levels embedded', levelCount === 30);

// 10. Mode toggles
check('black mode', html.includes('mode-black') || html.includes("mode='black'") || html.includes('mode:'));
check('white mode', html.includes('mode-white') || html.includes("mode='white'"));

console.log('\n' + pass + '/' + (pass+fail) + ' checks passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
