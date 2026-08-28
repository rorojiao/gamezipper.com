// Independent exact-cover verifier for the Barns room-placement pack.
// It does not use the production solver or production validator. It builds
// candidate rectangles from each level's stored room list, then enumerates
// exact tilings up to two solutions and requires exactly one circle per room.
const fs = require('fs');
const extractLevels = require('../.audit/gz-extract-levels.js');
const LEVELS = extractLevels('barns');

function exactCoverCount(candidates, cells) {
  const byCell = new Map();
  candidates.forEach((candidate, index) => {
    candidate.cells.forEach(cell => {
      if (!byCell.has(cell)) byCell.set(cell, []);
      byCell.get(cell).push(index);
    });
  });
  let solutions = 0;
  function search(remaining, used, solution) {
    if (solutions > 1) return;
    if (!remaining.length) { solutions++; solution.length; return; }
    const cell = remaining.reduce((best, item) => {
      const n = (byCell.get(item) || []).filter(i => !used.has(i)).length;
      return !best || n < best.n ? { cell: item, n } : best;
    }, null);
    if (!cell || cell.n === 0) return;
    for (const index of byCell.get(cell.cell) || []) {
      if (used.has(index)) continue;
      const candidate = candidates[index];
      const next = remaining.filter(item => !candidate.cells.includes(item));
      used.add(index); solution.push(index);
      search(next, used, solution);
      solution.pop(); used.delete(index);
    }
  }
  search(cells.slice(), new Set(), []);
  return solutions;
}

let fail = 0;
for (let levelNo = 0; levelNo < LEVELS.length; levelNo++) {
  const L = LEVELS[levelNo];
  const n = L.N;
  const cells = Array.from({ length: n * n }, (_, i) => i);
  const circles = L.c.map(c => ({ x: Math.floor(c / 10), y: c % 10 }));
  const candidates = L.r.map((r, index) => {
    const [x, y, w, h] = r;
    const roomCells = [];
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) roomCells.push(yy * n + xx);
    const circleCount = circles.filter(c => c.x >= x && c.x < x + w && c.y >= y && c.y < y + h).length;
    return { index, cells: roomCells, circleCount };
  });
  let ok = candidates.length > 0 && candidates.every(c => c.circleCount === 1);
  const solutions = ok ? exactCoverCount(candidates, cells) : 0;
  if (solutions !== 1) ok = false;
  console.log(`L${levelNo + 1} (${L.tier}, ${n}x${n}): ${ok ? 'UNIQUE' : `FAIL solutions=${solutions}`}`);
  if (!ok) fail++;
}
console.log(`=== ${LEVELS.length - fail}/${LEVELS.length} UNIQUE ===`);
if (fail) process.exit(1);
