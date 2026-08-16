#!/usr/bin/env node
/* Yajilin offline level generator — v2 (ENGINE-TRUE MODEL).
 *
 * The engine's checkWin (yajilin/index.html) defines the real puzzle:
 *   1. every arrow clue must see exactly n shaded cells in its ray (over the
 *      PLAYER's shading);
 *   2. shaded cells pairwise non-adjacent;
 *   3. every non-shaded non-clue cell must be loop-marked;
 *   4. every loop-marked cell must have EXACTLY 2 orthogonally adjacent
 *      loop-marked cells  (SET-adjacency degree, not cycle-edge degree!);
 *   5. all loop cells form one connected component.
 * Rules 3+4+5 mean the free region (board minus clues minus the player's
 * shading) must be a single INDUCED ("thin", non-self-touching) cycle in the
 * grid graph. The shipped runtime generator was incompatible with this by
 * construction (it found a Hamiltonian edge-cycle over all non-shaded cells
 * and then sprinkled clues onto it, breaking the thin-cycle invariant), which
 * is why boards were unsolvable and the unbounded DFS froze the tab.
 *
 * This generator builds puzzles for the REAL rules:
 *   a. genCycle: randomized DFS grows an induced cycle C (self-avoiding,
 *      non-self-touching closed path) covering >= cov fraction of the board.
 *   b. Holes H = board - C; ns pairwise non-adjacent hole cells become the
 *      intended shading; ALL remaining holes become clues (a hole that is
 *      neither shaded nor clue would have to sit on the cycle — impossible).
 *   c. Clue directions chosen coverage-aimed (prefer informative rays).
 *   d. enumerateSolutions: independent exhaustive solver (ray-count bounds,
 *      shaded-adjacency, incremental degree-2 pruning, thin-cycle leaf check)
 *      proves the intended shading is the UNIQUE solution.
 *   e. refineUnique: set-cover re-aiming of clue directions until unique.
 *
 * Output: JSON {generated, configs, levels, reportMs} + <out>.embed.js with
 * `var STATIC_LV=[...]` (entries {w,h,par,clues,shaded,hc}).
 * Usage: node gen-yajilin-levels.js [--out file] [--only i,j] [--salt N]
 *        [--daily N --only-daily]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const OUT_DEFAULT = path.join(REPO, '_optimization', 'evidence', 'yajilin', 'gen-levels.json');

/* level board configs — mirrors index.html LV (w,h,ns,par) */
const CONFIGS = [
  /* tractable envelope: 5x6..8x8; difficulty via size, ns and par time. */
  { w: 5, h: 6, ns: 2, par: 60 }, { w: 5, h: 6, ns: 2, par: 70 }, { w: 5, h: 6, ns: 3, par: 80 },
  { w: 5, h: 6, ns: 3, par: 90 }, { w: 5, h: 6, ns: 3, par: 100 }, { w: 5, h: 6, ns: 4, par: 110 },
  { w: 6, h: 6, ns: 3, par: 120 }, { w: 6, h: 6, ns: 3, par: 130 }, { w: 6, h: 6, ns: 4, par: 140 },
  { w: 6, h: 6, ns: 4, par: 150 }, { w: 6, h: 6, ns: 4, par: 160 }, { w: 6, h: 6, ns: 4, par: 170 },
  { w: 6, h: 8, ns: 3, par: 180 }, { w: 6, h: 8, ns: 3, par: 195 }, { w: 6, h: 8, ns: 4, par: 210 },
  { w: 6, h: 8, ns: 4, par: 225 }, { w: 6, h: 8, ns: 4, par: 240 }, { w: 6, h: 8, ns: 4, par: 255 },
  { w: 8, h: 8, ns: 4, par: 270 }, { w: 8, h: 8, ns: 4, par: 300 }, { w: 8, h: 8, ns: 4, par: 330 },
  { w: 8, h: 8, ns: 4, par: 360 }, { w: 8, h: 8, ns: 4, par: 400 }, { w: 8, h: 8, ns: 4, par: 440 },
  { w: 8, h: 8, ns: 4, par: 480 }, { w: 8, h: 8, ns: 4, par: 520 }, { w: 8, h: 8, ns: 4, par: 550 },
  { w: 8, h: 8, ns: 4, par: 580 }, { w: 8, h: 8, ns: 4, par: 610 }, { w: 8, h: 8, ns: 4, par: 630 }
];

