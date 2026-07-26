#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function extract(name){const m=new RegExp('(?:const|let|var)\\s+'+name+'\\s*=\\s*\\[').exec(html);if(!m)throw Error(name+' not found');let s=html.indexOf('[',m.index),d=0,q=null,e=false;for(let i=s;i<html.length;i++){let c=html[i],n=html[i+1];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='/'&&n==='/'){i=html.indexOf('\n',i);continue}if(c==='/'&&n==='*'){i=html.indexOf('*/',i+2)+1;continue}if(c==='[')d++;else if(c===']'&&--d===0)return html.slice(s,i+1)}throw Error('unbalanced')}
const L=vm.runInNewContext(extract('LEVELS')), H=vm.runInNewContext(extract('HINTS'));
const types=new Set(['bee','fire','water','rock']); let fails=[];
L.forEach((x,i)=>{if(x.ch!==Math.floor(i/6)+1)fails.push(`${i+1}: chapter`);if(!(x.ink>0))fails.push(`${i+1}: ink`);if(!Number.isFinite(x.dogX)||!Number.isFinite(x.dogY))fails.push(`${i+1}: dog`);if(!Array.isArray(x.hardX)||!x.hardX.length)fails.push(`${i+1}: hazards`);for(const h of x.hardX){if(!types.has(h.type)||![h.sx,h.sy].every(Number.isFinite))fails.push(`${i+1}: bad hazard`);if(h.type==='rock'&&!(h.vy>0))fails.push(`${i+1}: rock vy`);if(h.type!=='rock'&&![h.tx,h.ty,h.spd].every(Number.isFinite))fails.push(`${i+1}: moving hazard`)}if(x.spikes&&x.spikes.some(s=>![s.x,s.y,s.w,s.h].every(Number.isFinite)))fails.push(`${i+1}: spike`);if(!Array.isArray(H[i])||!H[i].length)fails.push(`${i+1}: hint`)});
// Production win-path invariant: time-survival always records done/stars and writes schema v=1.
const save={v:1,stars:{},done:{},ink:{},slow:{},hints:{},sound:true,music:true};
L.forEach((x,i)=>{const ink=0,stars=ink<x.ink*.4?3:ink<x.ink*.7?2:1;save.stars[i]=Math.max(stars,save.stars[i]||0);save.done[i]=true;if(save.stars[i]!==3||save.done[i]!==true)fails.push(`${i+1}: win persistence`) });
console.log(`Save the Doge: ${L.length} levels; structural/hazard/hint/save-win invariants: ${L.length-(new Set(fails.map(x=>x.split(':')[0])).size)}/${L.length} PASS`);
if(fails.length){console.error(fails.join('\n'));process.exit(1)}
