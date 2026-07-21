#!/usr/bin/env node
/* Shared in-engine verifier for puzzle games with internal check function.
 * Loads index.html, extracts inline game scripts, runs them in vm sandbox,
 * then drives the engine's own checkSolution / checkWin against each level's solution.
 *
 * Usage: node shared-vm-verify.js SLUG
 *   - SLUG directory contains index.html with checkSolution or checkWin
 *   - For LEVELS-shaped: {r, c, ..., solution}
 *   - Caller pre-sets state/LEVELS via the right env-specific code path
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = process.argv[2];
if (!SLUG) { console.error('Usage: node shared-vm-verify.js SLUG'); process.exit(1); }

const SLUG_DIR = path.join('/home/msdn/gamezipper.com', SLUG);
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');

// Extract inline game scripts (no src, not ld+json)
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

const extractLevels = require('./gz-extract-levels.js');
const LEVELS = extractLevels(SLUG);
if (!LEVELS || LEVELS.length === 0) { console.error('LEVELS not extracted'); process.exit(1); }

const sandbox = {
  console,
  Math, Date, JSON, Array, Object, Set, Map,
  Number, String, Boolean, parseInt, parseFloat, isNaN, isFinite,
  document: {
    getElementById: () => ({
      addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      textContent: '', innerHTML: '', style: {}, dataset: {},
      getContext: () => new Proxy({}, { get: () => () => {}, set: () => true }),
      parentElement: { clientWidth: 500, clientHeight: 500 },
      width: 0, height: 0,
      appendChild: () => {}, querySelectorAll: () => [], querySelector: () => null,
      animate: () => ({ onfinish: null, cancel: () => {} }), // for confetti
    }),
    addEventListener: () => {},
    createElement: () => new Proxy({ style:{}, classList:{ add:()=>{}, remove:()=>{}, toggle:()=>{} }, animate: () => ({ onfinish: null, cancel: () => {} }), remove:()=>{}, appendChild:()=>{}, querySelectorAll:()=>[], textContent:'', innerHTML:'' }, { get: (t, p) => t[p] || (() => {}), set: () => true }),
    body: { appendChild: () => {} },
    querySelector: () => null, querySelectorAll: () => [],
    hidden: false,
  },
  window: {
    addEventListener: () => {},
    innerWidth: 1280, innerHeight: 720,
    AudioContext: function(){ return {
      createOscillator: () => ({ connect:()=>{}, frequency:{}, start:()=>{}, stop:()=>{}, type:'' }),
      createGain: () => ({ connect:()=>{}, gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {},
    }; },
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => fn && fn(), clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
};
sandbox.webkitAudioContext = sandbox.window.AudioContext;

const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx); } catch (e) { console.error('engine load error:', e.message); process.exit(1); }

// Detect which check function exists
const detection = vm.runInContext(`
  ({
    hasCheckSolution: typeof checkSolution === 'function',
    hasCheckWin: typeof checkWin === 'function',
    hasCheckSolved: typeof checkSolved === 'function',
    hasValidateCurrent: typeof validateCurrent === 'function',
    hasLEVELS: typeof LEVELS !== 'undefined',
    hasPUZZLES: typeof PUZZLES !== 'undefined',
    LEVELSLen: typeof LEVELS !== 'undefined' ? LEVELS.length : 0,
    PUZZLESLen: typeof PUZZLES !== 'undefined' ? PUZZLES.length : 0,
  })
`, ctx);

let driver;
if (detection.hasCheckSolution && detection.hasPUZZLES) {
  // Style: PUZZLES[i] = {rows,cols,regions,sol,clues}; state.regions/grid/sol
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<PUZZLES.length;i++){
        const p = PUZZLES[i];
        state.level = i;
        state.rows = p.rows; state.cols = p.cols;
        state.regions = p.regions; state.sol = p.sol; state.clues = p.clues;
        state.grid = [];
        for(let r=0;r<p.rows;r++){state.grid[r]=[];for(let c=0;c<p.cols;c++)state.grid[r][c]=p.sol[r*p.cols+c];}
        state.hintCells = {};
        const ok = checkSolution(true);
        if(ok) pass++;
        else { fail++; fails.push('L'+(i+1)+':'+p.rows+'x'+p.cols); }
      }
      return JSON.stringify({pass, fail, fails: fails.slice(0,5), total: PUZZLES.length});
    })()
  `;
} else if (detection.hasCheckWin && detection.hasLEVELS) {
  // suraromu-style OR chocona-style: loadLevel sets up game state; checkWin reads game.drawnEdges OR userBlack
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<LEVELS.length;i++){
        const L = LEVELS[i];
        if (typeof loadLevel === 'function') loadLevel(i);
        else if (typeof currentLevel !== 'undefined') { currentLevel = L; currentLevelIdx = i; }
        // Suraromu-style: re-populate drawnEdges from solutionEdges
        if (typeof edgeKey === 'function' && game.solutionEdges){
          game.drawnEdges = {};
          for(const e of game.solutionEdges){
            const k = edgeKey(e[0][0], e[0][1], e[1][0], e[1][1]);
            game.drawnEdges[k] = true;
          }
        }
        // Chocona-style: re-populate userBlack from currentLevel.solution (if currentLevel exists in scope)
        try {
          if (typeof currentLevel !== 'undefined' && currentLevel && currentLevel.solution && typeof userBlack !== 'undefined'){
            userBlack = new Set();
            for(const [r,c] of currentLevel.solution) userBlack.add(r+','+c);
          }
        } catch(e){ /* currentLevel may not be defined in this game's IIFE scope */ }
        const ok = checkWin(true);
        if(ok) pass++;
        else { fail++; fails.push('L'+(i+1)+':'+(game?.rows||currentLevel?.rows)+'x'+(game?.cols||currentLevel?.cols)); }
      }
      return JSON.stringify({pass, fail, fails: fails.slice(0,5), total: LEVELS.length});
    })()
  `;
} else if (detection.hasCheckSolution && detection.hasLEVELS && !detection.hasPUZZLES) {
  // kazunori-style: LEVELS[i] = {rows,cols,regions,solution,clues}; currentLevel+board IIFE-scoped
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<LEVELS.length;i++){
        const L = LEVELS[i];
        currentLevelIdx = i;
        currentLevel = L;
        board = [];
        for(let r=0;r<L.rows;r++){
          board[r] = [];
          for(let c=0;c<L.cols;c++){
            board[r][c] = L.solution[r][c];
          }
        }
        const ok = checkSolution(true);
        if(ok) pass++;
        else { fail++; fails.push('L'+(i+1)+':'+L.rows+'x'+L.cols); }
      }
      return JSON.stringify({pass, fail, fails: fails.slice(0,5), total: LEVELS.length});
    })()
  `;
} else if (detection.hasCheckSolved && detection.hasLEVELS) {
  // mid-loop style: game.edges holds solution
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<LEVELS.length;i++){
        const lvl = LEVELS[i];
        game.rows = lvl.r; game.cols = lvl.c;
        game.dots = lvl.dots.map(d => [d[0], d[1]]);
        game.edges = {};
        for(const se of lvl.sol){
          const k = edgeKey(se[0], se[1], se[2], se[3]);
          game.edges[k] = true;
        }
        const ok = checkSolved();
        if(ok) pass++;
        else { fail++; fails.push('L'+(i+1)+':'+lvl.r+'x'+lvl.c); }
      }
      return JSON.stringify({pass, fail, fails: fails.slice(0,5), total: LEVELS.length});
    })()
  `;
} else {
  console.error('No recognized check pattern. Detection:', detection);
  process.exit(2);
}

const result = JSON.parse(vm.runInContext(driver, ctx));
console.log(`${SLUG} in-engine: ${result.pass}/${result.total} PASS`);
if (result.fail > 0) console.log('Fails:', result.fails);
process.exit(result.fail === 0 ? 0 : 1);
