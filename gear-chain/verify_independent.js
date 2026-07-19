// Independent verifier for Gear Chain Logic.
// Parses `var LV=[...]` + runtime PITCH/MESH_TOL from index.html, verifies under
// canonical gen_levels.py physics (P=3, TOL=2.0, RPM_TOL=0.01) that every level's
// stored solution (sp + ste, now including 2nd-target teeth) is VALID, and that
// the solution is UNIQUE under both canonical and runtime physics.
"use strict";
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('gear-chain');
// R3 fix: LV also loaded via helper
const LV = extractLevels('gear-chain');
console.log('Loaded', LV.length, 'levels from LV array');

const pitchM = html.match(/var PITCH=([0-9.]+)/);
const tolM = html.match(/var MESH_TOL=([0-9.]+)/);
const RUNTIME_PITCH = pitchM ? parseFloat(pitchM[1]) : 3;
const RUNTIME_TOL = tolM ? parseFloat(tolM[1]) : 2.0;
console.log('Runtime PITCH=' + RUNTIME_PITCH + ', MESH_TOL=' + RUNTIME_TOL);

const P = 3, TOL = 2.0, RPM_TOL = 0.01;

function dist(a, b) { const dx = a[0]-b[0], dy = a[1]-b[1]; return Math.sqrt(dx*dx + dy*dy); }
function meshes(t1, t2, d, pitch, tol) { return Math.abs(d - pitch*(t1+t2)) <= tol; }

function propagate(nodes, placed, driver, driverRpm, pitch, tol) {
  const names = Object.keys(placed);
  const adj = {}; names.forEach(n => adj[n] = []);
  for (let i = 0; i < names.length; i++) for (let j = i+1; j < names.length; j++) {
    const a = names[i], b = names[j];
    const d = dist(nodes[a], nodes[b]);
    if (meshes(placed[a], placed[b], d, pitch, tol)) { adj[a].push(b); adj[b].push(a); }
  }
  const prev = {}; prev[driver] = null;
  const rpmAt = {}; rpmAt[driver] = driverRpm;
  const cwAt = {}; cwAt[driver] = true;
  const q = [driver]; let qi = 0;
  while (qi < q.length) {
    const cur = q[qi]; qi++;
    for (const nb of adj[cur]) {
      if (nb in prev) continue;
      prev[nb] = cur;
      rpmAt[nb] = rpmAt[cur] * placed[cur] / placed[nb];
      cwAt[nb] = !cwAt[cur];
      q.push(nb);
    }
  }
  const paths = {};
  for (const n of names) {
    if (n === driver || !(n in prev)) continue;
    const pth = []; let c = n;
    while (c !== null) { pth.push(c); c = prev[c]; }
    pth.reverse();
    paths[n] = { path: pth, rpm: rpmAt[n], cw: cwAt[n] };
  }
  return { adj, paths };
}

function checkWin(lv, placed, pitch, tol) {
  const prop = propagate(lv.nodes, placed, lv.d, lv.dr, pitch, tol);
  const tgt = prop.paths[lv.t];
  if (!tgt) return { win: false, reason: 'target unreachable' };
  if (tgt.cw !== lv.tcw) return { win: false, reason: 'dir mismatch ('+tgt.cw+' vs '+lv.tcw+')' };
  if (Math.abs(tgt.rpm - lv.trv) > RPM_TOL) return { win: false, reason: 'rpm mismatch ('+tgt.rpm.toFixed(3)+' vs '+lv.trv+')' };
  if (lv.st) {
    const stN = lv.st[0][0], stR = lv.st[0][1], stC = lv.st[0][2];
    const st = prop.paths[stN];
    if (!st) return { win: false, reason: '2nd target unreachable' };
    if (st.cw !== stC) return { win: false, reason: '2nd dir mismatch' };
    if (Math.abs(st.rpm - stR) > RPM_TOL) return { win: false, reason: '2nd rpm mismatch' };
  }
  return { win: true, path: tgt.path };
}

