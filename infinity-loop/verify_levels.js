#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const start = html.indexOf('var TILE_EMPTY');
const end = html.indexOf('// --- RENDERING ---', start);

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

if (start < 0 || end < 0) fail('Could not extract production level generator.');
const source = html.slice(start, end);

function seededMath(seed) {
  let value = seed >>> 0;
  const math = Object.create(Math);
  math.random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 0x100000000);
  return math;
}

let checks = 0;
for (let level = 1; level <= 50; level++) {
  for (let seed = 1; seed <= 20; seed++) {
    const context = vm.createContext({ Math: seededMath(seed * 2654435761 + level) });
    vm.runInContext(source, context);
    vm.runInContext(`generateLevel(${level});`, context);
    if (vm.runInContext('checkWin()', context)) fail(`Level ${level}, seed ${seed} starts solved.`);
    vm.runInContext('for(var y=0;y<gridSize;y++)for(var x=0;x<gridSize;x++)scrambled[y][x].rotation=grid[y][x].rotation;', context);
    if (!vm.runInContext('checkWin()', context)) fail(`Level ${level}, seed ${seed} canonical board fails checkWin.`);
    checks++;
  }
}

const required = [
  '})(lvl,isUnlocked);',
  'if(!unlocked)return;',
  "if(name!=='game'){",
  'if(timerInterval){clearInterval(timerInterval);timerInterval=null;}',
  'if(raf){cancelAnimationFrame(raf);raf=null;}',
  "SAVE_KEY='infinity-loop-progress-v3'",
  'gz-ad-below-game'
];
for (const token of required) {
  if (!html.includes(token)) fail(`Missing required production path: ${token}`);
}
if (html.includes('aggregateRating')) fail('Structured data contains an aggregate rating.');

console.log(`Infinity Loop: ${checks} deterministic level generations pass canonical and unsolved-start checks.`);
