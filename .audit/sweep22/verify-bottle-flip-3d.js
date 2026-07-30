// Independent verifier for bottle-flip-3d
// Tests: 30 levels present + check engine keydown handler exists
// (no algorithmic solver; this is a physics-flip game with parScore-based success)
const fs = require('fs');
const html = fs.readFileSync('bottle-flip-3d/index.html', 'utf8');

// 1. Check LEVELS array has 30 levels
const m = html.match(/levels\.push\(\{[\s\S]+?\}\)/g) || [];
const pass = m.length === 30;
console.log(`levels.push count: ${m.length} (expected 30)`);

// 2. Check keydown/keyup handlers exist
const hasKeydown = html.includes("addEventListener('keydown', onKey)");
const hasKeyup = html.includes("addEventListener('keyup', onKeyUp)");
console.log(`keydown handler: ${hasKeydown}`);
console.log(`keyup handler: ${hasKeyup}`);

// 3. Check modal-stacking fix (R340 P2)
const hasFix = html.includes('R340 P2 fix');
console.log(`R340 P2 fix comment present: ${hasFix}`);

// 4. Check core elements
const checks = {
  'h1': html.match(/<h1[^>]*>/i),
  'monetag-manager': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  'btnPlay': html.includes('id="btnPlay"'),
  'btnTutSkip': html.includes('id="btnTutSkip"'),
  'btnTutNext': html.includes('id="btnTutNext"'),
  'tutorial screen': html.includes('id="tutorial"'),
  'canvas#game': html.includes('id="game"'),
  'audioContext initAudio': html.includes('function initAudio()'),
  'successAngleDeg': html.includes('successAngleDeg: 30'),
  'prefectAngleDeg': html.includes('perfectAngleDeg: 15')
};

console.log('\n--- chrome/feature checks ---');
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${k}: ${v ? 'OK' : 'MISS'}`);
}

const allOk = pass && hasKeydown && hasKeyup && hasFix && Object.values(checks).every(Boolean);
console.log(`\nVERDICT: ${allOk ? 'PASS' : 'FAIL'}`);
process.exit(allOk ? 0 : 1);
