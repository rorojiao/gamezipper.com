#!/usr/bin/env node
'use strict';
// ============================================================================
// Palindrome Sudoku — full-solution generator + uniqueness-verified digger.
// ----------------------------------------------------------------------------
// Rules: standard Sudoku (rows, columns, boxes each contain 1..N once)
//   PLUS one or more grey "palindrome lines": ordered paths of cells where the
//   digits read the same forwards and backwards. For a path P of length L this
//   means  digit(P[i]) == digit(P[L-1-i])  for every i.
//
// KEY GEOMETRY FACT (drives the whole generator):
//   Two cells that must hold the SAME digit (a mirror pair) cannot share a row,
//   a column, or a box — otherwise Sudoku's "all distinct" rule is violated.
//   So every mirror pair is validated to differ in row, column AND box. This is
//   what makes a palindrome region self-consistent with a valid Sudoku grid.
//
// Strategy:
//   1. Pick palindrome path(s): 8-connected (king-move) self-avoiding walks of
//      the requested length, validated so every mirror pair is row/col/box
//      distinct and the cells are all different. (8-connectivity lets the line
//      turn diagonally, which is required for short/even palindromes and matches
//      the variant's look on Cracking the Cryptic.)
//   2. Build the equality relation (union-find over mirror pairs) and fill an
//      EMPTY grid with MRV backtracking that places a whole equality-class at
//      once (all cells in a class get the same digit, checked against row/col/
//      box peers). Retry with new paths/seeds if unsatisfiable.
//   3. Dig holes in random order, re-checking uniqueness with an
//      palindrome-aware solution counter (stop at 2), until the target clue
//      count is reached or the time budget is exhausted.
//   4. Emit levels.json + a printed verification report.
//
// Output: palindrome-sudoku/levels.json
//   { version, game, generated, count, allUnique, levels:[
//       { id, tier, size, clues, givens:[[r,c,v]...], palindromes:[[[r,c]...]],
//         solution:[[v...]] } ] }
// ============================================================================

const fs = require('fs');
const crypto = require('crypto');

// ---------- seedable RNG ----------
function mulberry32(seed){ return function(){ let t=seed=(seed+0x6D2B79F5)>>>0; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=arr[i]; arr[i]=arr[j]; arr[j]=t; } return arr; }
function randInt(n,rng){ return Math.floor(rng()*n); }

function boxSize(N){ return N===4?[2,2]:N===6?[2,3]:[3,3]; }
function boxIndex(r,c,N){ const [br,bc]=boxSize(N); const nbc=N/bc; return Math.floor(r/br)*nbc+Math.floor(c/bc); }

// ---------- peers: cells that MUST DIFFER from a given cell (row/col/box) ----------
function buildPeers(N){
  const [br,bc]=boxSize(N);
  const peers=new Array(N*N);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const s=new Set();
    for(let i=0;i<N;i++){ if(i!==c)s.add(r*N+i); if(i!==r)s.add(i*N+c); }
    const br0=Math.floor(r/br)*br, bc0=Math.floor(c/bc)*bc;
    for(let i=0;i<br;i++)for(let j=0;j<bc;j++){ const rr=br0+i,cc=bc0+j; if(rr!==r||cc!==c)s.add(rr*N+cc); }
    peers[r*N+c]=Int32Array.from(s);
  }
  return peers;
}

// ---------- path generation: 8-connected self-avoiding walk ----------
const DIRS8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

function pathConnected(path){
  for(let i=1;i<path.length;i++){
    const dr=Math.abs(path[i][0]-path[i-1][0]);
    const dc=Math.abs(path[i][1]-path[i-1][1]);
    if(dr===0&&dc===0) return false;
    if(dr>1||dc>1) return false; // must be a king step
  }
  return true;
}

// a mirror pair (a,b) is valid iff a,b differ in row, col AND box
function pairValid(a,b,N){
  if(a[0]===b[0]) return false;            // same row
  if(a[1]===b[1]) return false;            // same col
  if(boxIndex(a[0],a[1],N)===boxIndex(b[0],b[1],N)) return false; // same box
  return true;
}

function palindromePathValid(path,N){
  if(!pathConnected(path)) return false;
  const L=path.length;
  for(let i=0;i<Math.floor(L/2);i++){
    if(!pairValid(path[i],path[L-1-i],N)) return false;
  }
  // no duplicate cells
  const seen=new Set();
  for(const [r,c] of path){ const k=r*N+c; if(seen.has(k)) return false; seen.add(k); }
  return true;
}

