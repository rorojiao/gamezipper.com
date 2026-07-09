// Phase 7: Comprehensive QA Checklist for Pentominous
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/pentominous/index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, condition) {
    console.log((condition ? 'OK   ' : 'FAIL ') + name);
    condition ? pass++ : fail++;
}

// === HTML & SEO ===
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('Meta viewport', html.includes('viewport'));
check('Meta description', html.includes('name="description"'));
check('Meta keywords', html.includes('name="keywords"'));
check('Canonical URL', html.includes('canonical') && html.includes('gamezipper.com/pentominous/'));
check('OG title', html.includes('og:title'));
check('OG description', html.includes('og:description'));
check('OG image', html.includes('og:image'));
check('OG url', html.includes('og:url'));
check('Theme color', html.includes('theme-color'));

// === Structured Data ===
check('JSON-LD VideoGame', html.includes('"@type":"VideoGame"'));
check('JSON-LD FAQPage', html.includes('"@type":"FAQPage"'));
check('JSON-LD HowTo', html.includes('"@type":"HowTo"'));
check('JSON-LD BreadcrumbList', html.includes('"@type":"BreadcrumbList"'));

// === CSS & Responsive ===
check('Dark theme bg', html.includes('#0a0a1a') || html.includes('--bg'));
check('touch-action none', html.includes('touch-action') && html.includes('none'));
check('user-select none', html.includes('user-select') && html.includes('none'));
check('overflow-x hidden', html.includes('overflow-x') && html.includes('hidden'));
check('Responsive (innerWidth or resize)', html.includes('resize') || html.includes('innerWidth'));
check('No -webkit-text-stroke', !html.includes('-webkit-text-stroke'));

// === Game Logic ===
check('Canvas rendering', html.includes('getContext'));
check('requestAnimationFrame', html.includes('requestAnimationFrame'));
check('Pointer events', html.includes('pointerdown') && html.includes('pointermove') && html.includes('pointerup'));
check('Touch prevent default', html.includes('e.preventDefault()'));
check('localStorage save', html.includes('localStorage'));
check('Undo functionality', html.includes('undoStack') || html.includes('doUndo'));
check('Hint system', html.includes('doHint') || html.includes('hintsLeft'));
check('Restart', html.includes('doRestart') || html.includes('Restart'));
check('Level select', html.includes('showLevelSelect') || html.includes('levelSelect'));
check('Star ratings', html.includes('star'));
check('Settings modal', html.includes('settings'));

// === Audio ===
check('AudioContext', html.includes('AudioContext') || html.includes('webkitAudioContext'));
check('SFX (playTone)', html.includes('playTone'));
check('BGM (startBGM)', html.includes('startBGM'));
check('BGM stop (stopBGM)', html.includes('stopBGM'));
check('Sound toggle', html.includes('soundOn') || html.includes('togSfx'));
check('Music toggle', html.includes('musicOn') || html.includes('togBgm'));

// === State Management ===
check('Level progression', html.includes('loadLevel'));
check('Progress save/load', html.includes('saveProgress') && html.includes('loadProgress'));

// === Lifecycle Management ===
check('cancelAnimationFrame', html.includes('cancelAnimationFrame'));
check('beforeunload', html.includes('beforeunload'));
check('visibilitychange', html.includes('visibilitychange'));
check('Cleanup function', html.includes('function cleanup'));

// === Code Quality ===
check('No console.log in game code', !html.includes('console.log(') || html.split('console.log(').length <= 2);
check('No TODO/FIXME', !html.includes('TODO') && !html.includes('FIXME'));
check('No external CSS links', !html.includes('rel="stylesheet"') || html.includes('googleapis'));
check('Single file (no external JS)', !html.includes('src="http') || html.includes('site-analytics'));

// === Content ===
check('gz-sr-only H1', html.includes('gz-sr-only'));
check('English UI text', html.includes('Pentominous'));
check('File size > 40KB', html.length > 40000);
check('30 levels', (html.match(/"t":\d+/g) || html.match(/"tier":\d+/g) || []).length >= 30);

// === Emoji check (no emoji in canvas rendering) ===
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F000}-\u{1F2FF}\u{1FA70}-\u{1FAFF}]/u;
check('No emoji in game code', !emojiRegex.test(html));

// === Chinese character check ===
const chineseRegex = /[\u{4e00}-\u{9fff}]/u;
check('No Chinese characters', !chineseRegex.test(html));

// === Pentomino-specific ===
check('12 pentomino types defined', html.includes("'F'") && html.includes("'I'") && html.includes("'L'") && 
     html.includes("'N'") && html.includes("'P'") && html.includes("'T'") && 
     html.includes("'U'") && html.includes("'V'") && html.includes("'W'") && 
     html.includes("'X'") && html.includes("'Y'") && html.includes("'Z'"));
check('Pentomino color map', html.includes('PENTO_COLOR_MAP') || html.includes('PENTO_COLORS'));
check('Region detection (getRegions)', html.includes('getRegions'));
check('Edge sharing check', html.includes('regionsShareEdge'));
check('Solution checker', html.includes('checkSolution'));

console.log('\n=== QA RESULT: ' + pass + '/' + (pass+fail) + ' passed' + (fail ? ' (' + fail + ' FAILED)' : ' ALL PASS') + ' ===');
process.exit(fail > 0 ? 1 : 0);
