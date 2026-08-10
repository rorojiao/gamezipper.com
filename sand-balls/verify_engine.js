// sand-balls verifier
// Physics puzzle: dig through sand to guide colored balls into matching containers.
// Architecture: IIFE-wrapped, single canvas#gc 1280x577.
// Controls: pointerdown/move/up to dig sand. State: state='title'|'levels'|'game'|'complete'|'allclear'.

const fs = require('fs');

const html = fs.readFileSync('/home/junze/gamezipper.com/sand-balls/index.html', 'utf8');

console.log('=== sand-balls verifier ===');

const checks = {
  canvasExists: /<canvas[^>]*id="gc"/.test(html),
  // Play button is canvas-drawn (no DOM button)
  hasStateTitle: /state\s*=\s*['"]title['"]/.test(html),
  hasStateGame: /state\s*=\s*['"]game['"]/.test(html),
  hasStateComplete: /state\s*=\s*['"]complete['"]/.test(html),
  hasStateAllClear: /state\s*=\s*['"]allclear['"]|state===['"]allclear['"]/.test(html),
  // Engine functions
  hasHandleClick: /function\s+handleClick/.test(html),
  hasStartLevel: /function\s+startLevel/.test(html),
  hasDig: /function\s+dig\b/.test(html),
  hasCell: /CELL\s*=|const CELL/.test(html),
  hasBalls: /BALL_COLORS|BALL_R/.test(html),
  hasGravity: /GRAVITY\s*=/.test(html),
  // Persistence
  hasSaveKey: /SAVE_KEY\s*=\s*['"]sandballs/.test(html),
  hasLocalStorage: /localStorage/.test(html),
  // Levels
  hasLEVELS: /const LEVELS|var LEVELS|let LEVELS/.test(html),
  // Audio
  audioCtx: /AudioContext|webkitAudioContext|new Audio/.test(html),
  // Site chrome
  monetag: /monetag-manager\.js/.test(html),
  adDiv: /gz-ad-below-game/.test(html),
  footer: /game-footer\.js/.test(html),
  h1: /<h1[^>]*>/.test(html),
};
console.log('Source checks:');
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}`);
}
const failed = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k);
if (failed.length > 0) {
  console.log(`FAIL: ${failed.join(', ')}`);
  process.exit(1);
}

// Try to extract LEVELS
const m = html.match(/const LEVELS\s*=\s*\[/);
if (m) {
  let i = m.index + m[0].length;
  let depth = 1;
  let start = i;
  while (i < html.length && depth > 0) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') depth--;
    i++;
  }
  const lvlsStr = html.slice(start, i - 1);
  const vm = require('vm');
  try {
    const cleaned = lvlsStr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const LEVELS = vm.runInNewContext('([' + cleaned + '])', {});
    console.log(`  LEVELS extracted: ${LEVELS.length} levels`);
  } catch (e) {
    console.log('  LEVELS parse warning:', e.message);
  }
}

console.log('\n=== sand-balls PASS ===');
