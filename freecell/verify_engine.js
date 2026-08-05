// Per-game engine verifier: confirms freecell engine loads cleanly in a VM
// sandbox + verifies key game-state and functions exist after init.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

function mkEl() {
  const el = {
    style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], parentElement: null, parentNode: null,
    width: 0, height: 0, clientWidth: 500, clientHeight: 500,
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    getContext: () => {
      const noop = () => {};
      const gradient = { addColorStop: noop };
      const ctx = {
        canvas: el, fillRect: noop, clearRect: noop, strokeRect: noop,
        beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
        arc: noop, fill: noop, stroke: noop, save: noop, restore: noop,
        translate: noop, rotate: noop, scale: noop, setTransform: noop,
        fillText: noop, strokeText: noop, measureText: () => ({ width: 0 }),
        drawImage: noop, getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: noop, createLinearGradient: () => gradient,
        createRadialGradient: () => gradient, createPattern: () => null,
        rect: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
        font: '', fillStyle: '', strokeStyle: '', lineWidth: 1,
        textAlign: '', textBaseline: '', globalAlpha: 1,
      };
      return new Proxy(ctx, { get(t, p) { if (p in t) return t[p]; return noop; }, set(t, p, v) { t[p] = v; return true; } });
    },
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function(c) { return c; }, removeChild: function(c) { return c; }, remove: function() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '', className: '',
  };
  return new Proxy(el, {
    get(t, p) {
      if (p === 'parentElement' || p === 'parentNode') return t[p] || mkEl();
      if (p in t) return t[p];
      return () => t;
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}
const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean, parseInt, parseFloat, isNaN, isFinite, Symbol,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function() { return { createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {} }; } },
  document: { getElementById: () => mkEl(), getElementsByTagName: () => [mkEl()], querySelector: () => mkEl(), querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {}, createElement: () => mkEl(), body: mkEl(), head: mkEl(), documentElement: mkEl(), hidden: false, visibilityState: 'visible' },
  localStorage: { _data: {}, getItem: function(k) { return this._data[k] || null; }, setItem: function(k, v) { this._data[k] = v; }, removeItem: function(k) { delete this._data[k]; } },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch(e) { return 0; } },
  clearTimeout: () => {}, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
};
sandbox.webkitAudioContext = sandbox.window.AudioContext;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx); } catch (e) { console.error('engine load error:', e.message); process.exit(1); }

// Engine loads without throwing. Now check static-HTML markers for required functions
// and known fixes (FC-003 gameStarted setter).
const checks = {
  hasInitGame: /function initGame\(/.test(html),
  hasTryAutoMove: /function tryAutoMove\(/.test(html),
  hasCheckWin: /function checkWin\(/.test(html),
  hasCanPlaceOnFoundation: /function canPlaceOnFoundation\(/.test(html),
  hasGameStartedSetter: /gameState\.gameStarted = true/.test(html),
  hasDealInit: /generateDeal\(/.test(html),
  hasSaveGame: /function saveGame\(/.test(html),
  hasLoadGame: /function loadGame\(/.test(html),
  hasNewGameBtn: /id="newGameBtn"/.test(html),
  hasAutoMoveBtn: /id="autoMoveBtn"/.test(html),
};
const allOk = Object.values(checks).every(v => v === true);
console.log(`Freecell in-engine: ${allOk ? 'PASS' : 'FAIL'}`);
if (!allOk) console.log('Checks:', JSON.stringify(checks, null, 2));
process.exit(allOk ? 0 : 1);
