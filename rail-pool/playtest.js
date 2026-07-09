// playtest.js — Replays each level's solution through the engine's logic
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract LEVELS_DATA
const m = html.match(/const LEVELS_DATA = (\{[\s\S]*?\});/);
if (!m) { console.error('No LEVELS_DATA'); process.exit(1); }

const sandbox = { console, Math, Set };
vm.createContext(sandbox);
vm.runInContext(`LEVELS_DATA = ${m[1]};`, sandbox);

// Run only the engine helper functions (not init())
const fnMatch = html.match(/<script>\n([\s\S]*?)<\/script>/);
let engineScript = fnMatch[1];
// Strip the LEVELS_DATA line and the init() call
engineScript = engineScript.replace(/const LEVELS_DATA = \{[\s\S]*?\};/, '');
engineScript = engineScript.replace(/window\.addEventListener\('load', init\);/, '');
// Wrap to expose functions on sandbox
engineScript = `
const document = {
  getElementById: () => ({ textContent: '', classList: { add(){}, remove(){}, toggle(){} }, addEventListener(){}, style: {}, onClick: null }),
  addEventListener: () => {},
};
const window = { addEventListener: () => {}, AudioContext: function(){} };
const localStorage = { getItem: () => null, setItem: () => {} };
const setTimeout = () => {};
${engineScript}
// Expose for testing
globalThis.computeSegments = computeSegments;
globalThis.computeViolations = computeViolations;
globalThis.isLoopClosed = isLoopClosed;
`;

vm.runInContext(engineScript, sandbox);

const LEVELS_DATA = sandbox.LEVELS_DATA;
const levels = LEVELS_DATA.levels;
let pass = 0, fail = 0;

for (const lvl of levels) {
  try {
    // Build path by walking solution exits
    const R = lvl.size[0], C = lvl.size[1];
    const DELTA = { N: [-1,0], S: [1,0], E: [0,1], W: [0,-1] };
    let cr = 0, cc = 0;
    const path = [];
    const visited = new Set();
    for (let i = 0; i < R*C*4; i++) {
      if (visited.has(cr + ',' + cc)) break;
      visited.add(cr + ',' + cc);
      path.push([cr, cc]);
      const exit = lvl.solution_exit[cr][cc];
      if (!exit) break;
      const [dr, dc] = DELTA[exit];
      cr += dr; cc += dc;
    }
    // Set engine state for computeSegments/computeViolations/isLoopClosed
    const grid = Array.from({length: R}, (_, r) => Array.from({length: C}, (_, c) => ({
      entry: lvl.solution_entry[r][c] || null,
      exit: lvl.solution_exit[r][c] || null,
    })));
    vm.runInContext(`
      state.R = ${R}; state.C = ${C};
      state.path = ${JSON.stringify(path)};
      state.regions = ${JSON.stringify(lvl.regions)};
      state.clues = ${JSON.stringify(lvl.clues)};
      state.grid = ${JSON.stringify(grid)};
      state.visitedCells = new Set(${JSON.stringify(path.map(([r,c]) => r + ',' + c))});
      state.showViolations = true;
      state.autoValidate = true;
    `, sandbox);

    const segments = sandbox.computeSegments();
    const violations = sandbox.computeViolations();
    const closed = sandbox.isLoopClosed();

    if (!closed) {
      console.log(`  Level ${lvl.number} (${lvl.tier}): PLAYTEST FAIL - loop not closed (path len ${path.length})`);
      fail++;
      continue;
    }
    if (segments.length === 0) {
      console.log(`  Level ${lvl.number} (${lvl.tier}): PLAYTEST FAIL - no segments`);
      fail++;
      continue;
    }
    if (violations.clueViolations && violations.clueViolations.length > 0) {
      console.log(`  Level ${lvl.number} (${lvl.tier}): PLAYTEST FAIL - ${violations.clueViolations.length} clue violations`);
      fail++;
      continue;
    }
    pass++;
    console.log(`  Level ${lvl.number} (${lvl.tier}): PLAYTEST PASS (${segments.length} segments, ${path.length} cells)`);
  } catch (e) {
    console.log(`  Level ${lvl.number} (${lvl.tier}): PLAYTEST ERROR - ${e.message}`);
    fail++;
  }
}
console.log(`\n${pass}/${levels.length} levels passed playtest`);
process.exit(fail > 0 ? 1 : 0);