// verify_engine.js — Loads actual index.html LEVELS and validates through engine logic
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html','utf8');

// Extract LEVELS from the HTML
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('sukoro');
const levelsCode = match[1];

// Evaluate LEVELS in a sandbox
const sandbox = { LEVELS: null };
const ctx = vm.createContext(sandbox);
vm.runInContext('LEVELS = ' + levelsCode + ';', ctx);
console.log(`Loaded ${LEVELS.length} levels from index.html\n`);

function NB(r,c,H,W){
  const out=[];
  if(r>0)out.push([r-1,c]);
  if(r<H-1)out.push([r+1,c]);
  if(c>0)out.push([r,c-1]);
  if(c<W-1)out.push([r,c+1]);
  return out;
}

// Replicate the engine's checkWin validation logic
function engineValidate(grid, H, W){
  const violations = new Set();
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(grid[r][c] <= 0) continue;
      const v = grid[r][c];
      const nbs = NB(r,c,H,W);
      const cnt = nbs.filter(([nr,nc])=>grid[nr][nc]>0).length;
      if(cnt !== v){ violations.add(r+','+c); }
      for(const [nr,nc] of nbs){
        if(grid[nr][nc] === v){ violations.add(r+','+c); }
      }
    }
  }
  return violations;
}

let allPass = true;
let passCount = 0;

LEVELS.forEach((L, idx)=>{
  const H=L.H, W=L.W;
  // The engine uses 'g' (grid) for puzzle and 's' (solution)
  const puzzleGrid = L.g;
  const solution = L.s;

  let errors = [];

  // 1. Check all cells filled in solution
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(puzzleGrid[r][c] >= 0 && solution[r][c] <= 0){
        errors.push(`solution not filled at (${r},${c})`);
      }
    }
  }

  // 2. Run engine validation on solution
  const violations = engineValidate(solution, H, W);
  if(violations.size > 0){
    errors.push(`engine validation found ${violations.size} violations: ${[...violations].slice(0,5).join(', ')}`);
  }

  // 3. Check clues match solution
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(puzzleGrid[r][c] > 0 && puzzleGrid[r][c] !== solution[r][c]){
        errors.push(`clue mismatch at (${r},${c})`);
      }
    }
  }

  // 4. Simulate playtest: fill grid from puzzle clues, then apply solution values
  const playGrid = puzzleGrid.map(r=>r.slice());
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(playGrid[r][c] === 0 && solution[r][c] > 0){
        playGrid[r][c] = solution[r][c];
      }
    }
  }
  // Check playGrid == solution
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      if(playGrid[r][c] !== solution[r][c]){
        errors.push(`playtest mismatch at (${r},${c}): ${playGrid[r][c]} vs ${solution[r][c]}`);
      }
    }
  }
  // Validate playGrid through engine
  const playViolations = engineValidate(playGrid, H, W);
  if(playViolations.size > 0){
    errors.push(`playtest engine validation failed: ${playViolations.size} violations`);
  }

  if(errors.length > 0){
    console.log(`❌ L${L.id} (${L.tier} ${W}x${H}): ${errors.length} errors`);
    errors.forEach(e=>console.log(`   ${e}`));
    allPass = false;
  } else {
    console.log(`✅ L${L.id} (${L.tier} ${W}x${H}): ENGINE VALID`);
    passCount++;
  }
});

console.log(`\n${allPass?'✅ ENGINE ALL PASS':'❌ ENGINE FAILURES'} — ${passCount}/${LEVELS.length} valid`);
process.exit(allPass?0:1);