const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
const DIRLIST = ['U', 'D', 'L', 'R'];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- induced ("thin") cycle generation ---------- */
/* Randomized DFS over self-avoiding, non-self-touching paths that closes into
 * a cycle. adjCount[v] = number of path cells orthogonally adjacent to v.
 * Candidate v (a neighbour of the head) is extendable iff its only path
 * neighbour is the head — OR it has exactly two path neighbours, head and the
 * START s (v is then a potential closing cell; such branches can only ever
 * close at v itself, anything past v can never close, which the closure test
 * rejects automatically). Closing head h onto s is valid iff h adj s AND
 * adjCount[s]===2 (exactly path[1] and h touch s) AND adjCount[path[1]]===2
 * (h does not also touch path[1]). */
function genCycle(w, h, rng, minLen, nodeBudget) {
  const n = w * h;
  const nbs = new Array(n);
  for (let i = 0; i < n; i++) {
    const r = (i / w) | 0, c = i % w, a = [];
    if (r > 0) a.push(i - w);
    if (r < h - 1) a.push(i + w);
    if (c > 0) a.push(i - 1);
    if (c < w - 1) a.push(i + 1);
    nbs[i] = a;
  }
  let best = null, nodes = 0;
  const starts = [];
  for (let i = 0; i < n; i++) starts.push(i);
  for (let rep = 0; rep < 6 && (!best || best.length < minLen); rep++) {
    for (let i = starts.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = starts[i]; starts[i] = starts[j]; starts[j] = t; }
    for (const s of starts) {
      if (best && best.length >= minLen) break;
      if (nodes > nodeBudget) break;
      const adjCount = new Int8Array(n);
      const inPath = new Uint8Array(n);
      const path = [s]; inPath[s] = 1;
      for (const v of nbs[s]) adjCount[v] = 1;
      const rec = (head) => {
        const L = path.length;
        if (L >= 4 && nbs[head].includes(s) && adjCount[s] === 2 && adjCount[path[1]] === 2) {
          if (!best || L > best.length) best = path.slice();
        }
        if (nodes > nodeBudget) return;
        const cands = nbs[head].filter(v => !inPath[v] && (adjCount[v] === 1 || (adjCount[v] === 2 && nbs[v].includes(s))));
        for (let i = cands.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = cands[i]; cands[i] = cands[j]; cands[j] = t; }
        for (const v of cands) {
          if (nodes > nodeBudget) return;
          if (best && best.length >= minLen && nodes > 8192) return;
          nodes++;
          path.push(v); inPath[v] = 1;
          for (const u of nbs[v]) adjCount[u]++;
          rec(v);
          path.pop(); inPath[v] = 0;
          for (const u of nbs[v]) adjCount[u]--;
        }
      };
      rec(s);
      if (nodes > nodeBudget) break;
    }
  }
  return best; /* array of cell ids in cycle order, or null */
}

/* ---------- attempt construction ---------- */
function buildAttempt(w, h, ns, rng, covMin) {
  const n = w * h;
  const minLen = Math.max(8, Math.ceil(covMin * n));
  const cyc = genCycle(w, h, rng, minLen, 300000);
  if (!cyc || cyc.length < Math.max(8, Math.ceil(0.4 * n))) return null;
  const cycSet = new Set(cyc);
  const holes = [];
  for (let i = 0; i < n; i++) if (!cycSet.has(i)) holes.push(i);
  /* pick ns pairwise non-adjacent hole cells as the intended shading */
  const holeArr = holes.slice();
  for (let i = holeArr.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = holeArr[i]; holeArr[i] = holeArr[j]; holeArr[j] = t; }
  const shadeSet = new Set();
  const shadeAdj = new Set();
  for (const cand of holeArr) {
    if (shadeSet.size >= ns) break;
    if (shadeAdj.has(cand)) continue;
    shadeSet.add(cand);
    const r = (cand / w) | 0, c = cand % w;
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < h && nc >= 0 && nc < w) shadeAdj.add(nr * w + nc);
    }
  }
  if (shadeSet.size < ns) return null;
  /* every remaining hole becomes a clue */
  const clueCells = holes.filter(x => !shadeSet.has(x));
  if (clueCells.length < 3) return null;
  /* coverage-aimed direction choice */
  const covered = new Uint8Array(n);
  const clues = [];
  for (const cc of clueCells) {
    const r = (cc / w) | 0, c = cc % w;
    const opts = [];
    for (const d of DIRLIST) {
      const [dr, dc] = DIRS[d];
      let rr = r + dr, cc2 = c + dc, cnt = 0, fresh = 0;
      const ray = [];
      while (rr >= 0 && rr < h && cc2 >= 0 && cc2 < w) {
        const id = rr * w + cc2; ray.push(id);
        if (shadeSet.has(id)) cnt++;
        if (!covered[id]) fresh++;
        rr += dr; cc2 += dc;
      }
      opts.push({ d, n: cnt, fresh, ray });
    }
    const nonZero = opts.filter(o => o.n > 0);
    const pool = nonZero.length ? nonZero : opts;
    pool.sort((a, b) => b.fresh - a.fresh);
    const pick = pool[0];
    clues.push({ r, c, d: pick.d, n: pick.n });
    for (const id of pick.ray) covered[id] = 1;
  }
  const shaded = [...shadeSet].sort((a, b) => a - b).map(id => [(id / w) | 0, id % w]);
  const hc = cyc.map(id => [(id / w) | 0, id % w]);
  return { w, h, clues, shaded, hc, holes: holes.length };
}

