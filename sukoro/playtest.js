// playtest.js — Simulate playing each level through the engine's game logic
// This replays the solution through the actual interaction flow

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html','utf8');
const match = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
const sandbox = { LEVELS: null };
const ctx = vm.createContext(sandbox);
vm.runInContext('LEVELS = ' + match[1] + ';', ctx);
const LEVELS = sandbox.LEVELS;

function NB(r,c,H,W){
  const out=[];
  if(r>0)out.push([r-1,c]);
  if(r<H-1)out.push([r+1,c]);
  if(c>0)out.push([r,c-1]);
  if(c<W-1)out.push([r,c+1]);
  return out;
}

// Simulate the engine's click logic: place value in cell
function simulateClick(puzzleGrid, grid, r, c, value, H, W){
  // Replicate: if puzzleGrid[r][c] === -1 -> wall, skip
  if(puzzleGrid[r][c] === -1) return false;
  if(puzzleGrid[r][c] > 0) return false; // clue
  grid[r][c] = value;
  return true;
}

// Replicate checkViolations
function checkViolations(grid, puzzleGrid, H, W){
  const violations = new Set();
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(grid[r][c] <= 0) continue;
      const v = grid[r][c];
      const nbs = NB(r,c,H,W);
      const cnt = nbs.filter(([nr,nc])=>grid[nr][nc]>0).length;
      const allDecided = nbs.every(([nr,nc])=> puzzleGrid[nr][nc]===-1 || grid[nr][nc]>0 || puzzleGrid[nr][nc]>0);
      if(allDecided && cnt !== v){
        violations.add(r+','+c);
      }
      for(const [nr,nc] of nbs){
        if(grid[nr][nc] === v && grid[nr][nc] > 0){
          violations.add(r+','+c);
          violations.add(nr+','+nc);
        }
      }
    }
  }
  return violations;
}

// Replicate checkWin
function checkWin(grid, puzzleGrid, H, W){
  // all numbered cells filled?
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(puzzleGrid[r][c] === -1) continue;
      if(grid[r][c] <= 0) return false;
    }
  }
  // validate
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(grid[r][c] <= 0) continue;
      const v = grid[r][c];
      const nbs = NB(r,c,H,W);
      const cnt = nbs.filter(([nr,nc])=>grid[nr][nc]>0).length;
      if(cnt !== v) return false;
      for(const [nr,nc] of nbs){
        if(grid[nr][nc] === v) return false;
      }
    }
  }
  return true;
}

let allPass = true;
let passCount = 0;

LEVELS.forEach((L, idx)=>{
  const H=L.H, W=L.W;
  const puzzleGrid = L.g.map(r=>r.slice());
  const solution = L.s;
  
  // Initialize game grid from puzzle
  const grid = puzzleGrid.map(r=>r.slice());
  
  // Simulate playing: fill in each blank cell with its solution value
  let moveCount = 0;
  let errorDuringPlay = false;
  
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(puzzleGrid[r][c] === 0 && solution[r][c] > 0){
        const ok = simulateClick(puzzleGrid, grid, r, c, solution[r][c], H, W);
        if(!ok){
          console.log(`❌ L${L.id}: failed to place at (${r},${c})`);
          errorDuringPlay = true;
          break;
        }
        moveCount++;
      }
    }
    if(errorDuringPlay) break;
  }
  
  if(errorDuringPlay){
    allPass = false;
    return;
  }
  
  // Check win condition
  const won = checkWin(grid, puzzleGrid, H, W);
  
  // Also check no violations at the end
  const finalViolations = checkViolations(grid, puzzleGrid, H, W);
  
  if(won && finalViolations.size === 0){
    console.log(`✅ L${L.id} (${L.tier} ${W}x${H}): PLAYTEST PASS — ${moveCount} moves, won`);
    passCount++;
  } else {
    console.log(`❌ L${L.id} (${L.tier} ${W}x${H}): PLAYTEST FAIL — won=${won}, violations=${finalViolations.size}`);
    allPass = false;
  }
});

console.log(`\n${allPass?'✅ PLAYTEST ALL PASS':'❌ PLAYTEST FAILURES'} — ${passCount}/${LEVELS.length} passed`);
process.exit(allPass?0:1);
