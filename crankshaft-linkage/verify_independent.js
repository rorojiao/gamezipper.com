#!/usr/bin/env node
/**
 * Independent Node.js BFS/verification for Crankshaft Linkage.
 * Does NOT import game code — recomputes slider positions from scratch.
 */
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels_compact.json','utf8'));

function sliderX(angleIdx, nPos, radius) {
  const ang = angleIdx * 2 * Math.PI / nPos;
  return Math.round(radius * Math.cos(ang) * 10) / 10;
}

let pass = 0, fail = 0;
levels.forEach((lvl, i) => {
  const { n, p, r, t, s, par } = lvl;
  // Verify solution hits targets
  let solOk = true;
  for (let c = 0; c < n; c++) {
    const x = sliderX(s[c], p, r);
    if (Math.abs(x - t[c]) > 0.5) solOk = false;
  }
  // Count solutions via per-crank matching set product
  let count = 1;
  const sets = [];
  for (let c = 0; c < n; c++) {
    const matching = [];
    for (let a = 0; a < p; a++) {
      if (Math.abs(sliderX(a, p, r) - t[c]) < 0.5) matching.push(a);
    }
    if (matching.length === 0) { count = 0; break; }
    sets.push(matching);
    count *= matching.length;
  }
  const unique = count === 1;
  if (solOk && unique) {
    pass++;
  } else {
    fail++;
    console.log(`L${i+1} FAIL: solOk=${solOk} count=${count} unique=${unique}`);
  }
});
console.log(`\nIndependent Node BFS: ${pass}/${levels.length} UNIQUE+VALID`);
process.exit(fail === 0 ? 0 : 1);
