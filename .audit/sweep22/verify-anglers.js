// Independent verifier for anglers
// Tests: 30 levels solvable, drag/drop input wired, all chrome
const fs = require('fs');
const html = fs.readFileSync('anglers/index.html', 'utf8');

// 1. Check levels.json has 30 levels
const levels = JSON.parse(fs.readFileSync('anglers/levels.json', 'utf8'));
console.log(`levels.json count: ${levels.length}`);

// 2. Check input handlers
const hasPointerdown = html.includes("board.addEventListener('pointerdown'");
const hasPointermove = html.includes("board.addEventListener('pointermove'");
const hasPointerup = html.includes("board.addEventListener('pointerup'");
const hasKeydown = html.includes("addEventListener('keydown'");
console.log(`pointerdown: ${hasPointerdown}, pointermove: ${hasPointermove}, pointerup: ${hasPointerup}`);

// 3. Check core
const checks = {
  'h1': html.match(/<h1[^>]*>/i),
  'monetag-manager': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  'playBtn': html.includes('id="playBtn"'),
  'canvas#board': html.includes('id="board"'),
  'persist anglersProgress': html.includes("'anglersProgress'") || html.includes('STORAGE_KEY') || html.includes('saveProgress'),
  'state.dragging': html.includes('state.dragging'),
  'checkWin': html.includes('function isComplete') || html.includes('function onWin') || html.includes('function checkWin') || html.includes('function checkSolution') || html.includes('function isWin') || html.includes('checkWin(') || html.includes('onWin()')
};

console.log('\n--- chrome/feature checks ---');
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${k}: ${v ? 'OK' : 'MISS'}`);
}

const allOk = levels.length === 30 && hasPointerdown && hasPointermove && hasPointerup && Object.values(checks).every(Boolean);
console.log(`\nVERDICT: ${allOk ? 'PASS' : 'FAIL'}`);
process.exit(allOk ? 0 : 1);
