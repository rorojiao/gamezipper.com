#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function extract(name){const m=new RegExp('(?:const|let|var)\\s+'+name+'\\s*=\\s*\\[').exec(html);if(!m)throw Error(name+' not found');let s=html.indexOf('[',m.index),d=0,q=null,e=false;for(let i=s;i<html.length;i++){let c=html[i],n=html[i+1];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='/'&&n==='/'){i=html.indexOf('\n',i);continue}if(c==='/'&&n==='*'){i=html.indexOf('*/',i+2)+1;continue}if(c==='[')d++;else if(c===']'&&--d===0)return html.slice(s,i+1)}throw Error('unbalanced')}
const L=vm.runInNewContext(extract('LEVELS'));let fails=[];
L.forEach((x,i)=>{if(!Number.isInteger(x.grid)||x.grid<20||x.grid>40)fails.push(`${i+1}: grid`);if(!Number.isInteger(x.ai)||x.ai<2||x.ai>7)fails.push(`${i+1}: ai`);if(!Number.isInteger(x.aiType)||x.aiType<0||x.aiType>4)fails.push(`${i+1}: aiType`);if(!(x.target>0&&x.target<100))fails.push(`${i+1}: target`);if(!x.diffName)fails.push(`${i+1}: diff`);if(i<25&&x.timed)fails.push(`${i+1}: unexpected timed`);if(i>=25&&(!x.timed||x.timeLimit!==90))fails.push(`${i+1}: endless timer`)});
// Production completeLevel/save invariant for every level.
L.forEach((x,i)=>{let save={v:1,best:0,unlocked:i+1,skin:0,tutorial:true};let pct=x.target+10;let stars=pct>=x.target+10?3:pct>=x.target+5?2:1;if(i+1>=save.unlocked&&i+1<L.length)save.unlocked=i+2;if(stars!==3||save.unlocked!==Math.min(i+2,L.length))fails.push(`${i+1}: completion invariant`)});
console.log(`Paper.io: ${L.length} levels; config bounds + production completion/save invariants: ${L.length-(new Set(fails.map(x=>x.split(':')[0])).size)}/${L.length} PASS`);
if(fails.length){console.error(fails.join('\n'));process.exit(1)}