/* ---------- independent exhaustive solver (uniqueness proof) ---------- */
let ENUM_DEADLINE = 0;

function enumerateSolutions(w, h, clues, nodeCap) {
  const n = w * h;
  const clueSet = new Set(clues.map(c => c.r * w + c.c));
  const order = [];
  for (let i = 0; i < n; i++) if (!clueSet.has(i)) order.push(i);
  const posInOrder = new Int32Array(n).fill(-1);
  order.forEach((id, oi) => { posInOrder[id] = oi; });
  const nbs = new Array(n);
  for (let i = 0; i < n; i++) {
    const r = (i / w) | 0, c = i % w, a = [];
    if (r > 0 && !clueSet.has(i - w)) a.push(i - w);
    if (r < h - 1 && !clueSet.has(i + w)) a.push(i + w);
    if (c > 0 && !clueSet.has(i - 1)) a.push(i - 1);
    if (c < w - 1 && !clueSet.has(i + 1)) a.push(i + 1);
    nbs[i] = a;
  }
  /* per-clue ray cells as sorted order-positions; cnt = shaded so far;
   * hi = index of first ray position not yet decided */
  const clueRays = clues.map(cl => {
    const [dr, dc] = DIRS[cl.d];
    let rr = cl.r + dr, cc = cl.c + dc;
    const pos = [];
    while (rr >= 0 && rr < h && cc >= 0 && cc < w) {
      const p = posInOrder[rr * w + cc];
      if (p >= 0) pos.push(p);
      rr += dr; cc += dc;
    }
    pos.sort((a, b) => a - b);
    return { n: cl.n, pos, cnt: 0, hi: 0 };
  });
  const raysOf = new Map();
  clueRays.forEach((cr, ci) => cr.pos.forEach(p => {
    if (!raysOf.has(p)) raysOf.set(p, []);
    raysOf.get(p).push(ci);
  }));
  const state = new Int8Array(order.length); /* 0 undec 1 shaded 2 free */
  const freeDeg = new Int8Array(n);           /* decided-free neighbour count */
  const undecNbr = new Int8Array(n);
  for (let i = 0; i < n; i++) if (!clueSet.has(i)) undecNbr[i] = nbs[i].length;
  const solutions = [];
  let nodes = 0, capped = false, done2 = false;

  function leafOk() {
    const freeCells = [];
    for (let oi = 0; oi < order.length; oi++) if (state[oi] === 2) freeCells.push(order[oi]);
    if (freeCells.length < 4) return false;
    const mark = new Uint8Array(n);
    const st = [freeCells[0]]; mark[freeCells[0]] = 1; let vis = 1;
    while (st.length) {
      const u = st.pop();
      for (const v of nbs[u]) if (!mark[v] && state[posInOrder[v]] === 2) { mark[v] = 1; vis++; st.push(v); }
    }
    return vis === freeCells.length;
  }

  function dfs(oi) {
    if (done2) return;
    if (++nodes > nodeCap || (nodes % 256 === 0 && Date.now() > ENUM_DEADLINE)) { capped = true; done2 = true; return; }
    if (oi === order.length) {
      if (leafOk()) {
        solutions.push({ shaded: order.filter((id, k) => state[k] === 1) });
        if (solutions.length >= 4) done2 = true;
      }
      return;
    }
    const id = order[oi];
    const myRays = raysOf.get(oi) || [];
    /* --- SHADED branch --- */
    let okShade = true;
    for (const nb2 of nbs[id]) if (state[posInOrder[nb2]] === 1) { okShade = false; break; }
    if (okShade) for (const ci of myRays) if (clueRays[ci].cnt + 1 > clueRays[ci].n) { okShade = false; break; }
    if (okShade) {
      state[oi] = 1;
      for (const ci of myRays) clueRays[ci].cnt++;
      let ok = true;
      for (const nb2 of nbs[id]) {
        undecNbr[nb2]--;
        if (state[posInOrder[nb2]] === 2 && freeDeg[nb2] + undecNbr[nb2] < 2) ok = false;
      }
      if (ok) {
        for (const ci of myRays) { const cr = clueRays[ci]; while (cr.hi < cr.pos.length && cr.pos[cr.hi] <= oi) cr.hi++; }
        dfs(oi + 1);
        for (const ci of myRays) { const cr = clueRays[ci]; while (cr.hi > 0 && cr.pos[cr.hi - 1] > oi) cr.hi--; }
      }
      for (const nb2 of nbs[id]) undecNbr[nb2]++;
      for (const ci of myRays) clueRays[ci].cnt--;
      state[oi] = 0;
    }
    /* --- FREE branch --- */
    let okFree = true;
    for (const ci of myRays) {
      const cr = clueRays[ci];
      const rem = cr.pos.length - cr.hi; /* ray cells at position >= oi still open */
      if (cr.cnt + rem < cr.n) { okFree = false; break; }
    }
    if (okFree) {
      state[oi] = 2;
      const bumped = [];
      let ok = true;
      for (const nb2 of nbs[id]) undecNbr[nb2]--;
      for (const nb2 of nbs[id]) {
        if (state[posInOrder[nb2]] === 2) {
          freeDeg[id]++; freeDeg[nb2]++; bumped.push(nb2);
          if (freeDeg[id] > 2 || freeDeg[nb2] > 2) { ok = false; break; }
        }
      }
      if (ok && freeDeg[id] + undecNbr[id] < 2) ok = false; /* can never reach degree 2 */
      if (ok) for (const nb2 of nbs[id]) if (state[posInOrder[nb2]] === 2 && freeDeg[nb2] + undecNbr[nb2] < 2) ok = false;
      if (ok) {
        for (const ci of myRays) { const cr = clueRays[ci]; while (cr.hi < cr.pos.length && cr.pos[cr.hi] <= oi) cr.hi++; }
        dfs(oi + 1);
        for (const ci of myRays) { const cr = clueRays[ci]; while (cr.hi > 0 && cr.pos[cr.hi - 1] > oi) cr.hi--; }
      }
      for (const nb2 of bumped) freeDeg[nb2]--;
      freeDeg[id] = 0; for (const nb2 of nbs[id]) if (state[posInOrder[nb2]] === 2) freeDeg[id]++;
      for (const nb2 of nbs[id]) undecNbr[nb2]++;
      state[oi] = 0;
    }
  }
  dfs(0);
  return { solutions, capped, multi: solutions.length >= 2, nodes };
}

