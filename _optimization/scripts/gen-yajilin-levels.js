#!/usr/bin/env node
/* Offline level generator for yajilin (replaces broken runtime generation).
 *
 * Why: the shipped genPuzzle (index.html:185) places arrow clues AFTER findHC (:216),
 * but players can neither shade nor loop-mark clue cells (cellAction :443 refuses them,
 * checkWin :494 excludes them from the loop) — so any clue landing on the intended cycle
 * makes the level unwinnable; and findHC's unbounded DFS hangs >100s on larger boards.
 *
 * Method (per level, all searches node-capped, single process, serial):
 *   1. random non-adjacent shaded set (ns cells, seeded rng)
 *   2. clue POSITIONS chosen next (non-shaded); the loop graph is grid - shaded - clues
 *   3. Warnsdorff+pruning Hamiltonian cycle over exactly that graph (findHC with caps)
 *   4. clue values computed from the shaded set (direction biased to non-zero counts)
 *   5. INDEPENDENT solver (clues only): enumerate every shading satisfying all clue
 *      counts + non-adjacency; for each, enumerate Hamiltonian cycles of its remainder
 *      (stop at 2). A level ships ONLY when the solver terminates within caps and finds
 *      exactly ONE (shading, cycle) solution — and it equals the intended one.
 * Output: _optimization/evidence/yajilin/gen-levels.json (full) + compact STATIC_LV JSON
 * on stdout for embedding into index.html.
 * Usage: node _optimization/scripts/gen-yajilin-levels.js [--out <file>]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const OUT_DEFAULT = path.join(REPO, '_optimization', 'evidence', 'yajilin', 'gen-levels.json');

/* level board configs — mirrors index.html LV (w,h,ns,par) */
const CONFIGS = [
  { w: 5, h: 6, ns: 2, par: 60 }, { w: 5, h: 6, ns: 2, par: 65 }, { w: 5, h: 6, ns: 3, par: 70 },
  { w: 5, h: 6, ns: 3, par: 75 }, { w: 5, h: 6, ns: 3, par: 80 }, { w: 5, h: 6, ns: 4, par: 90 },
  { w: 6, h: 6, ns: 3, par: 100 }, { w: 6, h: 6, ns: 4, par: 110 }, { w: 6, h: 6, ns: 4, par: 120 },
  { w: 6, h: 6, ns: 5, par: 130 }, { w: 6, h: 8, ns: 4, par: 140 }, { w: 6, h: 8, ns: 5, par: 150 },
  { w: 8, h: 8, ns: 5, par: 180 }, { w: 8, h: 8, ns: 6, par: 200 }, { w: 8, h: 8, ns: 6, par: 220 },
  { w: 8, h: 8, ns: 7, par: 240 }, { w: 8, h: 10, ns: 6, par: 260 }, { w: 8, h: 10, ns: 7, par: 280 },
  { w: 8, h: 10, ns: 8, par: 300 }, { w: 10, h: 10, ns: 7, par: 330 }, { w: 10, h: 10, ns: 8, par: 360 },
  { w: 10, h: 10, ns: 8, par: 390 }, { w: 10, h: 10, ns: 9, par: 420 }, { w: 10, h: 12, ns: 8, par: 450 },
  { w: 10, h: 12, ns: 9, par: 480 }, { w: 10, h: 12, ns: 9, par: 510 }, { w: 10, h: 12, ns: 10, par: 540 },
  { w: 10, h: 12, ns: 10, par: 570 }, { w: 12, h: 12, ns: 10, par: 600 }, { w: 12, h: 12, ns: 11, par: 630 },
];

const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
const DIRLIST = ['U', 'D', 'L', 'R'];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- capped Hamiltonian-cycle machinery over a set graph ---------- */
function gridGraph(w, h, blockedSet) {
  /* returns {n, adj: [ [cells...] ], cellOf: r,c } over free cells */
  const id = new Int32Array(w * h).fill(-1);
  const cells = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const k = r + ',' + c;
    if (!blockedSet.has(k)) { id[r * w + c] = cells.length; cells.push([r, c]); }
  }
  const n = cells.length;
  const adj = [];
  for (let i = 0; i < n; i++) {
    const [r, c] = cells[i]; const a = [];
    for (const d of DIRLIST) { const nr = r + DIRS[d][0], nc = c + DIRS[d][1]; if (nr >= 0 && nr < h && nc >= 0 && nc < w) { const j = id[nr * w + nc]; if (j >= 0) a.push(j); } }
    adj.push(a);
  }
  return { n, adj, cells, id };
}

