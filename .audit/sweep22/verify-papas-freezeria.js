// Independent verifier for papas-freezeria
const fs = require('fs');
const html = fs.readFileSync('papas-freezeria/index.html', 'utf8');

const checks = {
  'h1': html.match(/<h1[^>]*>/i),
  'monetag-manager': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  'canvas#canvas': html.includes('id="canvas"'),
  'start-btn': html.includes('id="start-btn"'),
  'overlay': html.includes('id="overlay"'),
  'upgrade-screen': html.includes('id="upgrade-screen"'),
  'handlePointerDown': html.includes('function handlePointerDown'),
  'serveOrder': html.includes('function serveOrder'),
  'saveGame': html.includes('function saveGame'),
  'papasFreezeria persist': html.includes("'papasFreezeria'") || html.includes("'freezeriaSave'") || html.includes('function saveGame'),
  'musicToggle': html.includes('musicToggle'),
  'sfxToggle': html.includes('sfxToggle'),
  'tutorial': html.includes("'Tap a customer"),
  'FL4VORS array': html.includes('const FLAVORS') || html.includes('var FLAVORS'),
  'STATION_NAMES': html.includes('STATION_NAMES')
};

console.log('--- chrome/feature checks ---');
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${k}: ${v ? 'OK' : 'MISS'}`);
}

const allOk = Object.values(checks).every(Boolean);
console.log(`\nVERDICT: ${allOk ? 'PASS' : 'FAIL'}`);
process.exit(allOk ? 0 : 1);
