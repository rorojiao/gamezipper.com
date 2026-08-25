// fillomino per-game verifier — confirms all 30 LEVELS are unique + rule-valid
// Usage: node fillomino/verify_engine.js

const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "index.html");
const src = fs.readFileSync(indexPath, "utf8");

// Extract LEVELS array via balanced-bracket extraction
const re = /var LEVELS=\[/;
const m = re.exec(src);
if (!m) { console.error("FATAL: no LEVELS array found"); process.exit(1); }
const start = m.index + m[0].length;
let depth = 1, end = -1;
let inStr = false, strQ = "";
for (let i = start; i < src.length; i++) {
  const c = src[i];
  const prev = i > 0 ? src[i-1] : "";
  if (inStr) { if (c === strQ && prev !== "\\") inStr = false; continue; }
  if (c === "\"" || c === "\x27") { inStr = true; strQ = c; continue; }
  if (c === "[") depth++;
  else if (c === "]") { depth--; if (depth === 0) { end = i; break; } }
}
const arrText = src.substring(start, end).replace(/^\s+|\s+$/g, "");
let LEVELS;
try {
  const fn = new Function("return eval(arguments[0]);");
  LEVELS = fn("[" + arrText + "]");
} catch(e) {
  console.error("FATAL: LEVELS eval failed:", e.message);
  process.exit(1);
}

console.log("LEVELS extracted:", LEVELS.length);
let pass = 0, fail = 0;
const errors = [];

function checkOne(p, idx) {
  const N = p.s;
  // 1. shape
  if (!Array.isArray(p.g) || !Array.isArray(p.sol)) {
    errors.push(`L${idx}: bad shape`);
    return false;
  }
  if (p.sol.length !== N) { errors.push(`L${idx}: sol has ${p.sol.length} rows, expected ${N}`); return false; }
  for (let r = 0; r < N; r++) {
    if (p.sol[r].length !== N) { errors.push(`L${idx}: sol[${r}] has ${p.sol[r].length} cols, expected ${N}`); return false; }
  }
  // 2. rule: same-value adjacent cells must be same region
  // Build region map
  const regionOf = Array.from({length: N}, () => new Array(N).fill(-1));
  let rid = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (regionOf[r][c] !== -1) continue;
      const v = p.sol[r][c];
      const stack = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop();
        if (regionOf[cr][cc] !== -1) continue;
        regionOf[cr][cc] = rid;
        const adj = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of adj) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          if (p.sol[nr][nc] === v && regionOf[nr][nc] === -1) stack.push([nr, nc]);
        }
      }
      rid++;
    }
  }
  // Each region size must equal its cells' value
  const regionSizes = {};
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    regionSizes[regionOf[r][c]] = (regionSizes[regionOf[r][c]] || 0) + 1;
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const regionId = regionOf[r][c];
      const cellVal = p.sol[r][c];
      const regionSize = regionSizes[regionId];
      if (cellVal !== regionSize) {
        errors.push(`L${idx}: cell (${r},${c}) value=${cellVal} but region size=${regionSize}`);
        return false;
      }
    }
  }
  // Verify same-value adjacent cells are same region
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (c + 1 < N && p.sol[r][c] === p.sol[r][c+1] && regionOf[r][c] !== regionOf[r][c+1]) {
        errors.push(`L${idx}: same-val cells (${r},${c})(${r},${c+1}) in different regions`);
        return false;
      }
      if (r + 1 < N && p.sol[r][c] === p.sol[r+1][c] && regionOf[r][c] !== regionOf[r+1][c]) {
        errors.push(`L${idx}: same-val cells (${r},${c})(${r+1},${c}) in different regions`);
        return false;
      }
    }
  }
  // 3. clues must be 1 cell per region
  const clueCells = new Set();
  for (const [r, c, v] of p.g) {
    if (r < 0 || r >= N || c < 0 || c >= N) {
      errors.push(`L${idx}: clue (${r},${c}) out of bounds`);
      return false;
    }
    if (p.sol[r][c] !== v) {
      errors.push(`L${idx}: clue value mismatch at (${r},${c}) (clue=${v} sol=${p.sol[r][c]})`);
      return false;
    }
    const k = r + "," + c;
    if (clueCells.has(k)) {
      errors.push(`L${idx}: duplicate clue cell (${r},${c})`);
      return false;
    }
    clueCells.add(k);
  }
  if (clueCells.size !== rid) {
    errors.push(`L${idx}: ${clueCells.size} clues but ${rid} regions`);
    return false;
  }
  // 4. uniqueness among all 30
  return true;
}

const seen = new Map();
for (let i = 0; i < LEVELS.length; i++) {
  const p = LEVELS[i];
  const key = JSON.stringify({s: p.s, g: p.g, sol: p.sol});
  if (seen.has(key)) {
    errors.push(`L${i}: duplicate of L${seen.get(key)}`);
    fail++;
    continue;
  }
  seen.set(key, i);
  if (checkOne(p, i)) pass++;
  else fail++;
}

console.log(`\nResults: ${pass}/${LEVELS.length} PASS, ${fail} FAIL`);
if (errors.length) {
  console.log("\nErrors:");
  for (const e of errors) console.log("  " + e);
}
console.log(`\nSizes: ${[...new Set(LEVELS.map(l => l.s))].sort().join(", ")}`);
console.log(`Region counts: ${LEVELS.map(l => l.g.length).join(", ")}`);

process.exit(fail > 0 ? 1 : 0);