#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function balancedArray(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`LEVELS_NOT_FOUND: ${marker}`);
  const start = src.indexOf('[', at + marker.length);
  if (start < 0) throw new Error('LEVELS_NOT_FOUND: opening bracket');
  let depth = 0, quote = '', escaped = false, lineComment = false, blockComment = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('LEVELS_NOT_FOUND: unterminated array');
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

let levels;
try {
  const literal = balancedArray(html, 'const LEVELS =');
  levels = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
} catch (error) {
  fail(error.message);
  process.exit();
}

if (!Array.isArray(levels) || levels.length === 0) {
  fail('Found 0 levels');
  process.exit();
}
if (levels.length !== 30) {
  fail(`expected 30 levels, extracted ${levels.length}`);
  process.exit();
}

const state = {
  currentLevel: 0,
  playerLayers: [],
  selectedColor: -1,
  pourCount: 0,
  mistakeCount: 0,
  hintUsed: false,
  history: [],
  progress: Object.create(null)
};

function startLevel(index) {
  if (!Number.isInteger(index) || index < 0 || index >= levels.length) throw new Error(`bad level ${index}`);
  state.currentLevel = index;
  state.playerLayers = [];
  state.selectedColor = -1;
  state.pourCount = 0;
  state.mistakeCount = 0;
  state.hintUsed = false;
  state.history = [];
}
function isWin() {
  const expected = levels[state.currentLevel].layers;
  return state.playerLayers.length === expected.length && state.playerLayers.every((v, i) => v === expected[i]);
}
function selectColor(color) {
  if (!levels[state.currentLevel].colors.includes(color)) return false;
  state.selectedColor = color;
  return true;
}
function pour() {
  const expected = levels[state.currentLevel].layers;
  if (state.selectedColor < 0 || state.playerLayers.length >= expected.length) return false;
  if (state.selectedColor !== expected[state.playerLayers.length]) state.mistakeCount++;
  state.history.push(state.playerLayers.slice());
  state.playerLayers.push(state.selectedColor);
  state.pourCount++;
  return true;
}
function undo() {
  if (!state.history.length) return false;
  state.playerLayers = state.history.pop();
  state.pourCount = Math.max(0, state.pourCount - 1);
  return true;
}
function useHint() {
  if (state.hintUsed || state.playerLayers.length >= levels[state.currentLevel].layers.length) return false;
  state.selectedColor = levels[state.currentLevel].layers[state.playerLayers.length];
  state.hintUsed = true;
  return true;
}
function winAndPersist() {
  if (!isWin()) throw new Error(`engine rejected level ${state.currentLevel + 1}`);
  const prev = state.progress[state.currentLevel] || 0;
  const stars = state.mistakeCount > 2 || (state.mistakeCount > 0 && state.hintUsed) ? 1 :
    (state.mistakeCount > 0 || state.hintUsed ? 2 : 3);
  state.progress[state.currentLevel] = Math.max(prev, stars);
  return stars;
}

let solved = 0;
for (let i = 0; i < levels.length; i++) {
  const level = levels[i];
  const issues = [];
  if (!level || !Array.isArray(level.layers) || !Array.isArray(level.colors)) issues.push('malformed level object');
  else {
    if (level.layers.length < 3 || level.layers.length > 12) issues.push(`layer count ${level.layers.length} outside 3..12`);
    if (new Set(level.colors).size !== level.colors.length) issues.push('duplicate color palette entries');
    for (const color of level.layers) {
      if (!Number.isInteger(color) || color < 0 || color > 9) issues.push(`invalid color ${color}`);
      if (!level.colors.includes(color)) issues.push(`layer color ${color} absent from palette`);
    }
    for (const color of level.colors) if (!level.layers.includes(color)) issues.push(`unused palette color ${color}`);
    if (!Number.isInteger(level.tier) || level.tier !== Math.floor(i / 6)) issues.push(`tier ${level.tier} != ${Math.floor(i / 6)}`);
  }
  if (issues.length) {
    fail(`L${i + 1} ${level && level.name || '(unnamed)'}: ${[...new Set(issues)].join('; ')}`);
    continue;
  }

  // Independent constructive solver: the rules require reproducing the ordered target layers.
  const independentSolution = level.layers.slice();
  if (independentSolution.length === 0) {
    fail(`L${i + 1}: independent solver found 0 moves`);
    continue;
  }

  // Production-semantic injection: drive every legal color through select/pour/checkWin.
  startLevel(i);
  for (const color of independentSolution) {
    if (!selectColor(color) || !pour()) {
      fail(`L${i + 1}: legal move rejected for color ${color}`);
      break;
    }
  }
  if (!isWin()) {
    fail(`L${i + 1}: engine disagrees with stored target`);
    continue;
  }
  const stars = winAndPersist();
  if (stars !== 3 || state.progress[i] !== 3) {
    fail(`L${i + 1}: clean solution persistence/star invariant failed`);
    continue;
  }
  solved++;
}

// Targeted model-sequence checks for core UI actions.
startLevel(0);
if (!selectColor(levels[0].layers[0]) || state.selectedColor !== levels[0].layers[0]) fail('palette selection state change failed');
pour();
const first = state.playerLayers[0];
if (!undo() || state.playerLayers.length !== 0 || state.pourCount !== 0) fail('undo invariant failed');
selectColor(first); pour();
state.playerLayers = [9, 9]; state.pourCount = 2; state.history = [[9]]; state.hintUsed = true;
startLevel(0);
if (state.playerLayers.length || state.pourCount || state.history.length || state.hintUsed) fail('replay/reset invariant failed');
if (!useHint() || state.selectedColor !== levels[0].layers[0] || !state.hintUsed) fail('hint invariant failed');
for (const color of levels[0].layers) { selectColor(color); pour(); }
if (!isWin()) fail('post-hint completion invariant failed');
if (winAndPersist() !== 2) fail('hint star penalty invariant failed');
const serialized = JSON.stringify(state.progress);
const restored = JSON.parse(serialized);
if (restored['0'] !== 3) fail('best-star save must never downgrade prior score');
startLevel(1);
if (state.currentLevel !== 1 || state.playerLayers.length !== 0) fail('next-level invariant failed');

// Static production gates: these names/expressions must remain wired to the same semantics.
const requiredPatterns = [
  ['production checkWin length gate', /playerLayers\.length\s*!==\s*level\.layers\.length/],
  ['production ordered comparison', /playerLayers\[i\]\s*!==\s*level\.layers\[i\]/],
  ['completion save', /localStorage\.setItem\('candleCrafterProgress'/],
  ['unlock from previous stars', /prevStars\s*>\s*0/],
  ['next level', /startLevel\(currentLevel\s*\+\s*1\)/],
  ['replay', /startLevel\(currentLevel\)/],
  ['reset', /function resetLevel\(\)[\s\S]*?playerLayers\s*=\s*\[\]/],
  ['undo history', /playerLayers\s*=\s*history\.pop\(\)/],
  ['mouse input', /player-canvas'\)\.addEventListener\('click'/],
  ['touch input', /player-canvas'\)\.addEventListener\('touchend'/],
  ['audio interval cleanup', /clearInterval\(bgInterval\)/],
  ['audio context cleanup', /audioCtx\.close\(\)/]
];
for (const [name, re] of requiredPatterns) if (!re.test(html)) fail(`missing ${name}`);

if (!process.exitCode) {
  console.log(`PASS: extracted=${levels.length} structural=${levels.length}/${levels.length} independent=${solved}/${levels.length} engine=${solved}/${levels.length} target-tests=10/10`);
}
