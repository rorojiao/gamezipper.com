#!/usr/bin/env node
/**
 * R338 — DEBUG: why does clues-alone local propagation contradict the stored
 * solution in some fill-a-pix levels? Two hypotheses:
 *   H1  my propagator is wrong (a bug in the closure rules)
 *   H2  the shipped game data is wrong (the clue really does force the OTHER
 *       value, i.e. the "cross-reference overlapping clues" advice the page
 *       gives would lead a correct player astray — a real P1)
 *
 * Discriminator: if H1, then the FULL constraint solver (which enumerates
 * every assignment and validates every clue exactly) must also find the
 * stored solution to be the unique one AND the propagation must be shown to
 * have used an invalid rule. If H2, the unique solution is NOT the stored
 * solution -> the shipped answer is wrong.
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

// propagate with full reason tracking
function propagateTracked(clues, n) {
  const N = n * n;
  const state = new Int8Array(N).fill(-1);
  const why = new Array(N).fill(null);
  const nbr = [];
  for (let i = 0; i < N; i++) nbr.push(nbrIdx(n, (i / n) | 0, i % n));
  let contradiction = null;
  let changed = true;
  while (changed && !contradiction) {
    changed = false;
    for (let i = 0; i < N; i++) {
      const v = clues[i];
      if (v < 0) continue;
      let s = 0; const unk = [];
      for (const j of nbr[i]) {
        if (state[j] === 1) s++;
        else if (state[j] === -1) unk.push(j);
      }
      if (s > v) { contradiction = { type: 'over', cell: i, clue: v, have: s }; break; }
      if (s + unk.length < v) { contradiction = { type: 'impossible', cell: i, clue: v, have: s, unk: unk.length }; break; }
      if (!unk.length) continue;
      if (s === v) {
        for (const j of unk) {
          if (state[j] === -1) { state[j] = 0; why[j] = `clue(${i})=${v} already has ${s} filled -> all unknown neighbours empty`; changed = true; }
          else if (state[j] === 1) { contradiction = { type: 'conflict', cell: i, clue: v, j, kind: 'must-be-empty-but-filled' }; break; }
        }
      } else if (s + unk.length === v) {
        for (const j of unk) {
          if (state[j] === -1) { state[j] = 1; why[j] = `clue(${i})=${v} needs ${v - s} more filled, ${unk.length} unknown -> all filled`; changed = true; }
          else if (state[j] === 0) { contradiction = { type: 'conflict', cell: i, clue: v, j, kind: 'must-be-filled-but-empty' }; break; }
        }
      }
      if (contradiction) break;
    }
  }
  return { state, why, contradiction };
}

// full enumeration to find ALL solutions
function allSolutions(clues, n, limit) {
  const N = n * n;
  const nbr = [];
  for (let i = 0; i < N; i++) nbr.push(nbrIdx(n, (i / n) | 0, i % n));
  const assign = new Int8Array(N).fill(-1);
  const cons = [];
  for (let i = 0; i < N; i++) if (clues[i] >= 0) cons.push({ idxs: nbr[i], v: clues[i] });
  function feasible() {
    for (const { idxs, v } of cons) {
      let s = 0, unk = 0;
      for (const i of idxs) { if (assign[i] === 1) s++; else if (assign[i] === -1) unk++; }
      if (s > v) return false;
      if (s + unk < v) return false;
    }
    return true;
  }
  const sols = [];
  function rec(k) {
    if (sols.length >= limit) return;
    if (k === N) { if (feasible()) sols.push(Int8Array.from(assign)); return; }
    for (const v of [0, 1]) { assign[k] = v; if (feasible()) rec(k + 1); assign[k] = -1; }
  }
  rec(0);
  return sols;
}

const levels = loadFillLevels();
console.log('fill-a-pix levels:', levels.length);
for (const l of levels) {
  const flat = l.clues.flat();
  const p = propagateTracked(flat, l.n);
  let bad = [];
  for (let i = 0; i < l.n * l.n; i++) {
    const sv = l.solution[(i / l.n) | 0][i % l.n];
    if (p.state[i] !== -1 && p.state[i] !== sv) bad.push(i);
  }
  if (bad.length || p.contradiction) {
    console.log(`\n### ${l.name} (${l.n}x${l.n}) tier=${l.tier}`);
    console.log('   contradiction:', JSON.stringify(p.contradiction));
    console.log('   cells forced to the WRONG value:', bad.length);
    for (const i of bad.slice(0, 4)) {
      const r = (i / l.n) | 0, c = i % l.n;
      console.log(`     (${r},${c}) forced=${p.state[i]} stored=${l.solution[r][c]}  reason: ${p.why[i]}`);
      // print the clue cell that drove it
    }
    const sols = allSolutions(flat, l.n, 3);
    console.log('   full enumeration: solutions =', sols.length);
    for (const s of sols.slice(0, 2)) {
      let same = true;
      for (let i = 0; i < l.n * l.n; i++) if (s[i] !== l.solution[(i / l.n) | 0][i % l.n]) { same = false; break; }
      console.log('     solution equals stored?', same);
    }
  }
}
console.log('\n(done)');
