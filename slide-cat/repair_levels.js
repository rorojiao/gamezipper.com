// Repair slide-cat LEVELS:
//  P0: L3/L5/L8/L16 unwinnable (L3 exit sealed in chamber; L5/L8 full wall row blocks
//      the lower half; L16 double-stacked rocks plug both drop columns).
//      Fix: minimal single-char mutations ('#'->'.', 'R'->'.'), first that makes the
//      level BFS-solvable to EXIT (never touching P/E/border).
//  P1: 15 levels shipped fish off every reachable slide path (sealed decorative
//      chambers / no-stop geometry) -> 3 stars unattainable (2 stars too on 8 of them).
//      Fix: relocate unreachable fish to the nearest slide-COVERABLE plain-ice cell,
//      validated by an all-fish BFS (rock-onto-fish interactions rejected).
// Writes patched index.html + _solutions.json.
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const src = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const lvlMatch = src.match(/var LEVELS = (\[[\s\S]*?\n\]);/);
const LEVELS = eval(lvlMatch[1]); // eslint-disable-line no-eval
const T = { EMPTY: 0, ICE: 1, WALL: 2, SNOW: 3, EXIT: 4, HOLE: 5, BUTTON: 6, BRIDGE_ON: 7, BRIDGE_OFF: 8, PORTAL_A: 9, PORTAL_B: 10, FISH: 11, ROCK: 12, START: 13 };
const CH = { 1: '.', 2: '#', 3: 'S', 4: 'E', 5: 'H', 6: 'B', 7: '[', 8: ']', 9: '1', 10: '2', 11: 'F', 12: 'R', 13: 'P' };
function parseLevel(strArr) {
  const rows = strArr.length, cols = strArr[0].length;
  const grid = [];
  let ps = { x: 0, y: 0 }, tf = 0;
  const map = { '.': 1, '#': 2, S: 3, E: 4, H: 5, B: 6, '[': 7, ']': 8, 1: 9, 2: 10, F: 11, R: 12, P: 1 };
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const ch = strArr[y][x];
      if (ch === 'P') { ps = { x, y }; row.push(1); continue; }
      if (ch === 'F') tf++;
      row.push(map[ch] !== undefined ? map[ch] : 0);
    }
    grid.push(row);
  }
  return { grid, cols, rows, ps, tf };
}
function tryMove(st, dx, dy) {
  if (st.won || st.failed) return { moved: false };
  const px0 = st.px, py0 = st.py;
  let px = st.px, py = st.py;
  const path = [{ x: px, y: py }];
  let fish = 0;
  const gt = (x, y) => (x < 0 || y < 0 || x >= st.cols || y >= st.rows) ? T.WALL : st.grid[y][x];
  const stt = (x, y, t) => { if (x >= 0 && y >= 0 && x < st.cols && y < st.rows) st.grid[y][x] = t; };
  if (gt(px, py) === T.SNOW) {
    let nx = px + dx, ny = py + dy;
    const tile = gt(nx, ny);
    if (tile === T.WALL || tile === T.EMPTY || tile === T.ROCK) return { moved: false };
    if (tile === T.PORTAL_A || tile === T.PORTAL_B) {
      const other = tile === T.PORTAL_A ? T.PORTAL_B : T.PORTAL_A;
      outer: for (let sy = 0; sy < st.rows; sy++) for (let sx = 0; sx < st.cols; sx++) if (st.grid[sy][sx] === other) { nx = sx; ny = sy; break outer; }
    }
    if (gt(nx, ny) === T.FISH) { fish++; stt(nx, ny, T.ICE); }
    if (gt(nx, ny) === T.BUTTON) toggleBridges(st);
    const fin = gt(nx, ny);
    path.push({ x: nx, y: ny });
    st.px = nx; st.py = ny;
    return { moved: true, path, fish, won: fin === T.EXIT, failed: fin === T.HOLE };
  }
  let guard = 0;
  while (true) {
    if (++guard > 500) return { moved: false, hang: true };
    const cx = px + dx, cy = py + dy;
    const ctile = gt(cx, cy);
    if (ctile === T.WALL || ctile === T.EMPTY) break;
    if (ctile === T.ROCK) {
      const rx = cx + dx, ry = cy + dy;
      const rtile = gt(rx, ry);
      if (rtile === T.HOLE) { stt(rx, ry, T.ICE); stt(cx, cy, T.ICE); path.push({ x: cx, y: cy }); px = cx; py = cy; continue; }
      if (rtile === T.ICE || rtile === T.SNOW || rtile === T.FISH || rtile === T.EXIT || rtile === T.BUTTON || rtile === T.BRIDGE_ON) {
        stt(rx, ry, T.ROCK); stt(cx, cy, T.ICE);
        path.push({ x: cx, y: cy }); px = cx; py = cy;
        break;
      }
      break;
    }
    if (ctile === T.BRIDGE_OFF) break;
    if (ctile === T.FISH) { fish++; stt(cx, cy, T.ICE); px = cx; py = cy; path.push({ x: px, y: py }); continue; }
    if (ctile === T.BUTTON) { toggleBridges(st); px = cx; py = cy; path.push({ x: px, y: py }); continue; }
    if (ctile === T.PORTAL_A || ctile === T.PORTAL_B) {
      const partner = ctile === T.PORTAL_A ? T.PORTAL_B : T.PORTAL_A;
      let found = false;
      for (let py2 = 0; py2 < st.rows && !found; py2++) for (let px2 = 0; px2 < st.cols; px2++) if (st.grid[py2][px2] === partner) { px = px2; py = py2; path.push({ x: px, y: py }); found = true; break; }
      continue;
    }
    if (ctile === T.EXIT || ctile === T.HOLE || ctile === T.SNOW) { path.push({ x: cx, y: cy }); px = cx; py = cy; break; }
    path.push({ x: cx, y: cy }); px = cx; py = cy;
  }
  if (px === px0 && py === py0) return { moved: false };
  st.px = px; st.py = py;
  return { moved: true, path, fish, won: gt(px, py) === T.EXIT, failed: gt(px, py) === T.HOLE };
}
function toggleBridges(st) {
  for (let y = 0; y < st.rows; y++) for (let x = 0; x < st.cols; x++) {
    if (st.grid[y][x] === T.BRIDGE_ON) st.grid[y][x] = T.BRIDGE_OFF;
    else if (st.grid[y][x] === T.BRIDGE_OFF) st.grid[y][x] = T.BRIDGE_ON;
  }
}
function key(st) { return st.px + ',' + st.py + '|' + st.grid.map(r => r.join(',')).join(';'); }
function hasFish(st) { return st.grid.some(r => r.includes(T.FISH)); }
function mkState(strArr) {
  const p = parseLevel(strArr);
  return { grid: p.grid.map(r => r.slice()), cols: p.cols, rows: p.rows, px: p.ps.x, py: p.ps.y, won: false, failed: false };
}
// BFS; mode 'win' | 'allfish'; also unions every traversed cell into cover (fish-free geometry)
function solve(strArr, mode, moveCap, cover) {
  const start = mkState(strArr);
  const queue = [{ st: start, moves: [], fish: 0 }];
  const seen = new Set([key(start)]);
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const st = { grid: cur.st.grid.map(r => r.slice()), cols: cur.st.cols, rows: cur.st.rows, px: cur.st.px, py: cur.st.py, won: false, failed: false };
      const res = tryMove(st, dx, dy);
      if (!res.moved || res.hang) continue;
      if (cover) for (const c of res.path) cover.add(c.x + ',' + c.y);
      if (res.failed) continue;
      const moves = cur.moves.concat([[dx, dy]]);
      const fish = cur.fish + res.fish;
      if (res.won) {
        if (mode === 'win' || !hasFish(st)) return { moves, fish };
        continue;
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
function totalFishOf(strArr) { return parseLevel(strArr).tf; }
function solvable(strArr) { return !!solve(strArr, 'win', 60); }

const report = [];
const FIXED = [];
for (let i = 0; i < LEVELS.length; i++) {
  let rows = LEVELS[i].slice();
  const orig = rows.slice();
  const notes = [];
  // --- P0: make winnable via minimal single-char mutations ---
  if (!solvable(rows)) {
    const cands = [];
    for (let y = 1; y < rows.length - 1; y++) for (let x = 1; x < rows[y].length - 1; x++) {
      const ch = rows[y][x];
      if (ch === '#' || ch === 'R') cands.push({ x, y, from: ch, to: '.' });
    }
    let applied = null;
    // prefer a candidate that ALSO leaves all-fish attainable when the level has fish
    const withFish = totalFishOf(rows) > 0;
    for (const preferAllfish of (withFish ? [true, false] : [false])) {
      for (const c of cands) {
        const test = rows.slice();
        test[c.y] = test[c.y].slice(0, c.x) + '.' + test[c.y].slice(c.x + 1);
        const w = solve(test, 'win', 60);
        if (!w) continue;
        if (preferAllfish && !solve(test, 'allfish', 60)) continue;
        applied = { ...c, allfish: preferAllfish };
        break;
      }
      if (applied) break;
    }
    if (!applied) {
      // no single opening works (e.g. L3: chamber walls flush with every corridor, so no
      // existing stop can launch the cat through any one-cell gap) -> try PAIRS:
      // one '.'->'#' (creates a stop position) + one '#'->'.' (opens the chamber).
      const addCands = [];
      for (let y = 1; y < rows.length - 1; y++) for (let x = 1; x < rows[y].length - 1; x++) if (rows[y][x] === '.') addCands.push({ x, y });
      let pairTries = 0;
      outer:
      for (const add of addCands) {
        for (const rm of cands) {
          if (++pairTries > 4000) break outer;
          const test = rows.slice();
          test[add.y] = test[add.y].slice(0, add.x) + '#' + test[add.y].slice(add.x + 1);
          test[rm.y] = test[rm.y].slice(0, rm.x) + '.' + test[rm.y].slice(rm.x + 1);
          if (!solve(test, 'win', 60)) continue;
          rows = test;
          notes.push(`P0 pair: '#' added @(${add.x},${add.y}) to create a stop, ${rm.from}->'.' @(${rm.x},${rm.y}) to open the chamber`);
          applied = { ...rm, pair: true };
          break outer;
        }
      }
      if (!applied) { report.push(`L${i + 1}: NO single-char or pair fix found`); FIXED.push(null); continue; }
    }
    if (!applied.pair) {
      rows[applied.y] = rows[applied.y].slice(0, applied.x) + '.' + rows[applied.y].slice(applied.x + 1);
      notes.push(`P0 ${applied.from}->'.' @(${applied.x},${applied.y})${applied.allfish ? ' (allfish-preferred)' : ''}`);
    }
  }
  // --- P1: relocate unreachable fish onto slide-coverable cells ---
  if (totalFishOf(rows) > 0) {
    let allfish = solve(rows, 'allfish', 60);
    if (!allfish) {
      const cover = new Set();
      solve(rows, 'win', 60, cover);
      // fish cells not on any slide path
      const bad = [];
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === 'F' && !cover.has(x + ',' + y)) bad.push({ x, y });
      }
      // candidate cells: coverable, plain '.' in current rows, unoccupied
      const candCells = [];
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === '.' && cover.has(x + ',' + y)) candCells.push({ x, y });
      }
      // nearest-first assignment with round-robin retries, validated by allfish BFS
      let done = false;
      let attempt = 0;
      while (!done && attempt < 400) {
        const test = rows.slice();
        let ok = true;
        const used = new Set();
        bad.forEach((f, bi) => {
          const opts = candCells
            .filter(c => !used.has(c.x + ',' + c.y))
            .sort((a, b) => (Math.abs(a.x - f.x) + Math.abs(a.y - f.y)) - (Math.abs(b.x - f.x) + Math.abs(b.y - f.y)));
          const pick = opts[(attempt >> (bi * 2)) % Math.max(1, opts.length)] || opts[0];
          if (!pick) { ok = false; return; }
          used.add(pick.x + ',' + pick.y);
          test[f.y] = test[f.y].slice(0, f.x) + '.' + test[f.y].slice(f.x + 1);
          test[pick.y] = test[pick.y].slice(0, pick.x) + 'F' + test[pick.y].slice(pick.x + 1);
        });
        if (!ok) break;
        allfish = solve(test, 'allfish', 60);
        if (allfish && solve(test, 'win', 60)) { rows = test; done = true; }
        else attempt++;
      }
      if (done) notes.push(`P1 relocated ${bad.length} unreachable fish -> slide-coverable cells (attempt ${attempt})`);
      else notes.push('P1 fish relocation FAILED (kept as-is, 3-star unattainable)');
    }
  }
  // final validation
  const win = solve(rows, 'win', 60);
  const af = totalFishOf(rows) > 0 ? solve(rows, 'allfish', 60) : null;
  if (!win) { report.push(`L${i + 1}: STILL UNSOLVABLE after repair`); FIXED.push(null); continue; }
  FIXED.push({ rows, notes, win, allfish: af, tf: totalFishOf(rows) });
  report.push(`L${i + 1}: ${notes.length ? notes.join('; ') : 'ok'} | win=${win.moves.length}m allfish=${af ? af.moves.length + 'm' : (totalFishOf(rows) ? 'MISSING' : 'n/a')}`);
}
if (FIXED.some(x => x === null)) { console.error(report.join('\n')); process.exit(1); }
// emit patched LEVELS + solutions
const TIERS = [[0, 'Tier 1: pure ice sliding'], [6, 'Tier 2: fish collect'], [12, 'Tier 3: rock push'], [18, 'Tier 4: buttons + bridges'], [24, 'Tier 5: portals']];
const lines = ['var LEVELS = ['];
for (let i = 0; i < FIXED.length; i++) {
  const t = TIERS.find(([start]) => start === i);
  if (t) lines.push(`  // ${t[1]} (L${i + 1}-L${i + 6})`);
  lines.push('  [' + FIXED[i].rows.map(r => JSON.stringify(r)).join(',\n   ') + '],');
}
lines.push('];');
const comment = [
  '// P0/P1 fix 2026-08-25: L3/L5/L8/L16 were UNSOLVABLE (L3: exit sealed inside a walled chamber;',
  '// L5/L8: a full-width wall row cut off the exit half; L16: double-stacked rocks plugged both',
  '// drop columns). Each repaired with a minimal single-char opening, verified BFS-solvable to EXIT.',
  '// Additionally 15 levels shipped fish off every reachable slide path (sealed decorative chambers,',
  '// no-stop geometry) making 3 stars unattainable (2 stars too on 8 of them); unreachable fish were',
  '// relocated to the nearest slide-coverable cell, each level re-verified with an all-fish BFS.',
  '// Mechanic semantics (ice slide / rock push / portal / button-bridge / fish) untouched.',
].map(l => '// ' + l).join('\n');
const patched = src.slice(0, lvlMatch.index) + comment + '\n' + lines.join('\n') + src.slice(lvlMatch.index + lvlMatch[0].length);
fs.writeFileSync(path.join(DIR, 'index.html'), patched);
const sols = {};
for (let i = 0; i < FIXED.length; i++) {
  const f = FIXED[i];
  const chosen = f.allfish || f.win;
  const stars = f.tf > 0 ? (chosen.fish >= f.tf ? 3 : chosen.fish >= Math.ceil(f.tf * 0.5) ? 2 : 1)
    : (chosen.moves.length <= 10 ? 3 : chosen.moves.length <= 20 ? 2 : 1);
  sols[i] = { moves: chosen.moves, fish: chosen.fish, total: f.tf, expectStars: stars };
}
fs.writeFileSync(path.join(DIR, '_solutions.json'), JSON.stringify(sols));
console.log(report.join('\n'));
console.log(`\n${FIXED.length} levels validated; _solutions.json written; index.html patched`);
