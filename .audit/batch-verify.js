#!/usr/bin/env node
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const SLUG = process.argv[2];
if (!SLUG) { console.error('Usage: node batch-verify.js SLUG'); process.exit(1); }
const SLUG_DIR = path.join('/home/msdn/gamezipper.com', SLUG);
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

function mkEl() {
  return new Proxy({
    style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], parentElement: null, parentNode: null,
    width: 0, height: 0, clientWidth: 500, clientHeight: 500,
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    getContext: () => new Proxy({}, { get: () => () => {}, set: () => true }),
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function(c) { return c; }, removeChild: function(c) { return c; }, remove: function() {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '', className: '',
  }, { get(t, p) { if (p in t) return t[p]; return () => t; }, set: () => true });
}
const sandbox = {
  console,Math,Date,JSON,Array,Object,Set,Map,Number,String,Boolean,parseInt,parseFloat,isNaN,isFinite,Symbol,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function() { return { createOscillator: () => ({ connect: () => {}, frequency: {}, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
      createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
      currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {} }; },
  },
  document: {
    getElementById: () => mkEl(),
    getElementsByTagName: () => [mkEl()],
    querySelector: () => mkEl(), querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: () => mkEl(),
    body: mkEl(), head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible',
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn) => { try { return fn && fn(); } catch(e) { return 0; } },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
};
sandbox.webkitAudioContext = sandbox.window.AudioContext;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(code, ctx); } catch (e) { console.error('engine load error:', e.message); process.exit(1); }

const det = vm.runInContext(`({
  hasCheckSolution: typeof checkSolution === 'function',
  hasCheckWin: typeof checkWin === 'function',
  hasCheckSolved: typeof checkSolved === 'function',
  hasValidateCurrent: typeof validateCurrent === 'function',
  hasIsComplete: typeof isComplete === 'function',
  hasLoadLevel: typeof loadLevel === 'function',
  hasLEVELS: typeof LEVELS !== 'undefined',
  hasPUZZLES: typeof PUZZLES !== 'undefined',
  hasGrid: typeof grid !== 'undefined',
  hasLevel: typeof level !== 'undefined',
  hasCurrentLevel: typeof currentLevel !== 'undefined',
  hasCurrentLevelIdx: typeof currentLevelIdx !== 'undefined',
  hasBoard: typeof board !== 'undefined',
  hasGame: typeof game !== 'undefined',
  hasWon: typeof won !== 'undefined',
  hasUserBlack: typeof userBlack !== 'undefined',
  hasUserBorders: typeof userBorders !== 'undefined',
  hasPrefilledBorders: typeof prefilledBorders !== 'undefined',
  hasEdgeKey: typeof edgeKey === 'function',
  LEVELSLen: typeof LEVELS !== 'undefined' ? LEVELS.length : 0,
})`, ctx);

let driver;
if (det.hasCheckWin && det.hasLevel && det.hasLEVELS) {
  // japanese-sums style: set level + grid directly, checkWin returns bool
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<LEVELS.length;i++){
        const L=LEVELS[i];
        level=L;
        grid=[];
        for(let r=0;r<L.N;r++){grid[r]=[];for(let c=0;c<L.N;c++)grid[r][c]=L.s[r][c];}
        let ok; try{ok=checkWin();}catch(e){ok=false;}
        if(ok) pass++; else { fail++; fails.push('L'+(i+1)+':'+L.N+'x'+L.N); }
      }
      return JSON.stringify({pass,fail,fails:fails.slice(0,15),total:LEVELS.length});
    })()`;
} else if (det.hasIsComplete && det.hasCheckWin && det.hasCurrentLevel && det.hasGrid && det.hasLEVELS) {
  // kojun style: call loadLevel first to init state, then set grid = solution, check isComplete() && violations.size === 0
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<LEVELS.length;i++){
        const L=LEVELS[i];
        try {
          loadLevel(i);
          grid = L.solution.map(r=>r.slice());
          regionGrid = L.regions.map(r=>r.slice());
          violations = new Set();
          const ok = isComplete() && violations.size === 0;
          if(ok) pass++; else { fail++; fails.push('L'+(i+1)+':'+L.H+'x'+L.W); }
        } catch(e){ fail++; fails.push('L'+(i+1)+' EX:'+e.message.slice(0,60)); }
      }
      return JSON.stringify({pass,fail,fails:fails.slice(0,15),total:LEVELS.length});
    })()`;
} else if (det.hasCheckSolution && det.hasCurrentLevel && det.hasGrid && det.hasLEVELS && !det.hasUserBorders && det.hasWon) {
  // cross-the-streams style: loadLevel sets up, set grid = solution, checkSolution() sets won=true on success
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<LEVELS.length;i++){
        const L=LEVELS[i];
        try {
          loadLevel(i);
          grid = L.solution.map(r=>r.slice());
          won = false;
          checkSolution();
          if(won) pass++;
          else { fail++; fails.push('L'+(i+1)+':'+L.rows+'x'+L.cols); }
        } catch(e){ fail++; fails.push('L'+(i+1)+' EX:'+e.message.slice(0,60)); }
      }
      return JSON.stringify({pass,fail,fails:fails.slice(0,15),total:LEVELS.length});
    })()`;
} else if (det.hasCheckSolution && det.hasUserBorders && det.hasPrefilledBorders && det.hasCurrentLevel && det.hasLEVELS) {
  // double-choco style: rebuild prefilledBorders from solution, userBorders = prefilledBorders
  driver = `
    (function(){
      let pass=0, fail=0, fails=[];
      for(let i=0;i<LEVELS.length;i++){
        const L=LEVELS[i];
        try {
          currentLevelIdx = i;
          currentLevel = L;
          prefilledBorders = new Set();
          const g = L.grid, R = L.rows, C = L.cols;
          for(let r=0;r<R;r++) for(let c=0;c<C;c++){
            if(c<C-1 && g[r][c] !== g[r][c+1]) prefilledBorders.add(r+','+c+',r');
            if(r<R-1 && g[r][c] !== g[r+1][c]) prefilledBorders.add(r+','+c+',b');
          }
          userBorders = new Set(prefilledBorders);
          const ok = checkSolution();
          if(ok) pass++; else { fail++; fails.push('L'+(i+1)+':'+L.rows+'x'+L.cols); }
        } catch(e){ fail++; fails.push('L'+(i+1)+' EX:'+e.message.slice(0,60)); }
      }
      return JSON.stringify({pass,fail,fails:fails.slice(0,15),total:LEVELS.length});
    })()`;
} else if (det.LEVELSLen === 0) {
  console.log(`${SLUG}: procedural generator (no LEVELS) - skip in-engine verifier`);
  process.exit(0);
} else {
  console.error(`${SLUG}: no recognized shape`, JSON.stringify(det));
  process.exit(2);
}

const result = JSON.parse(vm.runInContext(driver, ctx));
console.log(`${SLUG} in-engine: ${result.pass}/${result.total} PASS`);
if (result.fail > 0) console.log('Fails:', result.fails);
process.exit(result.fail === 0 ? 0 : 1);
