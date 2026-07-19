#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const extractLevels = require('../.audit/gz-extract-levels.js');

const GAME = process.argv[2];
const EXPECTED = { 'marble-run': 20, 'bus-traffic-fever': 30 };
if (!EXPECTED[GAME]) {
  console.error('Usage: node .audit/verify-state-sequence-games.js <marble-run|bus-traffic-fever>');
  process.exit(2);
}

const html = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
const levels = extractLevels(GAME);
if (!Array.isArray(levels) || levels.length !== EXPECTED[GAME]) {
  console.error(`${GAME}: LEVELS extraction mismatch: expected ${EXPECTED[GAME]}, got ${levels && levels.length}`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function verifyMarbleRun() {
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
  const refs = [...html.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(m => m[1]);
  const missingRefs = [...new Set(refs.filter(id => !ids.has(id)))];
  assert(missingRefs.length === 0, `missing DOM ids: ${missingRefs.join(',')}`);
  assert(/function saveGame\(\)[\s\S]*localStorage\.setItem\('marblerun_save'/.test(html), 'saveGame does not write marblerun_save');
  assert(/function loadGame\(\)[\s\S]*localStorage\.getItem\('marblerun_save'/.test(html), 'loadGame does not read marblerun_save');
  assert(/if\(d&&d\.v===state\.saveVersion\)/.test(html), 'save-version guard missing');
  assert(/state\.unlocked=Math\.max\(state\.unlocked,state\.currentLevel\+2\)/.test(html), 'next-level unlock transition missing');
  assert(/state\.levelStars\[state\.currentLevel\]=Math\.max\(prev,stars\)/.test(html), 'best-star monotonic transition missing');
  assert(/document\.getElementById\('btn-next'\)\.style\.display=state\.currentLevel<LEVELS\.length-1/.test(html), 'final-level next-button guard missing');
  assert(/window\.addEventListener\('beforeunload',cleanup\)/.test(html), 'beforeunload cleanup missing');
  assert(/function cleanup\(\)[\s\S]*cancelAnimationFrame\(state\.animFrame\)[\s\S]*audioCtx\.close/.test(html), 'rAF/audio cleanup incomplete');
  assert(levels.every((L, i) => L && L.start && L.finish && Array.isArray(L.stars) && Array.isArray(L.fixed) && Number.isFinite(L.budget) && L.budget > 0 && L.start.r >= 0 && L.start.r < 8 && L.start.c >= 0 && L.start.c < 10 && L.finish.r >= 0 && L.finish.r < 8 && L.finish.c >= 0 && L.finish.c < 10), 'invalid level bounds or schema');
  console.log(`marble-run: ${levels.length}/${levels.length} level schemas valid; state transitions and persistence/cleanup invariants PASS`);
}

function makeEl(id) {
  return {
    id, style: {}, textContent: '', innerHTML: '', dataset: {}, className: '', offsetLeft: 0, offsetTop: 0,
    children: [],
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    addEventListener(){}, appendChild(){}, insertBefore(){}, remove(){},
    querySelectorAll(){ return []; },
    getBoundingClientRect(){ return { left: 0, top: 0, width: 640, height: 640 }; },
    getContext(){ return makeCtx(); }
  };
}
function makeCtx() {
  const grad = { addColorStop(){} };
  return new Proxy({}, { get(target, prop) {
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => grad;
    if (prop === 'measureText') return () => ({ width: 10 });
    if (!(prop in target)) target[prop] = () => {};
    return target[prop];
  }, set(target, prop, value){ target[prop] = value; return true; } });
}

function verifyBus() {
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes("var SAVE_KEY='btf_save_v1'") && s.includes('function checkWin'));
  assert(script, 'production engine script not found');
  const instrumentedScript = script.replace('var LEVELS=[', 'window.__LEVELS=[').replace('LEVELS.forEach(', 'window.__LEVELS.forEach(').replace(/LEVELS\[/g, 'window.__LEVELS[').replace(/LEVELS\.length/g, 'window.__LEVELS.length').replace('var G={', 'window.__G={').replace(/\bG\./g, 'window.__G.').replace("var save=loadSave();", "window.__save=loadSave();").replace(/\bsave\./g, 'window.__save.').replace(/\bsave=/g, 'window.__save=').replace(/saveSave\(save\)/g, 'saveSave(window.__save)');
  const store = new Map();
  const elements = new Map();
  const document = {
    readyState: 'loading', hidden: false, body: makeEl('body'),
    getElementById(id){ if (!elements.has(id)) elements.set(id, makeEl(id)); return elements.get(id); },
    createElement(tag){ return makeEl(tag); }, querySelector(){ return makeEl('query'); }, querySelectorAll(){ return []; }, addEventListener(){}
  };
  document.getElementById('canvas-wrap').clientWidth = 680;
  document.getElementById('game-canvas').getContext = () => makeCtx();
  const sandbox = {
    console, document,
    window: { addEventListener(){}, devicePixelRatio: 1, innerHeight: 700 },
    localStorage: { getItem(k){ return store.has(k) ? store.get(k) : null; }, setItem(k,v){ store.set(k,String(v)); }, removeItem(k){ store.delete(k); } },
    navigator: {}, location: { pathname: '/bus-traffic-fever/' },
    confirm(){ return false; },
    setTimeout(fn){ return 1; }, clearTimeout(){}, setInterval(){ return 1; }, clearInterval(){},
    requestAnimationFrame(){ return 1; }, cancelAnimationFrame(){}, performance: { now(){ return 0; } },
    AudioContext: function(){}, Math, Date, JSON, Map, Set, Array, Object, String, Number, Boolean, RegExp, Error, parseInt, parseFloat, isFinite, isNaN
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.document = document;
  sandbox.window.localStorage = sandbox.localStorage;
  vm.createContext(sandbox);
  const exposeInside = `\nObject.assign(window, { loadLevel, checkWin, loadSave, saveSave, cleanup, stopBGM });\n`;
  const instrumentedWithExpose = instrumentedScript.replace(/\}\)\(\);\s*$/, exposeInside + '})();');
  vm.runInContext(instrumentedWithExpose, sandbox, { timeout: 10000 });
  const result = vm.runInContext(`(() => {
    const LEVELS = window.__LEVELS, G = window.__G;
    G.canvas = document.getElementById('game-canvas');
    G.ctx = G.canvas.getContext('2d');
    const loadLevel = window.loadLevel, checkWin = window.checkWin, loadSave = window.loadSave;
    if (!Array.isArray(LEVELS) || LEVELS.length !== 30) throw new Error('production LEVELS count');
    for (let i = 0; i < LEVELS.length; i++) {
      loadLevel(i);
      if (G.buses.length !== LEVELS[i].v.length) throw new Error('bus count L' + (i+1));
      G.animating = false;
      G.buses.forEach(b => { b.alive = false; b.exiting = false; });
      const beforeUnlocked = window.__save.unlocked;
      checkWin();
      const expectedUnlocked = (i + 1 < LEVELS.length) ? Math.max(beforeUnlocked, i + 2) : beforeUnlocked;
      if (window.__save.unlocked !== expectedUnlocked) throw new Error('unlock L' + (i+1));
      const blob = JSON.parse(localStorage.getItem('btf_save_v1'));
      if (!blob || blob.v !== 1 || !blob.stars[String(i+1)]) throw new Error('persist L' + (i+1));
    }
    const saved = localStorage.getItem('btf_save_v1');
    window.__save = loadSave();
    if (localStorage.getItem('btf_save_v1') !== saved || window.__save.v !== 1 || window.__save.unlocked !== 30) throw new Error('reload');
    return { levels: LEVELS.length, unlocked: window.__save.unlocked, persisted: Object.keys(window.__save.stars).length };
  })()`, sandbox, { timeout: 15000 });
  assert(result.levels === 30 && result.persisted === 30 && result.unlocked === 30, 'state sequence result mismatch');
  assert(/window\.addEventListener\('beforeunload',cleanup\)/.test(html), 'beforeunload cleanup missing');
  assert(/function cleanup\(\)[\s\S]*cancelAnimationFrame\(G\.rafId\)[\s\S]*stopBGM/.test(html), 'rAF/BGM cleanup incomplete');
  console.log(`bus-traffic-fever: ${result.levels}/${result.levels} production checkWin transitions PASS; persisted=${result.persisted}, unlocked=${result.unlocked}, cleanup PASS`);
}

try {
  if (GAME === 'marble-run') verifyMarbleRun();
  else verifyBus();
} catch (e) {
  console.error(`${GAME}: FAIL — ${e.message}`);
  process.exit(1);
}
