#!/usr/bin/env node
'use strict';
// Independent Shimaguni verifier — DIFFERENT implementation from gen.py
// Verifies: (1) stated solution satisfies all 5 rules, (2) solution is UNIQUE.
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/tmp/shimaguni_levels.json','utf8'));
const levels = data.levels;
let allPass = true;

function neighbors(r, c, n) {
  const out = [];
  if (r>0) out.push([r-1,c]);
  if (r<n-1) out.push([r+1,c]);
  if (c>0) out.push([r,c-1]);
  if (c<n-1) out.push([r,c+1]);
  return out;
}

function isConnected(cells, n) {
  // BFS connectivity check
  if (cells.length <= 1) return true;
  const cellSet = new Set(cells.map(c => c[0]*n+c[1]));
  const visited = new Set();
  const queue = [cells[0][0]*n+cells[0][1]];
  visited.add(cells[0][0]*n+cells[0][1]);
  while (queue.length) {
    const cur = queue.shift();
    const r = Math.floor(cur/n), c = cur%n;
    for (const [nr,nc] of neighbors(r,c,n)) {
      const id = nr*n+nc;
      if (cellSet.has(id) && !visited.has(id)) {
        visited.add(id); queue.push(id);
      }
    }
  }
  return visited.size === cells.length;
}

function solveCount(level, limit) {
  const n = level.size;
  const NR = level.n_regions;
  // regions: dict ri -> cell list
  const regionCells = {};
  for (let ri=0; ri<NR; ri++) regionCells[ri] = level.regions[ri];
  // region adjacency
  const radj = Array.from({length:NR}, () => new Set());
  const cellRegion = Array(n*n).fill(-1);
  for (let ri=0; ri<NR; ri++) {
    for (const [r,c] of regionCells[ri]) cellRegion[r*n+c] = ri;
  }
  for (let r=0;r<n;r++) for (let c=0;c<n;c++) {
    const ri = cellRegion[r*n+c];
    for (const [nr,nc] of neighbors(r,c,n)) {
      const rj = cellRegion[nr*n+nc];
      if (rj!==ri) radj[ri].add(rj);
    }
  }
  // enumerate connected subsets per region per size
  // use bitmask within region
  function enumConn(cells) {
    const sz = cells.length;
    const idx = new Map();
    cells.forEach((c,i) => idx.set(c[0]*n+c[1], i));
    const nbrs = cells.map(c => neighbors(c[0],c[1],n).filter(nc => idx.has(nc[0]*n+nc[1])).map(nc => idx.get(nc[0]*n+nc[1])));
    const results = {};
    for (let s=0; s<sz; s++) {
      const start = 1<<s;
      const seen = new Set([start]);
      const stack = [start];
      while (stack.length) {
        const cur = stack.pop();
        const k = cur.toString(2).replace(/0/g,'').length;
        if (!results[k]) results[k] = [];
        if (!results[k].includes(cur)) results[k].push(cur);
        if (k>=sz) continue;
        const nbset = new Set();
        for (let i=0;i<sz;i++) if (cur&(1<<i)) for (const j of nbrs[i]) if (!(cur&(1<<j))) nbset.add(j);
        for (const j of nbset) {
          const nbm = cur|(1<<j);
          if (!seen.has(nbm)) { seen.add(nbm); stack.push(nbm); }
        }
      }
    }
    return results;
  }
  // convert local bitmask to global cell-id set
  function localToGlobal(lbm, cells) {
    const gset = new Set();
    for (let i=0; i<cells.length; i++) if (lbm&(1<<i)) gset.add(cells[i][0]*n+cells[i][1]);
    return gset;
  }
  // precompute shadings per region: { ri: { k: [ {cells:Set, expanded:Set} ] } }
  const shadings = {};
  const globalNbr = Array.from({length:n*n}, () => []);
  for (let r=0;r<n;r++) for (let c=0;c<n;c++) {
    globalNbr[r*n+c] = neighbors(r,c,n).map(nc => nc[0]*n+nc[1]);
  }
  for (let ri=0; ri<NR; ri++) {
    const cells = regionCells[ri];
    const local = enumConn(cells);
    shadings[ri] = {};
    for (const k of Object.keys(local)) {
      const kk = parseInt(k);
      shadings[ri][kk] = local[kk].map(lbm => {
        const gset = localToGlobal(lbm, cells);
        const exp = new Set();
        for (const cid of gset) for (const nid of globalNbr[cid]) if (!gset.has(nid)) exp.add(nid);
        return { cells: gset, expanded: exp };
      });
    }
  }
  // backtracking solver
  const order = Array.from({length:NR}, (_,i)=>i).sort((a,b) =>
    Object.values(shadings[a]).reduce((s,v)=>s+v.length,0) - Object.values(shadings[b]).reduce((s,v)=>s+v.length,0));
  let solutions = 0;
  const ac = new Array(NR).fill(null);
  const aCells = new Array(NR).fill(null);
  const aExp = new Array(NR).fill(null);
  const aFlag = new Array(NR).fill(false);
  const radjArr = radj.map(s => Array.from(s));

  function bt(pos) {
    if (solutions >= limit) return;
    if (pos === NR) { solutions++; return; }
    const ri = order[pos];
    const fc = level.clues[ri];
    const sh = shadings[ri];
    const counts = fc !== null && fc !== undefined ? [fc] : Object.keys(sh).map(Number);
    for (const k of counts) {
      if (!sh[k]) continue;
      let bad = false;
      for (const nj of radjArr[ri]) if (aFlag[nj] && ac[nj]===k) { bad=true; break; }
      if (bad) continue;
      for (const opt of sh[k]) {
        let bad2 = false;
        for (const nj of radjArr[ri]) {
          if (aFlag[nj]) {
            // check cross-adjacency: opt.cells intersects aExp[nj], or aCells[nj] intersects opt.expanded
            for (const cid of opt.cells) if (aExp[nj].has(cid)) { bad2=true; break; }
            if (!bad2) for (const cid of aCells[nj]) if (opt.expanded.has(cid)) { bad2=true; break; }
          }
          if (bad2) break;
        }
        if (bad2) continue;
        ac[ri]=k; aCells[ri]=opt.cells; aExp[ri]=opt.expanded; aFlag[ri]=true;
        bt(pos+1);
        aFlag[ri]=false;
        if (solutions>=limit) return;
      }
    }
  }
  bt(0);
  return solutions;
}

