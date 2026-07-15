#!/usr/bin/env node
// Wanrumuwandoa (One Room One Door) — INDEPENDENT Node.js verifier (Method 2).
// Re-implements the 5 rules from scratch in plain JS. No shared code with the generator.
// Validates every stored solution and counts alternative completions over FREE (unnumbered) cells.

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
const levels = data.levels;
const DIRS4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function neighbours(r, c, R, C) {
  const out = [];
  for (const [dr, dc] of DIRS4) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < R && nc >= 0 && nc < C) out.push([nr, nc]);
  }
  return out;
}

function whiteConnectedInRegions(region, blackSet, R, C, nreg) {
  const cellOfReg = Array.from({ length: nreg }, () => []);
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const rid = region[r][c];
    if (!blackSet.has(r + ',' + c)) cellOfReg[rid].push([r, c]);
  }
  for (let rid = 0; rid < nreg; rid++) {
    const cells = cellOfReg[rid];
    if (cells.length <= 1) continue;
    const seen = new Set([cells[0][0] + ',' + cells[0][1]]);
    const q = [cells[0]];
    while (q.length) {
      const [r, c] = q.shift();
      for (const [nr, nc] of neighbours(r, c, R, C)) {
        const k = nr + ',' + nc;
        if (seen.has(k)) continue;
        if (region[nr][nc] !== rid) continue;
        if (blackSet.has(k)) continue;
        seen.add(k);
        q.push([nr, nc]);
      }
    }
    if (seen.size !== cells.length) return false;
  }
  return true;
}

function doorCount(region, whiteSet, R, C) {
  const pc = new Map();
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const k = r + ',' + c;
    if (!whiteSet.has(k)) continue;
    const i = region[r][c];
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const nr = r + dr, nc = c + dc;
      const nk = nr + ',' + nc;
      if (nr < R && nc < C && whiteSet.has(nk)) {
        const j = region[nr][nc];
        if (i !== j) {
          const a = i < j ? i : j, b = i < j ? j : i;
          const key = a + ',' + b;
          pc.set(key, (pc.get(key) || 0) + 1);
        }
      }
    }
  }
  return pc;
}

function globalWhiteConnected(whiteSet) {
  if (whiteSet.size === 0) return false;
  const it = whiteSet.values();
  const start = it.next().value;
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const k = q.shift();
    const [r, c] = k.split(',').map(Number);
    for (const [nr, nc] of neighbours(r, c, 1e9, 1e9)) {
      // cheap guard: we won't have white outside grid because whiteSet ⊂ all grid cells
      // we still need to check whiteSet membership
      const nk = nr + ',' + nc;
      if (seen.has(nk)) continue;
      if (!whiteSet.has(nk)) continue;
      seen.add(nk);
      q.push(nk);
    }
  }
  return seen.size === whiteSet.size;
}

// Real grid-aware neighbours for globalWhiteConnected
function globalWhiteConnectedGrid(whiteSet, R, C) {
  if (whiteSet.size === 0) return false;
  const [sr, sc] = [...whiteSet][0].split(',').map(Number);
  const seen = new Set([sr + ',' + sc]);
  const q = [[sr, sc]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of DIRS4) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      const k = nr + ',' + nc;
      if (seen.has(k)) continue;
      if (!whiteSet.has(k)) continue;
      seen.add(k);
      q.push([nr, nc]);
    }
  }
  return seen.size === whiteSet.size;
}

function validateStored(lv) {
  const { R, C, nreg, region, black, clues } = lv;
  const blackSet = new Set(black.map(([r, c]) => r + ',' + c));
  const allCells = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) allCells.push(r + ',' + c);
  const whiteSet = new Set(allCells.filter(k => !blackSet.has(k)));

  // Rule 2: no orth adjacent blacks
  for (const k of blackSet) {
    const [r, c] = k.split(',').map(Number);
    for (const [dr, dc] of DIRS4) {
      const nk = (r + dr) + ',' + (c + dc);
      if (blackSet.has(nk)) return { ok: false, msg: 'Two black cells share an edge at ' + k + ' / ' + nk };
    }
  }
  // Rule 1: numbered regions must have black count == clue
  const regBlack = new Array(nreg).fill(0);
  for (const k of blackSet) {
    const [r, c] = k.split(',').map(Number);
    regBlack[region[r][c]]++;
  }
  for (const [rid, cnt] of Object.entries(clues)) {
    const id = +rid;
    if (regBlack[id] !== cnt) {
      return { ok: false, msg: `Clue mismatch in region ${id}: expected ${cnt} got ${regBlack[id]}` };
    }
  }
  // Rule 3: each region's whites 4-connected inside region
  if (!whiteConnectedInRegions(region, blackSet, R, C, nreg)) {
    return { ok: false, msg: "A region's whites are disconnected inside the region" };
  }
  // Rule 4: <= 1 door per region pair
  const doors = doorCount(region, whiteSet, R, C);
  for (const [k, n] of doors) if (n > 1) return { ok: false, msg: 'Pair ' + k + ' has ' + n + ' doors' };
  // Rule 5: global white connectivity
  if (!globalWhiteConnectedGrid(whiteSet, R, C)) {
    return { ok: false, msg: 'White cells are not globally connected' };
  }
  return { ok: true };
}

