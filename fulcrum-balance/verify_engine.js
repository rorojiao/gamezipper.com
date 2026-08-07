// fulcrum-balance engine verifier — torque/balance puzzle.
//
// Each LEVEL is { t, f, tr, fl, pr, p, h, fr?, af? }
//   t = tier (1-6)
//   f = fixed weights [[pos, weight], ...]   (positions relative to fulcrum)
//   tr = tray weights [w1, w2, ...]          (weight kg of each piece in tray)
//   fl = fulcrum offset (-1 = movable, 0 = fixed)
//   pr = position range [min, max]
//   p = pieces count
//   h = hint
//   fr = fulcrum range [min, max]   (when fl=-1)
//   af = answer-fulcrum position   (when fl=-1)
//
// Goal: place all tray weights on the beam so net torque is zero.
// Sum(weight_i * pos_i) = 0 over all (fixed + placed-tray) weights.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const lvlMatch = html.match(/var LEVELS=\s*(\[[\s\S]*?\]);/);
if (!lvlMatch) {
  console.log(JSON.stringify({ verdict: 'FAIL', error: 'LEVELS not found' }));
  process.exit(1);
}
const LEVELS = (new Function('return ' + lvlMatch[1]))();
const N = LEVELS.length;

// Brute-force search: place tray weights at integer positions in [pr[0], pr[1]].
// Distinguish unplaced vs placed and use multiset matching.
// For each level: enumerate all combinations (cartesian product) where
// the SUM of (w_i * x_i) over fixed + tray-weights == 0.

function* combinations(positions, weights, fixedTorque, targetPositions) {
  // Recursive generator
  function* rec(i, currPlacement, currTorque) {
    if (i === weights.length) {
      if (currTorque + fixedTorque === 0) yield currPlacement.slice();
      return;
    }
    for (const p of targetPositions) {
      currPlacement.push(p);
      const newT = currTorque + weights[i] * p;
      yield* rec(i + 1, currPlacement, newT);
      currPlacement.pop();
    }
  }
  yield* rec(0, [], 0);
}

function calcFixedTorque(f) {
  if (!Array.isArray(f)) return 0;
  return f.reduce((acc, [pos, w]) => acc + pos * w, 0);
}

// Check each level
let passed = 0, failed = 0;
const failReasons = [];
const levelReports = [];

for (let i = 0; i < N; i++) {
  const L = LEVELS[i];
  const reasons = [];

  // Structural
  if (typeof L.t !== 'number') reasons.push('tier missing');
  if (!Array.isArray(L.tr)) reasons.push('tray missing');
  if (!Array.isArray(L.pr) || L.pr.length !== 2) reasons.push('pos range missing');
  if (!Array.isArray(L.f)) reasons.push('fixed missing');
  if (typeof L.p !== 'number') reasons.push('pieces missing');
  if (reasons.length) { failed++; failReasons.push({ idx: i, reasons }); continue; }

  // Check fixed weights within range
  for (const [pos, w] of L.f) {
    if (typeof pos !== 'number' || typeof w !== 'number') { reasons.push(`bad fixed: [${pos}, ${w}]`); break; }
    if (pos < L.pr[0] || pos > L.pr[1]) { reasons.push(`fixed ${pos} outside range ${L.pr[0]}-${L.pr[1]}`); break; }
  }
  // Fulcrum check
  if (L.fl === -1) {
    if (!Array.isArray(L.fr) || L.fr.length !== 2) reasons.push(`fr required when fl=-1`);
    if (typeof L.af !== 'number') reasons.push(`af required when fl=-1`);
  }
  // Position count check: how many positions available?
  const positions = [];
  for (let p = L.pr[0]; p <= L.pr[1]; p++) positions.push(p);
  let found = false;

  if (L.fl === -1) {
    // Fulcrum-movable: we need to find a fulcrum position (in fr) such that there exists
    // a placement of tray weights on positions with net torque zero relative to fulcrum.
    // Net torque = sum(w_i * (x_i - f))  where x_i are positions.
    // For balance: sum(w_i * (x_i - f)) = 0
    //             => sum(w_i * x_i) = f * sum(w_i)
    // If sum(w_i) != 0, then f = sum(w_i * x_i) / sum(w_i) — must be in fr.
    // Otherwise (sum(w_i) = 0), need sum(w_i * x_i) == 0.
    const weightsAll = [...L.f.map(([p, w]) => w), ...L.tr];
    const totalW = weightsAll.reduce((a, w) => a + w, 0);

    function searchFulcrum(idx, currPosTorque, placement) {
      if (found) return;
      if (idx === L.tr.length) {
        // Sum (weight * pos) from fixed + placed = currPosTorque
        const fulcrumPos = totalW === 0 ? null : currPosTorque / totalW;
        if (totalW === 0) {
          if (currPosTorque === 0) found = true;
          return;
        }
        // fulcrumPos must be a valid integer in fr
        if (fulcrumPos === Math.floor(fulcrumPos) && fulcrumPos >= L.fr[0] && fulcrumPos <= L.fr[1]) {
          found = true;
        }
        return;
      }
      for (const p of positions) {
        placement.push(p);
        searchFulcrum(idx + 1, currPosTorque + L.tr[idx] * p, placement);
        placement.pop();
        if (found) return;
      }
    }
    // Add fixed weights' torque
    const initialTorque = L.f.reduce((a, [p, w]) => a + w * p, 0);
    searchFulcrum(0, initialTorque, []);
  } else {
    // Fulcrum fixed: net torque must be 0 with fulcrum at position fl=0
    const fixedT = calcFixedTorque(L.f);
    const targetSum = -fixedT;
    function search(idx, currTorque, placement) {
      if (found) return;
      if (idx === L.tr.length) {
        if (currTorque === targetSum) { found = true; return; }
        return;
      }
      for (const p of positions) {
        placement.push(p);
        search(idx + 1, currTorque + L.tr[idx] * p, placement);
        placement.pop();
        if (found) return;
      }
    }
    search(0, 0, []);
  }
  if (found) {
    passed++;
    levelReports.push({ idx: i, tier: L.t, placed: L.tr.length, fixed: L.f.length });
  } else {
    failed++;
    failReasons.push({ idx: i, reasons: 'unsolvable' });
  }
}

console.log(JSON.stringify({
  total: N,
  passed,
  failed,
  failReasons: failReasons.slice(0, 5),
  levelReports,
  verdict: failed === 0 ? `PASS ${passed}/${N}` : `FAIL ${failed}/${N}`,
}, null, 2));
process.exit(failed === 0 ? 0 : 1);
