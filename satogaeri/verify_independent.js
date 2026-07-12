// verify_independent.js — Method 2: independent Node.js verifier for Satogaeri
// Reads levels.json and verifies each level's solution satisfies all rules.
const fs = require('fs');

function manhattan(a, b) { return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]); }
function sameLine(a, b) { return a[0]===b[0] || a[1]===b[1]; }
function cellsBetween(a, b) {
  const cells = [];
  if (a[0]===b[0]) { const r=a[0]; const [c1,c2]=[Math.min(a[1],b[1]),Math.max(a[1],b[1])]; for(let c=c1+1;c<c2;c++) cells.push([r,c]); }
  else if (a[1]===b[1]) { const c=a[1]; const [r1,r2]=[Math.min(a[0],b[0]),Math.max(a[0],b[0])]; for(let r=r1+1;r<r2;r++) cells.push([r,c]); }
  return cells;
}

function verifyLevel(lvl) {
  const R = lvl.R, C = lvl.C;
  const regions = lvl.regions;
  const circles = lvl.circles;
  
  // 1. each region has exactly one target
  const regionTargets = {};
  for (const c of circles) {
    const rid = regions[c.tr][c.tc];
    regionTargets[rid] = (regionTargets[rid]||0)+1;
  }
  const allRegionIds = new Set();
  for (let r=0;r<R;r++) for (let c=0;c<C;c++) allRegionIds.add(regions[r][c]);
  for (const rid of allRegionIds) {
    if ((regionTargets[rid]||0) !== 1) return [false, `region ${rid} target count ${regionTargets[rid]||0} != 1`];
  }
  
  // 2. starts distinct
  const starts = circles.map(c=>[c.sr,c.sc]);
  if (new Set(starts.map(s=>s.join(','))).size !== starts.length) return [false, 'duplicate starts'];
  
  // 3. targets distinct
  const targets = circles.map(c=>[c.tr,c.tc]);
  if (new Set(targets.map(s=>s.join(','))).size !== targets.length) return [false, 'duplicate targets'];
  
  // 4. straight line + numbered distance
  for (let i=0;i<circles.length;i++) {
    const c = circles[i];
    const s=[c.sr,c.sc], t=[c.tr,c.tc];
    if (!sameLine(s,t)) return [false, `circle ${i} not straight line`];
    const d = manhattan(s,t);
    if (d===0) return [false, `circle ${i} zero distance`];
    if (c.num !== null && c.num !== undefined && c.num !== d) return [false, `circle ${i} num ${c.num} != dist ${d}`];
  }
  
  // 5. trail conflicts
  const trails = circles.map(c => {
    const s=[c.sr,c.sc], t=[c.tr,c.tc];
    return new Set([...cellsBetween(s,t).map(x=>x.join(',')), t.join(',')]);
  });
  for (let i=0;i<circles.length;i++) {
    for (let j=0;j<circles.length;j++) {
      if (i===j) continue;
      if (trails[i].has(starts[j].join(','))) return [false, `start ${j} on trail ${i}`];
      for (const cell of trails[j]) {
        if (trails[i].has(cell)) return [false, `trail overlap ${i},${j} at ${cell}`];
      }
    }
  }
  
  return [true, 'OK'];
}

const data = JSON.parse(fs.readFileSync('levels.json','utf8'));
let pass=0, fail=0;
for (let i=0;i<data.length;i++) {
  const [ok, msg] = verifyLevel(data[i]);
  if (ok) { pass++; }
  else { fail++; console.log(`L${i+1} FAIL: ${msg}`); }
}
console.log(`${pass}/${data.length} PASS, ${fail} FAIL`);
if (fail===0) console.log('ALL VALID (Method 2: independent Node.js)');
process.exit(fail===0 ? 0 : 1);
