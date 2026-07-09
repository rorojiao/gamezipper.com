// Independent verifier: loads HTML, extracts LEVELS, simulates user's checkProgress logic.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('/home/msdn/gamezipper.com/look-air/index.html', 'utf8');
const m = html.match(/const __LEVELS_DATA_SCRIPT__ = `([^`]+)`/);
if (!m) { console.error('No levels data found'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);
console.log(`Loaded ${LEVELS.length} levels`);

function orthNeighbors(R, C, r, c) {
  const out = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r+dr, nc = c+dc;
    if (0<=nr && nr<R && 0<=nc && nc<C) out.push([nr,nc]);
  }
  return out;
}

// For each level, verify that the solution matches the given numbers
let allValid = true;
for (const L of LEVELS) {
  const [R, C] = L.size;
  const nums = L.numbers;
  const sol = L.solution;
  let valid = true;
  // Check every numbered cell matches solution's window count
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (nums[r][c] !== null) {
        let cnt = sol[r][c] ? 1 : 0;
        for (const [nr, nc] of orthNeighbors(R, C, r, c)) {
          if (sol[nr][nc]) cnt++;
        }
        if (cnt !== nums[r][c]) {
          console.log(`L${L.id} MISMATCH at (${r},${c}): expected ${nums[r][c]}, got ${cnt}`);
          valid = false;
          allValid = false;
        }
      }
    }
  }
  // Check blocks form valid squares (orth-touch only between different blocks)
  if (valid) {
    const blockId = Array.from({length: R}, () => Array(C).fill(-1));
    let bi = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (sol[r][c] && blockId[r][c] === -1) {
          // BFS to find connected component (using orth adjacency)
          const stack = [[r, c]];
          blockId[r][c] = bi;
          let minR = r, maxR = r, minC = c, maxC = c;
          const cells = [];
          while (stack.length) {
            const [cr, cc] = stack.pop();
            cells.push([cr, cc]);
            minR = Math.min(minR, cr); maxR = Math.max(maxR, cr);
            minC = Math.min(minC, cc); maxC = Math.max(maxC, cc);
            for (const [nr, nc] of orthNeighbors(R, C, cr, cc)) {
              if (sol[nr][nc] && blockId[nr][nc] === -1) {
                blockId[nr][nc] = bi;
                stack.push([nr, nc]);
              }
            }
          }
          // Check: must be a square
          const h = maxR - minR + 1;
          const w = maxC - minC + 1;
          if (h !== w) {
            console.log(`L${L.id} block ${bi}: not square (${h}x${w})`);
            valid = false; allValid = false;
          } else {
            // Check all cells in square are filled
            for (let rr = minR; rr <= maxR; rr++) {
              for (let cc = minC; cc <= maxC; cc++) {
                if (!sol[rr][cc]) {
                  console.log(`L${L.id} block ${bi}: not fully filled`);
                  valid = false; allValid = false;
                }
              }
            }
          }
          bi++;
        }
      }
    }
  }
  if (valid) console.log(`L${L.id} ${L.tier} ${R}x${C}: VALID (${L.solution.flat().filter(x=>x).length} black cells)`);
}

console.log(`\n${allValid ? 'ALL VALID' : 'SOME INVALID'}`);
process.exit(allValid ? 0 : 1);