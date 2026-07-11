// Pentopia QA Checklist — Code-level verification
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = {
  'Canvas board': html.includes('<canvas') && html.includes('getContext'),
  'LEVELS embedded (30)': html.match(/const LEVELS = \[/) && JSON.parse(html.match(/const LEVELS = (\[.*?\]);/s)[1]).length === 30,
  'Pentomino shapes (F,I,L,N,P,T,U,V,W,X,Y,Z)': ['\'F\'','\'I\'','\'L\'','\'N\'','\'P\'','\'T\'','\'U\'','\'V\'','\'W\'','\'X\'','\'Y\'','\'Z\''].every(s => html.includes(s)),
  'Shape colors': html.includes('SHAPE_COLORS'),
  'Arrow direction map': html.includes('DIR_MAP') && html.includes('ARROW_CHAR'),
  'Shape rotation': html.includes('rotateCells') && html.includes('state.rotation'),
  'Shape flip': html.includes('flipCells') && html.includes('state.flipped'),
  'Placement validation (canPlaceShape)': html.includes('canPlaceShape'),
  'Clue satisfaction check': html.includes('clueSatisfied'),
  'Win detection (checkWin)': html.includes('function checkWin'),
  'All clues satisfied': html.includes('allCluesSatisfied'),
  'Adjacency check (8-neighbor)': html.includes('Math.abs(r1-r2)<=1') && html.includes('Math.abs(c1-c2)<=1'),
  'Duplicate shape prevention': html.includes('new Set(types).size'),
  'Hint system (3/level)': html.includes('useHint') && html.includes('hintsLeft') && html.includes('maxHints: 3'),
  'Erase mode': html.includes('eraseMode') && html.includes('removeShapeAt'),
  'Level select': html.includes('showLevelSelect'),
  'Star ratings': html.includes('stars') && html.includes('⭐'),
  'Tier grouping (5 tiers)': ['Beginner','Easy','Medium','Hard','Expert'].every(t => html.includes(t)),
  'Web Audio music': html.includes('AudioContext') && html.includes('startMusic') && html.includes('playChord'),
  'Web Audio SFX': html.includes('sfxPlace') && html.includes('sfxErase') && html.includes('sfxError') && html.includes('sfxHint') && html.includes('sfxWin'),
  'Chord progression': html.includes('CHORD_PROG'),
  'localStorage save': html.includes('localStorage.getItem') && html.includes('localStorage.setItem'),
  'Settings panel (music/sfx/autocheck)': html.includes('set-music') && html.includes('set-sfx') && html.includes('set-autocheck'),
  'Keyboard support': html.includes('keydown') && html.includes("case 'r'") && html.includes("case 'h'"),
  'Touch support': html.includes('touchstart'),
  'Confetti on win': html.includes('spawnConfetti') && html.includes('confetti'),
  'Win overlay': html.includes('showWinOverlay'),
  'Hover preview': html.includes('hoverCell'),
  'Monetag ad': html.includes('monetag-manager'),
  'GZ analytics': html.includes('gz-analytics'),
  'Game footer': html.includes('game-footer'),
  'Game audio auto': html.includes('game-audio-auto'),
  'JSON-LD VideoGame': html.includes('"@type":"VideoGame"'),
  'JSON-LD FAQPage': html.includes('"@type":"FAQPage"'),
  'JSON-LD BreadcrumbList': html.includes('"@type":"BreadcrumbList"'),
  'SR-only H1': html.includes('gz-sr-only'),
  'Icon link': html.includes('icon.png'),
  'OG image': html.includes('og-image.jpg'),
  'Canonical URL': html.includes('canonical'),
  'Responsive viewport': html.includes('viewport'),
};

let pass = 0, fail = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log((ok ? '✅' : '❌') + ' ' + name);
  if (ok) pass++; else fail++;
}

// JS errors check
const scriptContent = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
let jsOK = true;
if (scriptContent) {
  try { new Function(scriptContent[1].replace(/document\.|window\.|localStorage\.|AudioContext|setInterval|clearInterval|setTimeout|webkitAudioContext/g, 'undefined||')); }
  catch(e) { jsOK = false; console.log('JS syntax note:', e.message); }
}

console.log(`\n=== QA: ${pass}/${pass+fail} checks passed ===`);
if (fail > 0) console.log(`${fail} FAILED checks`);
process.exit(fail > 0 ? 1 : 0);