function quickNoHC(g) {
  /* necessary conditions: connected, min degree >= 2, chessboard color balance */
  if (g.n === 0) return true;
  const { n, adj, cells } = g;
  let bal = 0;
  for (let i = 0; i < n; i++) { const r = cells[i][0], c = cells[i][1]; bal += ((r + c) % 2 === 0) ? 1 : -1; }
  if (bal !== 0) return true;
  for (let i = 0; i < n; i++) if (adj[i].length < 2) return true;
  const seen = new Uint8Array(n); const st = [0]; seen[0] = 1; let cnt = 1;
  while (st.length) { const u = st.pop(); for (const v of adj[u]) if (!seen[v]) { seen[v] = 1; cnt++; st.push(v); } }
  return cnt !== n;
}

/* ---------- Hamiltonian cycle solver via forced-edge propagation ----------
 * Model: each free cell must have EXACTLY 2 chosen edges; chosen edges must form one
 * cycle (premature sub-cycle ban + same-path join ban). Cell rules + path-endpoint
 * rules propagate; branch on the most constrained unknown edge. Counts solutions up
 * to a limit with a node cap. */
function makeEdgeModel(g) {
  const { n, adj } = g;
  const edges = []; /* [u,v] */
  const eu = []; const ev = []; /* endpoints per edge id */
  const cellEdges = Array.from({ length: n }, () => []);
  const seen = new Set();
  for (let u = 0; u < n; u++) for (const v of adj[u]) {
    const k = u < v ? u + ':' + v : v + ':' + u;
    if (seen.has(k)) continue;
    seen.add(k);
    const id = edges.length;
    edges.push([u, v]); eu.push(u); ev.push(v);
    cellEdges[u].push(id); cellEdges[v].push(id);
  }
  return { edges, cellEdges, m: edges.length };
}

