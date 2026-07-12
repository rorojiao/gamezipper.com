// Playtest simulator: replays solution segments through the engine logic
// Verifies that placing all solution segments triggers a win
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
let gameCode = scriptMatch[1];
gameCode = gameCode.replace(/^const LEVELS/m, 'var LEVELS');
gameCode = gameCode.replace(/^const STORAGE_KEY/m, 'var STORAGE_KEY');
gameCode = gameCode.replace(/^const SETTINGS_KEY/m, 'var SETTINGS_KEY');
gameCode = gameCode.replace(/^let state/m, 'var state');
gameCode = gameCode.replace(/^let progress/m, 'var progress');
gameCode = gameCode.replace(/^let settings/m, 'var settings');

const sandbox = {
  window: {},
  document: {
    getElementById: function() {
      return { textContent: '', clientWidth: 400, clientHeight: 400, getContext: function(){return{};}, getBoundingClientRect: function(){return{left:0,top:0,width:400,height:400};}, addEventListener: function(){}, querySelectorAll: function(){return[];}, style: {}, appendChild: function(){}, dataset:{}, onclick:null };
    },
    addEventListener: function(){},
    createElement: function() { return { className:'', innerHTML:'', style:{}, textContent:'', classList:{toggle:function(){},add:function(){},remove:function(){},contains:function(){return false;}}, animate:function(){}, remove:function(){}, querySelectorAll:function(){return[];}, onclick:null, appendChild:function(){} }; },
    querySelectorAll: function() { return []; },
  },
  AudioContext: function(){return{createGain:function(){return{gain:{value:0,setValueAtTime:function(){},linearRampToValueAtTime:function(){},exponentialRampToValueAtTime:function(){}},connect:function(){}};},createOscillator:function(){return{frequency:{value:0},type:'',connect:function(){},start:function(){},stop:function(){}};},currentTime:0,destination:{}};},
  webkitAudioContext: function(){return{createGain:function(){return{gain:{value:0,setValueAtTime:function(){},linearRampToValueAtTime:function(){},exponentialRampToValueAtTime:function(){}},connect:function(){}};},createOscillator:function(){return{frequency:{value:0},type:'',connect:function(){},start:function(){},stop:function(){}};},currentTime:0,destination:{}};},
  setInterval: function(){return 0;},
  clearInterval: function(){},
  setTimeout: function(){return 0;},
  localStorage: { getItem:function(){return null;}, setItem:function(){} },
  console: console, JSON: JSON, Math: Math, Set: Set, Map: Map, Date: Date, Object: Object, Array: Array,
};
sandbox.window = sandbox;
sandbox.window.AudioContext = sandbox.AudioContext;
sandbox.window.webkitAudioContext = sandbox.webkitAudioContext;
sandbox.window.addEventListener = function(){};
vm.createContext(sandbox);
vm.runInContext(gameCode, sandbox);

const LEVELS = sandbox.LEVELS;
let pass = 0, fail = 0;

LEVELS.forEach(function(lvl, idx) {
  // Simulate: load level, place all solution segments, call checkWin
  sandbox.state.currentLevel = idx;
  sandbox.state.levelData = lvl;
  sandbox.state.segments = [];
  sandbox.state.hintsUsed = 0;
  sandbox.state.paused = false;
  
  // Place each solution segment
  let allPlaced = true;
  lvl.solution.forEach(function(seg) {
    const segCopy = Object.assign({}, seg);
    if (sandbox.canPlaceSegment(segCopy)) {
      sandbox.state.segments.push(segCopy);
    } else {
      allPlaced = false;
      console.log('  Could not place seg: ' + JSON.stringify(seg));
    }
  });
  
  if (!allPlaced) {
    fail++;
    console.log('\u274c L' + lvl.id + ' — could not place all solution segments');
    return;
  }
  
  // Now check win conditions using engine logic
  const norm = sandbox.state.segments.length === lvl.solution.length;
  
  // Check all clues satisfied
  const cluesOk = lvl.clues.every(function(cl) { return sandbox.isClueSatisfied(cl); });
  
  // Check all segments have same-length crossing
  let rulesOk = true;
  for (let i = 0; i < sandbox.state.segments.length; i++) {
    let hasCross = false;
    for (let j = 0; j < sandbox.state.segments.length; j++) {
      if (i === j) continue;
      if (sandbox.segmentsCross(sandbox.state.segments[i], sandbox.state.segments[j]) && 
          sandbox.state.segments[j].len === sandbox.state.segments[i].len) {
        hasCross = true; break;
      }
    }
    if (!hasCross) { rulesOk = false; break; }
  }
  
  // Check solution matches
  const playerNorm = sandbox.state.segments.map(function(s){ return s.orient+s.pos+','+s.start+'-'+s.end; }).sort();
  const solNorm = lvl.solution.map(function(s){ return s.orient+s.pos+','+s.start+'-'+s.end; }).sort();
  const solMatch = JSON.stringify(playerNorm) === JSON.stringify(solNorm);
  
  if (norm && cluesOk && rulesOk && solMatch) {
    pass++;
    console.log('\u2705 L' + lvl.id + ' (' + lvl.tier + ') — playtest PASS (all ' + lvl.solution.length + ' segs placed, win conditions met)');
  } else {
    fail++;
    console.log('\u274c L' + lvl.id + ' — playtest FAIL: norm=' + norm + ' clues=' + cluesOk + ' rules=' + rulesOk + ' match=' + solMatch);
  }
});

console.log('\n=== Playtest Simulation Results ===');
console.log('PASS: ' + pass + '/' + LEVELS.length);
console.log('FAIL: ' + fail + '/' + LEVELS.length);
process.exit(fail > 0 ? 1 : 0);
