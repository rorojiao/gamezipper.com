#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const code=scripts.find(s=>/const\s+LEVELS\s*=\s*\[/.test(s)&&/function\s+checkSolution/.test(s));
if(!code)throw new Error('Nurimeizu production script not found');
function el(){return{textContent:'',innerHTML:'',className:'',style:{},onclick:null,classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},appendChild(){},querySelector(){return null;},querySelectorAll(){return[];},getBoundingClientRect(){return{left:0,top:0,width:500,height:500};},getContext(){return new Proxy({canvas:{width:500,height:500}}, {get(t,p){if(p in t)return t[p];return function(){return{addColorStop(){}};};},set(){return true;}});}};}
const nodes=new Map(),store=new Map();
const document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement(){return el();},addEventListener(){},body:el(),querySelectorAll(){return[];}};
const window={innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){},AudioContext:function(){},webkitAudioContext:function(){}};
const c={console,document,window,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Math,JSON,Array,Object,String,Number,Boolean,Set,Map,Date};window.localStorage=c.localStorage;
vm.createContext(c);vm.runInContext(code,c,{filename:'nurimeizu/index.inline.js',timeout:5000});
const n=vm.runInContext('LEVELS.length',c);if(n!==30)throw new Error(`expected 30 levels, got ${n}`);
let pass=0;
for(let i=0;i<n;i++){
 store.clear();nodes.clear();
 const r=vm.runInContext(`(()=>{loadLevel(${i});const lv=LEVELS[${i}];for(let rid=0;rid<lv.rooms.length;rid++)userPaint[rid]=lv.solution.includes(rid)?'black':'white';const ok=checkSolution(false);const saved=JSON.parse(localStorage.getItem('nurimeizu_progress')||'{}');const modal=document.getElementById('win-overlay').classList.contains('show')||document.getElementById('win-overlay').style.display==='flex';loadLevel(${i});return{ok,saved,modal,restart:{level:currentLevel,paint:Object.keys(userPaint).length,hints:hintsUsed}};})()`,c);
 const rec=r.saved['L'+(i+1)];const ok=r.ok===true&&rec&&rec.completed===true&&r.restart.level===i&&r.restart.paint===0&&r.restart.hints===0;
 if(ok){pass++;console.log(`L${String(i+1).padStart(2,'0')} ENGINE PASS stars=${rec.stars}`);}else console.log(`L${String(i+1).padStart(2,'0')} ENGINE FAIL ${JSON.stringify(r)}`);
}
console.log(`\n${pass}/${n} IN-ENGINE PASS (solution injection + checkSolution + save/restart)`);process.exit(pass===n?0:1);
