#!/usr/bin/env node
/* R337 queens — uniqueness REPAIR, validated.
 *
 * WHY A REPAIR IS POSSIBLE (proved, not assumed):
 *   A valid solution places n crowns in n DISTINCT regions, and there are
 *   exactly n regions -> a valid solution uses EVERY region exactly once.
 *   Take a rival solution R2 and a cell c where R2 differs from the intended
 *   solution S (so c is NOT a crown of S). Move c into a different region.
 *   Then R2's crowns occupy n-1 regions (R_old is now empty) -> by pigeonhole
 *   two of R2's crowns share a region -> R2 violates "one crown per region"
 *   -> R2 is dead. And S is untouched (c is not S's crown), so S survives.
 *
 *   The target region may be ANY region != R_old (proved above: all n
 *   regions are in use by R2, so any other region is one of R2's).
 *   We prefer a region ADJACENT to c so that region stays connected.
 *
 *   Removing c may disconnect R_old. The orphaned piece is moved along with
 *   c, but ONLY if it contains no crown of S (moving an S crown would break
 *   the intended solution).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'queens', 'index.html'), 'utf8');

function grabFunction(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return null;
  const open = src.indexOf('{', m.index);
  let i = open + 1, depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '{') depth++; else if (c === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
}
const names = ['makeRNG', 'tryPlaceQueens', 'tryMakeRegions', 'countSolutions',
  'getNeighbors', 'generatePuzzle', 'fallbackSolution', 'fallbackRegions',
  'isRegionConnected', 'findNearestRegion'];
let src = '';
for (const n of names) src += grabFunction(html, n) + '\n';
const ctx = { Math, console: { log: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__gen=generatePuzzle; this.__cs=countSolutions;', ctx);

/* ---- independent enumerator ---- */
function enumerate(n, regions, limit) {
  const out = [];
  const colUsed = new Array(n).fill(false);
  const regUsed = new Map();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (out.length >= limit) return;
    if (row === n) { out.push(placed.slice()); return; }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed.get(reg)) continue;
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.set(reg, true);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return out;
}
function validate(n, regions, cols) {
  const rows = new Set(), colsS = new Set(), regs = new Set();
  for (let r = 0; r < n; r++) {
    const c = cols[r];
    if (c < 0 || c >= n) return 'col oob';
    if (rows.has(r)) return 'row dup'; rows.add(r);
    if (colsS.has(c)) return 'col dup'; colsS.add(c);
    const reg = regions[r][c];
    if (regs.has(reg)) return 'region dup'; regs.add(reg);
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.abs(i - j) <= 1 && Math.abs(cols[i] - cols[j]) <= 1) return 'adjacent';
  }
  return null;
}
function regionCells(n, regions, rid) {
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === rid) cells.push([r, c]);
  return cells;
}
function component(n, regions, rid, start) {
  const seen = new Set([start[0] + ',' + start[1]]);
  const stack = [start]; const out = [];
  while (stack.length) {
    const [r, c] = stack.pop();
    out.push([r, c]);
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (regions[nr][nc] !== rid) continue;
      const k = nr + ',' + nc;
      if (seen.has(k)) continue;
      seen.add(k); stack.push([nr, nc]);
    }
  }
  return out;
}
function allRegionsConnected(n, regions) {
  for (let R = 0; R < n; R++) {
    const cells = regionCells(n, regions, R);
    if (!cells.length) return false;
    if (component(n, regions, R, cells[0]).length !== cells.length) return false;
  }
  return true;
}

function repair(n, regions, sol) {
  const grid = regions.map(r => r.slice());
  const solCells = new Set(sol.map((c, r) => r + ',' + c));
  for (let iter = 0; iter < 600; iter++) {
    const sols = enumerate(n, grid, 2);
    if (sols.length === 1) return { grid, ok: true, iters: iter };
    if (sols.length === 0) return { grid, ok: false, why: 'no solution after repair' };
    const rival = sols[1];
    const diffs = [];
    for (let r = 0; r < n; r++) if (rival[r] !== sol[r]) diffs.push([r, rival[r]]);
    let moved = false;
    for (const [cr, cc] of diffs) {
      const R_old = grid[cr][cc];
      const oldCells = regionCells(n, grid, R_old);
      // anchor: any S crown inside R_old, else an arbitrary cell
      const anchor = oldCells.find(x => solCells.has(x[0] + ',' + x[1])) || oldCells[0];
      const comp = component(n, grid, R_old, anchor);
      const inComp = new Set(comp.map(c => c[0] + ',' + c[1]));
      const orphan = oldCells.filter(c => !inComp.has(c[0] + ',' + c[1]));
      // the orphan must not contain an S crown
      if (orphan.some(c => solCells.has(c[0] + ',' + c[1]))) continue;
      // candidate targets: any region != R_old; prefer adjacent
      const adjacentTargets = [];
      const otherTargets = [];
      for (let R = 0; R < n; R++) {
        if (R === R_old) continue;
        const cells = regionCells(n, grid, R);
        const adj = cells.some(t => Math.abs(t[0] - cr) + Math.abs(t[1] - cc) === 1);
        if (adj) adjacentTargets.push(R); else otherTargets.push(R);
      }
      const targets = adjacentTargets.length ? adjacentTargets : otherTargets;
      if (!targets.length) continue;
      for (const R_new of targets) {
        grid[cr][cc] = R_new;
        for (const [or_, oc] of orphan) grid[or_][oc] = R_new;
        if (validate(n, grid, sol) === null) { moved = true; break; }
        grid[cr][cc] = R_old;
        for (const [or_, oc] of orphan) grid[or_][oc] = R_old;
      }
      if (moved) break;
    }
    if (!moved) return { grid, ok: false, why: 'no admissible repair move' };
  }
  return { grid, ok: false, why: 'iteration cap' };
}

console.log('R337 queens — uniqueness repair validation');
let ok = 0, fail = 0, disconn = 0, tot = 0;
const t0 = Date.now();
for (const n of [7, 8, 9, 10, 11]) {
  for (let seed = 1; seed <= 6; seed++) {
    tot++;
    const p = ctx.__gen(n, seed);
    const rep = repair(n, p.regions, p.solution);
    if (!rep.ok) { fail++; console.log('  FAIL n=' + n + ' seed=' + seed + ' ' + rep.why); continue; }
    const err = validate(n, rep.grid, p.solution);
    const ours = enumerate(n, rep.grid, 2).length;
    const page = ctx.__cs(n, rep.grid, 2);
    const conn = allRegionsConnected(n, rep.grid);
    if (!conn) disconn++;
    if (err === null && ours === 1 && page === 1) ok++;
    else { fail++; console.log('  POST FAIL n=' + n + ' seed=' + seed + ' err=' + err + ' ours=' + ours + ' page=' + page + ' conn=' + conn); }
  }
}
console.log('repair: ' + ok + ' ok / ' + fail + ' failed, ' + disconn + ' with a disconnected region, in ' +
  ((Date.now() - t0) / 1000).toFixed(1) + 's');
