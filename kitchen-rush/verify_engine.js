// kitchen-rush verifier
// Cooking time-management game. Architecture: IIFE-wrapped, single canvas#gc 480x577.
// Controls: Click food items to add to plate, drag to serve.
// State: score, time, orders queue, customer satisfaction.

const fs = require('fs');

const html = fs.readFileSync('/home/junze/gamezipper.com/kitchen-rush/index.html', 'utf8');

console.log('=== kitchen-rush verifier ===');

const checks = {
  canvasExists: /<canvas[^>]*id="gc"/.test(html),
  btnStartExists: /id="btnStart"/.test(html),
  startText: />\s*Start Cooking\s*</.test(html),
  monetag: /monetag-manager\.js/.test(html),
  adDiv: /gz-ad-below-game/.test(html),
  footer: /game-footer\.js/.test(html),
  h1: /<h1[^>]*>/.test(html),
  // Engine functions (search for IIFE-scoped function names)
  hasScore: /let\s+score\s*=|var\s+score\s*=/.test(html),
  hasOrders: /orders|orderQueue|customers/i.test(html),
  hasTimer: /timeLeft|countdown|setInterval|requestAnimationFrame/.test(html),
  // Persistence
  hasLocalStorage: /localStorage/.test(html),
  // Levels
  hasLEVELS: /const LEVELS|var LEVELS/.test(html),
  // Game over
  hasGameOver: /game[\s-]?over|endGame|lose.?screen|defeat|Game Over/i.test(html),
  // Audio
  audioCtx: /AudioContext|webkitAudioContext|new Audio/.test(html),
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

// Try to extract LEVELS if inline
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

console.log('\n=== kitchen-rush PASS ===');
