// parking-jam per-game verifier
//
// R325 FIX: canExit() below used to be gated on a SINGLE exit lane (L.exitRow for horizontal,
// L.exitCol for vertical) — a verbatim copy of the shipped engine's old bug. R325 changed the
// engine so the exit is a whole EDGE (canCarExit() in index.html), which is what makes
// multi-car levels possible at all. Left unfixed, this verifier reported all 30 levels
// "unsolvable" — a stale-tool false alarm that would have been misread as data loss.
// Rule: a verifier that re-implements an engine rule must be updated in the SAME commit as the
// engine change, and confirmed against the shipped in-engine verifier (verify_engine.js).
const fs=require('fs');
const path=require('path');
const src=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function extractLevels(s){const st=s.indexOf('var LEVELS = [');if(st<0)return null;let i=s.indexOf('[',st),d=0,e=-1,ins=null;for(let k=i;k<s.length;k++){const ch=s[k];if(ins){if(ch==='\\'){k++;continue}if(ch===ins)ins=null;continue}if(ch==='"'||ch==="'"){ins=ch;continue}if(ch==='[')d++;else if(ch===']'){d--;if(d===0){e=k+1;break}}}if(e<0)return null;return new Function('return '+s.slice(i,e))()}
let LEVELS;try{LEVELS=extractLevels(src)}catch(e){console.error('EVAL',e.message);process.exit(1)}
if(!LEVELS){console.error('NO LEVELS');process.exit(1)}
function getCarCells(c){const r=[];if(c.dir==='h'){for(let i=0;i<c.len;i++) r.push({col:c.col+i,row:c.row})}else{for(let i=0;i<c.len;i++) r.push({col:c.col,row:c.row+i})}return r}
function blocked(col,row,L,active,skip){for(const b of L.barriers) if(b.col===col&&b.row===row) return true;for(const w of L.walls) if(w.col===col&&w.row===row) return true;for(let i=0;i<active.length;i++){if(i===skip) continue;for(const c of getCarCells(active[i])) if(c.col===col&&c.row===row) return true}return false}
// R325: the exit is a whole EDGE — a car in ANY lane may leave once its own path is clear.
function canExit(i,L,grid){const c=grid[i];if(c.exited) return false;const a=grid.filter(g=>!g.exited);if(c.dir==='h'){if(L.exitSide==='right'){for(let x=c.col+c.len;x<L.cols;x++) if(blocked(x,c.row,L,a,i)) return false;return true}if(L.exitSide==='left'){for(let x=c.col-1;x>=0;x--) if(blocked(x,c.row,L,a,i)) return false;return true}}else{if(L.exitSide==='bottom'){for(let y=c.row+c.len;y<L.rows;y++) if(blocked(c.col,y,L,a,i)) return false;return true}if(L.exitSide==='top'){for(let y=c.row-1;y>=0;y--) if(blocked(c.col,y,L,a,i)) return false;return true}}return false}
function solve(L,cars){const N=cars.length;const st=cars.map(c=>({...c,exited:false}));const memo=new Set();function k(s){return s.map((c,i)=>c.exited?`E${i}`:`${c.col},${c.row}`).join('|')}const q=[[st,[]]];memo.add(k(st));while(q.length){const [cur,path]=q.shift();if(path.length===N) return path;for(let i=0;i<N;i++){if(cur[i].exited) continue;if(!canExit(i,L,cur)) continue;const nxt=cur.map((c,j)=>j===i?{...c,exited:true}:c);const kk=k(nxt);if(memo.has(kk)) continue;memo.add(kk);q.push([nxt,path.concat(i)])}}return null}
let ok=0,fail=0;const issues=[];
for(let li=0;li<LEVELS.length;li++){
  const L=LEVELS[li];
  let bad=false;
  for(const c of L.cars){for(const cell of getCarCells(c)){if(cell.col<0||cell.col>=L.cols||cell.row<0||cell.row>=L.rows){issues.push(`L${li+1} car OOB ${cell.col},${cell.row}`);bad=true}for(const w of L.walls) if(w.col===cell.col&&w.row===cell.row){issues.push(`L${li+1} car on wall ${cell.col},${cell.row}`);bad=true}for(const b of L.barriers) if(b.col===cell.col&&b.row===cell.row){issues.push(`L${li+1} car on barrier ${cell.col},${cell.row}`);bad=true}}}
  for(let i=0;i<L.cars.length;i++)for(let j=i+1;j<L.cars.length;j++){for(const a of getCarCells(L.cars[i]))for(const b of getCarCells(L.cars[j]))if(a.col===b.col&&a.row===b.row){issues.push(`L${li+1} cars overlap`);bad=true}}
  const sol=solve(L,L.cars);
  if(!sol){issues.push(`L${li+1} unsolvable`);bad=true}else if(JSON.stringify(sol)!==JSON.stringify(L.solution)){issues.push(`L${li+1} solution mismatch (found ${sol} vs stored ${L.solution})`);bad=true}
  if(sol){let tmp=L.cars.map(c=>({...c,exited:false}));for(const idx of L.solution){if(!canExit(idx,L,tmp)){issues.push(`L${li+1} stored solution step ${idx} not executable`);bad=true;break}tmp[idx].exited=true}}
  // R325 REGRESSION GATE: a level with one car, or one where every car can already move, is
  // trivially solvable — so `unsolvable`/`solution mismatch` above cannot see the degeneracy
  // that shipped for 30/30 levels (one tap each, no ordering mechanic at all). Assert the
  // ordering constraint explicitly, using the same canExit() the engine uses.
  {
    const fresh=L.cars.map(c=>({...c,exited:false}));
    let openAt0=0;
    for(let i=0;i<fresh.length;i++) if(canExit(i,L,fresh)) openAt0++;
    if(L.cars.length<2){issues.push(`L${li+1} DEGENERATE: ${L.cars.length} car(s) — R325 P0 regression`);bad=true}
    if(openAt0>=L.cars.length){issues.push(`L${li+1} DEGENERATE: all ${openAt0} cars movable at t=0 — no ordering constraint`);bad=true}
  }
  if(bad){fail++}else{ok++}
}
console.log(`parking-jam: ${ok}/${LEVELS.length} solvable, ${fail} fail`);
if(issues.length){console.log('ISSUES:');issues.forEach(i=>console.log('  '+i));process.exit(1)}
if(ok!==LEVELS.length){process.exit(1)}
console.log('PASS');