// generate one valid palindrome path of given length avoiding `occupied` cells
function genPath(N,length,occupied,rng,maxTries){
  for(let t=0;t<maxTries;t++){
    const sr=randInt(N,rng), sc=randInt(N,rng);
    if(occupied.has(sr*N+sc)) continue;
    const path=[[sr,sc]];
    const seen=new Set([sr*N+sc]);
    let r=sr,c=sc,ok=true;
    while(path.length<length){
      const dirs=DIRS8.slice();
      shuffle(dirs,rng);
      let moved=false;
      for(const [dr,dc] of dirs){
        const nr=r+dr,nc=c+dc;
        if(nr<0||nr>=N||nc<0||nc>=N) continue;
        const k=nr*N+nc;
        if(seen.has(k)||occupied.has(k)) continue;
        path.push([nr,nc]); seen.add(k); r=nr; c=nc; moved=true; break;
      }
      if(!moved){ ok=false; break; }
    }
    if(ok && path.length===length && palindromePathValid(path,N)) return path;
  }
  return null;
}

// generate the requested number of disjoint valid palindrome paths
function genPalindromes(N,count,lenRange,rng){
  const paths=[]; const occupied=new Set();
  for(let i=0;i<count;i++){
    const length=lenRange[0]+randInt(lenRange[1]-lenRange[0]+1,rng);
    let p=null,tries=0;
    while(!p && tries<40){
      p=genPath(N,length,occupied,rng,2500);
      tries++;
    }
    if(!p) throw new Error('failed to generate palindrome path N='+N+' len='+length);
    paths.push(p);
    for(const [r,c] of p) occupied.add(r*N+c);
  }
  return paths;
}

// ---------- equality relation from palindromes (union-find) ----------
function buildGroups(palindromes,N){
  const parent=new Int32Array(N*N); for(let i=0;i<N*N;i++)parent[i]=i;
  function find(x){ while(parent[x]!==x){ parent[x]=parent[parent[x]]; x=parent[x]; } return x; }
  function union(a,b){ const ra=find(a),rb=find(b); if(ra!==rb) parent[rb]=ra; }
  for(const path of palindromes){
    const L=path.length;
    for(let i=0;i<Math.floor(L/2);i++){
      const a=path[i][0]*N+path[i][1];
      const b=path[L-1-i][0]*N+path[L-1-i][1];
      union(a,b);
    }
  }
  // groupOf[leader] = list of member indices; isLeader[i]
  const groupOf=new Map(); const isLeader=new Uint8Array(N*N);
  for(let i=0;i<N*N;i++){ const l=find(i); if(!groupOf.has(l)){ groupOf.set(l,[]); isLeader[l]=1; } groupOf.get(l).push(i); }
  // leader of cell i:
  const leaderOf=new Int32Array(N*N);
  for(let i=0;i<N*N;i++) leaderOf[i]=find(i);
  // sanity: within a group, every pair of members must be row/col/box distinct
  // (otherwise they could never share a digit). verify.
  for(const [lead,members] of groupOf){
    if(members.length<2) continue;
    for(let x=0;x<members.length;x++)for(let y=x+1;y<members.length;y++){
      const ax=members[x]%N, ay=Math.floor(members[x]/N);
      const bx=members[y]%N, by=Math.floor(members[y]/N);
      if(!pairValid([ay,ax],[by,bx],N)) throw new Error('equality group has conflicting peers');
    }
  }
  return { groupOf, isLeader, leaderOf };
}