function solveHC(g, limit, nodeCap) {
  /* returns {count, cycle?, CAP?} — cycle from first solution */
  if (g.n < 4) return { count: 0 };
  if (quickNoHC(g)) return { count: 0 };
  const { n, adj } = g;
  const M = makeEdgeModel(g);
  const { edges, cellEdges, m } = M;
  const state = new Int8Array(m); /* 0 unknown 1 chosen -1 forbidden */
  const degCh = new Int8Array(n);
  const degUnk = new Int8Array(n);
  let nodes = 0; let capped = false; let count = 0; let firstCycle = null; const cycles = [];
  /* union-find over cells joined by chosen edges, with size */
  const parent = new Int32Array(n); const size = new Int32Array(n);
  function ufInit() { for (let i = 0; i < n; i++) { parent[i] = i; size[i] = 1; } }
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  function ufJoin(a, b) { const ra = find(a), rb = find(b); if (ra === rb) return false; if (size[ra] < size[rb]) { parent[ra] = rb; size[rb] += size[ra]; } else { parent[rb] = ra; size[ra] += size[rb]; } return true; }
  function ufSamePathSize(a, b) { const ra = find(a), rb = find(b); return ra === rb ? size[ra] : -1; }
  ufInit();
  for (let u = 0; u < n; u++) { degCh[u] = 0; degUnk[u] = cellEdges[u].length; }
  const dirty = [];
  for (let u = 0; u < n; u++) dirty.push(u);
  function setEdge(e, val) { /* returns false on contradiction; records nothing (caller manages stack) */
    if (state[e] === val) return true;
    if (state[e] !== 0) return false;
    state[e] = val;
    const u = edges[e][0], v = edges[e][1];
    if (val === 1) {
      degCh[u]++; degUnk[u]--; degCh[v]++; degUnk[v]--;
      if (degCh[u] > 2 || degCh[v] > 2) return false;
      /* premature cycle ban: joining two ends already in the same path is only OK when
       * that path covers every cell (the final cycle) */
      const psz = ufSamePathSize(u, v);
      if (psz >= 0) { if (psz === n) { /* final closure */ } else return false; }
      else ufJoin(u, v);
      dirty.push(u); dirty.push(v);
    } else {
      degUnk[u]--; degUnk[v]--;
      dirty.push(u); dirty.push(v);
    }
    return true;
  }
  function propagateAll() {
    while (dirty.length) {
      const u = dirty.pop();
      if (degCh[u] + degUnk[u] < 2) return false;
      if (degCh[u] === 2) { for (const e of cellEdges[u]) if (state[e] === 0) { if (!setEdge(e, -1)) return false; } }
      else if (degCh[u] + degUnk[u] === 2) { for (const e of cellEdges[u]) if (state[e] === 0) { if (!setEdge(e, 1)) return false; } }
      else if (degCh[u] > 2) return false;
      /* path endpoint: degCh==1 and one unknown edge left is forced by the rule above */
    }
    return true;
  }
  function isSolved() {
    for (let u = 0; u < n; u++) if (degCh[u] !== 2) return false;
    return true;
  }
  function extractCycle() {
    /* walk chosen edges */
    const nextOf = Array.from({ length: n }, () => []);
    for (let e = 0; e < m; e++) if (state[e] === 1) { nextOf[edges[e][0]].push(edges[e][1]); nextOf[edges[e][1]].push(edges[e][0]); }
    const cyc = [0]; let prev = -1; let cur = 0;
    do {
      const nxt = nextOf[cur][0] === prev ? nextOf[cur][1] : nextOf[cur][0];
      cyc.push(nxt); prev = cur; cur = nxt;
    } while (cur !== 0);
    cyc.pop();
    return cyc;
  }
  function branch() {
    if (capped || count >= limit) return;
    if (++nodes > nodeCap) { capped = true; return; }
    if (!propagateAll()) return;
    if (isSolved()) {
      count++;
      if (!firstCycle) firstCycle = extractCycle();
      if (cycles.length < limit) cycles.push(extractCycle());
      return;
    }
    /* pick unknown edge touching the cell with fewest unknowns (most constrained) */
    let bestU = -1; let bestCnt = 99;
    for (let u = 0; u < n; u++) { if (degCh[u] < 2 && degUnk[u] < bestCnt) { bestCnt = degUnk[u]; bestU = u; } }
    if (bestU < 0) return;
    const cands = cellEdges[bestU].filter(e => state[e] === 0);
    for (const e of cands) {
      if (capped || count >= limit) break;
      /* snapshot for undo: state + uf + deg arrays (m bytes + 4n ints — cheap) */
      const stB = state.slice(); const ufB = parent.slice(); const szB = size.slice(); const chB = degCh.slice(); const unB = degUnk.slice();
      const dl0 = dirty.length;
      if (setEdge(e, 1) && propagateAll()) branch();
      if (capped || count >= limit) return;
      /* restore */
      state.set(stB); parent.set(ufB); size.set(szB); degCh.set(chB); degUnk.set(unB);
      dirty.length = dl0;
      /* second branch: forbid the edge */
      if (setEdge(e, -1) && propagateAll()) branch();
      state.set(stB); parent.set(ufB); size.set(szB); degCh.set(chB); degUnk.set(unB);
      dirty.length = dl0;
      return; /* only branch on ONE edge per level (binary: chosen/forbidden) */
    }
  }
  branch();
  const out = { count };
  if (firstCycle) out.cycle = firstCycle;
  if (cycles.length > 1) out.cycles = cycles;
  if (capped) out.CAP = true;
  return out;
}
function findOneHC(g, budget, rand) {
  const r = solveHC(g, 1, budget);
  if (r.CAP) return 'CAP';
  return r.cycle || null;
}
function countHC(g, budget, limit) {
  return solveHC(g, limit, budget);
}

