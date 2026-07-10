/**
 * Yin-Yang — In-Engine Verifier
 * Extracts the LEVELS array from the actual index.html and validates every
 * level's embedded solution using the SAME rules the game engine enforces
 * (checkWin): filled, no mono 2x2, both colours connected. Also confirms the
 * clues in the puzzle match the solution.
 */
const fs=require('fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const m=html.match(/const LEVELS=(\[.*?\]);/s);
if(!m){console.error('LEVELS not found');process.exit(1);}
const LEVELS=JSON.parse(m[1]);
const DIRS=[[-1,0],[1,0],[0,-1],[0,1]];

function connectedColor(board,R,C,color){
  const cells=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(board[r][c]===color)cells.push([r,c]);
  if(cells.length===0)return true;
  const seen=new Set();const key=(r,c)=>r*C+c;
  const st=[cells[0]];seen.add(key(cells[0][0],cells[0][1]));
  while(st.length){const [r,c]=st.pop();for(const [dr,dc] of DIRS){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<R&&nc>=0&&nc<C&&board[nr][nc]===color&&!seen.has(key(nr,nc))){seen.add(key(nr,nc));st.push([nr,nc]);}}}
  return seen.size===cells.length;
}
function monoBlocks(board,R,C){let n=0;for(let r=0;r<R-1;r++)for(let c=0;c<C-1;c++){const v=board[r][c];if(v!==-1&&board[r][c+1]===v&&board[r+1][c]===v&&board[r+1][c+1]===v)n++;}return n;}
function checkWin(board,R,C){
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(board[r][c]===-1)return false;
  if(monoBlocks(board,R,C)>0)return false;
  if(!connectedColor(board,R,C,0))return false;
  if(!connectedColor(board,R,C,1))return false;
  return true;
}

console.log('\n=== Yin-Yang In-Engine Verification ===');
console.log('Levels loaded from index.html:',LEVELS.length,'\n');
let allPass=true,checked=0;
for(let i=0;i<LEVELS.length;i++){
  const lv=LEVELS[i];const R=lv.r,C=lv.c;
  const sol=lv.sol.map(row=>row.split('').map(Number));
  // 1. engine checkWin on the embedded solution
  const win=checkWin(sol,R,C);
  // 2. clues must match solution
  let cluesOk=true;
  for(const [r,c,v] of lv.clues){if(sol[r][c]!==v){cluesOk=false;break;}}
  // 3. clue count > 0 and within grid
  const clueOk=lv.clues.length>0 && lv.clues.every(([r,c,v])=>r>=0&&r<R&&c>=0&&c<C&&(v===0||v===1));
  const ok=win&&cluesOk&&clueOk;
  if(!ok)allPass=false;checked++;
  console.log(`  ${ok?'✅':'❌'} L${i+1} ${R}x${C} ${lv.tier} — ${lv.clues.length} clues — checkWin:${win?'OK':'FAIL'} cluesMatch:${cluesOk?'OK':'FAIL'} clueValid:${clueOk?'OK':'FAIL'}`);
}
console.log(`\n=== RESULT: ${allPass?('ALL '+checked+' LEVELS VALID ✅'):'SOME FAILED ❌'} ===`);
process.exit(allPass?0:1);
