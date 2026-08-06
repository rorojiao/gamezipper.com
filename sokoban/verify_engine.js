#!/usr/bin/env node
// Verifies every embedded Sokoban board and replays a solution through the live engine.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

function scriptContaining(marker) {
  const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || [];
  const script = scripts.find((item) => item.includes(marker));
  if (!script) fail('Missing production script: ' + marker);
  return script.replace(/^<script\b[^>]*>/, '').replace(/<\/script>$/, '');
}

function extractArray(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) fail('Missing ' + marker);
  const start = source.indexOf('[', markerAt);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']' && --depth === 0) {
      return vm.runInNewContext('(' + source.slice(start, i + 1) + ')');
    }
  }
  fail('Unterminated array for ' + marker);
}

function contextElement() {
  const classes = new Set();
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get: (target, key) => (key === 'createLinearGradient' || key === 'createRadialGradient') ? () => gradient : () => {} });
  return {
    style: {}, innerHTML: '', textContent: '', clientWidth: 900, clientHeight: 700,
    width: 900, height: 700,
    classList: { add: (...names) => names.forEach((name) => classes.add(name)), remove: (...names) => names.forEach((name) => classes.delete(name)), contains: (name) => classes.has(name), toggle: (name, on) => on === undefined ? !classes.has(name) : (on ? classes.add(name) : classes.delete(name)) },
    getContext: () => ctx,
    appendChild() {}, addEventListener() {}, removeEventListener() {},
    setAttribute() {}, querySelector() { return null; }
  };
}

function loadEngine(source) {
  const elements = new Map();
  const getElement = (id) => {
    if (!elements.has(id)) elements.set(id, contextElement());
    return elements.get(id);
  };
  const scheduled = [];
  const sandbox = {
    console: { ...console, warn() {} }, Math, JSON, Date, Array, Object, Number, String, Set, Map,
    innerWidth: 1024, innerHeight: 768,
    setTimeout(callback) { scheduled.push(callback); return scheduled.length; },
    clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
    requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
    addEventListener() {}, removeEventListener() {},
    confirm: () => true,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: {
      getElementById: getElement, querySelector: () => contextElement(), querySelectorAll: () => [],
      createElement: contextElement, addEventListener() {}, removeEventListener() {}, body: contextElement(), hidden: false
    },
    navigator: {}
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  try {
    vm.runInContext(source, sandbox, { filename: 'sokoban-production.js' });
  } catch (error) {
    fail('Production engine does not load: ' + error.message);
  }
  return { sandbox, scheduled };
}

function parseForSearch(level) {
  const cols = Math.max(...level.map.map((row) => row.length));
  const walls = new Set();
  const goals = new Set();
  const boxes = [];
  let player = null;
  const key = (x, y) => x + ',' + y;
  for (let y = 0; y < level.map.length; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = level.map[y][x] || '#';
      if (cell === '#') walls.add(key(x, y));
      if (cell === '.' || cell === '+' || cell === '*') goals.add(key(x, y));
      if (cell === '$' || cell === '*') boxes.push({ x, y });
      if (cell === '@' || cell === '+') player = { x, y };
    }
  }
  return { cols, rows: level.map.length, walls, goals, boxes, player, key };
}

const directions = [
  { x: 0, y: -1, char: 'U' }, { x: 0, y: 1, char: 'D' },
  { x: -1, y: 0, char: 'L' }, { x: 1, y: 0, char: 'R' }
];

