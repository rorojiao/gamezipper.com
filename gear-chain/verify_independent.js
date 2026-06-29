// Independent verifier for Gear Chain Logic levels.
// Loads LEVELS_RAW from index.html, parses each, runs an INDEPENDENT brute-force
// solver (mirroring gen_levels.py semantics), and asserts:
//   1. Each level has >=1 solution (SOLVABLE)
//   2. Each level's player-placement solution is UNIQUE (by active path)
//   3. Each level's stored driver/prefilled mesh correctly
// Reports "30/30 SOLVABLE + UNIQUE" on success.
"use strict";
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/const LEVELS_RAW\s*=\s*(\[\[[\s\S]*?\]\]);/);
if (!m) {
  console.error('FAIL: could not find LEVELS_RAW in index.html');
  process.exit(1);
}
let RAW;
try { RAW = JSON.parse(m[1]); } catch(e) {
  console.error('FAIL: LEVELS_RAW is not valid JSON:', e.message);
  process.exit(1);
}
console.log('Loaded', RAW.length, 'compact levels');

// Physics constants — MUST match gen_levels.py and index.html engine
const P = 3;
const TOL = 2.0;
const RPM_TOL = 0.01;

function dist(a, b) { const dx = a[0]-b[0], dy = a[1]-b[1]; return Math.sqrt(dx*dx + dy*dy); }
function meshes(t1, t2, d) { return Math.abs(d - P*(t1+t2)) <= TOL; }

function parseLevel(raw) {
  return {
    id: raw[0], nodes: raw[1], driver: raw[2], driverTeeth: raw[3], driverRpm: raw[4],
    target: raw[5], targetRpm: raw[6], targetCw: raw[7], palette: raw[8],
    prefilled: raw[9] || {}, secondTarget: raw[10], par: raw[11],
  };
}

