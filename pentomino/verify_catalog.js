#!/usr/bin/env node
'use strict';

// Independent catalog audit and geometry bridge. Execute the actual engine
// definitions, so neither this audit nor the generator can invent a rotation.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const HERE = __dirname;
const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const start = html.indexOf('const PENTOMINOES_LOCAL =');
const end = html.indexOf('\nfunction getSelectedCells(', start);
assert(start >= 0 && end > start, 'Engine geometry definitions not found');
const geometry = vm.runInNewContext(html.slice(start, end) + `
  ;({shapes: PENTOMINOES_LOCAL, normalize: normalizePiece,
     orientations: Object.fromEntries(Object.keys(PENTOMINOES_LOCAL)
       .map(name => [name, allOrientationsLocal(name)]))})`);
const order = JSON.parse(html.match(/const PIECE_ORDER = (\[[^;]+\]);/)[1].replace(/'/g, '"'));

function canonical(cells) {
  return geometry.normalize(cells);
}

function checkShapes() {
  const signatures = new Map();
  for (const [name, orientations] of Object.entries(geometry.orientations)) {
    const key = orientations.map(canonical).sort()[0];
    assert(!signatures.has(key), `COLLISION: ${signatures.get(key)} === ${name}`);
    signatures.set(key, name);
    console.log(`${name}: ${orientations.length} orientations`);
  }
  assert.equal(signatures.size, 12);
  assert.equal(geometry.orientations.N.length, 8);
  assert.equal(canonical(geometry.shapes.N), '[[0,0],[1,0],[2,0],[2,1],[3,1]]');
  console.log('PASS: 12 distinct free pentominoes; N has 8 orientations');
}

// Exact cover with both cell and piece constraints, independent of the
// generator and shipped verifiers. Anchor over the entire bounding box:
// a normalized orientation need not contain its top-left bounding-box cell.
function solutionCount(level, cap = 2) {
  const cells = [];
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (level.outline[r][c] === '#') cells.push([r, c]);
    }
  }
  const index = new Map(cells.map(([r, c], i) => [`${r},${c}`, i]));
  const columns = Array.from({length: cells.length + level.pieces.length}, () => []);
  level.pieces.forEach((name, pieceIndex) => {
    for (const orient of geometry.orientations[name]) {
      for (let r = 0; r < level.rows; r++) {
        for (let c = 0; c < level.cols; c++) {
          const indices = orient.map(([dr, dc]) => index.get(`${r + dr},${c + dc}`));
          if (indices.some(i => i === undefined)) continue;
          indices.push(cells.length + pieceIndex);
          const mask = indices.reduce((m, i) => m | (1n << BigInt(i)), 0n);
          indices.forEach(i => columns[i].push(mask));
        }
      }
    }
  });
  const full = (1n << BigInt(columns.length)) - 1n;
  let count = 0;
  function search(used) {
    if (count >= cap) return;
    if (used === full) { count++; return; }
    let best;
    for (let i = 0; i < columns.length; i++) {
      if (used & (1n << BigInt(i))) continue;
      const options = columns[i].filter(m => !(m & used));
      if (!options.length) return;
      if (!best || options.length < best.length) best = options;
      if (best.length === 1) break;
    }
    for (const mask of best) search(used | mask);
  }
  search(0n);
  return count;
}

function validate(level) {
  assert.equal(level.outline.length, level.rows);
  assert.equal(level.solution.length, level.rows);
  assert.equal(new Set(level.pieces).size, level.pieces.length);
  for (let r = 0; r < level.rows; r++) {
    assert.equal(level.outline[r].length, level.cols);
    assert.equal(level.solution[r].length, level.cols);
    for (let c = 0; c < level.cols; c++) {
      const ch = level.solution[r][c];
      assert.equal(ch !== '.', level.outline[r][c] === '#');
      assert(ch === '.' || level.pieces.includes(ch));
    }
  }
  for (const name of level.pieces) {
    const cells = [];
    level.solution.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === name) cells.push([r, c]);
    }));
    assert.equal(cells.length, 5);
    assert(geometry.orientations[name].some(o => canonical(o) === canonical(cells)),
      `Stored solution has incorrect ${name} shape`);
  }
}

function audit() {
  const levels = JSON.parse(fs.readFileSync(path.join(HERE, 'levels.json'), 'utf8')).levels;
  const runtime = vm.runInNewContext(fs.readFileSync(path.join(HERE, 'levels-data.js'), 'utf8') + '; LEVELS');
  assert.equal(levels.length, 30);
  assert.equal(runtime.length, 30);
  const decoded = runtime.map((lv, i) => {
    assert.equal(lv.n, i + 1);
    assert.equal(lv.o.length, lv.r * lv.c);
    assert.equal(lv.s.length, lv.r * lv.c);
    assert(lv.o.every(v => v === 0 || v === 1));
    assert(lv.s.every(v => v === -1 || (Number.isInteger(v) && v >= 0 && v < order.length)));
    return {
      rows: lv.r, cols: lv.c, tier: lv.t, pieces: Array.from(lv.p),
      outline: Array.from({length: lv.r}, (_, r) => lv.o.slice(r * lv.c, (r + 1) * lv.c).map(v => v ? '#' : '.').join('')),
      solution: Array.from({length: lv.r}, (_, r) => lv.s.slice(r * lv.c, (r + 1) * lv.c).map(v => v < 0 ? '.' : order[v]).join('')),
    };
  });
  for (const [filename, catalog] of [['levels.json', levels], ['levels-data.js', decoded]]) {
    const identities = new Set();
    let unsolvable = 0, duplicates = 0, unique = 0;
    catalog.forEach((lv, i) => {
      validate(lv);
      const key = JSON.stringify([lv.rows, lv.cols, lv.outline, [...lv.pieces].sort()]);
      if (identities.has(key)) duplicates++;
      identities.add(key);
      const count = solutionCount(lv);
      if (!count) unsolvable++;
      if (count === 1) unique++;
      assert.equal(lv.tier, ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'][Math.floor(i / 6)]);
      assert.equal(lv.pieces.length, Math.floor(i / 6) + 1);
    });
    console.log(`${filename}: ${catalog.length} levels; ${unsolvable} UNSOLVABLE; ${duplicates} duplicate groups; ${unique} unique solutions; all stored covers valid`);
    assert.equal(unsolvable, 0);
    assert.equal(duplicates, 0);
    assert.equal(unique, 30);
  }
  levels.forEach((lv, i) => {
    for (const field of ['rows', 'cols', 'tier', 'pieces', 'outline', 'solution']) {
      assert.equal(JSON.stringify(lv[field]), JSON.stringify(decoded[i][field]), `Index ${i}: ${field} differs`);
    }
  });
  console.log('PASS: runtime/audit encodings agree at every index');
}

if (process.argv.includes('--geometry')) {
  console.log(JSON.stringify({shapes: geometry.shapes, orientations: geometry.orientations, order}));
} else {
  if (!process.argv.includes('--audit')) checkShapes();
  if (!process.argv.includes('--shapes')) audit();
}
