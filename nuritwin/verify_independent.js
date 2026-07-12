// Independent Nuritwin level verifier (Node.js)
// Loads levels.json and verifies all rules independently of gen_levels.py
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/nuritwin/levels.json','utf8'));

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function neighbors(r, c, R, C) {
  return DIRS.map(([dr,dc]) => [r+dr, c+dc]).filter(([nr,nc]) => nr>=0 && nr<R && nc>=0 && nc<C);
}

function has2x2(shaded, R, C) {
  for (let r = 0; r < R-1; r++)
    for (let c = 0; c < C-1; c++)
      if (shaded.has(r+','+c) && shaded.has(r+','+(c+1)) && shaded.has((r+1)+','+c) && shaded.has((r+1)+','+(c+1)))
        return true;
  return false;
}

function isConnected(shaded, R, C) {
  if (shaded.size === 0) return false;
  const start = [...shaded][0];
  const visited = new Set([start]);
  const stack = [start.split(',').map(Number)];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [nr, nc] of neighbors(r, c, R, C)) {
      const k = nr+','+nc;
      if (shaded.has(k) && !visited.has(k)) {
        visited.add(k);
        stack.push([nr, nc]);
      }
    }
  }
  return visited.size === shaded.size;
}

function getBlocks(shadedInRegion, R, C) {
  const cells = [...shadedInRegion];
  const cellSet = new Set(cells.map(c => c.join(',')));
  const visited = new Set();
  const blocks = [];
  for (const cell of cells) {
    const key = cell.join(',');
    if (visited.has(key)) continue;
    const comp = [cell];
    visited.add(key);
    const stack = [cell];
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [nr, nc] of neighbors(r, c, R, C)) {
        const nk = nr+','+nc;
        if (cellSet.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          comp.push([nr, nc]);
          stack.push([nr, nc]);
        }
      }
    }
    blocks.push(comp);
  }
  return blocks;
}

function blocksTouch(b1, b2) {
  const s2 = new Set(b2.map(c => c.join(',')));
  for (const [r, c] of b1)
    for (const [dr, dc] of DIRS)
      if (s2.has((r+dr)+','+(c+dc))) return true;
  return false;
}

function verify(p) {
  const R = p.rows, C = p.cols;
  const regionArr = p.regions;
  const sol = p.solution;
  const clues = p.clues || {};

  const grid = [];
  const regionId = [];
  for (let r = 0; r < R; r++) {
    grid[r] = [];
    regionId[r] = [];
    for (let c = 0; c < C; c++) {
      grid[r][c] = parseInt(sol[r*C+c]);
      regionId[r][c] = regionArr[r*C+c];
    }
  }

  const regionShaded = {};
  const allShaded = new Set();
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (grid[r][c] === 1) {
        const rid = regionId[r][c];
        if (!regionShaded[rid]) regionShaded[rid] = [];
        regionShaded[rid].push([r, c]);
        allShaded.add(r+','+c);
      }

  if (has2x2(allShaded, R, C)) return [false, '2x2 shaded block'];

  const allRegionIds = new Set();
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      allRegionIds.add(regionId[r][c]);

  for (const rid of allRegionIds) {
    const shaded = regionShaded[rid] || [];
    const blocks = getBlocks(shaded, R, C);
    if (blocks.length !== 2) return [false, `region ${rid} has ${blocks.length} blocks (need 2)`];
    if (blocks[0].length !== blocks[1].length) return [false, `region ${rid} blocks differ in size`];
    if (blocksTouch(blocks[0], blocks[1])) return [false, `region ${rid} blocks touch`];
  }

  if (!isConnected(allShaded, R, C)) return [false, 'shaded not globally connected'];

  for (const [key, k] of Object.entries(clues)) {
    const [r, c] = key.split(',').map(Number);
    const rid = regionId[r][c];
    const shaded = regionShaded[rid] || [];
    if (!shaded.length) return [false, `clue at ${key} region ${rid} empty`];
    const blocks = getBlocks(shaded, R, C);
    if (blocks.length !== 2 || blocks[0].length !== k || blocks[1].length !== k)
      return [false, `clue ${k} at ${key} mismatch`];
  }

  return [true, 'OK'];
}

let allOk = true;
for (let i = 0; i < levels.length; i++) {
  const [ok, msg] = verify(levels[i]);
  if (!ok) { console.log(`L${i+1} FAIL: ${msg}`); allOk = false; }
  else console.log(`L${i+1}: PASS (${levels[i].rows}x${levels[i].cols}, ${levels[i].region_count} regions)`);
}
console.log(allOk ? '\nALL 30 LEVELS VERIFIED OK (Node independent)' : '\nSOME LEVELS FAILED');
process.exit(allOk ? 0 : 1);
