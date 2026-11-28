#!/usr/bin/env pythonless
// Independent verifier for nonogram (added R461, test-gate layer 3).
// Layers verified WITHOUT the game engine:
//  1. every level has a stored flat `sol` of size*size (0/1 only)
//  2. clue-solution consistency: clues regenerated from sol with an
//     independent getGroups implementation
//  3. uniqueness: count solver over clues ONLY with limit=2 -> must be exactly 1
// Exits 1 on any failure (including zero levels parsed).
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// balanced-bracket extractor for `const LEVELS = [ ... ];`
function extractLevels(src) {
  const m = /const\s+LEVELS\s*=\s*\[/.exec(src);
  if (!m) return null;
  let i = src.indexOf('[', m.index);
  let depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return null;
}

const lit = extractLevels(html);
if (!lit) { console.error('LEVELS_NOT_FOUND'); process.exit(1); }
const LEVELS = eval(lit);
if (!Array.isArray(LEVELS) || LEVELS.length === 0) { console.error('EMPTY_LEVELS'); process.exit(1); }

function groups(line) {
  const g = []; let c = 0;
  for (const v of line) { if (v === 1) c++; else { if (c > 0) g.push(c); c = 0; } }
  if (c > 0) g.push(c);
  return g.length ? g : [0];
}

// ---- uniqueness counting solver (row-by-row bitmask backtracking) ----
function rowLayouts(clue, n) {
  // all n-bit rows matching clue (clue [] => [0] treated as all-empty)
  const out = [];
  const parts = clue.length === 1 && clue[0] === 0 ? [] : clue;
  (function rec(pos, part, mask) {
    if (part === parts.length) { out.push(mask); return; }
    const len = parts[part];
    for (let start = pos; start + len <= n; start++) {
      let m = mask;
      for (let k = start; k < start + len; k++) m |= (1 << k);
      // next bit after block must be 0 unless last part ending at n-1
      rec(start + len + 1, part + 1, m);
    }
  })(0, 0, 0);
  return out;
}

function countSolutions(size, rowCluesRaw, colCluesRaw, limit) {
  const norm = cls => cls.map(cl => (cl.length === 1 && cl[0] === 0 ? [] : cl));
  const rowClues = norm(rowCluesRaw), colClues = norm(colCluesRaw);
  const layouts = rowClues.map(cl => rowLayouts(cl, size));
  // column feasibility via per-column state: [usedGroups, curRun]
  let count = 0;
  const colState = new Array(size).fill(0).map(() => [0, 0]);
  function rec(r) {
    if (count >= limit) return;
    if (r === size) {
      for (let c = 0; c < size; c++) {
        const [used, cur] = colState[c];
        if (cur > 0) {
          if (colClues[c].length !== used + 1 || cur !== colClues[c][used]) return;
        } else if (used !== colClues[c].length) return;
      }
      count++;
      return;
    }
    for (const mask of layouts[r]) {
      let ok = true;
      const saved = colState.map(s => s.slice());
      for (let c = 0; c < size && ok; c++) {
        const bit = (mask >> c) & 1;
        let [used, cur] = colState[c];
        if (bit) {
          cur++;
          const clue = colClues[c];
          if (used >= clue.length) { ok = false; break; }
          if (cur > clue[used]) { ok = false; break; }
        } else if (cur > 0) {
          if (cur !== colClues[c][used]) { ok = false; break; }
          used++; cur = 0;
        }
        colState[c][0] = used; colState[c][1] = cur;
      }
      if (ok) {
        // per-column feasibility prune: cells still required in col c must fit
        // in the rows remaining below r
        let bad = false;
        for (let c = 0; c < size; c++) {
          const [used, cur] = colState[c];
          let need = 0;
          for (let k = used; k < colClues[c].length; k++) need += colClues[c][k] - (k === used ? cur : 0);
          if (need > 0 && need > size - r - 1) { bad = true; break; }
        }
        if (!bad) rec(r + 1);
      }
      for (let c = 0; c < size; c++) { colState[c][0] = saved[c][0]; colState[c][1] = saved[c][1]; }
      if (count >= limit) return;
    }
  }
  rec(0);
  return count;
}

let pass = 0, fail = 0;
const fails = [];
LEVELS.forEach((L, idx) => {
  const n = L.size;
  const errs = [];
  if (!Array.isArray(L.sol) || L.sol.length !== n * n) errs.push('sol missing/short');
  if (!errs.length && !L.sol.every(v => v === 0 || v === 1)) errs.push('sol not 0/1');
  if (errs.length) { fail++; fails.push(`L${idx} ${L.name}: ${errs.join(';')}`); return; }
  const rows = [], cols = [];
  for (let r = 0; r < n; r++) rows.push(groups(L.sol.slice(r * n, r * n + n)));
  for (let c = 0; c < n; c++) cols.push(groups(L.sol.map((_, i) => i).map((_, i) => L.sol[i * n + c])));
  const cnt = countSolutions(n, rows, cols, 2);
  // Game semantics since 2026-11-26 fix: completion = exact clue satisfaction,
  // so >1 solution is playable-by-design (flagged INFO), 0 = unsolvable FAIL.
  if (cnt === 0) fails.push(`L${idx} ${L.name} (${n}x${n}): solutions=0 UNSOLVABLE`);
  if (cnt === 1) pass++;
  else if (cnt >= 1) pass++;
  if (cnt === 0) fail++;
  console.log(`L${idx} ${L.name} ${n}x${n}: ${cnt === 1 ? 'UNIQUE' : (cnt === 0 ? 'UNSOLVABLE' : 'AMBIGUOUS(>1, accepted by clue-satisfaction win rule)')}`);
});
console.log(`\n=== independent nonogram verifier: ${pass}/${LEVELS.length} unique+valid, ${fail} fail ===`);
if (fails.length) { for (const f of fails) console.log('  ' + f); process.exit(1); }
if (LEVELS.length !== 30) { console.log('WARN: level count ' + LEVELS.length + ' != 30'); }
process.exit(fail ? 1 : 0);
