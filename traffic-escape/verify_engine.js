#!/usr/bin/env node
// verify_engine.js for traffic-escape (R523 P0 fix)
// Verifies that all 50 LEVELS are solvable per the NEW engine rules:
//   - Cars slide FORWARD in their dir direction (R523 fix)
//   - checkWin requires target FRONT to have reached exit position
//   - target row/col must align with exit's primary axis (data-level fix in fix_levels.js)
//
// Usage: node verify_engine.js
// Exit code: 0 = all pass, 1 = some failed
'use strict';
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
const html = fs.readFileSync(file, 'utf8');

const m = html.match(/var LEVELS = (\[[\s\S]*?\]);/);
if (!m) { console.error('NO LEVELS found'); process.exit(1); }
let LEVELS;
try { LEVELS = eval(m[1]); } catch (e) { console.error('EVAL ERR:', e.message); process.exit(1); }
console.log('traffic-escape in-engine verification: %d/50 levels', LEVELS.length);

function carCells(car) {
  const cells = [];
  for (let i = 0; i < car.len; i++) {
    const d = car.dir;
    if (d === 'right') cells.push([car.row, car.col - i]);
    else if (d === 'left') cells.push([car.row, car.col + i]);
    else if (d === 'down') cells.push([car.row - i, car.col]);
    else if (d === 'up') cells.push([car.row + i, car.col]);
  }
  return cells;
}

function isWon(cars, lvl) {
  const target = cars.find(c => c.isTarget);
  if (!target) return false;
  const ex = lvl.exit;
  if (ex.dir === 'right' && target.row === ex.row && target.col >= ex.col) return true;
  if (ex.dir === 'left' && target.row === ex.row && target.col <= ex.col) return true;
  if (ex.dir === 'up' && target.col === ex.col && target.row <= ex.row) return true;
  if (ex.dir === 'down' && target.col === ex.col && target.row >= ex.row) return true;
  return false;
}

function findMaxMove(car, cars, lvl) {
  let dr = 0, dc = 0;
  const d = car.dir;
  if (d === 'right') dc = 1;
  else if (d === 'left') dc = -1;
  else if (d === 'down') dr = 1;
  else if (d === 'up') dr = -1;
  let nr = car.row, nc = car.col;
  const othersPos = new Set();
  for (const o of cars) {
    if (o.id === car.id) continue;
    for (const [r, c] of carCells(o)) othersPos.add(r + ',' + c);
  }
  while (true) {
    const nnr = nr + dr;
    const nnc = nc + dc;
    const cells = [];
    for (let i = 0; i < car.len; i++) {
      if (d === 'right') cells.push([nnr, nnc - i]);
      else if (d === 'left') cells.push([nnr, nnc + i]);
      else if (d === 'down') cells.push([nnr - i, nnc]);
      else if (d === 'up') cells.push([nnr + i, nnc]);
    }
    let valid = true;
    for (const [r, c] of cells) {
      if (r < 0 || c < 0 || r >= lvl.rows || c >= lvl.cols) { valid = false; break; }
      if (othersPos.has(r + ',' + c)) { valid = false; break; }
    }
    if (!valid) break;
    nr = nnr; nc = nnc;
  }
  return { row: nr, col: nc };
}

function bfs(lvl, maxDepth = 30, maxStates = 5000) {
  const initial = LEVELS[0].cars.map(c => `${c.id},${c.row},${c.col}`).sort().join('|');
  const stateKey = (state) => state.slice().sort().join('|');
  const initState = lvl.cars.map(c => ({ id: c.id, row: c.row, col: c.col }));
  const visited = new Set([stateKey(initState.map(c => `${c.id},${c.row},${c.col}`))]);
  const queue = [initState.map(c => ({ ...c }))];
  let depth = 0;
  while (queue.length > 0 && visited.size < maxStates) {
    const state = queue.shift();
    const cars = state.map(c => ({ ...c }));
    const target = cars.find(c => c.isTarget);
    if (target && isWon(cars, lvl)) return 'SOLVED';
    if (depth > maxDepth) return 'DEPTH_LIMIT';
    for (const c of cars) {
      const move = findMaxMove(c, cars, lvl);
      if (move.row === c.row && move.col === c.col) continue;
      const newCars = cars.map(o => o.id === c.id ? { ...o, row: move.row, col: move.col } : o);
      const newKey = stateKey(newCars.map(o => `${o.id},${o.row},${o.col}`));
      if (!visited.has(newKey)) {
        visited.add(newKey);
        queue.push(newCars);
      }
    }
    depth++;
  }
  return visited.size >= maxStates ? 'STATE_CAP' : 'UNSOLVABLE';
}

let pass = 0, fail = 0;
const failed = [];
for (let i = 0; i < LEVELS.length; i++) {
  const lvl = LEVELS[i];
  const result = bfs(lvl, 150, 50000);
  if (result === 'SOLVED') {
    pass++;
  } else {
    fail++;
    failed.push({ idx: i + 1, name: lvl.name, reason: result });
  }
}
console.log('pass=%d, fail=%d, total=%d', pass, fail, LEVELS.length);
console.log('verdict=%s', fail === 0 ? 'PASS' : 'FAIL');
if (failed.length > 0) {
  console.log('Failed levels:');
  for (const f of failed.slice(0, 10)) {
    console.log('  L%d %s: %s', f.idx, f.name, f.reason);
  }
  console.log('Note: 12 known levels (Block Party, Simple Path, Hard Start, Boss: Intersection, Rush Hour, Long Haul, Cargo Bay, Freight Train, Marathon, Chaos Theory, Traffic Chaos, The Gauntlet) have data-level cars with OOB cells (cells extend to negative coordinates due to original generator bug). They are not solvable as-is and require level redesign.');
}
process.exit(fail === 0 ? 0 : 1);