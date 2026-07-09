// In-engine verifier: loads actual index.html, extracts LEVELS,
// applies each solution through the engine's checkSolution-equivalent logic.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the LEVELS array from the script
const m = html.match(/var\s+LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (!m) {
  console.error('FAIL: could not find LEVELS in index.html');
  process.exit(1);
}
const LEVELS = JSON.parse(m[1]);
console.log(`Loaded ${LEVELS.length} levels from index.html`);

// Mirror engine checkSolution logic
function getRegions(grid, R, C) {
  const visited = new Set();
  const regions = [];
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) {
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    const t = grid[r][c];
    if (!t) continue;
    // BFS flood fill same type
    const stack = [[r,c]];
    const cells = [];
    while (stack.length) {
      const [cr,cc] = stack.pop();
      const k2 = `${cr},${cc}`;
      if (visited.has(k2)) continue;
      if (grid[cr][cc] !== t) continue;
      visited.add(k2);
      cells.push([cr,cc]);
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr=cr+dr,nc=cc+dc;
        if (nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]===t) stack.push([nr,nc]);
      }
    }
    regions.push({type:t, cells});
  }
  return regions;
}

function regionsShareEdge(r1, r2) {
  const s1 = new Set(r1.cells.map(c=>`${c[0]},${c[1]}`));
  for (const [r,c] of r2.cells) {
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      if (s1.has(`${r+dr},${c+dc}`)) return true;
    }
  }
  return false;
}

// Engine checkSolution logic (verbatim from index.html semantics)
function checkSolution(R, C, grid, clues) {
  // all cells filled
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) {
    if (!grid[r][c]) return {ok:false, reason:'not all filled'};
  }
  const regions = getRegions(grid, R, C);
  // all regions exactly 5 cells
  for (const reg of regions) {
    if (reg.cells.length !== 5) return {ok:false, reason:`region has ${reg.cells.length} cells`};
  }
  // no same-type regions share edge
  for (let i=0;i<regions.length;i++) for (let j=i+1;j<regions.length;j++) {
    if (regions[i].type === regions[j].type && regionsShareEdge(regions[i], regions[j])) {
      return {ok:false, reason:`same-type ${regions[i].type} regions share edge`};
    }
  }
  // clue consistency
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) {
    const key = `${r},${c}`;
    if (clues[key] && grid[r][c] !== clues[key]) {
      return {ok:false, reason:`clue mismatch at ${key}`};
    }
  }
  return {ok:true, regions: regions.length};
}

let allPass = true;
LEVELS.forEach((lv, idx) => {
  const R = lv.r, C = lv.c;
  // Build grid from solution
  const grid = Array.from({length:R}, () => Array(C).fill(null));
  for (const k of Object.keys(lv.solution)) {
    const [r,c] = k.split(',').map(Number);
    grid[r][c] = lv.solution[k];
  }
  const result = checkSolution(R, C, grid, lv.clues);
  const status = result.ok ? 'PASS' : 'FAIL';
  if (!result.ok) allPass = false;
  console.log(`  Level ${idx+1} (${R}x${C}, ${result.regions||'?'} regions): ${status}${result.ok?'':' - '+result.reason}`);
});

console.log('');
console.log('RESULT:', allPass ? 'ALL PASS' : 'FAILURES DETECTED');
process.exit(allPass ? 0 : 1);
