var G=require('./gen_dosun.js');
var rng=G.makeRng(100);
// inline copies of gen2 internals to test each step
function rc(i,C){return [(i/C)|0, i-((i/C)|0)*C];}
function idx(r,c,C){return r*C+c;}
function neighbors4(i,R,C){var r=(i/C)|0,c=i-r*C,o=[];if(r>0)o.push(i-C);if(r<R-1)o.push(i+C);if(c>0)o.push(i-1);if(c<C-1)o.push(i+1);return o;}
var R=5,C=5,N=25;
var walls=[];
var isWall=new Array(N).fill(false);
var sol=new Array(N).fill(0);
var balloons=[],irons=[];
for(var c=0;c<C;c++){
  var top=idx(0,c,C),bot=idx(4,c,C);
  sol[top]=1;balloons.push(top);sol[bot]=2;irons.push(bot);
}
console.log("bal",balloons.length,"iron",irons.length);
// matchPairs same
var balAvail=balloons.slice(),ironAvail=irons.slice(),pairs=[];
var bpos=balloons.map(function(i){return rc(i,C);});
while(pairs.length<5){
  var bi=balAvail[0];var bxy=rc(bi,C);var best=-1,bs=1e9;
  for(var k=0;k<ironAvail.length;k++){var ixy=rc(ironAvail[k],C);var man=Math.abs(bxy[0]-ixy[0])+Math.abs(bxy[1]-ixy[1]);var sameCol=(bxy[1]===ixy[1])?0:1;var score=man*10+sameCol*100+rng.int(0,3);if(score<bs){bs=score;best=k;}}
  pairs.push([bi,ironAvail[best]]);balAvail.shift();ironAvail.splice(best,1);
}
console.log("pairs:",pairs.map(function(p){return rc(p[0],C).join(',')+'-'+rc(p[1],C).join(',');}).join('  '));
// pathThrough
function pathThrough(a,b){
  if(a===b)return [a];
  var prev=new Array(N).fill(-2);var q=[a];prev[a]=-1;var head=0;var owner=new Array(N).fill(-1);
  while(head<q.length){var cur=q[head++];if(cur===b)break;var ns=neighbors4(cur,R,C);for(var k=0;k<ns.length;k++){var nx=ns[k];if(prev[nx]!==-2)continue;if(isWall[nx])continue;if(sol[nx]!==0&&nx!==b)continue;if(owner[nx]&&nx!==b)continue;prev[nx]=cur;q.push(nx);}}
  if(prev[b]===-2)return null;var path=[];var cur=b;while(cur!==-1){path.push(cur);cur=prev[cur];}path.reverse();return path;
}
for(var p=0;p<pairs.length;p++){var path=pathThrough(pairs[p][0],pairs[p][1]);console.log("pair",p,"path:",path?"len"+path.length:"NULL");}
