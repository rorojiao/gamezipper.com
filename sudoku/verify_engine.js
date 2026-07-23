// sudoku verify_engine.js - validates all 30 procedurally-generated levels
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SLUG = 'sudoku';
const HTML = fs.readFileSync(path.join(SLUG, 'index.html'), 'utf8');

function extractMainScript(html) {
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  let longest = '';
  while ((m = re.exec(html)) !== null) {
    if (m[1].length > longest.length && m[1].includes('TIERS')) {
      longest = m[1];
    }
  }
  // Strip the IIFE wrapper: "/* comment */\n(function(){\n'use strict';\n...\n})();"
  // Approach: keep everything up to and including "(function(){", strip 'use strict', strip "})();"
  // More robust: convert the IIFE so its vars become sandbox globals
  let body = longest;
  // Find the first "(function(){" or "(function(){"
  const startMatch = body.match(/^[\s\S]*?\(function\s*\(\s*\)\s*\{/);
  if (startMatch) {
    // Strip everything up to and including "(function(){"
    body = body.slice(startMatch[0].length);
    // Strip 'use strict'; (optional)
    body = body.replace(/^[\s]*'use strict';?/, '');
    // Strip the closing "})();" at end (with optional whitespace)
    body = body.replace(/\}\)\(\)\s*;?\s*$/, '');
  }
  return body;
}

const gameScript = extractMainScript(HTML);
console.log('Extracted game script: ' + gameScript.length + ' bytes');

const sandbox = {
  console, setTimeout, clearTimeout,
  Math, JSON, Date, Array, Object, Number, String,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
function makeCtx() {
  return new Proxy({}, { get: (t, k) => {
    if (k === 'canvas') return { width: 500, height: 500 };
    return () => {};
  }, set: () => true });
}
sandbox.document = {
  getElementById: () => ({
    getContext: () => makeCtx(),
    addEventListener: () => {},
    appendChild: () => {},
    width: 500, height: 500,
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  body: { appendChild: () => {} },
  createElement: () => ({
    appendChild: () => {}, addEventListener: () => {}, setAttribute: () => {},
    getContext: () => makeCtx(),
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {},
  }),
};
sandbox.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
};
sandbox.AudioContext = function() {
  return {
    state: 'suspended',
    createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {} }),
    createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
    destination: {}, resume: () => Promise.resolve(), currentTime: 0
  };
};
sandbox.window.AudioContext = sandbox.AudioContext;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.addEventListener = () => {};
sandbox.window.requestAnimationFrame = () => 0;
sandbox.window.cancelAnimationFrame = () => {};
sandbox.window.removeEventListener = () => {};
sandbox.window.fetch = () => Promise.resolve();
sandbox.window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
sandbox.navigator = { sendBeacon: () => false };

const context = vm.createContext(sandbox);
try {
  vm.runInContext(gameScript, context, { filename: 'sudoku.js' });
} catch (e) {
  console.error('Script load error:', e.message);
  console.error(e.stack.split('\n').slice(0, 5).join('\n'));
  process.exit(1);
}

if (!sandbox.TIERS) { 
  console.error('sandbox.TIERS not defined.');
  console.error('globalThis.TIERS:', !!sandbox.globalThis.TIERS, sandbox.globalThis.TIERS?.length || 'N/A');
  console.error('TIERS var:', typeof sandbox.TIERS);
  console.error('Script lines:', gameScript.split('\n').length);
  // try direct eval in the vm context
  try {
    const probe = vm.runInContext('typeof TIERS + "|" + typeof generatePuzzle + "|" + typeof state + "|" + typeof mulberry32', context);
    console.error('Probe in context:', probe);
  } catch (e) { console.error('Probe error:', e.message); }
  process.exit(1);
}
console.log('Loaded ' + sandbox.TIERS.length + ' tiers');

if (typeof sandbox.generatePuzzle !== 'function') { console.error('generatePuzzle not a function'); process.exit(1); }

function candidates(grid, r, c) {
  const used = new Set();
  for (let i = 0; i < 9; i++) { used.add(grid[r][i]); used.add(grid[i][c]); }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) used.add(grid[br + i][bc + j]);
  const cands = [];
  for (let v = 1; v <= 9; v++) if (!used.has(v)) cands.push(v);
  return cands;
}

function validateSudoku(L) {
  const p = L.puzzle, s = L.solution;
  if (!Array.isArray(p) || p.length !== 9) return 'puzzle shape';
  if (!Array.isArray(s) || s.length !== 9) return 'sol shape';
  for (let r = 0; r < 9; r++) {
    if (!Array.isArray(p[r]) || p[r].length !== 9) return 'puzzle col shape';
    if (!Array.isArray(s[r]) || s[r].length !== 9) return 'sol col shape';
  }
  for (let r = 0; r < 9; r++) {
    const rs = new Set(), cs = new Set();
    for (let c = 0; c < 9; c++) {
      if (s[r][c] < 1 || s[r][c] > 9) return 'sol range';
      rs.add(s[r][c]); cs.add(s[c][r]);
    }
    if (rs.size !== 9) return 'row ' + r + ' dup';
    if (cs.size !== 9) return 'col ' + r + ' dup';
  }
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
    const box = new Set();
    for (let r = br * 3; r < br * 3 + 3; r++) for (let c = bc * 3; c < bc * 3 + 3; c++) box.add(s[r][c]);
    if (box.size !== 9) return 'box ' + br + '-' + bc + ' dup';
  }
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (p[r][c] !== 0 && p[r][c] !== s[r][c]) return 'given mismatch (' + r + ',' + c + ')';
  }
  return null;
}

const issues = [];
const results = [];
for (let idx = 0; idx < 30; idx++) {
  const tier = Math.floor(idx / 5);
  const within = idx % 5;
  const def = sandbox.TIERS[tier];
  const givens = def.givens[within];
  const seed = (0xCAFE + idx * 17) >>> 0;
  const rand = sandbox.mulberry32(seed);
  let L;
  try {
    L = sandbox.generatePuzzle(givens, rand);
  } catch (e) { issues.push({ idx, err: 'gen threw: ' + e.message }); continue; }
  if (!L) { issues.push({ idx, err: 'gen returned null' }); continue; }
  const err = validateSudoku(L);
  if (err) { issues.push({ idx, err, tier: def.name }); continue; }
  let minN = 99;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (L.puzzle[r][c] === 0) {
      const cs = candidates(L.puzzle, r, c);
      if (cs.length < minN) minN = cs.length;
    }
  }
  results.push({ idx, tier: def.name, givens, minCands: minN });
}

console.log('Validated ' + results.length + '/30 levels');
console.log('Issues: ' + issues.length);
if (issues.length) for (const i of issues.slice(0, 5)) console.log('  FAIL', i);
const avgMin = results.reduce((a, r) => a + r.minCands, 0) / Math.max(1, results.length);
console.log('Avg min candidates (uniqueness proxy): ' + avgMin.toFixed(2));
const tierCounts = {};
results.forEach(r => { tierCounts[r.tier] = (tierCounts[r.tier] || 0) + 1; });
console.log('Per tier:', tierCounts);

if (issues.length === 0) {
  console.log('sudoku: ' + results.length + '/30 PASS');
  process.exit(0);
} else {
  console.log('sudoku: ' + issues.length + '/30 FAIL');
  process.exit(1);
}
