#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const code=scripts.find(s=>/var\s+LEVELS\s*=\s*\[/.test(s)&&/function\s+showWin/.test(s));
if(!code)throw new Error('Hop Warp production script not found');
function el(){return{textContent:'',innerHTML:'',className:'',style:{},onclick:null,classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},appendChild(){},getBoundingClientRect(){return{left:0,top:0,width:640,height:640};},getContext(){return new Proxy({canvas:{width:640,height:640}}, {get(t,p){if(p in t)return t[p];return function(){return{addColorStop(){}};};},set(){return true;}});}};}
const nodes=new Map(),store=new Map();
const document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement(){return el();},addEventListener(){},querySelectorAll(){return[];}};
const window={innerWidth:1280,innerHeight:720,addEventListener(){},AudioContext:function(){},webkitAudioContext:function(){}};
const c={console,document,window,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Math,JSON,Array,Object,String,Number,Boolean,Set,Map,Date};
window.localStorage=c.localStorage;vm.createContext(c);vm.runInContext(code,c,{filename:'hop-warp/index.inline.js',timeout:5000});
const n=vm.runInContext('LEVELS.length',c);if(n!==30)throw new Error(`expected 30 levels, got ${n}`);
let pass=0;
for(let i=0;i<n;i++){
 store.clear();nodes.clear();
 const r=vm.runInContext(`(()=>{loadLevel(${i});const before={level:S.level,warps:S.warps,stars:S.starCount,pos:[S.px,S.py]};S.stars.forEach(st=>{st.got=true;});S.gotStars=S.starCount;S.px=S.exitX;S.py=S.exitY;checkTile();showWin();const saved=JSON.parse(localStorage.getItem('hopwarp')||'{}');const winVisible=document.getElementById('modal').className==='show';nextLevel();const next=S.level;restartLevel();return{before,saved,winVisible,next,afterRestart:{level:S.level,pos:[S.px,S.py],got:S.gotStars,warps:S.warps}};})()`,c);
 const rec=r.saved.levels&&r.saved.levels[i];const expectedNext=i<n-1?i+1:i;
 const ok=r.before.level===i&&r.winVisible&&rec&&rec.rating>=2&&r.saved.lastLevel===i+1&&r.next===expectedNext&&r.afterRestart.level===expectedNext&&r.afterRestart.got===0;
 if(ok){pass++;console.log(`L${String(i+1).padStart(2,'0')} ENGINE PASS stars=${r.before.stars} rating=${rec.rating} last=${r.saved.lastLevel} next=${r.next+1}`);}else console.log(`L${String(i+1).padStart(2,'0')} ENGINE FAIL ${JSON.stringify(r)}`);
}
console.log(`\n${pass}/${n} IN-ENGINE PASS (load/win/save/next/restart)`);process.exit(pass===n?0:1);
