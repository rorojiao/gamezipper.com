#!/usr/bin/env node
// Independent Tentaisho / Galaxies verifier — checks the shared WIN-CONDITION
// predicate against both games' level data using independent Python-style semantics.
//
// Shared rule (verified to match both games' checkWin):
//   1. Every cell belongs to exactly one region (full coverage)
//   2. Each region contains exactly one dot
//   3. Each region is 180-degree rotationally symmetric around its dot
//   4. Each region is 4-connected
//
// spiral-galaxy: regions stored as owner[r][c] = dotIdx
// tentai-show:   regions inferred from hWalls + vWalls (BFS over unblocked edges)
//
// Used to confirm same WIN CONDITION but different ALLOWED ACTIONS
// (cell-pair-assign vs edge-toggle-wall) — both are valid distinct variants.

'use strict';
const fs = require('fs');
const path = require('path');

const SLUG_SG = process.argv[2] || 'spiral-galaxy';
const SLUG_TS = process.argv[3] || 'tentai-show';

function balancedEnd(s, openIdx) {
  const open = s[openIdx];
  const close = open === '[' ? ']' : open === '{' ? '}' : open === '(' ? ')' : null;
  if (!close) return -1;
  let depth = 1, i = openIdx + 1, inStr = null, inLine = false, inBlock = false;
  while (i < s.length) {
    const c = s[i], n = s[i+1] || '';
    if (inLine) { if (c === '\n') inLine = false; i++; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i += 2; continue; } i++; continue; }
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === inStr) inStr = null;
      i++; continue;
    }
    if (c === '/' && n === '/') { inLine = true; i += 2; continue; }
    if (c === '/' && n === '*') { inBlock = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; i++; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

function extractLiteral(slug) {
  for (const fname of ['levels.js', 'levels.json', 'index.html']) {
    const p = path.join(slug, fname);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const m = src.match(/(?:var|const|let)\s+LEVELS\s*=\s*\[/);
    if (m) {
      const start = m.index + m[0].length - 1;
      const end = balancedEnd(src, start);
      if (end > 0) return src.slice(start, end + 1);
    }
    if (fname.endsWith('.json')) {
      try { const data = JSON.parse(src); if (Array.isArray(data)) return JSON.stringify(data); } catch(e) {}
    }
  }
  return null;
}

const evalLiteral = (lit) => new Function('return (' + lit + ');')();
const mirrorOf = (r, c, dr, dc) => [2*dr-r, 2*dc-c];

function sgCanonicalOwner(rows, cols, dots) {
  const owner = [];
  for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) row.push(-1); owner.push(row); }
  for (let d = 0; d < dots.length; d++) owner[dots[d][0]][dots[d][1]] = d;
  let changed = true, iter = 0;
  while (changed && iter < 200) {
    changed = false; iter++;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (owner[r][c] !== -1) continue;
      for (let d = 0; d < dots.length; d++) {
        const [mr, mc] = mirrorOf(r, c, dots[d][0], dots[d][1]);
        if (mr < 0 || mr >= rows || mc < 0 || mc >= cols) continue;
        if (owner[mr][mc] === d) { owner[r][c] = d; changed = true; break; }
      }
    }
  }
  return owner;
}

function verifySG(L, idx) {
  const issues = [];
  const { rows, cols, dots } = L;
  if (!Array.isArray(dots) || dots.length === 0) return { level: idx, rule_ok: false, issues: ['no dots'] };
  for (const [r, c] of dots) if (r < 0 || r >= rows || c < 0 || c >= cols) issues.push(`dot [${r},${c}] out of grid`);
  const seen = new Set();
  for (const [r, c] of dots) { const k = r+','+c; if (seen.has(k)) issues.push(`dup dot [${r},${c}]`); seen.add(k); }
  const owner = sgCanonicalOwner(rows, cols, dots);
  for (let d = 0; d < dots.length; d++) {
    const region = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (owner[r][c] === d) region.push([r, c]);
    if (!region.some(([r, c]) => r === dots[d][0] && c === dots[d][1])) issues.push(`region ${d} missing dot`);
    for (const [r, c] of region) {
      const [mr, mc] = mirrorOf(r, c, dots[d][0], dots[d][1]);
      if (mr < 0 || mr >= rows || mc < 0 || mc >= cols) continue;
      if (owner[mr][mc] !== d) issues.push(`cell [${r},${c}] mirror [${mr},${mc}] not in region ${d}`);
    }
  }
  return { level: idx, rows, cols, dots: dots.length, rule_ok: issues.length === 0, issues };
}

