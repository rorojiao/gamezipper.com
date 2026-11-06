#!/usr/bin/env node
/**
 * R338 — DECISIVE: is sym-a-pix shipping the WRONG clue set?
 *
 * The shipped level record carries TWO clue sets:
 *   anchors : a MINIMIZED set (14 of 25 cells on L0; removed_count = 11)
 *   clues   : the FULL set (every cell has a clue)
 *
 * gen_levels_v3.py's docstring states the design intent explicitly:
 *   "removes clues ... If all cells become determined, we have a unique
 *    solution (under propagation)" — and its `propagate()` includes the
 *    SYMMETRY rule. The generator therefore built `anchors` so that
 *    propagation ALONE CANNOT finish but propagation + SYMMETRY CAN.
 *
 * The shipped GAME loads `lvl.clues` (the FULL set) — `anchors` is never
 * read. So the game ships a puzzle set in which the clue system alone
 * determines everything, and the point-symmetry rule — the game's ENTIRE
 * reason for existing as a separate title from fill-a-pix — can never fire.
 *
 * This script measures, for BOTH clue sets:
 *   A) clues-alone local propagation: how far does it get?
 *   B) clues+symmetry local propagation: how far does it get?
 *   C) does the shipped `clues` field agree with `anchors` where they overlap?
 *   D) would the ANCHOR set be UNIQUE under propagation+symmetry (i.e. is the
 *      intended design actually sound)?
 *
 * CALIBRATION:
 *   - stored solution must satisfy `clues` and be point-symmetric
 *   - anchors must be a SUBSET of clues (same values at the same cells)
 *   - a level where anchors-alone stalls but anchors+symmetry finishes is the
 *     PROOF that the shipped field choice destroys the mechanic
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function nbrIdx(n, r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) out.push(nr * n + nc);
    }
  }
  return out;
}

/** local propagation closure over a (possibly sparse) clue map */
function propagate(clueMap, n, useSym) {
  const N = n * n;
  const state = new Int8Array(N).fill(-1);
  const nbr = [];
  for (let i = 0; i < N; i++) nbr.push(nbrIdx(n, (i / n) | 0, i % n));
  const partner = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const r = (i / n) | 0, c = i % n;
    partner[i] = (n - 1 - r) * n + (n - 1 - c);
  }
  let contradiction = false;
  function set(i, v) {
    if (state[i] === v) return true;
    if (state[i] !== -1) { contradiction = true; return false; }
    state[i] = v;
    if (useSym) {
      const p = partner[i];
      if (state[p] === -1) state[p] = v;
      else if (state[p] !== v) { contradiction = true; return false; }
    }
    return true;
  }
  let changed = true;
  while (changed && !contradiction) {
    changed = false;
    for (let i = 0; i < N; i++) {
      const v = clueMap.get(i);
      if (v === undefined) continue;
      let s = 0; const unk = [];
      for (const j of nbr[i]) {
        if (state[j] === 1) s++;
        else if (state[j] === -1) unk.push(j);
      }
      if (s > v) { contradiction = true; break; }
      if (s + unk.length < v) { contradiction = true; break; }
      if (!unk.length) continue;
      if (s === v) {
        for (const j of unk) { if (!set(j, 0)) break; changed = true; }
      } else if (s + unk.length === v) {
        for (const j of unk) { if (!set(j, 1)) break; changed = true; }
      }
      if (contradiction) break;
    }
  }
  let decided = 0;
  for (let i = 0; i < N; i++) if (state[i] !== -1) decided++;
  return { state, decided, contradiction, N };
}

const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'sym-a-pix', 'levels.json'), 'utf8'));
const levels = S.levels;

console.log('sym-a-pix levels:', levels.length);
console.log('');
console.log('level            n  cells  anchors  removed   cluesAlone%  anchorsAlone%  anchors+sym%  fullClues+sym%');
console.log('-'.repeat(118));

let anchorsSubsetOk = true;
let storedOkAll = true;
let storedSymAll = true;
const rows = [];

