#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),path=require('path');
const dir=__dirname, html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const extractor=require('../.audit/gz-extract-levels.js');
const LEVELS=extractor('renzoku');
if(!Array.isArray(LEVELS)||LEVELS.length===0){console.error('LEVELS_NOT_FOUND');process.exit(1);}
const m=html.match(/function checkSolution\(\)\s*\{[\s\S]*?\n\}/);
if(!m){console.error('checkSolution not found');process.exit(1);}
let pass=0;
for(let i=0;i<LEVELS.length;i++){
 const L=LEVELS[i], grid=Array.from({length:L.N},(_,r)=>L.s.slice(r*L.N,(r+1)*L.N));
 const ctx={lv:{i:L.i,tier:L.t,N:L.N,givens:L.g,solution:L.s},grid}; vm.createContext(ctx);
 vm.runInContext(m[0],ctx); let res=ctx.checkSolution();
 if(res&&res.ok)pass++;else console.error(`L${i+1}: FAIL ${res&&res.reason}`);
}
console.log(`${pass}/${LEVELS.length} levels PASS`);process.exit(pass===LEVELS.length?0:1);
