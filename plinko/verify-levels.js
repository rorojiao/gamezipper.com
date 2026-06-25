const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf-8');
const match = content.match(/var LEVELS=\[(.*?)\];/s);
if (!match) {
  console.log('FAIL: No LEVELS found');
  process.exit(1);
}

// Convert shorthand JS object to JSON
const jsCode = '[' + match[1] + ']';
const jsonCode = jsCode
  .replace(/(\w+):/g, '"$1":')
  .replace(/'/g, '"');

const levels = JSON.parse(jsonCode);

console.log(`Validating ${levels.length} levels...\n`);

let allPass = true;
let issues = [];

levels.forEach((lvl, i) => {
  const idx = i + 1;
  const issuesInLvl = [];
  
  if (!lvl.r || typeof lvl.r !== 'number') issuesInLvl.push('missing r');
  if (!lvl.c || typeof lvl.c !== 'number') issuesInLvl.push('missing c');
  if (!lvl.b || typeof lvl.b !== 'number') issuesInLvl.push('missing b');
  if (!lvl.t || typeof lvl.t !== 'number') issuesInLvl.push('missing t');
  if (!lvl.m || !Array.isArray(lvl.m)) issuesInLvl.push('missing m');
  
  if (lvl.r < 3 || lvl.r > 25) issuesInLvl.push(`r=${lvl.r} invalid`);
  if (lvl.c < 3 || lvl.c > 25) issuesInLvl.push(`c=${lvl.c} invalid`);
  if (lvl.b < 1 || lvl.b > 10) issuesInLvl.push(`b=${lvl.b} invalid`);
  if (lvl.t < 10 || lvl.t > 100000) issuesInLvl.push(`t=${lvl.t} invalid`);
  
  if (lvl.m.length < 5 || lvl.m.length > 25) {
    issuesInLvl.push(`m.length=${lvl.m.length} invalid`);
  }
  
  const maxSlot = Math.max(...lvl.m);
  const theoreticalMax = maxSlot * lvl.b;
  if (theoreticalMax > 0) {
    const ratio = lvl.t / theoreticalMax;
    if (ratio > 0.9) issuesInLvl.push(`target too hard (${ratio.toFixed(2)})`);
    else if (ratio < 0.05) issuesInLvl.push(`target too easy (${ratio.toFixed(2)})`);
  }
  
  if (issuesInLvl.length > 0) {
    allPass = false;
    issues.push(`L${idx}: ${issuesInLvl.join(', ')}`);
  }
});

if (allPass) {
  console.log('✓ All 30 levels validated\n');
  console.log('Difficulty progression:');
  [0,5,10,15,20,25,29].forEach(i => {
    const l = levels[i];
    console.log(`  L${i+1}: pegs=${l.r}x${l.c}, balls=${l.b}, target=${l.t}`);
  });
  process.exit(0);
} else {
  console.log('✗ Failed:\n');
  issues.forEach(i => console.log(`  ${i}`));
  process.exit(1);
}
