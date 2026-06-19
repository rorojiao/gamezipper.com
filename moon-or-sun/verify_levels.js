#!/usr/bin/env node
// Independent verifier for Moon-or-Sun levels.
// Checks: path covers all cells exactly once; consecutive path cells are adjacent;
// each room's solution geometry matches its declared type; alternation holds.
'use strict';
const fs = require('fs');

const LEVELS = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function adj(a, b) {
  return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) === 1;
}

function segType(cells) {
  if (cells.length <= 1) return 'moon';
  const dirs = new Set();
  for (let i = 0; i < cells.length - 1; i++) {
    const [r1,c1] = cells[i], [r2,c2] = cells[i+1];
    dirs.add(`${r2-r1},${c2-c1}`);
  }
  return dirs.size === 1 ? 'moon' : 'sun';
}

let pass = 0, fail = 0;
for (const L of LEVELS) {
  const errors = [];
  // 1. Coverage: every cell in grid exactly once
  const seen = new Set();
  for (const [r,c] of L.solution) {
    const k = r+','+c;
    if (seen.has(k)) errors.push(`dup ${k}`);
    seen.add(k);
  }
  if (seen.size !== L.rows * L.cols) errors.push(`coverage ${seen.size}!=${L.rows*L.cols}`);
  // 2. Adjacency: consecutive path cells are adjacent
  for (let i = 0; i < L.solution.length - 1; i++) {
    if (!adj(L.solution[i], L.solution[i+1])) {
      errors.push(`non-adjacent at ${i}: ${L.solution[i]}→${L.solution[i+1]}`);
    }
  }
  // 3. Rooms: cells consecutive in path, type matches, all cells covered
  let pathIdx = 0;
  const allRoomCells = [];
  for (let ri = 0; ri < L.rooms.length; ri++) {
    const room = L.rooms[ri];
    allRoomCells.push(...room.cells);
    // Find room's cells in path
    const firstCell = room.cells[0];
    let startIdx = -1;
    for (let i = 0; i < L.solution.length; i++) {
      if (L.solution[i][0] === firstCell[0] && L.solution[i][1] === firstCell[1]) {
        startIdx = i; break;
      }
    }
    if (startIdx === -1) { errors.push(`room ${ri} first cell not in path`); continue; }
    // All room cells must be path-consecutive starting at startIdx
    for (let j = 0; j < room.cells.length; j++) {
      const want = room.cells[j];
      const got = L.solution[startIdx + j];
      if (!got || got[0] !== want[0] || got[1] !== want[1]) {
        errors.push(`room ${ri} cell ${j} not consecutive`); break;
      }
    }
    // Type check
    const actualType = segType(room.cells);
    if (actualType !== room.type) {
      errors.push(`room ${ri} type ${room.type} != actual ${actualType}`);
    }
  }
  // All cells covered by rooms
  if (allRoomCells.length !== L.rows * L.cols) {
    errors.push(`room cells ${allRoomCells.length} != grid ${L.rows*L.cols}`);
  }
  // 4. Alternation
  for (let i = 0; i < L.rooms.length - 1; i++) {
    if (L.rooms[i].type === L.rooms[i+1].type) {
      errors.push(`non-alt at room ${i}: ${L.rooms[i].type}`);
    }
  }
  if (errors.length === 0) { pass++; }
  else {
    fail++;
    console.log(`❌ L${L.id} ${L.tier} ${L.rows}x${L.cols}:`, errors.slice(0,3).join('; '));
  }
}
console.log(`\nRESULT: ${pass}/${LEVELS.length} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
