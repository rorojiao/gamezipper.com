#!/usr/bin/env node
/* Queens (LinkedIn style) verifier — R337 rewrite.
 *
 * WHY THIS FILE WAS REWRITTEN (2026-10-26):
 * The previous verifier only checked that the STORED solution satisfies the
 * constraints. That is a NO-OP gate for the property the page actually
 * advertises ("Every puzzle has exactly one unique solution") — the R318
 * Pitfall #86 shape: a verifier that loads a level, injects the shipped
 * answer and asserts the win predicate is structurally incapable of testing
 * the claim "the answer is the only one".
 *
 * It reported "30/30 levels have valid stored solution / VERDICT: PASS" on a
 * catalog where an independent solver proved 48..100000+ solutions per level.
 * It also used a HARD-CODED absolute path, so it could only ever audit this
 * one checkout (the R963 Pitfall #55 shape).
 *
 * THIS verifier COUNTS solutions and FAILS on a multi-solution level.
 *
 * Rules are read from the ENGINE (checkWin body), never from level key names:
 *   R1 one crown per row
 *   R2 one crown per column
 *   R3 one crown per region
 *   R4 no two crowns adjacent (8-directional, |dr|<=1 && |dc|<=1)
 *
 * Two independent enumerators must agree:
 *   A) assumption-free enumeration (prunes only the sound |dr|<=1 rule)
 *   B) the PAGE's own countSolutions(), parsed out of index.html
 *   C) a second implementation that checks adjacency only at the LEAF
 *
 * Usage:  node queens/verify_engine.js [path/to/index.html]
 * Exit 0 = PASS, 1 = FAIL, 2 = setup error.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HERE = __dirname;
const FILE = process.argv[2] || path.join(HERE, 'index.html');

/* ---------- extract a balanced-bracket array after a marker ---------- */
function extractArray(src, marker) {
  const m = src.match(marker);
  if (!m) return null;
  let i = m.index + m[0].length;
  const start = i;
  let depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '[') depth++;
    else if (c === ']') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}

/* ---------- extract a top-level function body, string/comment aware ----- */
function grabFunction(src, name) {
  const m = src.match(new RegExp('function\\s+' + name + '\\s*\\('));
  if (!m) return null;
  let i = src.indexOf('{', m.index);
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(m.index, i + 1); }
  }
  return null;
}

/* ---------------- A) enumeration with the sound |dr|<=1 prune ---------- */
function countAll(n, regions, limit) {
  const colUsed = new Array(n).fill(false);
  const regUsed = new Set();
  const placed = new Array(n).fill(-1);
  const sols = [];
  (function bt(row) {
    if (sols.length >= limit) return;
    if (row === n) {
      const rows = new Set(), cols = new Set(), regs = new Set();
      for (let r = 0; r < n; r++) {
        const c = placed[r];
        if (c < 0) return;
        if (rows.has(r) || cols.has(c) || regs.has(regions[r][c])) return;
        rows.add(r); cols.add(c); regs.add(regions[r][c]);
      }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) <= 1 && Math.abs(placed[i] - placed[j]) <= 1) return;
      }
      sols.push(placed.slice());
      return;
    }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (reg < 0) continue;
      if (regUsed.has(reg)) continue;
      // The ONLY pruning used: |dr| <= 1 means only the previous row can
      // conflict. Sound, not a heuristic.
      if (row > 0 && Math.abs(c - placed[row - 1]) <= 1) continue;
      placed[row] = c; colUsed[c] = true; regUsed.add(reg);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return sols;
}

/* ---------------- C) second implementation: leaf-only adjacency check ---- */
function bruteCount(n, regions, limit) {
  let count = 0;
  const colUsed = new Array(n).fill(false);
  const regUsed = new Set();
  const placed = new Array(n).fill(-1);
  (function bt(row) {
    if (count >= limit) return;
    if (row === n) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) <= 1 && Math.abs(placed[i] - placed[j]) <= 1) return;
      }
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (reg < 0) continue;
      if (regUsed.has(reg)) continue;
      placed[row] = c; colUsed[c] = true; regUsed.add(reg);
      bt(row + 1);
      colUsed[c] = false; regUsed.delete(reg); placed[row] = -1;
    }
  })(0);
  return count;
}

