/**
 * R337 — shared Hidato solution counter (corrected + calibrated).
 *
 * Used by .audit/r337-hidato-uniqueness.js (catalog sweep) and
 * .audit/r337-hidato-decisive.js (real-engine proof).
 *
 * WHY A SHARED MODULE: the R337 v1 counter lived inside the sweep script and
 * was ALSO copied into the decisive probe, so one bug existed in two places.
 * Two copies of a solver is one bug waiting to diverge.
 *
 * THE v1 BUG (self-inflicted, Pitfall #67/#86 class): when a value had a clue
 * cell (whereMustGo[v] >= 0) the DFS used `[forced]` as the CANDIDATE LIST,
 * bypassing the adjacency filter. A forced clue cell that is not adjacent to
 * the previous cell was therefore accepted -> the counter emitted paths that
 * are NOT 8-adjacent, i.e. NOT valid Hidato solutions. The engine then
 * (correctly) rejected them, which is what produced v1's non-zero
 * "rivalRejected" counts: the rival was invalid, not the engine being wrong.
 *
 * FIX: the forced clue cell is a FILTER, not a replacement:
 *     cands = adj[cur] filtered by (unvisited) AND (clue==0 OR clue==v)
 *              AND (whereMustGo[v] < 0 OR cell == whereMustGo[v])
 * Every emitted path is re-validated by an INDEPENDENT validator.
 *
 * CALIBRATION (both directions, mandatory):
 *   POSITIVE  the engine's own stored path validates AND is found.
 *   NEGATIVE  an unconstrained grid yields MANY solutions (multiplicity
 *             is visible).
 *   NEGATIVE  a logically IMPOSSIBLE clue set yields 0 solutions and
 *             reports NOT-a-timeout.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function loadEngine(src) {
  const html = src || fs.readFileSync(path.join(ROOT, 'hidato/index.html'), 'utf8');
  function grab(name) {
    const re = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}', 'm');
    const m = html.match(re);
    if (!m) throw new Error('cannot extract ' + name);
    return m[0];
  }
  const ctx = { Math: Object.create(Math), console };
  vm.createContext(ctx);
  vm.runInContext([grab('mulberry32'), grab('generatePath'), grab('generatePuzzle'), grab('countGiven')]
    .join('\n') + '\n;this.__gen = generatePuzzle;', ctx);
  return ctx.__gen;
}

/** INDEPENDENT validator of one candidate path. Returns null if valid. */
function validate(puz, p) {
  const size = puz.size, N = puz.N;
  if (!p || p.length !== N) return 'length ' + (p ? p.length : 'null') + ' != ' + N;
  const seen = new Set();
  for (let k = 0; k < N; k++) {
    const cell = p[k];
    if (typeof cell !== 'number' || cell < 0 || cell >= size * size) return 'cell out of range at ' + k;
    if (seen.has(cell)) return 'cell reused at ' + k;
    seen.add(cell);
    const r = (cell / size) | 0, c = cell % size;
    const gv = puz.given[r][c];
    if (gv !== null && gv !== undefined && gv !== k + 1) return 'clue mismatch at ' + r + ',' + c;
  }
  if (seen.size !== size * size) return 'not all cells used (' + seen.size + '/' + size * size + ')';
  for (let k = 1; k < N; k++) {
    const a = p[k - 1], b = p[k];
    const ar = (a / size) | 0, ac = a % size, br = (b / size) | 0, bc = b % size;
    if (Math.abs(ar - br) > 1 || Math.abs(ac - bc) > 1) return 'not 8-adjacent at ' + k;
  }
  return null;
}

