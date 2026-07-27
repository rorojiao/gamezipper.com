#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

function functionSource(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) fail(`Missing ${name}.`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let index = brace; index < html.length; index++) {
    if (html[index] === '{') depth++;
    if (html[index] === '}' && --depth === 0) return html.slice(start, index + 1);
  }
  fail(`Could not parse ${name}.`);
}

const rules = ['checkWin', 'checkDraw', 'minimax', 'getBestMove', 'getRandomMove'].map(functionSource).join('\n');
const context = vm.createContext({ Math, GRID_SIZE: 3, CELL_EMPTY: '', CELL_X: 'X', CELL_O: 'O' });
vm.runInContext(rules, context);

const board = (rows) => rows.map((row) => row.slice());
if (!context.checkWin(board([['X','X','X'],['','',''],['','','']]), 'X')) fail('Row win is not detected.');
if (!context.checkWin(board([['O','',''],['O','',''],['O','','']]), 'O')) fail('Column win is not detected.');
if (!context.checkWin(board([['X','',''],['','X',''],['','','X']]), 'X')) fail('Diagonal win is not detected.');
if (context.checkWin(board([['X','O',''],['','',''],['','','']]), 'X')) fail('Partial row is incorrectly a win.');
if (!context.checkDraw(board([['X','O','X'],['X','O','O'],['O','X','X']]))) fail('Draw is not detected.');

let position = board([['O','O',''],['X','X',''],['','','']]);
if (JSON.stringify(context.getBestMove(position, 'O')) !== JSON.stringify([0, 2])) fail('Hard AI misses an immediate win.');
position = board([['X','X',''],['O','',''],['','','O']]);
const before = JSON.stringify(position);
if (JSON.stringify(context.getBestMove(position, 'O')) !== JSON.stringify([0, 2])) fail('Hard AI fails to block an immediate loss.');
if (JSON.stringify(position) !== before) fail('Hard AI mutates the supplied board.');

const ai = functionSource('makeAIMove');
const restart = functionSource('startNewGame');
const toggle = functionSource('toggleSound');
const unload = functionSource('handleBeforeUnload');
for (const [name, source, token] of [
  ['AI callback guard', ai, 'gameState.currentPlayer !== CELL_O'],
  ['restart timer cleanup', restart, 'clearTimeout(aiMoveTimer)'],
  ['sound persistence', toggle, 'gameState.soundEnabled = soundEnabled'],
  ['unload animation cleanup', unload, 'cancelAnimationFrame(animationId)']
]) {
  if (!source.includes(token)) fail(`Missing ${name}.`);
}
for (const token of ["ttt_save_v1", 'version: 1', "newGameBtn.addEventListener('click'", 'gz-ad-below-game']) {
  if (!html.includes(token)) fail(`Missing production path: ${token}`);
}
if (html.includes('aggregateRating')) fail('Structured data contains an aggregate rating.');

console.log('Tic-Tac-Toe: rules, hard-AI invariants, restart race guard, persistence, and cleanup verified.');