/* ---------- clue refinement until unique ---------- */
function countRay(w, h, shadeSet, cl, d) {
  const [dr, dc] = DIRS[d];
  let rr = cl.r + dr, cc = cl.c + dc, cnt = 0;
  while (rr >= 0 && rr < h && cc >= 0 && cc < w) {
    if (shadeSet.has(rr * w + cc)) cnt++;
    rr += dr; cc += dc;
  }
  return cnt;
}

function refineUnique(w, h, attempt, nodeCap) {
  const intended = new Set(attempt.shaded.map(s => s[0] * w + s[1]));
  const cur = () => attempt.clues.map(c => ({ r: c.r, c: c.c, d: c.d, n: c.n }));
  for (let iter = 0; iter < 14; iter++) {
    ENUM_DEADLINE = Date.now() + (600 + w * h * 12);
    const sol = enumerateSolutions(w, h, attempt.clues, nodeCap);
    if (sol.capped && sol.solutions.length < 2) return null; /* unprovable within caps */
    if (sol.solutions.length === 0) return null;             /* generator inconsistency */
    if (sol.solutions.length === 1) {
      const got = sol.solutions[0].shaded;
      const match = got.length === intended.size && got.every(id => intended.has(id));
      return match ? cur() : null;
    }
    const comps = sol.solutions.filter(s => !(s.shaded.length === intended.size && s.shaded.every(id => intended.has(id))));
    const ranked = [];
    for (let i = 0; i < attempt.clues.length; i++) {
      const c = attempt.clues[i];
      for (const d of DIRLIST) {
        const nInt = countRay(w, h, intended, c, d);
        let kills = 0;
        for (const s of comps) {
          const sset = new Set(s.shaded);
          if (countRay(w, h, sset, c, d) !== nInt) kills++;
        }
        if (kills > 0) ranked.push({ i, d, n: nInt, kills });
      }
    }
    ranked.sort((a, b) => b.kills - a.kills);
    if (!ranked.length) return null;
    let applied = 0; const usedClue = new Set();
    for (const rk of ranked) {
      if (applied >= 2) break;
      if (usedClue.has(rk.i)) continue;
      attempt.clues[rk.i].d = rk.d; attempt.clues[rk.i].n = rk.n;
      usedClue.add(rk.i); applied++;
    }
  }
  return null;
}

