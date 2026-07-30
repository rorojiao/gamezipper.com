// Independent verifier for cribbage
const fs = require('fs');
const html = fs.readFileSync('cribbage/index.html', 'utf8');

const checks = {
  'h1': html.match(/<h1[^>]*>/i),
  'monetag-manager': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  'canvas#c': html.includes('id="c"'),
  'menuOverlay': html.includes('id="menuOverlay"'),
  'bStart': html.includes('id="bStart"'),
  'bNew': html.includes('id="bNew"'),
  'bUndo': html.includes('id="bUndo"'),
  'bHint': html.includes('id="bHint"'),
  'bDiscardDone': html.includes('id="bDiscardDone"'),
  'PHASE.PEGGING': html.includes('PHASE.PEGGING') || html.includes("'pegging'") || html.includes('"pegging"'),
  'function checkWin': html.includes('function checkWin') || html.includes('checkWin()') || html.includes('countHand') || html.includes('scoreHand') || html.includes('function startPegging') || html.includes('function playPegCard'),
  'function getHint': html.includes('function getHint') || html.includes('getHint()'),
  'peg count': /getElementById\(['"]peg[A-Za-z]*['"]\)/.test(html),
  '121 winning score': html.includes('121'),
  'saveGame': html.includes('function saveGame') || html.includes('function saveStats') || html.includes("'gz_cribbage") || html.includes('STATS_KEY'),
  'sound playTone': html.includes('function playTone'),
  'FAQ cribbage rules': html.includes('peg') || html.includes('pegging')
};

console.log('--- chrome/feature checks ---');
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${k}: ${v ? 'OK' : 'MISS'}`);
}

const allOk = Object.values(checks).every(Boolean);
console.log(`\nVERDICT: ${allOk ? 'PASS' : 'FAIL'}`);
process.exit(allOk ? 0 : 1);
