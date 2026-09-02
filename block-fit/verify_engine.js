/**
 * Block Fit (Tetromino Tiling) - In-engine verifier.
 *
 * Loads each level, attempts to solve via backtracking inside the browser engine
 * context, asserts exactly 1 solution.
 *
 * Usage: node verify_engine.js
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'block-fit';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts[0];

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '',
    children: [], left: 0, top: 0, width: 400, height: 400, clientWidth: 400, clientHeight: 400,
    disabled: false, hidden: false, parentElement: null, parentNode: null, _l: null,
    getContext: () => ({
      fillRect: () => {}, clearRect: () => {}, fillText: () => {}, beginPath: () => {}, moveTo: () => {},
      lineTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, closePath: () => {},
      save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {}, scale: () => {},
      measureText: () => ({width: 0}), drawImage: () => {}, setLineDash: () => {},
      getImageData: () => ({data: [0,0,0,0]}), putImageData: () => {}, createImageData: () => ({data: [0,0,0,0]}),
      createLinearGradient: () => ({addColorStop: () => {}}),
      bezierCurveTo: () => {}, quadraticCurveTo: () => {},
      ellipse: () => {}, rect: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => mkEl(),
    querySelectorAll: () => [],
    appendChild: (c) => { el.children.push(c); c.parentElement = el; return c; },
    removeChild: (c) => { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); },
    setAttribute: () => {}, removeAttribute: () => {}, getAttribute: () => null,
    getBoundingClientRect: () => ({left: 0, top: 0, right: 400, bottom: 400, width: 400, height: 400, x: 0, y: 0}),
    contains: () => false, click: () => {}, focus: () => {}, blur: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cloneNode: () => mkEl(),
  };
  Object.assign(el, extra || {});
  return el;
}

const ctx = {
  console,
  Math, Date, JSON, Array, Object, String, Number, Boolean, Map, Set, Symbol, Promise, Error,
  setTimeout, clearTimeout, setInterval, clearInterval,
  document: {
    getElementById: (id) => mkEl({id}),
    querySelector: (sel) => mkEl(),
    querySelectorAll: (sel) => [],
    addEventListener: () => {},
    body: mkEl(),
    documentElement: mkEl(),
    visibilityState: 'visible',
    hidden: false,
    title: '',
  },
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    AudioContext: function () { return { createOscillator: () => ({connect:()=>{},start:()=>{},stop:()=>{},frequency:{value:0,setValueAtTime:()=>{}},type:''}), createGain: () => ({connect:()=>{},gain:{value:0,setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}},}), destination: {}, currentTime: 0, resume:()=>{}, close:()=>{} }; },
    webkitAudioContext: function () { return this.AudioContext(); },
    innerWidth: 1024, innerHeight: 768,
    devicePixelRatio: 1,
  },
  navigator: { userAgent: 'node', platform: 'node' },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; },
  },
  location: { href: 'file://', pathname: '/', search: '', hash: '', protocol: 'file:' },
  history: { pushState: () => {}, replaceState: () => {} },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  performance: { now: () => Date.now() },
  Image: function () { return { onload: null, src: '', width: 0, height: 0 }; },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
  Blob: function () { return {}; },
  FileReader: function () { return { readAsDataURL: () => {}, result: '' }; },
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
};

vm.createContext(ctx);

try {
  vm.runInContext(code, ctx);
} catch (e) {
  console.error('Script eval failed:', e.message);
  process.exit(1);
}

// Load levels
const levelsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = levelsData.levels;

console.log(`Verifying ${levels.length} levels in-engine...\n`);

let passed = 0;
for (let i = 0; i < levels.length; i++) {
  const level = levels[i];
  const outline = level.outline.map(c => [c[0], c[1]]);

  // Solve
  const solCount = ctx.countBlockFitSolutions(outline, level.pieces);

  if (solCount === 1) {
    console.log(`  [PASS] level ${i+1} (${level.tier}, pieces=${level.pieces.join(',')})`);
    passed++;
  } else {
    console.log(`  [FAIL] level ${i+1} (${level.tier}, pieces=${level.pieces.join(',')}): solutions=${solCount}`);
  }
}

console.log(`\n${passed}/${levels.length} levels passed`);
process.exit(passed === levels.length ? 0 : 1);
