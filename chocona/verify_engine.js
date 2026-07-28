#!/usr/bin/env node
/**
 * Chocona ground-truth verifier.
 *
 * This runs the actual game script from index.html in a small DOM sandbox, then
 * feeds every stored solution through the engine's own checkWin(true) function.
 * UI side effects are disabled only after the script has loaded; validation
 * functions and level data are never reimplemented or copied here.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const gamePath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(gamePath, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const gameScript = scripts.find(script => script.includes('const LEVELS') && script.includes('function checkWin'));

if (!gameScript) {
  console.error('Cannot find the Chocona engine script containing LEVELS and checkWin.');
  process.exit(1);
}

// Do not boot the browser UI while loading the engine definitions. Fail closed
// if the exact startup call changes, so this never silently tests another code path.
const startupCall = /\ninit\(\);\s*$/;
if (!startupCall.test(gameScript)) {
  console.error('Cannot isolate the Chocona engine startup call.');
  process.exit(1);
}
const engineScript = gameScript.replace(startupCall, '\n/* verifier: startup disabled */');

function stubElement() {
  return {
    style: {},
    className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    children: [],
    textContent: '',
    innerHTML: '',
    onclick: null,
    appendChild() {},
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    animate() { return { onfinish: null }; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1, height: 1 }; },
  };
}

const canvasContext = new Proxy({}, { get: () => () => {} });
const board = stubElement();
board.width = 1;
board.height = 1;
board.getContext = () => canvasContext;

const elements = new Map([['board', board]]);
const getElement = id => {
  if (!elements.has(id)) elements.set(id, stubElement());
  return elements.get(id);
};
const noop = () => {};
const sandbox = {
  console,
  document: {
    createElement: stubElement,
    getElementById: getElement,
    addEventListener: noop,
    body: stubElement(),
  },
  window: { addEventListener: noop, removeEventListener: noop, innerWidth: 1024, innerHeight: 768 },
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  setTimeout: () => 0,
  clearTimeout: noop,
  setInterval: () => 0,
  clearInterval: noop,
  Date,
  Math,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Map,
  Set,
  RegExp,
  Error,
  parseInt,
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);

try {
  vm.runInContext(engineScript, sandbox, { filename: gamePath, timeout: 15000 });
} catch (error) {
  console.error('Engine load error:', error.message);
  process.exit(1);
}

const runner = `
  __verifyResults = [];
  renderGrid = function() {};
  onWin = function() {};
  playSFX = function() {};
  for (var __i = 0; __i < LEVELS.length; __i++) {
    var __level = LEVELS[__i];
    currentLevel = __level;
    currentLevelIdx = __i;
    isPlaying = true;
    userBlack = new Set(__level.solution.map(function(cell) { return cell[0] + ',' + cell[1]; }));
    hintCells = new Set();
    violationCells = new Set();
    satisfiedRegions = new Set();
    __verifyResults.push({
      idx: __i,
      tier: __level.tier,
      rows: __level.rows,
      cols: __level.cols,
      ok: checkWin(true)
    });
  }
`;

try {
  vm.runInContext(runner, sandbox, { filename: 'chocona-verify-runner.js', timeout: 30000 });
} catch (error) {
  console.error('Engine runner error:', error.message);
  process.exit(1);
}

const results = sandbox.__verifyResults;
if (!Array.isArray(results) || results.length !== 30) {
  console.error(`Expected 30 engine results, received ${Array.isArray(results) ? results.length : 'none'}.`);
  process.exit(1);
}

let pass = 0;
for (const result of results) {
  if (result.ok) {
    pass++;
    console.log(`L${result.idx + 1} ${result.tier} ${result.rows}x${result.cols}: PASS`);
  } else {
    console.log(`L${result.idx + 1} ${result.tier} ${result.rows}x${result.cols}: FAIL`);
  }
}

console.log(`\nIn-engine checkWin from ${path.relative(process.cwd(), gamePath) || 'index.html'}: ${pass}/${results.length} PASS, ${results.length - pass} FAIL`);
process.exit(pass === results.length ? 0 : 1);
