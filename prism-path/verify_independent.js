// Independent verifier for Prism Path levels.
// Loads LEVELS from index.html, expands each level, applies SOLUTION rotations,
// runs an INDEPENDENT BFS propagation, and asserts WIN for all 30.
// Reports "30/30 UNIQUE + VALID" on success.
"use strict";
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
// extract LEVELS_RAW JSON
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('prism-path');
const RAW = JSON.parse(m[1]);
console.log('Loaded', RAW.length, 'compact levels');

const TYPE_NAMES = ['empty','straight','curve','tee','splitter','source','target'];
const ROLE_NAMES = ['empty','pipe','source','target'];
const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const TILE_BASE = {straight:[0,3], curve:[0,1], tee:[0,1,3], splitter:[0,2,4]};

function expandLevel(raw){
  const tiles = [];
  const map = new Map();
  for(const tt of raw.t){
    const color = tt[6] >= 0 ? raw.c[tt[6]] : null;
    const t = {q:tt[0], r:tt[1], type:TYPE_NAMES[tt[2]], role:ROLE_NAMES[tt[3]], sol:tt[4], init:tt[5], color:color, rot:tt[5]};
    tiles.push(t);
    map.set(tt[0]+','+tt[1], t);
  }
  const R = raw.R;
  for(let q=-R;q<=R;q++){
    for(let r=-R;r<=R;r++){
      if(Math.abs(q+r)>R) continue;
      const k=q+','+r;
      if(!map.has(k)){
        const t={q,r,type:'empty',role:'empty',sol:0,init:0,color:null,rot:0};
        tiles.push(t); map.set(k,t);
      }
    }
  }
  return {R, colors:raw.c, tiles, starTarget:raw.s};
}

function openSides(t){
  if(t.role==='empty') return [];
  if(t.role==='source'||t.role==='target') return [t.rot%6];
  const base = TILE_BASE[t.type]||[];
  return base.map(s=>(s+t.rot)%6).sort((a,b)=>a-b);
}

// INDEPENDENT BFS — re-derived from the spec, not copied from the game.
function bfsPropagate(tiles){
  const map = new Map();
  for(const t of tiles) map.set(t.q+','+t.r, t);
  const satisfied = new Set();
  const sources = tiles.filter(t=>t.role==='source');
  for(const src of sources){
    const exitDir = src.rot % 6;
    const nq = src.q + DIRS[exitDir][0];
    const nr = src.r + DIRS[exitDir][1];
    const ncell = map.get(nq+','+nr);
    if(!ncell) continue;
    const enterSide = (exitDir+3)%6;
    if(!openSides(ncell).includes(enterSide)) continue;
    const queue = [[nq,nr,enterSide,src.color]];
    const seen = new Set([nq+','+nr+':'+enterSide+':'+src.color]);
    while(queue.length){
      const [cq,cr,es,color] = queue.shift();
      const ct = map.get(cq+','+cr);
      if(ct.role==='target'){
        if(ct.color===color && (ct.rot%6)===es){
          satisfied.add(cq+','+cr);
        }
        continue;
      }
      for(const o of openSides(ct)){
        if(o===es) continue;
        const nnq = cq+DIRS[o][0], nnr = cr+DIRS[o][1];
        const nnt = map.get(nnq+','+nnr);
        if(!nnt) continue;
        const nes = (o+3)%6;
        if(!openSides(nnt).includes(nes)) continue;
        const vk = nnq+','+nnr+':'+nes+':'+color;
        if(seen.has(vk)) continue;
        seen.add(vk);
        queue.push([nnq,nnr,nes,color]);
      }
    }
  }
  const targets = tiles.filter(t=>t.role==='target');
  const won = targets.length>0 && targets.every(t=>satisfied.has(t.q+','+t.r));
  return {won, satisfiedCount: satisfied.size, targetCount: targets.length};
}

// Check uniqueness: no two levels identical
function levelSig(raw){
  return raw.t.map(t=>t.join(',')).sort().join('|');
}

let pass = 0, fail = 0;
const sigs = new Set();
const errors = [];
for(let i=0;i<RAW.length;i++){
  const lvl = expandLevel(RAW[i]);
  // apply SOLUTION rotations
  const solTiles = lvl.tiles.map(t=>({...t, rot:t.sol}));
  const res = bfsPropagate(solTiles);
  // uniqueness
  const sig = levelSig(RAW[i]);
  const unique = !sigs.has(sig);
  sigs.add(sig);
  if(res.won && unique){
    pass++;
    console.log('Level '+(i+1)+' (R='+lvl.R+', '+lvl.colors.length+' colors, '+lvl.tiles.filter(t=>t.role!=='empty').length+' tiles): WIN  ✓');
  } else {
    fail++;
    errors.push('Level '+(i+1)+': '+(res.won?'':'NOT WIN ')+(unique?'':'DUP'));
    console.log('Level '+(i+1)+': '+(res.won?'WIN':'FAIL')+' satisfied='+res.satisfiedCount+'/'+res.targetCount+' '+(unique?'':'DUPLICATE')+'  ✗');
  }
}

console.log('\n=== RESULT ===');
console.log('Pass: '+pass+'/'+RAW.length);
console.log('Fail: '+fail+'/'+RAW.length);
if(pass===RAW.length && fail===0 && RAW.length===30){
  console.log('30/30 UNIQUE + VALID');
  process.exit(0);
} else {
  console.log('VERIFICATION FAILED');
  process.exit(1);
}
