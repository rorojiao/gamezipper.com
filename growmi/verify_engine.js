#!/usr/bin/env node
/* growmi in-engine verifier (Type A, verifier-spec.md).
 * 30 levels (worm + stars + spikes + pushable blocks + switch/door + patrol
 * enemies + move limit). Engine lives in an IIFE => per spec, source surgery
 * injects the search driver before the IIFE's closing "})();" so it can read/write
 * the engine's closure vars directly. Search transitions ARE the engine: each node
 * restores a snapshot into the engine globals and calls moveWorm(dx,dy) — the same
 * function every real input path (keydown/touch buttons) calls; victory is detected
 * via saveData.best[idx] (written only by winLevel(), on worm reaching the exit with
 * all stars collected). The found path is then replayed on a fresh startLevel.
 *
 * Search notes:
 * - worm.body coordinates are never read by game logic (no self-collision check;
 *   moveWorm/checkTile/die only consult body.length>0, growing, growTimer) — the
 *   state key carries bodyLen instead of the segment list.
 * - moveCount is NOT in the key: BFS/A* reaches each logical state at minimal depth;
 *   the engine itself refuses moves past level.moves, so the budget is enforced by
 *   the engine, not by the verifier.
 * - Small state spaces get weight=1 A* (exhaustion == proof of unsolvability within
 *   the move cap); large ones fall back to weighted A* (w=2.5) which still only
 *   returns engine-legal wins — the cap makes any found win valid.
 * - The undo history is stubbed out during search only (moveWorm deep-copies state
 *   into it every move); die()'s fallback path then calls resetLevel(), which is
 *   state-identical to restoring the move-0 snapshot. replay() uses the real engine.
 *
 * Engine bugs fixed for this run (index.html):
 *  1. lv() factory used .map(p) on [[x,y],...] arrays — p(x,y) takes two args, so
 *     map passed the array as x and the index as y: every wall/spike/star coordinate
 *     was off-grid (walls invisible, stars uncollectable) — all 30 levels unwinnable.
 *  2. isDoor() scanned activeDoors (doors OPENED by switches), inverting the switch
 *     mechanic: opened doors blocked, closed doors were passable.
 * Data fixes: see FIX comments in generateLevels() — levels whose move budget made
 * them unwinnable got recalibrated `moves` values.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scriptMatches = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)];
const scripts = scriptMatches.map(m => m[1]);

const ENGINE_IDX = scripts.findIndex(s => s.includes('function moveWorm') && /\}\)\(\);\s*$/.test(s));
if (ENGINE_IDX < 0) { console.error('engine script/anchor not found'); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', extra: 'no-anchor' })); process.exit(1); }

const DRIVER = `
;globalThis.__growmi = (function(){
  var DIRS = [[0,-1,'u'],[0,1,'d'],[-1,0,'l'],[1,0,'r']];
  var baseGrid = null, doorList = null, starXY = null, exitXY = null;
  var lastGridSig = null;
  var HIST_STUB = { push: function(){}, length: 0, find: function(){ return null; } };
  function captureBase(){
    baseGrid = [];
    for(var y=0;y<level.rows;y++){
      baseGrid[y]=[];
      for(var x=0;x<level.cols;x++){
        baseGrid[y][x] = level.grid[y][x]===4 ? 0 : level.grid[y][x];
      }
    }
    doorList = level.doors.map(function(d){return d;});
    starXY = stars.map(function(s){return [s.x,s.y];});
    exitXY = [exitPos.x, exitPos.y];
    lastGridSig = null;
  }
  function rebuildGrid(blocks, doorOpen){
    var g = [];
    for(var y=0;y<level.rows;y++){ g[y]=baseGrid[y].slice(); }
    for(var i=0;i<blocks.length;i++){ g[blocks[i].y][blocks[i].x] = 4; }
    if(doorOpen){
      for(var j=0;j<doorList.length;j++){
        var d2=doorList[j];
        if(d2.color==='blue' && g[d2.y][d2.x]===6) g[d2.y][d2.x]=0;
      }
    }
    level.grid = g;
    activeDoors = doorOpen ? doorList.filter(function(dd){return dd.color==='blue';})
                                   .map(function(dd){return {x:dd.x,y:dd.y};}) : [];
  }
  function snap(){
    var bl=[], st=[], en=[];
    for(var i2=0;i2<level.blocks.length;i2++){ bl.push(level.blocks[i2].x, level.blocks[i2].y); }
    for(var i3=0;i3<stars.length;i3++){ st.push(stars[i3].collected?1:0); }
    for(var i4=0;i4<level.enemies.length;i4++){ var e=level.enemies[i4]; en.push(e.x,e.y,e.pathIndex,e.moveCounter); }
    var sw=[]; for(var k in switchesActive){ if(switchesActive[k]) sw.push(k); } sw.sort();
    return [worm.x, worm.y, worm.growing?1:0, worm.growTimer, worm.body.length, bl, st, sw, en,
            enemyTurnCounter, moveCount, starsCollected];
  }
  function keyOf(d){
    var sw = d[7].join(';');
    var en = [];
    for(var i=0;i<d[8].length;i+=4){ en.push(d[8][i+2], d[8][i+3]); }
    return d[0]+','+d[1]+','+d[2]+','+d[3]+','+d[4]+'|'+d[5].join(',')+'|'+
           d[6].join('')+'|'+sw+'|'+en.join(',')+'|'+d[9]+'|'+d[11];
  }
  function restore(d){
    worm.x=d[0]; worm.y=d[1]; worm.growing=!!d[2]; worm.growTimer=d[3];
    worm.body=[]; for(var i=0;i<d[4];i++){ worm.body.push({x:d[0],y:d[1]}); }
    level.blocks=[]; for(var i2=0;i2<d[5].length;i2+=2){ level.blocks.push({x:d[5][i2],y:d[5][i2+1]}); }
    for(var i3=0;i3<stars.length;i3++){ stars[i3].collected = !!d[6][i3]; }
    switchesActive={}; for(var i4=0;i4<d[7].length;i4++){ switchesActive[d[7][i4]]=true; }
    for(var i5=0;i5<level.enemies.length;i5++){
      var e=level.enemies[i5], o=i5*4;
      e.x=d[8][o]; e.y=d[8][o+1]; e.pathIndex=d[8][o+2]; e.moveCounter=d[8][o+3];
    }
    enemyTurnCounter=d[9]; moveCount=d[10]; starsCollected=d[11];
    var doorOpen = d[7].length>0;
    var sig = d[5].join(',')+'#'+(doorOpen?1:0);
    if(sig!==lastGridSig){
      rebuildGrid(level.blocks, doorOpen);
      lastGridSig = sig;
    }
    exitActive = starsCollected >= stars.length;
    history = HIST_STUB;
  }
  function heur(d){
    /* wall-free Manhattan bound: nearest uncollected star (each further star costs
     * >=2 more moves), or the exit once all stars are collected. */
    var rem = 0, best = Infinity;
    for(var i=0;i<starXY.length;i++){
      if(!d[6][i]){
        rem++;
        var m = Math.abs(d[0]-starXY[i][0]) + Math.abs(d[1]-starXY[i][1]);
        if(m<best) best=m;
      }
    }
    if(rem>0) return best + (rem-1)*2;
    return Math.abs(d[0]-exitXY[0]) + Math.abs(d[1]-exitXY[1]);
  }
  /* binary min-heap on f */
  function search(idx, nodeCap, timeCapMs, extraMoves, weight){
    startLevel(idx);
    captureBase();
    if(extraMoves){ level.moves += extraMoves; }
    saveData.best[idx] = null;
    var start = snap();
    var dataArr=[start], parentArr=[-1], dirArr=[-1], gArr=[0];
    var seen = new Map(); seen.set(keyOf(start), 0);
    var heapI=[0], heapF=[heur(start)*weight];
    var expanded = 0, gen = 1;
    var t0 = Date.now();
    function push(i, f){
      heapI.push(i); heapF.push(f);
      var c=heapI.length-1;
      while(c>0){
        var p=(c-1)>>1;
        if(heapF[p]<=heapF[c]) break;
        var ti=heapI[p], tf=heapF[p];
        heapI[p]=heapI[c]; heapF[p]=heapF[c]; heapI[c]=ti; heapF[c]=tf;
        c=p;
      }
    }
    function pop(){
      var top=heapI[0], tf=heapF[0];
      var li=heapI.pop(), lf=heapF.pop();
      if(heapI.length){
        heapI[0]=li; heapF[0]=lf;
        var c=0;
        for(;;){
          var l=c*2+1, r=l+1, m=c;
          if(l<heapI.length && heapF[l]<heapF[m]) m=l;
          if(r<heapI.length && heapF[r]<heapF[m]) m=r;
          if(m===c) break;
          var ti=heapI[m], tf2=heapF[m];
          heapI[m]=heapI[c]; heapF[m]=heapF[c]; heapI[c]=ti; heapF[c]=tf2;
          c=m;
        }
      }
      return top;
    }
    while(heapI.length){
      expanded++;
      if(expanded>nodeCap) return { timeout:'nodes', nodes:expanded };
      if((expanded & 1023)===0 && Date.now()-t0>timeCapMs) return { timeout:'time', nodes:expanded };
      var base = pop();
      var d = dataArr[base], g = gArr[base];
      var kBase = keyOf(d);
      if(seen.get(kBase) < g) continue;   /* stale heap entry */
      for(var di=0; di<4; di++){
        var dx=DIRS[di][0], dy=DIRS[di][1];
        restore(d);
        moveWorm(dx,dy);
        if(saveData.best[idx]){
          var seq=[], p=base, dc=di;
          while(p!==-1){ seq.push(dc); dc=dirArr[p]; p=parentArr[p]; }
          seq.reverse();
          var NAMES={0:'u',1:'d',2:'l',3:'r'};
          var path='';
          for(var si=0;si<seq.length;si++){ path += (si? ' ':'') + NAMES[seq[si]]; }
          return { won:true, path:path, moves:moveCount, nodes:expanded, generated:gen };
        }
        var nd = snap();
        var kk = keyOf(nd);
        var ng = moveCount;   /* engine move counter == path cost g */
        if(!seen.has(kk) || seen.get(kk) > ng){
          seen.set(kk, ng);
          dataArr.push(nd); parentArr.push(base); dirArr.push(di); gArr.push(ng);
          push(gen, ng + weight*heur(nd));
          gen++;
        }
      }
    }
    return { won:false, nodes:expanded, states:seen.size };
  }
  function replay(idx, pathStr){
    startLevel(idx);
    saveData.best[idx] = null;
    var M = { u:[0,-1], d:[0,1], l:[-1,0], r:[1,0] };
    var moves = pathStr ? pathStr.split(' ') : [];
    for(var i=0;i<moves.length;i++){
      moveWorm(M[moves[i]][0], M[moves[i]][1]);
      if(saveData.best[idx]) break;
    }
    return { won: !!saveData.best[idx], moves: moveCount,
             stars: starsCollected+'/'+stars.length, best: saveData.best[idx] };
  }
  function setMoves(idx, m){
    /* analysis-only hook (used by the one-off repair script to measure a level's
     * true minimal move requirement; startLevel copies this into level.moves, so it
     * survives die()'s resetLevel path). The verifier itself never calls it. */
    LEVELS[idx].moves = m;
  }
  return { search: search, replay: replay, nLevels: LEVELS.length, setMoves: setMoves, LEVELS: LEVELS }; // LEVELS exported for surgery tooling (mutation is live — startLevel re-reads it)
})();
`;
scripts[ENGINE_IDX] = scripts[ENGINE_IDX].replace(/\}\)\(\);\s*$/, DRIVER + '\n})();');

const el = () => ({ textContent: '', innerHTML: '', value: '', className: '', classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: { display: '' },
  addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  getContext: () => new Proxy({}, { get: (t, p) => {
    if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 10 });
    if (typeof p === 'string' && !(p in t)) return () => 1;
    return t[p];
  }, set: () => true }),
  width: 400, height: 400, clientWidth: 440, clientHeight: 600,
  parentElement: { clientWidth: 440, clientHeight: 600, appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {} }, style: {} },
  appendChild() {}, removeChild() {}, remove() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
  dataset: {}, focus() {}, blur() {}, disabled: false, preventDefault() {} });

function ACStub() { const node = () => ({ connect() { return node(); }, disconnect() {}, start() {}, stop() {}, type: '', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  this.state = 'running'; this.currentTime = 0; this.destination = {}; this.sampleRate = 44100; this.resume = () => {}; this.close = () => {};
  this.createOscillator = node; this.createGain = node; this.createBufferSource = node; this.createBiquadFilter = node; this.createBuffer = () => ({ getChannelData: () => new Float32Array(100) }); }

const ctx = { console: { log() {}, error() {}, warn() {} }, Date, JSON, Math,
  setTimeout: (f) => { return 0; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => Date.now() },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem(k, v) { m[k] = String(v); }, removeItem(k) { delete m[k]; } }; })(),
  navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {} }, location: { href: 'http://localhost/growmi/', search: '', hash: '' },
  document: { getElementById: el, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, createElement: el,
    body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {} } }, documentElement: el(), hidden: false, visibilityState: 'visible', cookie: '' },
  AudioContext: ACStub, webkitAudioContext: ACStub, alert() {}, confirm: () => true, prompt: () => '',
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve(''), ok: true }),
  XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
  addEventListener() {}, removeEventListener() {},
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
  adsbygoogle: [] };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
ctx.innerWidth = 1280; ctx.innerHeight = 720; ctx.devicePixelRatio = 1;
let seed = 12345;
ctx.Math = Object.create(Math);
ctx.Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
vm.createContext(ctx);
const loadErrors = [];
scripts.forEach((s, i) => { try { vm.runInContext(s, ctx, { filename: 'inline-' + i + '.js' }); } catch (e) { loadErrors.push('script#' + i + ': ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); } });
if (!ctx.__growmi) { console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL', extra: 'bridge-missing', loadErrors })); process.exit(1); }
const G = ctx.__growmi;

const T0 = Date.now();
const BUDGET = 106000;
const results = new Array(G.nLevels).fill(null);

function attempt(idx, timeCap, weight) {
  try { return G.search(idx, 1500000, timeCap, 0, weight); }
  catch (e) { return { error: String(e).slice(0, 140) }; }
}

const phase1 = [];
for (let idx = 0; idx < G.nLevels; idx++) {
  const left = BUDGET - (Date.now() - T0);
  if (left < 4000) { results[idx] = results[idx] || { timeout: 'global' }; phase1.push(idx); continue; }
  const cap = Math.min(6000, left / 2 / G.nLevels + 1500);
  const r = attempt(idx, cap, 1);
  results[idx] = r;
  if (r.won) console.log(`L${idx + 1} solved ${r.moves}`);
  else phase1.push(idx);
}
/* phase 2: weighted A* with generous shared budget for the hard ones */
const hard = phase1.slice();
for (const idx of hard) {
  const left = BUDGET - (Date.now() - T0);
  if (left < 3000) break;
  const share = left / Math.max(1, hard.length - hard.indexOf(idx));
  const cap = Math.max(5000, Math.min(left - 2000, share));
  const r = attempt(idx, cap, 2.5);
  if (!r.won && !r.timeout && !r.error) {
    /* exhaustion at w=2.5 is not a proof; re-verify exhaustion with w=1 */
    const r2 = attempt(idx, Math.max(3000, cap), 1);
    Object.assign(r, r2, { weightedExhausted: true });
  }
  results[idx] = r;
  console.log(`L${idx + 1} hard ${r.won ? 'solved ' + r.moves : (r.timeout ? 'TIMEOUT(' + r.timeout + ') nodes=' + r.nodes : (r.error ? 'ERR ' + r.error : 'UNSOLVABLE states=' + r.states))}`);
}

let pass = 0, fail = 0; const fails = [];
for (let idx = 0; idx < G.nLevels; idx++) {
  const r = results[idx];
  if (!r || !r.won) { fail++; fails.push(`L${idx + 1} ${r && r.timeout ? 'timeout-' + r.timeout : (r && r.error ? 'error' : 'unsolvable')}`); continue; }
  let rep;
  try { rep = G.replay(idx, r.path); } catch (e) { fail++; fails.push(`L${idx + 1} replay-err`); continue; }
  if (rep.won) { pass++; console.log(`L${idx + 1} PASS replay ${rep.moves} moves (search ${r.moves}) stars=${rep.stars}`); }
  else { fail++; fails.push(`L${idx + 1} replay-mismatch`); console.log(`L${idx + 1} REPLAY MISMATCH ${JSON.stringify(rep)}`); }
}
if (loadErrors.length) { fail++; fails.push('load-errors'); console.log(loadErrors.join('\n')); }
const durS = +((Date.now() - T0) / 1000).toFixed(1);
console.log(JSON.stringify({ pass, fail, fails, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', extra: { levels: G.nLevels, durS } }));
process.exit(fail === 0 ? 0 : 1);