// Count alternative free-cell completions (excluding the stored free-cell mask).
function countFreeAlternatives(lv, cap = 3, nodeCap = 200_000) {
  const { R, C, nreg, region, black, clues } = lv;
  const fixedBlack = new Set(black.map(([r, c]) => r + ',' + c));
  const numberedSet = new Set(Object.keys(clues).map(s => +s));
  const allCells = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) allCells.push([r, c]);
  const free = allCells.filter(([r, c]) => !numberedSet.has(region[r][c]));
  const freeSet = new Set(free.map(([r, c]) => r + ',' + c));
  const order = free.slice();
  let count = 0;
  let nodes = 0;
  const chosen = new Set();
  const rng = (() => {
    let s = (R * 73 + C * 131 + nreg * 11) >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s & 0x7fffffff) / 0x7fffffff; };
  })();
  // Fisher-Yates
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  function okPartial(cell) {
    // cell is being added as black; ensure no orth black neighbour (in chosen OR in fixedBlack)
    const [r, c] = cell;
    for (const [dr, dc] of DIRS4) {
      const nk = (r + dr) + ',' + (c + dc);
      if (chosen.has(nk)) return false;
      if (fixedBlack.has(nk)) return false;
    }
    return true;
  }

  function validateFull(blackTotal) {
    const blackSet = new Set(blackTotal);
    const whiteSet = new Set(allCells.map(([r,c]) => r+','+c).filter(k => !blackSet.has(k)));
    if (!whiteConnectedInRegions(region, blackSet, R, C, nreg)) return false;
    const doors = doorCount(region, whiteSet, R, C);
    for (const n of doors.values()) if (n > 1) return false;
    if (!globalWhiteConnectedGrid(whiteSet, R, C)) return false;
    return true;
  }

  function bt(idx) {
    if (count >= cap || nodes > nodeCap) return;
    nodes++;
    if (idx === order.length) {
      const total = new Set([...fixedBlack, ...chosen]);
      if (validateFull(total)) count++;
      return;
    }
    const cell = order[idx];
    // option A: leave white
    bt(idx + 1);
    if (count >= cap || nodes > nodeCap) return;
    // option B: make black
    chosen.add(cell[0] + ',' + cell[1]);
    if (okPartial(cell)) bt(idx + 1);
    chosen.delete(cell[0] + ',' + cell[1]);
  }
  bt(0);
  return { count, capped: nodes > nodeCap };
}

let pass = 0, fail = 0;
const dist = { unique: 0, few: 0, many: 0 };
for (const lv of levels) {
  const v = validateStored(lv);
  if (!v.ok) { fail++; console.log(`L${lv.num} ${lv.R}x${lv.C}: FAIL — ${v.msg}`); continue; }
  const { count, capped } = countFreeAlternatives(lv, cap=3, nodeCap=80_000);
  pass++;
  let bucket = 'unique';
  if (count > 1 && count <= 5) bucket = 'few';
  else if (count > 5) bucket = 'many';
  if (count === 1) dist.unique++;
  else if (count <= 5) dist.few++;
  else dist.many++;
  console.log(`L${lv.num} ${lv.R}x${lv.C} ${lv.nreg}reg clues=${Object.keys(lv.clues).length}: VALID, completions=${count}${capped ? '+' : ''} (${bucket})`);
}
console.log(`\nMethod 2 (independent Node.js re-impl): ${pass}/${levels.length} VALID. Distribution unique=${dist.unique} few(2-5)=${dist.few} many(6+)=${dist.many}. FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
