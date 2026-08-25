#!/usr/bin/env node
// happy-glass solvability verifier (offline replica via vm sandbox)

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML_PATH = path.join(__dirname, '..', 'happy-glass', 'index.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

// Extract the inline IIFE script
const m = html.match(/\(function\(\)\{([\s\S]*?)\}\)\(\);\s*<\/script>/);
if (!m) { console.error('Could not extract IIFE'); process.exit(2); }
const scriptBody = m[1];

// Build vm context with stubs
const ctx = {
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Math, Date, JSON, Array, Object, Number, Boolean, String, RegExp,
  performance: { now: () => Date.now() },
  document: {
    getElementById: (id) => {
      if (id === 'gameCanvas') {
        return {
          classList: { add(){}, remove(){}, contains(){return false;} },
          style: {},
          textContent: '',
          innerHTML: '',
          width: 1280,
          height: 577,
          addEventListener(){},
          removeEventListener(){},
          appendChild(){},
          removeChild(){},
          getContext: () => ({
            setTransform(){}, clearRect(){}, fillRect(){}, strokeRect(){},
            fillText(){}, strokeText(){}, drawImage(){}, beginPath(){}, moveTo(){},
            lineTo(){}, arc(){}, rect(){}, roundRect(){}, closePath(){},
            fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){},
            scale(){}, bezierCurveTo(){}, quadraticCurveTo(){},
            ellipse(){}, clip(){}, isPointInPath(){return false;},
            measureText(){return{width:0};},
            putImageData(){}, createImageData(){return{data:new Uint8ClampedArray(4)};},
            createLinearGradient(){ return { addColorStop(){} }; },
            createRadialGradient(){ return { addColorStop(){} }; },
            createPattern(){return null;},
            getImageData(){ return { data: new Uint8ClampedArray(4) }; },
          }),
        };
      }
      return {
        classList: { add(){}, remove(){}, contains(){return false;} },
        style: {}, textContent: '', innerHTML: '',
        addEventListener(){}, removeEventListener(){},
        appendChild(){}, removeChild(){},
      };
    },
    addEventListener(){},
    removeEventListener(){},
    querySelectorAll: () => [],
    querySelector: () => null,
  },
  window: {
    AudioContext: function(){
      return {
        state: 'running',
        resume(){},
        createOscillator(){ return { frequency:{value:0}, connect(){}, start(){}, stop(){}, disconnect(){} }; },
        createGain(){ return { connect(){}, gain:{value:0}, disconnect(){} }; },
        destination: {},
        close(){},
      };
    },
    addEventListener(){},
    removeEventListener(){},
    devicePixelRatio: 1,
    innerWidth: 1280,
    innerHeight: 577,
  },
  localStorage: {
    _s: {},
    getItem(k){ return this._s[k] || null; },
    setItem(k, v){ this._s[k] = v; },
    removeItem(k){ delete this._s[k]; },
  },
  navigator: { sendBeacon(){} },
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  globalThis: {},
};
ctx.globalThis = ctx;
ctx.window.window = ctx.window;
ctx.self = ctx;

vm.createContext(ctx);

// Run the IIFE body — we use the combined eval below that also captures locals
// (the standalone IIFE eval was removed; combined version is below)

