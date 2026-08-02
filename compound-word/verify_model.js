#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
function fail(message) { console.error('FAIL:', message); process.exit(1); }
function balancedArray(name) {
  const mark=html.search(new RegExp('(?:const|let|var)\\s+'+name+'\\s*=\\s*\\[')); if(mark<0)fail(`Missing ${name}.`);
  const start=html.indexOf('[',mark);let depth=0,quote='',esc=false;
  for(let i=start;i<html.length;i++){const ch=html[i];if(quote){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch===quote)quote='';continue}if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}if(ch==='[')depth++;else if(ch===']'&&--depth===0)return html.slice(start,i+1)}fail(`Unbalanced ${name}.`);
}
const puzzles=vm.runInNewContext(balancedArray('PUZZLES'));if(puzzles.length!==180)fail(`Expected 180 puzzles, got ${puzzles.length}.`);
const categories=new Map(),keys=new Set();for(const [i,p] of puzzles.entries()){for(const k of ['left','bridge','right','cat','hint'])if(typeof p[k]!=='string'||!p[k])fail(`Puzzle ${i+1} missing ${k}.`);if(!/^[A-Z]+$/.test(p.left+p.bridge+p.right))fail(`Puzzle ${i+1} contains non-letter data.`);const key=`${p.left}|${p.bridge}|${p.right}`;if(keys.has(key))fail(`Duplicate puzzle key ${key}.`);keys.add(key);categories.set(p.cat,(categories.get(p.cat)||0)+1)}if(categories.size!==18||[...categories.values()].some(n=>n!==10))fail('Expected 18 categories with 10 puzzles each.');
for(const token of ['version: SAVE_VERSION','state.tutorialDone = true','markSolved(puzzle)','saveState();','cancelAnimationFrame(animFrame)','clearInterval(puzzleTimer)','gz-ad-below-game','monetag-manager.js','game-footer.js'])if(!html.includes(token))fail(`Missing production path: ${token}`);if(html.includes('aggregateRating'))fail('Structured data contains an aggregate rating.');
console.log('Compound Word: 180/180 puzzles structurally valid and unique; 18x10 categories plus solve/save/tutorial/cleanup paths verified.');