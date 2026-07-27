#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const geometryStart = html.indexOf('function rp(');
const audioStart = html.indexOf('// ===== AUDIO =====', geometryStart);
const polygonStart = html.indexOf('function polyArea(');
const stateStart = html.indexOf('// ===== GAME STATE =====', polygonStart);

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

if (geometryStart < 0 || audioStart < 0 || polygonStart < 0 || stateStart < 0) {
  fail('Could not extract production level geometry.');
}

const context = vm.createContext({ Math });
vm.runInContext(html.slice(geometryStart, audioStart) + html.slice(polygonStart, stateStart), context);
const levels = context.LEVELS;

if (!Array.isArray(levels) || levels.length === 0) fail('Refusing zero-level success.');
if (levels.length !== 50) fail(`Expected 50 levels, found ${levels.length}.`);

function area(vertices) {
  let total = 0;
  for (let i = 0; i < vertices.length; i++) {
    const next = vertices[(i + 1) % vertices.length];
    total += vertices[i].x * next.y - next.x * vertices[i].y;
  }
  return Math.abs(total) / 2;
}

function clone(vertices) {
  return vertices.map((point) => ({ x: point.x, y: point.y }));
}

function splitOnePiece(pieces) {
  for (let i = 0; i < pieces.length; i++) {
    const vertices = pieces[i];
    const centerY = vertices.reduce((sum, point) => sum + point.y, 0) / vertices.length;
    const xs = vertices.map((point) => point.x);
    const margin = Math.max(10, Math.max(...xs) - Math.min(...xs));
    const result = context.splitPoly(
      vertices,
      { x: Math.min(...xs) - margin, y: centerY },
      { x: Math.max(...xs) + margin, y: centerY }
    );
    if (result.length === 2 && result.every((piece) => piece.length >= 3 && area(piece) > 1e-6)) {
      pieces.splice(i, 1, result[0], result[1]);
      return true;
    }
  }
  return false;
}

for (let index = 0; index < levels.length; index++) {
  const level = levels[index];
  if (level.ch !== Math.floor(index / 10) + 1) fail(`Level ${index + 1} has the wrong chapter.`);
  if (!Array.isArray(level.s) || level.s.length === 0) fail(`Level ${index + 1} has no shapes.`);
  if (!Number.isInteger(level.t) || !Number.isInteger(level.c)) fail(`Level ${index + 1} has invalid targets.`);
  if (level.t < level.s.length || level.t > level.s.length * (2 ** level.c)) {
    fail(`Level ${index + 1} cannot reach its target within the cut budget.`);
  }

  for (const shape of level.s) {
    if (!Array.isArray(shape) || shape.length < 3 || !shape.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))) {
      fail(`Level ${index + 1} contains invalid polygon data.`);
    }
    if (area(shape) <= 1e-6) fail(`Level ${index + 1} contains a degenerate polygon.`);
  }

  const pieces = level.s.map(clone);
  while (pieces.length < level.t) {
    if (!splitOnePiece(pieces)) fail(`Level ${index + 1} cannot be completed through the production splitter.`);
  }
  if (pieces.length !== level.t) fail(`Level ${index + 1} reached ${pieces.length}, not ${level.t}, pieces.`);
}

const required = [
  "id=\"btn_how\"",
  "document.getElementById('btn_how').onclick",
  "document.getElementById('btn_next').onclick",
  "if(G.failed)startLevel(G.lvIdx);",
  "SAVE_KEY='sliceMaster_v2'",
  'p.v===2',
  'cancelAnimationFrame(G.animId)',
  'gz-ad-below-game'
];
for (const token of required) {
  if (!html.includes(token)) fail(`Missing required production path: ${token}`);
}
if (html.includes('aggregateRating')) fail('Structured data contains an aggregate rating.');

console.log(`Slice Master: ${levels.length} levels valid; splitter, completion retry, controls, persistence, cleanup, and ad slot verified.`);
