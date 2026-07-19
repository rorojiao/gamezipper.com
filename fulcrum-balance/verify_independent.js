// Independent Node.js BFS solver for Fulcrum Balance levels
// Extracts LEVELS from index.html and verifies all 30 levels are solvable
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/fulcrum-balance/index.html', 'utf8');
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('fulcrum-balance');
function bruteForcePlacements(fixed, tray, posRange) {
  const fixedDict = {};
  fixed.forEach(f => fixedDict[f[0]] = f[1]);
  const fixedTorque = Object.keys(fixedDict).reduce((s, p) => s + fixedDict[p] * parseInt(p), 0);
  const available = posRange.filter(p => !(p in fixedDict));
  const solutions = [];
  
  if (tray.length === 0) {
    if (fixedTorque === 0) solutions.push({});
    return solutions;
  }
  
  function permute(arr, positions, current, usedIdx) {
    if (current.length === arr.length) {
      // Check if this placement balances
      const placementTorque = current.reduce((s, pair) => s + pair[0] * pair[1], 0);
      if (fixedTorque + placementTorque === 0) {
        const sol = {};
        current.forEach(pair => sol[pair[0]] = pair[1]);
        solutions.push(sol);
      }
      return;
    }
    const idx = current.length;
    for (let i = 0; i < positions.length; i++) {
      if (usedIdx.has(i)) continue;
      usedIdx.add(i);
      current.push([positions[i], tray[idx]]);
      permute(arr, positions, current, usedIdx);
      current.pop();
      usedIdx.delete(i);
    }
  }
  
  // For subset selection (tier 5), also try subsets
  // But for now, full placement only
  permute(tray, available, [], new Set());
  return solutions;
}

function verifyFulcrumUnique(fixedWeights, fMin, fMax) {
  const valid = [];
  for (let f = fMin; f <= fMax; f++) {
    const t = fixedWeights.reduce((s, fw) => s + fw[1] * (fw[0] - f), 0);
    if (t === 0) valid.push(f);
  }
  return valid;
}

// Also check subset solutions for tier 5
function bruteForceSubsets(fixed, tray, posRange) {
  const fixedDict = {};
  fixed.forEach(f => fixedDict[f[0]] = f[1]);
  const fixedTorque = Object.keys(fixedDict).reduce((s, p) => s + fixedDict[p] * parseInt(p), 0);
  const available = posRange.filter(p => !(p in fixedDict));
  
  // Try all subsets of tray items
  for (let mask = 1; mask < (1 << tray.length); mask++) {
    const subset = [];
    for (let i = 0; i < tray.length; i++) {
      if (mask & (1 << i)) subset.push(tray[i]);
    }
    const sols = bruteForcePlacements(fixed, subset, available);
    if (sols.length > 0) {
      return { found: true, count: subset.length };
    }
  }
  return { found: false, count: 0 };
}

console.log('=== Node.js BFS Verification (30 levels) ===');
let allValid = true;
LEVELS.forEach((lv, i) => {
  const posRange = [];
  for (let p = lv.pr[0]; p <= lv.pr[1]; p++) posRange.push(p);
  
  if (lv.fl === -1 || lv.af !== undefined) {
    // Fulcrum-move level
    const valid = verifyFulcrumUnique(lv.f, lv.fr[0], lv.fr[1]);
    if (valid.length === 1 && valid[0] === lv.af) {
      console.log(`  OK   L${(i+1).toString().padStart(2)} T${lv.t}: fulcrum=${valid[0]} (unique)`);
    } else {
      console.log(`  FAIL L${(i+1).toString().padStart(2)} T${lv.t}: valid=${JSON.stringify(valid)}`);
      allValid = false;
    }
  } else {
    // Placement level
    const posRangeNoZero = posRange.filter(p => p !== 0);
    const sols = bruteForcePlacements(lv.f, lv.tr, posRangeNoZero);
    
    if (lv.t === 5) {
      // Tier 5: also check subset solutions
      const subset = bruteForceSubsets(lv.f, lv.tr, posRangeNoZero);
      if (subset.found) {
        console.log(`  OK   L${(i+1).toString().padStart(2)} T${lv.t}: ${sols.length} full sol(s), min subset=${subset.count}`);
      } else {
        console.log(`  FAIL L${(i+1).toString().padStart(2)} T${lv.t}: NO SUBSET SOLUTION`);
        allValid = false;
      }
    } else {
      if (sols.length >= 1) {
        const firstKey = Object.keys(sols[0])[0];
        const firstVal = sols[0][firstKey];
        console.log(`  OK   L${(i+1).toString().padStart(2)} T${lv.t}: ${sols.length} sol(s)`);
      } else {
        console.log(`  FAIL L${(i+1).toString().padStart(2)} T${lv.t}: NO SOLUTION`);
        allValid = false;
      }
    }
  }
});

console.log(`\n${allValid ? 'ALL 30/30 VALID' : 'SOME INVALID'}`);