/* ---------- run ---------- */
function run() {
  const outIdx = process.argv.indexOf('--out');
  const outPath = outIdx >= 0 ? process.argv[outIdx + 1] : OUT_DEFAULT;
  let SALT = 0;
  const saltIdx = process.argv.indexOf('--salt');
  if (saltIdx >= 0) SALT = parseInt(process.argv[saltIdx + 1], 10) || 0;
  const onlyIdx = process.argv.indexOf('--only');
  if (onlyIdx >= 0) {
    const keep = process.argv[onlyIdx + 1].split(',').map(x => parseInt(x, 10));
    for (let ci = CONFIGS.length - 1; ci >= 0; ci--) if (!keep.includes(ci)) CONFIGS.splice(ci, 1);
    CONFIGS.origIndex = keep;
  }
  const dailyIdx = process.argv.indexOf('--daily');
  if (dailyIdx >= 0 && process.argv.includes('--only-daily')) {
    const dailyN = parseInt(process.argv[dailyIdx + 1], 10) || 7;
    CONFIGS.length = 0;
    for (let d = 0; d < dailyN; d++) CONFIGS.push({ w: 8, h: 8, ns: 4, par: 240 });
  }
  const t00 = Date.now();
  const levels = [];
  const reportMs = [];
  let okCount = 0;
  outer:
  for (let i = 0; i < CONFIGS.length; i++) {
    const cfg = CONFIGS[i];
    const lvl = CONFIGS.origIndex ? CONFIGS.origIndex[i] : i;
    const t0 = Date.now();
    const nsPlan = [cfg.ns, cfg.ns - 1, cfg.ns + 1, cfg.ns - 2, cfg.ns + 2];
    const covPlan = [0.5, 0.45, 0.55, 0.42, 0.58];
    let done = null;
    let attempts = 0;
    for (let round = 0; round < nsPlan.length && !done; round++) {
      const ns = Math.max(2, nsPlan[round]);
      const cov = covPlan[round % covPlan.length];
      if (Date.now() - t0 > 90000) break;
      console.error(`L${lvl + 1} round ${round} ns=${ns} cov=${cov}`);
      for (let a = 0; a < 200 && !done; a++) {
        if (Date.now() - t0 > 90000) break;
        const seedBase = CONFIGS.origIndex ? CONFIGS.origIndex[i] : i;
        const rng = mulberry32((SALT * 7907 + seedBase * 1299709 + round * 7919 + a * 104729) >>> 0);
        const cand = buildAttempt(cfg.w, cfg.h, ns, rng, cov);
        attempts++;
        if (!cand) continue;
        const refined = refineUnique(cfg.w, cfg.h, cand, 2500000);
        if (refined) done = { w: cfg.w, h: cfg.h, par: cfg.par, clues: refined, shaded: cand.shaded, hc: cand.hc };
      }
    }
    if (done) {
      levels.push(done); okCount++;
      reportMs.push(Date.now() - t0);
      console.error(`ok L${lvl + 1} ${cfg.w}x${cfg.h} ns=${nsPlan[0]} clues=${done.clues.length} loop=${done.hc.length} holes=${cfg.w * cfg.h - done.hc.length} attempts=${attempts} ${Date.now() - t0}ms`);
    } else {
      console.error(`FAIL level #${lvl + 1} (${cfg.w}x${cfg.h}) after ${attempts} attempts, ${Date.now() - t0}ms`);
    }
    if (Date.now() - t00 > 1800000) { console.error('global time cap'); break outer; }
  }
  const payload = { generated: new Date().toISOString(), model: 'induced-cycle (engine checkWin rules 3-5)', configs: CONFIGS.map(c => ({ w: c.w, h: c.h, ns: c.ns, par: c.par })), levels, reportMs };
  if (okCount < CONFIGS.length) {
    console.error('GENERATION INCOMPLETE: ' + okCount + '/' + CONFIGS.length);
    process.exit(1);
  }
  fs.writeFileSync(outPath, JSON.stringify(payload));
  const embed = levels.map(L => ({ w: L.w, h: L.h, par: L.par, clues: L.clues, shaded: L.shaded, hc: L.hc }));
  fs.writeFileSync(outPath + '.embed.js', 'var STATIC_LV=' + JSON.stringify(embed) + ';\n');
  console.error(JSON.stringify({ levels: levels.length, out: outPath, reportMs }));
}
run();
