// Playtest: simulate solving each level by rotating cranks from 0 to solution
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const m = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
const LEVELS = JSON.parse(m[1]);
function sliderX(a,p,r){ return Math.round(r*Math.cos(a*2*Math.PI/p)*10)/10; }
let pass=0;
LEVELS.forEach((lvl,i)=>{
  const {n,p,r,s,par} = lvl;
  let steps=0;
  for(let c=0;c<n;c++){
    steps += Math.min(s[c], p-s[c]);
  }
  let ok=true;
  for(let c=0;c<n;c++){
    if(Math.abs(sliderX(s[c],p,r)-lvl.t[c])>0.5) ok=false;
  }
  if(ok) pass++;
});
console.log(`Playtest: ${pass}/${LEVELS.length} solved`);
process.exit(pass===LEVELS.length?0:1);