/* ---------- independent solver: enumerate all (shading, cycle) solutions ---------- */
/* clues: [{r,c,d,n}]. Returns {solutions:[{shaded:[ids...]}], capped?:true, explored:n} */
let ENUM_DEADLINE = 0;
function enumerateSolutions(w, h, clues, budgetNodes, hcBudget) {
  const N = w * h;
  const clueCell = new Int8Array(N).fill(-1); // index into clues or -1
  clues.forEach((cl, i) => { clueCell[cl.r * w + cl.c] = i; });
  /* rays: for each clue, list of N-ids in its direction */
  const rays = clues.map(cl => { const out = []; let r = cl.r + DIRS[cl.d][0], c = cl.c + DIRS[cl.d][1]; while (r >= 0 && r < h && c >= 0 && c < w) { out.push(r * w + c); r += DIRS[cl.d][0]; c += DIRS[cl.d][1]; } return out; });
  /* for each cell, clues whose ray includes it */
  const cellRays = Array.from({ length: N }, () => []);
  rays.forEach((ray, ci) => ray.forEach(id => cellRays[id].push(ci)));
  /* remaining unassigned ray cells after index i (row-major) for bound pruning */
  const order = []; for (let id = 0; id < N; id++) if (clueCell[id] < 0) order.push(id);
  const posInOrder = new Int32Array(N).fill(-1);
  order.forEach((id, i) => { posInOrder[id] = i; });
  /* for each clue: sorted ray positions in order */
  const rayOrderPos = rays.map(ray => ray.map(id => posInOrder[id]).filter(p => p >= 0).sort((a, b) => a - b));

  const shaded = new Uint8Array(N);
  const cnts = new Int32Array(clues.length);
  const solutions = [];
  let nodes = 0; let capped = false; let done2 = false;
  /* chessboard balance: any Hamiltonian cycle needs equal A/B free cells, so the
   * shading's colour sum is pinned: sum(sign of shaded) == sum(sign of all non-clue).
   * degree: shading only reduces free degrees — a settled-unshaded cell below degree 2
   * can never recover, so that branch is dead. */
  const sign = new Int8Array(N);
  let TOTAL = 0;
  for (let id = 0; id < N; id++) { sign[id] = ((Math.floor(id / w) + (id % w)) % 2 === 0) ? 1 : -1; if (clueCell[id] < 0) TOTAL += sign[id]; }
  const freeDeg = new Int8Array(N);
  for (let id = 0; id < N; id++) {
    if (clueCell[id] >= 0) continue;
    const r = Math.floor(id / w), c = id % w; let d = 0;
    if (r > 0 && clueCell[id - w] < 0) d++;
    if (r < h - 1 && clueCell[id + w] < 0) d++;
    if (c > 0 && clueCell[id - 1] < 0) d++;
    if (c < w - 1 && clueCell[id + 1] < 0) d++;
    freeDeg[id] = d;
  }
  let cur = 0; /* sum of signs of shaded so far */
  /* undecided A/B counts per prefix, for the balance range prune */
  const remA = new Int32Array(order.length + 1);
  const remB = new Int32Array(order.length + 1);
  remA[order.length] = 0; remB[order.length] = 0;
  for (let i = order.length - 1; i >= 0; i--) {
    remA[i] = remA[i + 1] + (sign[order[i]] === 1 ? 1 : 0);
    remB[i] = remB[i + 1] + (sign[order[i]] === -1 ? 1 : 0);
  }

  function countHCFor(shadedArr) {
    /* build blocked set: clue cells + shaded */
    const blocked = new Set();
    clues.forEach(cl => blocked.add(cl.r + ',' + cl.c));
    shadedArr.forEach(id => blocked.add(Math.floor(id / w) + ',' + (id % w)));
    const g = gridGraph(w, h, blocked);
    /* the game (checkWin) accepts ANY single cycle over the free cells — every
     * Hamiltonian cycle covers the same cell set, so cycle multiplicity is invisible
     * to the player. Existence is all a leaf needs. */
    const res = solveHC(g, 1, hcBudget);
    return res;
  }

  function rec(oi) {
    if (capped || done2) return;
    if (++nodes > budgetNodes) { capped = true; return; }
    if ((nodes & 511) === 0 && Date.now() > ENUM_DEADLINE) { capped = true; return; }
    if (oi === order.length) {
      /* full assignment: verify all clue counts (should hold by construction) then HC */
      const shadedArr = [];
      for (let id = 0; id < N; id++) if (shaded[id]) shadedArr.push(id);
      const res = countHCFor(shadedArr);
      if (res.CAP) { capped = true; return; }
      if (res.count > 0) {
        solutions.push({ shaded: shadedArr, hcCount: res.count });
        if (solutions.length >= 4) { done2 = true; return; } /* enough competitors for the refinement signal */
      }
      return;
    }
    const id = order[oi];
    const r = Math.floor(id / w), c = id % w;
    /* balance feasibility: future shadings move cur by +1 (A) or -1 (B) or 0 (unshaded);
     * final cur must equal TOTAL exactly */
    {
      const gap = TOTAL - cur;
      if (gap > remA[oi] || -gap > remB[oi]) return;
    }
    /* try shaded */
    let canShade = true;
    if (r > 0 && shaded[id - w]) canShade = false;
    if (c > 0 && shaded[id - 1]) canShade = false;
    if (canShade) {
      let ok = true;
      for (const ci of cellRays[id]) { if (cnts[ci] + 1 > clues[ci].n) { ok = false; break; } }
      if (ok) {
        /* degree: shading id lowers neighbours' free degree */
        let dead = false;
        const nbs = [];
        if (r > 0 && clueCell[id - w] < 0) nbs.push(id - w);
        if (r < h - 1 && clueCell[id + w] < 0) nbs.push(id + w);
        if (c > 0 && clueCell[id - 1] < 0) nbs.push(id - 1);
        if (c < w - 1 && clueCell[id + 1] < 0) nbs.push(id + 1);
        for (const nb of nbs) { freeDeg[nb]--; if (freeDeg[nb] < 2 && !shaded[nb] && posInOrder[nb] < oi) dead = true; }
        if (!dead) {
          for (const ci of cellRays[id]) cnts[ci]++;
          shaded[id] = 1; cur += sign[id];
          rec(oi + 1);
          shaded[id] = 0; cur -= sign[id];
          for (const ci of cellRays[id]) cnts[ci]--;
        }
        for (const nb of nbs) freeDeg[nb]++;
      }
    }
    if (capped) return;
    /* try unshaded: check each clue covering id can still reach n with remaining cells */
    let ok = true;
    for (const ci of cellRays[id]) {
      if (cnts[ci] === clues[ci].n) continue; /* already exact — fine */
      /* need more shaded among ray cells later than id */
      const rop = rayOrderPos[ci];
      let later = 0;
      for (let x = 0; x < rop.length; x++) if (rop[x] > oi) later++;
      if (cnts[ci] + later < clues[ci].n) { ok = false; break; }
    }
    if (ok) rec(oi + 1);
  }
  rec(0);
  const out = { solutions, explored: nodes };
  if (done2) out.multi = true; /* >=4 found (definitely not unique) */
  if (capped) out.capped = true; /* budget exhausted with <2 solutions: proof incomplete */
  return out;
}