function findAllSolutions(lv, pitch, tol) {
  const nodes = lv.nodes;
  const prefilled = lv.pre || {};
  const driver = lv.d;
  const mustPlace = lv.st ? new Set([lv.st[0][0]]) : new Set();
  const empties = Object.keys(nodes).filter(n => n !== driver && !(n in prefilled));
  if (empties.length > 8) return { solutions: [], skipped: true };
  const opts = [0].concat(lv.pal);
  const total = Math.pow(opts.length, empties.length);
  if (total > 200000) return { solutions: [], skipped: true };
  const idx = new Array(empties.length).fill(0);
  const found = [];
  for (let n = 0; n < total; n++) {
    const placed = {};
    Object.assign(placed, prefilled);
    placed[driver] = lv.dt;
    for (let i = 0; i < empties.length; i++) { const v = opts[idx[i]]; if (v > 0) placed[empties[i]] = v; }
    let mpOk = true;
    for (const mp of mustPlace) { if (!(mp in placed)) { mpOk = false; break; } }
    if (mpOk) {
      const r = checkWin(lv, placed, pitch, tol);
      if (r.win) {
        const prop = propagate(nodes, placed, driver, lv.dr, pitch, tol);
        const tgtPath = r.path;
        let stInfo = '';
        if (lv.st) {
          const stN = lv.st[0][0];
          const stPath = prop.paths[stN] ? prop.paths[stN].path : [];
          stInfo = stPath.join(',') + '|' + stPath.map(p => placed[p]).join(',');
        }
        const mpOff = [...mustPlace].filter(mp => !tgtPath.includes(mp)).map(mp => mp+'='+placed[mp]).sort().join(';');
        const key = tgtPath.join(',') + '|' + tgtPath.map(p => placed[p]).join(',') + '|' + stInfo + '|' + mpOff;
        found.push({ placed, path: tgtPath, key });
      }
    }
    let carry = empties.length - 1;
    while (carry >= 0) { idx[carry]++; if (idx[carry] < opts.length) break; idx[carry] = 0; carry--; }
  }
  const seen = new Set(); const uniq = [];
  for (const s of found) { if (!seen.has(s.key)) { seen.add(s.key); uniq.push(s); } }
  return { solutions: uniq, skipped: false };
}

let pass = 0, fail = 0;
const failures = [];
console.log('\n=== Gear Chain Logic — Canonical + Runtime Verification ===');
console.log('Canonical: P=' + P + ' TOL=' + TOL + ' (gen_levels.py truth)');
console.log('Runtime:   P=' + RUNTIME_PITCH + ' TOL=' + RUNTIME_TOL + ' (index.html engine)\n');

for (const lv of LV) {
  const issues = [];
  const placedSol = {};
  Object.assign(placedSol, lv.pre || {});
  placedSol[lv.d] = lv.dt;
  Object.assign(placedSol, lv.ste);
  const r1 = checkWin(lv, placedSol, P, TOL);
  if (!r1.win) issues.push('stored solution INVALID (canonical): ' + r1.reason);
  if (r1.win && r1.path.join(',') !== lv.sp.join(',')) issues.push('stored path ' + lv.sp.join(',') + ' != computed ' + r1.path.join(','));
  const r2 = checkWin(lv, placedSol, RUNTIME_PITCH, RUNTIME_TOL);
  if (!r2.win) issues.push('stored solution FAILS at runtime: ' + r2.reason);

  const can = findAllSolutions(lv, P, TOL);
  if (can.skipped) issues.push('canonical solver SKIPPED');
  else if (can.solutions.length === 0) issues.push('canonical: NO SOLUTION');
  else if (can.solutions.length > 1) issues.push('canonical: ' + can.solutions.length + ' solutions (NOT UNIQUE)');

  const run = findAllSolutions(lv, RUNTIME_PITCH, RUNTIME_TOL);
  if (run.skipped) issues.push('runtime solver SKIPPED');
  else if (run.solutions.length === 0) issues.push('runtime: NO SOLUTION');
  else if (run.solutions.length > 1) {
    const canonPaths = new Set(can.solutions.map(s => s.path.join(',')));
    const runtimeOnly = run.solutions.filter(s => !canonPaths.has(s.path.join(',')));
    if (runtimeOnly.length > 0) issues.push('runtime TOL=' + RUNTIME_TOL + ' adds ' + runtimeOnly.length + ' EXTRA path(s): ' + runtimeOnly.slice(0,2).map(s => s.path.join('→')).join(' | '));
  }

  if (issues.length === 0) {
    pass++;
    console.log('L' + String(lv.id).padStart(2) + ' ✓ ' + lv.t + '=' + lv.tr + 'rpm ' + (lv.tcw?'CW':'CCW') + (lv.st?' +2nd':'') + '  path ' + lv.sp.join('→') + '  UNIQUE (canon+runtime)');
  } else {
    fail++;
    issues.forEach(i => failures.push('L' + lv.id + ': ' + i));
    console.log('L' + String(lv.id).padStart(2) + ' ❌ ' + issues.join('; '));
  }
}

console.log('\n=== RESULT ===');
console.log('PASS: ' + pass + '/' + LV.length);
console.log('FAIL: ' + fail + '/' + LV.length);
if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
if (pass === LV.length) console.log('\n✅ ' + LV.length + '/' + LV.length + ' SOLVABLE + UNIQUE — canonical & runtime models agree');
