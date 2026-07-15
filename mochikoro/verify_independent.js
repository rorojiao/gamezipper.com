// verify_independent.js — Method 2: Independent Node.js verifier for Mochikoro
// Loads levels.json, checks each solution satisfies all 5 Mochikoro rules:
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function getWhiteComponents(grid, R, C) {
  const seen = new Set();
  const comps = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === 0 && !seen.has(r+','+c)) {
        const comp = [];
        const stack = [[r,c]];
        seen.add(r+','+c);
        while (stack.length) {
          const [cr,cc] = stack.pop();
          comp.push([cr,cc]);
          for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr=cr+dr,nc=cc+dc;
            if (nr>=0&&nr<R&&nc>=0&&nc<C && grid[nr][nc]===0 && !seen.has(nr+','+nc)) {
              seen.add(nr+','+nc); stack.push([nr,nc]);
            }
          }
        }
        let minR=comp[0][0],maxR=comp[0][0],minC=comp[0][1],maxC=comp[0][1];
        for (const [x,y] of comp) { minR=Math.min(minR,x);maxR=Math.max(maxR,x);minC=Math.min(minC,y);maxC=Math.max(maxC,y); }
        comps.push({cells: comp, minR, maxR, minC, maxC});
      }
    }
  }
  return comps;
}

function has2x2Black(grid, R, C) {
  for (let r = 0; r < R-1; r++) {
    for (let c = 0; c < C-1; c++) {
      if (grid[r][c]===1 && grid[r+1][c]===1 && grid[r][c+1]===1 && grid[r+1][c+1]===1) return true;
    }
  }
  return false;
}

function whiteDiagConnected(grid, R, C, comps) {
  if (comps.length <= 1) return true;
  const cellComp = {};
  comps.forEach((co, i) => co.cells.forEach(([r,c]) => cellComp[r+','+c] = i));
  const adj = comps.map(() => new Set());
  for (const key in cellComp) {
    const [r,c] = key.split(',').map(Number);
    const ci = cellComp[key];
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const nr=r+dr,nc=c+dc;
      if (nr>=0&&nr<R&&nc>=0&&nc<C) {
        const nci = cellComp[nr+','+nc];
        if (nci !== undefined && nci !== ci) adj[ci].add(nci);
      }
    }
  }
  const seen = new Set([0]), stack = [0];
  while (stack.length) {
    const cur = stack.pop();
    for (const n of adj[cur]) if (!seen.has(n)) { seen.add(n); stack.push(n); }
  }
  return seen.size === comps.length;
}

function verifySolution(level) {
  const R = level.R, C = level.C;
  // Build grid: 0=white, 1=black
  const grid = Array.from({length:R}, () => new Array(C).fill(0));
  for (const key of level.solution_black) {
    const [r,c] = key.split(',').map(Number);
    grid[r][c] = 1;
  }
  // Rule 1: no 2x2 fully black
  if (has2x2Black(grid, R, C)) return { ok: false, msg: '2x2 black block' };
  // Get white components
  const comps = getWhiteComponents(grid, R, C);
  // Rule 2: each white comp is rectangular
  for (const co of comps) {
    const expected = (co.maxR-co.minR+1) * (co.maxC-co.minC+1);
    if (co.cells.length !== expected) return { ok: false, msg: `non-rect white at (${co.minR},${co.minC})` };
  }
  // Rule 3 + clue constraints
  const cluePos = {};
  for (const k in level.clues) cluePos[k] = level.clues[k];
  for (const co of comps) {
    const cs = new Set(co.cells.map(([r,c]) => r+','+c));
    let clueCount = 0;
    for (const [r,c] of co.cells) {
      const k = r+','+c;
      if (cluePos[k] !== undefined) {
        clueCount++;
        if (cluePos[k] !== co.cells.length) return { ok: false, msg: `clue at (${r},${c}) = ${cluePos[k]} but region size = ${co.cells.length}` };
      }
    }
    if (clueCount > 1) return { ok: false, msg: `region has ${clueCount} clues` };
  }
  // clue cells must be white (not black)
  for (const k in cluePos) {
    const [r,c] = k.split(',').map(Number);
    if (grid[r][c] !== 0) return { ok: false, msg: `clue at (${r},${c}) is black` };
  }
  // Rule 5: white diag-connected
  if (!whiteDiagConnected(grid, R, C, comps)) return { ok: false, msg: 'white not diag-connected' };
  return { ok: true };
}

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < levels.length; i++) {
  const res = verifySolution(levels[i]);
  if (res.ok) {
    pass++;
  } else {
    fail++;
    fails.push(`L${i+1} ${levels[i].tier} ${levels[i].R}x${levels[i].C}: FAIL — ${res.msg}`);
  }
}
console.log(`=== Independent Mochikoro verification: ${pass}/${levels.length} PASS, ${fail} FAIL ===`);
if (fails.length) {
  for (const f of fails) console.log(f);
}
process.exit(fail > 0 ? 1 : 0);
