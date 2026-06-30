// In-engine Node.js BFS verification — extracts LEVELS from index.html
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const m = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if(!m){ console.error('LEVELS not found'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);

function sliderX(angleIdx, nPos, radius){
  var ang = angleIdx * 2 * Math.PI / nPos;
  return Math.round(radius * Math.cos(ang) * 10) / 10;
}

var pass=0, fail=0;
LEVELS.forEach(function(lvl,i){
  var n=lvl.n, p=lvl.p, r=lvl.r, t=lvl.t, s=lvl.s;
  var solOk = true;
  for(var c=0;c<n;c++){
    if(Math.abs(sliderX(s[c],p,r)-t[c])>0.5) solOk=false;
  }
  var count=1;
  for(var c=0;c<n;c++){
    var mc=0;
    for(var a=0;a<p;a++){ if(Math.abs(sliderX(a,p,r)-t[c])<0.5) mc++; }
    count*=mc;
    if(mc===0){count=0;break;}
  }
  var unique = count===1;
  if(solOk && unique) pass++; else { fail++; console.log('L'+(i+1)+' FAIL solOk='+solOk+' count='+count); }
});
console.log('In-engine Node BFS: '+pass+'/'+LEVELS.length+' UNIQUE+VALID');
process.exit(fail?1:0);