/* ---------- level construction ---------- */
function clueCountInDir(w, h, shadeSet, r, c, d) {
  let cnt = 0; let nr = r + DIRS[d][0], nc = c + DIRS[d][1];
  while (nr >= 0 && nr < h && nc >= 0 && nc < w) { if (shadeSet.has(nr + ',' + nc)) cnt++; nr += DIRS[d][0]; nc += DIRS[d][1]; }
  return cnt;
}

/* Greedy incremental hole placement: start from the full grid (Hamiltonian cycle always
 * exists there) and add holes one at a time, each accepted only when the propagation
 * solver still finds a cycle over the remainder (instant checks). Chessboard color
 * balance is kept feasible throughout and exactly zero at the end (necessary for any
 * cycle). Returns {holes, cycle} or null. */
function placeHoles(w, h, totalHoles, rng) {
  /* best-effort: add balanced opposite-color pairs while cycles still exist */
  const cells = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push([r, c]);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
  const used = new Set();
  const blocked = new Set();
  let cycle = null;
  let placed = 0;
  let i = 0;
  let stall = 0;
  while (placed < totalHoles && stall < cells.length) {
    while (i < cells.length && used.has(cells[i][0] + ',' + cells[i][1])) i++;
    if (i >= cells.length) break;
    const c1 = cells[i];
    const col1 = (c1[0] + c1[1]) % 2;
    /* try up to 6 distinct opposite-color partners for c1 */
    /* phase 1 (placed < 60% of target): accept while ANY Hamiltonian cycle exists.
     * phase 2: accept only when exactly ONE cycle remains — clue directions can never
     * separate multiple cycles of the same shading, so loop-uniqueness must be built
     * into the geometry itself. */
    let success = false;
    let tried = 0;
    for (let j2 = i + 1; j2 < cells.length && tried < 6 && !success; j2++) {
      const c2 = cells[j2];
      if (used.has(c2[0] + ',' + c2[1]) || (c2[0] + c2[1]) % 2 === col1) continue;
      tried++;
      blocked.add(c1[0] + ',' + c1[1]);
      blocked.add(c2[0] + ',' + c2[1]);
      const g = gridGraph(w, h, blocked);
      const res = solveHC(g, 1, 250000); /* existence check only (killCycles enforces uniqueness later) */
      const ok1 = !!res.cycle && res.cycle.length === g.n;
      if (ok1) {
        cycle = res.cycle.map(ix => g.cells[ix]);
        used.add(c1[0] + ',' + c1[1]);
        used.add(c2[0] + ',' + c2[1]);
        placed += 2;
        success = true;
        stall = 0;
      } else {
        blocked.delete(c1[0] + ',' + c1[1]);
        blocked.delete(c2[0] + ',' + c2[1]);
        used.add(c2[0] + ',' + c2[1]); /* retire this partner for now */
        stall++;
      }
    }
    if (!success) used.add(c1[0] + ',' + c1[1]); /* c1 hopeless with several partners */
    i++;
  }
  return { holes: Array.from(blocked).map(k => k.split(',').map(Number)), cycle, placed };
}

