#!/usr/bin/env node
/**
 * R338 — inject a validated Tapa catalog into the SHIPPED game.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The engine (tapa/index.html) reads its levels from the INLINE
 * `const LEVELS=[...]` literal — it never fetches tapa/levels.json
 * (`grep -c levels.json tapa/index.html` = 0). The generator
 * (tapa/gen.py) writes ONLY tapa/levels.json. So regenerating the catalog
 * does NOT change what players play: the inline literal keeps shipping the
 * old, corrupt data. That missing link is why the R336 P0 was diagnosed but
 * never actually fixed in the shipped game.
 *
 * WHAT IT DOES
 * ------------
 *   1. reads tapa/levels.json;
 *   2. re-validates EVERY level INDEPENDENTLY (ring rule + connectivity +
 *      no 2x2 + degeneracy + arithmetic feasibility) — it refuses to inject
 *      anything it has not itself checked;
 *   3. replaces the inline `const LEVELS=[...]` literal in tapa/index.html
 *      with the validated catalog;
 *   4. re-reads the file and re-validates the INLINE copy that will ship.
 *
 * USAGE
 *   node .audit/r338-tapa-inject.js            # inject (writes index.html)
 *   node .audit/r338-tapa-inject.js --check    # validate only, write nothing
 *   node .audit/r338-tapa-inject.js --check-inline  # validate the SHIPPED inline copy
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'tapa/index.html');
const JSONF = path.join(ROOT, 'tapa/levels.json');

/* --- the 8 neighbours, clockwise from NW (standard Tapa ring) --- */
const RING = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

function ringRuns(rows, n, r, c) {
  const ring = [];
  for (const [dr, dc] of RING) {
    const rr = r + dr, cc = c + dc;
    ring.push(rr >= 0 && rr < n && cc >= 0 && cc < n && rows[rr][cc] === 1 ? 1 : 0);
  }
  if (!ring.some(v => v)) return [];
  if (ring.every(v => v)) return [8];
  const start = ring.indexOf(0);
  const seq = [];
  for (let k = 0; k < 8; k++) seq.push(ring[(start + k) % 8]);
  const runs = [];
  let cur = 0;
  for (const v of seq) {
    if (v) cur++;
    else { if (cur) runs.push(cur); cur = 0; }
  }
  if (cur) runs.push(cur);
  return runs.slice().sort((a, b) => a - b);
}

function clueDigits(cl) {
  if (String(cl).trim() === '0') return [];
  return String(cl).split('').map(Number).filter(x => !isNaN(x)).sort((a, b) => a - b);
}

/** Independent validation of one level. Returns an array of error strings. */
function validateLevel(lv, key) {
  const errs = [];
  const n = lv.size;
  const sol = lv[key];
  const clue = lv.clue;
  if (!Array.isArray(sol) || sol.length !== n || sol.some(row => row.length !== n)) {
    return ['solution is not ' + n + 'x' + n];
  }
  if (!Array.isArray(clue) || clue.length !== n || clue.some(row => row.length !== n)) {
    return ['clue is not ' + n + 'x' + n];
  }
  // 1. the ring rule on every numbered cell
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cl = clue[r][c];
      if (cl === '.' || cl === '#') continue;
      const got = ringRuns(sol, n, r, c);
      const want = clueDigits(cl);
      if (got.length !== want.length || got.some((v, i) => v !== want[i])) {
        errs.push('clue[' + r + '][' + c + ']="' + cl + '" wants runs ' + JSON.stringify(want) +
                  ' but the solution gives ' + JSON.stringify(got));
      }
      // 2. arithmetic feasibility: a clue can never demand more shaded
      //    neighbours than the cell physically has (convention-independent)
      const phys = RING.filter(([dr, dc]) => {
        const rr = r + dr, cc = c + dc;
        return rr >= 0 && rr < n && cc >= 0 && cc < n;
      }).length;
      const demand = clueDigits(cl).reduce((a, b) => a + b, 0);
      if (demand > phys) {
        errs.push('clue[' + r + '][' + c + ']="' + cl + '" demands ' + demand +
                  ' shaded neighbours but the cell has only ' + phys);
      }
    }
  }
  // 3. no 2x2 shaded block
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      if (sol[r][c] === 1 && sol[r][c + 1] === 1 && sol[r + 1][c] === 1 && sol[r + 1][c + 1] === 1) {
        errs.push('2x2 shaded block at (' + r + ',' + c + ')');
      }
    }
  }
  // 4. the shaded cells form ONE connected region (4-connected, as the
  //    engine's own checkViolations() requires)
  const shaded = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (sol[r][c] === 1) shaded.push([r, c]);
  if (shaded.length) {
    const key2 = (r, c) => r * n + c;
    const seen = new Set([key2(shaded[0][0], shaded[0][1])]);
    const stack = [shaded[0]];
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
        if (sol[rr][cc] === 1 && !seen.has(key2(rr, cc))) { seen.add(key2(rr, cc)); stack.push([rr, cc]); }
      }
    }
    if (seen.size !== shaded.length) {
      errs.push('shaded cells form ' + (shaded.length - seen.size) + ' disconnected group(s)');
    }
  }
  // 5. degeneracy: "shade every blank" must NOT win the level
  let blankW = 0, blankS = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (clue[r][c] !== '.') continue;
      if (sol[r][c] === 1) blankS++; else blankW++;
    }
  }
  if (blankW < 2 || blankS < 2) {
    errs.push('degenerate: ' + blankW + ' white / ' + blankS + ' shaded blank cells (need >=2 of each)');
  }
  return errs;
}

