var g=require('./gen_dosun.js');
// For random 8x8 configs, what solution counts do we see? (cap higher)
function oneConfig(R,C,nWalls,rng,minSize,maxSize){
  var N=R*C,all=[];
  for(var i=0;i<N;i++)all.push(i);
  rng.shuffle(all);
  var walls=all.slice(0,nWalls);
  if(g.nonWallIsolated(R,C,walls)) return null;
  var regions=g.genRegions(R,C,walls,rng,minSize,maxSize);
  if(regions.length<6) return null;
  for(var ri=0;ri<regions.length;ri++) if(regions[ri].length<2) return null;
  return {R:R,C:C,walls:walls,regions:regions};
}
function hist(R,C,nWalls,minSize,maxSize){
  var bins={0:0,1:0,"2-5":0,"6-20":0,"21-100":0,"101+":0};
  var samples=0;
  for(var n=0;n<400;n++){
    var rng=g.makeRng(7000+n);
    var lvl=oneConfig(R,C,nWalls,rng,minSize,maxSize);
    if(!lvl) continue;
    samples++;
    var res=g.solve(lvl,101);
    var c=res.count;
    if(c===0)bins["0"]++;
    else if(c===1)bins["1"]++;
    else if(c<=5)bins["2-5"]++;
    else if(c<=20)bins["6-20"]++;
    else if(c<=100)bins["21-100"]++;
    else bins["101+"]++;
  }
  console.log("R"+R+"x"+C+" walls="+nWalls+":",JSON.stringify(bins),"samples="+samples);
}
hist(8,8,4,2,4);
hist(8,8,8,2,4);
hist(8,8,12,2,4);
hist(8,8,16,2,4);
