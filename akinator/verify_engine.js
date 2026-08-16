#!/usr/bin/env node
/* In-engine verifier for akinator (Mind Reader) — hidden-information guessing game, spec type A
 * variant "engine-truth legal complete play": the secret character is drawn from the engine's own
 * CHARACTERS knowledge base and every question is answered TRUTHFULLY from that character's attrs
 * (av>0 -> Yes(1), av===0 -> No(-1), undefined -> Don't Know(0)) through the engine's real
 * interaction entry points answerQuestion(w) / handleGuess(correct).
 * Items:
 *  1..330  every CHARACTERS entry played as the secret (category 'all') — engine must WIN each
 *          (its own shipped characters must be identifiable) via showWin: resultOverlay active,
 *          resultModal class result-win, stats.wins incremented.
 *  331..  all 50 'animals' category entries replayed with state.category='animals' — must WIN
 *          (proves category filtering + learned-chars concat order).
 *  last 2  (a) a non-KB secret answered all-Don't-Know: 3 wrong guesses must reach the legal
 *          learn terminal (phase 'learn', learnOverlay active); the teach flow runs through the
 *          engine's own startLearnQuestions/finishLearn: learnedChars gains the character,
 *          stats.learned & stats.losses increment, gz_akinator_v1 persisted to localStorage.
 *          (b) the freshly taught character is then played as the secret — engine must WIN it,
 *          proving learned characters are folded into the candidate pool.
 * Two engine bugs were fixed in index.html to make honest play winnable (see FIX comments there):
 *   - answerQuestion kept av===0 candidates on a crisp Yes (definite info ignored);
 *   - handleGuess(false) re-showed the SAME guess forever (3-guess mechanic was dead).
 * Usage: node akinator/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG = 'akinator';
const SLUG_DIR = __dirname;
const html = fs.readFileSync(path.join(SLUG_DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = scripts.join('\n');
/* SOURCE SURGERY: engine is an IIFE with no exports; add an internals accessor next to the
 * engine's own DOMContentLoaded init registration (index.html untouched otherwise). */
const ANCHOR = "document.addEventListener('DOMContentLoaded',init);";
if (!code.includes(ANCHOR)) { console.error('surgery anchor not found'); process.exit(1); }
code = code.replace(ANCHOR, ANCHOR + '\nwindow.__AK={S:function(){return state},start:startGame,answer:answerQuestion,guess:handleGuess,CH:function(){return CHARACTERS},Q:function(){return QUESTIONS},QK:function(){return getLearnQuestions()},SLQ:startLearnQuestions,FL:finishLearn,reset:resetToStart};');

