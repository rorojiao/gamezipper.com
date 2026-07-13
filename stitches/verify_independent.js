#!/usr/bin/env node
/**
 * Stitches — Independent Node.js verifier.
 * Re-implements the constraint solver in JS (independent of the Python generator)
 * to confirm each level in levels.json has exactly ONE solution.
 *
 * Rules verified:
 *   - Every adjacent region pair connected by exactly one stitch (edge).
 *   - No cell reused (each cell endpoint of at most one stitch).
 *   - Row/col endpoint counts match clues exactly.
 *
 * Output: PASS/FAIL per level + total.
 */
const fs = require('fs');

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function inBounds(r,c,R,C){ return r>=0&&r<R&&c>=0&&c<C; }

function computeAdjacency(region, R, C) {
  const adj = new Set();
  for (let r=0;r<R;r++){
    for (let c=0;c<C;c++){
      const rid = region[r][c];
      if (c+1<C && region[r][c+1]!==rid){
        const k = rid<region[r][c+1]?`${rid},${region[r][c+1]}`:`${region[r][c+1]},${rid}`;
        adj.add(k);
      }
      if (r+1<R && region[r+1][c]!==rid){
        const k = rid<region[r+1][c]?`${rid},${region[r+1][c]}`:`${region[r+1][c]},${rid}`;
        adj.add(k);
      }
    }
  }
  return adj;
}

function boundaryEdges(region, R, C) {
  const m = new Map(); // pairKey -> [[r1,c1,r2,c2], ...]
  for (let r=0;r<R;r++){
    for (let c=0;c<C;c++){
      const rid = region[r][c];
      if (c+1<C && region[r][c+1]!==rid){
        const k = rid<region[r][c+1]?`${rid},${region[r][c+1]}`:`${region[r][c+1]},${rid}`;
        if(!m.has(k)) m.set(k,[]);
        m.get(k).push([r,c,r,c+1]);
      }
      if (r+1<R && region[r+1][c]!==rid){
        const k = rid<region[r+1][c]?`${rid},${region[r+1][c]}`:`${region[r+1][c]},${rid}`;
        if(!m.has(k)) m.set(k,[]);
        m.get(k).push([r,c,r+1,c]);
      }
    }
  }
  return m;
}

function solveUnique(level) {
  const {R, C, regions: region, rowClues, colClues} = level;
  const adjSet = computeAdjacency(region, R, C);
  const pairEdges = boundaryEdges(region, R, C);
  const pairs = [...adjSet];
  // pairEdges map has edges per pair
  // verify all pairs have edges
  for (const p of pairs) {
    if (!pairEdges.has(p) || pairEdges.get(p).length===0) return {sols:[], reason:'pair-no-edges'};
  }

  const solutions = [];
  let nodes = 0;
  const NODE_BUDGET = 400000;
  const assignment = {};

  function candidates(pk, used, rc, cc) {
    const out = [];
    for (const [r1,c1,r2,c2] of pairEdges.get(pk)) {
      const a = `${r1},${c1}`, b=`${r2},${c2}`;
      if (used.has(a)||used.has(b)) continue;
      if (rc[r1]+1>rowClues[r1]) continue;
      if (rc[r2]+1>rowClues[r2]) continue;
      if (cc[c1]+1>colClues[c1]) continue;
      if (cc[c2]+1>colClues[c2]) continue;
      out.push([a,b,r1,c1,r2,c2]);
    }
    return out;
  }

  function rec(unassigned, used, rc, cc) {
    if (solutions.length>=2) return;
    if (nodes++ > NODE_BUDGET) return;
    if (unassigned.size===0) {
      // verify exact counts
      for (let i=0;i<R;i++) if (rc[i]!==rowClues[i]) return;
      for (let i=0;i<C;i++) if (cc[i]!==colClues[i]) return;
      solutions.push({...assignment});
      return;
    }
    // MRV
    let bestPk=null, bestCands=null;
    for (const pk of unassigned) {
      const cs = candidates(pk, used, rc, cc);
      if (bestCands===null || cs.length<bestCands.length) {
        bestPk = pk; bestCands = cs;
        if (cs.length===0) break;
      }
    }
    if (!bestCands || bestCands.length===0) return;
    unassigned.delete(bestPk);
    for (const [a,b,r1,c1,r2,c2] of bestCands) {
      used.add(a); used.add(b);
      rc[r1]++; rc[r2]++; cc[c1]++; cc[c2]++;
      assignment[bestPk] = [r1,c1,r2,c2];
      rec(unassigned, used, rc, cc);
      delete assignment[bestPk];
      used.delete(a); used.delete(b);
      rc[r1]--; rc[r2]--; cc[c1]--; cc[c2]--;
      if (solutions.length>=2 || nodes>NODE_BUDGET) break;
    }
    unassigned.add(bestPk);
  }

  rec(new Set(pairs), new Set(), new Array(R).fill(0), new Array(C).fill(0));
  return {solutions, nodes};
}

function verifySolutionMatches(level, solverSols) {
  // confirm the generator's recorded solution is among the solver's solutions
  const genSol = JSON.stringify([...level.solution].sort());
  for (const solMap of solverSols) {
    const edges = Object.values(solMap).map(([r1,c1,r2,c2])=>[r1,c1,r2,c2]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]);
    if (JSON.stringify(edges)===genSol) return true;
  }
  return false;
}

function main() {
  const data = JSON.parse(fs.readFileSync('levels.json','utf8'));
  const levels = data.levels;
  let pass=0, fail=0;
  for (const lvl of levels) {
    const {solutions: sols, nodes, reason} = solveUnique(lvl);
    let ok = sols.length===1;
    let detail = sols.length===1 ? 'UNIQUE' : (sols.length===0 ? 'NO-SOLUTION' : `MULTI(${sols.length})`);
    if (ok) {
      // also verify generator solution matches
      const match = verifySolutionMatches(lvl, sols);
      if (!match) { ok=false; detail='SOLVER-GEN-MISMATCH'; }
    }
    if (ok) pass++; else fail++;
    console.log(`L${String(lvl.levelNum).padStart(2,'0')} ${lvl.tier.padEnd(9)} ${lvl.R}x${lvl.C} pairs=${lvl.adjPairs} nodes=${nodes} → ${ok?'✓ PASS':'✗ FAIL'} (${detail})`);
  }
  console.log(`\n=== RESULT: ${pass}/${levels.length} PASS, ${fail} FAIL ===`);
  process.exit(fail>0?1:0);
}

main();
