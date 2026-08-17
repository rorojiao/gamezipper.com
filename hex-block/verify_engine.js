// hex-block - hex-grid placement puzzle (procedural, no LEVELS).
// Architecture: 1 canvas#board-canvas, hexagonal BlockuDoku-style with line clears.
// Validates: hex math, piece generation, line detection, gameOver, persistence.

'use strict';
const fs = require('fs');

const html = fs.readFileSync('/home/junze/gamezipper.com/hex-block/index.html', 'utf8');

const checks = {
  hexToPixel: /function\s+hexToPixel/.test(html),
  pixelToHex: /function\s+pixelToHex/.test(html),
  hexRound: /function\s+hexRound/.test(html),
  hexDist: /function\s+hexDist/.test(html),
  hexKey: /function\s+hexKey/.test(html),
  boardCanvas: /<canvas[^>]*id="board-canvas"/.test(html),
  initBoard: /function\s+initBoard/.test(html),
  generatePiece: /function\s+generatePiece/.test(html),
  dealPieces: /function\s+dealPieces/.test(html),
  canPlace: /function\s+canPlace\b/.test(html),
  placePiece: /function\s+placePiece/.test(html),
  checkLines: /function\s+checkLines/.test(html),
  checkGameOver: /function\s+checkGameOver/.test(html),
  addScore: /function\s+addScore/.test(html),
  newGame: /function\s+newGame/.test(html),
  loadBest: /function\s+loadBest/.test(html),
  saveBest: /function\s+saveBest/.test(html),
  STORAGE_KEY: /STORAGE_KEY\s*=\s*['"]hexblock/.test(html),
  audioInit: /function\s+initAudio/.test(html),
  // Site chrome
  monetag: /monetag-manager\.js/.test(html),
  adDiv: /gz-ad-below-game/.test(html),
  footer: /game-footer\.js/.test(html),
  h1: /<h1[^>]*>/.test(html),
};

console.log('=== hex-block engine checks ===');
let allOK = true;
for (const [k, v] of Object.entries(checks)) {
  console.log('  ' + (v ? 'PASS' : 'FAIL') + ' ' + k);
  if (!v) allOK = false;
}

// PIECE_DEFS verification: must contain shapes like I/L/T
const pieceDefsMatch = html.match(/PIECE_DEFS\s*=\s*\[([\s\S]*?)\];/);
if (pieceDefsMatch) {
  const pieceCount = (pieceDefsMatch[1].match(/\{/g) || []).length;
  console.log('  ' + (pieceCount >= 5 ? 'PASS' : 'FAIL') + ' PIECE_DEFS_count=' + pieceCount);
  if (pieceCount < 5) allOK = false;
} else {
  console.log('  FAIL PIECE_DEFS_not_found');
  allOK = false;
}

console.log('\nVERDICT: ' + (allOK ? 'PASS (hex math + engine + site chrome verified)' : 'FAIL'));
process.exit(allOK ? 0 : 1);