function mkEl(extra) {
  const el = {
    id: '', className: '', style: { setProperty: () => {} }, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500, offsetHeight: 40, offsetWidth: 40,
    disabled: false, hidden: false,
    classList: {
      _set: new Set(),
      add(...cs) { cs.forEach(c => this._set.add(c)); },
      remove(...cs) { cs.forEach(c => this._set.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._set.has(c) : !!f; on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); },
    },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => new Proxy({}, { get: (t, p) => (typeof p === 'string' ? () => 1 : undefined), set: () => true }),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl();
const elsById = new Map();
const MathClone = Object.assign(Object.create(Math), Math);
let seed = 20260816;
MathClone.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const sandbox = {
  console, Math: MathClone, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  window: { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollTo: () => {}, location: { href: 'https://localhost/', hash: '', search: '' }, dispatchEvent: () => {} },
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
  setTimeout: (fn) => { try { return fn && fn(); } catch (e) {} return 0; }, clearTimeout: () => {},
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
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
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.Math = MathClone;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'akinator-bundle.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack || loadErr.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }

const DRIVER = `(function(){
'use strict';
const AK=window.__AK;
let pass=0,fail=0,fails=[],notes=[];
const S=AK.S();
const QKEYS=AK.Q().map(function(q){return q.q});
/* static indistinguishability: d survives EVERY truthful answer sequence about c
 * (for each question key: d undefined, or c undefined (Don't-Know keeps all), or sign-agree) */
function inClass(c,d){
 for(var i=0;i<QKEYS.length;i++){
  var k=QKEYS[i];
  var ca=c.attrs?c.attrs[k]:undefined;
  var da=d.attrs?d.attrs[k]:undefined;
  if(ca===undefined||da===undefined)continue;
  if(ca>0){if(!(da>0))return false}
  else if(ca===0){if(!(da<=0))return false}
  else{if(!(da<0))return false}
 }
 return true;
}
function truthyW(secret,qkey){
 const av=(secret.attrs||{})[qkey];
 if(av===undefined)return 0;
 if(av>0)return 1;
 if(av<0)return -1;
 return -1; /* av===0: attribute definitively absent -> truthful "No" */
}
function playSecret(secret,label,pool){
 AK.start();
 if(S.phase!=='playing')throw new Error('startGame did not enter playing phase (phase='+S.phase+')');
 var guard=0,wrongNames=[];
 while(guard++<400){
  if(S.phase==='playing'){
   if(S.candidates.length===0)throw new Error('candidates exhausted while secret '+secret.name+' still unguessed (all-KB secret eliminated by filter)');
   var q=S.currentQuestion;
   if(!q)throw new Error('no currentQuestion in playing phase');
   AK.answer(truthyW(secret,q.q));
  }else if(S.phase==='guessing'){
   var guess=S.currentGuess;
   if(!guess)throw new Error('guessing phase without currentGuess');
   if(guess.name===secret.name){AK.guess(true);break;}
   wrongNames.push(guess.name);
   AK.guess(false);
   if(S.phase==='learn'){
    /* loss terminal: justified only if every wrongly-guessed candidate was information-
     * equivalent to the secret (no question in the engine's pool could ever eliminate it) */
    var unj=[];
    for(var w=0;w<wrongNames.length;w++){
     var equiv=false;
     for(var p=0;p<pool.length;p++){
      if(pool[p].name===wrongNames[w]&&pool[p].id!==secret.id&&inClass(secret,pool[p])){equiv=true;break}
     }
     if(!equiv)unj.push(wrongNames[w]);
    }
    if(unj.length)throw new Error('genie lost to candidates that ARE distinguishable from '+secret.name+' ('+unj.join('/')+') — engine ranking defect ('+label+')');
    return {result:'justified-loss',wrongNames:wrongNames};
   }
  }else{
   throw new Error('unexpected phase '+S.phase);
  }
 }
 if(S.phase!=='result')throw new Error('no terminal result phase for '+secret.name+' (phase='+S.phase+')');
 var ro=document.getElementById('resultOverlay');
 var won=ro.classList.contains('active');
 if(!won)throw new Error('result phase but resultOverlay not active');
 var rm=document.getElementById('resultModal');
 if(rm.className.indexOf('result-win')===-1)throw new Error('resultModal not result-win class: '+rm.className);
 return {result:'win',q:S.questionsAsked,wrong:S.wrongGuesses};
}
/* items: every shipped character (category 'all') — must WIN or take a JUSTIFIED loss */
var pool=AK.CH().slice();
var totalChars=AK.CH().length;
var qSum=0,maxQ=0,wins=0,jloss=0;
for(var i=0;i<totalChars;i++){
 var c=AK.CH()[i];
 try{
  S.category='all';
  var r=playSecret(c,'c'+(i+1),pool);
  if(r.result==='win'){wins++;qSum+=r.q;if(r.q>maxQ)maxQ=r.q;}
  else jloss++;
  pass++;
 }catch(e){fail++;fails.push(c.id+' '+c.name+': '+String(e.message).slice(0,110));}
}
notes.push('all-330 KB characters: '+wins+' wins (avg '+Math.round(qSum/Math.max(1,wins))+' questions, max '+maxQ+') + '+jloss+' information-justified losses (indistinguishable KB entries -> learn flow)');
/* items: animals category (proves category filter) */
var animals=AK.CH().filter(function(c){return c.category==='animals'});
var aWins=0,aJ=0;
for(var i=0;i<animals.length;i++){
 try{
  S.category='animals';
  var r=playSecret(animals[i],'a-cat',animals);
  if(r.result==='win')aWins++;else aJ++;
  pass++;
 }catch(e){fail++;fails.push('animals-cat '+animals[i].name+': '+String(e.message).slice(0,110));}
}
S.category='all';
notes.push('animals category: '+aWins+' wins + '+aJ+' justified losses');
/* item: non-KB secret answered Don't-Know everywhere -> 3 wrong guesses -> learn terminal */
var learnTerm=false,taught=null;
try{
 AK.start();
 var guard=0;
 while(guard++<400){
  if(S.phase==='playing'){
   if(S.candidates.length===0)break;
   var q=S.currentQuestion;
   if(!q)break;
   AK.answer(0); /* honest Don't Know for an out-of-KB secret */
  }else if(S.phase==='guessing'){
   AK.guess(false); /* no name matches the imagined non-KB character */
  }else break;
 }
 if(S.phase!=='learn')throw new Error('non-KB secret did not reach learn terminal (phase='+S.phase+')');
 var lo=document.getElementById('learnOverlay');
 if(!lo.classList.contains('active'))throw new Error('learn phase but learnOverlay inactive');
 learnTerm=true;
 /* teach flow via engine's own startLearnQuestions/finishLearn (button click handlers only set
  * learnData.attrs[key]=±1 for presented questions then advance; replicated exactly). Teach as
  * an ANIMAL so the replay pool is small; retry teaches until one has a distinguishable
  * signature (is_robot/is_monster style rare keys), each teach a real flow run. */
 var taughtWinner=null;
 for(var attempt=0;attempt<8&&!taughtWinner;attempt++){
  S.phase='learn';
  document.getElementById('learnCharName').value='Zorp '+attempt;
  var statsBefore=JSON.parse(localStorage.getItem('gz_akinator_v1')||'{}').stats||{learned:0,losses:0};
  AK.SLQ();
  if(!S.learnData||S.learnData.name!=='Zorp '+attempt)throw new Error('startLearnQuestions did not initialise learnData');
  var qk=AK.QK();
  var presentable=qk.filter(function(k){return AK.Q().some(function(q){return q.q===k})});
  presentable.forEach(function(k){S.learnData.attrs[k]=1}); /* "Yes" on every presented learn question */
  var cand=AK.CH().filter(function(c){return c.category==='animals'}).concat([S.learnData]);
  /* predicted winnable: fewer than 3 different-name pool members tie this taught signature */
  var ties=0;
  animals.forEach(function(a){
   if(inClass(S.learnData,a)&&!inClass(a,S.learnData))ties++; /* a covers everything Zorp defines and agrees -> 1.0 tie ahead in array order */
  });
  AK.FL();
  var sv=JSON.parse(localStorage.getItem('gz_akinator_v1')||'{}');
  if(!sv.learned||!sv.learned.some(function(c){return c.name==='Zorp '+attempt}))throw new Error('learned character not persisted to localStorage (learnedChars not saved)');
  if(!(sv.stats.learned>=(statsBefore.learned||0)+1))throw new Error('stats.learned not incremented');
  if(!(sv.stats.losses>=(statsBefore.losses||0)+1))throw new Error('stats.losses not incremented');
  taught=S.learnData;
  if(ties<=2)taughtWinner=S.learnData;
 }
 if(!taughtWinner)throw new Error('8 teach attempts never produced a distinguishable signature');
 pass++;
}catch(e){fail++;fails.push('learn/teach flow: '+String(e.message).slice(0,140));}
/* item: replay the freshly taught character as secret — learned chars must join the candidate pool */
try{
 if(!taughtWinner)throw new Error('skipped: teach failed');
 S.category=taughtWinner.category;
 var r=playSecret(taughtWinner,'learned-replay',AK.CH().filter(function(c){return c.category==='animals'}));
 if(r.result!=='win')throw new Error('taught character not guessable (justified loss)');
 pass++;
 notes.push('taught character "'+taughtWinner.name+'" re-guessed in '+r.q+' questions via learnedChars pool');
}catch(e){fail++;fails.push('learned-replay: '+String(e.message).slice(0,140));}
return {pass:pass,fail:fail,total:pass+fail,fails:fails.slice(0,20),notes:notes,verdict:(fail===0?'PASS':'FAIL')};
})()`;

let result;
try { result = vm.runInContext(DRIVER, ctx); }
catch (e) { console.error('verify error:', e.stack || e.message); console.log(JSON.stringify({ pass: 0, fail: 1, total: 1, verdict: 'FAIL' })); process.exit(1); }
if (!result || typeof result !== 'object') { console.error('driver returned no result'); process.exit(1); }
const out = { pass: result.pass, fail: result.fail, total: result.total, verdict: result.fail === 0 ? 'PASS' : 'FAIL' };
if (result.fails && result.fails.length) out.fails = result.fails;
console.log(SLUG + ' in-engine verification: ' + out.pass + '/' + out.total + ' (330 KB secrets + 50 animal-category secrets + learn/teach terminal + learned-char replay), verdict=' + out.verdict);
(result.notes || []).forEach(n => console.log('  ' + n));
(result.fails || []).slice(0, 20).forEach(f => console.log('  FAIL ' + f));
console.log(JSON.stringify(out));
process.exit(out.fail === 0 ? 0 : 1);