function verifySolution(level) {
  const n = level.size;
  const NR = level.n_regions;
  const cellRegion = Array(n*n).fill(-1);
  for (let ri=0; ri<NR; ri++) for (const [r,c] of level.regions[ri]) cellRegion[r*n+c]=ri;
  // gather shaded cells per region
  const shadePerRegion = Array.from({length:NR}, () => []);
  for (let ri=0; ri<NR; ri++) {
    const sc = level.sol_shade[ri];
    for (const [r,c] of sc) shadePerRegion[ri].push([r,c]);
  }
  // Rule 2: count matches clue
  for (let ri=0; ri<NR; ri++) {
    if (level.clues[ri] !== null && level.clues[ri] !== undefined) {
      if (shadePerRegion[ri].length !== level.clues[ri]) return `R${ri}: count ${shadePerRegion[ri].length}≠clue ${level.clues[ri]}`;
    }
    if (shadePerRegion[ri].length < 1) return `R${ri}: empty shade`;
  }
  // Rule 3: connected within region
  for (let ri=0; ri<NR; ri++) {
    if (!isConnected(shadePerRegion[ri], n)) return `R${ri}: not connected`;
  }
  // Rule 4: adjacent regions different counts
  const radj = Array.from({length:NR}, () => new Set());
  for (let r=0;r<n;r++) for (let c=0;c<n;c++) {
    const ri=cellRegion[r*n+c];
    for (const [nr,nc] of neighbors(r,c,n)) { const rj=cellRegion[nr*n+nc]; if (rj!==ri) radj[ri].add(rj); }
  }
  for (let ri=0; ri<NR; ri++) {
    for (const rj of radj[ri]) {
      if (shadePerRegion[ri].length === shadePerRegion[rj].length) return `R${ri}-R${rj}: same count ${shadePerRegion[ri].length}`;
    }
  }
  // Rule 5: no cross-region shade adjacency
  const shadeSet = new Set();
  for (let ri=0; ri<NR; ri++) for (const [r,c] of shadePerRegion[ri]) shadeSet.add(r*n+c);
  for (let ri=0; ri<NR; ri++) {
    for (const [r,c] of shadePerRegion[ri]) {
      for (const [nr,nc] of neighbors(r,c,n)) {
        const nid = nr*n+nc;
        if (shadeSet.has(nid) && cellRegion[nid] !== ri) return `R${ri} cell (${r},${c}) touches R${cellRegion[nid]} cell`;
      }
    }
  }
  return null; // valid
}

console.log(`Verifying ${levels.length} Shimaguni levels...`);
for (const lvl of levels) {
  const tag = `${lvl.tier} L${lvl.level} (${lvl.size}x${lvl.size}, ${lvl.n_regions}reg)`;
  // 1. solution validity
  const vErr = verifySolution(lvl);
  if (vErr) { console.log(`❌ ${tag}: INVALID SOLUTION — ${vErr}`); allPass=false; continue; }
  // 2. uniqueness
  const nsol = solveCount(lvl, 2);
  if (nsol !== 1) { console.log(`❌ ${tag}: NOT UNIQUE (solutions=${nsol})`); allPass=false; continue; }
  console.log(`✅ ${tag}: VALID + UNIQUE`);
}
console.log(allPass ? '\n✅ ALL 27 LEVELS PASS (valid + unique)' : '\n❌ SOME LEVELS FAILED');
process.exit(allPass ? 0 : 1);
