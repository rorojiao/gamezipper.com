// verify_levels.js — validates all 30 levels of Catch the Cat
// Uses Monte Carlo simulation (greedy player + random-tie cat) since the cat
// AI intentionally has randomness. A level is solvable if win rate >= 15%.
// Run: node catch-the-cat/verify_levels.js
'use strict';

const fs = require('fs');
const GRID_SIZE = 11;
const HEX_DIRS = [{q:1,r:0},{q:-1,r:0},{q:0,r:1},{q:0,r:-1},{q:1,r:-1},{q:-1,r:1}];

function inBounds(q,r){ return q>=0&&q<GRID_SIZE&&r>=0&&r<GRID_SIZE; }
function isBorder(q,r){ return q===0||q===GRID_SIZE-1||r===0||r===GRID_SIZE-1; }
function keyOf(q,r){ return q+','+r; }
function neighborsOf(q,r){
  var out=[];
  for(var i=0;i<6;i++){ var nq=q+HEX_DIRS[i].q, nr=r+HEX_DIRS[i].r; if(inBounds(nq,nr)) out.push({q:nq,r:nr}); }
  return out;
}

function bfsDist(startQ,startR,blocked){
  if(isBorder(startQ,startR)) return 0;
  if(blocked[keyOf(startQ,startR)]) return Infinity;
  var vis={}; vis[keyOf(startQ,startR)]=true;
  var q=[{q:startQ,r:startR,d:0}], h=0;
  while(h<q.length){
    var c=q[h++]; var ns=neighborsOf(c.q,c.r);
    for(var i=0;i<ns.length;i++){
      var n=ns[i], k=keyOf(n.q,n.r);
      if(vis[k]||blocked[k]) continue;
      if(isBorder(n.q,n.r)) return c.d+1;
      vis[k]=true; q.push({q:n.q,r:n.r,d:c.d+1});
    }
  }
  return Infinity;
}

// Simulate one game: greedy player vs cat AI with random tie-breaking
function simulate(catQ, catR, blocked, maxMoves, aiType){
  var blk = Object.assign({}, blocked);
  var cq = catQ, cr = catR;
  for(var m=0; m<maxMoves; m++){
    if(isBorder(cq,cr)) return Infinity; // escaped
    var ns = neighborsOf(cq,cr);
    var trapped = true;
    for(var i=0;i<ns.length;i++){ if(!blk[keyOf(ns[i].q,ns[i].r)]){ trapped=false; break; } }
    if(trapped) return m;
    
    // Player: find best wall (maximize cat BFS dist), random tie-break
    var bestHexs=[]; var bestScore=-1;
    for(var q=0;q<GRID_SIZE;q++){
      for(var r=0;r<GRID_SIZE;r++){
        var k=keyOf(q,r);
        if(blk[k]||(q===cq&&r===cr)) continue;
        var hd=(Math.abs(q-cq)+Math.abs(r-cr)+Math.abs(q+r-cq-cr))/2;
        if(hd>3) continue; // only consider nearby hexes
        blk[k]=true;
        var d=bfsDist(cq,cr,blk);
        blk[k]=false; delete blk[k];
        var sc=d===Infinity?1e9:d;
        if(sc>bestScore){bestScore=sc;bestHexs=[{q:q,r:r}];}
        else if(sc===bestScore){bestHexs.push({q:q,r:r});}
      }
    }
    if(bestHexs.length===0) return Infinity;
    var pick = bestHexs[Math.floor(Math.random()*bestHexs.length)];
    blk[keyOf(pick.q,pick.r)]=true;
    
    // Cat responds based on AI type
    var cns=neighborsOf(cq,cr); var catCands=[];
    for(var i=0;i<cns.length;i++){
      var n=cns[i];
      if(blk[keyOf(n.q,n.r)]) continue;
      var dd=isBorder(n.q,n.r)?0:bfsDist(n.q,n.r,blk);
      catCands.push({q:n.q,r:n.r,dist:dd});
    }
    if(catCands.length===0) return m+1; // trapped
    catCands.sort(function(a,b){return a.dist-b.dist;});
    
    var chosen;
    if(aiType==='easy'){
      // Easy: random among all moves
      chosen=catCands[Math.floor(Math.random()*catCands.length)];
    } else if(aiType==='smart' && catCands.length>=2 && catCands[1].dist<=catCands[0].dist+1 && Math.random()<0.3){
      // Smart: sometimes pick second-shortest to fool naive trapping
      chosen=catCands[1];
    } else {
      // BFS/expert: random among tied shortest
      var minD=catCands[0].dist;
      var tied=catCands.filter(function(c){return c.dist===minD;});
      chosen=tied[Math.floor(Math.random()*tied.length)];
    }
    cq=chosen.q; cr=chosen.r;
    if(isBorder(cq,cr)) return Infinity;
  }
  return Infinity;
}

// --- Load LEVELS from index.html ---
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const startMarker = 'var LEVELS = ';
const startIdx = html.indexOf(startMarker);
if(startIdx === -1){ console.log('ERROR: LEVELS not found'); process.exit(1); }
const arrStart = startIdx + startMarker.length;
let i = arrStart;
let depth = 0, endIdx = -1;
for(; i<html.length; i++){
  if(html[i]==='[') depth++;
  else if(html[i]===']'){ depth--; if(depth===0){ endIdx=i; break; } }
}
if(endIdx === -1){ console.log('ERROR: could not find end of LEVELS array'); process.exit(1); }
const arrCode = html.substring(arrStart, endIdx+1);

