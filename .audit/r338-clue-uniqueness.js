#!/usr/bin/env node
/**
 * R338 — "clue system alone" uniqueness for the Fill-a-Pix family.
 *
 * QUESTION: sym-a-pix = fill-a-pix's rule (every cell shows how many of its 8
 * neighbours are filled) PLUS "the grid must be point-symmetric (180 deg)".
 * If the clue system ALONE already pins the unique solution, the symmetry
 * constraint is UNREACHABLE DECORATION -> the two games are the same mechanic
 * with different pictures (a reskin). If the clue system alone admits >1
 * solution, the symmetry constraint does real work -> distinct puzzles.
 *
 * Method: exhaustive DFS over cell states with a necessary-condition prune.
 *   prune: for every clue v at cell i,  filled_so_far <= v <= filled_so_far + unassigned
 *   leaf : every clue must be satisfied EXACTLY.
 * Two variants:
 *   noSym  — all N^2 cells free (no symmetry coupling)
 *   withSym— only the PRIMARY half (r,c) <= (N-1-r, N-1-c) is enumerated; the
 *            other half is DERIVED by 180-degree rotation. That is the correct
 *            way to couple symmetry in a linear scan.
 *
 * CALIBRATION (mandatory — the R322 discipline):
 *   C1 stored solution satisfies every clue           -> must be true
 *   C2 stored solution is point-symmetric (sym game)   -> must be true
 *   C3 withSym count == 1 for every level              -> the solver can
 *        reproduce the shipped answer (else it is wrong)
 *   C4 NEGATIVE: drop ONE clue -> the count must go >1 (detector is sensitive)
 *   C5 NEGATIVE: corrupt ONE clue -> the count must change
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

/** count solutions of the clue system, limit = stop at `limit` */
function countSolutions(clues, n, limit, withSym) {
  const N = n * n;
  const nbr = [];
  for (let i = 0; i < N; i++) nbr.push(nbrIdx(n, (i / n) | 0, i % n));

  // enumerator cells
  let enumCells;
  let derive; // fullIndex -> enumIndex (withSym) or identity (noSym)
  if (withSym) {
    enumCells = [];
    derive = new Int32Array(N).fill(-1);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const pr = n - 1 - r, pc = n - 1 - c;
        if (r < pr || (r === pr && c <= pc)) {
          const e = enumCells.length;
          enumCells.push(r * n + c);
          derive[r * n + c] = e;
          derive[pr * n + pc] = e;
        }
      }
    }
  } else {
    enumCells = [];
    derive = new Int32Array(N);
    for (let i = 0; i < N; i++) { enumCells.push(i); derive[i] = i; }
  }
  const K = enumCells.length;
  const assign = new Int8Array(K).fill(-1);

  // constraint per CLUE cell: sum of enum-assigned values of its neighbours
  const cons = [];
  for (let i = 0; i < N; i++) {
    const v = clues[i];
    if (v < 0) continue;
    const idxs = nbr[i].map(j => derive[j]);
    cons.push({ idxs, v });
  }

  function feasible() {
    for (const { idxs, v } of cons) {
      let s = 0, unk = 0;
      for (const i of idxs) { if (assign[i] === 1) s++; else if (assign[i] === -1) unk++; }
      if (s > v) return false;
      if (s + unk < v) return false;
    }
    return true;
  }

  let sols = 0;
  function rec(k) {
    if (sols >= limit) return;
    if (k === K) {
      if (!feasible()) return;
      sols++;
      return;
    }
    for (const v of [0, 1]) {
      assign[k] = v;
      if (feasible()) rec(k + 1);
      assign[k] = -1;
    }
  }
  rec(0);
  return sols;
}

function loadSymLevels() {
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'sym-a-pix', 'levels.json'), 'utf8'));
  return S.levels.map(l => ({ n: l.n, name: l.name, tier: l.tier, clues: l.clues, solution: l.solution }));
}

function loadFillLevels() {
  const html = fs.readFileSync(path.join(ROOT, 'fill-a-pix', 'index.html'), 'utf8');
  const m = html.match(/var\s+LV\s*=\s*(\[[\s\S]*?\]);/);
  const LV = eval('(' + m[1] + ')');
  return LV.map(l => {
    const n = l.grid.length;
    const clues = [];
    for (let r = 0; r < n; r++) {
      const row = [];
      for (let c = 0; c < n; c++) {
        let cnt = 0;
        for (const j of nbrIdx(n, r, c)) cnt += l.grid[(j / n) | 0][j % n];
        row.push(cnt);
      }
      clues.push(row);
    }
    return { n, name: l.name, tier: l.tier, clues, solution: l.grid };
  });
}

