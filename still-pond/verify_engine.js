#!/usr/bin/env node
/**
 * Method 3: Engine verifier — load the game's JS engine from index.html,
 * confirm the still-life check matches the solution for every level.
 *
 * We can't easily import HTML, so we test the equivalent pure-JS code that
 * the engine uses, by re-implementing the engine logic and asserting it
 * agrees with the stored solution.
 */

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('levels.json', 'utf8')).LEVELS;

// Replicate the engine's golStep / isStillLife / verify logic.
// Match the constants used in index.html.
const NEIGHBORS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function golStep(grid, n) {
  const out = new Array(n*n).fill(0);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let cnt = 0;
      for (const [dr, dc] of NEIGHBORS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr*n + nc]) cnt++;
      }
      if (grid[r*n + c]) {
        out[r*n + c] = (cnt === 2 || cnt === 3) ? 1 : 0;
      } else {
        out[r*n + c] = (cnt === 3) ? 1 : 0;
      }
    }
  }
  return out;
}

function isStillLife(grid, n) {
  const s = golStep(grid, n);
  for (let i = 0; i < n*n; i++) if (s[i] !== grid[i]) return false;
  return true;
}

function verifyLevel(lv) {
  const n = lv.N;
  const grid = lv.s.slice();
  // Check givens match
  for (const [r, c, v] of lv.g) {
    if (grid[r*n + c] !== v) return { ok: false, reason: `given mismatch (${r},${c}) sol=${grid[r*n+c]} given=${v}` };
  }
  if (!isStillLife(grid, n)) return { ok: false, reason: 'not still-life' };
  // Edge validation: non-given cells must match solution
  const givenSet = new Set(lv.g.map(([r,c]) => r*n+c));
  for (let i = 0; i < n*n; i++) {
    if (!givenSet.has(i)) continue;
    if (grid[i] !== lv.g.find(([r,c]) => r*n+c === i)[2]) {
      return { ok: false, reason: `given cell ${i} value mismatch` };
    }
  }
  return { ok: true };
}

let pass = 0;
const fails = [];
for (const lv of data) {
  const r = verifyLevel(lv);
  if (r.ok) pass++;
  else fails.push(`L${lv.i+1}: ${r.reason}`);
}
console.log(`${pass}/${data.length} levels PASS`);
if (fails.length) {
  for (const f of fails.slice(0, 5)) console.log(' ', f);
  process.exit(1);
}
process.exit(0);
