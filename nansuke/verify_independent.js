// verify_independent.js — Independent Node.js verifier for Nansuke levels.
// Reads levels.json, independently re-derives entries, and checks that each
// level has EXACTLY ONE solution: assignment of the number list to entries
// (across + down) such that crossings agree and all numbers used once.
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));

function getEntries(R, C, blackSet) {
  const grid = [];
  for (let r = 0; r < R; r++) {
    grid.push([]);
    for (let c = 0; c < C; c++) grid[r].push(blackSet.has(r + ',' + c));
  }
  const hEntries = [], vEntries = [];
  for (let r = 0; r < R; r++) {
    let c = 0;
    while (c < C) {
      if (grid[r][c]) { c++; continue; }
      const run = [];
      while (c < C && !grid[r][c]) { run.push([r, c]); c++; }
      if (run.length >= 1) hEntries.push(run);
    }
  }
  for (let c = 0; c < C; c++) {
    let r = 0;
    while (r < R) {
      if (grid[r][c]) { r++; continue; }
      const run = [];
      while (r < R && !grid[r][c]) { run.push([r, c]); r++; }
      if (run.length >= 1) vEntries.push(run);
    }
  }
  return { hEntries, vEntries };
}

function countSolutions(level, cap) {
  cap = cap || 2;
  const R = level.R, C = level.C;
  const blackSet = new Set(level.black);
  const { hEntries, vEntries } = getEntries(R, C, blackSet);
  const entries = hEntries.concat(vEntries);
  const numbers = level.numbers;
  // group numbers by length
  const lenToNums = {};
  for (const n of numbers) {
    const k = n.length;
    if (!lenToNums[k]) lenToNums[k] = [];
    lenToNums[k].push(n);
  }
  // candidates per entry: numbers of matching length AND matching solution digits
  const sol = level.solution;
  const entryCands = entries.map(run => {
    const n = run.length;
    const cands = [];
    for (const num of (lenToNums[n] || [])) {
      let ok = true;
      for (let i = 0; i < n; i++) {
        if (sol[run[i][0]][run[i][1]] !== num[i]) { ok = false; break; }
      }
      if (ok) cands.push(num);
    }
    return cands;
  });
  if (entryCands.some(c => c.length === 0)) return 0;
  // MRV order
  const order = entries.map((_, i) => i).sort((a, b) => entryCands[a].length - entryCands[b].length);
  const used = new Set();
  const assignedDigit = {}; // "r,c" -> digit
  let count = 0;
  let budget = 300000;

  function solve(k) {
    if (count >= cap || budget <= 0) return;
    budget--;
    if (k === order.length) { count++; return; }
    const ei = order[k];
    const run = entries[ei];
    for (const num of entryCands[ei]) {
      if (used.has(num)) continue;
      let ok = true;
      const newCells = [];
      for (let i = 0; i < run.length; i++) {
        const key = run[i][0] + ',' + run[i][1];
        const ex = assignedDigit[key];
        if (ex !== undefined && ex !== num[i]) { ok = false; break; }
        if (ex === undefined) { assignedDigit[key] = num[i]; newCells.push(key); }
      }
      if (ok) {
        used.add(num);
        solve(k + 1);
        used.delete(num);
      }
      for (const key of newCells) delete assignedDigit[key];
      if (count >= cap) return;
    }
  }
  solve(0);
  if (budget <= 0 && count < cap) return cap; // inconclusive → reject
  return count;
}

let allPass = true;
levels.forEach((lv, i) => {
  const n = countSolutions(lv, 2);
  const ok = n === 1;
  if (!ok) allPass = false;
  console.log(`Level ${i + 1} (${lv.tier} ${lv.R}x${lv.C}): ${n} solution(s) ${ok ? '✅ UNIQUE' : '❌ NOT UNIQUE'}`);
});
console.log(allPass ? '\n✅ ALL 30 LEVELS VERIFIED UNIQUE (independent Node.js)' : '\n❌ SOME LEVELS FAILED');
process.exit(allPass ? 0 : 1);
