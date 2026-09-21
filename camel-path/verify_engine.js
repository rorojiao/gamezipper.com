#!/usr/bin/env node
// In-engine verifier for Camel Path.
// Loads game.js into a JSDOM context, simulates calls to camelpath.solveWithPath
// for each level, and verifies that the in-engine game logic accepts the stored
// solution path as a winning solution.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIRS = [[1,3],[3,1],[1,-3],[3,-1],[-1,3],[-3,1],[-1,-3],[-3,-1]];

// Minimal DOM mock (similar to bishop-path but slimmer)
function mkEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        } else if (force) this._classes.add(c);
        else this._classes.delete(c);
      },
      contains(c) { return this._classes.has(c); },
    },
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 600 }; },
    getContext() {
      return {
        clearRect() {}, fillRect() {}, strokeRect() {},
        beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, stroke() {},
        fill() {}, save() {}, restore() {},
        set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
        set lineCap(v) {}, set lineJoin(v) {},
        set font(v) {}, set textAlign(v) {}, set textBaseline(v) {},
      };
    },
    appendChild(child) { this.children.push(child); return child; },
    set innerHTML(v) { this._innerHTML = v; },
    get innerHTML() { return this._innerHTML || ''; },
    set textContent(v) { this._textContent = v; },
    get textContent() { return this._textContent || ''; },
    set value(v) { this._value = v; },
    get value() { return this._value || ''; },
    set checked(v) { this._checked = v; },
    get checked() { return this._value; },
    dispatchEvent() {},
    focus() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    parentNode: null,
    width: 600,
    height: 600,
  };
  return el;
}

const elements = {};
function getOrMake(id) {
  if (!elements[id]) elements[id] = mkEl('div');
  return elements[id];
}

const sandbox = {
  window: {
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    AudioContext: function() {
      return {
        currentTime: 0,
        destination: {},
        createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; },
        createOscillator() { return { type: 'sine', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; },
        resume() { return Promise.resolve(); },
        close() { return Promise.resolve(); },
        state: 'running',
      };
    },
    innerWidth: 1024,
    innerHeight: 768,
  },
  document: {
    getElementById(id) { return getOrMake(id); },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    readyState: 'complete',
    hidden: false,
    createElement(tag) { return mkEl(tag); },
    querySelectorAll() { return []; },
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
  },
  performance: { now: () => Date.now() },
  setTimeout, clearTimeout, setInterval, clearInterval,
  Math, Date, JSON, Array, Object, Number, String, Boolean, Error, Promise,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;

vm.createContext(sandbox);

// Load game source files (no eval needed since they auto-init)
const dataJs = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
vm.runInContext(dataJs, sandbox);
const gameJs = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
vm.runInContext(gameJs, sandbox);

const DATA = sandbox.window.CAMEL_PATH_DATA;
const cp = sandbox.window.camelpath;

if (!cp) {
  console.error('ERROR: window.camelpath not exposed');
  process.exit(2);
}

let passed = 0, failed = 0;
for (const lv of DATA.levels) {
  // solveWithPath returns true if the engine's validator + win check both pass
  const ok = cp.solveWithPath(lv, lv.solution_path);
  if (!ok) {
    console.log(`  FAIL L${lv.id}: solveWithPath returned false`);
    failed++;
    continue;
  }
  // Also verify validator + win check individually
  if (!cp.validateSolutionPath(lv)) {
    console.log(`  FAIL L${lv.id}: validateSolutionPath returned false`);
    failed++;
    continue;
  }
  if (!cp.checkSolution()) {
    console.log(`  FAIL L${lv.id}: checkSolution returned false`);
    failed++;
    continue;
  }
  passed++;
}

console.log(`\n=== IN-ENGINE VERIFY: ${passed}/${DATA.levels.length} PASS, ${failed} FAIL ===`);
process.exit(failed === 0 ? 0 : 1);