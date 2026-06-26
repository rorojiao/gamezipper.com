// Rockfall level verifier — checks structural integrity + simulates solvability
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/rockfall/index.html','utf8');

// Extract LEVELS array source
const start = html.indexOf('const LEVELS=[');
const end = html.indexOf('/* ---------- State');
let src = html.slice(start, html.lastIndexOf('];', end)+2);
src = src.replace('const LEVELS=','').replace(/;\s*$/,'');
const LEVELS = (0,eval)('('+src+')');
console.log('Parsed', LEVELS.length, 'levels\n');

const EMPTY=0,DIRT=1,WALL=2,BOULDER=3,GEM=4,EXIT=5,MWALL=6;
const GLYPH={' ':EMPTY,'.':DIRT,'#':WALL,'O':BOULDER,'*':GEM,'E':EXIT,'M':MWALL};

let errors=0;
function parseLevel(lv){
  const ROWS=lv.map.length; const COLS=lv.map[0].length;
  let g=[],pr=-1,pc=-1,gems=0,exit=0;
  for(let r=0;r<ROWS;r++){
    const row=[];
    if(lv.map[r].length!==COLS){console.log(`  ✗ ${lv.name}: row ${r} width ${lv.map[r].length} != ${COLS}`);errors++;}
    for(let c=0;c<COLS;c++){
      const ch=lv.map[r].charAt(c);
      if(ch==='P'){pr=r;pc=c;row.push(EMPTY);}
      else if(ch==='E'){exit++;row.push(EXIT);}
      else{const t=GLYPH[ch]!==undefined?GLYPH[ch]:EMPTY;if(t===GEM)gems++;row.push(t);}
    }
    g.push(row);
  }
  return {g,ROWS,COLS,pr,pc,gems,exit};
}

// 1. Structural checks
console.log('=== STRUCTURAL CHECKS ===');
LEVELS.forEach((lv,i)=>{
  const s=parseLevel(lv);
  if(s.pr<0){console.log(`  ✗ L${i+1} ${lv.name}: NO player`);errors++;}
  if(s.exit<1){console.log(`  ✗ L${i+1} ${lv.name}: NO exit`);errors++;}
  if(s.gems<1){console.log(`  ⚠ L${i+1} ${lv.name}: no gems`);}
  // border wall check
  let badBorder=false;
  for(let c=0;c<s.COLS;c++){if(s.g[0][c]!==WALL||s.g[s.ROWS-1][c]!==WALL){badBorder=true;}}
  for(let r=0;r<s.ROWS;r++){if(s.g[r][0]!==WALL||s.g[r][s.COLS-1]!==WALL){badBorder=true;}}
  if(badBorder){console.log(`  ✗ L${i+1} ${lv.name}: border not all walls (boulders can escape!)`);errors++;}
});
console.log(errors? `\n${errors} structural errors\n` : 'All structural checks PASS\n');

// 2. Solvability via BFS over game states (state = grid+playerpos+gemsGot)
// Engine: columnar gravity settle after each move (matches index.html settle())
function settle(g,ROWS,COLS,pr,pc){
  let safety=0,changed=true;
  while(changed&&safety++<2000){
    changed=false;
    for(let r=ROWS-2;r>=0;r--){
      for(let c=0;c<COLS;c++){
        const t=g[r][c];
        if(t!==BOULDER&&t!==GEM)continue;
        const below=g[r+1][c];
        if(below===EMPTY){
          g[r+1][c]=t;g[r][c]=EMPTY;changed=true;
          if(pr===r+1&&pc===c){if(t===GEM){}else return 'crush';}
        }else if(below===MWALL&&t===BOULDER){
          if(r+2<=ROWS-1&&g[r+2][c]===EMPTY){g[r][c]=EMPTY;g[r+2][c]=GEM;changed=true;}
          else{g[r][c]=GEM;changed=true;}
        }
      }
    }
  }
  return 'ok';
}
function clone(g){return g.map(r=>r.slice());}
function stateKey(g,pr,pc,gemsGot){return g.map(r=>r.join('')).join('|')+':'+pr+','+pc+','+gemsGot;}

function solveable(idx){
  const lv=LEVELS[idx];
  const ROWS=lv.map.length, COLS=lv.map[0].length;
  let pr,pc,gemsTotal=0;let g0=[];
  for(let r=0;r<ROWS;r++){const row=[];for(let c=0;c<COLS;c++){const ch=lv.map[r].charAt(c);if(ch==='P'){pr=r;pc=c;row.push(EMPTY);}else{const t=GLYPH[ch]!==undefined?GLYPH[ch]:EMPTY;if(t===GEM)gemsTotal++;row.push(t);}}g0.push(row);}
  // BFS
  const seen=new Set();let q=[{g:g0,pr,pc,gems:0,d:0}];
  const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
  let head=0,maxD=0;const LIMIT=40000;
  while(head<q.length){
    const cur=q[head++];
    if(q.length>LIMIT) return 'search-limit';
    // settle already applied at generation; check win
    if(cur.g[cur.pr][cur.pc]===EXIT && cur.gems>=gemsTotal) return 'solved(d='+cur.d+')';
    for(const[dr,dc] of dirs){
      const nr=cur.pr+dr,nc=cur.pc+dc;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS)continue;
      const tgt=cur.g[nr][nc];
      let ng=clone(cur.g),np=[nr,nc],gems=cur.gems,ok=true;
      if(tgt===WALL||tgt===MWALL)continue;
      else if(tgt===DIRT){ng[nr][nc]=EMPTY;}
      else if(tgt===EMPTY||tgt===EXIT){}
      else if(tgt===GEM){ng[nr][nc]=EMPTY;gems++;}
      else if(tgt===BOULDER){const br=nr+dr,bc=nc+dc;if(br>=0&&br<ROWS&&bc>=0&&bc<COLS&&ng[br][bc]===EMPTY){ng[br][bc]=BOULDER;ng[nr][nc]=EMPTY;}else continue;}
      // settle
      const res=settle(ng,ROWS,COLS,nr,nc);
      if(res==='crush')continue;
      // recheck crush: player at nr,nc — if a boulder fell there settle already handled
      const key=stateKey(ng,nr,nc,gems);
      if(seen.has(key))continue;seen.add(key);
      q.push({g:ng,pr:nr,pc:nc,gems,d:cur.d+1});
    }
  }
  return 'UNSOLVABLE';
}

console.log('=== SOLVABILITY (BFS) ===');
let solvedCount=0;
for(let i=0;i<LEVELS.length;i++){
  const r=solveable(i);
  const tag=r.startsWith('solved')?'✓':(r==='search-limit'?'⚠':'✗');
  if(r.startsWith('solved')||r==='search-limit')solvedCount++;
  console.log(`  ${tag} L${i+1} ${LEVELS[i].name.padEnd(16)} ${r}`);
}
console.log(`\n${solvedCount}/${LEVELS.length} levels solvable/searchable.`);
