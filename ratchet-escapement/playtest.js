// Playtest Level 1 and Level 26 using exact game logic
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/ratchet-escapement/index.html','utf8');
const m = html.match(/var LEVELS=(\[[\s\S]*?\]);/);
const LEVELS = eval(m[1]);

function makeGame(lvl) {
  return { lvl: lvl, pos: 0, masks: new Array(lvl.p.length).fill(true), moves: 0, won: false };
}
function doAdvance(g) { g.pos = (g.pos + 1) % g.lvl.t; g.moves++; }
function doRetract(g) {
  const pi = g.lvl.p.indexOf(g.pos);
  if (pi >= 0 && g.masks[pi]) return false;
  g.pos = (g.pos - 1 + g.lvl.t) % g.lvl.t; g.moves++; return true;
}
function doToggle(g) {
  const pi = g.lvl.p.indexOf(g.pos);
  if (pi < 0) return false;
  g.masks[pi] = !g.masks[pi]; g.moves++; return true;
}
function isWin(g) { return g.pos === g.lvl.g; }

function solve(lvl) {
  const nT = lvl.t, pawls = lvl.p, nPawls = pawls.length;
  const posToIdx = {};
  for (let i = 0; i < nPawls; i++) posToIdx[pawls[i]] = i;
  const initMask = (1 << nPawls) - 1;
  const start = '0,' + initMask;
  const goal = lvl.g;
  if (goal === 0) return [];
  const prev = new Map();
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const s = queue.shift();
    const parts = s.split(',');
    const pos = +parts[0], mask = +parts[1];
    const npos1 = (pos + 1) % nT;
    const ns1 = npos1 + ',' + mask;
    if (!visited.has(ns1)) {
      visited.add(ns1); prev.set(ns1, [s, 'advance']);
      if (npos1 === goal) { const path=[]; let cur=ns1; while(prev.has(cur)){const [p,a]=prev.get(cur);path.unshift(a);cur=p;} return path; }
      queue.push(ns1);
    }
    const pi = posToIdx[pos];
    let blocked = false;
    if (pi !== undefined && (mask & (1 << pi))) blocked = true;
    if (!blocked) {
      const npos2 = (pos - 1 + nT) % nT;
      const ns2 = npos2 + ',' + mask;
      if (!visited.has(ns2)) {
        visited.add(ns2); prev.set(ns2, [s, 'retract']);
        if (npos2 === goal) { const path=[]; let cur=ns2; while(prev.has(cur)){const [p,a]=prev.get(cur);path.unshift(a);cur=p;} return path; }
        queue.push(ns2);
      }
    }
    if (pi !== undefined) {
      const nmask = mask ^ (1 << pi);
      const ns3 = pos + ',' + nmask;
      if (!visited.has(ns3)) { visited.add(ns3); prev.set(ns3, [s, 'toggle']); queue.push(ns3); }
    }
  }
  return null;
}

console.log('=== Level 1 ===');
let g1 = makeGame(LEVELS[0]);
let sol1 = solve(LEVELS[0]);
console.log('Solution:', sol1.join(' -> '));
for (const move of sol1) {
  if (move === 'advance') doAdvance(g1);
  else if (move === 'retract') { const ok = doRetract(g1); if (!ok) console.log('BLOCKED!'); }
  else if (move === 'toggle') doToggle(g1);
}
console.log('Final pos:', g1.pos, 'Goal:', g1.lvl.g, 'Moves:', g1.moves, 'Par:', g1.lvl.par);
console.log('Won:', isWin(g1), '| Stars:', g1.moves === g1.lvl.par ? 3 : (g1.moves <= Math.ceil(g1.lvl.par*1.5) ? 2 : 1));

console.log('\n=== Level 26 (Tier 6) ===');
let g26 = makeGame(LEVELS[25]);
let sol26 = solve(LEVELS[25]);
console.log('Teeth:', g26.lvl.t, 'Pawls:', g26.lvl.p.length, 'Goal:', g26.lvl.g, 'Par:', g26.lvl.par);
console.log('Solution:', sol26.join(' -> '));
for (const move of sol26) {
  if (move === 'advance') doAdvance(g26);
  else if (move === 'retract') { const ok = doRetract(g26); if (!ok) console.log('BLOCKED!'); }
  else if (move === 'toggle') doToggle(g26);
}
console.log('Final pos:', g26.pos, 'Goal:', g26.lvl.g, 'Moves:', g26.moves, 'Par:', g26.lvl.par);
console.log('Won:', isWin(g26), '| Stars:', g26.moves === g26.lvl.par ? 3 : (g26.moves <= Math.ceil(g26.lvl.par*1.5) ? 2 : 1));

// Also verify retract-block works as expected: try illegal retract
console.log('\n=== Retract-block test ===');
let gT = makeGame(LEVELS[0]);
// L1: teeth=6, pawls=[1,5], start pos=0
// No pawl at pos 0, so retract should work
let r1 = doRetract(gT);
console.log('Retract from pos 0 (no pawl):', r1 ? 'allowed, pos='+gT.pos : 'blocked');
// advance to pos 1 (pawl at 1 is DOWN)
doAdvance(gT); doAdvance(gT); // pos = 1
console.log('At pos', gT.pos, 'pawl state:', gT.masks);
let r2 = doRetract(gT);
console.log('Retract from pos 1 (pawl DOWN):', r2 ? 'allowed' : 'BLOCKED (correct)');
doToggle(gT); // toggle pawl at pos 1 UP
console.log('After toggle, pawl state:', gT.masks);
let r3 = doRetract(gT);
console.log('Retract from pos 1 (pawl UP):', r3 ? 'allowed, pos='+gT.pos : 'blocked');
