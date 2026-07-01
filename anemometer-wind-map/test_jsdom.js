// jsdom integration test — loads index.html, verifies LEVELS loaded, UI elements present,
// and L1/L15/L30 are solvable by simulating clicks.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + ' — FAILED'); } }

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
const doc = dom.window.document;

// Check key elements
ok('title contains "Anemometer Wind Map"', doc.title.includes('Anemometer Wind Map'));
ok('meta description present', doc.querySelector('meta[name="description"]') !== null);
ok('og:image points to og-image.jpg', doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.includes('og-image.jpg'));
ok('icon link present', doc.querySelector('link[rel="icon"]') !== null);
ok('canvas element present', doc.getElementById('cv') !== null);
ok('prev/next/reset/mute buttons present',
   doc.getElementById('prevBtn') && doc.getElementById('nextBtn') && doc.getElementById('resetBtn') && doc.getElementById('muteBtn'));
ok('level label present', doc.getElementById('lvl') !== null);
ok('help text present', doc.getElementById('help') !== null);

// Extract LEVELS from the script
const scriptMatch = html.match(/const LEVELS=(\[\[[\s\S]*?\]\]);/);
ok('LEVELS array found in script', !!scriptMatch);
const LEVELS = eval(scriptMatch[1]); // eslint-disable-line no-eval
ok('LEVELS has 30 levels', LEVELS.length === 30);
ok('each level has [K, Wext, targets, solutions]', LEVELS.every(l => l.length === 4 && l[2].length === l[0] && l[3].length === l[0]));

// Simulate solving L1, L15, L30
function solveSim(lv) {
  const [K, Wext, targets, sol] = lv;
  const settings = new Array(K).fill(0);
  // simulate clicks: rotate each cell to its solution value
  for (let i = 0; i < K; i++) {
    while (settings[i] !== sol[i]) settings[i] = (settings[i] + 1) % 8;
  }
  // verify readings
  for (let i = 0; i < K; i++) {
    const prev = i > 0 ? settings[i-1] : Wext;
    if ((settings[i] + prev) % 8 !== targets[i]) return false;
  }
  return true;
}
ok('L1 solvable', solveSim(LEVELS[0]));
ok('L15 solvable', solveSim(LEVELS[14]));
ok('L30 solvable', solveSim(LEVELS[29]));
ok('all 30 solvable', LEVELS.every(solveSim));

console.log(`\njsdom: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
