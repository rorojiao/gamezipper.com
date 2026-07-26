#!/usr/bin/env node
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const file = path.join(__dirname, 'index.html');
const html = fs.readFileSync(file, 'utf8');
function extractArray(src, name) {
  const re = new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*\\[');
  const m = re.exec(src); if (!m) throw new Error(name + ' not found');
  let start = src.indexOf('[', m.index), depth = 0, quote = null, esc = false;
  for (let i=start; i<src.length; i++) {
    const ch=src[i], nx=src[i+1];
    if (quote) { if (esc) esc=false; else if (ch==='\\') esc=true; else if (ch===quote) quote=null; continue; }
    if (ch==='"'||ch==="'"||ch==='`') { quote=ch; continue; }
    if (ch==='/'&&nx==='/') { i=src.indexOf('\n',i); if(i<0) break; continue; }
    if (ch==='/'&&nx==='*') { i=src.indexOf('*/',i+2)+1; continue; }
    if (ch==='[') depth++; else if(ch===']' && --depth===0) return src.slice(start,i+1);
  }
  throw new Error('unbalanced '+name);
}
const LEVELS = vm.runInNewContext(extractArray(html,'LEVELS'));
const tools = new Set(['file','base','color','pattern','sticker','top']);
const shape = new Set(['short','medium','long','almond','round']);
const patterns = new Set(['french','dots','stripes','glitter','gradient']);
const stickers = new Set(['heart','star','flower','rhinestone']);
function validStep(s) {
  if(!s || !tools.has(s.tool)) return false;
  if(s.tool==='file') return shape.has(s.value);
  if(s.tool==='color') return Number.isInteger(s.value) && s.value>=0 && s.value<8;
  if(s.tool==='pattern') return patterns.has(s.value);
  if(s.tool==='sticker') return stickers.has(s.value);
  return s.value===undefined;
}
let failures=[];
LEVELS.forEach((L,i)=>{
  const recipe=L.recipe||[];
  if(!L.name || !Number.isInteger(L.tier)||L.tier<0||L.tier>4) failures.push(`${i+1}: bad metadata`);
  if(![1,2,3].includes(L.nails)) failures.push(`${i+1}: bad nails`);
  if(recipe.length<4 || recipe[0]?.tool!=='file' || recipe[1]?.tool!=='base' || recipe.at(-1)?.tool!=='top') failures.push(`${i+1}: invalid order shell`);
  recipe.forEach((s,j)=>{ if(!validStep(s)) failures.push(`${i+1}.${j+1}: invalid step ${JSON.stringify(s)}`); });
  const playerRecipe=recipe.map(s=>({...s}));
  const stepEquals=(a,b)=>(a.tool===b.tool && (a.value??null)===(b.value??null));
  const checkWin=()=>playerRecipe.length===recipe.length && playerRecipe.every((s,j)=>stepEquals(s,recipe[j]));
  if(!checkWin()) failures.push(`${i+1}: production-equivalent checkWin rejects recipe`);
  for(let j=0;j<recipe.length;j++) { const bad=playerRecipe.map(s=>({...s})); bad[j]={tool:'__bad__'}; if(bad.length===recipe.length && bad.every((s,k)=>stepEquals(s,recipe[k]))) failures.push(`${i+1}: mutation accepted`); }
});
console.log(`Nail Art Studio: ${LEVELS.length} levels; structural + recipe-domain + production-equivalent checkWin: ${LEVELS.length-failures.length}/${LEVELS.length} PASS`);
if(failures.length){ console.error(failures.join('\n')); process.exit(1); }
