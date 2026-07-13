#!/usr/bin/env node
// In-engine playtest via vm.runInContext. Loads the actual game engine
// script, injects the levels.json data, places the solution mirrors for
// every level, and asserts the engine's own isSolved() returns true.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>\s*<script src="\/adsterra/);
if (!code) { console.error('engine script not found'); process.exit(1); }
const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));

const stubEl = {
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  addEventListener: () => {}, setAttribute: () => {}, getAttribute: () => '0',
  appendChild: () => {}, removeChild: () => {}, querySelectorAll: () => [],
  querySelector: () => stubEl, querySelectorAll: () => stubEl, dataset: {}, style: {},
  textContent: '', innerHTML: '', width: 600, height: 600, getContext: () => ({
    setTransform: () => {}, fillRect: () => {}, clearRect: () => {}, save: () => {},
    restore: () => {}, beginPath: () => {}, closePath: () => {}, moveTo: () => {},
    lineTo: () => {}, arc: () => {}, fill: () => {}, stroke: () => {}, fillText: () => {},
    translate: () => {}, rotate: () => {}, setLineDash: () => {},
  }),
};
const audioStub = {
  state: 'running', currentTime: 0, destination: {},
  createOscillator: () => ({ type: '', frequency: { setValueAtTime: () => {} },
    connect: () => ({ connect: () => {} }), start: () => {}, stop: () => {} }),
  createGain: () => ({ gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
    connect: () => ({ connect: () => {} }) }),
  resume: () => {}, close: () => {},
};
const sb = {
  global, console, Date, JSON, Math, Array, Object, Number, String, Boolean, RegExp, Error, Promise, fetch,
  window: { AudioContext: function () { return audioStub; }, addEventListener: () => {}, webkitAudioContext: null },
  document: { getElementById: () => stubEl, querySelector: () => stubEl, querySelectorAll: () => [],
    addEventListener: () => {}, hidden: false, visibilityState: 'visible' },
  localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; } },
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  setTimeout: () => 0, clearTimeout: () => {},
  performance: { now: () => Date.now() }, location: { href: '' }, navigator: { userAgent: 'node' },
};
vm.createContext(sb);
vm.runInContext(code[1] + '\n;', sb);
vm.runInContext('globalThis.LEVELS_DATA = ' + JSON.stringify(levels) + ';', sb);
vm.runInContext('globalThis.loadLevel = loadLevel;', sb);
vm.runInContext('globalThis.isSolved = isSolved;', sb);
vm.runInContext('globalThis.state = state;', sb);
let pass = 0, fail = 0;
for (let i = 0; i < levels.length; i++) {
  vm.runInContext(`loadLevel(${i});`, sb);
  vm.runInContext(`var L = LEVELS_DATA[${i}]; for (var r = 0; r < L.rows; r++) for (var c = 0; c < L.cols; c++) state.placement[r][c] = (L.mirrors[r][c] === '' ? null : L.mirrors[r][c]);`, sb);
  const ok = vm.runInContext('isSolved()', sb);
  console.log(`L${i+1} (T${levels[i].tier}): ${ok ? 'PASS' : 'FAIL'}`);
  if (ok) pass++; else fail++;
  // 1 wrong placement should NOT win
  vm.runInContext(`state.placement[0][0] = state.placement[0][0] === '/' ? '\\\\' : '/';`, sb);
  const wrong = vm.runInContext('isSolved()', sb);
  if (wrong) { console.log(`  L${i+1} WRONG-PLACEMENT still won — false positive!`); fail++; }
  // restore
  vm.runInContext(`state.placement[0][0] = state.placement[0][0] === '/' ? '\\\\' : '/';`, sb);
}
console.log(`SUMMARY: ${pass}/${pass + fail} PASS`);
process.exit(fail === 0 ? 0 : 1);
