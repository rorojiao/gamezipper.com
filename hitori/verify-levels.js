#!/usr/bin/env node
/* R433: independent Hitori uniqueness counter (closes the P1 unguarded-claim
 * defect for hitori IF all levels prove unique; otherwise finds the P0).
 * Extracts var LEVELS=[...] from hitori/index.html via balanced-bracket scan,
 * then counts solutions per level (cap 2) with backtracking + rule checks:
 *   R1 no duplicate numbers in any row/col among unshaded cells
 *   R2 no two shaded cells share an edge
 *   R3 all unshaded cells form one connected group
 * Also verifies the embedded solution is valid.
 */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// balanced-bracket extractor for var LEVELS=[ ... ];
function extract(src, decl) {
  const i = src.indexOf(decl);
  if (i < 0) return null;
  let j = src.indexOf('[', i);
  let depth = 0, inStr = null;
  for (let k = j; k < src.length; k++) {
    const c = src[k];
    if (inStr) { if (c === '\\') k++; else if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return eval(src.slice(j, k + 1)); }
  }
  return null;
}
const LEVELS = extract(html, 'var LEVELS=');
if (!LEVELS) { console.error('LEVELS_NOT_FOUND'); process.exit(2); }
console.log('levels:', LEVELS.length, 'keys:', Object.keys(LEVELS[0]).join(','));

function gridOf(L) {
  // accept grid as array-of-strings or array-of-arrays
  return L.grid.map(row => typeof row === 'string' ? row.trim().split(/\s+/).map(Number) : row.slice());
}

function countSolutions(g, cap) {
  const n = g.length;
  const shaded = Array.from({ length: n }, () => Array(n).fill(0)); // 0 unknown, 1 shaded, 2 unshaded
  // precompute duplicate groups: pairs of same-number cells in same row/col
  const pairs = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    for (let c2 = c + 1; c2 < n; c2++) if (g[r][c] === g[r][c2]) pairs.push([r * n + c, r * n + c2]);
    for (let r2 = r + 1; r2 < n; r2++) if (g[r][c] === g[r2][c]) pairs.push([r * n + c, r2 * n + c]);
  }
  let sols = 0;
  const cells = [];
  for (let i = 0; i < n * n; i++) cells.push(i);
  function validPartial() {
    for (const [a, b] of pairs) {
      const ra = (a / n) | 0, ca = a % n, rb = (b / n) | 0, cb = b % n;
      if (shaded[ra][ca] === 2 && shaded[rb][cb] === 2) return false; // both unshaded dup
    }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (shaded[r][c] === 1) {
      if (r + 1 < n && shaded[r + 1][c] === 1) return false;
      if (c + 1 < n && shaded[r][c + 1] === 1) return false;
    }
    return true;
  }
  function finalCheck() {
    // connectivity of unshaded
    let start = -1, cnt = 0;
    for (let i = 0; i < n * n; i++) if (shaded[(i / n) | 0][i % n] === 2) { if (start < 0) start = i; cnt++; }
    if (cnt === 0) return false;
    const seen = new Uint8Array(n * n);
    const stack = [start]; seen[start] = 1; let reach = 1;
    while (stack.length) {
      const i = stack.pop(), r = (i / n) | 0, c = i % n;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const j = rr * n + cc;
        if (!seen[j] && shaded[rr][cc] === 2) { seen[j] = 1; reach++; stack.push(j); }
      }
    }
    return reach === cnt;
  }
  function bt(i) {
    if (sols >= cap) return;
    if (i === n * n) { if (finalCheck()) sols++; return; }
    const r = (i / n) | 0, c = i % n;
    for (const v of [1, 2]) {
      shaded[r][c] = v;
      if (validPartial()) bt(i + 1);
      shaded[r][c] = 0;
    }
  }
  bt(0);
  return sols;
}

function solutionValid(g, sol) {
  // sol: array of "r,c" strings or [r,c] pairs or 2D mask
  const n = g.length;
  const sh = Array.from({ length: n }, () => Array(n).fill(false));
  if (!Array.isArray(sol)) return null;
  if (Array.isArray(sol[0]) && sol[0].length === n) {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (sol[r][c]) sh[r][c] = true;
  } else if (typeof sol[0] === 'string') {
    for (const s of sol) { const [r, c] = s.split(',').map(Number); sh[r][c] = true; }
  } else {
    for (const s of sol) { const [r, c] = s; sh[r][c] = true; }
  }
  // R1
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (sh[r][c]) continue;
    for (let c2 = c + 1; c2 < n; c2++) if (!sh[r][c2] && g[r][c] === g[r][c2]) return false;
    for (let r2 = r + 1; r2 < n; r2++) if (!sh[r2][c] && g[r][c] === g[r2][c]) return false;
  }
  // R2
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (sh[r][c]) {
    if (r + 1 < n && sh[r + 1][c]) return false;
    if (c + 1 < n && sh[r][c + 1]) return false;
  }
  // R3
  let start = -1, cnt = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!sh[r][c]) { if (start < 0) start = r * n + c; cnt++; }
  const seen = new Uint8Array(n * n); const stack = [start]; seen[start] = 1; let reach = 1;
  while (stack.length) { const i = stack.pop(), r = (i / n) | 0, c = i % n;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue; const j = rr * n + cc;
      if (!seen[j] && !sh[(j / n) | 0][j % n]) { seen[j] = 1; reach++; stack.push(j); } } }
  return reach === cnt;
}

let bad = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const g = gridOf(L);
  const t0 = Date.now();
  const cnt = countSolutions(g, 2);
  const solOk = L.solution ? solutionValid(g, L.solution) : null;
  const tag = cnt === 1 && solOk !== false ? 'PASS' : 'FAIL';
  if (tag === 'FAIL') bad++;
  console.log(`L${i} ${g.length}x${g.length} solutions=${cnt}${cnt >= 2 ? '+' : ''} embeddedSolutionValid=${solOk} ${tag} (${Date.now() - t0}ms)`);
}
console.log(bad === 0 ? `ALL ${LEVELS.length} UNIQUE+VALID` : `DEFECTS: ${bad}`);
process.exit(bad === 0 ? 0 : 1);