// ---------- MRV backtracking with equality groups ----------
// givens: Int8Array length N*N (0 = empty). Returns {count, solution?}.
// `randomize` shuffles candidate order (used only for full-grid fills; counting
// is correct regardless of order).
function solve(givens,N,peers,grp,limit,wantSolution,randomize,rng){
  const { groupOf, isLeader, leaderOf } = grp;
  const g=new Int8Array(N*N);                 // all zero; everything placed via setCell
  const full=(1<<(N+1))-2;                    // bits 1..N
  const rowMask=new Int32Array(N), colMask=new Int32Array(N), boxMask=new Int32Array(N);

  function setCell(i,v){
    const r=(i/N)|0, c=i%N, b=boxIndex(r,c,N);
    const bit=1<<v;
    if((rowMask[r]|colMask[c]|boxMask[b])&bit) return false;
    rowMask[r]|=bit; colMask[c]|=bit; boxMask[b]|=bit; g[i]=v; return true;
  }
  function clrCell(i,v){
    const r=(i/N)|0, c=i%N, b=boxIndex(r,c,N); const bit=1<<v;
    rowMask[r]&=~bit; colMask[c]&=~bit; boxMask[b]&=~bit; g[i]=0;
  }

  // place givens AND propagate equality: a group with any given member forces
  // the whole class to that value (checked against row/col/box peers).
  for(const [lead,members] of groupOf){
    let forced=0;
    for(const m of members){ if(givens[m]!==0){ if(forced!==0 && forced!==givens[m]) return {count:0,solution:null}; forced=givens[m]; } }
    if(forced!==0){ for(const m of members){ if(!setCell(m,forced)) return {count:0,solution:null}; } }
  }

  let count=0; let solution=null;
  function dfs(){
    if(count>=limit) return;
    // MRV over empty LEADER cells only (members are filled by their leader)
    let best=-1, bestCand=null, bestCnt=N+1;
    for(let i=0;i<N*N;i++){
      if(g[i]!==0 || !isLeader[i]) continue;
      const members=groupOf.get(leaderOf[i]);
      let candMask=full;
      for(const m of members){ const r=(m/N)|0,c=m%N,b=boxIndex(r,c,N); candMask &= ~(rowMask[r]|colMask[c]|boxMask[b]); }
      if(candMask===0) return; // dead end
      let cnt=0; for(let v=1;v<=N;v++) if(candMask&(1<<v)) cnt++;
      if(cnt<bestCnt){ bestCand=[]; for(let v=1;v<=N;v++) if(candMask&(1<<v)) bestCand.push(v); best=i; bestCnt=cnt; if(cnt===1) break; }
    }
    if(best===-1){ count++; if(wantSolution && !solution) solution=Int8Array.from(g); return; }
    const members=groupOf.get(leaderOf[best]);
    if(randomize) shuffle(bestCand,rng);
    for(const v of bestCand){
      let ok=true;
      for(let bi=0;bi<members.length;bi++){ if(!setCell(members[bi],v)){ ok=false; break; } }
      if(ok) dfs();
      for(let bi=0;bi<members.length;bi++){ const m=members[bi]; if(g[m]===v) clrCell(m,v); } // undo this group
      if(count>=limit) return;
    }
  }
  dfs();
  return { count, solution };
}

// ---------- full solution (empty grid, 1 solution, randomized) ----------
function makeFilled(N,rng,peers,grp){
  return solve(new Int8Array(N*N),N,peers,grp,1,true,true,rng).solution;
}

// ---------- digit relabel (preserves sudoku + palindrome equality) ----------
function relabel(grid,N,rng){
  const perm=shuffle(Array.from({length:N},(_,i)=>i+1),rng);
  const out=new Int8Array(N*N);
  for(let i=0;i<N*N;i++) out[i]=perm[grid[i]-1];
  return out;
}

// ---------- dig holes keeping uniqueness ----------
function digHoles(solution,N,rng,peers,grp,targetClues,maxMs){
  const t0=Date.now();
  let bestPuzzle=null, bestClues=N*N+1;
  for(let attempt=0; attempt<8; attempt++){
    const puzzle=new Int8Array(solution);
    const order=shuffle(Array.from({length:N*N},(_,i)=>i),rng);
    let clues=N*N;
    for(const idx of order){
      if(clues<=targetClues) break;
      if(Date.now()-t0>maxMs) break;
      const save=puzzle[idx]; if(save===0) continue;
      puzzle[idx]=0;
      const cnt=solve(puzzle,N,peers,grp,2,false,false,null).count;
      if(cnt!==1){ puzzle[idx]=save; } else clues--;
    }
    const finalCnt=solve(puzzle,N,peers,grp,2,false,false,null).count;
    if(finalCnt===1 && clues<bestClues){ bestPuzzle=puzzle; bestClues=clues; }
    if(bestClues<=targetClues) break;
  }
  if(!bestPuzzle){ bestPuzzle=new Int8Array(solution); bestClues=N*N; }
  return { puzzle:bestPuzzle, clues:bestClues };
}

// ---------- tier configuration (27 levels) ----------
// counts: 4+4+4+6+5+4 = 27
const TIERS=[
  { name:'Beginner', size:6, count:4, palCount:1, palLen:[3,4], targetClues:20, maxMs:5000  },
  { name:'Easy',     size:6, count:4, palCount:2, palLen:[3,5], targetClues:16, maxMs:7000  },
  { name:'Medium',   size:9, count:4, palCount:1, palLen:[5,7], targetClues:30, maxMs:20000 },
  { name:'Hard',     size:9, count:6, palCount:2, palLen:[5,9], targetClues:25, maxMs:30000 },
  { name:'Expert',   size:9, count:5, palCount:2, palLen:[7,9], targetClues:20, maxMs:40000 },
  { name:'Master',   size:9, count:4, palCount:3, palLen:[7,9], targetClues:16, maxMs:60000 },
];