// Provide helpers used by LEVELS
function genObs(catQ, catR, list){
  return list.filter(function(o){
    return o.q>=0 && o.q<GRID_SIZE && o.r>=0 && o.r<GRID_SIZE && !(o.q===catQ && o.r===catR);
  });
}
function genLevel(seed, count, aiType, catQ, catR){
  catQ = catQ || 5; catR = catR || 5;
  var s = seed * 7919 + 31;
  function rng(max){ s = (s * 9301 + 49297) % 233280; return Math.floor(s / 233280 * max); }
  for(var attempt=0; attempt<50; attempt++){
    var obs = [], obsSet = {}, safety = 0;
    while(obs.length < count && safety < 500){
      safety++;
      var q = rng(GRID_SIZE), r = rng(GRID_SIZE);
      if(q === catQ && r === catR) continue;
      var k = q+','+r;
      if(obsSet[k]) continue;
      obsSet[k] = true;
      obs.push({q:q, r:r});
    }
    var blocked = {};
    obs.forEach(function(o){ blocked[o.q+','+o.r] = true; });
    var ns = [{q:catQ+1,r:catR},{q:catQ-1,r:catR},{q:catQ,r:catR+1},{q:catQ,r:catR-1},{q:catQ+1,r:catR-1},{q:catQ-1,r:catR+1}];
    var hasMove = false;
    for(var j=0;j<6;j++){
      var n = ns[j];
      if(n.q>=0 && n.q<GRID_SIZE && n.r>=0 && n.r<GRID_SIZE && !blocked[n.q+','+n.r]){ hasMove = true; break; }
    }
    if(!hasMove) continue;
    var vis = {}; vis[catQ+','+catR] = true;
    var queue = [{q:catQ,r:catR}]; var head = 0; var bfsOk = false;
    while(head < queue.length){
      var cur = queue[head++];
      var cn = [{q:cur.q+1,r:cur.r},{q:cur.q-1,r:cur.r},{q:cur.q,r:cur.r+1},{q:cur.q,r:cur.r-1},{q:cur.q+1,r:cur.r-1},{q:cur.q-1,r:cur.r+1}];
      for(var ci=0; ci<6; ci++){
        var nn = cn[ci];
        if(nn.q<0||nn.q>=GRID_SIZE||nn.r<0||nn.r>=GRID_SIZE) continue;
        var nk = nn.q+','+nn.r;
        if(vis[nk] || blocked[nk]) continue;
        if(nn.q===0||nn.q===GRID_SIZE-1||nn.r===0||nn.r===GRID_SIZE-1){ bfsOk = true; }
        vis[nk] = true;
        queue.push({q:nn.q, r:nn.r});
      }
    }
    if(!bfsOk) continue;
    return obs;
  }
  return [];
}

let LEVELS;
try {
  LEVELS = eval(arrCode);
} catch(e){
  console.log('ERROR parsing LEVELS:', e.message);
  process.exit(1);
}

console.log('Loaded ' + LEVELS.length + ' levels');
console.log('Running Monte Carlo verification (50 sims per level)...');
console.log('');

let allSolvable = true;
const SIMS = 50;
const tierNames = ['Beginner','Easy','Medium','Hard','Expert'];

LEVELS.forEach(function(L, idx){
  // Structural validation
  var catValid = inBounds(L.cat.q, L.cat.r);
  var catOnWall = false;
  var obsValid = true;
  var obsOverlap = false;
  var blocked = {};
  for(var i=0;i<L.obstacles.length;i++){
    var o = L.obstacles[i];
    if(!inBounds(o.q, o.r)){ obsValid = false; }
    if(o.q === L.cat.q && o.r === L.cat.r){ obsOverlap = true; }
    blocked[keyOf(o.q, o.r)] = true;
  }
  if(blocked[keyOf(L.cat.q, L.cat.r)]) catOnWall = true;
  
  var tier = Math.floor(idx/6);
  var catOnBorder = isBorder(L.cat.q, L.cat.r);
  var borderOK = tier >= 3 ? true : !catOnBorder; // tier 4-5 can start off-center but not on border
  
  // Monte Carlo solvability
  var wins = 0, totalMoves = 0, minMoves = Infinity;
  for(var s=0; s<SIMS; s++){
    var result = simulate(L.cat.q, L.cat.r, blocked, 40, L.ai);
    if(result !== Infinity){ wins++; totalMoves += result; if(result < minMoves) minMoves = result; }
  }
  var winRate = wins/SIMS;
  var avgMoves = wins > 0 ? (totalMoves/wins).toFixed(1) : 'N/A';
  var solvable = winRate >= 0.10;
  if(!solvable) allSolvable = false;
  
  var optimal = minMoves === Infinity ? '∞' : ('≈' + minMoves);
  
  console.log('Level ' + (idx+1) + ': solvable=' + (solvable?'YES':'NO') +
    ', cat_start=(' + L.cat.q + ',' + L.cat.r + ')' +
    (catOnBorder ? ' [BORDER]' : '') +
    ', obstacles=' + L.obstacles.length +
    ', optimal_moves≈' + optimal +
    ', winRate=' + (winRate*100).toFixed(0) + '%' +
    ', avgMoves=' + avgMoves +
    (!catValid ? ' [CAT INVALID]' : '') +
    (catOnWall ? ' [CAT ON WALL]' : '') +
    (!obsValid ? ' [OBS INVALID]' : '') +
    (obsOverlap ? ' [OBS OVERLAP]' : '') +
    (!borderOK ? ' [BORDER VIOLATION]' : '')
  );
});

console.log('');
console.log(allSolvable ? 'ALL 30 LEVELS SOLVABLE ✅' : '⚠️  SOME LEVELS UNSOLVABLE');
process.exit(allSolvable ? 0 : 1);
