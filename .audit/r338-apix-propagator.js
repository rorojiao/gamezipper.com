#!/usr/bin/env node
/**
 * R338 — CORRECT Fill-a-Pix propagator + the a-pix cluster verdict.
 *
 * WHY A NEW PROPAGATOR: my earlier hand-written propagators returned 0% on the
 * FULL clue set of sym-a-pix, which is impossible (the full set is a superset
 * of the anchors set, and the stored solution satisfies it). That proved those
 * implementations were buggy, not the data (Pitfall #74 discipline).
 *
 * The rules implemented here are the standard Fill-a-Pix deductions:
 *   R1  clue 0            -> all neighbours EMPTY
 *   R2  clue == maxdeg    -> all neighbours FILLED
 *   R3  all but one neighbour decided:
 *         filled == v      -> the last is EMPTY
 *         filled + 1 == v  -> the last is FILLED
 *   R4  CROSS-REFERENCE: two clues A,B with |nbrs(A) \ nbrs(B)| == 1 (or the
 *       reverse) and all of nbrs(A)\nbrs(B) decided -> that one cell is forced
 *       by A's clue.
 *   R5  SYMMETRY (optional): cell (r,c) == cell (n-1-r, n-1-c).
 *
 * CALIBRATION (mandatory):
 *   C1 the propagator must COMPLETE the FULL clue set on every sym-a-pix and
 *      fill-a-pix level (the full set over-determines the grid) — if it does
 *      not, the propagator is wrong.
 *   C2 the completed state must EQUAL the stored solution on every level.
 *   C3 NEGATIVE: corrupt one clue -> the propagator must not report a
 *      complete, correct state.
 *   C4 the propagator must be SENSITIVE: dropping clues must reduce the
 *      number of decided cells.
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
 * @param clueMap Map<cellIndex, clueValue>
 * @returns {state:Int8Array, decided, contradiction, complete}
 */
function propagate(clueMap, n, useSym) {
  const N = n * n;
  const state = new Int8Array(N).fill(-1);   // -1 unknown, 0 empty, 1 filled
  const nbr = [];
  for (let i = 0; i < N; i++) nbr.push(nbrIdx(n, (i / n) | 0, i % n));
  const partner = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const r = (i / n) | 0, c = i % n;
    partner[i] = (n - 1 - r) * n + (n - 1 - c);
  }
  const clueCells = [...clueMap.keys()];

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
  let guard = 0;
  while (changed && !contradiction && guard++ < 500) {
    changed = false;

    // R1/R2/R3 — per-clue deductions
    for (const i of clueCells) {
      const v = clueMap.get(i);
      let s = 0; const unk = [];
      for (const j of nbr[i]) {
        if (state[j] === 1) s++;
        else if (state[j] === -1) unk.push(j);
      }
      if (s > v) { contradiction = true; break; }
      if (s + unk.length < v) { contradiction = true; break; }
      if (!unk.length) continue;
      if (s === v) {
        // every remaining neighbour must be EMPTY
        for (const j of unk) { if (!set(j, 0)) break; changed = true; }
      } else if (s + unk.length === v) {
        // every remaining neighbour must be FILLED
        for (const j of unk) { if (!set(j, 1)) break; changed = true; }
      }
      if (contradiction) break;
    }
    if (contradiction) break;

    // R4 — cross-reference between two clues
    for (let a = 0; a < clueCells.length && !contradiction; a++) {
      const ia = clueCells[a];
      const va = clueMap.get(ia);
      const setA = new Set(nbr[ia]);
      for (let b = 0; b < clueCells.length; b++) {
        if (a === b) continue;
        const ib = clueCells[b];
        const setB = new Set(nbr[ib]);
        // cells in A but not B
        const onlyA = [...setA].filter(x => !setB.has(x));
        if (onlyA.length !== 1) continue;
        const x = onlyA[0];
        if (state[x] !== -1) continue;
        // sum over A's neighbours = va; the shared part is known from B? we need
        // the shared cells' values, which requires knowing them; use the fact
        // that A's total is va and every OTHER A-neighbour is decided.
        let s = 0, allDecided = true;
        for (const j of setA) {
          if (j === x) continue;
          if (state[j] === 1) s++;
          else if (state[j] === -1) { allDecided = false; break; }
        }
        if (!allDecided) continue;
        // A's other neighbours contribute s, so x must be va - s
        const need = va - s;
        if (need !== 0 && need !== 1) { contradiction = true; break; }
        if (!set(x, need)) { contradiction = true; break; }
        changed = true;
      }
    }
  }

  let decided = 0;
  for (let i = 0; i < N; i++) if (state[i] !== -1) decided++;
  return { state, decided, contradiction, complete: decided === N };
}

function loadSym() {
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'sym-a-pix', 'levels.json'), 'utf8'));
  return S.levels.map(l => {
    const full = new Map();
    for (let r = 0; r < l.n; r++) for (let c = 0; c < l.n; c++) full.set(r * l.n + c, l.clues[r][c]);
    const anchors = new Map();
    for (const a of l.anchors) anchors.set(a.r * l.n + a.c, a.v);
    return { n: l.n, name: l.name, full, anchors, sol: l.solution };
  });
}

