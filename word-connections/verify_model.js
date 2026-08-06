#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function extract(name){const marker='var '+name+' =';let p=html.indexOf(marker);if(p<0)throw Error('missing '+name);let i=html.indexOf('[',p),d=0,q=null,e=false;for(let j=i;j<html.length;j++){const c=html[j];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue;}if(c==='"'||c==="'"||c==='`')q=c;else if(c==='[')d++;else if(c===']'&&--d===0)return vm.runInNewContext('('+html.slice(i,j+1)+')');}throw Error('unterminated '+name)}
const names=['PUZZLES','EXTENDED_PUZZLES','ADDITIONAL_PUZZLES','EXPANDED_PUZZLES'];
const sets=names.map(extract),all=sets.flat(),ids=new Set(),errs=[];
for(const p of all){if(!Number.isInteger(p.id)||ids.has(p.id))errs.push('bad/duplicate id '+p.id);ids.add(p.id);if(!['easy','medium','hard','expert'].includes(p.difficulty))errs.push('difficulty '+p.id);if(!Array.isArray(p.groups)||p.groups.length!==4)errs.push('groups '+p.id);const words=[];for(const g of p.groups||[]){if(!g.category||!Array.isArray(g.words)||g.words.length!==4)errs.push('group '+p.id);words.push(...(g.words||[]));}if(new Set(words).size!==16)errs.push('duplicate words '+p.id);}
if(all.length!==70||ids.size!==70||errs.length){console.error({counts:sets.map(x=>x.length),total:all.length,errors:errs.slice(0,20)});process.exit(1)}
console.log(`word-connections: ${all.length}/70 embedded puzzles structurally valid, 16 unique words in 4 groups each`);