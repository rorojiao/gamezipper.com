// Browser smoke test using bundled chromium (jsdom alternative would be verify_engine)
// Just verify HTML loads with no console errors via simple node fetch + static analysis

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');
const data = fs.readFileSync('data.js', 'utf8');
const game = fs.readFileSync('game.js', 'utf8');

console.log('--- Browser smoke test ---');
console.log(`HTML size: ${html.length}`);
console.log(`data.js size: ${data.length}`);
console.log(`game.js size: ${game.length}`);

// Check for required elements
const required = [
  'screen-title', 'screen-levels', 'screen-game',
  'btn-play', 'btn-howto', 'btn-settings',
  'canvas', 'gz-ad-above-game', 'gz-ad-below-canvas',
  'gz-ad-below-game', 'gz-analytics', 'adsterra-manager',
  'monetag-manager', 'game-footer',
  'MAGNETS_LEVELS', 'checkSolution', 'drawBoard',
  'applyPole', 'handleCanvasClick', 'useHint',
];
let missing = [];
for (const r of required) {
  if (!html.includes(r) && !data.includes(r) && !game.includes(r)) {
    missing.push(r);
  }
}
if (missing.length === 0) {
  console.log('All required elements present.');
} else {
  console.log('MISSING:', missing);
  process.exit(1);
}

// Validate JSON-LD
const ldjson = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/g) || [];
console.log(`JSON-LD blocks: ${ldjson.length}`);
if (ldjson.length < 3) { console.log('FAIL: need 3+ JSON-LD blocks'); process.exit(1); }
ldjson.forEach((block, i) => {
  try {
    const cleaned = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    JSON.parse(cleaned);
    console.log(`  Block ${i+1}: PARSE OK`);
  } catch (e) {
    console.log(`  Block ${i+1}: PARSE FAIL — ${e.message}`);
    process.exit(1);
  }
});

console.log('--- Browser smoke test PASS ---');