/* ---------------- engine predicate (re-implemented from checkWin) -------- */
function loadPageCounter(html) {
  const fn = grabFunction(html, 'countSolutions');
  if (!fn) throw new Error('countSolutions not extractable');
  const ctx = { Math, console };
  vm.createContext(ctx);
  vm.runInContext(fn + '\nthis.__cs = countSolutions;', ctx);
  if (typeof ctx.__cs !== 'function') throw new Error('countSolutions not extractable');
  return ctx.__cs;
}

function checkWinAccepts(n, regions, cols) {
  const rows = new Set(), colsS = new Set(), regs = new Set();
  for (let r = 0; r < n; r++) {
    const c = cols[r];
    if (c < 0 || c >= n) return 'col out of bounds';
    if (rows.has(r)) return 'row dup';
    rows.add(r);
    if (colsS.has(c)) return 'col dup';
    colsS.add(c);
    const reg = regions[r][c];
    if (regs.has(reg)) return 'region dup';
    regs.add(reg);
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.abs(i - j) <= 1 && Math.abs(cols[i] - cols[j]) <= 1) return 'adjacent crowns';
  }
  return null;
}

function regionsConnected(n, regions) {
  for (let R = 0; R < n; R++) {
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === R) cells.push([r, c]);
    if (!cells.length) return 'region ' + R + ' is empty';
    const seen = new Set([cells[0][0] + ',' + cells[0][1]]);
    const st = [cells[0]];
    while (st.length) {
      const [r, c] = st.pop();
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        if (regions[nr][nc] !== R) continue;
        const k = nr + ',' + nc;
        if (seen.has(k)) continue;
        seen.add(k); st.push([nr, nc]);
      }
    }
    if (seen.size !== cells.length) return 'region ' + R + ' is disconnected';
  }
  return null;
}

