// Independent Node.js BFS/brute-force verifier — does NOT use game code
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('levels.json','utf8'));
let ok=0, bad=0;
for (const l of levels) {
  const {P,steps,signs,maxes,target,solution}=l;
  // verify stored solution
  let net = solution.reduce((acc,k,i)=>acc + k*steps[i]*signs[i],0);
  net = ((net % P)+P)%P;
  if (net !== target) { bad++; console.log('BAD sol L'+l.level); continue; }
  // count all solutions
  let count=0;
  const ranges = maxes.map(m=>Array.from({length:m+1},(_,i)=>i));
  const product = (arrs) => {
    if (arrs.length===0) return [[]];
    const [first,...rest]=arrs;
    const sub=product(rest);
    const out=[];
    for (const f of first) for (const s of sub) out.push([f,...s]);
    return out;
  };
  for (const combo of product(ranges)) {
    let n=combo.reduce((acc,k,i)=>acc+k*steps[i]*signs[i],0);
    n=((n%P)+P)%P;
    if (n===target) count++;
  }
  if (count<1) { bad++; console.log('BAD cnt L'+l.level); }
  else ok++;
}
console.log(`Node independent: ${ok}/30 valid, ${bad} bad`);
process.exit(bad>0?1:0);