function gridToArr(g,N){ const a=[]; for(let r=0;r<N;r++) a.push(Array.from(g.slice(r*N,(r+1)*N))); return a; }
function puzzleToGivens(p,N){ const out=[]; for(let i=0;i<N*N;i++){ if(p[i]!==0){ const r=(i/N)|0,c=i%N; out.push([r,c,p[i]]); } } return out; }
function pathToCoords(path){ return path.map(([r,c])=>[r,c]); }

// ---------- check a full grid satisfies sudoku + palindrome equality ----------
function verifySolution(grid,N,palindromes,peers){
  for(let i=0;i<N*N;i++){ const v=grid[i]; if(v<1||v>N) return false; for(const p of peers[i]) if(grid[p]===v) return false; }
  for(const path of palindromes){ const L=path.length; for(let i=0;i<L/2;i++){ const a=path[i][0]*N+path[i][1], b=path[L-1-i][0]*N+path[L-1-i][1]; if(grid[a]!==grid[b]) return false; } }
  return true;
}

function main(){
  const seedBase=parseInt(crypto.createHash('md5').update('palindrome-sudoku-v1-'+Date.now()).digest('hex').slice(0,8),16);
  let rng=mulberry32(seedBase);
  const peersCache={};
  function peersFor(N){ return peersCache[N]||(peersCache[N]=buildPeers(N)); }

  const levels=[]; let id=1;
  for(const tier of TIERS){
    const N=tier.size; const peers=peersFor(N);
    for(let i=0;i<tier.count;i++){
      process.stderr.write(`Generating ${tier.name} #${i+1} (N=${N}, ${tier.palCount} palindrome(s), target=${tier.targetClues} clues)... `);
      const t0=Date.now();
      let sol=null, pals=null, tries=0;
      while(!sol && tries<30){
        tries++;
        try{
          pals=genPalindromes(N,tier.palCount,tier.palLen,rng);
          const grp=buildGroups(pals,N);
          sol=makeFilled(N,rng,peers,grp);
          if(sol && !verifySolution(sol,N,pals,peers)) sol=null;
        }catch(e){ sol=null; }
        if(!sol){ rng=mulberry32((seedBase+tries*7919+i*104729+id*31)>>>0); }
      }
      if(!sol) throw new Error('could not generate a valid solution for '+tier.name+' #'+(i+1));
      if(rng()<0.5) sol=relabel(sol,N,rng);
      if(!verifySolution(sol,N,pals,peers)) throw new Error('solution failed verify '+tier.name);
      const grp=buildGroups(pals,N);
      const { puzzle, clues } = digHoles(sol,N,rng,peers,grp,tier.targetClues,tier.maxMs);
      const dt=(Date.now()-t0)/1000;
      const chk=solve(puzzle,N,peers,grp,2,false,false,null).count;
      const mark = chk===1 ? 'UNIQUE' : 'NONUNIQUE('+chk+')';
      process.stderr.write(`${clues} clues, ${dt.toFixed(1)}s, ${mark} (palLens=[${pals.map(p=>p.length).join(',')}], tries=${tries})\n`);
      levels.push({
        id, tier:tier.name, size:N, clues,
        givens: puzzleToGivens(puzzle,N),
        palindromes: pals.map(pathToCoords),
        solution: gridToArr(sol,N),
        unique: chk===1,
      });
      id++;
    }
  }

  const allUnique = levels.every(l=>l.unique);
  const out={ version:1, game:'palindrome-sudoku', generated:new Date().toISOString(), count:levels.length, allUnique, levels };
  fs.writeFileSync(__dirname+'/levels.json', JSON.stringify(out));
  console.log('=== PALINDROME SUDOKU — GENERATION REPORT ===');
  console.log(`Generated ${levels.length} levels. All unique: ${allUnique}`);
  const byTier={};
  for(const l of levels){ (byTier[l.tier]=byTier[l.tier]||[]).push(l); }
  for(const t of Object.keys(byTier)){
    const arr=byTier[t]; const cs=arr.map(l=>l.clues);
    console.log(`  ${t.padEnd(10)} N=${arr[0].size}  count=${arr.length}  clues min=${Math.min(...cs)} max=${Math.max(...cs)}  pals/level=[${arr.map(l=>l.palindromes.map(p=>p.length).join('+')).join(' | ')}]`);
  }
  console.log('Wrote '+__dirname+'/levels.json');
  if(!allUnique){ console.error('ERROR: some levels are not unique!'); process.exit(1); }
}

main();
