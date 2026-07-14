// QA: Parse LEVELS from turf/index.html and run engine checkWin via vm.runInContext
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/msdn/gamezipper.com/turf/index.html', 'utf8');

// Extract the LEVELS array literal (between "const LEVELS = [" and matching close bracket)
const startIdx = html.indexOf('const LEVELS = [');
if (startIdx < 0) { console.error('LEVELS not found'); process.exit(1); }
let i = startIdx + 'const LEVELS = ['.length;
let depth = 1;
let inStr = false, esc = false;
while (i < html.length && depth > 0) {
  const ch = html[i];
  if (inStr) {
    if (esc) { esc = false; }
    else if (ch === '\\') { esc = true; }
    else if (ch === '"') { inStr = false; }
  } else {
    if (ch === '"') inStr = true;
    else if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { i++; break; } }
  }
  i++;
}
const literal = html.slice(startIdx + 'const LEVELS ='.length, i);
let LEVELS;
try { LEVELS = eval(literal); } catch (e) {
  // try via Function constructor (safer)
  LEVELS = (new Function('return ' + literal + ';'))();
}

console.log('LEVELS count =', LEVELS.length);
if (LEVELS.length !== 30) { console.error('Expected 30 levels, got', LEVELS.length); process.exit(1); }

// Build a minimal sandbox copying engine logic from index.html (state + bfs + isConnected + checkWin)
const ctx = {
  console,
  Set,
  Array, Number, Object, JSON, Math, Date, Error,
  Array_from: Array.from,
};
vm.createContext(ctx);

// Stub localStorage for vm context (not used by BFS / checkWin)
const ctxCode = `
const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const document = { getElementById: () => ({ textContent: '', classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} }, addEventListener: ()=>{}, appendChild: ()=>{}, checked: false, value: '' }), addEventListener: () => {} };
const window = { addEventListener: () => {} };

// Replicate engine
const LEVELS = ${JSON.stringify(LEVELS)};
const state = { level: 0, rows: 0, cols: 0, grid: [], clues: [], mode: 'black', hints: 3, hintsUsed: 0, startTime: 0, paused: false, musicOn: true, sfxOn: true, autoCheck: false, won: false, hintCells: new Set() };

function bfs(grid, startR, startC, targetColor) {
  const R = grid.length, C = grid[0].length;
  const visited = new Set();
  const stack = [[startR, startC]];
  visited.add(startR + ',' + startC);
  while (stack.length > 0) {
    const [r, c] = stack.pop();
    if (grid[r][c] !== targetColor) continue;
    for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited.has(nr + ',' + nc) && grid[nr][nc] === targetColor) {
        visited.add(nr + ',' + nc);
        stack.push([nr, nc]);
      }
    }
  }
  return visited;
}
function isConnected(grid, targetColor) {
  const R = grid.length, C = grid[0].length;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === targetColor) {
        const region = bfs(grid, r, c, targetColor);
        const total = grid.flat().filter(v => v === targetColor).length;
        return region.size === total;
      }
    }
  }
  return true;
}
function checkWin() {
  if (!isConnected(state.grid, 0)) return false;
  if (!isConnected(state.grid, 1)) return false;
  const R = state.rows, C = state.cols;
  for (const cl of state.clues) {
    const region = bfs(state.grid, cl.r, cl.c, state.grid[cl.r][cl.c]);
    if (region.size !== cl.val) return false;
  }
  return true;
}
function loadLevelGrid(idx) {
  const lvl = LEVELS[idx];
  state.rows = lvl.rows; state.cols = lvl.cols;
  state.clues = lvl.clues;
  // grid is flattened in lvl.grid, rows are stored as flat R*C array
  state.grid = [];
  for (let r = 0; r < lvl.rows; r++) {
    state.grid.push(lvl.grid.slice(r * lvl.cols, (r + 1) * lvl.cols));
  }
}

globalThis.checkLevel = function(idx) {
  loadLevelGrid(idx);
  return checkWin();
};
`;

vm.runInContext(ctxCode, ctx);

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const ok = ctx.checkLevel(i);
  if (ok) pass++;
  else { fail++; fails.push(i + 1); }
}
console.log(`checkWin on each level's ground-truth grid: ${pass}/${LEVELS.length} PASS`);
if (fails.length) console.log('Failed levels:', fails.join(', '));
process.exit(fail === 0 ? 0 : 2);
