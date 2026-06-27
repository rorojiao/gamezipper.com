// Dominosa Level Verification - Fixed Generation
const TIER_CONFIG = [
  {name:'Easy',maxNum:2,rows:3,cols:4},
  {name:'Medium',maxNum:3,rows:4,cols:5},
  {name:'Hard',maxNum:4,rows:5,cols:6},
  {name:'Expert',maxNum:5,rows:6,cols:7},
  {name:'Master',maxNum:6,rows:7,cols:8}
];

const LEVELS_PER_TIER = 6;
const TOTAL_LEVELS = 30;

function seededRandom(seed){
  let t=seed+123456789;
  return function(){
    t=t^t<<13;
    t=t^t>>>17;
    t=t^t<<5;
    return (t>>>0)/4294967296;
  };
}

function generateLevel(lvl){
  const tierIdx=Math.min(Math.floor((lvl-1)/LEVELS_PER_TIER),TIER_CONFIG.length-1);
  const config=TIER_CONFIG[tierIdx];
  const maxNum=config.maxNum;
  const rows=config.rows;
  const cols=config.cols;
  
  const dominoSet=[];
  for(let i=0;i<=maxNum;i++){
    for(let j=i;j<=maxNum;j++){
      dominoSet.push([i,j]);
    }
  }
  const cellsNeeded=rows*cols;
  const numDominoes=cellsNeeded/2;
  if(dominoSet.length!==numDominoes){
    return null;
  }

  const rng=seededRandom(lvl*12345+67890);
  function shuffle(arr){
    const result=[...arr];
    for(let i=result.length-1;i>0;i--){
      const j=Math.floor(rng()*result.length);
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }

  const dominoes=shuffle(dominoSet);
  const grid=new Array(rows).fill(null).map(()=>new Array(cols).fill(0));

  // Fixed backtrack: try positions in order, not shuffled each time
  function backtrack(idx){
    if(idx>=dominoes.length)return true;
    const d=dominoes[idx];
    
    // Collect all possible positions
    const positions=[];
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        if(grid[r][c]!==0)continue;
        if(c+1<cols&&grid[r][c+1]===0)positions.push([r,c,r,c+1]);
        if(r+1<rows&&grid[r+1][c]===0)positions.push([r,c,r+1,c]);
      }
    }
    
    // Shuffle positions once per backtrack call
    for(let i=positions.length-1;i>0;i--){
      const j=Math.floor(rng()*positions.length);
      [positions[i],positions[j]]=[positions[j],positions[i]];
    }
    
    for(const pos of positions){
      const [r1,c1,r2,c2]=pos;
      grid[r1][c1]=d[0];
      grid[r2][c2]=d[1];
      if(backtrack(idx+1))return true;
      grid[r1][c1]=0;
      grid[r2][c2]=0;
    }
    return false;
  }

  const success=backtrack(0);
  if(!success)return null;

  return {grid, rows, cols, maxNum, tier: config.name};
}

console.log('=== Dominosa Level Verification ===\n');

let allPassed = true;
let issues = [];

for(let lvl=1;lvl<=TOTAL_LEVELS;lvl++){
  const result=generateLevel(lvl);
  
  if(!result){
    allPassed = false;
    issues.push(`Level ${lvl}: Generation failed`);
    continue;
  }
  
  const {grid, rows, cols, maxNum, tier} = result;
  
  // Check 1: All cells filled
  let emptyCells=0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(grid[r][c]===0)emptyCells++;
    }
  }
  if(emptyCells>0){
    allPassed=false;
    issues.push(`Level ${lvl}: ${emptyCells} empty cells`);
  }
  
  // Check 2: All numbers in valid range
  let outOfRange=0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(grid[r][c]<0||grid[r][c]>maxNum)outOfRange++;
    }
  }
  if(outOfRange>0){
    allPassed=false;
    issues.push(`Level ${lvl}: ${outOfRange} cells out of range (0-${maxNum})`);
  }
  
  // Check 3: Domino count matches expected
  const expectedDominoes=(maxNum+1)*(maxNum+2)/2;
  const actualCells=rows*cols;
  const actualDominoes=actualCells/2;
  if(expectedDominoes!==actualDominoes){
    allPassed=false;
    issues.push(`Level ${lvl}: Expected ${expectedDominoes} dominoes, grid has ${actualDominoes}`);
  }
  
  console.log(`Level ${lvl} (${tier} ${rows}x${cols}, 0-${maxNum}): ${emptyCells===0 && outOfRange===0 ? 'OK' : 'FAIL'}`);
}

console.log('\n=== Summary ===');
console.log(`Total levels: ${TOTAL_LEVELS}`);
console.log(`Passed: ${allPassed ? 'ALL' : 'SOME FAILED'}`);
if(!allPassed){
  console.log('\nIssues:');
  issues.forEach(issue=>console.log(`  - ${issue}`));
  process.exit(1);
} else {
  console.log('All levels validated successfully!');
  process.exit(0);
}
