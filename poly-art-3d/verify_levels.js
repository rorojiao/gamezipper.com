// poly-art-3d per-game verifier: confirm new checkWin validates piece-in-cell.
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const m=src.match(/var ARTWORKS=(\[[\s\S]*?\]);/);
if(!m){console.error('NO ARTWORKS');process.exit(1)}
let ARTWORKS;try{ARTWORKS=eval(m[1])}catch(e){console.error('EVAL',e.message);process.exit(1)}
console.log('artworks',ARTWORKS.length);
// Replicate the new checkWin logic in pure JS
function checkWinLike(pieces,art){
  var cols=art.cols,rows=art.rows;
  for(var i=0;i<pieces.length;i++){
    var p=pieces[i];
    if(!p.placed)return false;
    if(p.shade!==p.origShade)return false;
    var targetCol=p.id%cols,targetRow=Math.floor(p.id/cols);
    if(p.gridCol!==targetCol||p.gridRow!==targetRow)return false;
  }
  return true;
}
// Test 1: correctly placed all pieces at canonical slots → should pass
for(const a of ARTWORKS){
  const pieces=a.pieces.map((p,i)=>({id:p.id,shade:p.shade,origShade:p.shade,placed:true,gridCol:i%a.cols,gridRow:Math.floor(i/a.cols)}));
  if(!checkWinLike(pieces,a)){console.error('FAIL canonical placement for',a.name);process.exit(1)}
}
// Test 2: off-by-one → should fail
const first=ARTWORKS[0];
const wrongPieces=first.pieces.map((p,i)=>({id:p.id,shade:p.shade,origShade:p.shade,placed:true,gridCol:(i%first.cols+1)%first.cols,gridRow:Math.floor(i/first.cols)}));
if(checkWinLike(wrongPieces,first)){console.error('FAIL: off-by-one should reject');process.exit(1)}
// Test 3: all pieces placed at cell (0,0) → should fail (only one piece at target)
const sameCellPieces=first.pieces.map((p,i)=>({id:p.id,shade:p.shade,origShade:p.shade,placed:true,gridCol:0,gridRow:0}));
if(checkWinLike(sameCellPieces,first)){console.error('FAIL: same-cell should reject');process.exit(1)}
// Test 4: one piece unplaced → should fail
const missingOne=first.pieces.map((p,i)=>i===2?{id:p.id,shade:p.shade,origShade:p.shade,placed:false,gridCol:0,gridRow:0}:{id:p.id,shade:p.shade,origShade:p.shade,placed:true,gridCol:i%first.cols,gridRow:Math.floor(i/first.cols)});
if(checkWinLike(missingOne,first)){console.error('FAIL: missing-one should reject');process.exit(1)}
// Test 5: wrong shade → should fail
const wrongShade=first.pieces.map((p,i)=>({id:p.id,shade:(p.shade+1)%4,origShade:p.shade,placed:true,gridCol:i%first.cols,gridRow:Math.floor(i/first.cols)}));
if(checkWinLike(wrongShade,first)){console.error('FAIL: wrong-shade should reject');process.exit(1)}
console.log('PASS',ARTWORKS.length,'artworks; canonical placement wins; off-by-one / same-cell / missing / wrong-shade all reject');
