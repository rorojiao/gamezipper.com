// verify_engine.js — In-engine verification.
// Extracts the ACTUAL checkWin/computeStrips logic from index.html and tests it against all 30 levels.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const data = JSON.parse(fs.readFileSync(path.join(__dirname,'levels.json'),'utf8'));
const levels = data.levels;

// Extract function bodies from the game script
function extractFunc(name) {
  const re = new RegExp('function '+name+'\\(([\\s\\S]*?)\\)\\{([\\s\\S]*?)\\n\\}');
  // Use a brace-matching approach instead
  const startIdx = html.indexOf('function '+name+'(');
  if (startIdx===-1) return null;
  let i = html.indexOf('{', startIdx);
  let depth=0; const startBrace=i;
  for (; i<html.length; i++){
    if(html[i]==='{')depth++;
    else if(html[i]==='}'){depth--;if(depth===0){i++;break;}}
  }
  return html.slice(startIdx, i);
}

const checkWinCode = extractFunc('checkWin');
const computeStripsCode = extractFunc('computeStrips');
const getStripInfoCode = extractFunc('getStripInfo');
console.log('Extracted checkWin:', !!checkWinCode, '('+(checkWinCode?checkWinCode.length:0)+' chars)');
console.log('Extracted computeStrips:', !!computeStripsCode);
console.log('Extracted getStripInfo:', !!getStripInfoCode);

if(!checkWinCode||!computeStripsCode||!getStripInfoCode){console.log('FAIL: functions not found');process.exit(1);}

// Build a test harness that defines the engine state and runs checkWin
function testLevel(lvl) {
  const R=lvl.rows, C=lvl.cols;
  const clues={}; for(const k in lvl.clues) clues[k]=lvl.clues[k];
  // Build border arrays from solution
  const cellStrip={};
  lvl.solution.forEach((s,sid)=>{ s.cells.forEach(c=>{ cellStrip[c[0]+','+c[1]]=sid; }); });
  const hBorders=[];for(let r=0;r<=R;r++){hBorders.push(new Array(C).fill(false));}
  const vBorders=[];for(let r=0;r<R;r++){vBorders.push(new Array(C+1).fill(false));}
  for(let r=1;r<R;r++)for(let c=0;c<C;c++){const a=cellStrip[(r-1)+','+c],b=cellStrip[r+','+c];hBorders[r][c]=(a!==b);}
  for(let r=0;r<R;r++)for(let c=1;c<C;c++){const a=cellStrip[r+','+(c-1)],b=cellStrip[r+','+c];vBorders[r][c]=(a!==b);}
  // outer borders
  for(let c=0;c<C;c++){hBorders[0][c]=true;hBorders[R][c]=true;}
  for(let r=0;r<R;r++){vBorders[r][0]=true;vBorders[r][C]=true;}

  // Create sandbox with the extracted functions
  const sandbox={R,C,clues,hBorders,vBorders,grid:[],Set,Math,Object,Array};
  vm.createContext(sandbox);
  // strip the "function name(" prefix and call wrapper
  const harness = `
    ${getStripInfoCode}
    ${computeStripsCode}
    ${checkWinCode}
    computeStrips();
    this.__result = checkWin();
  `;
  try { vm.runInContext(harness, sandbox, {timeout:3000}); }
  catch(e){ return {ok:false,err:e.message}; }
  return {ok:sandbox.__result};
}

let pass=0, fail=0;
for(let i=0;i<levels.length;i++){
  const lvl=levels[i];
  const res=testLevel(lvl);
  if(res.ok){pass++;console.log(`#${lvl.id} ${lvl.tier} ${lvl.rows}x${lvl.cols}: engine checkWin=PASS`);}
  else{fail++;console.log(`#${lvl.id} ${lvl.tier} ${lvl.rows}x${lvl.cols}: engine checkWin=FAIL ${res.err||''}`);}
}
console.log(`\n=== IN-ENGINE VERIFICATION (real checkWin from index.html) ===`);
console.log(`Engine checkWin pass: ${pass}/${levels.length}`);
console.log(`FAILED: ${fail}`);
process.exit(fail>0?1:0);
