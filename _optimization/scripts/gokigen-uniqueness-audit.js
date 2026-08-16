#!/usr/bin/env node
/* gokigen-naname solution-uniqueness audit.
 * For each level: load clues+size via the engine's own initLevel, then exhaustively count
 * mirror arrangements satisfying ALL clue counts (pruned DFS, count capped at 2).
 * Mirror semantics cross-validated against engine computeCornerCounts on the embedded solution.
 * Non-unique levels = ambiguous puzzles (P2 quality defect). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const repo = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(repo, 'gokigen-naname', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
function mkSandbox() {
  const el = () => ({ textContent: '', classList: { add() {}, remove() {}, toggle() {} }, style: {}, addEventListener() {}, getContext: () => new Proxy({}, { get: (t, p) => { if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (p === 'measureText') return () => ({ width: 10 }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }), width: 400, height: 400 });
  const ctx = {
    console, Date, JSON, Math,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => {}, cancelAnimationFrame() {},
    performance: { now: () => 0 },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'node' }, location: { href: '' },
    document: { getElementById: el, querySelector: () => ({ getBoundingClientRect: () => ({ width: 400, height: 400, left: 0, top: 0 }) }), querySelectorAll: () => [], addEventListener() {}, createElement: el, body: { appendChild() {} }, hidden: false },
    AudioContext: undefined,
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.addEventListener = () => {}; ctx.adsbygoogle = { push() {} };
  vm.createContext(ctx);
  vm.runInContext(scripts + ';globalThis.__e={initLevel,state,computeCornerCounts,hasLoop};', ctx, { filename: 'gokigen.js' });
  return ctx;
}
// my corner-count mirror: 1='/' touches (r,c)+(r+1,c+1) corners; 2='\' touches (r,c+1)+(r+1,c)
function cornerCounts(grid, N) {
  const C = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (grid[r][c] === 1) { C[r][c]++; C[r + 1][c + 1]++; }
    else if (grid[r][c] === 2) { C[r][c + 1]++; C[r + 1][c]++; }
  }
  return C;
}
function countSolutions(N, clues, cap) {
  const need = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(-1));
  for (const { r, c, n } of clues) need[r][c] = n;
  const grid = Array.from({ length: N }, () => new Array(N).fill(0));
  const cnt = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
  let total = 0;
  function placed(r, c) { // corners fully determined when cell (r,c) placed: (r,c) corner done if (r+1,c+1) out or... simpler: after placing cell (r,c), corner (r,c) receives its last contribution when cells (r-1,c-1),(r-1,c),(r,c-1),(r,c) all placed. We check corner (r, c) right after placing cell (r, c) only if r==N-1&&c==N-1... instead: check corner (r,c) after placing cell (r,c) when cells (r,c),(r,c-1),(r-1,c),(r-1,c-1) all placed → row-major order → corner (r,c) finalized exactly after cell (r,c) placed (for r,c < N).
    return null;
  }
  function bt(i) {
    if (total >= cap) return;
    if (i === N * N) {
      // last row/col corners
      for (let k = 0; k <= N; k++) {
        if (need[N][k] >= 0 && cnt[N][k] !== need[N][k]) return;
        if (need[k][N] >= 0 && cnt[k][N] !== need[k][N]) return;
      }
      total++;
      return;
    }
    const r = (i / N) | 0, c = i % N;
    for (const v of [1, 2]) {
      grid[r][c] = v;
      if (v === 1) { cnt[r][c]++; cnt[r + 1][c + 1]++; } else { cnt[r][c + 1]++; cnt[r + 1][c]++; }
      // corner (r,c) finalized now (row-major): validate if clued
      let ok = true;
      if (need[r][c] >= 0 && cnt[r][c] !== need[r][c]) ok = false;
      // early prune: any clued corner already exceeding its need among not-yet-final ones whose remaining contributions are 0? (skip — light pruning suffices for 4..8)
      if (ok) bt(i + 1);
      if (v === 1) { cnt[r][c]--; cnt[r + 1][c + 1]--; } else { cnt[r][c + 1]--; cnt[r + 1][c]--; }
      grid[r][c] = 0;
      if (total >= cap) return;
    }
  }
  bt(0);
  return total;
}
const ctx = mkSandbox();
const e = ctx.__e;
const results = [];
let nonUnique = 0, mismatch = 0;
for (let li = 1; li <= 30; li++) {
  e.initLevel(li);
  const st = e.state;
  const N = st.size, clues = st.clues;
  // cross-check semantics on embedded solution
  const eng = e.computeCornerCounts(st.solution, N);
  const mine = cornerCounts(st.solution, N);
  let semOK = JSON.stringify(eng) === JSON.stringify(mine);
  if (!semOK) mismatch++;
  const n = countSolutions(N, clues, 2);
  if (n > 1) nonUnique++;
  results.push({ level: li, size: N, clues: clues.length, solutions: n, semanticsMatch: semOK });
}
const out = { at: new Date().toISOString(), levels: results, nonUnique, semanticsMismatch: mismatch,
  note: 'solutions counted to cap 2; engine-win also requires no-loop (checked separately by verify_engine)' };
console.log(JSON.stringify({ nonUnique, semanticsMismatch: mismatch, sizes: [...new Set(results.map(r => r.size))] }));
fs.writeFileSync(path.join(repo, '_optimization', 'evidence', 'gokigen-naname', 'uniqueness-audit.json'), JSON.stringify(out, null, 1) + '\n');
process.exit(0);
