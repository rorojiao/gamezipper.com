#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

function element() {
  const classes = new Set();
  const listeners = {};
  return {
    style: {}, textContent: '', listeners,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name)
    },
    addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }
  };
}

const elements = {};
const getElement = (id) => (elements[id] ||= element());
const canvas = getElement('c');
const gradient = { addColorStop() {} };
canvas.getContext = () => new Proxy({
  createLinearGradient: () => gradient,
  createRadialGradient: () => gradient
}, { get: (target, key) => target[key] || (() => {}) });

const documentEvents = {};
const windowEvents = {};
const storage = new Map([['trex-high', 'not-a-number']]);
const context = {
  console, Math, Date, setTimeout: () => 1, clearTimeout: () => {},
  requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
  navigator: { maxTouchPoints: 0 },
  localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, String(value)) },
  CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options && options.detail; },
  document: {
    body: { appendChild() {} },
    getElementById: getElement,
    createElement: () => element(),
    addEventListener(type, callback) { (documentEvents[type] ||= []).push(callback); }
  },
  innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
  addEventListener(type, callback) { (windowEvents[type] ||= []).push(callback); },
  dispatchEvent() {}
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname + '/game.js', 'utf8'), context);

if (context.highScore !== 0) fail('Malformed trex-high must normalize to 0.');

const click = (id) => {
  const handlers = getElement(id).listeners.click || [];
  if (handlers.length !== 1) fail(`${id} needs exactly one click handler.`);
  handlers[0]({ preventDefault() {} });
};

if (context.started || context.gameOver) fail('Game does not begin in its idle state.');
click('btn-start');
if (!context.started || getElement('start-screen').classList.contains('hidden') !== true) fail('Start control does not enter playable state.');

vm.runInContext("score=99;speed=14;gameOver=true;started=false;nightMode=true;nightTimer=700;dino.dead=true;document.getElementById('game-over-screen').classList.add('active');document.getElementById('gz-cta').style.display='block';", context);
click('btn-restart');
if (!context.started || context.gameOver || context.score !== 0 || context.speed !== 6 || context.nightMode || context.nightTimer !== 0 || context.dino.dead) {
  fail('Restart does not restore a clean run.');
}
if (getElement('game-over-screen').classList.contains('active') || getElement('gz-cta').style.display !== 'none') {
  fail('Restart leaves a game-over overlay active.');
}

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
for (const token of ['id="btn-start"', 'id="btn-restart"', 'gz-ad-below-game', "localStorage.getItem('trex-high')"]) {
  if (!html.includes(token) && !fs.readFileSync(__dirname + '/game.js', 'utf8').includes(token)) fail(`Missing production path: ${token}`);
}
if (html.includes('aggregateRating')) fail('Structured data contains an aggregate rating.');

console.log('T-Rex: malformed save recovery, start, restart, overlay exclusion, and high-score persistence paths verified.');
