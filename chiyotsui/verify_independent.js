// verify_independent.js — Independent Node.js verifier for Chiyotsui levels
// Method 2 of 3-method verification
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

function getBlocks(grid, region, R, C) {
  const visited = Array.from({length: R}, () => new Array(C).fill(false));
  const blocks = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === 1 && !visited[r][c]) {
        const block = [];
        const q = [[r, c]];
        visited[r][c] = true;
        const regions = new Set();
        while (q.length > 0) {
          const [cr, cc] = q.shift();
          block.push([cr, cc]);
          regions.add(region[cr][cc]);
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 1 && !visited[nr][nc]) {
              visited[nr][nc] = true;
              q.push([nr, nc]);
            }
          }
        }
        blocks.push({cells: block, regions});
      }
    }
  }
  return blocks;
}

function mirrorCell(r, c, r1, c1, r2, c2) {
  if (r1 === r2) {
    return [r, 2 * c1 + 1 - c];
  } else {
    return [2 * r1 + 1 - r, c];
  }
}

function verifyLevel(lv) {
  const R = lv.R, C = lv.C;
  const grid = lv.solution;
  const region = lv.region;
  const clues = lv.clues;
  
  // 1. Check blocks span exactly 2 regions
  const blocks = getBlocks(grid, region, R, C);
  for (const {cells, regions} of blocks) {
    if (regions.size !== 2) {
      return {ok: false, msg: `Block spans ${regions.size} regions, expected 2`};
    }
  }
  
  // 2. Check symmetry
  for (const {cells, regions} of blocks) {
    const rids = [...regions];
    const ridA = rids[0], ridB = rids[1];
    const cellsA = cells.filter(([r,c]) => region[r][c] === ridA);
    const cellsB = cells.filter(([r,c]) => region[r][c] === ridB);
    if (cellsA.length !== cellsB.length) {
      return {ok: false, msg: `Block halves different sizes: ${cellsA.length} vs ${cellsB.length}`};
    }
    
    // Find border edges
    const borderEdges = new Set();
    for (const [r, c] of cellsA) {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && region[nr][nc] === ridB) {
          if (cellsB.some(([br, bc]) => br === nr && bc === nc)) {
            const pair = (r < nr || (r === nr && c < nc)) ? `${r},${c},${nr},${nc}` : `${nr},${nc},${r},${c}`;
            borderEdges.add(pair);
          }
        }
      }
    }
    if (borderEdges.size === 0) {
      return {ok: false, msg: 'Block has no border edge between regions'};
    }
    
    // Check symmetry across at least one border edge
    let foundSymmetry = false;
    for (const edge of borderEdges) {
      const [r1, c1, r2, c2] = edge.split(',').map(Number);
      const mirrored = new Set();
      for (const [r, c] of cellsA) {
        const [mr, mc] = mirrorCell(r, c, r1, c1, r2, c2);
        mirrored.add(`${mr},${mc}`);
      }
      const expected = new Set(cellsB.map(([r, c]) => `${r},${c}`));
      if (mirrored.size === expected.size && [...mirrored].every(k => expected.has(k))) {
        foundSymmetry = true;
        break;
      }
    }
    if (!foundSymmetry) {
      return {ok: false, msg: 'Block is not symmetrical across any border edge'};
    }
  }
  
  // 3. Check no two blocks are orth-adjacent
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      for (const [r1, c1] of blocks[i].cells) {
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (blocks[j].cells.some(([r2, c2]) => r2 === r1 + dr && c2 === c1 + dc)) {
            return {ok: false, msg: `Blocks ${i} and ${j} are orthogonally adjacent`};
          }
        }
      }
    }
  }
  
  // 4. Check clue numbers
  const regionCounts = {};
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === 1) {
        const rid = region[r][c];
        regionCounts[rid] = (regionCounts[rid] || 0) + 1;
      }
    }
  }
  for (const [rid, count] of Object.entries(clues)) {
    const actual = regionCounts[rid] || 0;
    if (actual !== count) {
      return {ok: false, msg: `Region ${rid}: ${actual} black cells, clue says ${count}`};
    }
  }
  
  return {ok: true, msg: 'Valid'};
}

let pass = 0;
for (const lv of levels) {
  const result = verifyLevel(lv);
  if (result.ok) {
    pass++;
    console.log(`L${lv.num}: PASS (${lv.num_blocks} blocks)`);
  } else {
    console.log(`L${lv.num}: FAIL — ${result.msg}`);
  }
}
console.log(`\n${pass}/${levels.length} PASS`);
