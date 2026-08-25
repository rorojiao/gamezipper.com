// Offline solvability solver for slide-cat: faithful port of tryMove()'s state machine
// (ice slide / snow step / rock push incl. hole-fill / portal teleport-continue /
// button toggle-continue / fish collect-continue / exit / hole fall), then BFS over
// (grid mutables + player) to find:
//   - a win path to EXIT (1-star), and
//   - an all-fish win path (3-star) when one exists (preferred for replay).
// Emits _solutions.json {idx:{moves:[[dx,dy]...], fish:n, total:n, expectStars:n}}
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = src.match(/var LEVELS = (\[[\s\S]*?\n\]);/);
if (!m) { console.error('LEVELS not found'); process.exit(1); }
const LEVELS = eval(m[1]); // eslint-disable-line no-eval
const T = { EMPTY: 0, ICE: 1, WALL: 2, SNOW: 3, EXIT: 4, HOLE: 5, BUTTON: 6, BRIDGE_ON: 7, BRIDGE_OFF: 8, PORTAL_A: 9, PORTAL_B: 10, FISH: 11, ROCK: 12, START: 13 };

function parseLevel(strArr) {
  const rows = strArr.length, cols = strArr[0].length;
  const grid = [];
  let playerStart = { x: 0, y: 0 }, totalFish = 0;
  const map = { '.': T.ICE, '#': T.WALL, S: T.SNOW, E: T.EXIT, H: T.HOLE, B: T.BUTTON, '[': T.BRIDGE_ON, ']': T.BRIDGE_OFF, 1: T.PORTAL_A, 2: T.PORTAL_B, F: T.FISH, R: T.ROCK, P: T.ICE };
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const ch = strArr[y][x];
      if (ch === 'P') { playerStart = { x, y }; row.push(T.ICE); continue; }
      if (ch === 'F') totalFish++;
      row.push(map[ch] !== undefined ? map[ch] : T.EMPTY);
    }
    grid.push(row);
  }
  return { grid, cols, rows, playerStart, totalFish };
}
// faithful tryMove: returns {moved, path, won, failed, fish} and mutates grid/player
function tryMove(st, dx, dy) {
  if (st.won || st.failed) return { moved: false };
  const px0 = st.px, py0 = st.py;
  let px = st.px, py = st.py;
  const path = [{ x: px, y: py }];
  let fish = 0;
  const getTile = (x, y) => (x < 0 || y < 0 || x >= st.cols || y >= st.rows) ? T.WALL : st.grid[y][x];
  const setTile = (x, y, t) => { if (x >= 0 && y >= 0 && x < st.cols && y < st.rows) st.grid[y][x] = t; };
  const onSnow = getTile(px, py) === T.SNOW;
  if (onSnow) {
    let nx = px + dx, ny = py + dy;
    const tile = getTile(nx, ny);
    if (tile === T.WALL || tile === T.EMPTY || tile === T.ROCK) return { moved: false };
    if (tile === T.PORTAL_A || tile === T.PORTAL_B) {
      const other = tile === T.PORTAL_A ? T.PORTAL_B : T.PORTAL_A;
      outer: for (let sy = 0; sy < st.rows; sy++) for (let sx = 0; sx < st.cols; sx++) if (st.grid[sy][sx] === other) { nx = sx; ny = sy; break outer; }
    }
    if (getTile(nx, ny) === T.FISH) { fish++; setTile(nx, ny, T.ICE); }
    if (getTile(nx, ny) === T.BUTTON) { toggleBridges(st); }
    const fin = getTile(nx, ny);
    path.push({ x: nx, y: ny });
    st.px = nx; st.py = ny;
    return { moved: true, path, fish, won: fin === T.EXIT, failed: fin === T.HOLE };
  }
  let guard = 0;
  while (true) {
    if (++guard > 500) return { moved: false, hang: true }; // portal loop guard
    const cx = px + dx, cy = py + dy;
    const ctile = getTile(cx, cy);
    if (ctile === T.WALL || ctile === T.EMPTY) break;
    if (ctile === T.ROCK) {
      const rx = cx + dx, ry = cy + dy;
      const rtile = getTile(rx, ry);
      if (rtile === T.HOLE) { setTile(rx, ry, T.ICE); setTile(cx, cy, T.ICE); path.push({ x: cx, y: cy }); px = cx; py = cy; continue; }
      if (rtile === T.ICE || rtile === T.SNOW || rtile === T.FISH || rtile === T.EXIT || rtile === T.BUTTON || rtile === T.BRIDGE_ON) {
        setTile(rx, ry, T.ROCK); setTile(cx, cy, T.ICE);
        path.push({ x: cx, y: cy }); px = cx; py = cy;
        break; // cat stops behind pushed rock
      }
      break; // can't push (rock into rock/wall/off/bridge_off/portal/hole-target-miss)
    }
    if (ctile === T.BRIDGE_OFF) break;
    if (ctile === T.FISH) { fish++; setTile(cx, cy, T.ICE); px = cx; py = cy; path.push({ x: px, y: py }); continue; }
    if (ctile === T.BUTTON) { toggleBridges(st); px = cx; py = cy; path.push({ x: px, y: py }); continue; }
    if (ctile === T.PORTAL_A || ctile === T.PORTAL_B) {
      const partner = ctile === T.PORTAL_A ? T.PORTAL_B : T.PORTAL_A;
      let found = false;
      for (let py2 = 0; py2 < st.rows && !found; py2++) for (let px2 = 0; px2 < st.cols; px2++) if (st.grid[py2][px2] === partner) { px = px2; py = py2; path.push({ x: px, y: py }); found = true; break; }
      continue;
    }
    if (ctile === T.EXIT) { path.push({ x: cx, y: cy }); px = cx; py = cy; break; }
    if (ctile === T.HOLE) { path.push({ x: cx, y: cy }); px = cx; py = cy; break; }
    if (ctile === T.SNOW) { path.push({ x: cx, y: cy }); px = cx; py = cy; break; }
    path.push({ x: cx, y: cy }); px = cx; py = cy;
  }
  const finTile = getTile(px, py);
  if (px === px0 && py === py0) return { moved: false };
  st.px = px; st.py = py;
  return { moved: true, path, fish, won: finTile === T.EXIT, failed: finTile === T.HOLE };
}
function toggleBridges(st) {
  for (let y = 0; y < st.rows; y++) for (let x = 0; x < st.cols; x++) {
    if (st.grid[y][x] === T.BRIDGE_ON) st.grid[y][x] = T.BRIDGE_OFF;
    else if (st.grid[y][x] === T.BRIDGE_OFF) st.grid[y][x] = T.BRIDGE_ON;
  }
}
function key(st) { return st.px + ',' + st.py + '|' + st.grid.map(r => r.join(',')).join(';'); }
function hasFish(st) { for (const r of st.grid) if (r.includes(T.FISH)) return true; return false; }
function mkState(idx) {
  const p = parseLevel(LEVELS[idx]);
  return { grid: p.grid.map(r => r.slice()), cols: p.cols, rows: p.rows, px: p.playerStart.x, py: p.playerStart.y, won: false, failed: false };
}
// BFS: mode 'win' (reach exit) or 'allfish' (reach exit with zero fish left)
function solve(idx, mode, moveCap) {
  const start = mkState(idx);
  const queue = [{ st: start, moves: [], fish: 0 }];
  const seen = new Set([key(start)]);
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const st = { grid: cur.st.grid.map(r => r.slice()), cols: cur.st.cols, rows: cur.st.rows, px: cur.st.px, py: cur.st.py, won: false, failed: false };
      const res = tryMove(st, dx, dy);
      if (!res.moved || res.hang) continue;
      if (res.failed) continue; // fell in hole: dead state
      const moves = cur.moves.concat([[dx, dy]]);
      const fish = cur.fish + res.fish;
      if (res.won) {
        if (mode === 'win' || (mode === 'allfish' && !hasFish(st))) return { moves, fish };
        continue; // won but fish remain: not an allfish goal
      }
      if (moves.length >= moveCap) continue;
      const k = key(st);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ st, moves, fish });
    }
  }
  return null;
}
const out = {};
const report = [];
let bad = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const p = parseLevel(LEVELS[i]);
  const t0 = Date.now();
  const allfish = p.totalFish > 0 ? solve(i, 'allfish', 60) : null;
  const win = solve(i, 'win', 60);
  if (!win) { report.push(`L${i + 1}: UNSOLVABLE (no exit path within 60 moves) [${Date.now() - t0}ms]`); bad++; continue; }
  const chosen = allfish || win;
  const stars = p.totalFish > 0 ? (chosen.fish >= p.totalFish ? 3 : chosen.fish >= Math.ceil(p.totalFish * 0.5) ? 2 : 1)
    : (chosen.moves.length <= 10 ? 3 : chosen.moves.length <= 20 ? 2 : 1);
  out[i] = { moves: chosen.moves, fish: chosen.fish, total: p.totalFish, expectStars: stars, usedAllFishPath: !!allfish };
  report.push(`L${i + 1}: win=${win.moves.length}moves allfish=${allfish ? allfish.moves.length + 'moves/' + allfish.fish + 'fish' : (p.totalFish ? 'NOT-FOUND' : 'n/a')} fish=${chosen.fish}/${p.totalFish} stars=${stars} [${Date.now() - t0}ms]`);
}
console.log(report.join('\n'));
if (bad) { console.error(bad + ' unsolvable levels'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, '_solutions.json'), JSON.stringify(out));
console.log(`\n${LEVELS.length} levels solved; _solutions.json written`);
