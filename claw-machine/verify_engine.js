#!/usr/bin/env node
// claw-machine independent verifier (Monte Carlo for probabilistic win path)
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

// Parse LEVELS array
const m = html.match(/var LEVELS\s*=\s*\[/);
const startIdx = m.index + m[0].length - 1;
let depth = 0, inStr = false, strCh = '', endIdx = startIdx;
for (let i = startIdx; i < html.length; i++) {
  const c = html[i];
  if (inStr) {
    if (c === '\\') { i++; continue; }
    if (c === strCh) inStr = false;
    continue;
  }
  if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
  if (c === '[') depth++;
  else if (c === ']') {
    depth--;
    if (depth === 0) { endIdx = i; break; }
  }
}
// Define PRIZES + mkPrizes stubs
const PRIZES = {
  ball: {name:'Ball',color:'#4488ff',value:10,r:18,emoji:'🔵'},
  gem: {name:'Gem',color:'#aa44ff',value:25,r:16,emoji:'🟣'},
  star: {name:'Star',color:'#ffee44',value:50,r:18,emoji:'🌟'},
  heart: {name:'Heart',color:'#ff4488',value:40,r:17,emoji:'💗'},
  crown: {name:'Crown',color:'#ffaa00',value:100,r:20,emoji:'👑'},
  gold: {name:'Gold',color:'#ffd700',value:200,r:16,emoji:'✨'}
};
function mkPrizes(types, count, opts) {
  opts = opts || {};
  if (!count) count = 12 + Math.floor(Math.random() * 6);
  const arr = [];
  for (let i = 0; i < count; i++) {
    const t = types[Math.floor(Math.random() * types.length)];
    const x = 400 + (Math.random() - 0.5) * 240;
    const y = 510 - Math.random() * 60 + (opts.stack ? i * 8 : 0);
    arr.push({type: t, x: x, y: y, r: PRIZES[t].r, value: PRIZES[t].value});
  }
  return arr;
}
const arr = html.slice(startIdx, endIdx + 1).replace(/var\s+/g, '');
const LEVELS = eval(arr);
console.log(`Parsed ${LEVELS.length} levels`);

// Monte Carlo per level: simulate attempts, each has grip% chance of catching a prize
function simulateLevel(level, n = 1000) {
  let wins = 0;
  for (let sim = 0; sim < n; sim++) {
    let collected = 0, score = 0, attempts = level.attempts;
    while (attempts > 0) {
      attempts--;
      if (Math.random() < level.grip) {
        collected++;
        score += 10; // approximate
      }
    }
    const obj = level.objective;
    let won = false;
    if (obj.type === 'count') won = collected >= obj.target;
    else if (obj.type === 'score') won = score >= obj.target;
    if (won) wins++;
  }
  return wins / n;
}

let pass = 0, marginal = 0, fail = 0;
LEVELS.forEach((level, idx) => {
  const winRate = simulateLevel(level);
  if (winRate >= 0.8) pass++;
  else if (winRate >= 0.5) marginal++;
  else fail++;
  if (winRate < 0.5) console.log(`⚠️ L${idx+1} (${level.name}): winRate=${(winRate*100).toFixed(0)}% grip=${level.grip} attempts=${level.attempts} obj=${JSON.stringify(level.objective)}`);
});
console.log(`\nResult: ${pass}/${LEVELS.length} high-win-rate (≥80%), ${marginal} marginal (50-80%), ${fail} low (<50%)`);