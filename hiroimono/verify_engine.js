#!/usr/bin/env node
'use strict';
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const data=JSON.parse(fs.readFileSync(__dirname+'/levels.json','utf8'));
const levelMatch=html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);\s*(?:const|let|var)\s+/);
if(!levelMatch) throw new Error('LEVELS declaration not found');
const embedded=JSON.parse(levelMatch[1]);
if(JSON.stringify(embedded)!==JSON.stringify(data)) throw new Error('Embedded LEVELS differ from levels.json');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
const gameScript=scripts.find(s=>s.includes('HiroimonoEngine')&&s.includes('validateRoute'));
if(!gameScript) throw new Error('game script not found');
function noop(){}
function node(){return {style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,removeEventListener:noop,appendChild:noop,remove:noop,getContext:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:600,height:600}),querySelector:()=>null,querySelectorAll:()=>[],setAttribute:noop,textContent:'',innerHTML:'',value:'',disabled:false,width:600,height:600,clientWidth:600,clientHeight:600};}
const nodes=new Proxy({}, {get(t,p){return t[p]||(t[p]=node())}});
const sandbox={console,Math,JSON,Date,Set,Map,Array,Object,String,Number,Boolean,Uint8Array,Promise,setTimeout:()=>1,clearTimeout:noop,setInterval:()=>1,clearInterval:noop,requestAnimationFrame:()=>1,cancelAnimationFrame:noop,performance:{now:()=>0},navigator:{},location:{href:'http://localhost/hiroimono/'},localStorage:{getItem:()=>null,setItem:noop},document:{hidden:false,readyState:'complete',getElementById:id=>nodes[id],querySelector:()=>null,querySelectorAll:()=>[],createElement:node,addEventListener:noop,removeEventListener:noop,body:node()},window:null,AudioContext:function(){},webkitAudioContext:function(){},Image:function(){}};
sandbox.window=sandbox;sandbox.window.addEventListener=noop;sandbox.window.removeEventListener=noop;
vm.createContext(sandbox);
let script=gameScript.replace(/const LEVELS\s*=\s*\[[\s\S]*?\];\s*(?=(?:const|let|var)\s+)/,`var LEVELS=${JSON.stringify(data)};`);
script += '\n;this.__engine = this.HiroimonoEngine;';
vm.runInContext(script,sandbox,{timeout:5000});
const engine=sandbox.__engine;
if(!engine||typeof engine.validateRoute!=='function') throw new Error('HiroimonoEngine unavailable');
let pass=0;
for(let i=0;i<data.length;i++){
 const good=engine.validateRoute(data[i],data[i].solution.map(p=>p.slice()));
 if(!good||!good.ok) throw new Error(`L${i+1} perfect route rejected: ${good&&good.reason}`);
 if(data[i].solution.length>1){const bad=data[i].solution.slice(0,-1).map(p=>p.slice());const rejected=engine.validateRoute(data[i],bad);if(rejected&&rejected.ok)throw new Error(`L${i+1} incomplete route accepted`)}
 pass++; console.log(`L${String(i+1).padStart(2,'0')}: ENGINE PASS`);
}
console.log(`IN_ENGINE: ${pass}/${data.length} PASS`);
