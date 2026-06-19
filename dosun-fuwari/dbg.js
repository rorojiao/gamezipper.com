var G=require('./gen_dosun.js');
var C2=require('./gen2.js');
var rng=G.makeRng(100);
// 5x5, 0 walls
var walls=[];
var bs=C2.buildSolution(5,5,walls);
console.log("balloons:",bs.balloons.length,"irons:",bs.irons.length);
console.log("sol:",bs.sol.join(''));
// match same column
var pairs=C2.matchPairs ? null : null;
// matchPairs not exported, replicate inline
console.log("buildSolution ok");
// now placeWalls
var w2=C2.placeWalls(5,5,rng,0,2);
console.log("walls:",w2);
// Try the full genConstruct with mode same
var cfg={R:5,C:5,wallMin:0,wallMax:2,minRegions:4,mode:'same',tries:60};
var lvl=C2.genConstruct(cfg,rng);
console.log("genConstruct result:", lvl?"OK":"NULL");
if(lvl){
  var res=G.solve(lvl,3);
  console.log("solve count=",res.count,"regions=",lvl.regions.length,"walls=",lvl.walls.length);
  // print grid
  var grid="";
  for(var r=0;r<5;r++){var line="";for(var c=0;c<5;c++){var i=r*5+c;var s=lvl.sol[i];line+=(s===3?"#":s===1?"O":s===2?"*":".");}grid+=line+"\n";}
  console.log(grid);
}
