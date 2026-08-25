// Fillomino generator with STRICT adjacency rule:
// Two regions with same value cannot share an edge.
// Strategy: Greedy fill but reject placements that violate the rule.
const fs = require("fs");

function gen(N, seed) {
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s & 0x7fff) / 0x7fff; };

  const grid = Array.from({length: N}, () => new Array(N).fill(0));

  function fill(r, c) {
    if (r >= N) return true;
    if (c >= N) return fill(r + 1, 0);
    if (grid[r][c] !== 0) return fill(r, c + 1);

    const candidates = [];
    candidates.push({h: 1, w: 1, size: 1, label: 1});
    if (c + 1 < N && grid[r][c + 1] === 0) candidates.push({h: 1, w: 2, size: 2, label: 2});
    if (r + 1 < N && grid[r + 1][c] === 0) candidates.push({h: 2, w: 1, size: 2, label: 2});
    if (c + 2 < N && grid[r][c + 1] === 0 && grid[r][c + 2] === 0) candidates.push({h: 1, w: 3, size: 3, label: 3});
    if (r + 2 < N && grid[r + 1][c] === 0 && grid[r + 2][c] === 0) candidates.push({h: 3, w: 1, size: 3, label: 3});
    if (c + 1 < N && r + 1 < N && grid[r][c + 1] === 0 && grid[r + 1][c] === 0 && grid[r + 1][c + 1] === 0) candidates.push({h: 2, w: 2, size: 4, label: 4});
    if (c + 4 < N && grid[r][c + 1] === 0 && grid[r][c + 2] === 0 && grid[r][c + 3] === 0 && grid[r][c + 4] === 0) candidates.push({h: 1, w: 5, size: 5, label: 5});
    if (r + 4 < N && grid[r + 1][c] === 0 && grid[r + 2][c] === 0 && grid[r + 3][c] === 0 && grid[r + 4][c] === 0) candidates.push({h: 5, w: 1, size: 5, label: 5});

    candidates.sort((a, b) => {
      const wA = a.size === 2 ? 5 : a.size === 3 ? 2 : a.size === 1 ? 1 : 0.5;
      const wB = b.size === 2 ? 5 : b.size === 3 ? 2 : b.size === 1 ? 1 : 0.5;
      const rA = Math.pow(rand(), 1 / wA);
      const rB = Math.pow(rand(), 1 / wB);
      return rB - rA;
    });

    for (const pick of candidates) {
      // Test if placing pick violates adjacency rule
      const wouldPlace = [];
      for (let i = 0; i < pick.h; i++)
        for (let j = 0; j < pick.w; j++)
          wouldPlace.push([r + i, c + j]);
      let ok = true;
      for (const [pr, pc] of wouldPlace) {
        // Check 4 neighbors: outside our new region
        const adj = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of adj) {
          const nr = pr + dr, nc = pc + dc;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          if (wouldPlace.some(([wr, wc]) => wr === nr && wc === nc)) continue;  // same new region
          if (grid[nr][nc] === pick.label) {
            ok = false;
            break;
          }
        }
        if (!ok) break;
      }
      if (ok) {
        for (let i = 0; i < pick.h; i++)
          for (let j = 0; j < pick.w; j++)
            grid[r + i][c + j] = pick.label;
        if (fill(r, c + pick.w)) return true;
        // backtrack
        for (let i = 0; i < pick.h; i++)
          for (let j = 0; j < pick.w; j++)
            grid[r + i][c + j] = 0;
      }
    }
    return false;
  }
  const ok = fill(0, 0);
  if (!ok) console.error("fill failed at", N, seed);
  return { grid, ok };
}

function buildPuzzle(N, seed, name, par) {
  const { grid, ok } = gen(N, seed);
  if (!ok) return null;
  const sol = grid.map(r => r.slice());
  const clues = [];
  const seen = new Set();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const k = r + "," + c;
      if (seen.has(k)) continue;
      const v = grid[r][c];
      const stack = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop();
        const ck = cr + "," + cc;
        if (seen.has(ck)) continue;
        seen.add(ck);
        const adj = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of adj) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          if (grid[nr][nc] === v) stack.push([nr, nc]);
        }
      }
      clues.push([r, c, v]);
    }
  }
  return { n: name, s: N, g: clues, sol: sol, p: par };
}

const sizes = [];
for (let i = 0; i < 6; i++) sizes.push(5);
for (let i = 0; i < 6; i++) sizes.push(6);
for (let i = 0; i < 6; i++) sizes.push(7);
for (let i = 0; i < 6; i++) sizes.push(8);
for (let i = 0; i < 3; i++) sizes.push(9);
for (let i = 0; i < 3; i++) sizes.push(10);

const names = [
  "First Steps","Growing Pairs","Cross Path","Diamond","Corner Work","Grid Lock",
  "Expand","Six Pack","Maze","Hexagon","Twin Peaks","Checker",
  "Lucky Seven","Spiral","Wedge","Columns","Cascade","Cascade II",
  "Eight Square","Lattice","Fortress","Dual Core","Weave","Octagon",
  "Nine Lives","Star Pattern","Complex Web",
  "Grand Finale I","Grand Finale II","Ultimate Fill"
];

const LEVELS = [];
for (let i = 0; i < sizes.length; i++) {
  const N = sizes[i];
  const seed = 1000 + i * 23;
  const par = 30 + N * 8 + i * 4;
  let p = null;
  for (let attempt = 0; attempt < 50 && !p; attempt++) {
    p = buildPuzzle(N, seed + attempt * 7, names[i] || ("Level " + (i + 1)), par);
  }
  if (!p) { console.error("failed level", i); process.exit(1); }
  LEVELS.push(p);
}

const seen = new Map();
for (let i = 0; i < LEVELS.length; i++) {
  const key = JSON.stringify({s: LEVELS[i].s, g: LEVELS[i].g, sol: LEVELS[i].sol});
  if (seen.has(key)) {
    console.error("DUPLICATE at", i, "==", seen.get(key));
    process.exit(1);
  }
  seen.set(key, i);
}
console.log("All 30 unique.");
LEVELS.forEach((l, i) => console.log(i, "n=" + l.n, "s=" + l.s, "regions=" + l.g.length));

let js = "var LEVELS=[\n";
for (let i = 0; i < LEVELS.length; i++) {
  const p = LEVELS[i];
  const cluesStr = "[" + p.g.map(c => `[${c[0]},${c[1]},${c[2]}]`).join(",") + "]";
  const solStr = "[" + p.sol.map(row => "[" + row.join(",") + "]").join(",") + "]";
  js += `{n:"${p.n}",s:${p.s},g:${cluesStr},sol:${solStr},p:${p.p}}`;
  if (i < LEVELS.length - 1) js += ",\n";
  else js += "\n";
}
js += "];\n";
fs.writeFileSync("/tmp/fillomino-levels.js", js);
console.log("Wrote /tmp/fillomino-levels.js, " + js.length + " bytes");