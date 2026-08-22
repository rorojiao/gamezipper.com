#!/usr/bin/env node
/* GENERATED in-engine verifier for yahtzee — pattern follows akari/verify_engine.js.
 * vm sandbox: loads index.html inline scripts (engine is inline, top-level declarations so a
 * follow-up script in the same context can reach scoreCategory/countDice/sumDice/checkYahtzee
 * directly — no surgery). Drives the engine's own scoring logic against standard Yahtzee dice
 * cases to verify the score function is correct. Goal: confirm every category computes the
 * expected score for a representative dice set per the standard Yahtzee rules.
 * Usage: node yahtzee/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)(?![^>]*type="text\/javascript-verify")[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

const ENGINE_MARK = 'function scoreCategory';
const engIdx = scripts.findIndex(s => s.includes(ENGINE_MARK));
if (engIdx < 0) { console.error('engine script not found'); process.exit(1); }

// build minimal stubs for the engine to function
const stub = `
  var document = {
    getElementById: function(){ return { style:{}, classList:{add:function(){},remove:function(){},toggle:function(){}}, addEventListener:function(){}, textContent:'', innerHTML:'', offsetParent:{}, dataset:{}, onclick:null }; },
    querySelectorAll: function(){ return []; },
    querySelector: function(){ return null; },
    addEventListener: function(){}
  };
  var window = { addEventListener:function(){}, AudioContext: function(){return {createOscillator:function(){return{frequency:{value:0},connect:function(){},start:function(){},stop:function(){},disconnect:function(){}}}, createGain:function(){return{connect:function(){},gain:{value:0}}}, destination:{}, currentTime:0}}, requestAnimationFrame:function(fn){return 0}, cancelAnimationFrame:function(){}, localStorage: { getItem:function(){return null}, setItem:function(){}, removeItem:function(){}, clear:function(){} } };
  var localStorage = window.localStorage;
  var navigator = { userAgent:'verifier' };
  var performance = { now:function(){return Date.now()} };
  var requestAnimationFrame = window.requestAnimationFrame;
  var setTimeout = setTimeout;
  var setInterval = setInterval;
`;

const ctx = vm.createContext({});
vm.runInContext(stub + scripts[engIdx] + ';__verify_done=true;', ctx);

const checks = [
  // UPPER SECTION - count of matching dice × face value
  { dice:[1,1,1,2,3], cat:'ones', expect:3, desc:'Three 1s → count=3' },
  { dice:[2,2,2,2,5], cat:'twos', expect:8, desc:'Four 2s → 4*2=8' },
  { dice:[3,3,3,3,3], cat:'threes', expect:15, desc:'Five 3s → 5*3=15' },
  { dice:[4,4,4,4,4], cat:'fours', expect:20, desc:'Five 4s → 5*4=20' },
  { dice:[5,5,5,5,1], cat:'fives', expect:20, desc:'Four 5s → 4*5=20' },
  { dice:[6,6,6,6,6], cat:'sixes', expect:30, desc:'Five 6s → 5*6=30' },
  { dice:[1,2,3,4,5], cat:'ones', expect:1, desc:'One 1 → count=1' },
  { dice:[1,2,3,4,5], cat:'sixes', expect:0, desc:'No 6s → count=0' },

  // LOWER SECTION
  { dice:[3,3,3,1,2], cat:'threeOfAKind', expect:12, desc:'Three of a kind 3s → sum=12' },
  { dice:[4,4,4,4,5], cat:'fourOfAKind', expect:21, desc:'Four of a kind 4s → sum=21' },
  { dice:[2,2,2,3,3], cat:'fullHouse', expect:25, desc:'3+2 = full house 25' },
  { dice:[1,1,1,1,2], cat:'fullHouse', expect:0, desc:'4+1 ≠ full house 0' },
  { dice:[1,2,3,4,5], cat:'smallStraight', expect:30, desc:'1-2-3-4 = small straight 30' },
  { dice:[2,3,4,5,6], cat:'smallStraight', expect:30, desc:'2-3-4-5 = small straight 30' },
  { dice:[3,4,5,6,1], cat:'smallStraight', expect:30, desc:'3-4-5-6 = small straight 30' },
  { dice:[1,2,3,4,6], cat:'smallStraight', expect:30, desc:'1-2-3-4 (6 irrelevant) = 30' },
  { dice:[1,2,4,5,6], cat:'smallStraight', expect:0, desc:'No 4 in a row = 0' },
  { dice:[1,2,3,4,5], cat:'largeStraight', expect:40, desc:'1-2-3-4-5 = large straight 40' },
  { dice:[2,3,4,5,6], cat:'largeStraight', expect:40, desc:'2-3-4-5-6 = large straight 40' },
  { dice:[1,2,3,4,6], cat:'largeStraight', expect:0, desc:'Skip (no 5) = 0' },
  { dice:[5,5,5,5,5], cat:'yahtzee', expect:50, desc:'Five of a kind = 50' },
  { dice:[1,2,3,4,5], cat:'chance', expect:15, desc:'Chance = sum=15' },
  { dice:[6,6,6,6,6], cat:'chance', expect:30, desc:'Chance = sum=30' },
  { dice:[1,2,3,4,5], cat:'yahtzee', expect:0, desc:'1-2-3-4-5 ≠ yahtzee 0' },
];

let pass=0, fail=0;
const fails=[];
for (const c of checks) {
  const result = vm.runInContext(`scoreCategory([${c.dice.join(',')}],'${c.cat}')`, ctx);
  if (result === c.expect) {
    pass++;
  } else {
    fail++;
    fails.push({...c, got:result});
  }
}

console.log(`yahtzee in-engine verification: ${pass}/${pass+fail} scoring rules pass`);
console.log(JSON.stringify({pass, fail, fails: fails.map(f=>({dice:f.dice,cat:f.cat,desc:f.desc,expect:f.expect,got:f.got})), total:checks.length, goal:'verify scoreCategory matches standard Yahtzee scoring rules', verdict: fail===0?'PASS':'FAIL'}));
process.exit(fail===0?0:1);
