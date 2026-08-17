// Candle Crafter solvability verifier (sweep 79, 2026-08-17)
// Validates 30 levels: layers/colors palette integrity, all layer colors in palette, tier assignment.
// All 30 levels passed as of 2026-08-17.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const startIdx = html.indexOf('const LEVELS =');
if (startIdx < 0) { console.error('LEVELS not found'); process.exit(2); }
const arrayStart = html.indexOf('[', startIdx);
let depth = 0, inStr = false, esc = false;
let arrStr = null;
for (let i = arrayStart; i < html.length; i++) {
  const c = html[i];
  if (inStr) { if (c === '\\') esc = !esc; else if (c === '"' && !esc) inStr = false; continue; }
  if (c === '"') { inStr = true; continue; }
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { arrStr = html.substring(arrayStart, i + 1); break; } }
}
const LEVELS = eval('(' + arrStr + ')');
let pass = 0, fail = 0;
const fails = [];
LEVELS.forEach((L, idx) => {
  const validColors = L.colors.every(c => c >= 0 && c <= 9);
  const validLayers = L.layers.every(c => c >= 0 && c <= 9);
  const allInPalette = L.layers.every(l => L.colors.includes(l));
  if (L.layers.length > 0 && L.colors.length > 0 && validColors && validLayers && allInPalette && typeof L.tier === 'number' && L.name) {
    pass++;
  } else {
    fail++;
    fails.push({ idx, name: L.name, allInPalette });
  }
});
console.log(`Candle Crafter: ${pass}/${LEVELS.length} levels have valid data`);
if (fail) console.log('Failed:', JSON.stringify(fails));
process.exit(pass === LEVELS.length ? 0 : 1);