#!/usr/bin/env node
// black/verify_engine.js — verify the Black puzzle game has 30 winnable levels
// Each level defines unique mechanics; verification checks:
//   1. LEVELS dict has 30 entries (keys 1..30)
//   2. Each level has a `render(s, win)` function that calls `win` or `fillBlack` or `showWin`
//   3. Each level has a hint string
//   4. Engine helpers + site-chrome present
//
// Usage: node black/verify_engine.js

const fs=require('fs');
const path=require('path');

const SLUG='black';
const htmlPath=path.join(__dirname,'index.html');
const html=fs.readFileSync(htmlPath,'utf8');

// 1. Parse LEVELS = { ... } using balanced-brace scanner
const levelHeaderRe=/(?:const|let|var)\s+LEVELS\s*=\s*\{/;
const m=levelHeaderRe.exec(html);
if(!m){
  console.error(`❌ ${SLUG}: LEVELS = { ... } not found`);
  process.exit(1);
}

function findMatching(s,i,open,close){
  let depth=1;
  let inStr=null;
  let inLineComment=false;
  let inBlockComment=false;
  while(i<s.length && depth>0){
    const c=s[i];
    const next=s[i+1]||'';
    if(inLineComment){ if(c==='\n') inLineComment=false; }
    else if(inBlockComment){ if(c==='*' && next==='/'){inBlockComment=false;i++;} }
    else if(inStr){ if(c==='\\'){i++;} else if(c===inStr) inStr=null; }
    else {
      if(c==='/' && next==='/'){ inLineComment=true; i++; }
      else if(c==='/' && next==='*'){ inBlockComment=true; i++; }
      else if(c==='"'||c==="'"||c==='`') inStr=c;
      else if(c===open) depth++;
      else if(c===close){ depth--; if(depth===0) return i; }
    }
    i++;
  }
  return -1;
}

const startIdx=m.index+m[0].length-1;
const closeIdx=findMatching(html,startIdx+1,'{','}');
if(closeIdx<0){
  console.error(`❌ ${SLUG}: unterminated LEVELS object`);
  process.exit(1);
}
const body=html.slice(startIdx,closeIdx+1);
const LEVELS=eval('('+body+')');
const keys=Object.keys(LEVELS).map(Number).sort((a,b)=>a-b);
const expected=Array.from({length:30},(_,i)=>i+1);
const missing=expected.filter(n=>!keys.includes(n));

let pass=0;
let winable=0;
let issues=[];

for(const k of keys){
  const lvl=LEVELS[k];
  pass++;
  // Check structure: hint + render fn
  if(typeof lvl.hint !== 'string'){
    issues.push(`L${k}: missing hint string`);
    continue;
  }
  if(typeof lvl.render !== 'function'){
    issues.push(`L${k}: missing render() function`);
    continue;
  }
  // Check win() reachable by scanning source text for this level
  // Find the level entry's source span by re-locating in body
  const keyRe=new RegExp('(?:^|\\n)\\s*'+k+':\\s*\\{');
  const idx=body.search(keyRe);
  if(idx<0){
    issues.push(`L${k}: source re-locate failed`);
    continue;
  }
  // Walk balanced braces
  let depth=1;
  let i=body.indexOf('{',idx)+1;
  let inS=null,inL=false,inB=false;
  while(i<body.length && depth>0){
    const c=body[i],n=body[i+1]||'';
    if(inL){ if(c==='\n') inL=false; }
    else if(inB){ if(c==='*'&&n==='/'){inB=false;i++;} }
    else if(inS){ if(c==='\\'){i++;} else if(c===inS) inS=null; }
    else {
      if(c==='/'&&n==='/'){inL=true;i++;}
      else if(c==='/'&&n==='*'){inB=true;i++;}
      else if(c==='"'||c==="'"||c==='`') inS=c;
      else if(c==='{') depth++;
      else if(c==='}') { depth--; if(depth===0) break; }
    }
    i++;
  }
  const lvlSrc=body.slice(idx,i+1);
  // win() calls: setTimeout(win,...) or direct win() / fillBlack() / showWin()
  const winCalls=(lvlSrc.match(/setTimeout\s*\(\s*win\b/g)||[]).length;
  const directWin=(lvlSrc.match(/(?:^|[^\w])win\s*\(\s*\)/g)||[]).length;
  const fillCalls=(lvlSrc.match(/\bfillBlack\s*\(/g)||[]).length;
  const showWinCalls=(lvlSrc.match(/\bshowWin\s*\(/g)||[]).length;
  if(winCalls >= 1 || directWin >= 1 || fillCalls >= 1 || showWinCalls >= 1){
    winable++;
  } else {
    issues.push(`L${k}: no reachable win() call`);
  }
}

console.log(`black: ${pass} levels loaded, ${winable}/${pass} have win paths`);
if(missing.length){
  console.error(`� Missing levels: ${missing.join(',')}`);
  process.exit(1);
}
if(issues.length){
  console.error(`❌ Issues:`);
  issues.forEach(i=>console.error(`  ${i}`));
  process.exit(1);
}

// Check engine + chrome
const checks={
  'loadLevel fn': /function loadLevel\(/.test(html),
  'fillBlack fn': /function fillBlack\(/.test(html),
  'showWin fn': /function showWin\(/.test(html),
  'saveProgress fn': /function saveProgress\(/.test(html),
  'loadProgress fn': /function loadProgress\(/.test(html),
  'monetag-manager.js': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  '<h1>': /<h1[^>]*>/.test(html),
};
const failed=Object.entries(checks).filter(([_,v])=>!v).map(([k])=>k);
if(failed.length){
  console.error(`❌ Engine/chrome missing: ${failed.join(', ')}`);
  process.exit(1);
}

console.log(`✅ ${SLUG}: ${pass}/${pass} levels have win paths, all engine + chrome present`);
process.exit(0);