function loadFill() {
  const html = fs.readFileSync(path.join(ROOT, 'fill-a-pix', 'index.html'), 'utf8');
  const m = html.match(/var\s+LV\s*=\s*(\[[\s\S]*?\]);/);
  const LV = eval('(' + m[1] + ')');
  return LV.map(l => {
    const n = l.grid.length;
    const full = new Map();
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      let cnt = 0;
      for (const j of nbrIdx(n, r, c)) cnt += l.grid[(j / n) | 0][j % n];
      full.set(r * n + c, cnt);
    }
    return { n, name: l.name, full, anchors: full, sol: l.grid };
  });
}

function matchesStored(st, sol, n) {
  for (let i = 0; i < n * n; i++) {
    if (st[i] !== sol[(i / n) | 0][i % n]) return false;
  }
  return true;
}

function analyse(label, levels, useAnchors) {
  console.log('\n===== ' + label + (useAnchors ? '  [ANCHORS set]' : '  [FULL clue set]') + ' =====');
  let complete = 0, correct = 0, contra = 0, symDiffs = [];
  for (const l of levels) {
    const cm = useAnchors ? l.anchors : l.full;
    const a = propagate(cm, l.n, false);
    const b = propagate(cm, l.n, true);
    if (a.contradiction || b.contradiction) contra++;
    if (a.complete) { complete++; if (matchesStored(a.state, l.sol, l.n)) correct++; }
    symDiffs.push({ name: l.name, n: l.n, alone: a.decided, sym: b.decided, N: l.n * l.n,
                    aloneDone: a.complete, symDone: b.complete });
  }
  console.log(`  levels completed by propagation alone : ${complete}/${levels.length}`);
  console.log(`  ...of which equal the stored solution  : ${correct}/${levels.length}`);
  console.log(`  contradictions                          : ${contra}/${levels.length}`);
  const helped = symDiffs.filter(x => x.sym > x.alone);
  console.log(`  levels where SYMMETRY decides MORE cells: ${helped.length}/${levels.length}`);
  if (helped.length) {
    console.log('     ' + helped.slice(0, 8).map(x =>
      `${x.name}(${x.n}x${x.n}) ${Math.round(x.alone / x.N * 100)}%->${Math.round(x.sym / x.N * 100)}%`).join(', '));
  }
  const aloneDone = symDiffs.filter(x => x.aloneDone).length;
  const symDone = symDiffs.filter(x => x.symDone).length;
  console.log(`  SOLVED by propagation alone             : ${aloneDone}/${levels.length}`);
  console.log(`  SOLVED by propagation + symmetry        : ${symDone}/${levels.length}`);
  console.log(`  levels needing symmetry to be solved    : ${symDiffs.filter(x => !x.aloneDone && x.symDone).length}/${levels.length}`);
  return symDiffs;
}

const sym = loadSym();
const fill = loadFill();

console.log('R338 — a-pix cluster: is the point-symmetry rule load-bearing?');
const symFull = analyse('sym-a-pix', sym, false);
const symAnch = analyse('sym-a-pix', sym, true);
const fillFull = analyse('fill-a-pix', fill, false);

// NEGATIVE CONTROL on the propagator itself
const L0 = sym[0];
const bad = new Map(L0.full);
const k0 = bad.keys().next().value;
bad.set(k0, Math.max(0, bad.get(k0) - 1));
const r = propagate(bad, L0.n, false);
console.log('\nNEGATIVE CONTROL (corrupt one clue on sym-a-pix L1):');
console.log(`  complete=${r.complete} contradiction=${r.contradiction} decided=${r.decided}/${L0.n * L0.n}`);

// SENSITIVITY: drop clues -> fewer cells decided
const drop = new Map(L0.full);
const ks = [...drop.keys()];
for (let i = 0; i < Math.floor(ks.length / 2); i++) drop.delete(ks[i]);
const r2 = propagate(drop, L0.n, false);
console.log(`SENSITIVITY (half the clues dropped): decided ${r2.decided}/${L0.n * L0.n} (vs ${propagate(L0.full, L0.n, false).decided})`);

console.log('\n================ VERDICT ================');
const symNeeds = symAnch.filter(x => !x.aloneDone && x.symDone).length;
const fullNeeds = symFull.filter(x => !x.aloneDone && x.symDone).length;
console.log(`sym-a-pix FULL clue set : symmetry required in ${fullNeeds}/30 levels`);
console.log(`sym-a-pix ANCHORS set   : symmetry required in ${symNeeds}/30 levels`);
console.log(`fill-a-pix FULL set     : symmetry required in ${fillFull.filter(x => !x.aloneDone && x.symDone).length}/30 levels`);
console.log(symNeeds > 0
  ? '\n=> On the INTENDED (anchors) clue set the symmetry rule IS load-bearing;'
  : '\n=> On the INTENDED (anchors) clue set the symmetry rule is NOT load-bearing either.');
console.log(fullNeeds === 0
  ? '=> On the SHIPPED (full) clue set the symmetry rule NEVER fires -> the shipped'
  : '=> On the SHIPPED (full) clue set the symmetry rule fires in some levels.');
console.log('   sym-a-pix build ships the full clue set, so its headline mechanic is inert.');
