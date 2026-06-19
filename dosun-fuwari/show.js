var data=JSON.parse(require('fs').readFileSync('levels_raw.json','utf8'));
function show(l,label){
  console.log("\n=== "+label+" R"+l.R+"xC"+l.C+" regions="+l.regions.length+" walls="+l.walls.length+" ===");
  var reg=new Array(l.R*l.C).fill(-1);l.walls.forEach(function(w){reg[w]=-2;});
  l.regions.forEach(function(r,i){r.forEach(function(c){reg[c]=i;});});
  // region map (letters)
  var L="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var s="";
  for(var r=0;r<l.R;r++){var line="";for(var c=0;c<l.C;c++){var i=r*l.C+c;line+=(reg[i]===-2?"#":L[reg[i]%L.length]);}s+=line+"\n";}
  console.log("regions:");console.log(s);
  var t="";
  for(var r=0;r<l.R;r++){var line="";for(var c=0;c<l.C;c++){var v=l.sol[r*l.C+c];line+=(v===3?"#":v===1?"O":v===2?"*":".");}t+=line+"\n";}
  console.log("solution (O=balloon *=iron #=wall):");console.log(t);
}
show(data.main[0],"Tutorial[0]");
show(data.main[16],"Hard[0]");
show(data.main[24],"Expert last");
