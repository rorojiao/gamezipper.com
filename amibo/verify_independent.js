// Independent Node.js BFS verifier for Amibo levels
// Verifies level solutions WITHOUT loading the game engine
const fs = require('fs');
const vm = require('vm');

const levelsRaw = fs.readFileSync(__dirname + '/levels_engine.json', 'utf8');
const LEVELS = JSON.parse(levelsRaw);

let pass = 0, fail = 0;

LEVELS.forEach(function(lvl) {
  const errors = [];
  const R = lvl.R, C = lvl.C;
  const clues = lvl.clues;
  const sol = lvl.solution;
  
  // 1. Each clue maps to a segment endpoint
  clues.forEach(function(cl) {
    let found = false;
    sol.forEach(function(seg) {
      if (seg.len !== cl.n) return;
      if (seg.orient === 'H') {
        if (seg.pos === cl.r && (cl.c === seg.start - 1 || cl.c === seg.end)) found = true;
      } else {
        if (seg.pos === cl.c && (cl.r === seg.start - 1 || cl.r === seg.end)) found = true;
      }
    });
    if (!found) errors.push('Clue (' + cl.r + ',' + cl.c + ')=' + cl.n + ' has no matching segment endpoint');
  });
  
  // 2. Each segment crosses at least one same-length segment
  function segsCross(a, b) {
    if (a.orient === b.orient) return false;
    if (a.orient === 'H') {
      return b.pos >= a.start && b.pos < a.end && a.pos >= b.start && a.pos < b.end;
    } else {
      return a.pos >= b.start && a.pos < b.end && b.pos >= a.start && b.pos < a.end;
    }
  }
  sol.forEach(function(seg, i) {
    let hasCross = false;
    for (let j = 0; j < sol.length; j++) {
      if (i === j) continue;
      if (segsCross(seg, sol[j]) && sol[j].len === seg.len) { hasCross = true; break; }
    }
    if (!hasCross) errors.push('Seg ' + i + ' (' + seg.orient + ' len=' + seg.len + ') no same-length crossing');
  });
  
  // 3. Connectivity (all segments connected via crossings)
  const adj = {};
  sol.forEach(function(s, i) { adj[i] = []; });
  for (let i = 0; i < sol.length; i++) {
    for (let j = i + 1; j < sol.length; j++) {
      if (segsCross(sol[i], sol[j])) { adj[i].push(j); adj[j].push(i); }
    }
  }
  if (sol.length > 0) {
    const visited = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const u = queue.shift();
      adj[u].forEach(function(v) { if (!visited.has(v)) { visited.add(v); queue.push(v); } });
    }
    if (visited.size !== sol.length) errors.push('Disconnected: ' + visited.size + '/' + sol.length);
  }
  
  // 4. No cycle (tree)
  const edges = [];
  for (let i = 0; i < sol.length; i++) {
    for (const j of adj[i]) {
      if (i < j) edges.push([i, j]);
    }
  }
  const parent = sol.map(function(_, i) { return i; });
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra === rb) { errors.push('Cycle between ' + a + ' and ' + b); break; }
    parent[ra] = rb;
  }
  
  // 5. No cell triple-occupied or same-orient overlap
  const cellSegs = {};
  sol.forEach(function(seg, i) {
    let cells;
    if (seg.orient === 'H') {
      cells = [];
      for (let c = seg.start; c < seg.end; c++) cells.push(seg.pos + ',' + c);
    } else {
      cells = [];
      for (let r = seg.start; r < seg.end; r++) cells.push(r + ',' + seg.pos);
    }
    cells.forEach(function(key) {
      if (!cellSegs[key]) cellSegs[key] = [];
      cellSegs[key].push(i);
    });
  });
  Object.keys(cellSegs).forEach(function(key) {
    const segs = cellSegs[key];
    if (segs.length > 2) errors.push('Cell ' + key + ' has ' + segs.length + ' segments');
    if (segs.length === 2) {
      const orients = segs.map(function(i) { return sol[i].orient; });
      if (orients[0] === orients[1]) errors.push('Cell ' + key + ' double same-orient');
    }
  });
  
  // 6. No segment covers a circle cell
  const circleCells = new Set(clues.map(function(cl) { return cl.r + ',' + cl.c; }));
  sol.forEach(function(seg, i) {
    let cells;
    if (seg.orient === 'H') {
      cells = [];
      for (let c = seg.start; c < seg.end; c++) cells.push(seg.pos + ',' + c);
    } else {
      cells = [];
      for (let r = seg.start; r < seg.end; r++) cells.push(r + ',' + seg.pos);
    }
    cells.forEach(function(key) {
      if (circleCells.has(key)) errors.push('Seg ' + i + ' covers circle cell ' + key);
    });
  });
  
  if (errors.length === 0) {
    pass++;
    console.log('\u2705 ' + lvl.id + ' (' + lvl.tier + ') ' + R + 'x' + C + ' ' + sol.length + ' segs, ' + clues.length + ' clues — VALID');
  } else {
    fail++;
    console.log('\u274c ' + lvl.id + ' (' + lvl.tier + ') — ' + errors.length + ' errors:');
    errors.forEach(function(e) { console.log('   ' + e); });
  }
});

console.log('\n=== Independent Node.js BFS Verifier Results ===');
console.log('PASS: ' + pass + '/' + LEVELS.length);
console.log('FAIL: ' + fail + '/' + LEVELS.length);
process.exit(fail > 0 ? 1 : 0);
