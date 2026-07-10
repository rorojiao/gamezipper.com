/**
 * Yin-Yang — Playtest Simulation
 * For each level, start from the clue board, "play" every non-fixed cell to its
 * solution value (as a human clicking would), and confirm the win condition
 * triggers exactly when the board is complete & correct.
 */
const fs=require('fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const m=html.match(/const LEVELS=(\[.*?\]);/s);
const LEVELS=JSON.parse(m[1]);
const DIRS=[[-1,0],[1,0],[0,-1],[0,1]];

function connectedColor(board,R,C,color){
  const cells=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(board[r][c]===color)cells.push([r,c]);
  if(cells.length===0)return true;
  const seen=new Set();const key=(r,c)=>r*C+c;const st=[cells[0]];seen.add(key(cells[0][0],cells[0][1]));
  while(st.length){const [r,c]=st.pop();for(const [dr,dc] of DIRS){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<R&&nc>=0&&nc<C&&board[nr][nc]===color&&!seen.has(key(nr,nc))){seen.add(key(nr,nc));st.push([nr,nc]);}}}
  return seen.size===cells.length;
}
function monoBlocks(board,R,C){let n=0;for(let r=0;r<R-1;r++)for(let c=0;c<C-1;c++){const v=board[r][c];if(v!==-1&&board[r][c+1]===v&&board[r+1][c]===v&&board[r+1][c+1]===v)n++;}return n;}
function checkWin(board,R,C){for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(board[r][c]===-1)return false;if(monoBlocks(board,R,C)>0)return false;if(!connectedColor(board,R,C,0))return false;if(!connectedColor(board,R,C,1))return false;return true;}

console.log('\n=== Yin-Yang Playtest Simulation ===\n');
let allPass=true;
for(let i=0;i<LEVELS.length;i++){
  const lv=LEVELS[i];const R=lv.r,C=lv.c;
  const sol=lv.sol.map(row=>row.split('').map(Number));
  const board=Array.from({length:R},()=>Array(C).fill(-1));
  const fixed=Array.from({length:R},()=>Array(C).fill(false));
  for(const [r,c,v] of lv.clues){board[r][c]=v;fixed[r][c]=true;}
  // count moves = empty non-fixed cells
  const moves=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(!fixed[r][c])moves.push([r,c]);
  // play each to solution value; win should NOT trigger before the last correct move
  let wonEarly=false, wonAtEnd=false;
  for(let k=0;k<moves.length;k++){
    const [r,c]=moves[k];
    board[r][c]=sol[r][c];  // simulate the correct click sequence result
    const w=checkWin(board,R,C);
    if(k<moves.length-1 && w){wonEarly=true;}
    if(k===moves.length-1)wonAtEnd=w;
  }
  // edge case: puzzle fully determined by clues (no moves) -> board should already win
  if(moves.length===0)wonAtEnd=checkWin(board,R,C);
  const ok = wonAtEnd && !wonEarly;
  if(!ok)allPass=false;
  console.log(`  ${ok?'✅':'❌'} L${i+1} ${R}x${C} ${lv.tier} — ${moves.length} moves — winAtEnd:${wonAtEnd?'OK':'FAIL'} noEarlyWin:${!wonEarly?'OK':'FAIL'}`);
}
console.log(`\n=== RESULT: ${allPass?'ALL PLAYTESTS PASS ✅':'SOME FAILED ❌'} ===`);
process.exit(allPass?0:1);
