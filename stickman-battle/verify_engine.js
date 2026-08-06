#!/usr/bin/env node
'use strict';

const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const main=[...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('function stickman(')&&s.includes('function endLevel'));
if(!main)throw new Error('main engine not found');
function noop(){};
const els=new Map();function el(id){if(!els.has(id))els.set(id,{id,style:{},className:'',textContent:'',classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,querySelector:()=>el('child'),querySelectorAll:()=>[]});return els.get(id)}
const canvas=el('game-canvas');Object.assign(canvas,{width:800,height:500,getContext:()=>new Proxy({},{get:()=>noop}),getBoundingClientRect:()=>({left:0,top:0,width:800,height:500})});
const storage=new Map();let nextTimer=1;const ctx=vm.createContext({console,Math,Date,JSON,Array,Object,Set,Map,Number,String,Boolean,performance:{now:()=>100},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},document:{getElementById:el,querySelector:()=>el('query'),querySelectorAll:()=>[],addEventListener:noop,documentElement:{scrollWidth:800}},window:{addEventListener:noop,innerWidth:800,innerHeight:500,AudioContext:function(){}},setTimeout:fn=>{if(fn)fn();return nextTimer++},clearTimeout:noop,setInterval:()=>nextTimer++,clearInterval:noop,requestAnimationFrame:()=>1,cancelAnimationFrame:noop});ctx.window.window=ctx.window;ctx.window.document=ctx.document;const instrumented=main.replace(/\}\)\(\);\s*$/,`window.__qa={startGame:startGame,endLevel:endLevel,nextLevel:nextLevel,getState:function(){return {state:state,currentLevel:currentLevel,score:score,player:player,enemy:enemy}}};})();`);
vm.runInContext(instrumented,ctx,{timeout:5000});
const result=JSON.parse(vm.runInContext(`(function(){
 var q=window.__qa;
 localStorage.removeItem('stickmanBattle_save');q.startGame();
 var s=q.getState(),initial={level:s.currentLevel,score:s.score};
 s.player.health=s.player.maxHealth;s.enemy.health=0;q.endLevel(true);
 var savedAfterWin=JSON.parse(localStorage.getItem('stickmanBattle_save'));
 var stars=document.getElementById('end-stars').textContent;
 q.nextLevel();s=q.getState();
 var afterContinue={level:s.currentLevel,score:s.score};
 s.player.health=0;q.endLevel(false);
 var savedAfterDefeat=JSON.parse(localStorage.getItem('stickmanBattle_save'));
 return JSON.stringify({initial:initial,savedAfterWin:savedAfterWin,stars:stars,afterContinue:afterContinue,savedAfterDefeat:savedAfterDefeat,
 pass:savedAfterWin.level===2&&afterContinue.level===2&&stars==='★★★'&&savedAfterDefeat.level===2});
})()`,ctx));
console.log(JSON.stringify(result,null,2));if(!result.pass)process.exit(1);
