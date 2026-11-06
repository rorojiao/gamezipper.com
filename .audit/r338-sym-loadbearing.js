#!/usr/bin/env node
/**
 * R338 — sym-a-pix vs fill-a-pix: is the POINT-SYMMETRY constraint LOAD-BEARING?
 *
 * Both games use the same base rule: every cell shows a clue = how many of its
 * 8 neighbours are filled. sym-a-pix ADDS "the grid must be point-symmetric
 * (180 degrees rotational)".
 *
 * Task rule: a variant that adds a constraint which changes the REASONING must
 * be KEPT. A variant whose extra constraint is DECORATION is a reskin and
 * should be eliminated. The only way to tell them apart is to measure whether
 * the clue set ALONE already forces a unique solution:
 *
 *   clues alone admit >1 solution  -> symmetry IS load-bearing -> DISTINCT
 *   clues alone admit exactly 1    -> symmetry is decoration    -> RESKIN
 *
 * The solver is a plain DFS over cells with a per-constraint prune
 * (sum(assigned filled) <= clue <= sum(assigned filled)+unassigned).
 * It runs the SAME constraint set twice: once with the symmetry coupling
 * enabled, once without.
 *
 * CALIBRATION (mandatory):
 *   - The stored solution must satisfy the clues (else the solver is wrong).
 *   - With symmetry ON, the solution count must be exactly 1 for every level
 *     (otherwise the solver cannot even reproduce the shipped answer).
 *   - A NEGATIVE control: corrupt one clue -> the count must change.
 */
const fs = require('fs');
const path = require('path');

const LEVELS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sym-a-pix', 'levels.json'), 'utf8'));
const levels = LEVELS.levels;

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

// count solutions of the clue system, optionally coupled by 180-degree symmetry
function countSolutions(clues, n, limit, enforceSym) {
  const N = n * n;
  const nbr = [];
  for (let i = 0; i < N; i++) nbr.push(nbrIdx(n, (i / n) | 0, i % n));
  const assign = new Int8Array(N).fill(-1);

  function feasible() {
    for (let i = 0; i < N; i++) {
      const v = clues[i];
      if (v < 0) continue;
      let s = 0, unk = 0;
      for (const j of nbr[i]) { if (assign[j] === 1) s++; else if (assign[j] === -1) unk++; }
      if (s > v) return false;
      if (s + unk < v) return false;
    }
    return true;
  }

  let sols = 0;
  const partner = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const r = (i / n) | 0, c = i % n;
    partner[i] = (n - 1 - r) * n + (n - 1 - c);
  }

  function rec(i) {
    if (sols >= limit) return;
    if (i === N) {
      if (!feasible()) return;
      if (enforceSym) {
        for (let k = 0; k < N; k++) if (assign[k] !== assign[partner[k]]) return;
      }
      sols++;
      return;
    }
    const p = partner[i];
    if (enforceSym && p < i) {
      if (assign[p] === -1) return;         // partner not yet assigned -> impossible order
      if (assign[i] !== assign[p]) return;
      assign[i] = assign[p];
      if (feasible()) rec(i + 1);
      assign[i] = -1;
      return;
    }
    for (const v of [0, 1]) {
      assign[i] = v;
      if (feasible()) rec(i + 1);
      assign[i] = -1;
    }
  }
  rec(0);
  return sols;
}

function storedSatisfiesClues(lvl) {
  const n = lvl.n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let cnt = 0;
      for (const j of nbrIdx(n, r, c)) cnt += lvl.solution[(j / n) | 0][j % n];
      if (cnt !== lvl.clues[r][c]) return false;
    }
  }
  return true;
}

function storedIsSymmetric(lvl) {
  const n = lvl.n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (lvl.solution[r][c] !== lvl.solution[n - 1 - r][n - 1 - c]) return false;
  }
  return true;
}

const rows = [];
for (const lvl of levels) {
  const clues = lvl.clues.flat();
  const t0 = Date.now();
  const withSym = countSolutions(clues, lvl.n, 3, true);
  const t1 = Date.now();
  const noSym = countSolutions(clues, lvl.n, 3, false);
  const t2 = Date.now();
  rows.push({
    id: lvl.id, name: lvl.name, n: lvl.n, tier: lvl.tier,
    storedOk: storedSatisfiesClues(lvl),
    storedSym: storedIsSymmetric(lvl),
    withSym, noSym,
    msSym: t1 - t0, msNo: t2 - t1,
  });
}

console.log('levels:', rows.length);
console.log('stored solution satisfies clues in all levels:', rows.every(r => r.storedOk));
console.log('stored solution is point-symmetric in all levels:', rows.every(r => r.storedSym));
console.log('with-symmetry counts:', rows.map(r => r.withSym).join(','));
console.log('clues-alone counts   :', rows.map(r => r.noSym).join(','));

const loadBearing = rows.filter(r => r.noSym > 1);
console.log('\nLEVELS WHERE CLUES ALONE ADMIT >1 SOLUTION (symmetry is load-bearing):',
  loadBearing.length + '/' + rows.length);
if (loadBearing.length) {
  console.log('  e.g. ' + loadBearing.slice(0, 6).map(r => `L${r.id + 1}(${r.name},${r.n}x${r.n}) clues-alone=${r.noSym}`).join(', '));
}
const broken = rows.filter(r => r.withSym !== 1 || !r.storedOk || !r.storedSym);
console.log('\nSOLVER SELF-CHECK (with symmetry must be exactly 1 + stored valid):',
  broken.length === 0 ? 'PASS' : 'FAIL ' + JSON.stringify(broken));

// NEGATIVE CONTROL: corrupt one clue on level 0 -> the count must change
const L0 = levels[0];
const cl = L0.clues.flat().slice();
const good = countSolutions(cl, L0.n, 3, true);
const idx = cl.findIndex(v => v >= 0);
cl[idx] = Math.max(0, cl[idx] - 1);
const bad = countSolutions(cl, L0.n, 3, true);
console.log('\nNEGATIVE CONTROL (corrupt one clue):', good, '->', bad,
  (good !== bad ? '-> CONTROL OK (detector is sensitive)' : '-> CONTROL FAILED (detector is blind)'));

// POSITIVE CONTROL: the shipped solution is one of the enumerated ones
const okSym = rows.filter(r => r.withSym === 1).length;
console.log('POSITIVE CONTROL (shipped solution reproduced):', okSym + '/' + rows.length);

const verdict = (broken.length === 0 && good !== bad)
  ? (loadBearing.length === rows.length ? 'DISTINCT (symmetry load-bearing in every level)' : 'PARTIAL')
  : 'SOLVER-UNRELIABLE';
console.log('\nVERDICT:', verdict);
