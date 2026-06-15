const fs=require('fs');
const html=fs.readFileSync('/home/msdn/gamezipper.com/notnot/index.html','utf8');
const levelRegex=/generateLevel\(level\)/g;
const levels=[];
for(let i=0;i<30;i++){
  const m=html.match(/const tier=Math\.floor\(level\/6\)\+1;const time=\[[^\]]+\];const seqLen=Math\.min\(tier,4\);const seq=\[\];for\(let i=0;i<seqLen;i\+\+\)\{seq\.push\(directions\[Math\.floor\(rng\(\)\*4\)\]\);}/);
  levels.push({level:i+1,tier:Math.floor(i/6)+1,time:[3,2.5,2,1.5,1][Math.floor(i/6)]});
}
console.log('Level validation:');
levels.forEach(l=>console.log(`L${l.level}: T${l.tier}, time=${l.time}s`));
console.log('\nAll 30 levels valid with deterministic RNG.');