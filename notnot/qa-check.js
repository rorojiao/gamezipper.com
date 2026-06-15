const fs=require('fs');
const html=fs.readFileSync('/home/msdn/gamezipper.com/notnot/index.html','utf8');
const checks=[
  ['Analytics','site-analytics.cap.1ktower.com',true],
  ['Canonical','gamezipper.com/notnot/',true],
  ['JSON-LD VideoGame','VideoGame',true],
  ['OG tags','og:title',true],
  ['Touch action','touch-action:none',true],
  ['Overflow hidden','overflow:hidden',true],
  ['User select','user-select:none',true],
  ['Canvas','<canvas',true],
  ['localStorage','localStorage',true],
  ['AudioContext','AudioContext',true],
  ['No emoji',/[\u{1F300}-\u{1F9FF}]/u,false],
  ['No Chinese',/[\u{4e00}-\u{9fff}]/u,false],
  ['Cleanup function','function cleanup',true],
  ['No text-stroke','-webkit-text-stroke',false],
];
let pass=0,fail=0;
checks.forEach(c=>{
  const ok=c[2]?html.includes(c[1]):!new RegExp(c[1]).test(html);
  console.log(`${ok?'OK':'FAIL'} ${c[0]}`);
  if(ok)pass++;else fail++;
});
console.log(`\n${pass}/${checks.length} passed${fail?' ('+fail+' failed)':''}`);