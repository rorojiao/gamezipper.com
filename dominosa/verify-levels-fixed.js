// Dominosa Level Verification - Fixed
// Generate valid tiling first, then assign domino numbers

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
  
  // Build domino set
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

  // Step 1: Generate a valid tiling (which cells form dominoes)
  const cellOwners=new Array(rows).fill(null).map(()=>new Array(cols).fill(-1));
  const dominoPositions=[]; // list of [r1,c1,r2,c2]
  
  function backtrackTiling(r,c,depth){
    if(depth>=numDominoes)return true;
    // Find first empty cell
    while(r<rows&&cellOwners[r][c]!==-1){
      c++;
      if(c>=cols){c=0;r++;}
    }
    if(r>=rows)return false;
    
    // Try horizontal
    if(c+1<cols&&cellOwners[r][c+1]===-1){
      cellOwners[r][c]=cellOwners[r][c+1]=depth;
      dominoPositions[depth]=[r,c,r,c+1];
      if(backtrackTiling(r,c+2,depth+1))return true;
      cellOwners[r][c]=cellOwners[r][c+1]=-1;
    }
    // Try vertical
    if(r+1<rows&&cellOwners[r+1][c]===-1){
      cellOwners[r][c]=cellOwners[r+1][c]=depth;
      dominoPositions[depth]=[r,c,r+1,c];
      let nr=r+2,nc=c;
      if(nr>=rows){nr=0;nc=0;}
      if(backtrackTiling(nr,nc,depth+1))return true;
      cellOwners[r][c]=cellOwners[r+1][c]=-1;
    }
    return false;
  }
  
  if(!backtrackTiling(0,0,0))return null;

  // Step 2: Shuffle dominoes and assign them to the positions
  const shuffledDominoes=shuffle(dominoSet);
  const grid=new Array(rows).fill(null).map(()=>new Array(cols).fill(-1)); // -1 = truly empty
  
  for(let i=0;i<numDominoes;i++){
    const [r1,c1,r2,c2]=dominoPositions[i];
    const [n1,n2]=shuffledDominoes[i];
    grid[r1][c1]=n1;
    grid[r2][c2]=n2;
  }

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
  
  // Check 1: All cells filled (values -1 mean truly empty, 0 is valid)
  let emptyCells=0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(grid[r][c]===-1)emptyCells++;
    }
  }
  if(emptyCells>0){
    allPassed=false;
    issues.push(`Level ${lvl}: ${emptyCells} empty cells`);
  }
  
  // Check 2: All numbers in valid range (0 to maxNum)
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