/* Post-pass: while the free graph admits >1 Hamiltonian cycle, take a witness second
 * cycle C2 and block TWO cells that lie on C2 but not on the intended cycle C1 (C1
 * therefore survives, C2 dies; chessboard balance is preserved by pairing). Each extra
 * cell becomes a clue. Returns {blocked, cycle} of a uniquely-cycled graph or null. */
function killCycles(w, h, blocked, cycle1, rng, capNodes) {
  let C1 = new Set(cycle1.map(p => p[0] + ',' + p[1]));
  let cycle = cycle1;
  for (let iter = 0; iter < 30; iter++) {
    const g = gridGraph(w, h, blocked);
    const res = solveHC(g, 2, capNodes);
    if (res.CAP) return null;
    if (res.count === 0) return null; /* C1 must always survive; solver disagrees -> bail */
    if (res.count === 1) {
      if (res.cycle) cycle = res.cycle.map(ix => g.cells[ix]);
      return { blocked, cycle };
    }
    /* res.count >= 2: use the recorded witness cycles */
    const witnesses = res.cycles || [];
    let pair = null;
    for (const cyc of witnesses) {
      const cells = cyc.map(ix => g.cells[ix]);
      if (cells.length !== g.n) continue; /* paranoia: every solution covers all free cells */
      const diff = cells.filter(p => !C1.has(p[0] + ',' + p[1]));
      if (diff.length >= 2) { pair = [diff[Math.floor(rng() * diff.length)], diff[Math.floor(rng() * diff.length)]]; 
        if (pair[0] === pair[1]) { pair[1] = diff.find(p => p !== pair[0]); } 
        if (pair[0] && pair[1] && pair[0] !== pair[1]) break; pair = null; }
    }
    if (!pair) return null;
    blocked.add(pair[0][0] + ',' + pair[0][1]);
    blocked.add(pair[1][0] + ',' + pair[1][1]);
  }
  return null;
}

function buildAttempt(w, h, ns, kClues, rng) {
  let total = ns + kClues;
  if (total < 4) total = 4;
  if (total % 2) total--;
  const ph = placeHoles(w, h, total, rng);
  if (!ph.cycle) return null;
  const holes = ph.holes;
  if (holes.length < ns + 4) return null; /* too few holes for shaded+minimal clues */
  const phCycle = ph.cycle;
  /* shaded: ns of the holes, non-adjacent, chosen randomly */
  let shaded = null;
  for (let t = 0; t < 200; t++) {
    const idx = holes.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const q = idx[i]; idx[i] = idx[j]; idx[j] = q; }
    const pick = idx.slice(0, ns);
    const set = new Set(pick.map(i => holes[i][0] + ',' + holes[i][1]));
    let ok = true;
    for (const d of DIRLIST) for (const p of pick) { const nr = holes[p][0] + DIRS[d][0], nc = holes[p][1] + DIRS[d][1]; if (set.has(nr + ',' + nc)) ok = false; }
    if (ok) { shaded = pick.map(i => holes[i]); break; }
  }
  if (!shaded) return null;
  const shadeSet = new Set(shaded.map(x => x[0] + ',' + x[1]));
  const clueCells = holes.filter(hh => !shadeSet.has(hh[0] + ',' + hh[1]));
  if (clueCells.length < 4) return null;
  /* clue directions: among directions with a non-zero count (preferred for solvability)
   * pick the one whose ray covers the most still-uncovered free cells — full ray
   * coverage makes the uniqueness enumeration tractable (every cell count-bound). */
  const covered = new Set();
  shadeSet.forEach(k => covered.add(k));
  const clues = clueCells.map(cl => {
    const opts = DIRLIST.map(d => {
      const n = clueCountInDir(w, h, shadeSet, cl[0], cl[1], d);
      const ray = [];
      let nr = cl[0] + DIRS[d][0], nc = cl[1] + DIRS[d][1];
      while (nr >= 0 && nr < h && nc >= 0 && nc < w) { ray.push(nr + ',' + nc); nr += DIRS[d][0]; nc += DIRS[d][1]; }
      const fresh = ray.filter(k => !covered.has(k)).length;
      return { d, n, fresh, ray };
    });
    const nz = opts.filter(x => x.n > 0);
    const pool = nz.length ? nz : opts;
    pool.sort((a, b) => b.fresh - a.fresh);
    const pick = pool[0];
    pick.ray.forEach(k => covered.add(k));
    return { r: cl[0], c: cl[1], d: pick.d, n: pick.n };
  });
  return { w, h, clues, shaded, hcPath: phCycle, graphN: phCycle.length };
}

