#!/usr/bin/env node
// verify_independent.js — Sokoban Switch solver (memory-efficient)
// Uses iterative deepening DFS with state hashing.

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS array
const m = html.match(/const LEVELS = \[([\s\S]*?)\n\];/);
if (!m) { console.error('LEVELS not found'); process.exit(1); }
const body = m[1];

function parseLevels(body){
  const levels = [];
  const headerRegex = /\{t:'([^']+)'\s*,\s*name:'([^']+)'\s*,\s*w:(\d+)\s*,\s*h:(\d+)\s*,\s*rows:\[/g;
  let match;
  while ((match = headerRegex.exec(body)) !== null){
    const tier = match[1], name = match[2];
    const w = parseInt(match[3]), h = parseInt(match[4]);
    const rowsStart = match.index + match[0].length;
    let depth = 1, i = rowsStart;
    while (i < body.length && depth > 0){
      if (body[i] === '[') depth++;
      else if (body[i] === ']') { depth--; if (depth === 0) break; }
      i++;
    }
    const rowsText = body.slice(rowsStart, i);
    const rows = [];
    const rowMatches = rowsText.matchAll(/'([^']+)'/g);
    for (const rm of rowMatches) rows.push(rm[1]);
    levels.push({tier, name, w, h, rows});
    headerRegex.lastIndex = i + 1;
  }
  return levels;
}

const LEVELS = parseLevels(body);
if (LEVELS.length !== 30) { console.error(`Expected 30 levels, got ${LEVELS.length}`); process.exit(1); }

console.log('=== verify_independent.js ===\n');
console.log(`Parsed ${LEVELS.length} levels\n`);

// State representation
const COLOR_TO_IDX = {R:1, G:2, L:3, Y:4};
const PLATE_COLOR_TO_IDX = {r:1, g:2, l:3, y:4};

function parseLevel(lv){
  const N = lv.w * lv.h;
  const wall = new Uint8Array(N);
  const goal = new Uint8Array(N);
  const gate = new Uint8Array(N);
  const plate = new Uint8Array(N);
  for (let y=0; y<lv.h; y++){
    for (let x=0; x<lv.w; x++){
      const idx = y*lv.w + x;
      const c = lv.rows[y][x];
      if (c === '#') wall[idx] = 1;
      else if (c === '_' || c === '@' || c === '*') goal[idx] = 1;
      else if (c === 'R' || c === 'G' || c === 'L' || c === 'Y') gate[idx] = COLOR_TO_IDX[c];
      else if (c === 'r' || c === 'g' || c === 'l' || c === 'y') plate[idx] = PLATE_COLOR_TO_IDX[c];
    }
  }
  return {w: lv.w, h: lv.h, wall, goal, gate, plate};
}

function newState(shared){
  return {
    shared,
    box: new Uint8Array(shared.w*shared.h),
    player: new Uint8Array(shared.w*shared.h),
    plate_on: new Uint8Array(shared.w*shared.h),
    gate_open: new Uint8Array(shared.w*shared.h),
  };
}

function setInitial(init, lv){
  for (let y=0; y<lv.h; y++){
    for (let x=0; x<lv.w; x++){
      const idx = y*lv.w + x;
      const c = lv.rows[y][x];
      if (c === 'P' || c === '@') init.player[idx] = 1;
      else if (c === 'B' || c === '*') init.box[idx] = 1;
    }
  }
}

function updateDerived(s){
  const N = s.shared.w * s.shared.h;
  const {plate, gate} = s.shared;
  const {plate_on, gate_open, box, player} = s;
  plate_on.fill(0);
  gate_open.fill(0);
  for (let i=0; i<N; i++){
    if (plate[i] && (player[i] || box[i])) plate_on[i] = 1;
  }
  for (let i=0; i<N; i++){
    if (gate[i]){
      for (let j=0; j<N; j++){
        if (plate[j] === gate[i] && plate_on[j]){gate_open[i] = 1; break;}
      }
    }
  }
}

function isSolved(s){
  const N = s.shared.w * s.shared.h;
  const {goal} = s.shared;
  const {box} = s;
  for (let i=0; i<N; i++){
    if (goal[i] && !box[i]) return false;
  }
  return true;
}

function findPlayer(s){
  const N = s.shared.w * s.shared.h;
  for (let i=0; i<N; i++) if (s.player[i]) return i;
  return -1;
}

function movePlayer(s, dx, dy){
  const {w, h, wall, gate} = s.shared;
  const {box, player, gate_open} = s;
  const pIdx = findPlayer(s);
  if (pIdx < 0) return false;
  const px = pIdx % w, py = (pIdx - px) / w;
  const nx = px + dx, ny = py + dy;
  if (nx < 0 || ny < 0 || nx >= w || ny >= h) return false;
  const nIdx = ny*w + nx;
  if (wall[nIdx]) return false;
  if (gate[nIdx] && !gate_open[nIdx]) return false;
  if (box[nIdx]){
    const bx = nx + dx, by = ny + dy;
    if (bx < 0 || by < 0 || bx >= w || by >= h) return false;
    const bIdx = by*w + bx;
    if (wall[bIdx]) return false;
    if (gate[bIdx] && !gate_open[bIdx]) return false;
    if (box[bIdx]) return false;
    box[bIdx] = 1;
    box[nIdx] = 0;
  }
  player[nIdx] = 1;
  player[pIdx] = 0;
  updateDerived(s);
  return true;
}

function stateKey(s){
  const N = s.shared.w * s.shared.h;
  const {box, player, plate_on} = s;
  let pPos = -1;
  let boxStr = '';
  let plateStr = '';
  for (let i=0; i<N; i++){
    if (player[i]) pPos = i;
    if (box[i]) boxStr += i + ',';
    if (s.shared.plate[i]) plateStr += i + '.' + plate_on[i] + ';';
  }
  return pPos + '|' + boxStr + '|' + plateStr;
}

function cloneState(s){
  return {
    shared: s.shared,
    box: new Uint8Array(s.box),
    player: new Uint8Array(s.player),
    plate_on: new Uint8Array(s.plate_on),
    gate_open: new Uint8Array(s.gate_open),
  };
}

// BFS with state cap
function solveBFS(shared, init, maxStates=8000){
  if (isSolved(init)) return {solved:true, states:1};
  const visited = new Set([stateKey(init)]);
  const queue = [init];
  const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
  let states = 1;
  while (queue.length > 0 && states < maxStates){
    const cur = queue.shift();
    for (const [dx,dy] of dirs){
      const next = cloneState(cur);
      if (!movePlayer(next, dx, dy)) continue;
      const k = stateKey(next);
      if (visited.has(k)) continue;
      visited.add(k);
      states++;
      if (isSolved(next)) return {solved:true, states};
      queue.push(next);
      if (queue.length > 20000) break;
    }
    if (queue.length > 20000) break;
  }
  return {solved:false, states};
}

let pass = 0, fail = 0;
const solvedKeys = new Set();

for (let i=0; i<LEVELS.length; i++){
  const lv = LEVELS[i];
  const shared = parseLevel(lv);
  const init = newState(shared);
  setInitial(init, lv);
  updateDerived(init);

  // Run BFS with multiple attempts, increasing cap each iteration
  let result = {solved:false, states:0};
  for (const cap of [4000, 12000, 40000]){
    result = solveBFS(shared, init, cap);
    if (result.solved) break;
  }

  if (result.solved){
    // Find solved state key
    const visited2 = new Set([stateKey(init)]);
    const queue2 = [init];
    const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
    let endKey = '';
    bfs: while (queue2.length > 0){
      const cur = queue2.shift();
      for (const [dx,dy] of dirs){
        const next = cloneState(cur);
        if (!movePlayer(next, dx, dy)) continue;
        const k = stateKey(next);
        if (visited2.has(k)) continue;
        visited2.add(k);
        if (isSolved(next)){endKey = k; break bfs;}
        queue2.push(next);
      }
    }
    const idx = String(i+1).padStart(2);
    const isDup = solvedKeys.has(endKey);
    console.log(`  L${idx} ${(lv.t||'').padEnd(9)} ${lv.name.padEnd(18)} SOLVED (states=${result.states})${isDup?' [DUP]':''}`);
    solvedKeys.add(endKey);
    pass++;
  } else {
    const idx = String(i+1).padStart(2);
    console.log(`  L${idx} ${(lv.t||'').padEnd(9)} ${lv.name.padEnd(18)} UNSOLVABLE (states=${result.states})`);
    fail++;
  }
}

console.log(`\n${pass}/${LEVELS.length} levels solved`);
console.log(`Unique solved states: ${solvedKeys.size}/${pass}`);
if (fail > 0){
  console.log(`\n${fail} levels FAILED`);
  process.exit(1);
}
console.log('\nverify_independent.js PASSED');
process.exit(0);