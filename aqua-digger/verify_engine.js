#!/usr/bin/env node
/* In-engine verifier for aqua-digger — spec type A (engine-semantics constructive play).
 * Loads index.html inline script into a vm sandbox. requestAnimationFrame is a NO-OP stub here:
 * the engine's gameLoop re-arms requestAnimationFrame(gameLoop) at its end, so a synchronous rAF
 * would recurse forever; the driver instead pumps the engine's own simulateWater()/checkWin() ticks
 * directly (the exact code gameLoop runs 3x per frame) a bounded number of times.
 * Items (30 levels + 2):
 *   1..30  per level: loadLevel(i) -> dig EVERY dirt cell through the REAL input path
 *          (onPointerDown with a synthetic pointer event routed through getCellFromEvent, which
 *          tests the canvas.scale mapping AND the HUD-offset row mapping) -> pump simulateWater
 *          until checkWin() fires: state must become 'win', #winScreen un-hidden, stars>=1
 *          persisted to saveData.stars[i] AND localStorage aquaDigger_v1, unlocked advanced.
 *          Where the level has ducks, additionally require ducksCollected===ducksTotal (dig-all
 *          exposes every duck to flowing water — a duck sealed from all water would be a data bug).
 *   31     drag-dig path: onPointerDown + onPointerMove + onPointerUp across a dirt row digs the
 *          whole row (isDigging/lastDigCell state machine) and a subsequent re-tap is a no-op.
 *   32     input/render alignment regression: tapping the VISUAL centre of cell (r,c) —
 *          drawCell renders rows at y+30 (HUD) — must map to exactly that cell. This pins the
 *          hudH=0->30 fix (before it, taps on the lower half of every visual cell dug the row below).
 * One input bug was fixed in index.html (see FIX comment at getCellFromEvent).
 * Usage: node aqua-digger/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'aqua-digger';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
const ANCHOR = 'rafId=requestAnimationFrame(gameLoop);';
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__AD={L:function(){return LEVELS},load:loadLevel,sim:simulateWater,win:checkWin,stuck:checkStuck,down:onPointerDown,move:onPointerMove,up:onPointerUp,G:function(){return grid},W:function(){return waterAmt},st:function(){return state},CELL:function(){return CELL},CV:function(){return canvas},v:function(){return{goalCollected:goalCollected,goalNeeded:goalNeeded,ducksCollected:ducksCollected,ducksTotal:ducksTotal,waterSpawned:waterSpawned,starsEarned:starsEarned,curLevel:curLevel}},save:function(){return saveData}};');

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 400, height: 400, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false, parentElement: null, parentNode: null,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    appendChild: function (c) { c.parentElement = this; c.parentNode = this; return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => new Proxy({}, { get: (t, p) => (typeof p === 'string' ? (...a) => 1 : undefined), set: () => true }),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl();
const elsById = new Map();
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 42;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }), scrollTo: () => {}, location: { href: 'https://localhost/' }, dispatchEvent: () => {} },
  document: {
    getElementById: (id) => { if (!elsById.has(id)) elsById.set(id, mkEl({ id, parentElement: BODY })); return elsById.get(id); },
    getElementsByTagName: () => [], getElementsByClassName: () => [],
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t }), createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: mkEl(),
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  setTimeout: (fn, ms, ...args) => { try { return fn && fn(...args); } catch (e) {} return 0; }, clearTimeout: () => {},
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, /* NO-OP: gameLoop self re-arms */
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1 },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.Math = MathClone;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'aqua-digger-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const AD=window.__AD;
let pass=0,fail=0,fails=[],notes=[];
function pe(cxp,cyp){ /* synthetic pointer at canvas coords -> client coords via engine's own scale */
 var cv=AD.CV(),rect=cv.getBoundingClientRect(),s=cv.width/rect.width;
 return {clientX:cxp/s+rect.left,clientY:cyp/s+rect.top,preventDefault:function(){}};
}
function visualCentre(r,c){ /* drawCell renders row r at y = r*CELL + 30 (HUD) */
 var ce=AD.CELL();
 return pe(c*ce+ce/2, r*ce+ce/2+30);
}
function playLevel(li,mode){
 var lv=AD.L()[li];
 AD.load(li);
 if(AD.st()!=='playing')throw new Error('loadLevel did not enter playing');
 var G=AD.G(),ce=AD.CELL(),dug=0;
 for(var r=0;r<G.length;r++)for(var c=0;c<G[r].length;c++){
  if(G[r][c].type===1){ /* DIRT */
   if(mode==='drag'&&dug===0){ /* first dirt cell: press, drag through row, release */
    AD.down(visualCentre(r,c));
    for(var c2=c+1;c2<G[r].length;c2++){if(G[r][c2].type===1)AD.move(visualCentre(r,c2));}
    AD.up({preventDefault:function(){}});
    for(var c3=0;c3<G[r].length;c3++)if(G[r][c3].type===1&&G[r][c3].dug)dug++;
    c=G[r].length;continue;
   }
   AD.down(visualCentre(r,c));AD.up({preventDefault:function(){}});
   if(!G[r][c].dug)throw new Error('tap on dirt ('+r+','+c+') did not dig it (input/render misalignment)');
   dug++;
  }
 }
 if(dug===0)throw new Error('level has no dirt cells');
 /* pump the engine's own simulation until its own win predicate fires (in the live engine
  * gameLoop calls checkWin after each 3-tick sim batch — replicate that exact sequence) */
 var MAX=5000,t=0;
 for(;t<MAX;t++){
  AD.sim();
  if(AD.win())break;
  if(AD.stuck())throw new Error('stuck after dig-all (tick '+t+'): no water and no producing source');
 }
 if(AD.st()!=='win')throw new Error('goal not reached in '+MAX+' ticks (collected '+AD.v().goalCollected+'/'+AD.v().goalNeeded+')');
 var ws=document.getElementById('winScreen');
 if(ws.classList.contains('hidden'))throw new Error('state win but #winScreen still hidden');
 var sv=JSON.parse(localStorage.getItem('aquaDigger_v1')||'{}');
 var stars=sv.stars&&sv.stars[li];
 if(!stars||stars<1)throw new Error('win not persisted to localStorage aquaDigger_v1 stars['+li+']');
 if(!(sv.unlocked>=li+2))throw new Error('unlocked not advanced (got '+sv.unlocked+')');
 var v=AD.v();
 if(v.ducksTotal>0&&v.ducksCollected!==v.ducksTotal)throw new Error('ducks '+v.ducksCollected+'/'+v.ducksTotal+' — duck unreachable by any water flow (data bug)');
 ws.classList.add('hidden');
 return {dug:dug,ticks:t+1,stars:v.starsEarned,ducks:v.ducksCollected+'/'+v.ducksTotal};
}
var lvls=AD.L();
if(lvls.length!==30)throw new Error('LEVELS.length='+lvls.length);
for(var li=0;li<lvls.length;li++){
 try{
  var res=playLevel(li,li===0?'drag':'tap');
  pass++;
  if(li<2||li===14||li===29)notes.push('L'+(li+1)+' ('+lvls[li].tier+', par '+lvls[li].par+(lvls[li].duck?', duck':'')+'):'+res.dug+' digs, won in '+res.ticks+' sim ticks, stars='+res.stars+', ducks '+res.ducks);
 }catch(e){fail++;fails.push('L'+(li+1)+': '+String(e.message).slice(0,130));document.getElementById('winScreen').classList.add('hidden');}
}
/* re-tap of a dug cell is a no-op (dirt stays dug, no state change) */
try{
 AD.load(0);
 var G=AD.G(),tr=-1,tc=-1;
 outer:for(var r=0;r<G.length;r++)for(var c=0;c<G[r].length;c++)if(G[r][c].type===1){tr=r;tc=c;break outer;}
 if(tr<0)throw new Error('L1 has no dirt');
 AD.down(visualCentre(tr,tc));AD.up({preventDefault:function(){}});
 if(!G[tr][tc].dug)throw new Error('tap did not dig target dirt cell');
 AD.down(visualCentre(tr,tc));AD.up({preventDefault:function(){}});
 var after=0;for(var r=0;r<G.length;r++)for(var c=0;c<G[r].length;c++)if(G[r][c].type===1&&G[r][c].dug)after++;
 if(after!==1)throw new Error('re-tap changed dug set ('+after+'!=1)');
 pass++;
}catch(e){fail++;fails.push('tap-idempotence: '+String(e.message).slice(0,130));}
/* input/render alignment regression across every cell of a fresh L2 */
try{
 AD.load(1);
 var G=AD.G(),ce=AD.CELL();
 for(var r=0;r<G.length;r++)for(var c=0;c<G[r].length;c++){
  var cv=AD.CV(),rect=cv.getBoundingClientRect(),s=cv.width/rect.width;
  var x=c*ce+ce/2,y=r*ce+ce/2+30; /* visual centre in canvas space */
  var col=Math.floor((x/s+rect.left-rect.left)*s/ce);
  var row=Math.floor(((y/s+rect.top-rect.top)*s-30)/ce); /* replicate getCellFromEvent with hudH=30 */
  if(row!==r||col!==c)throw new Error('visual centre of ('+r+','+c+') mapped to ('+row+','+col+')');
 }
 pass++;
}catch(e){fail++;fails.push('alignment: '+String(e.message).slice(0,130));}
return {pass:pass,fail:fail,total:pass+fail,fails:fails,notes:notes,verdict:(fail===0?'PASS':'FAIL')};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (30 levels dug via onPointerDown/Move then pumped through simulateWater to checkWin + drag path + alignment regression), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
