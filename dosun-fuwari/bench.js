var g=require('./gen_dosun.js');
var cfg={R:8,C:8,wallMin:3,wallMax:7,minSize:2,maxSize:5,minRegions:7};
var seed=555;
var found=0, tStart=Date.now();
for(var n=0;n<60;n++){
  var rng=g.makeRng(seed+n*7);
  var t0=Date.now();
  var lvl=g.genLevel(cfg,rng);
  var dt=Date.now()-t0;
  if(lvl){ found++; console.log("found #"+found+" time="+dt+"ms"); }
  else console.log("miss time="+dt+"ms");
  if((Date.now()-tStart)>8000){ console.log("stopping after 8s"); break; }
}
console.log("found="+found+" in "+(Date.now()-tStart)+"ms");