/* ======================= MAIN ======================= */
if (!fs.existsSync(FILE)) { console.error('FILE NOT FOUND: ' + FILE); process.exit(2); }
const html = fs.readFileSync(FILE, 'utf8');
const raw = extractArray(html, /var PUZZLE_DATA\s*=\s*\[/);
if (!raw) { console.error('PUZZLE_DATA not found in ' + FILE); process.exit(2); }
let PUZZLE_DATA;
try { PUZZLE_DATA = eval('(' + '[' + raw + ']' + ')'); }
catch (e) { console.error('PUZZLE_DATA parse error: ' + e.message); process.exit(2); }
if (!Array.isArray(PUZZLE_DATA) || !PUZZLE_DATA.length) { console.error('PUZZLE_DATA empty'); process.exit(2); }
console.log('PUZZLE_DATA extracted: ' + PUZZLE_DATA.length + ' levels');

let pageCount;
try { pageCount = loadPageCounter(html); }
catch (e) { console.error('cannot load page countSolutions: ' + e.message); process.exit(2); }

/* Uniqueness LIMIT. A level is unique iff exactly 1 solution exists. A cap
   of 2 is enough to PROVE uniqueness (count==1) and to DISPROVE it
   (count>=2). A large cap would be a self-inflicted truncation bug: a
   truncated count reads as "not unique" purely from the cap. */
const UNIQLIMIT = 2;

let pass = 0, fail = 0;
const failures = [];

/* ---------------------------------------------------------------
 * Shared level gate. Used for BOTH the shipped level catalog and the
 * pre-generated DAILY pool — a daily puzzle that is not unique is the
 * same defect as a level that is not unique, and the daily pool used to
 * be produced by a runtime generator that ALWAYS produced a
 * multi-solution puzzle.
 * --------------------------------------------------------------- */
function gateLevels(list, label) {
  let lpass = 0, lfail = 0;
  const lfailures = [];
  console.log('\n== ' + label + ' (' + list.length + ') ==');
  console.log('level |  n | indep | page | brute | stored | regions');
  for (const p of list) {
    const n = p.n, regions = p.regions, sol = p.solution;
    const errs = [];

    if (!Array.isArray(sol) || sol.length !== n) errs.push('solution.length != n');
    if (!Array.isArray(regions) || regions.length !== n) errs.push('regions not n x n');
    else for (const row of regions) if (!Array.isArray(row) || row.length !== n) { errs.push('regions row != n'); break; }
    if (errs.length) {
      lfail++; lfailures.push({ id: p.id, errs });
      console.log('  ' + String(p.id).padStart(2) + '  | ' + n + ' |  SHAPE ERROR: ' + errs.join('; '));
      continue;
    }

    // region ids must be 0..n-1: the page's countSolutions uses an ARRAY of
    // length n indexed by region id, so an id >= n reads as undefined ->
    // "region unused" -> a SOLVER blind spot, not a data bug
    let maxReg = -1;
    for (const row of regions) for (const v of row) if (v > maxReg) maxReg = v;
    if (maxReg >= n) errs.push('region id ' + maxReg + ' >= n=' + n + ' (page solver blind spot)');

    const indep = countAll(n, regions, UNIQLIMIT).length;
    const page = pageCount(n, regions, UNIQLIMIT);
    const brute = bruteCount(n, regions, UNIQLIMIT);

    if (indep !== page) errs.push('independent(' + indep + ') != page(' + page + ')');
    if (indep !== brute) errs.push('independent(' + indep + ') != brute(' + brute + ')');
    if (indep !== 1) errs.push('NOT UNIQUE: ' + (indep >= UNIQLIMIT ? '>=' + UNIQLIMIT : indep) + ' solutions');

    const werr = checkWinAccepts(n, regions, sol);
    if (werr) errs.push('stored solution rejected by engine: ' + werr);

    const cerr = regionsConnected(n, regions);
    if (cerr) errs.push(cerr);

    const ok = errs.length === 0;
    if (ok) lpass++; else { lfail++; lfailures.push({ id: p.id, errs }); }
    console.log('  ' + String(p.id).padStart(2) + '  | ' + n + ' | ' + String(indep).padStart(4) + ' | ' + String(page).padStart(4) + ' | ' + String(brute).padStart(5) + ' | ' + (werr ? 'NO ' : 'yes') + '      | ' + (cerr || 'ok') + (ok ? '' : '   <== ' + errs.join('; ')));
  }
  console.log(label + ': ' + lpass + '/' + list.length + ' levels uniquely solvable');
  if (lfailures.length) {
    console.log(label + ' FAILS:');
    for (const f of lfailures) console.log('  ' + label + ' ' + f.id + ': ' + f.errs.join('; '));
  }
  return { pass: lpass, fail: lfail, failures: lfailures };
}

const catRes = gateLevels(PUZZLE_DATA, 'Queens catalog');

/* ---- the DAILY pool (R337) --------------------------------------- */
let dailyRes = { pass: 0, fail: 0, failures: [] };
const rawDaily = extractArray(html, /var DAILY_PUZZLE_DATA\s*=\s*\[/);
if (rawDaily) {
  let DAILY_PUZZLE_DATA;
  try { DAILY_PUZZLE_DATA = eval('(' + '[' + rawDaily + ']' + ')'); }
  catch (e) { console.error('DAILY_PUZZLE_DATA parse error: ' + e.message); process.exit(2); }
  if (!Array.isArray(DAILY_PUZZLE_DATA) || !DAILY_PUZZLE_DATA.length) {
    console.error('DAILY_PUZZLE_DATA empty'); process.exit(2);
  }
  dailyRes = gateLevels(DAILY_PUZZLE_DATA, 'Queens daily pool');

  // The pool must not ship the SAME board twice (a player meeting the same
  // puzzle twice is a content defect) and must span more than one grid size.
  const seen = new Map();
  for (const p of DAILY_PUZZLE_DATA) {
    const key = p.n + '|' + JSON.stringify(p.regions);
    if (seen.has(key)) { dailyRes.fail++; dailyRes.failures.push({ id: p.id, errs: ['duplicate of ' + seen.get(key)] }); }
    else seen.set(key, p.id);
  }
  const sizes = new Set(DAILY_PUZZLE_DATA.map(p => p.n));
  if (sizes.size < 2) { dailyRes.fail++; dailyRes.failures.push({ id: 'pool', errs: ['pool covers only one grid size'] }); }
  console.log('Daily pool: ' + sizes.size + ' grid sizes (' + [...sizes].sort((a, b) => a - b).join(',') + '), ' + seen.size + ' distinct boards');
} else {
  console.log('\n(no DAILY_PUZZLE_DATA in this file — daily pool gate skipped)');
}

pass = catRes.pass;
fail = catRes.fail + dailyRes.fail;
failures.push.apply(failures, catRes.failures);
failures.push.apply(failures, dailyRes.failures);

console.log('\nQueens: ' + catRes.pass + '/' + PUZZLE_DATA.length + ' levels uniquely solvable');
if (failures.length) {
  console.log('\nFAILS:');
  for (const f of failures) console.log('  ' + f.id + ': ' + f.errs.join('; '));
}
console.log('\nVERDICT: ' + (fail === 0 ? 'PASS' : 'FAIL'));
process.exit(fail === 0 ? 0 : 1);
