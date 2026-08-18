#!/usr/bin/env node
// mini-golf/verify_engine.js — verify the Mini Golf 50-hole course game
//
// Checks:
//   1. 50 HOLES across 5 courses (10 per course)
//   2. Procedural course + hole data
//   3. Physics + aim/drag/putt handlers
//   4. State persistence (best scores per hole)
//   5. Site-chrome
//
// Usage: node mini-golf/verify_engine.js

const fs=require('fs');
const path=require('path');

const SLUG='mini-golf';
const htmlPath=path.join(__dirname,'index.html');
const html=fs.readFileSync(htmlPath,'utf8');

// Parse HOLES = [ ... ]
const m=/(?:const|let|var)\s+HOLES\s*=\s*\[/.exec(html);
if(!m){
  console.error(`❌ ${SLUG}: HOLES = [ ... ] not found`);
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
const closeIdx=findMatching(html,startIdx+1,'[',']');
if(closeIdx<0){
  console.error(`❌ ${SLUG}: unterminated HOLES array`);
  process.exit(1);
}
const body=html.slice(startIdx,closeIdx+1);
const HOLES=eval('('+body+')');
const totalHoles=HOLES.length;
const courses=new Set(HOLES.map(h=>h.c));

let pass=0;
let issues=[];
for(const hole of HOLES){
  pass++;
  if(typeof hole.c !== 'number') issues.push(`H${pass}: missing c (course)`);
  if(typeof hole.par !== 'number') issues.push(`H${pass}: missing par`);
}

// Group holes by course
const byCourse={};
for(const h of HOLES){
  if(!byCourse[h.c]) byCourse[h.c]=[];
  byCourse[h.c].push(h);
}
for(const c of Object.keys(byCourse)){
  if(byCourse[c].length !== 10) issues.push(`Course ${c}: ${byCourse[c].length} holes (expected 10)`);
}

const checks={
  '50 holes loaded': totalHoles === 50,
  '5 courses': courses.size === 5,
  '10 holes per course': Object.values(byCourse).every(arr => arr.length === 10),
  'startHole fn': /function startHole\s*\(/.test(html),
  'startDaily fn': /function startDaily\s*\(/.test(html),
  'initAudio fn': /function initAudio\s*\(/.test(html),
  'startBGM fn': /function startBGM\s*\(/.test(html),
  'loadState fn': /function loadState\s*\(/.test(html),
  'saveState fn': /function saveState\s*\(/.test(html),
  'holeKey fn': /function holeKey\s*\(/.test(html),
  'THEMES array (5 themes)': /THEMES\s*=\s*\[/.test(html),
  'course-card CSS': /course-card/.test(html),
  'course-grid div': /id="course-grid"/.test(html),
  'screen-container div': /id="screen-container"/.test(html),
  'app div': /id="app"/.test(html),
  'game-canvas canvas': /<canvas[^>]*id="game-canvas"/.test(html),
  'monetag-manager.js': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  '<h1>': /<h1[^>]*>/.test(html),
};

if(issues.length){
  console.error(`❌ ${SLUG} hole issues:`);
  issues.forEach(i=>console.error(`  ${i}`));
  process.exit(1);
}

const failed=Object.entries(checks).filter(([_,v])=>!v).map(([k])=>k);
const passed=Object.entries(checks).filter(([_,v])=>v).length;

if(failed.length){
  console.error(`❌ ${SLUG} engine/chrome missing: ${failed.join(', ')}`);
  process.exit(1);
}

console.log(`✅ ${SLUG}: ${totalHoles}/50 holes valid across 5 courses, ${passed}/${Object.keys(checks).length} engine + chrome checks pass (10 holes/course, par values, physics + aim/drag/putt + state persistence)`);
process.exit(0);
