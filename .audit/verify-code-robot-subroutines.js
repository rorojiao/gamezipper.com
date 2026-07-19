const path=require('path');
const {fork}=require('child_process');
const extractLevels=require(path.join(process.cwd(),'.audit/gz-extract-levels.js'));
const LEVELS=extractLevels('code-robot');

// Each level is solved in a worker thread (child_process.fork) so a V8 OOM
// on one hard level (e.g. code-robot L27 with 8 lights = 256 m-states) cannot
// kill the entire verification run.
function solveOne(lv, idx) {
  return new Promise(resolve => {
    const child = fork(path.join(__dirname,'_code-robot-sub-worker.js'), [],
      {stdio:['ignore','pipe','pipe','ipc']});
    let stdoutBuf = '';
    child.stdout.on('data', d => stdoutBuf += d.toString());
    child.stderr.on('data', d => process.stderr.write(d));
    child.on('exit', code => {
      // parse worker output: lines of "OUT: ..." 
      const out = {};
      for (const line of stdoutBuf.split('\n')) {
        const m = line.match(/^OUT:(\w+):(.*)$/);
        if (m) out[m[1]] = m[2];
      }
      resolve({code, stdoutBuf, out});
    });
    child.on('error', e => resolve({code:-1, error:e.message}));
    child.send({cmd:'solve', level:lv, idx});
    // hard timeout 240s per level
    setTimeout(()=>{ try{child.kill('SIGKILL')}catch(_){} }, 240000);
  });
}

(async function main(){
  let bad=[],unknown=[],pass=0;
  for (let i=0;i<LEVELS.length;i++){
    const lv = LEVELS[i];
    if (!lv.p1 && !lv.p2) continue;
    const t0 = Date.now();
    const r = await solveOne(lv, i);
    const dt = Date.now()-t0;
    if (r.code === 0 && r.out.SOL){
      console.log(`L${String(i+1).padStart(2,'0')} PASS ${r.out.SOL} [${dt}ms]`);
      pass++;
    } else if (r.code === 0 && r.out.STATUS === 'NONE'){
      const requiresSub = /Spiral|Build reusable|routines|Master the P1\+P2|P1 and P2/i.test(lv.hint||'');
      if (requiresSub){
        console.log(`L${String(i+1).padStart(2,'0')} DESIGN-REQUIRES-SUB [hint: ${lv.hint}] [${dt}ms]`);
        unknown.push({level:i+1,hint:lv.hint,note:'design-requires-sub'});
      } else {
        console.log(`L${String(i+1).padStart(2,'0')} UNKNOWN-NO-PATH [${dt}ms]`);
        unknown.push({level:i+1,reason:'unknown-no-path'});
      }
    } else if (r.code === -1 || r.code === null || /killed|terminated/i.test(r.stdoutBuf||'')){
      const requiresSub = /Spiral|Build reusable|routines|Master the P1\+P2|P1 and P2/i.test(lv.hint||'');
      if (requiresSub){
        console.log(`L${String(i+1).padStart(2,'0')} DESIGN-REQUIRES-SUB-PROCESS-CRASH [hint: ${lv.hint}] [${dt}ms]`);
        unknown.push({level:i+1,hint:lv.hint,note:'design-requires-sub-crashed'});
      } else {
        console.log(`L${String(i+1).padStart(2,'0')} UNKNOWN-CRASH [${dt}ms]`);
        unknown.push({level:i+1,reason:'process-crashed'});
      }
    } else {
      console.log(`L${String(i+1).padStart(2,'0')} FAIL code=${r.code} [${dt}ms]`);
      bad.push({level:i+1,code:r.code});
    }
  }
  console.log(`SUMMARY subroutine-levels=${LEVELS.filter(x=>x.p1||x.p2).length} pass=${pass} unknown=${unknown.length} bad=${bad.length}`);
  if (unknown.length) console.log('UNKNOWN ENTRIES:', JSON.stringify(unknown,null,2));
  if (bad.length) process.exit(1);
})();
