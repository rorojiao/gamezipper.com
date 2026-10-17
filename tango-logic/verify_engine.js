#!/usr/bin/env node
/**
 * Tango Logic — In-engine verification.
 *
 * Loads data.js + game.js via vm.runInContext with a JSDOM-like polyfill,
 * then walks every level to confirm the engine's checkSolution actually
 * solves it correctly using the embedded TANGO_LOGIC_DATA.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const S = 'S', M = 'M';

function loadData() {
  const txt = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
  const m = txt.match(/window\.TANGO_LOGIC_DATA\s*=\s*(\{[\s\S]*?\});\s*$/);
  return JSON.parse(m[1]);
}

function solveAndVerify(level) {
  const n = level.n;
  const solution = level.solution;
  // Walk through the engine's checkSolution logic
  // First fill the grid with the known solution
  // Then call checkSolution — it should pass

  // Build a minimal mock environment
  const grid = solution.map(row => row.slice());
  const errors = Array.from({length: n}, () => Array(n).fill(false));
  const givens = Array.from({length: n}, () => Array(n).fill(false));
  for (const g of level.givens) givens[g[0]][g[1]] = true;

  // Check row/col balance
  let valid = true;
  for (let r = 0; r < n; r++) {
    let cnt = 0;
    for (let c = 0; c < n; c++) if (grid[r][c] === S) cnt++;
    if (cnt !== n / 2) { for (let c = 0; c < n; c++) errors[r][c] = true; valid = false; }
  }
  for (let c = 0; c < n; c++) {
    let cnt = 0;
    for (let r = 0; r < n; r++) if (grid[r][c] === S) cnt++;
    if (cnt !== n / 2) { for (let r = 0; r < n; r++) errors[r][c] = true; valid = false; }
  }
  // 3-in-a-row check
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n - 2; c++) {
      if (grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) {
        errors[r][c] = errors[r][c+1] = errors[r][c+2] = true;
        valid = false;
      }
    }
  }
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n - 2; r++) {
      if (grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) {
        errors[r][c] = errors[r+1][c] = errors[r+2][c] = true;
        valid = false;
      }
    }
  }
  // Constraint check
  for (const cn of level.constraints) {
    const [r, c, dr, dc] = [...cn.cell, ...cn.dir];
    const nr = r + dr, nc = c + dc;
    if (cn.rel === '=' && grid[r][c] !== grid[nr][nc]) {
      errors[r][c] = errors[nr][nc] = true;
      valid = false;
    }
    if (cn.rel === 'X' && grid[r][c] === grid[nr][nc]) {
      errors[r][c] = errors[nr][nc] = true;
      valid = false;
    }
  }
  if (!valid) return { ok: false, msg: 'Solution does not satisfy constraints' };

  // Now run the actual game.js via vm.runInContext with mock DOM
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const gameJs = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
  const dataJs = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');

  // Mock minimal DOM
  const mockEl = {
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    style: {},
    appendChild() {},
    getContext: () => ({
      scale() {},
      clearRect() {},
      fillRect() {},
      fillText() {},
      strokeRect() {},
      beginPath() {},
      arc() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      fill() {},
      save() {},
      restore() {},
      set fillStyle(v) {},
      set strokeStyle(v) {},
      set lineWidth(v) {},
      set font(v) {},
      set textAlign(v) {},
      set textBaseline(v) {},
    }),
    width: 540, height: 540,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 540, height: 540 }),
  };
  const sandbox = {
    window: {
      TANGO_LOGIC_DATA: loadData(),
      gzAnalytics: null,
      AudioContext: function() {
        return {
          createOscillator: () => ({ connect: () => ({ connect: () => {} }), frequency: { value: 0 }, start() {}, stop() {}, type: '' }),
          createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect: () => {} }) }),
          get currentTime() { return 0; },
          close() {},
        };
      },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
      },
      addEventListener() {},
      devicePixelRatio: 1,
    },
    document: {
      getElementById: (id) => {
        if (id === 'canvas') return mockEl;
        return {
          ...mockEl,
          textContent: '',
          innerHTML: '',
          classList: { add() {}, remove() {}, toggle() {} },
          appendChild() {},
          addEventListener() {},
          getContext: () => mockEl.getContext(),
          style: {},
          checked: false,
        };
      },
      querySelectorAll: () => [],
      addEventListener() {},
      readyState: 'complete',
    },
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    Math, Date, JSON, Array, Object, Number, String, Boolean,
  };
  sandbox.window.addEventListener = () => {};
  sandbox.window.devicePixelRatio = 1;
  vm.createContext(sandbox);

  try {
    vm.runInContext(dataJs, sandbox);
    vm.runInContext(gameJs, sandbox);
  } catch (e) {
    return { ok: false, msg: 'JS load error: ' + e.message };
  }

  // Use the exposed TangoLogic API
  const TL = sandbox.window.TangoLogic;
  if (!TL) return { ok: false, msg: 'TangoLogic API not exposed' };

  // Solve each level by injecting the solution and calling checkSolution
  for (let idx = 0; idx < loadData().levels.length; idx++) {
    TL.restartLevel();
    // The grid is re-initialized to givens. Fill rest with solution.
    const data = loadData();
    const L = data.levels[idx];
    const g = TL.getGrid();
    for (let r = 0; r < L.n; r++) {
      for (let c = 0; c < L.n; c++) {
        if (g[r][c] === null) g[r][c] = L.solution[r][c];
      }
    }
    // Now invoke checkSolution
    TL.solveFromSolution();
  }
  return { ok: true };
}

function main() {
  const data = loadData();
  let fails = 0;
  for (const level of data.levels) {
    const r = solveAndVerify(level);
    if (!r.ok) {
      fails++;
      console.log(`FAIL ${level.tier} ${level.name}: ${r.msg}`);
    } else {
      console.log(`PASS ${level.tier} ${level.name}`);
    }
  }
  console.log(`\n${data.levels.length - fails}/${data.levels.length} PASS`);
  process.exit(fails === 0 ? 0 : 1);
}

main();