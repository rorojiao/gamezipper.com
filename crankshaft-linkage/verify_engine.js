// In-engine verification for sibling's Crankshaft Linkage format
// Level format: [cranks[[r,L]...], subChains[[crankIdx...]...], targets[x...], solutionAngles[idx...], par]
// sliderPos(angleDeg, r, L) = r*cos(a) + sqrt(L^2 - r^2*sin^2(a))
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const m = html.match(/var LEVELS=(\[[\s\S]*?\]);/);
if(!m){ console.error('LEVELS not found'); process.exit(1); }
const LEVELS = eval(m[1]);
const ANGLES = [0,45,90,135,180,225,270,315];
const TOLERANCE = 8;

function sliderPos(angleDeg, r, L) {
  const a = angleDeg * Math.PI / 180;
  const sa = Math.sin(a);
  let val = L*L - r*r*sa*sa;
  if(val < 0) val = 0;
  return r*Math.cos(a) + Math.sqrt(val);
}

let pass=0, fail=0;
LEVELS.forEach((lv, i) => {
  const [cranks, subs, targets, solAngles, par] = lv;
  // Verify solution: rotate each sub-chain to its solution angle, check all sliders hit targets
  let solOk = true;
  for(let si=0; si<subs.length; si++) {
    const angle = ANGLES[solAngles[si]];
    for(let j=0; j<subs[si].length; j++) {
      const ci = subs[si][j];
      const [r, L] = cranks[ci];
      const x = sliderPos(angle, r, L);
      if(Math.abs(x - targets[ci]) > TOLERANCE) solOk = false;
    }
  }
  // Count solutions: try all sub-chain angle combos
  let count = 0;
  const tryAngles = (si, angles) => {
    if(si === subs.length) {
      // Check if this combo solves
      for(let s2=0; s2<subs.length; s2++) {
        const ang = ANGLES[angles[s2]];
        for(let j=0; j<subs[s2].length; j++) {
          const ci = subs[s2][j];
          const [r,L] = cranks[ci];
          const x = sliderPos(ang, r, L);
          if(Math.abs(x - targets[ci]) > TOLERANCE) return;
        }
      }
      count++;
      return;
    }
    for(let a=0; a<8; a++) {
      tryAngles(si+1, [...angles, a]);
    }
  };
  tryAngles(0, []);
  const unique = count === 1;
  if(solOk && unique) {
    pass++;
  } else {
    fail++;
    console.log(`L${i+1}: solOk=${solOk} count=${count} unique=${unique}`);
  }
});
console.log(`In-engine BFS: ${pass}/${LEVELS.length} UNIQUE+VALID`);
process.exit(fail?1:0);
