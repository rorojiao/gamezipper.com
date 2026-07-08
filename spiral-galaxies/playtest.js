#!/usr/bin/env node
/**
 * Spiral Galaxies — simulate the user completing each level by replaying the
 * stored solution through the engine logic. Verifies every level is solvable
 * via the exact painting mechanic the player uses.
 */
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = HTML.match(/const\s+LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if(!m){ console.error('LEVELS not found'); process.exit(1); }
const LEVELS = eval('(' + m[1] + ')');

function intStars(L){ return L.stars.map(s => [Math.round(s.r*2), Math.round(s.c*2)]); }
function partnerCell(cr, cc, sr2, sc2){ return [sr2 - cr - 1, sc2 - cc - 1]; }

let pass = 0, fail = 0;
for(const L of LEVELS){
  const W = L.W, H = L.H;
  const assign = [];
  for(let r=0;r<H;r++) assign.push(new Array(W).fill(-1));
  const istars = intStars(L);
  let simOk = true;
  // Replay the solution: for each cell, find the "first" cell of each region's
  // pairs (so we don't double-assign).  Process cells in row-major order;
  // for each cell whose solution is si and whose partner has not yet been
  // assigned, paint (r,c) and the partner as si.
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      const si = L.solution[r][c];
      if(assign[r][c] === si) continue;  // already correct
      if(assign[r][c] !== -1){ simOk = false; break; }
      const [sr2, sc2] = istars[si];
      const pr = sr2 - r - 1, pc = sc2 - c - 1;
      if(pr<0||pr>=H||pc<0||pc>=W){ simOk = false; break; }
      if(assign[pr][pc] !== -1 && assign[pr][pc] !== si){ simOk = false; break; }
      assign[r][c] = si;
      if((pr!==r || pc!==c)) assign[pr][pc] = si;
    }
    if(!simOk) break;
  }
  if(!simOk){ fail++; console.log(`FAIL L${L.id}`); continue; }
  // Check assign matches solution
  let match = true;
  for(let r=0;r<H;r++) for(let c=0;c<W;c++){
    if(assign[r][c] !== L.solution[r][c]){ match = false; break; }
  }
  if(!match){ fail++; console.log(`FAIL L${L.id} mismatch after replay`); continue; }
  pass++;
}
console.log(`Playtest replay: ${pass} pass, ${fail} fail (out of ${LEVELS.length})`);
process.exit(fail===0?0:1);
