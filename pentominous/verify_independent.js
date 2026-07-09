// Independent Node.js verifier for Pentominous levels.
// Mirrors verify_independent.py logic in JS for cross-validation.
const fs = require('fs');

function loadLevels(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const d = JSON.parse(raw);
  if (Array.isArray(d)) return d;
  return d.levels || d.LEVELS || [];
}

function verifyLevel(lvl) {
  const R = lvl.r || lvl.rows;
  const C = lvl.c || lvl.cols;
  const clues = lvl.clues || {};
  const sol = lvl.solution || {};
  const errors = [];

  // (a) all cells covered exactly once
  const cellCount = {};
  for (const k of Object.keys(sol)) cellCount[k] = (cellCount[k]||0)+1;
  for (let r=0; r<R; r++) for (let c=0; c<C; c++) {
    const k = `${r},${c}`;
    if (!cellCount[k]) errors.push(`cell ${k} not covered`);
    else if (cellCount[k] > 1) errors.push(`cell ${k} covered ${cellCount[k]} times`);
  }

  // flood fill regions
  const cellToLetter = {};
  for (const k of Object.keys(sol)) {
    const [r,c] = k.split(',').map(Number);
    cellToLetter[`${r},${c}`] = sol[k];
  }
  const visited = new Set();
  const regions = [];
  for (let r=0; r<R; r++) for (let c=0; c<C; c++) {
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    const letter = cellToLetter[key];
    if (!letter) continue;
    const stack = [[r,c]];
    const cells = [];
    while (stack.length) {
      const [cr,cc] = stack.pop();
      const k2 = `${cr},${cc}`;
      if (visited.has(k2)) continue;
      if (cellToLetter[k2] !== letter) continue;
      visited.add(k2);
      cells.push([cr,cc]);
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr=cr+dr,nc=cc+dc;
        if (nr>=0&&nr<R&&nc>=0&&nc<C&&cellToLetter[`${nr},${nc}`]===letter) stack.push([nr,nc]);
      }
    }
    regions.push({letter, cells});
  }

  // (b) each region 5 cells
  regions.forEach((reg,i) => {
    if (reg.cells.length !== 5) errors.push(`region ${reg.letter}#${i} has ${reg.cells.length} cells`);
  });

  // (c) no same-letter regions share edge
  for (let i=0;i<regions.length;i++) for (let j=i+1;j<regions.length;j++) {
    if (regions[i].letter !== regions[j].letter) continue;
    const sa = new Set(regions[i].cells.map(c=>`${c[0]},${c[1]}`));
    let shared = false;
    for (const [r,c] of regions[j].cells) {
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        if (sa.has(`${r+dr},${c+dc}`)) { shared=true; break; }
      }
      if (shared) break;
    }
    if (shared) errors.push(`two '${regions[i].letter}' regions share an edge`);
  }

  // (d) clues match
  for (const k of Object.keys(clues)) {
    if (sol[k] !== clues[k]) errors.push(`clue ${k}=${clues[k]} but sol=${sol[k]}`);
  }

  // (e) region count
  const expected = Math.floor(R*C/5);
  if (regions.length !== expected) errors.push(`expected ${expected} regions, got ${regions.length}`);

  return {errors, nReg: regions.length, expected};
}

function main() {
  const levels = loadLevels('levels.json');
  console.log(`Loaded ${levels.length} levels`);
  let allPass = true;
  levels.forEach((lvl,i) => {
    const R = lvl.r||lvl.rows, C = lvl.c||lvl.cols;
    const {errors, nReg, expected} = verifyLevel(lvl);
    const status = errors.length ? 'FAIL' : 'PASS';
    if (errors.length) allPass = false;
    console.log(`  Level ${i+1} (${R}x${C}, ${nReg}/${expected} regions): ${status}`);
    errors.slice(0,3).forEach(e => console.log(`    - ${e}`));
  });
  console.log('');
  console.log('RESULT:', allPass ? 'ALL PASS' : 'FAILURES DETECTED');
  process.exit(allPass ? 0 : 1);
}

main();
