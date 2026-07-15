// qa_checklist.js — Code-level QA checklist for Rekuto
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

let checks = [];
function check(name, cond) { checks.push({name, pass: !!cond}); }

// 1. HTML structure
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('lang attribute', html.includes('<html lang="en">'));
check('meta charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('name="viewport"'));
check('title present', /<title>.*Rekuto.*<\/title>/.test(html));
check('meta description', html.includes('name="description"'));
check('canonical link', html.includes('rel="canonical"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('og:url', html.includes('og:url'));
check('twitter:card', html.includes('twitter:card'));
check('favicon (svg data uri)', html.includes('data:image/svg+xml'));

// 2. JSON-LD blocks
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList'));
check('no aggregateRating (avoid fake)', !html.includes('aggregateRating'));

// 3. SEO
check('gz-sr-only H1', html.includes('class="gz-sr-only"') && html.includes('<h1'));
check('Rekuto in title', html.includes('Rekuto'));

// 4. Game systems
check('LEVELS defined', /LEVELS\s*=/.test(html));
check('checkWin function', html.includes('checkWin'));
check('hint function', /function\s+hint|doHint|useHint|function\s+doHint/.test(html));
check('clear/reset function', /function\s+clear|resetLevel|retryLevel|clearBoard|function\s+retryLevel/.test(html));
check('check function', /function\s+check|checkPuzzle/.test(html));
check('Canvas element', html.includes('<canvas'));
check('Web Audio API', html.includes('AudioContext') || html.includes('audioContext'));
check('ambient music / chord', html.includes('Cmaj7') || html.includes('chord') || html.includes('playChord') || html.includes('ambient'));
check('SFX', html.includes('sfx') || html.includes('playSfx') || html.includes('beep'));
check('confetti', html.includes('confetti') || html.includes('Confetti'));
check('localStorage', html.includes('localStorage'));
check('timer', html.includes('timer') || html.includes('Timer'));
check('level select', html.includes('levelSelect') || html.includes('level-select') || html.includes('showMenu') || html.includes('menu'));
check('keyboard support', html.includes('keydown') || html.includes('addEventListener'));
check('touch support', html.includes('touch') || html.includes('pointer'));
check('AudioContext cleanup', html.includes('beforeunload') && (html.includes('pagehide')||html.includes('visibilitychange')));

// 5. Monetization + analytics
check('Monetag script', html.includes('monetag-manager.js'));
check('Adsterra script', html.includes('adsterra-manager.js'));
check('game-footer', html.includes('game-footer.js'));
check('gz-analytics', html.includes('gz-analytics.js'));

// 6. Art assets
check('icon reference', html.includes('icon.png') || html.includes('apple-touch-icon'));
check('og-image reference', html.includes('og-image.jpg'));

// 7. No zombies / partial registration artifacts
check('no 1ktower zombie', !html.includes('1ktower'));

// Report
const passed = checks.filter(c=>c.pass).length;
const failed = checks.filter(c=>!c.pass);
console.log(`QA Checklist: ${passed}/${checks.length} passed`);
if (failed.length) {
  console.log('FAILED:');
  for (const f of failed) console.log('  ✗', f.name);
  process.exit(1);
} else {
  console.log('ALL CHECKS PASSED');
}
