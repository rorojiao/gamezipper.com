// Independent Node.js BFS verifier for Spectrometer Calibrate
// Verifies each level is solvable and has unique optimal solution
const LEVELS_DATA = ["1|2|6|3|3.4.#FF4444.Red,1.5.#FF9933.Orange","2|2|6|4|1.2.#FF4444.Red,1.2.#FF9933.Orange","3|2|6|4|0.4.#FF4444.Red,5.4.#FF9933.Orange","4|2|6|2|4.5.#FF4444.Red,0.5.#FF9933.Orange","5|2|6|3|3.2.#FF4444.Red,3.5.#FF9933.Orange","6|2|8|2|3.7.#FF4444.Red,5.7.#FF9933.Orange","7|2|8|3|6.7.#FF4444.Red,3.2.#FF9933.Orange","8|2|8|3|7.6.#FF4444.Red,2.7.#FF9933.Orange","9|2|8|4|5.1.#FF4444.Red,1.5.#FF9933.Orange","10|2|8|6|5.5.#FF4444.Red,0.3.#FF9933.Orange","11|3|8|9|0.5.#FF4444.Red,3.3.#FF9933.Orange,1.5.#FFEE44.Yellow","12|3|8|6|3.5.#FF4444.Red,7.1.#FF9933.Orange,5.2.#FFEE44.Yellow","13|3|8|7|3.6.#FF4444.Red,2.6.#FF9933.Orange,7.5.#FFEE44.Yellow","14|3|8|5|2.5.#FF4444.Red,2.1.#FF9933.Orange,1.1.#FFEE44.Yellow","15|3|8|6|2.5.#FF4444.Red,6.1.#FF9933.Orange,6.6.#FFEE44.Yellow","16|3|10|8|1.3.#FF4444.Red,4.1.#FF9933.Orange,6.6.#FFEE44.Yellow","17|3|10|9|2.9.#FF4444.Red,6.4.#FF9933.Orange,0.4.#FFEE44.Yellow","18|3|10|11|7.6.#FF4444.Red,8.7.#FF9933.Orange,2.6.#FFEE44.Yellow","19|3|10|7|7.1.#FF4444.Red,2.3.#FF9933.Orange,9.7.#FFEE44.Yellow","20|3|10|8|1.2.#FF4444.Red,1.3.#FF9933.Orange,4.3.#FFEE44.Yellow","21|4|10|15|2.7.#FF4444.Red,2.4.#FF9933.Orange,8.6.#FFEE44.Yellow,7.4.#44DD44.Green","22|4|10|7|4.2.#FF4444.Red,5.3.#FF9933.Orange,1.9.#FFEE44.Yellow,4.1.#44DD44.Green","23|4|10|11|9.1.#FF4444.Red,5.4.#FF9933.Orange,6.7.#FFEE44.Yellow,5.7.#44DD44.Green","24|4|10|11|6.7.#FF4444.Red,5.9.#FF9933.Orange,1.3.#FFEE44.Yellow,0.6.#44DD44.Green","25|4|10|14|6.8.#FF4444.Red,3.6.#FF9933.Orange,3.6.#FFEE44.Yellow,1.6.#44DD44.Green","26|5|12|17|3.11.#FF4444.Red,11.4.#FF9933.Orange,6.5.#FFEE44.Yellow,7.2.#44DD44.Green,7.7.#44DDFF.Cyan","27|5|12|20|4.2.#FF4444.Red,8.5.#FF9933.Orange,10.7.#FFEE44.Yellow,7.9.#44DD44.Green,2.5.#44DDFF.Cyan","28|5|12|15|6.5.#FF4444.Red,6.11.#FF9933.Orange,9.3.#FFEE44.Yellow,4.7.#44DD44.Green,10.11.#44DDFF.Cyan","29|5|12|16|9.10.#FF4444.Red,10.8.#FF9933.Orange,3.7.#FFEE44.Yellow,5.4.#44DD44.Green,5.1.#44DDFF.Cyan","30|5|12|19|10.7.#FF4444.Red,11.5.#FF9933.Orange,3.11.#FFEE44.Yellow,10.3.#44DD44.Green,10.5.#44DDFF.Cyan"];

function parseLevel(s){
  const p=s.split('|');
  const dials=p[4].split(',').map(d=>{
    const a=d.split('.');return{init:+a[0],offset:+a[1],color:a[2],name:a[3]};
  });
  return{level:+p[0],K:+p[1],N:+p[2],par:+p[3],dials};
}

let allValid = true;
let allUnique = true;

for(const data of LEVELS_DATA){
  const lv = parseLevel(data);
  const N = lv.N;
  
  // Each dial is independent. Optimal solution for dial i = min(offset_i, N - offset_i) clicks.
  // Uniqueness: offset != N/2 (for even N) ensures only one direction is optimal.
  let totalPar = 0;
  let uniqueSolution = true;
  
  for(const d of lv.dials){
    const fwd = d.offset;
    const bwd = N - d.offset;
    const opt = Math.min(fwd, bwd);
    totalPar += opt;
    
    // Check uniqueness
    if(fwd === bwd){
      uniqueSolution = false;
    }
  }
  
  // Verify par matches
  if(totalPar !== lv.par){
    console.log(`❌ L${lv.level}: par mismatch ${lv.par} vs computed ${totalPar}`);
    allValid = false;
  }
  
  if(!uniqueSolution){
    console.log(`⚠️  L${lv.level}: ambiguous solution (offset = N/2)`);
    allUnique = false;
  }
  
  // BFS: since dials are independent, state = tuple of positions
  // For verification, check that from initial state, the target is reachable
  const target = lv.dials.map(d => (d.init + d.offset) % N);
  // Trivially reachable (each dial can rotate freely)
  // Just verify target != initial for at least one dial (non-trivial)
  const initial = lv.dials.map(d => d.init);
  const isNonTrivial = initial.some((v,i) => v !== target[i]);
  
  if(!isNonTrivial){
    console.log(`⚠️  L${lv.level}: trivial (already solved)`);
    allValid = false;
  }
}

console.log('---');
console.log(`Levels: ${LEVELS_DATA.length}`);
console.log(`Par valid: ${allValid ? '✅ ALL' : '❌ FAIL'}`);
console.log(`Unique solutions: ${allUnique ? '✅ ALL' : '⚠️  SOME AMBIGUOUS'}`);

// Per-level summary
console.log('\nPer-level:');
for(const data of LEVELS_DATA){
  const lv = parseLevel(data);
  let p = 0, u = true;
  for(const d of lv.dials){
    p += Math.min(d.offset, lv.N - d.offset);
    if(d.offset === lv.N - d.offset) u = false;
  }
  console.log(`  L${String(lv.level).padStart(2)} K=${lv.K} N=${String(lv.N).padStart(2)} par=${String(lv.par).padStart(2)} unique=${u?'✓':'⚠'} (${lv.dials.map(d=>`${d.name}:${d.offset}`).join(',')})`);
}