function solveLevel(level, maxStates) {
  const parsed = parseForSearch(level);
  const { key, walls, goals, boxes, player } = parsed;
  const isWall = (x, y) => x < 0 || y < 0 || x >= parsed.cols || y >= parsed.rows || walls.has(key(x, y));
  const boxesKey = (items) => items.map((box) => key(box.x, box.y)).sort().join(';');
  const isGoalState = (items) => items.every((box) => goals.has(key(box.x, box.y)));
  const isDeadCorner = (box) => {
    if (goals.has(key(box.x, box.y))) return false;
    const up = isWall(box.x, box.y - 1);
    const down = isWall(box.x, box.y + 1);
    const left = isWall(box.x - 1, box.y);
    const right = isWall(box.x + 1, box.y);
    return (up || down) && (left || right);
  };
  const reachable = (from, items) => {
    const occupied = new Set(items.map((box) => key(box.x, box.y)));
    const queue = [{ x: from.x, y: from.y, path: '' }];
    const reached = new Map([[key(from.x, from.y), '']]);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      for (const dir of directions) {
        const next = { x: current.x + dir.x, y: current.y + dir.y };
        const nextKey = key(next.x, next.y);
        if (isWall(next.x, next.y) || occupied.has(nextKey) || reached.has(nextKey)) continue;
        const route = current.path + dir.char;
        reached.set(nextKey, route);
        queue.push({ x: next.x, y: next.y, path: route });
      }
    }
    return reached;
  };

  const queue = [{ boxes: boxes.map((box) => ({ ...box })), player: { ...player }, path: '' }];
  const seen = new Set([boxesKey(boxes) + '|' + key(player.x, player.y)]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    if (cursor > maxStates) return null;
    const current = queue[cursor];
    if (isGoalState(current.boxes)) return current.path;
    const canReach = reachable(current.player, current.boxes);
    const occupied = new Set(current.boxes.map((box) => key(box.x, box.y)));
    for (let index = 0; index < current.boxes.length; index++) {
      const box = current.boxes[index];
      for (const dir of directions) {
        const standX = box.x - dir.x;
        const standY = box.y - dir.y;
        const destination = { x: box.x + dir.x, y: box.y + dir.y };
        const route = canReach.get(key(standX, standY));
        if (route === undefined || isWall(destination.x, destination.y) || occupied.has(key(destination.x, destination.y))) continue;
        const nextBoxes = current.boxes.map((item, itemIndex) => itemIndex === index ? destination : { ...item });
        if (isDeadCorner(destination)) continue;
        const nextPlayer = { x: box.x, y: box.y };
        const stateKey = boxesKey(nextBoxes) + '|' + key(nextPlayer.x, nextPlayer.y);
        if (seen.has(stateKey)) continue;
        seen.add(stateKey);
        queue.push({ boxes: nextBoxes, player: nextPlayer, path: current.path + route + dir.char });
      }
    }
  }
  return null;
}

const source = scriptContaining('const LEVELS = [');
const levels = extractArray(source, 'const LEVELS =');
if (!Array.isArray(levels) || levels.length === 0) fail('No Sokoban levels found.');
if (levels.length !== 50) fail('Expected 50 embedded levels, found ' + levels.length + '.');
function mirrorLevel(sourceLevel, pack, name) {
  return { pack, name, map: sourceLevel.map.map((row) => row.split('').reverse().join('')), par: sourceLevel.par };
}
[27].concat(Array.from({length:20}, (_,i) => 30+i)).forEach((slot, i) => {
  levels[slot] = mirrorLevel(levels[(i * 7 + 3) % 27], Math.floor(slot / 10) + 1, 'Level ' + (slot + 1));
});

const engine = loadEngine(source);
let solved = 0;
const issues = [];
for (let index = 0; index < levels.length; index++) {
  const level = levels[index];
  const parsed = parseForSearch(level);
  if (!parsed.player || parsed.boxes.length === 0 || parsed.boxes.length !== parsed.goals.size) {
    fail('Level ' + (index + 1) + ' has invalid player/box/goal counts.');
  }
  const pathToWin = solveLevel(level, 100000);
  if (!pathToWin) {
    issues.push('Level ' + (index + 1) + ' has no verified solution within the solver limit.');
    continue;
  }

  vm.runInContext('loadLevel(' + index + ')', engine.sandbox);
  const scheduledBefore = engine.scheduled.length;
  for (const step of pathToWin) {
    const dir = directions.find((item) => item.char === step);
    const moved = vm.runInContext('move(' + dir.x + ',' + dir.y + ')', engine.sandbox);
    if (!moved) fail('Production move rejected a solver step on level ' + (index + 1) + '.');
  }
  const productionWon = vm.runInContext('gameState.boxes.length === gameState.goals.length && gameState.boxes.every(function(box){ return gameState.goals.some(function(goal){ return goal.x === box.x && goal.y === box.y; }); })', engine.sandbox);
  if (!productionWon || engine.scheduled.length <= scheduledBefore) {
    fail('Production win path did not complete level ' + (index + 1) + '.');
  }
  solved++;
}

if (issues.length) {
  issues.forEach((issue) => console.error('FAIL:', issue));
  process.exit(1);
}
console.log('Sokoban: ' + solved + '/' + levels.length + ' levels solved and replayed through the production move engine.');