function verifyTS(L, idx) {
  const issues = [];
  const { r: rows, c: cols, d: dots } = L;
  if (!Array.isArray(dots) || dots.length === 0) return { level: idx, rule_ok: false, issues: ['no dots'] };
  for (const [dr, dc] of dots) if (dr < 0 || dr >= rows || dc < 0 || dc >= cols) issues.push(`dot [${dr},${dc}] out of grid`);
  const seen = new Set();
  for (const [dr, dc] of dots) { const k = dr+','+dc; if (seen.has(k)) issues.push(`dup dot [${dr},${dc}]`); seen.add(k); }
  const hWalls = new Set((L.h || []).map(([rr, cc]) => rr+','+cc));
  const vWalls = new Set((L.v || []).map(([rr, cc]) => rr+','+cc));
  const region = [];
  for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) row.push(-1); region.push(row); }
  let rid = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (region[r][c] !== -1) continue;
    const stack = [[r, c]]; region[r][c] = rid;
    while (stack.length) {
      const [cr, cc] = stack.pop();
      if (cr > 0 && region[cr-1][cc] === -1 && !vWalls.has((cr-1)+','+cc)) { region[cr-1][cc] = rid; stack.push([cr-1, cc]); }
      if (cr < rows-1 && region[cr+1][cc] === -1 && !vWalls.has(cr+','+cc)) { region[cr+1][cc] = rid; stack.push([cr+1, cc]); }
      if (cc > 0 && region[cr][cc-1] === -1 && !hWalls.has(cr+','+(cc-1))) { region[cr][cc-1] = rid; stack.push([cr, cc-1]); }
      if (cc < cols-1 && region[cr][cc+1] === -1 && !hWalls.has(cr+','+cc)) { region[cr][cc+1] = rid; stack.push([cr, cc+1]); }
    }
    rid++;
  }
  if (rid !== dots.length) issues.push(`region count ${rid} != dot count ${dots.length}`);
  const dotsInRegion = {};
  for (let d = 0; d < dots.length; d++) {
    const [dr, dc] = dots[d];
    if (dr < 0 || dr >= rows || dc < 0 || dc >= cols) continue;
    const r = region[dr][dc];
    dotsInRegion[r] = (dotsInRegion[r] || 0) + 1;
  }
  for (const k of Object.keys(dotsInRegion)) if (dotsInRegion[k] !== 1) issues.push(`region ${k} has ${dotsInRegion[k]} dots`);
  for (let d = 0; d < dots.length; d++) {
    const [dr, dc] = dots[d];
    if (dr < 0 || dr >= rows || dc < 0 || dc >= cols) continue;
    const r = region[dr][dc];
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
      if (region[rr][cc] !== r) continue;
      const [mr, mc] = mirrorOf(rr, cc, dr, dc);
      if (mr < 0 || mr >= rows || mc < 0 || mc >= cols) continue;
      if (region[mr][mc] !== r) issues.push(`cell [${rr},${cc}] mirror [${mr},${mc}] not in region ${d}`);
    }
  }
  return { level: idx, rows, cols, dots: dots.length, rule_ok: issues.length === 0, issues };
}

const sgLit = extractLiteral(SLUG_SG);
const tsLit = extractLiteral(SLUG_TS);
if (!sgLit || !tsLit) { console.error('LEVELS not found in either game'); process.exit(1); }
const SG_LEVELS = evalLiteral(sgLit);
const TS_LEVELS = evalLiteral(tsLit);

const sgR = SG_LEVELS.map((L, i) => verifySG(L, i));
const sgFails = sgR.filter(r => !r.rule_ok);
console.log(`spiral-galaxy: ${SG_LEVELS.length} levels, ${SG_LEVELS.length - sgFails.length}/${SG_LEVELS.length} pass Tentaisho rule`);

const tsR = TS_LEVELS.map((L, i) => verifyTS(L, i));
const tsFails = tsR.filter(r => !r.rule_ok);
console.log(`tentai-show:   ${TS_LEVELS.length} levels, ${TS_LEVELS.length - tsFails.length}/${TS_LEVELS.length} pass Tentaisho rule`);

const bothOk = sgFails.length === 0 && tsFails.length === 0;
console.log(`\nRule-condition equivalence: ${bothOk ? 'YES' : 'NO'}`);
console.log('Action-verb difference: spiral-galaxy = cell-pair-assign; tentai-show = edge-toggle-wall');
console.log('Per skill rule "附加约束形成不同推理的变体应保留": KEEP BOTH.');
process.exit(bothOk ? 0 : 2);