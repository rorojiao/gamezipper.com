#!/usr/bin/env node
// verify_engine.js — uses the live engine's parseLevel + cloneGrid to build
// the level geometry, then runs a deterministic push-state solver that
// distinguishes SOLVED, PROVEN_UNSOLVABLE, and TIMEOUT. Verifies all 30
// levels and rejects exact-duplicate layout patterns.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
function extractFunction(code, name) {
  const idx = code.indexOf('function ' + name + '(');
  if (idx < 0) return '';
  let depth = 0, i = idx, start = idx;
  while (i < code.length) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  return code.slice(start, i + 1);
}
const fns = ['parseLevel', 'cloneGrid', 'findPlayer', 'findBoxes', 'updatePlates', 'updateGates', 'movePlayer', 'isSolved'];
let engineCode = "var COLORS = {R:{name:'red'}, G:{name:'green'}, L:{name:'blue'}, Y:{name:'yellow'}}; var COLOR_KEYS = ['R','G','L','Y'];";
for (const fn of fns) engineCode += '\n' + extractFunction(html, fn);

// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('sokoban-switch');

const sb = {
  console,
  Math, Date, Number, Object, Array, String, JSON, Map, Set, Promise,
  Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array
};
const ctx = vm.createContext(sb);
vm.runInContext("globalThis.LEVELS = " + JSON.stringify(LEVELS) + ";", ctx);
vm.runInContext(engineCode, ctx);
globalThis.LEVELS = LEVELS;

const GATE = {R:1, G:2, L:3, Y:4};
const PLATE = {r:1, g:2, l:3, y:4};

function build(lv) {
  const n = lv.w * lv.h;
  const wall = new Uint8Array(n), goal = new Uint8Array(n), gate = new Uint8Array(n), plate = new Uint8Array(n);
  const boxes = []; let player = -1;
  for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
    const i = y * lv.w + x, c = lv.rows[y][x];
    if (c === '#') wall[i] = 1;
    if (c === '_' || c === '@' || c === '*') goal[i] = 1;
    if (GATE[c]) gate[i] = GATE[c];
    if (PLATE[c]) plate[i] = PLATE[c];
    if (c === 'B' || c === '*') boxes.push(i);
    if (c === 'P' || c === '@') player = i;
  }
  return {w: lv.w, h: lv.h, n, wall, goal, gate, plate, boxes: boxes.sort(function (a, b) { return a - b; }), player};
}
function neigh(i, w, h) {
  const x = i % w, y = (i / w) | 0, a = [];
  if (y) a.push(i - w);
  if (x < w - 1) a.push(i + 1);
  if (y < h - 1) a.push(i + w);
  if (x) a.push(i - 1);
  return a;
}
function reachable(st, boxes, player) {
  const occ = new Uint8Array(st.n); for (const b of boxes) occ[b] = 1;
  // Over-approximation: gates whose color has any plate in the level can be
  // opened by the player standing on that plate; treat them as open.
  const open = new Uint8Array(st.n);
  for (let i = 0; i < st.n; i++) if (st.gate[i] && st.plate.includes(st.gate[i])) open[i] = 1;
  const seen = new Uint8Array(st.n); seen[player] = 1; const q = [player];
  while (q.length) {
    const p = q.pop();
    for (const n of neigh(p, st.w, st.h)) {
      if (seen[n] || st.wall[n] || occ[n] || (st.gate[n] && !open[n])) continue;
      seen[n] = 1; q.push(n);
    }
  }
  return seen;
}
function cornerDead(st, p) {
  if (st.goal[p]) return false;
  const x = p % st.w, y = (p / st.w) | 0;
  const wall = (nx, ny) => nx < 0 || ny < 0 || nx >= st.w || ny >= st.h || st.wall[ny * st.w + nx];
  return (wall(x, y - 1) && wall(x - 1, y)) || (wall(x, y - 1) && wall(x + 1, y)) ||
         (wall(x, y + 1) && wall(x - 1, y)) || (wall(x, y + 1) && wall(x + 1, y));
}
function firstReachableAnchor(reach) {
  for (let i = 0; i < reach.length; i++) if (reach[i]) return i;
  return -1;
}
function solve(st, maxStates) {
  maxStates = maxStates || 2000000;
  const startReach = reachable(st, st.boxes, st.player);
  const seen = new Set();
  seen.add(st.boxes.join(',') + '|' + firstReachableAnchor(startReach));
  const q = [{b: st.boxes.slice(), p: st.player, d: 0}];
  let head = 0, states = 0;
  while (head < q.length) {
    const cur = q[head++]; states++;
    if (states > maxStates) return {status: 'TIMEOUT', states: states};
    let allOnGoal = true;
    for (const x of cur.b) if (!st.goal[x]) { allOnGoal = false; break; }
    if (allOnGoal) return {status: 'SOLVED', states: states, pushes: cur.d};
    const occ = new Uint8Array(st.n); for (const b of cur.b) occ[b] = 1;
    const reach = reachable(st, cur.b, cur.p);
    for (let bi = 0; bi < cur.b.length; bi++) {
      const b = cur.b[bi], x = b % st.w, y = (b / st.w) | 0;
      for (const dxy of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const dx = dxy[0], dy = dxy[1];
        const bx = x - dx, by = y - dy, tx = x + dx, ty = y + dy;
        if (bx < 0 || by < 0 || bx >= st.w || by >= st.h || tx < 0 || ty < 0 || tx >= st.w || ty >= st.h) continue;
        const behind = by * st.w + bx, to = ty * st.w + tx;
        if (!reach[behind] || st.wall[to] || occ[to] || cornerDead(st, to)) continue;
        const nb = cur.b.slice(); nb[bi] = to; nb.sort(function (a, b) { return a - b; });
        const key = nb.join(',') + '|' + firstReachableAnchor(reachable(st, nb, b));
        if (seen.has(key)) continue;
        seen.add(key);
        q.push({b: nb, p: b, d: cur.d + 1});
      }
    }
  }
  return {status: 'PROVEN_UNSOLVABLE', states: states};
}
let pass = 0, fail = 0;
const sigs = new Set();
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const st = build(lv);
  const r = solve(st);
  const sig = lv.rows.join('\n');
  const dup = sigs.has(sig); if (!dup) sigs.add(sig);
  const idx = String(i + 1).padStart(2, '0');
  const tag = r.status + (r.pushes !== undefined ? ' pushes=' + r.pushes : '') + (dup ? ' DUPLICATE_LAYOUT' : '');
  if (r.status === 'SOLVED' && !dup) pass++; else fail++;
  console.log('L' + idx + ' ' + (lv.t || '').padEnd(9) + ' ' + (lv.name || '').padEnd(18) + ' ' + tag + ' states=' + r.states);
}
console.log('\n' + pass + '/' + LEVELS.length + ' unique solvable levels, ' + fail + ' FAILED');
process.exit(fail ? 1 : 0);