/* After building an attempt, iteratively re-aim clue directions to kill competing
 * solutions: solve, and while >1 solution exists, find a clue cell whose ray counts
 * differ between the first two solutions and point that clue along such a ray
 * (value recomputed from the intended shading). Returns final clues or null. */
function rayCount(w, h, shadeSet, r, c, d) { return clueCountInDir(w, h, shadeSet, r, c, d); }

function refineUnique(w, h, attempt, nodeCap, hcBudget) {
  const intended = new Set(attempt.shaded.map(x => x[0] + ',' + x[1]));
  const clues = attempt.clues.map(cl => ({ r: cl.r, c: cl.c, d: cl.d, n: cl.n }));
  for (let iter = 0; iter < 12; iter++) {
    ENUM_DEADLINE = Date.now() + (600 + w * h * 12); /* 5x6: 0.96s, 8x8: 1.37s, 12x12: 2.3s */
    let sol = enumerateSolutions(w, h, clues, Math.min(nodeCap, 1200000), hcBudget);
    /* near-unique candidate: pay ONE big-budget exhaustive pass for the real proof */
    if (sol.capped && sol.solutions.length === 1) {
      ENUM_DEADLINE = Date.now() + 9000;
      const sol2 = enumerateSolutions(w, h, clues, 9000000, hcBudget);
      if (!sol2.capped && sol2.solutions.length === 1) sol = sol2;
    }
    if (sol.capped && sol.solutions.length < 2) return null; /* proof incomplete */
    if (sol.solutions.length === 0) return null; /* intended always satisfies -> solver bug, drop */
    if (sol.solutions.length === 1) {
      const got = new Set(sol.solutions[0].shaded.map(id => Math.floor(id / w) + ',' + (id % w)));
      if (got.size !== intended.size) return null;
      for (const k of intended) if (!got.has(k)) return null;
      if (!(sol.solutions[0].hcCount >= 1)) return null; /* intended shading must admit at least one loop */
      return clues;
    }
    /* set-cover greedy: rank (clue,dir) by how many observed competitors it kills
     * (value always taken from the intended shading) and apply the two best on
     * distinct clues per round */
    const rank = [];
    for (let ci = 0; ci < clues.length; ci++) {
      const cl = clues[ci];
      for (const d of DIRLIST) {
        const want = rayCount(w, h, intended, cl.r, cl.c, d);
        let kill = 0;
        for (const su of sol.solutions) {
          const sc = new Set(su.shaded);
          if (rayCount(w, h, sc, cl.r, cl.c, d) !== want) kill++;
        }
        rank.push({ ci, d, kill });
      }
    }
    rank.sort((a, b) => b.kill - a.kill);
    if (!rank.length || rank[0].kill <= 0) return null; /* nothing separates any competitor */
    const seenClues = new Set();
    let applied = 0;
    for (const rk of rank) {
      if (seenClues.has(rk.ci)) continue;
      if (rk.kill <= 0) break;
      seenClues.add(rk.ci);
      const cl = clues[rk.ci];
      cl.d = rk.d;
      cl.n = rayCount(w, h, intended, cl.r, cl.c, rk.d);
      applied++;
      if (applied >= 2) break;
    }
    if (!applied) return null;
  }
  return null;
}

