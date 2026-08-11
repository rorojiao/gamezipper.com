// nyt-tiles per-game verifier — sweep 57 (2026-08-11)
//
// Procedural board generator: generateBoard(size, themeKey, seed) returns {tiles[], size, theme, ...}.
// Tests 32 sample boards: 6 themes × 4/5/6 sizes + 14 daily/practice seeds.
// Each board: tile count = size*size, all 4 layers alive per tile, no isolated tiles.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFnBody(html, signature) {
  const idx = html.indexOf(signature);
  if (idx < 0) return null;
  const openBrace = html.indexOf('{', idx + signature.length);
  if (openBrace < 0) return null;
  let depth = 1;
  let i = openBrace + 1;
  while (i < html.length && depth > 0) {
    const c = html[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    i++;
  }
  return html.substring(openBrace + 1, i - 1);
}

const mGen = extractFnBody(html, 'function generateBoard(size,themeKey,seed)');
const mPRNG = extractFnBody(html, 'function seededRandom(seed)');
const mThemes = html.match(/var THEMES=\{([\s\S]*?)\n\};/);
if (!mGen || !mPRNG || !mThemes) { console.error('FAIL: missing extract'); process.exit(2); }

let generateBoard;
try {
  const THEMES = (new Function('return {' + mThemes[1] + '}'))();
  const wrapper = `
    var THEMES = ${JSON.stringify(THEMES)};
    function seededRandom(seed) { ${mPRNG} }
    function generateBoard(size, themeKey, seed) { ${mGen} }
    return { gen: function(size, theme, seed) { return generateBoard(size, theme, seed); } };
  `;
  generateBoard = (new Function(wrapper))().gen;
} catch(e) { console.error('FAIL: eval error:', e.message); process.exit(2); }

const sizes = [
  {size:4, theme:'animals'}, {size:4, theme:'nature'}, {size:4, theme:'food'},
  {size:4, theme:'sports'}, {size:4, theme:'travel'}, {size:4, theme:'music'},
  {size:5, theme:'animals'}, {size:5, theme:'nature'}, {size:5, theme:'food'},
  {size:5, theme:'sports'}, {size:5, theme:'travel'}, {size:5, theme:'music'},
  {size:6, theme:'animals'}, {size:6, theme:'nature'}, {size:6, theme:'food'},
  {size:6, theme:'sports'}, {size:6, theme:'travel'}, {size:6, theme:'music'},
  {size:4, theme:'animals', seed:'daily-1'}, {size:5, theme:'nature', seed:'daily-2'},
  {size:6, theme:'food', seed:'daily-3'}, {size:4, theme:'sports', seed:'daily-4'},
  {size:5, theme:'travel', seed:'daily-5'}, {size:6, theme:'music', seed:'daily-6'},
  {size:4, theme:'nature', seed:'practice-1'}, {size:5, theme:'animals', seed:'practice-2'},
  {size:6, theme:'sports', seed:'practice-3'}, {size:4, theme:'food', seed:'practice-4'},
  {size:5, theme:'music', seed:'practice-5'}, {size:6, theme:'travel', seed:'practice-6'},
  {size:4, theme:'music', seed:'test-1'}, {size:5, theme:'sports', seed:'test-2'},
];

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < sizes.length; i++) {
  const {size, theme, seed='seed-'+i} = sizes[i];
  try {
    const board = generateBoard(size, theme, seed);
    if (!board || !board.tiles || board.tiles.length !== size*size) {
      fail++; fails.push({i, issue: 'wrong tile count', actual: board?.tiles?.length}); continue;
    }
    let allFull = true;
    for (const t of board.tiles) {
      if (!t.alive[0] || !t.alive[1] || !t.alive[2] || !t.alive[3]) { allFull = false; break; }
    }
    if (!allFull) { fail++; fails.push({i, issue: 'tile missing layer'}); continue; }
    let isolated = 0;
    for (let a = 0; a < board.tiles.length; a++) {
      const ta = board.tiles[a];
      let hasMatch = false;
      for (let b = 0; b < board.tiles.length; b++) {
        if (a === b) continue;
        const tb = board.tiles[b];
        if (ta.l1 === tb.l1 || ta.l2 === tb.l2 || ta.l3 === tb.l3 || ta.l4 === tb.l4) {
          hasMatch = true; break;
        }
      }
      if (!hasMatch) isolated++;
    }
    if (isolated > 0) { fail++; fails.push({i, size, theme, isolated}); continue; }
    pass++;
  } catch(e) { fail++; fails.push({i, issue: 'exception: '+e.message}); }
}
console.log(`Total: ${sizes.length}, PASS: ${pass}, FAIL: ${fail}`);
if (fails.length) console.log('Fails:', JSON.stringify(fails.slice(0, 3)));
process.exit(fail === 0 ? 0 : 1);
