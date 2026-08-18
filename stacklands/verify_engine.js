#!/usr/bin/env node
// stacklands/verify_engine.js — verify the Stacklands card-stacking village builder
//
// Checks:
//   1. 30 LEVELS across 5 chapters
//   2. Engine state + recipe system (getRecipe, craftCards)
//   3. Card production system (producing class, prodProgress)
//   4. Level select with .level-cell elements
//   5. Objectives + HUD (timer, score, level)
//   6. Site-chrome
//
// Usage: node stacklands/verify_engine.js

const fs=require('fs');
const path=require('path');

const SLUG='stacklands';
const htmlPath=path.join(__dirname,'index.html');
const html=fs.readFileSync(htmlPath,'utf8');

// Parse LEVELS = [ ... ] using balanced-bracket scanner
const m=/(?:const|let|var)\s+LEVELS\s*=\s*\[/.exec(html);
if(!m){
  console.error(`❌ ${SLUG}: LEVELS = [ ... ] not found`);
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
  console.error(`❌ ${SLUG}: unterminated LEVELS array`);
  process.exit(1);
}
const body=html.slice(startIdx,closeIdx+1);
const LEVELS=eval('('+body+')');
const totalLevels=LEVELS.length;
const chapters=new Set(LEVELS.map(l=>l.ch));

let pass=0;
let issues=[];
for(const lvl of LEVELS){
  pass++;
  if(typeof lvl.n !== 'number') issues.push(`L${pass}: missing n`);
  if(typeof lvl.ch !== 'number') issues.push(`L${pass}: missing ch`);
  if(typeof lvl.name !== 'string') issues.push(`L${pass}: missing name`);
  if(!Array.isArray(lvl.board)) issues.push(`L${pass}: missing board`);
  if(!Array.isArray(lvl.objs)) issues.push(`L${pass}: missing objs`);
  if(typeof lvl.hint !== 'string') issues.push(`L${pass}: missing hint`);
}

const checks={
  '30 levels loaded': totalLevels === 30,
  '5 chapters': chapters.size === 5,
  'getRecipe fn': /function getRecipe\s*\(/.test(html),
  'craftCards fn': /function craftCards\s*\(/.test(html),
  'renderBoard fn': /function renderBoard\s*\(/.test(html),
  'onCardClick fn': /function onCardClick\s*\(/.test(html),
  'saveProgress fn': /function saveProgress\s*\(/.test(html),
  'loadSave fn': /function loadSave\s*\(/.test(html),
  'startLevel fn': /function startLevel\s*\(/.test(html),
  'initTitle fn': /function initTitle\s*\(/.test(html),
  'initLevelSelect fn': /function initLevelSelect\s*\(/.test(html),
  'RECIPES object': /var RECIPES|const RECIPES|let RECIPES/.test(html),
  'CARDS object': /var CARDS|const CARDS|let CARDS/.test(html),
  'card.selected CSS': /\.card\.selected/.test(html),
  'card.producing CSS': /\.card\.producing/.test(html),
  'level-cell class': /level-cell/.test(html),
  'chapterList div': /id="chapterList"/.test(html),
  'hudLevel div': /id="hudLevel"/.test(html),
  'hudScore div': /id="hudScore"/.test(html),
  'hudTimer div': /id="hudTimer"/.test(html),
  'objectives div': /id="objectives"/.test(html),
  'hintBar div': /id="hintBar"/.test(html),
  'modalOverlay div': /id="modalOverlay"/.test(html),
  'modalContent div': /id="modalContent"/.test(html),
  'titleScreen div': /id="titleScreen"/.test(html),
  'levelSelectScreen div': /id="levelSelectScreen"/.test(html),
  'gameScreen div': /id="gameScreen"/.test(html),
  'bgCanvas canvas': /<canvas[^>]*id="bgCanvas"/.test(html),
  'monetag-manager.js': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  '<h1>': /<h1[^>]*>/.test(html),
};

if(issues.length){
  console.error(`❌ ${SLUG} level issues:`);
  issues.forEach(i=>console.error(`  ${i}`));
  process.exit(1);
}

const failed=Object.entries(checks).filter(([_,v])=>!v).map(([k])=>k);
const passed=Object.entries(checks).filter(([_,v])=>v).length;

if(failed.length){
  console.error(`❌ ${SLUG} engine/chrome missing: ${failed.join(', ')}`);
  process.exit(1);
}

console.log(`✅ ${SLUG}: ${totalLevels}/30 levels valid, ${passed}/${Object.keys(checks).length} engine + chrome checks pass (5 chapters, recipe system, production, level select + objectives + HUD)`);
process.exit(0);
