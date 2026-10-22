// Hourglass Swap — Level Verification (Node.js)
//
// The catalog is read FROM THE SHIPPED index.html, not from a hand-copied
// snapshot. This file previously carried its own inline copy of the 30 levels
// with no `name` field, so (a) it crashed on `lv.name.padEnd(18)` and never
// reported anything, and (b) even when it ran it audited a STALE snapshot --
// editing the real LEVELS would not have been caught. A gate that audits a
// copy of the data cannot protect the data.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractLevels(src) {
  const m = /var\s+LEVELS\s*=\s*\[/.exec(src) || /(?:const|let)\s+LEVELS\s*=\s*\[/.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"' || ch === "'") { const q = ch; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

const lit = extractLevels(html);
if (!lit) {
  console.error('FAIL: could not locate the LEVELS literal in index.html');
  process.exit(1);
}
const LEVELS = JSON.parse(lit);   // strict JSON: a JS-only literal fails loudly here
if (!Array.isArray(LEVELS) || LEVELS.length === 0) {
  console.error('FAIL: LEVELS extracted but empty');
  process.exit(1);
}

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

function solve(glasses, target, maxTime=200) {
  const caps = glasses;
  const initial = [0, ...caps];
  const q = [[initial, 0]];
  const visited = new Set();

  function key(state) { return state.join(','); }
  function isWin(state) {
    // R326 P0: this predicate previously also accepted `state[0] === target`,
    // i.e. ELAPSED TIME. state.elapsed is uncapped and simply climbs, so every
    // target <= maxTime was "reachable" and the gate reported ALL LEVELS VALID
    // without ever solving anything -- including for a target no flip sequence
    // can produce. It mirrored a genuine engine bug (checkWin() had the same
    // elapsed clause), which is why the two agreed with each other and both
    // disagreed with reality. The engine's real rule is the glass-amount check.
    for (let i = 1; i < state.length; i++) {
      if (state[i] === target || caps[i-1] - state[i] === target) return true;
    }
    return false;
  }

  if (isWin(initial)) return [0];

  while (q.length) {
    const [state, flips] = q.shift();
    const [time, ...tops] = state;

    if (flips > 15) continue;

    for (let i = 0; i < tops.length; i++) {
      const newTops = [...tops];
      newTops[i] = caps[i] - tops[i];
      const newState = [time, ...newTops];
      const k = key(newState);
      if (!visited.has(k)) {
        visited.add(k);
        if (isWin(newState)) return [flips + 1];
        q.push([newState, flips + 1]);
      }
    }

    for (let i = 0; i < tops.length; i++) {
      if (tops[i] > 0) {
        const dt = tops[i];
        const newTime = time + dt;
        if (newTime > maxTime) continue;
        const newTops = tops.map(t => Math.max(0, t - dt));
        const newState = [newTime, ...newTops];
        const k = key(newState);
        if (!visited.has(k)) {
          visited.add(k);
          if (isWin(newState)) return [flips];
          q.push([newState, flips]);
        }
      }
    }
  }
  return null;
}

console.log('=== HOURGLASS SWAP LEVEL VERIFICATION ===\n');
let allValid = true;

LEVELS.forEach((lv, i) => {
  const result = solve(lv.glasses, lv.target);
  const status = result ? 'OK' : 'FAIL';
  const flips = result ? result[0] : 'N/A';
  const capsStr = lv.glasses.join('+');
  const pad = (s, n) => String(s).padStart(n);
  // (lv.name) is present in the shipped catalog; guard anyway so a future
  // rename degrades the report instead of crashing the whole gate.
  const label = String(lv.name == null ? '' : lv.name).padEnd(18);
  console.log(`L${pad(lv.id,2)} T${Math.ceil(lv.id/5)} ${label} caps=[${capsStr.padEnd(11)}] target=${pad(lv.target,3)}  par=${pad(lv.par,2)}  flips=${pad(flips,3)}  ${status}`);
  if (!result) allValid = false;
});

console.log(`\n${allValid ? 'ALL ' + LEVELS.length + ' LEVELS VALID' : 'SOME LEVELS FAILED'}`);

// A gate that prints FAIL and exits 0 cannot fail a build (Pitfall #62/#85).
if (!allValid) process.exit(1);