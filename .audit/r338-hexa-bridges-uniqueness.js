#!/usr/bin/env node
/**
 * R338 — calibrated independent solution counter for hexa-bridges'
 * advertised "30 unique-solution levels" claim.
 *
 * RULE (read from the ENGINE, hexa-bridges/index.html checkWin(), L689):
 *   1. every ANCHOR cell (has a clue) has degree == clue
 *   2. every NON-anchor cell has degree <= 2
 *   3. bridges.size === Q*R - 1
 *   4. the bridge graph is connected and acyclic  (=> a spanning tree over
 *      ALL Q*R cells, including non-clue cells)
 *
 * METHOD: grow a spanning tree vertex-by-vertex from a root, attaching each
 * new cell to exactly one already-present neighbour.  Every spanning tree of
 * the grid is reachable this way, and the degree caps are monotone so a
 * partial state never violates a cap that the final tree satisfies.
 * Solutions are de-duplicated by their EDGE SET (a tree is reachable in many
 * growth orders), so the count is exact.
 *
 * CALIBRATION (all four must pass or the counter is not trusted):
 *   A  the SHIPPED solution must be found by the counter and must satisfy the
 *      rule (re-validated from scratch)
 *   B  relaxing ONE anchor clue must NOT reduce the count (it may increase)
 *   C  an impossible clue (7 > max hex degree 6) must yield ZERO
 *   D  removing ALL clues must yield MANY (>1) trees
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function loadLevels() {
  const h = fs.readFileSync(path.join(ROOT, 'hexa-bridges', 'index.html'), 'utf8');
  const m = h.match(/window\.__LEVELS_DATA = (\{.*?\});/s);
  if (!m) throw new Error('no __LEVELS_DATA');
  return JSON.parse(m[1]).LEVELS;
}

function buildGrid(Q, R) {
  const n = Q * R;
  const adj = Array.from({ length: n }, () => []);
  for (let q = 0; q < Q; q++) for (let r = 0; r < R; r++) {
    const i = q * R + r;
    for (const [dq, dr] of DIRS) {
      const nq = q + dq, nr = r + dr;
      if (nq >= 0 && nq < Q && nr >= 0 && nr < R) adj[i].push(nq * R + nr);
    }
  }
  return adj;
}

// --- independent re-implementation of the engine's rule (validation side) ---
function validate(treeEdges, Q, R, anchors) {
  const n = Q * R;
  const idx = (q, r) => q * R + r;
  const clue = new Array(n).fill(null);
  for (const k of Object.keys(anchors)) {
    const [q, r] = k.split(',').map(Number);
    clue[idx(q, r)] = anchors[k];
  }
  const deg = new Array(n).fill(0);
  const parent = new Array(n).fill(0).map((_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const seen = new Set();
  for (const [a, b] of treeEdges) {
    if (a < 0 || b < 0 || a >= n || b >= n) return { ok: false, why: 'edge out of range' };
    const key = a < b ? a + ',' + b : b + ',' + a;
    if (seen.has(key)) return { ok: false, why: 'duplicate edge' };
    seen.add(key);
    deg[a]++; deg[b]++;
    const ra = find(a), rb = find(b);
    if (ra === rb) return { ok: false, why: 'cycle' };
    parent[ra] = rb;
  }
  if (seen.size !== n - 1) return { ok: false, why: 'edge count ' + seen.size + ' != ' + (n - 1) };
  for (let i = 0; i < n; i++) {
    if (clue[i] !== null && deg[i] !== clue[i]) return { ok: false, why: 'anchor ' + i + ' deg ' + deg[i] + ' != clue ' + clue[i] };
    if (clue[i] === null && deg[i] > 2) return { ok: false, why: 'non-anchor ' + i + ' deg ' + deg[i] + ' > 2' };
  }
  const roots = new Set();
  for (let i = 0; i < n; i++) roots.add(find(i));
  if (roots.size !== 1) return { ok: false, why: 'not connected (' + roots.size + ' components)' };
  return { ok: true, deg };
}

function countSolutions(Q, R, anchors, limit) {
  limit = limit || 60;
  const n = Q * R;
  const adj = buildGrid(Q, R);
  const clue = new Array(n).fill(null);
  for (const k of Object.keys(anchors)) {
    const [q, r] = k.split(',').map(Number);
    clue[q * R + r] = anchors[k];
  }
  const cap = clue.map(c => c === null ? 2 : c);
  // root = the anchor with the largest clue (strongest pruning)
  let root = 0, best = -1;
  for (let i = 0; i < n; i++) if (clue[i] !== null && clue[i] > best) { best = clue[i]; root = i; }
  const deg = new Array(n).fill(0);
  const inTree = new Array(n).fill(false);
  const edges = [];
  const sols = new Map();          // edge-set key -> edge list
  let truncated = false;

  function feasible() {
    for (let i = 0; i < n; i++) {
      const c = clue[i];
      if (c === null) continue;
      if (deg[i] > c) return false;
      if (deg[i] < c) {
        let fut = 0;
        for (const nb of adj[i]) if (!inTree[nb]) fut++;
        if (deg[i] + fut < c) return false;
      }
    }
    return true;
  }
  function done() {
    for (let i = 0; i < n; i++) {
      if (clue[i] !== null && deg[i] !== clue[i]) return;
      if (clue[i] === null && deg[i] > 2) return;
    }
    const key = edges.map(e => e[0] < e[1] ? e[0] + ':' + e[1] : e[1] + ':' + e[0]).sort().join('|');
    if (!sols.has(key)) sols.set(key, edges.slice());
  }
  function dfs() {
    if (truncated) return;
    if (sols.size >= limit) { truncated = true; return; }
    let added = 0;
    for (let i = 0; i < n; i++) if (inTree[i]) added++;
    if (added === n) { done(); return; }
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      let touches = false;
      for (const u of adj[v]) if (inTree[u]) { touches = true; break; }
      if (!touches) continue;
      for (const u of adj[v]) {
        if (!inTree[u]) continue;
        if (deg[v] + 1 > cap[v]) continue;
        if (deg[u] + 1 > cap[u]) continue;
        inTree[v] = true; deg[v] = 1; deg[u] += 1;
        edges.push(u < v ? [u, v] : [v, u]);
        if (feasible()) dfs();
        edges.pop(); deg[u] -= 1; deg[v] = 0; inTree[v] = false;
        if (truncated) return;
      }
    }
  }
  inTree[root] = true;
  dfs();
  return { count: sols.size, solutions: Array.from(sols.values()), truncated, adj, clue };
}

function keyOf(edges) {
  return edges.map(e => e[0] < e[1] ? e[0] + ':' + e[1] : e[1] + ':' + e[0]).sort().join('|');
}

function main() {
  const LEVELS = loadLevels();
  const report = { levels: [], calibration: {}, totals: { multi: 0, unique: 0, zero: 0, unproven: 0 } };

  for (const lv of LEVELS) {
    const Q = lv.Q, R = lv.R, anchors = lv.anchors;
    const shipped = lv.solution.map(e => e.slice());
    const r = countSolutions(Q, R, anchors, 60);
    const shippedValid = validate(shipped, Q, R, anchors);
    const found = r.solutions.find(s => keyOf(s) === keyOf(shipped));
    // validate EVERY emitted solution (a counter that emits invalid grids is not evidence)
    let invalidEmitted = 0;
    for (const s of r.solutions) if (!validate(s, Q, R, anchors).ok) invalidEmitted++;

    const entry = {
      i: lv.i, tier: lv.tier, Q, R, cells: Q * R,
      anchors: Object.keys(anchors).length,
      count: r.count, truncated: r.truncated,
      shippedValid: shippedValid.ok, shippedWhy: shippedValid.why || null,
      shippedFoundByCounter: !!found,
      invalidEmitted,
      rival: null,
    };
    if (r.count >= 2) {
      const rival = r.solutions.find(s => keyOf(s) !== keyOf(shipped));
      if (rival) entry.rival = rival;
    }
    report.levels.push(entry);
    if (r.count === 0) report.totals.zero++;
    else if (r.count === 1) report.totals.unique++;
    else if (r.truncated) report.totals.unproven++;
    else report.totals.multi++;
  }

  // ---------------- CALIBRATION ----------------
  const L0 = LEVELS[0], Lmid = LEVELS[15], Lbig = LEVELS[29];
  // A: shipped solution found + valid
  const a0 = report.levels[0];
  report.calibration.A_positive = {
    desc: 'shipped solution satisfies the rule AND is found by the counter',
    level0: { shippedValid: a0.shippedValid, shippedFoundByCounter: a0.shippedFoundByCounter },
    level16: (() => { const e = report.levels[15]; return { shippedValid: e.shippedValid, shippedFoundByCounter: e.shippedFoundByCounter }; })(),
    level30: (() => { const e = report.levels[29]; return { shippedValid: e.shippedValid, shippedFoundByCounter: e.shippedFoundByCounter }; })(),
  };
  // B: relaxing one clue must not reduce the count
  {
    const anchors = Object.assign({}, Lmid.anchors);
    const keys = Object.keys(anchors).filter(k => anchors[k] > 1);
    const k = keys[0];
    const orig = anchors[k];
    anchors[k] = orig - 1;
    const relaxed = countSolutions(Lmid.Q, Lmid.R, anchors, 60);
    const base = report.levels[15].count;
    report.calibration.B_relax = {
      desc: 'relax one anchor clue -> count must not drop',
      cell: k, from: orig, to: orig - 1, baseCount: base, relaxedCount: relaxed.count,
      pass: relaxed.count >= base,
    };
  }
  // C: impossible clue -> ZERO
  {
    const anchors = Object.assign({}, Lmid.anchors);
    const k = Object.keys(anchors)[0];
    anchors[k] = 7;                     // 7 > max hex degree 6
    const impossible = countSolutions(Lmid.Q, Lmid.R, anchors, 60);
    report.calibration.C_impossible = {
      desc: 'clue 7 (> max degree 6) must yield ZERO',
      cell: k, count: impossible.count, pass: impossible.count === 0,
    };
  }
  // D: no clues -> MANY
  {
    const none = countSolutions(Lmid.Q, Lmid.R, {}, 60);
    report.calibration.D_no_clues = {
      desc: 'removing all clues must yield MANY trees (>1)',
      count: none.count, truncated: none.truncated, pass: none.count > 1,
    };
  }
  report.calibration.allPass =
    report.calibration.A_positive.level0.shippedValid && report.calibration.A_positive.level0.shippedFoundByCounter &&
    report.calibration.A_positive.level16.shippedValid && report.calibration.A_positive.level16.shippedFoundByCounter &&
    report.calibration.A_positive.level30.shippedValid && report.calibration.A_positive.level30.shippedFoundByCounter &&
    report.calibration.B_relax.pass && report.calibration.C_impossible.pass && report.calibration.D_no_clues.pass;

  fs.writeFileSync(path.join(ROOT, '.audit/r338-hexa-uniqueness.json'), JSON.stringify(report, null, 1));

  console.log('CALIBRATION:', report.calibration.allPass ? 'ALL PASS' : 'FAIL');
  console.log(JSON.stringify(report.calibration, null, 1));
  console.log('\n=== PER-LEVEL SOLUTION COUNTS ===');
  for (const e of report.levels) {
    console.log(`L${String(e.i + 1).padStart(2)} ${e.tier.padEnd(9)} ${e.Q}x${e.R} cells=${String(e.cells).padStart(2)} anchors=${String(e.anchors).padStart(2)}  solutions=${e.count}${e.truncated ? '+' : ''}  shippedValid=${e.shippedValid} foundByCounter=${e.shippedFoundByCounter} invalidEmitted=${e.invalidEmitted}`);
  }
  console.log('\nTOTALS:', JSON.stringify(report.totals));
  const multi = report.levels.filter(e => e.count >= 2);
  console.log('MULTI-SOLUTION LEVELS:', JSON.stringify(multi.map(e => e.i + 1)));
}
main();