// Expose what we need
// Since the IIFE wraps everything in closure scope, we re-run with a tail that captures the locals
vm.runInContext(`
(function(){
${scriptBody}
// Re-expose locals as globalThis — use getters so we always see current values
Object.defineProperty(globalThis, 'LEVELS', {get(){return LEVELS;}, configurable:true});
if (typeof startLevel !== 'undefined') globalThis.startLevel = startLevel;
if (typeof toggleSim !== 'undefined') globalThis.toggleSim = toggleSim;
Object.defineProperty(globalThis, 'drawnStrokes', {get(){return drawnStrokes;}, set(v){drawnStrokes=v;}, configurable:true});
Object.defineProperty(globalThis, 'totalInkUsed', {get(){return totalInkUsed;}, set(v){totalInkUsed=v;}, configurable:true});
Object.defineProperty(globalThis, 'fillRatio', {get(){return fillRatio;}, configurable:true});
Object.defineProperty(globalThis, 'simRunning', {get(){return simRunning;}, set(v){simRunning=v;}, configurable:true});
Object.defineProperty(globalThis, 'celebTimer', {get(){return celebTimer;}, configurable:true});
Object.defineProperty(globalThis, 'currentLevel', {get(){return currentLevel;}, configurable:true});
if (typeof SAVE_KEY !== 'undefined') globalThis.SAVE_KEY = SAVE_KEY;
if (typeof updatePhysics !== 'undefined') globalThis.updatePhysics = updatePhysics;
})();
`, ctx);

if (!ctx.globalThis.LEVELS || !ctx.globalThis.startLevel) {
  console.error('Exports missing. LEVELS:', !!ctx.globalThis.LEVELS, 'startLevel:', !!ctx.globalThis.startLevel);
  process.exit(2);
}

(async () => {
  const LEVELS = ctx.globalThis.LEVELS;
  console.log('LEVELS count:', LEVELS.length);
  let pass = 0, fail = 0;
  const startAll = Date.now();
  const failures = [];
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    try {
      ctx.globalThis.startLevel(lvl.id);
      const hint = lvl.hint;
      const stroke = [{x: hint[0].x1, y: hint[0].y1}];
      for (let s = 0; s < hint.length; s++) stroke.push({x: hint[s].x2, y: hint[s].y2});
      ctx.globalThis.drawnStrokes = [stroke];
      let totalLen = 0;
      for (let s = 0; s < stroke.length - 1; s++) {
        const dx = stroke[s+1].x - stroke[s].x, dy = stroke[s+1].y - stroke[s].y;
        totalLen += Math.sqrt(dx*dx + dy*dy);
      }
      ctx.globalThis.totalInkUsed = totalLen;
      ctx.globalThis.simRunning = false;
      ctx.globalThis.toggleSim();
      // Run physics manually: 800 frames × 32ms = 25.6s of simulated time
      // Avoid rAF chain which depends on VM scheduling
      try {
        vm.runInContext(`
          (function(){
            for (let f = 0; f < 800; f++) updatePhysics(0.032);
          })();
        `, ctx);
      } catch(e) { console.log(`Level ${lvl.id}: physics err ${e.message}`); }
      await new Promise(r => setTimeout(r, 100));
      const fr = ctx.globalThis.fillRatio;
      const won = (typeof ctx.globalThis.celebTimer === 'number' && ctx.globalThis.celebTimer > 0) || fr >= 0.7;
      const withinInk = totalLen <= lvl.inkLimit;
      const status = (won && withinInk) ? 'PASS' : 'FAIL';
      console.log(`Level ${lvl.id}: hintSegs=${hint.length} ink=${Math.round(totalLen)}/${lvl.inkLimit} ${withinInk?'OK':'OVER'} fillRatio=${fr.toFixed(3)} ${status}`);
      if (status === 'PASS') pass++; else { fail++; failures.push({id: lvl.id, fillRatio: +fr.toFixed(3), totalLen: Math.round(totalLen), limit: lvl.inkLimit, withinInk, won}); }
    } catch (e) {
      console.log(`Level ${lvl.id}: ERROR ${e.message}`);
      fail++;
      failures.push({id: lvl.id, error: e.message});
    }
  }
  console.log(`\n=== happy-glass: ${pass}/${LEVELS.length} PASS, ${fail} FAIL, ${Date.now()-startAll}ms ===`);
  if (failures.length) {
    console.log('FAILURES:');
    for (const f of failures) console.log(' ', JSON.stringify(f));
  }
  process.exit(fail > 0 ? 1 : 0);
})();