for (const lvl of levels) {
  const n = lvl.n;
  const N = n * n;
  // full clue map from the shipped `clues`
  const fullMap = new Map();
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) fullMap.set(r * n + c, lvl.clues[r][c]);
  // anchor map from the shipped `anchors`
  const anchorMap = new Map();
  for (const a of lvl.anchors) anchorMap.set(a.r * n + a.c, a.v);

  // C: anchors must agree with clues where they overlap
  for (const [i, v] of anchorMap) {
    const r = (i / n) | 0, c = i % n;
    if (lvl.clues[r][c] !== v) anchorsSubsetOk = false;
  }
  // stored solution checks
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let cnt = 0;
    for (const j of nbrIdx(n, r, c)) cnt += lvl.solution[(j / n) | 0][j % n];
    if (cnt !== lvl.clues[r][c]) storedOkAll = false;
    if (lvl.solution[r][c] !== lvl.solution[n - 1 - r][n - 1 - c]) storedSymAll = false;
  }

  const fullAlone = propagate(fullMap, n, false);
  const fullSym = propagate(fullMap, n, true);
  const aAlone = propagate(anchorMap, n, false);
  const aSym = propagate(anchorMap, n, true);

  rows.push({
    name: lvl.name, n, N, anchors: anchorMap.size, removed: lvl.removed_count,
    fullAlonePct: Math.round(fullAlone.decided / N * 100),
    aAlonePct: Math.round(aAlone.decided / N * 100),
    aSymPct: Math.round(aSym.decided / N * 100),
    fullSymPct: Math.round(fullSym.decided / N * 100),
    aSymContra: aSym.contradiction, aAloneContra: aAlone.contradiction,
    fullSymContra: fullSym.contradiction, fullAloneContra: fullAlone.contradiction,
    aSymComplete: aSym.decided === N,
    aAloneComplete: aAlone.decided === N,
  });

  console.log(
    `${lvl.name.padEnd(14)} ${String(n).padStart(2)} ${String(N).padStart(6)} ${String(anchorMap.size).padStart(8)} ${String(lvl.removed_count).padStart(8)}` +
    ` ${String(rows[rows.length - 1].fullAlonePct).padStart(12)}% ${String(rows[rows.length - 1].aAlonePct).padStart(14)}%` +
    ` ${String(rows[rows.length - 1].aSymPct).padStart(14)}% ${String(rows[rows.length - 1].fullSymPct).padStart(15)}%`
  );
}

console.log('');
console.log('CALIBRATION');
console.log('  stored solution satisfies every `clues` value :', storedOkAll);
console.log('  stored solution is point-symmetric              :', storedSymAll);
console.log('  `anchors` agree with `clues` where they overlap:', anchorsSubsetOk);
const aSymContra = rows.filter(r => r.aSymContra).length;
const aAloneContra = rows.filter(r => r.aAloneContra).length;
console.log('  anchors+symmetry contradictions                 :', aSymContra, '/', rows.length,
  '(0 expected — the intended design must be sound)');
console.log('  anchors-alone contradictions                    :', aAloneContra, '/', rows.length);
console.log('');
console.log('RESULT');
const anchorsNeedSym = rows.filter(r => !r.aAloneComplete && r.aSymComplete).length;
const anchorsSolved = rows.filter(r => r.aSymComplete).length;
const fullSolved = rows.filter(r => r.fullAlone.decided === r.N).length;
console.log('  levels SOLVED by the SHIPPED full-clue set, clues alone :',
  rows.filter(r => r.fullAlonePct === 100).length + '/' + rows.length);
console.log('  levels SOLVED by the INTENDED anchor set, anchors alone  :',
  rows.filter(r => r.aAloneComplete).length + '/' + rows.length);
console.log('  levels SOLVED by the INTENDED anchor set, anchors+sym   :',
  anchorsSolved + '/' + rows.length);
console.log('  >> levels where SYMMETRY IS REQUIRED (anchors alone stalls, anchors+sym finishes):',
  anchorsNeedSym + '/' + rows.length);
if (anchorsNeedSym > 0) {
  console.log('     ' + rows.filter(r => !r.aAloneComplete && r.aSymComplete).slice(0, 8)
    .map(r => `${r.name}(${r.n}x${r.n}) anchorsAlone=${r.aAlonePct}% anchors+sym=${r.aSymPct}%`).join('\n     '));
}
console.log('');
console.log(anchorsNeedSym > 0
  ? '=> The INTENDED (anchors) clue set makes the symmetry rule LOAD-BEARING.'
  : '=> The anchors set does not demonstrate a load-bearing symmetry either.');
