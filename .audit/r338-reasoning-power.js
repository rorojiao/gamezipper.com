#!/usr/bin/env node
/**
 * R338 — DECISIVE reasoning test for sym-a-pix vs fill-a-pix.
 *
 * The previous measurement proved the clue system alone has a unique solution
 * in both games, so sym-a-pix's "point-symmetric" clause is not needed for
 * UNIQUENESS. That is NOT the same as "it changes no reasoning".
 *
 * A human solver does not run a CSP solver — they apply LOCAL PROPagation:
 *   clue 0  -> all 8 neighbours are empty
 *   clue 9  -> all 8 neighbours are filled
 *   clue k  -> if k of the neighbours are decided, the rest are forced
 * The question that decides the dedup verdict is:
 *
 *   Does the local-propagation closure of the CLUES ALONE determine the whole
 *   grid?  If YES -> symmetry gives the player NOTHING -> the two games are the
 *   same puzzle and sym-a-pix's extra rule is decoration.
 *   If NO  -> the player MUST use symmetry to finish -> the extra rule forms a
 *   DIFFERENT reasoning path -> per the task rule ("a variant whose added
 *   constraint forms different reasoning must be KEPT") they are DISTINCT.
 *
 * CALIBRATION:
 *   C1 stored solution satisfies every clue
 *   C2 propagation never contradicts the stored solution (no cell is forced
 *      to the wrong value) — otherwise the propagator is wrong
 *   C3 the closure produced by clues+symmetry is a SUBSET of clues-alone
 *      closure (symmetry can only help, never hurt) — a monotonicity check
 *   C4 NEGATIVE: on a puzzle with a deliberately contradictory clue the
 *      propagator must report a contradiction rather than silently succeeding
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

/**
 * Local propagation closure.
 * state[i] = -1 unknown | 0 empty | 1 filled
 * @param useSym if true, (r,c) and its 180-degree partner are forced equal
 * @returns {state, decided, contradiction}
 */
function propagate(clues, n, useSym) {
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
      // the partner must match
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
      const v = clues[i];
      if (v < 0) continue;
      let s = 0, unk = [];
      for (const j of nbr[i]) {
        if (state[j] === 1) s++;
        else if (state[j] === -1) unk.push(j);
      }
      if (s > v) { contradiction = true; break; }
      if (unk.length === 0) continue;
      if (s === v) {
        // all remaining neighbours must be EMPTY
        for (const j of unk) { if (!set(j, 0)) break; changed = true; }
      } else if (s + unk.length === v) {
        // all remaining neighbours must be FILLED
        for (const j of unk) { if (!set(j, 1)) break; changed = true; }
      }
      if (contradiction) break;
    }
  }
  let decided = 0;
  for (let i = 0; i < N; i++) if (state[i] !== -1) decided++;
  return { state, decided, contradiction, N };
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

function storedOk(l) {
  const n = l.n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let cnt = 0;
    for (const j of nbrIdx(n, r, c)) cnt += l.solution[(j / n) | 0][j % n];
    if (cnt !== l.clues[r][c]) return false;
  }
  return true;
}

function analyse(label, levels) {
  console.log('\n=========== ' + label + ' (' + levels.length + ' levels) ===========');
  let c1 = true, c2 = true, c3 = true;
  const rows = [];
  for (const l of levels) {
    const flat = l.clues.flat();
    if (!storedOk(l)) c1 = false;
    const a = propagate(flat, l.n, false);
    const b = propagate(flat, l.n, true);
    // C2: no forced cell contradicts the stored solution
    for (let i = 0; i < l.n * l.n; i++) {
      const sv = l.solution[(i / l.n) | 0][i % l.n];
      if (a.state[i] !== -1 && a.state[i] !== sv) c2 = false;
      if (b.state[i] !== -1 && b.state[i] !== sv) c2 = false;
    }
    // C3: symmetry closure is a superset of clues-alone closure
    for (let i = 0; i < l.n * l.n; i++) {
      if (a.state[i] !== -1 && b.state[i] === -1) c3 = false;
    }
    rows.push({
      name: l.name, n: l.n,
      alone: a.decided, withSym: b.decided, N: l.n * l.n,
      alonePct: Math.round(a.decided / (l.n * l.n) * 100),
      withSymPct: Math.round(b.decided / (l.n * l.n) * 100),
      contraAlone: a.contradiction, contraSym: b.contradiction,
    });
  }
  console.log('C1 stored satisfies clues in all levels :', c1);
  console.log('C2 no propagated cell contradicts stored:', c2);
  console.log('C3 symmetry closure ⊇ clues-alone closure:', c3);
  console.log('clues-alone decided %: ' + rows.map(r => r.alonePct).join(','));
  console.log('clues+sym  decided %: ' + rows.map(r => r.withSymPct).join(','));
  const solvedAlone = rows.filter(r => r.alone === r.N).length;
  const solvedSym = rows.filter(r => r.withSym === r.N).length;
  console.log('>> levels SOLVED by clues-alone propagation alone: ' + solvedAlone + '/' + rows.length);
  console.log('>> levels SOLVED with the symmetry rule            : ' + solvedSym + '/' + rows.length);
  const helped = rows.filter(r => r.withSym > r.alone).length;
  console.log('>> levels where symmetry DECIDES MORE cells         : ' + helped + '/' + rows.length);
  if (helped) console.log('   ' + rows.filter(r => r.withSym > r.alone).slice(0, 8)
    .map(r => `${r.name}(${r.n}x${r.n}) ${r.alonePct}%->${r.withSymPct}%`).join(', '));

  // C4 NEGATIVE: contradictory clue -> the propagator must notice
  const L0 = levels[0];
  const bad = L0.clues.flat().slice();
  // make a clue impossible: set a corner clue to 9 (only 3 neighbours exist)
  bad[0] = 9;
  const r4 = propagate(bad, L0.n, false);
  console.log('C4 NEGATIVE (impossible clue)          : contradiction detected =', r4.contradiction,
    (r4.contradiction ? '-> OK' : '-> FAIL (propagator is blind)'));
  return rows;
}

const symRows = analyse('sym-a-pix', loadSymLevels());
const fillRows = analyse('fill-a-pix', loadFillLevels());

console.log('\n=================== VERDICT ===================');
const symHelped = symRows.filter(r => r.withSym > r.alone).length;
const fillHelped = fillRows.filter(r => r.withSym > r.alone).length;
console.log('sym-a-pix : symmetry adds deduction power in ' + symHelped + '/' + symRows.length + ' levels');
console.log('fill-a-pix: symmetry adds deduction power in ' + fillHelped + '/' + fillRows.length + ' levels');
console.log(symHelped > 0
  ? '=> sym-a-pix\'s extra rule FORMS DIFFERENT REASONING -> DISTINCT, keep both'
  : '=> sym-a-pix\'s extra rule adds NOTHING -> RESKIN candidate');
