#!/usr/bin/env node
/* R433: independent Akari (Light Up) uniqueness counter — closes the P1
 * unguarded-claim defect (page FAQ promises "solver-verified to ensure a single
 * correct bulb placement", but the shipped verify_engine.js only re-validates
 * the stored solution without counting).
 * Extracts var LEVELS=[...] from index.html (balanced-bracket scan), then for
 * each level counts solutions (cap 2) with backtracking:
 *   - bulbs on white cells; illuminate row/col until a wall
 *   - at most one bulb per wall-bounded segment (bulbs never see each other)
 *   - numbered walls: exactly N orthogonally adjacent bulbs
 *   - every white cell illuminated (row or col segment has a bulb)
 * Also verifies the embedded solution is valid.
 * Usage: node akari/verify-levels.js
 */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extract(src, decl) {
  const i = src.indexOf(decl);
  if (i < 0) return null;
  const j = src.indexOf('[', i);
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
console.log('levels:', LEVELS.length);

function build(L) {
  const n = L.size;
  const wall = Array.from({ length: n }, () => Array(n).fill(null)); // null=white, 'w', digit
  for (const [r, c, t] of L.walls) wall[r][c] = t;
  // segment ids for white cells
  const rs = Array.from({ length: n }, () => Array(n).fill(-1));
  const cs = Array.from({ length: n }, () => Array(n).fill(-1));
  let sid = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (wall[r][c] !== null) continue;
    if (c === 0 || wall[r][c - 1] !== null) rs[r][c] = sid++;
    else rs[r][c] = rs[r][c - 1];
  }
  for (let c = 0; c < n; c++) for (let r = 0; r < n; r++) {
    if (wall[r][c] !== null) continue;
    if (r === 0 || wall[r - 1][c] !== null) cs[r][c] = sid++;
    else cs[r][c] = cs[r - 1][c];
  }
  const whites = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (wall[r][c] === null) whites.push(r * n + c);
  const numbered = L.walls.filter(w => w[2] !== 'w').map(([r, c, t]) => [r, c, parseInt(t, 10)]);
  return { n, wall, rs, cs, sid, whites, numbered };
}

function countSolutions(B, cap) {
  const { n, wall, rs, cs, sid, whites, numbered } = B;
  const segBulb = new Int16Array(sid).fill(-1); // -1 none yet, else cell index
  const cellBulb = new Uint8Array(n * n);
  let sols = 0;
  function ok() {
    for (const [r, c, k] of numbered) {
      let cnt = 0, undec = 0;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        if (wall[rr][cc] !== null) continue;
        if (cellBulb[rr * n + cc]) cnt++;
        else if (!decided[rr * n + cc]) undec++;
      }
      if (cnt > k || cnt + undec < k) return false;
    }
    for (const i of whites) {
      const r = (i / n) | 0, c = i % n;
      if (segBulb[rs[r][c]] < 0 && segBulb[cs[r][c]] < 0) {
        // both segments still empty: only a violation if no undecided cell remains in either segment
        let canFill = false;
        for (const j of whites) {
          if (decided[j]) continue;
          const rr = (j / n) | 0, cc = j % n;
          if (rs[rr][cc] === rs[r][c] || cs[rr][cc] === cs[r][c]) { canFill = true; break; }
        }
        if (!canFill) return false;
      }
    }
    return true;
  }
  const decided = new Uint8Array(n * n);
  function bt(idx) {
    if (sols >= cap) return;
    if (idx === whites.length) { sols++; return; }
    const i = whites[idx], r = (i / n) | 0, c = i % n;
    // try bulb
    if (segBulb[rs[r][c]] < 0 && segBulb[cs[r][c]] < 0) {
      segBulb[rs[r][c]] = i; segBulb[cs[r][c]] = i; cellBulb[i] = 1; decided[i] = 1;
      if (ok()) bt(idx + 1);
      segBulb[rs[r][c]] = -1; segBulb[cs[r][c]] = -1; cellBulb[i] = 0; decided[i] = 0;
    }
    // try empty
    decided[i] = 1;
    if (ok()) bt(idx + 1);
    decided[i] = 0;
  }
  bt(0);
  return sols;
}

function solutionValid(B, sol) {
  const { n, wall, rs, cs, sid, whites, numbered } = B;
  const bulbs = new Set(sol.map(([r, c]) => r * n + c));
  const seg = new Map();
  for (const i of bulbs) {
    const r = (i / n) | 0, c = i % n;
    if (wall[r][c] !== null) return false;
    for (const s of [rs[r][c], cs[r][c]]) {
      if (seg.has(s)) return false; // two bulbs see each other
      seg.set(s, i);
    }
  }
  for (const i of whites) {
    const r = (i / n) | 0, c = i % n;
    if (!seg.has(rs[r][c]) && !seg.has(cs[r][c])) return false; // unlit
  }
  for (const [r, c, k] of numbered) {
    let cnt = 0;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < n && cc < n && bulbs.has(rr * n + cc)) cnt++;
    }
    if (cnt !== k) return false;
  }
  return true;
}

let bad = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const B = build(L);
  const t0 = Date.now();
  const solOk = L.solution ? solutionValid(B, L.solution) : null;
  const cnt = countSolutions(B, 2);
  const tag = cnt === 1 && solOk === true ? 'PASS' : 'FAIL';
  if (tag === 'FAIL') bad++;
  console.log(`L${i} ${B.n}x${B.n} solutions=${cnt}${cnt >= 2 ? '+' : ''} embeddedSolutionValid=${solOk} ${tag} (${Date.now() - t0}ms)`);
}
console.log(bad === 0 ? `ALL ${LEVELS.length} UNIQUE+VALID` : `DEFECTS: ${bad}`);
process.exit(bad === 0 ? 0 : 1);
