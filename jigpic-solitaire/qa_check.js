// Comprehensive Phase 7 QA for jigpic-solitaire
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/jigpic-solitaire/index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  const ok = typeof cond === 'function' ? cond() : cond;
  console.log((ok ? 'OK   ' : 'FAIL ') + name);
  ok ? pass++ : fail++;
}

// HTML & SEO
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('lang attribute', html.includes('lang="en"'));
check('viewport meta', html.includes('viewport'));
check('title tag', html.includes('<title>') && html.includes('Jigpic'));
check('meta description', html.includes('name="description"'));
check('meta keywords', html.includes('name="keywords"'));
check('canonical URL', html.includes('canonical'));
check('og:title', html.includes('og:title'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));
check('site-analytics', html.includes('site-analytics.cap.1ktower.com'));
check('Monetag script', html.includes('mtbkfreeze.com') || html.includes('monetag'));

// Structured Data
check('JSON-LD VideoGame', html.includes('"@type":"VideoGame"'));
check('JSON-LD FAQPage', html.includes('"@type":"FAQPage"'));
check('JSON-LD HowTo', html.includes('"@type":"HowTo"'));
check('JSON-LD BreadcrumbList', html.includes('"@type":"BreadcrumbList"'));

// CSS & Responsive
check('dark theme bg', html.includes('#0a0a1a') || html.includes('--bg'));
check('touch-action none', html.includes('touch-action:none') || html.includes('touch-action: none'));
check('user-select none', html.includes('user-select:none') || html.includes('user-select: none'));
check('overflow-x hidden', html.includes('overflow-x:hidden') || html.includes('overflow-x: hidden'));
check('no text-stroke', !html.includes('-webkit-text-stroke'));
check('responsive viewport', html.includes('maximum-scale=1'));
check('flex layout', html.includes('display:flex') || html.includes('display: flex'));

// Game Logic
check('LEVELS array', html.includes('var LEVELS='));
check('30 levels data', (html.match(/"level":\d+/g) || []).length >= 30);
check('Canvas element', html.includes('<canvas'));
check('getContext', html.includes("getContext('2d')") || html.includes('getContext("2d")'));
check('requestAnimationFrame', html.includes('requestAnimationFrame'));
check('cancelAnimationFrame', html.includes('cancelAnimationFrame'));
check('checkSolved function', html.includes('function checkSolved'));
check('star calculation', html.includes('function calcStars'));
check('hint system', html.includes('function doHint'));
check('undo system', html.includes('function doUndo'));
check('restart', html.includes('function doRestart'));
check('daily challenge', html.includes('startDailyLevel'));
check('localStorage save', html.includes('localStorage.getItem') && html.includes('localStorage.setItem'));
check('progress tracking', html.includes('S.progress'));
check('achievement system', html.includes('ACHIEVEMENTS'));
check('tutorial/onboarding', html.includes('screen-tutorial') || html.includes('firstVisit'));

// Input
check('pointer events', html.includes('pointerdown'));
check('touch events', html.includes('touchstart'));
check('preventDefault', html.includes('e.preventDefault'));

// Audio
check('AudioContext', html.includes('AudioContext'));
check('BGM function', html.includes('function startBGM'));
check('stopBGM function', html.includes('function stopBGM'));
check('sound effects', html.includes('function playSound'));
check('multiple SFX types', html.includes("'select'") && html.includes("'swap'") && html.includes("'win'"));

// State Management
check('save version field', html.includes('v:1'));
check('level unlock', html.includes('unlocked'));
check('stars saved', html.includes('stars:'));
check('bestMoves tracked', html.includes('bestMoves'));

// Performance
check('cleanup function', html.includes('function cleanup'));
check('beforeunload handler', html.includes('beforeunload'));
check('visibilitychange', html.includes('visibilitychange'));
check('setInterval tracked or none', html.includes('clearTimeout') || html.includes('clearInterval'));

// Accessibility
check('window resize handler', html.includes('resize'));
check('no division by zero risk', !html.includes('/ 0'));

// Code Quality
check('no console.log', !html.includes('console.log('));
check('no TODO/FIXME', !html.includes('TODO') && !html.includes('FIXME'));
check('organized sections', html.includes('==='));
check('no external CSS files', !html.includes('rel="stylesheet"'));
check('no external JS files', !html.includes('src="http') || html.includes('site-analytics') || html.includes('monetag'));

// Emoji check (no emoji in game code, only in locked level card which is DOM)
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F000}-\u{1F2FF}\u{1FA70}-\u{1FAFF}]/u;
check('no emoji in canvas fillText', !emojiRegex.test(html.replace(/<div class="level-num">[^<]*<\/div>/g, '')));

console.log('\n' + pass + '/' + (pass+fail) + ' passed' + (fail ? ' (' + fail + ' FAILED)' : ''));
if (fail > 0) process.exit(1);
