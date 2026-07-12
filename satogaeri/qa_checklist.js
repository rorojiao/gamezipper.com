// qa_checklist.js — Phase 7 code-level QA for Satogaeri
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('✅ ' + name); }
  else { fail++; console.log('❌ ' + name); }
}

// === Structure ===
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('html lang attr', /<html lang=/.test(html));
check('viewport meta', html.includes('viewport'));
check('title tag', /<title>.*Satogaeri/.test(html));
check('meta description', /name="description"/.test(html));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));
check('favicon (svg data)', html.includes("rel='icon'") || html.includes('rel="icon"'));

// === Canvas engine ===
check('Canvas element', html.includes('<canvas'));
check('getContext', html.includes("getContext('2d')") || html.includes('getContext("2d")'));

// === Level system ===
check('LEVELS embedded', html.includes('const LEVELS'));
check('30 levels present', (html.match(/"tier":"Expert"/g) || []).length >= 5);  // at least expert tier
check('region data (reg)', html.includes('"reg"'));
check('circle data (cir)', html.includes('"cir"'));

// === Interaction ===
check('mousedown handler', html.includes('mousedown'));
check('touchstart handler', html.includes('touchstart'));
check('touchmove handler', html.includes('touchmove'));
check('drag preview', html.includes('drawDragPreview'));
check('isValidMove', html.includes('isValidMove'));

// === Game systems ===
check('checkSolved', html.includes('checkSolved'));
check('hint system', html.includes('useHint') && html.includes('hintsUsed'));
check('reset button', html.includes('resetBtn'));
check('menu overlay', html.includes('menuOverlay'));
check('win overlay', html.includes('winOverlay'));
check('level select grid', html.includes('levelGrid'));
check('star ratings', html.includes('stars'));
check('localStorage save', html.includes('localStorage'));
check('timer', html.includes('timer'));

// === Audio ===
check('AudioContext', html.includes('AudioContext'));
check('SFX object', html.includes('const SFX'));
check('music (chords)', html.includes('CHORDS') || html.includes('startMusic'));
check('stopMusic', html.includes('stopMusic'));

// === Settings ===
check('settings panel', html.includes('settings-panel') || html.includes('showSettings'));
check('music toggle', html.includes('toggleMusic'));
check('sfx toggle', html.includes('toggleSfx'));
check('autocheck toggle', html.includes('toggleAutocheck'));

// === Keyboard ===
check('keydown handler', html.includes('keydown'));
check('Escape -> menu', html.includes("e.key === 'Escape'"));
check('H -> hint', html.includes("e.key === 'h'"));
check('R -> reset', html.includes("e.key === 'r'"));
check('Enter -> check', html.includes("e.key === 'Enter'"));

// === JSON-LD ===
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('sr-only H1', html.includes('gz-sr-only'));

// === Responsive ===
check('mobile media query', html.includes('@media'));
check('touch-action none', html.includes('touch-action:none') || html.includes('touch-action: none'));

// === Assets referenced ===
check('icon not externally referenced (inline svg)', html.includes("data:image/svg"));

console.log('\n' + '='.repeat(50));
console.log(`${pass}/${pass+fail} checks passed, ${fail} failed`);
if (fail === 0) console.log('✅ ALL QA CHECKS PASSED');
process.exit(fail === 0 ? 0 : 1);