/** Extract the inline `const LEVELS=[...]` literal from index.html. */
function extractInline(html) {
  const i = html.indexOf('const LEVELS=');
  if (i < 0) return null;
  const j = html.indexOf('];;', i);
  if (j < 0) return null;
  const src = html.slice(i + 'const LEVELS='.length, j + 1);
  let parsed;
  try { parsed = eval(src); } catch (e) { return { error: String(e) }; }
  return { raw: src, levels: parsed, start: i, end: j + 1 };
}

function validateCatalog(levels, key, label) {
  let ok = 0;
  const bad = [];
  for (const lv of levels) {
    const k = key in lv ? key : ('sol' in lv ? 'sol' : ('solution' in lv ? 'solution' : null));
    if (!k) { bad.push([lv.id || '?', ['no solution key']]); continue; }
    const e = validateLevel(lv, k);
    if (e.length) bad.push([lv.id || '?', e]); else ok++;
  }
  console.log(label + ': ' + ok + '/' + levels.length + ' levels VALID');
  for (const [id, errs] of bad.slice(0, 8)) {
    console.log('  FAIL ' + id + ':');
    for (const e of errs.slice(0, 3)) console.log('      ' + e);
  }
  if (bad.length > 8) console.log('  ... and ' + (bad.length - 8) + ' more failing levels');
  return { ok, bad, total: levels.length };
}

function main() {
  const args = process.argv.slice(2);
  const checkInline = args.includes('--check-inline');
  const checkOnly = args.includes('--check');

  if (checkInline) {
    const html = fs.readFileSync(HTML, 'utf8');
    const inl = extractInline(html);
    if (!inl || inl.error) { console.log('ERROR: could not extract inline LEVELS: ' + (inl && inl.error)); process.exit(2); }
    const res = validateCatalog(inl.levels, 'sol', 'SHIPPED INLINE catalog (tapa/index.html)');
    console.log('VERDICT: ' + (res.bad.length ? 'FAIL (' + res.bad.length + ' bad)' : 'PASS'));
    process.exit(res.bad.length ? 1 : 0);
  }

  const data = JSON.parse(fs.readFileSync(JSONF, 'utf8'));
  const levels = Array.isArray(data) ? data : data.levels;
  const key = levels[0] && 'sol' in levels[0] ? 'sol' : 'solution';
  const res = validateCatalog(levels, key, 'tapa/levels.json (key=' + key + ')');
  if (res.bad.length) {
    console.log('VERDICT: FAIL — refusing to inject an unvalidated catalog');
    process.exit(1);
  }
  if (checkOnly) { console.log('VERDICT: PASS (check only, nothing written)'); process.exit(0); }

  // ---- inject ----
  const html = fs.readFileSync(HTML, 'utf8');
  const inl = extractInline(html);
  if (!inl || inl.error) { console.log('ERROR: could not extract inline LEVELS'); process.exit(2); }
  const literal = 'const LEVELS=' + JSON.stringify(levels) + ';';
  const out = html.slice(0, inl.start) + literal + html.slice(inl.end);
  fs.writeFileSync(HTML, out);

  // ---- re-read and re-validate what will actually ship ----
  const after = fs.readFileSync(HTML, 'utf8');
  const inl2 = extractInline(after);
  if (!inl2 || inl2.error) { console.log('ERROR: injection broke the literal'); process.exit(2); }
  const res2 = validateCatalog(inl2.levels, 'sol', 'SHIPPED INLINE catalog AFTER injection');
  const before = JSON.stringify(inl.levels);
  const afterS = JSON.stringify(inl2.levels);
  console.log('inline levels changed: ' + (before !== afterS));
  console.log('VERDICT: ' + (res2.bad.length ? 'FAIL (' + res2.bad.length + ' bad)' : 'PASS'));
  process.exit(res2.bad.length ? 1 : 0);
}

main();