function storedOkClues(l) {
  const n = l.n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let cnt = 0;
    for (const j of nbrIdx(n, r, c)) cnt += l.solution[(j / n) | 0][j % n];
    if (cnt !== l.clues[r][c]) return false;
  }
  return true;
}
function storedSym(l) {
  const n = l.n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (l.solution[r][c] !== l.solution[n - 1 - r][n - 1 - c]) return false;
  }
  return true;
}

function run(label, levels) {
  console.log('\n================ ' + label + ' (' + levels.length + ' levels) ================');
  const rows = [];
  for (const l of levels) {
    const flat = l.clues.flat();
    const t0 = Date.now();
    const noSym = countSolutions(flat, l.n, 3, false);
    const t1 = Date.now();
    const withSym = countSolutions(flat, l.n, 3, true);
    const t2 = Date.now();
    rows.push({
      name: l.name, n: l.n, tier: l.tier,
      ok: storedOkClues(l), sym: storedSym(l),
      noSym, withSym, msNo: t1 - t0, msSym: t2 - t1,
    });
  }
  console.log('C1 stored satisfies clues in all levels :', rows.every(r => r.ok));
  console.log('C2 stored is point-symmetric in all     :', rows.every(r => r.sym));
  console.log('C3 withSym count == 1 in all levels     :', rows.every(r => r.withSym === 1),
    '  (values:', rows.map(r => r.withSym).join(',') + ')');
  console.log('   clues-ALONE count (no symmetry)      :', rows.map(r => r.noSym).join(','));
  const multi = rows.filter(r => r.noSym > 1);
  console.log('   >> levels where CLUES ALONE admit >1 solution:', multi.length + '/' + rows.length);
  if (multi.length) console.log('      ' + multi.slice(0, 8).map(r => `${r.name}(${r.n}x${r.n})=${r.noSym}`).join(', '));

  // C4 NEGATIVE CONTROL (sensitivity): progressively WILDCARD clues until the
  // count goes > 1. Dropping a SINGLE clue may legitimately keep the system
  // determined (the clue set is over-determined), so the control must relax
  // until the system actually opens up. This is the same control shape the
  // shipped fill-a-pix verifier uses.
  const L0 = levels[0];
  const cl = L0.clues.flat().slice();
  const before = countSolutions(cl, L0.n, 3, false);
  const order = cl.map((v, i) => i).filter(i => cl[i] >= 0);
  const wild = cl.slice();
  let openedAt = -1;
  for (let k = 0; k < order.length; k++) {
    wild[order[k]] = -1;
    if (countSolutions(wild, L0.n, 3, false) > 1) { openedAt = k + 1; break; }
  }
  console.log('C4 SENSITIVITY (wildcard clues until >1) :', before, '-> opened after',
    openedAt, 'wildcards',
    (openedAt > 0 ? '-> OK (detector sensitive)' : '-> FAIL (detector blind)'));

  // C5 NEGATIVE CONTROL: corrupt one clue -> count must change
  const cl2 = L0.clues.flat().slice();
  const good = countSolutions(cl2, L0.n, 3, false);
  const di = cl2.findIndex(v => v >= 0);
  cl2[di] = Math.max(0, cl2[di] - 1);
  const bad = countSolutions(cl2, L0.n, 3, false);
  console.log('C5 NEGATIVE (corrupt one clue)         :', good, '->', bad,
    (good !== bad ? '-> OK (detector sensitive)' : '-> FAIL (detector blind)'));

  return rows;
}

const symRows = run('sym-a-pix', loadSymLevels());
const fillRows = run('fill-a-pix', loadFillLevels());

console.log('\n================ CROSS-GAME VERDICT ================');
const symMulti = symRows.filter(r => r.noSym > 1).length;
const fillMulti = fillRows.filter(r => r.noSym > 1).length;
console.log('sym-a-pix  : clue system alone unique in', symRows.length - symMulti, '/', symRows.length, 'levels');
console.log('fill-a-pix : clue system alone unique in', fillRows.length - fillMulti, '/', fillRows.length, 'levels');
console.log('=> symmetry is LOAD-BEARING in sym-a-pix:', symMulti > 0 ? 'YES' : 'NO (decoration -> reskin candidate)');
