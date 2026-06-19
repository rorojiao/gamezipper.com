var g=require('./gen_dosun.js');
function yieldTest(label,cfg,attempts){
  var found=0, t0=Date.now();
  for(var n=0;n<attempts;n++){
    var rng=g.makeRng(1000+n);
    var lvl=g.genLevel(cfg,rng);
    if(lvl) found++;
  }
  var dt=Date.now()-t0;
  console.log(label.padEnd(28), "yield="+found+"/"+attempts, "("+(dt/attempts).toFixed(1)+"ms/att)");
}
// vary wall density & region size on 8x8
yieldTest("8x8 w3-7 s2-5",{R:8,C:8,wallMin:3,wallMax:7,minSize:2,maxSize:5,minRegions:7},300);
yieldTest("8x8 w5-10 s2-4",{R:8,C:8,wallMin:5,wallMax:10,minSize:2,maxSize:4,minRegions:7},300);
yieldTest("8x8 w7-12 s2-3",{R:8,C:8,wallMin:7,wallMax:12,minSize:2,maxSize:3,minRegions:8},300);
yieldTest("8x8 w6-10 s2-4",{R:8,C:8,wallMin:6,wallMax:10,minSize:2,maxSize:4,minRegions:8},300);
yieldTest("8x8 w8-14 s2-3",{R:8,C:8,wallMin:8,wallMax:14,minSize:2,maxSize:3,minRegions:9},300);
