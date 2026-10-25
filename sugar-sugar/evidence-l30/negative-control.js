// Run from sugar-sugar/: perturb only L30's first stroke, then restore exact bytes.
const fs=require('fs'),assert=require('assert'),{spawnSync}=require('child_process');
const file='solutions.json',original=fs.readFileSync(file);
fs.writeFileSync('evidence-l30/solutions-positive.json',original);
function gate(log){
 const run=spawnSync(process.execPath,['verify_engine.js'],{cwd:process.cwd(),encoding:'utf8',timeout:180000,maxBuffer:1024*1024});
 const output=(run.stdout||'')+(run.stderr||'');fs.writeFileSync(log,output);
 const line=output.trim().split('\n').findLast(l=>l.startsWith('{"pass":'));
 console.log('node verify_engine.js -> exit '+run.status+' ['+log+']');console.log(line||output);
 if(run.error)throw run.error;
 return {status:run.status,json:JSON.parse(line)};
}
let negative;
try{
 const changed=JSON.parse(original);assert(changed['30']);
 for(const p of changed['30'].strokes[0])p.x+=40;
 fs.writeFileSync(file,JSON.stringify(changed,null,1)+'\n');
 console.log('Perturbation: solutions["30"].strokes[0].forEach(p => p.x += 40)');
 negative=gate('evidence-l30/negative-gate.log');
}finally{fs.writeFileSync(file,original);console.log('Restored solutions.json byte-for-byte');}
const restored=gate('evidence-l30/restored-gate.log');
assert.equal(negative.status,1);assert.equal(negative.json.verdict,'FAIL');
assert(negative.json.fails.some(f=>f.startsWith('level-30-won:')));
assert.equal(negative.json.extra.levels,'29/30');
assert.equal(restored.status,0);assert.equal(restored.json.verdict,'PASS');
assert.equal(restored.json.extra.levels,'30/30');
assert(fs.readFileSync(file).equals(original));
console.log('PASS: L30 perturbation rejected; exact restoration passes 30/30');
