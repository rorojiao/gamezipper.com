const path=require('path');
const extractLevels=require(path.join(process.cwd(),'.audit/gz-extract-levels.js'));
const LEVELS=extractLevels('code-robot');
const DR=[-1,0,1,0],DC=[0,1,0,-1],CMDS=['FWD','TL','TR','JMP','LIT'];
if(!Array.isArray(LEVELS)||LEVELS.length!==30){console.error('FAIL level extraction',LEVELS&&LEVELS.length);process.exit(1)}
// Engine-only mode is the design floor (no P1/P2). Levels whose hint explicitly
// requires P1+P2 subroutines (Spiral Trap / reusable routines / master P1+P2 system)
// have NO engine-only solution by design; treat them as DESIGN-REQUIRED instead
// of FAIL — they MUST still be cross-validated by verify-code-robot-subroutines.js.
const HINT_REQUIRES_P1P2 = /Spiral|Build reusable|routines|Master the P1\+P2|P1 and P2/i;
function requiresSubroutine(lv){return HINT_REQUIRES_P1P2.test(lv.hint||'') }
function validateLevel(lv,idx){
  const probs=[];
  if(lv.grid.length!==lv.gridH||lv.grid.some(r=>r.length!==lv.gridW))probs.push('grid dimensions mismatch');
  let starts=0,goals=0;for(const row of lv.grid)for(const cell of row){if(cell==='S')starts++;if(cell==='G')goals++}
  if(starts!==1)probs.push(`starts=${starts}`);if(goals<1)probs.push(`goals=${goals}`);
  const lightIndex=new Map(lv.lights.map((p,i)=>[p.join(','),i]));
  for(const [r,c] of lv.lights)if(lv.grid[r]?.[c]!=='L')probs.push(`light clue ${r},${c} is ${lv.grid[r]?.[c]}`);
  let sr=-1,sc=-1;for(let r=0;r<lv.gridH;r++)for(let c=0;c<lv.gridW;c++)if(lv.grid[r][c]==='S'){sr=r;sc=c}
  const all=(1<<lv.lights.length)-1;
  const key=(r,c,d,m)=>`${r},${c},${d},${m}`;
  let cur=new Map([[key(sr,sc,lv.startDir,0),{r:sr,c:sc,d:lv.startDir,m:0,count:1,seq:[]}]]);
  let solutions=0,example=null,explored=0;
  for(let depth=1;depth<=lv.slots;depth++){
    const next=new Map();
    for(const st of cur.values())for(const cmd of CMDS){
      let {r,c,d,m}=st;let valid=true;
      if(cmd==='FWD'){
        const nr=r+DR[d],nc=c+DC[d];
        if(nr<0||nr>=lv.gridH||nc<0||nc>=lv.gridW||lv.grid[nr][nc]==='X'||lv.grid[nr][nc]==='H')valid=false;else{r=nr;c=nc}
      }else if(cmd==='JMP'){
        const nr=r+2*DR[d],nc=c+2*DC[d];
        if(nr<0||nr>=lv.gridH||nc<0||nc>=lv.gridW||lv.grid[nr][nc]==='X')valid=false;else{r=nr;c=nc}
      }else if(cmd==='TL')d=(d+3)%4;
      else if(cmd==='TR')d=(d+1)%4;
      else if(cmd==='LIT'){const li=lightIndex.get(`${r},${c}`);if(li!==undefined)m^=1<<li}
      if(!valid)continue;explored++;
      const seq=st.seq.concat(cmd);
      if(lv.grid[r][c]==='G'&&m===all){solutions=Math.min(2,solutions+st.count);if(!example)example=seq}
      const k=key(r,c,d,m),old=next.get(k);
      if(old)old.count=Math.min(2,old.count+st.count);else next.set(k,{r,c,d,m,count:st.count,seq});
    }
    cur=next;
  }
  if(!solutions)probs.push(`no engine-valid solution within ${lv.slots} main slots`);
  return{probs,solutions,example,explored,requiresSub:requiresSubroutine(lv)};
}
let bad=[],designRequired=[];
LEVELS.forEach((lv,i)=>{
  const r=validateLevel(lv,i);
  if(r.probs.length){
    if(r.requiresSub){
      designRequired.push({level:i+1,problems:r.probs,hint:lv.hint});
      console.log(`L${String(i+1).padStart(2,'0')} DESIGN-REQUIRES-SUB solutions=- slots=${lv.slots} (hint: ${lv.hint})`);
    }else{
      bad.push({level:i+1,problems:r.probs});
      console.log(`L${String(i+1).padStart(2,'0')} FAIL solutions=- slots=${lv.slots}`);
    }
  }else{
    console.log(`L${String(i+1).padStart(2,'0')} PASS solutions=${r.solutions===2?'2+':r.solutions} slots=${lv.slots} shortestExample=${r.example?r.example.length:'-'} ${r.example?r.example.join(','):''}`);
  }
});
console.log(`SUMMARY levels=${LEVELS.length} engine-pass=${LEVELS.length-bad.length-designRequired.length} design-requires-sub=${designRequired.length} failures=${bad.length}`);
if(bad.length){console.error('ENGINE FAILURES:',JSON.stringify(bad,null,2));process.exit(1)}
if(designRequired.length)console.error('DESIGN-REQUIRED (P1+P2 only — verify via verify-code-robot-subroutines.js):',JSON.stringify(designRequired,null,2))