/** Corrected counter: the forced clue cell is a FILTER, not a replacement. */
function countSolutions(puz, opts) {
  const o = opts || {};
  const cap = o.cap || 2;
  const budgetMs = o.budgetMs || 20000;
  const size = puz.size, N = puz.N, given = puz.given;
  const clueAt = new Int16Array(size * size);
  const whereMustGo = new Int16Array(N + 1).fill(-1);
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const v = given[r][c];
    if (v === null || v === undefined) continue;
    clueAt[r * size + c] = v; whereMustGo[v] = r * size + c;
  }
  const adj = [];
  for (let i = 0; i < size * size; i++) {
    const r = (i / size) | 0, c = i % size, a = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) a.push(nr * size + nc);
    }
    adj.push(a);
  }
  const visited = new Uint8Array(size * size);
  const sols = [];
  let timedOut = false, nodes = 0, invalidEmitted = 0;
  const t0 = Date.now();
  const pathArr = new Int32Array(N);

  function dfs(k, cur) {
    if (timedOut) return;
    if (++nodes % 2048 === 0 && Date.now() - t0 > budgetMs) { timedOut = true; return; }
    if (k === N) {
      const p = Array.from(pathArr);
      const err = validate(puz, p);
      if (err) { invalidEmitted++; return; }   // a correct counter never does this
      sols.push(p);
      return;
    }
    const v = k + 1, forced = whereMustGo[v];
    for (const nb of adj[cur]) {
      if (visited[nb]) continue;
      const cv = clueAt[nb];
      if (cv !== 0 && cv !== v) continue;                 // clue cell holds another number
      if (forced >= 0 && nb !== forced) continue;          // this number's clue cell is elsewhere
      visited[nb] = 1; pathArr[k] = nb;
      dfs(k + 1, nb);
      visited[nb] = 0;
      if (sols.length >= cap || timedOut) return;
    }
  }
  const start = whereMustGo[1];
  if (start < 0) return { sols, timedOut, nodes, invalidEmitted };
  visited[start] = 1; pathArr[0] = start; dfs(1, start);
  return { sols, timedOut, nodes, invalidEmitted };
}

/** Calibration suite. Returns { pass, checks: [...] }. */
function calibrate(generatePuzzle) {
  const checks = [];
  const add = (name, ok, info) => { checks.push({ name, ok: !!ok, info: info || '' }); };

  { // POSITIVE: the engine's stored path validates
    const puz = generatePuzzle(5, 0.55, (0 + 1) * 1009 + 7);
    const stored = puz.solution.map(([r, c]) => r * puz.size + c);
    const err = validate(puz, stored);
    add('positive/stored-path-validates', err === null, err || '');
    const r = countSolutions(puz, { cap: 2, budgetMs: 8000 });
    add('positive/counter-finds-engine-path', r.sols.some(s => JSON.stringify(s) === JSON.stringify(stored)),
      'found ' + r.sols.length);
  }
  { // NEGATIVE: unconstrained grid -> MANY solutions
    const fake = { size: 5, N: 25, given: Array.from({ length: 5 }, () => Array(5).fill(null)) };
    fake.given[0][0] = 1; fake.given[4][4] = 25;
    const r = countSolutions(fake, { cap: 2, budgetMs: 8000 });
    add('negative/unconstrained-yields-many', r.sols.length >= 2, 'count=' + r.sols.length);
  }
  { // NEGATIVE: logically IMPOSSIBLE clue set -> 0 solutions, NOT a timeout.
    // 3x3: (0,0) and (0,2) are NOT 8-adjacent, so 1 at (0,0) + 2 at (0,2)
    // cannot start a chain -> provably 0 solutions.
    const fake = { size: 3, N: 9, given: Array.from({ length: 3 }, () => Array(3).fill(null)) };
    fake.given[0][0] = 1; fake.given[0][2] = 2;
    const r = countSolutions(fake, { cap: 2, budgetMs: 8000 });
    add('negative/impossible-clue-yields-zero', !r.timedOut && r.sols.length === 0,
      'count=' + r.sols.length + ' timedOut=' + r.timedOut);
  }
  return { pass: checks.every(c => c.ok), checks };
}

module.exports = { loadEngine, validate, countSolutions, calibrate, DIRS, ROOT };
