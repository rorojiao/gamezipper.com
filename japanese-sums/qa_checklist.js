// Phase 7: QA Checklist — code-level verification of Japanese Sums game
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, condition) {
  const ok = typeof condition === 'boolean' ? condition : condition;
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (ok) pass++; else fail++;
}

// Structure
check('DOCTYPE', html.includes('<!DOCTYPE html>'));
check('html lang', html.includes('<html lang="en">'));
check('meta viewport', html.includes('viewport'));
check('meta description', html.includes('name="description"'));
check('og:title', html.includes('property="og:title"'));
check('og:description', html.includes('property="og:description"'));
check('og:image', html.includes('property="og:image"'));
check('twitter:card', html.includes('twitter:card'));
check('favicon icon', html.includes('rel="icon"'));
check('apple-touch-icon', html.includes('apple-touch-icon'));

// SEO / Schema
check('VideoGame JSON-LD', html.includes('"@type": "VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type": "FAQPage"'));
check('HowTo JSON-LD', html.includes('"@type": "HowTo"'));
check('BreadcrumbList JSON-LD', html.includes('"@type": "BreadcrumbList"'));
check('gz-sr-only H1', html.includes('class="gz-sr-only"'));

// Game systems
check('Canvas element', html.includes('<canvas'));
check('getContext', html.includes("getContext('2d')") || html.includes('getContext("2d")'));
check('LEVELS data', html.includes('const LEVELS'));
check('30 levels', html.includes('"n":30') || html.includes('"n": 30'));
check('checkWin function', html.includes('function checkWin'));
check('isLineSatisfied', html.includes('function isLineSatisfied'));
check('init function', html.includes('function init'));
check('startLevel', html.includes('function startLevel'));
check('goMenu', html.includes('function goMenu'));
check('useHint', html.includes('function useHint'));
check('restartLevel', html.includes('function restartLevel'));
check('nextLevel', html.includes('function nextLevel'));
check('renderMenu', html.includes('function renderMenu'));
check('renderDigitTools', html.includes('function renderDigitTools'));
check('selectDigit', html.includes('function selectDigit'));
check('draw function', html.includes('function draw'));

// Interaction
check('click handler', html.includes("addEventListener('click'"));
check('contextmenu handler', html.includes("addEventListener('contextmenu'"));
check('touch support', html.includes('touchstart'));
check('keyboard handler', html.includes("addEventListener('keydown'"));

// Audio
check('Web Audio initAudio', html.includes('function initAudio'));
check('AudioContext', html.includes('AudioContext'));
check('startMusic', html.includes('function startMusic'));
check('stopMusic', html.includes('function stopMusic'));
check('playSfx', html.includes('function playSfx'));
check('BGM chords', html.includes('chords'));
check('SFX place', html.includes("case 'place'"));
check('SFX win', html.includes("case 'win'"));
check('SFX hint', html.includes("case 'hint'"));
check('SFX error', html.includes("case 'error'"));

// Progress & Settings
check('localStorage progress', html.includes('js-progress'));
check('localStorage settings', html.includes('js-settings'));
check('saveProgress', html.includes('function saveProgress'));
check('loadProgress', html.includes('function loadProgress'));
check('settings music', html.includes("settings.music"));
check('settings sfx', html.includes("settings.sfx"));
check('settings autocheck', html.includes("settings.autocheck"));
check('toggleSettings', html.includes('function toggleSettings'));
check('toggleSetting', html.includes('function toggleSetting'));

// Visual
check('confetti', html.includes('spawnConfetti'));
check('toast', html.includes('showToast'));
check('win overlay', html.includes('win-overlay'));
check('star ratings', html.includes('stars'));
check('hint counter', html.includes('hintsLeft'));
check('error counter', html.includes('errorCount'));

// Footer
check('game-footer', html.includes('game-footer'));
check('GameZipper link', html.includes('href="/">'));

console.log(`\n${pass}/${pass + fail} checks passed (${fail} failed)`);
process.exit(fail === 0 ? 0 : 1);