function run() {
  const outIdx = process.argv.indexOf('--out');
  const outPath = outIdx >= 0 ? process.argv[outIdx + 1] : OUT_DEFAULT;
  const onlyIdx = process.argv.indexOf('--only');
  if (onlyIdx >= 0) {
    const keep = process.argv[onlyIdx + 1].split(',').map(x => parseInt(x, 10));
    for (let ci = CONFIGS.length - 1; ci >= 0; ci--) if (!keep.includes(ci)) CONFIGS.splice(ci, 1);
    /* renumber indices deterministically by original position */
    CONFIGS.origIndex = keep;
  }
  const saltIdx = process.argv.indexOf('--salt');
  const SALT = saltIdx >= 0 ? (parseInt(process.argv[saltIdx + 1], 10) || 0) : 0;
  const dailyIdx = process.argv.indexOf('--daily');
  const dailyN = dailyIdx >= 0 ? parseInt(process.argv[dailyIdx + 1], 10) || 0 : 0;
  if (dailyN > 0) {
    if (process.argv.includes('--only-daily')) CONFIGS.length = 0;
    for (let d = 0; d < dailyN; d++) CONFIGS.push({ w: 8, h: 8, ns: 5 + (d % 3), par: 240 });
  }
  const LEVEL_BUDGET_MS = 90000;
  const results = [];
  const report = [];
  for (let i = 0; i < CONFIGS.length; i++) {
    const cfg = CONFIGS[i];
    const t0 = Date.now();
    let level = null; let attempts = 0; let nsUsed = cfg.ns;
    const nsPlan = [cfg.ns, cfg.ns - 1, cfg.ns + 1, cfg.ns - 2, cfg.ns + 2, cfg.ns - 3, cfg.ns + 3, cfg.ns - 4];
    const kPlan = [0, 1, -2, 2, -3, 3, -4, 4];
    outer:
    for (let round = 0; round < nsPlan.length && !level; round++) {
      let ns = Math.max(2, nsPlan[round]);
      if (cfg.w * cfg.h >= 64) ns = Math.min(ns, 4); /* uniqueness enumeration cost scales combinatorially with shaded count */
      let kBase = Math.min(Math.max(5, Math.round(ns * 1.2) + 2 + Math.floor(cfg.w * cfg.h / 72)), 16);
      if (cfg.w * cfg.h <= 48) kBase = Math.max(kBase, 8);
      if (cfg.w * cfg.h >= 64) kBase = Math.max(kBase, ns + 9); /* big boards: denser clues -> enumerable uniqueness */
      const kClues = Math.max(5, kBase + kPlan[round]);
      console.error('L' + (i + 1) + ' round ' + round + ' ns=' + ns + ' k=' + kClues);
      for (let att = 0; att < 60; att++) {
        if (Date.now() - t0 > 300000) break outer; /* hard per-level cap */
        if (Date.now() - t0 > LEVEL_BUDGET_MS * (round + 1)) break; /* this round's budget done -> next round params */
        attempts++;
        const keepOrig = CONFIGS.origIndex || null;
        const rng = mulberry32(9137 + i * 7919 + att * 104729 + ns * 31 + SALT * 7907 + (keepOrig ? keepOrig[i] * 1299709 : 0));
        const cand = buildAttempt(cfg.w, cfg.h, ns, kClues, rng);
        if (!cand) continue;
        /* independent solve of the CLUE puzzle only, with iterative clue refinement */
        const clues = refineUnique(cfg.w, cfg.h, cand, 2500000, Math.max(400000, cfg.w * cfg.h * 12000));
        if (!clues) continue;
        level = { w: cfg.w, h: cfg.h, par: cfg.par, clues, shaded: cand.shaded, hc: cand.hcPath };
        nsUsed = ns;
        break;
      }
    }
    const ms = Date.now() - t0;
    if (!level) {
      report.push({ idx: i, cfg, ok: false, attempts, ms });
      results.push(null);
      console.error('FAIL level ' + (i + 1) + ' (' + cfg.w + 'x' + cfg.h + ') after ' + attempts + ' attempts, ' + ms + 'ms');
    } else {
      results.push(level);
      report.push({ idx: i, cfg, ok: true, attempts, ms, ns: nsUsed, clues: level.clues.length, loopCells: level.hc.length, uniqProof: 'solver enumerated all shadings satisfying clues; exactly 1 with a Hamiltonian cycle (cycle itself unique)' });
      console.error('ok L' + (i + 1) + ' ' + cfg.w + 'x' + cfg.h + ' ns=' + nsUsed + ' clues=' + level.clues.length + ' loop=' + level.hc.length + ' attempts=' + attempts + ' ' + ms + 'ms');
    }
  }
  const okCount = results.filter(Boolean).length;
  if (okCount < CONFIGS.length) {
    console.error('GENERATION INCOMPLETE: ' + okCount + '/' + CONFIGS.length);
    process.exit(1);
  }
  const payload = { generated: results, report };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload));
  /* compact embed form: shaded/hc as [r,c] pairs, clues minimal */
  const embed = results.map(L => ({ w: L.w, h: L.h, par: L.par, clues: L.clues, shaded: L.shaded, hc: L.hc }));
  fs.writeFileSync(outPath + '.embed.js', 'var STATIC_LV=' + JSON.stringify(embed) + ';\n');
  console.log(JSON.stringify({ levels: embed.length, out: outPath, reportMs: report.map(r => r.ms) }));
}
run();
