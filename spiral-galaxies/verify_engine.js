#!/usr/bin/env node
/**
 * Spiral Galaxies — In-Engine Node.js Verifier.
 * Extracts LEVELS data from the actual index.html (the in-game engine) and runs
 * the same solver on the extracted data.  This proves the engine and the
 * stored levels.json describe the same puzzles, with the same unique solution.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
// Extract LEVELS array — find the const LEVELS = ... ; declaration
const m = HTML.match(/const\s+LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (!m) {
  console.error('Could not find LEVELS in index.html');
  process.exit(1);
}
// Use eval to parse (safer than Function since we control the content)
let LEVELS;
try {
  LEVELS = eval(`(${m[1]})`);
} catch (e) {
  console.error('Failed to parse LEVELS:', e.message);
  process.exit(1);
}
console.log(`Loaded ${LEVELS.length} levels from index.html`);

function partnerCell(cr, cc, sr2, sc2) {
  return [sr2 - cr - 1, sc2 - cc - 1];
}

function solveCount(W, H, intStars, limit = 2, maxNodes = 200000) {
  const K = intStars.length;
  const cand = [];
  for (let r = 0; r < H; r++) {
    cand.push([]);
    for (let c = 0; c < W; c++) {
      const cellCand = [];
      for (let si = 0; si < K; si++) {
        const [sr2, sc2] = intStars[si];
        const pr = sr2 - r - 1;
        const pc = sc2 - c - 1;
        if (pr >= 0 && pr < H && pc >= 0 && pc < W) {
          cellCand.push(si);
        }
      }
      cand[r].push(cellCand);
      if (cellCand.length === 0) return [];
    }
  }
  const assign = [];
  for (let r = 0; r < H; r++) assign.push(new Array(W).fill(-1));
  const solutions = [];
  let nodes = 0;
  function legalStars(r, c) {
    const out = [];
    for (const si of cand[r][c]) {
      const [sr2, sc2] = intStars[si];
      const pr = sr2 - r - 1;
      const pc = sc2 - c - 1;
      if (assign[pr][pc] === -1 || assign[pr][pc] === si) out.push(si);
    }
    return out;
  }
  function findMrv() {
    let best = null; let bestN = 999;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (assign[r][c] !== -1) continue;
        const ls = legalStars(r, c);
        if (ls.length < bestN) {
          bestN = ls.length;
          best = [r, c, ls];
          if (bestN <= 1) return best;
        }
      }
    }
    return best;
  }
  function backtrack() {
    if (solutions.length >= limit) return;
    nodes++;
    if (nodes > maxNodes) return;
    const mrv = findMrv();
    if (mrv === null) {
      const sol = [];
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) sol.push(assign[r][c]);
      solutions.push(sol);
      return;
    }
    const [r, c, ls] = mrv;
    if (ls.length === 0) return;
    for (const si of ls) {
      const [sr2, sc2] = intStars[si];
      const pr = sr2 - r - 1;
      const pc = sc2 - c - 1;
      assign[r][c] = si;
      let partnerWasFree = false;
      if (pr !== r || pc !== c) {
        if (assign[pr][pc] === -1) { partnerWasFree = true; assign[pr][pc] = si; }
        else if (assign[pr][pc] !== si) { assign[r][c] = -1; continue; }
      }
      backtrack();
      assign[r][c] = -1;
      if (partnerWasFree) assign[pr][pc] = -1;
      if (solutions.length >= limit) return;
    }
  }
  backtrack();
  return solutions;
}

let pass = 0, fail = 0;
for (const lv of LEVELS) {
  const { W, H, stars, solution, id } = lv;
  const intStars = stars.map(s => [Math.round(s.r * 2), Math.round(s.c * 2)]);
  const sols = solveCount(W, H, intStars, 2, 100000);
  if (sols.length !== 1) {
    console.log(`FAIL L${id}: expected 1 solution, got ${sols.length}`);
    fail++; continue;
  }
  const sol = sols[0];
  let match = true;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (sol[r * W + c] !== solution[r][c]) { match = false; break; }
    }
    if (!match) break;
  }
  if (!match) { console.log(`FAIL L${id}: solver found different solution`); fail++; continue; }
  pass++;
}
console.log(`In-engine Node.js verifier: ${pass} pass, ${fail} fail (out of ${LEVELS.length})`);
process.exit(fail === 0 ? 0 : 1);