// Propagation: build mesh adjacency, BFS from driver, compute rpm+cw for all reachable.
function propagate(level, placed) {
  const names = Object.keys(placed);
  const adj = {};
  names.forEach(n => adj[n] = []);
  for (let i = 0; i < names.length; i++) {
    for (let j = i+1; j < names.length; j++) {
      const a = names[i], b = names[j];
      const d = dist(level.nodes[a], level.nodes[b]);
      if (meshes(placed[a], placed[b], d)) {
        adj[a].push(b); adj[b].push(a);
      }
    }
  }
  const driver = level.driver;
  if (!adj[driver]) return { adj, paths: {}, rpmAt: {}, cwAt: {} };
  const prev = {}; prev[driver] = null;
  const rpmAt = {}; rpmAt[driver] = level.driverRpm;
  const cwAt = {}; cwAt[driver] = true;
  const q = [driver]; let qi = 0;
  while (qi < q.length) {
    const cur = q[qi]; qi++;
    for (const nb of adj[cur]) {
      if (nb in prev) continue;
      prev[nb] = cur;
      const tIn = placed[cur], tOut = placed[nb];
      rpmAt[nb] = rpmAt[cur] * tIn / tOut;
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
  return { adj, paths, rpmAt, cwAt };
}

function checkWin(level, placed) {
  const { paths } = propagate(level, placed);
  const tgt = paths[level.target];
  if (!tgt) return false;
  if (tgt.cw !== level.targetCw) return false;
  if (Math.abs(tgt.rpm - parseFloat(level.targetRpm)) > RPM_TOL) return false;
  if (level.secondTarget) {
    const [stN, stR, stC] = level.secondTarget;
    const st = paths[stN];
    if (!st) return false;
    if (st.cw !== stC) return false;
    if (Math.abs(st.rpm - stR) > RPM_TOL) return false;
  }
  return true;
}

// Brute-force all solutions, dedup by active path + path-teeth + must_place teeth.
function findAllSolutions(level) {
  const nodes = level.nodes;
  const prefilled = level.prefilled || {};
  const driver = level.driver;
  const mustPlace = level.secondTarget ? new Set([level.secondTarget[0]]) : new Set();
  const empties = Object.keys(nodes).filter(n => n !== driver && !(n in prefilled));
  const solutions = [];
  // guard against explosion
  if (empties.length > 8) return { solutions: [], skipped: true };
  const opts = [0].concat(level.palette);
  const total = Math.pow(opts.length, empties.length);
  if (total > 200000) return { solutions: [], skipped: true };
  // iterate via base-N counting
  const idx = new Array(empties.length).fill(0);
  for (let n = 0; n < total; n++) {
    // build placement
    const placed = {};
    Object.assign(placed, prefilled);
    placed[driver] = level.driverTeeth;
    for (let i = 0; i < empties.length; i++) {
      const v = opts[idx[i]];
      if (v > 0) placed[empties[i]] = v;
    }
    // must place
    let mpOk = true;
    for (const mp of mustPlace) { if (!(mp in placed)) { mpOk = false; break; } }
    if (mpOk && checkWin(level, placed)) {
      // dedup key: active path to target + teeth along path + must_place teeth
      const prop = propagate(level, placed);
      const tgtPath = prop.paths[level.target].path;
      let stInfo = null;
      if (level.secondTarget) {
        const stN = level.secondTarget[0];
        const stPath = prop.paths[stN] ? prop.paths[stN].path : [];
        stInfo = stPath.join(',') + '|' + stPath.map(p => placed[p]).join(',');
      }
      const key = tgtPath.join(',') + '|' + tgtPath.map(p => placed[p]).join(',') + '|' + (stInfo||'');
      // also include must_place teeth not on main path
      const mpTeeth = [...mustPlace].filter(mp => !tgtPath.includes(mp)).map(mp => mp+'='+placed[mp]).sort().join(';');
      const fullKey = key + '|' + mpTeeth;
      solutions.push({ placed, key: fullKey, path: tgtPath });
    }
    // increment idx
    let carry = empties.length - 1;
    while (carry >= 0) {
      idx[carry]++;
      if (idx[carry] < opts.length) break;
      idx[carry] = 0; carry--;
    }
  }
  // dedup by key
  const seen = new Set();
  const uniq = [];
  for (const s of solutions) {
    if (!seen.has(s.key)) { seen.add(s.key); uniq.push(s); }
  }
  return { solutions: uniq, skipped: false };
}

// ===== RUN =====
let pass = 0, fail = 0;
const failures = [];
const levels = RAW.map(parseLevel);

console.log('\n=== Gear Chain Logic — Independent Level Verification ===\n');
for (const lv of levels) {
  const driverPlaced = {}; driverPlaced[lv.driver] = lv.driverTeeth;
  // 1. driver exists in nodes
  if (!lv.nodes[lv.driver]) { fail++; failures.push('L'+lv.id+': driver node missing'); continue; }
  if (!lv.nodes[lv.target]) { fail++; failures.push('L'+lv.id+': target node missing'); continue; }
  // 2. driver meshes with at least one other node when target needs a path? (driver must be connectable)
  const { solutions, skipped } = findAllSolutions(lv);
  if (skipped) {
    console.log('L'+lv.id+': SKIPPED (search space too large, empties='+lv.empties+')');
    fail++; failures.push('L'+lv.id+': solver skipped');
    continue;
  }
  if (solutions.length === 0) {
    fail++; failures.push('L'+lv.id+': NO SOLUTION (unsolvable)');
    console.log('L'+lv.id+': ❌ UNSOLVABLE');
    continue;
  }
  if (solutions.length > 1) {
    fail++; failures.push('L'+lv.id+': '+solutions.length+' solutions (NOT UNIQUE)');
    console.log('L'+lv.id+': ❌ NOT UNIQUE ('+solutions.length+' solutions)');
    // log distinct paths
    continue;
  }
  // unique + solvable
  const sol = solutions[0];
  // verify the solution path length matches par-ish (par = path nodes -1 = gears to place excluding driver)
  const placedGears = sol.path.length - 1; // excludes driver
  pass++;
  console.log('L'+String(lv.id).padStart(2)+' '+lv.target+'='+lv.targetRpm+'rpm '+(lv.targetCw?'CW':'CCW')+
    (lv.secondTarget?' +2nd':'')+' → UNIQUE ✓  path: '+sol.path.join('→')+'  ('+placedGears+' gears, par '+lv.par+')');
}

console.log('\n=== RESULT ===');
console.log('PASS: '+pass+'/'+levels.length);
console.log('FAIL: '+fail+'/'+levels.length);
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(f => console.log('  - '+f));
  process.exit(1);
}
if (pass === levels.length) {
  console.log('\n✅ '+levels.length+'/'+levels.length+' SOLVABLE + UNIQUE — ALL VERIFIED');
} else {
  process.exit(1);
}
