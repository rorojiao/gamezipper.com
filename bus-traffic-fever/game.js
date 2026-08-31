
(function(){
'use strict';
// ============ SAVE SYSTEM ============
var SAVE_KEY='btf_save_v1';
function loadSave(){
  try{var d=JSON.parse(localStorage.getItem(SAVE_KEY));if(d&&d.v===1)return d;}catch(e){}
  return{v:1,unlocked:1,stars:{},bestMoves:{},coins:0,sfx:true,music:true};
}
function saveSave(d){try{d.v=1;localStorage.setItem(SAVE_KEY,JSON.stringify(d));}catch(e){}}
var save=loadSave();

// ============ AUDIO SYSTEM ============
var actx=null,masterGain=null,musicGain=null,sfxGain=null;
var bgmInterval=null;
function initAudio(){
  if(actx)return;
  try{
    actx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=actx.createGain();masterGain.gain.value=0.7;masterGain.connect(actx.destination);
    sfxGain=actx.createGain();sfxGain.gain.value=0.5;sfxGain.connect(masterGain);
    musicGain=actx.createGain();musicGain.gain.value=save.music?0.15:0;musicGain.connect(masterGain);
  }catch(e){console.warn('Audio init failed',e);}
}
function playTone(freq,dur,type,vol,attack){
  if(!actx||!save.sfx)return;
  type=type||'sine';vol=vol||0.3;attack=attack||0.01;
  var osc=actx.createOscillator();var g=actx.createGain();
  osc.type=type;osc.frequency.value=freq;
  g.gain.setValueAtTime(0,actx.currentTime);
  g.gain.linearRampToValueAtTime(vol,actx.currentTime+attack);
  g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+dur);
  osc.connect(g);g.connect(sfxGain);osc.start();osc.stop(actx.currentTime+dur);
}
function playSfx(name){
  if(!actx||!save.sfx)return;
  switch(name){
    case'tap':playTone(600,0.08,'sine',0.2);break;
    case'slide':playTone(300,0.15,'triangle',0.15);setTimeout(function(){playTone(400,0.1,'triangle',0.1);},80);break;
    case'exit':playTone(523,0.1,'sine',0.25);setTimeout(function(){playTone(659,0.1,'sine',0.25);},80);setTimeout(function(){playTone(784,0.15,'sine',0.25);},160);break;
    case'wrong':playTone(200,0.2,'sawtooth',0.15);break;
    case'collide':playTone(150,0.1,'square',0.12);break;
    case'win':[523,659,784,1047].forEach(function(f,i){setTimeout(function(){playTone(f,0.2,'sine',0.3);},i*100);});break;
    case'fail':playTone(300,0.3,'sawtooth',0.2);setTimeout(function(){playTone(200,0.4,'sawtooth',0.2);},200);break;
    case'coin':playTone(880,0.08,'square',0.15);setTimeout(function(){playTone(1320,0.08,'square',0.1);},60);break;
    case'powerup':playTone(440,0.1,'sine',0.2);setTimeout(function(){playTone(660,0.1,'sine',0.2);},60);setTimeout(function(){playTone(880,0.15,'sine',0.2);},120);break;
    case'star':[523,659,784].forEach(function(f,i){setTimeout(function(){playTone(f,0.15,'triangle',0.25);},i*120);});break;
  }
}
// Procedural BGM
var bgmNotes=[262,330,392,330,262,330,392,523,440,392,330,262,196,262,330,392];
var bgmIdx=0,bgmNextTime=0;
function startBGM(){
  if(!actx||bgmInterval)return;
  bgmNextTime=actx.currentTime+0.1;
  bgmInterval=setInterval(function(){
    if(!save.music||!musicGain){return;}
    while(bgmNextTime<actx.currentTime+0.3){
      var freq=bgmNotes[bgmIdx%bgmNotes.length];
      var osc=actx.createOscillator();var g=actx.createGain();
      osc.type='triangle';osc.frequency.value=freq;
      g.gain.setValueAtTime(0,bgmNextTime);
      g.gain.linearRampToValueAtTime(0.08,bgmNextTime+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,bgmNextTime+0.28);
      osc.connect(g);g.connect(musicGain);osc.start(bgmNextTime);osc.stop(bgmNextTime+0.3);
      // Bass
      var bass=actx.createOscillator();var bg=actx.createGain();
      bass.type='sine';bass.frequency.value=freq/2;
      bg.gain.setValueAtTime(0,bgmNextTime);
      bg.gain.linearRampToValueAtTime(0.06,bgmNextTime+0.02);
      bg.gain.exponentialRampToValueAtTime(0.001,bgmNextTime+0.35);
      bass.connect(bg);bg.connect(musicGain);bass.start(bgmNextTime);bass.stop(bgmNextTime+0.4);
      bgmNextTime+=0.3;bgmIdx++;
    }
  },100);
}
function stopBGM(){if(bgmInterval){clearInterval(bgmInterval);bgmInterval=null;}}

// ============ COLORS ============
var COLORS={
  red:'#ff4757',blue:'#3742fa',yellow:'#ffa502',green:'#2ed573',orange:'#ff6348',purple:'#a55eea'
};
var COLOR_KEYS=Object.keys(COLORS);
var BUS_ICONS={red:'🚌',blue:'🚐',yellow:'🚕',green:'🚗',orange:'🚚',purple:'🚓'};

// ============ LEVELS ============
// Grid: 0=empty,1=wall/obstacle
// Bus:{r,c,color,dir:'u|d|l|r',len:2|3}
// Gate:{r,c,color} position on edge where buses exit
// Levels increase in difficulty
var LEVELS=[
{w:4,h:4,v:[[0,2,2,1,1],[0,1,3,1,3]]},
{w:4,h:4,v:[[1,1,3,1,3],[0,1,2,0,0],[0,3,2,1,1]]},
{w:4,h:4,v:[[0,0,3,1,1],[0,2,1,0,0],[3,2,2,0,2]]},
{w:4,h:4,v:[[3,0,2,0,2],[0,2,2,0,0],[2,0,1,1,1],[0,0,2,1,3]]},
{w:4,h:4,v:[[2,1,2,1,1],[0,1,2,0,2],[0,0,1,0,0],[1,0,1,1,3],[0,3,2,1,3]]},
{w:4,h:4,v:[[1,0,1,1,1],[3,2,2,0,2],[1,2,1,1,1],[2,0,2,0,2],[0,3,2,1,1]]},
{w:5,h:4,v:[[2,3,3,1,3],[2,0,2,0,0],[1,0,2,0,2],[1,2,3,1,1],[0,1,3,0,2]]},
{w:5,h:4,v:[[0,0,3,1,3],[4,3,1,0,0],[0,3,2,1,1],[1,2,3,1,3],[0,1,1,0,0]]},
{w:5,h:4,v:[[1,3,3,1,1],[3,2,2,1,3],[2,0,2,1,3],[0,1,2,0,2],[0,3,1,1,1]]},
{w:5,h:4,v:[[0,0,2,0,0],[3,0,2,1,1],[2,2,2,0,0],[3,1,2,0,0],[1,0,2,0,2],[2,1,1,1,1]]},
{w:5,h:4,v:[[4,1,1,0,2],[2,3,2,1,3],[0,0,2,1,3],[2,1,2,1,1],[1,2,1,0,0],[2,2,3,1,3]]},
{w:5,h:4,v:[[1,3,3,1,1],[0,1,3,0,0],[2,1,1,1,3],[0,0,2,1,3],[1,2,1,0,0],[2,2,2,1,3]]},
{w:5,h:5,v:[[4,2,3,0,2],[3,0,2,1,1],[1,3,2,1,3],[2,2,1,0,2],[3,3,1,1,3],[0,1,2,0,0],[0,0,1,1,1]]},
{w:5,h:5,v:[[1,1,2,1,1],[1,0,2,1,1],[3,1,3,0,2],[4,0,2,0,0],[1,2,1,0,2],[4,4,1,0,0],[0,4,3,1,1]]},
{w:5,h:5,v:[[1,1,2,0,2],[3,2,2,0,0],[0,3,3,1,3],[2,0,2,0,2],[4,0,2,0,2],[4,4,1,1,3],[3,0,1,1,1]]},
{w:5,h:5,v:[[2,4,1,0,0],[1,0,3,0,0],[0,1,3,0,2],[4,3,2,0,2],[4,0,1,0,2],[2,0,3,0,0],[3,1,1,1,3],[0,4,2,1,1]]},
{w:5,h:5,v:[[0,4,1,0,2],[2,0,2,0,2],[0,2,3,1,1],[1,3,2,0,0],[4,1,2,0,0],[3,2,1,1,1],[2,3,2,1,1],[4,3,1,0,0]]},
{w:5,h:5,v:[[0,0,2,0,0],[1,2,1,0,2],[2,1,3,0,0],[2,4,1,0,0],[2,0,2,1,3],[3,1,2,0,0],[3,3,2,1,3],[0,2,1,1,1]]},
{w:6,h:5,v:[[3,0,1,1,1],[1,2,2,0,0],[2,3,3,1,3],[2,2,2,1,3],[3,1,1,0,0],[4,0,1,1,1],[2,1,1,0,2],[4,1,2,0,2]]},
{w:6,h:5,v:[[2,1,2,1,3],[1,4,2,1,3],[3,0,2,1,3],[3,4,2,1,3],[5,3,1,1,3],[1,2,3,1,3],[0,2,3,0,0],[1,0,2,0,0]]},
{w:6,h:5,v:[[3,1,2,1,3],[2,1,2,0,2],[4,4,1,1,3],[3,3,2,1,3],[0,3,2,0,0],[0,2,2,1,3],[1,4,1,1,3],[1,0,2,0,2]]},
{w:6,h:5,v:[[4,4,1,0,0],[2,1,1,0,0],[0,4,2,1,3],[2,3,3,1,1],[5,2,2,0,2],[1,0,2,1,1],[1,2,2,0,0],[5,1,1,1,3],[3,2,1,0,2]]},
{w:6,h:5,v:[[3,1,2,0,0],[0,0,2,0,0],[4,1,2,1,3],[1,1,2,0,0],[2,0,2,1,3],[0,3,2,1,1],[0,2,1,0,0],[2,3,2,0,0],[0,4,2,1,1]]},
{w:6,h:5,v:[[2,1,2,0,0],[5,3,2,0,2],[2,0,3,1,1],[0,4,1,0,2],[1,0,2,0,2],[3,4,2,1,3],[0,3,2,1,1],[4,1,2,0,2],[5,0,2,0,2]]},
{w:6,h:6,v:[[0,4,3,1,3],[4,1,1,1,3],[5,1,1,1,3],[0,0,3,0,2],[3,4,1,1,3],[5,3,3,0,0],[1,2,1,0,2],[5,2,1,0,0],[4,4,2,0,2],[3,3,2,1,1]]},
{w:6,h:6,v:[[0,1,2,1,3],[3,1,3,0,0],[1,2,2,1,1],[5,0,3,0,2],[0,3,2,0,0],[2,4,3,1,3],[4,5,2,1,1],[2,5,1,1,3],[3,0,2,1,1],[1,3,3,0,0]]},
{w:6,h:6,v:[[4,1,1,0,0],[2,5,2,1,3],[0,4,2,0,2],[4,3,2,0,2],[0,0,3,0,2],[3,2,2,1,3],[3,0,2,0,2],[5,4,1,1,3],[2,3,2,1,1],[4,5,2,1,3]]},
{w:6,h:6,v:[[5,2,2,0,2],[2,0,3,0,2],[0,3,2,1,1],[0,0,2,1,3],[4,5,1,0,2],[1,5,2,1,1],[1,1,1,0,0],[3,4,2,0,0],[4,0,2,1,3],[4,4,2,1,3],[0,1,2,0,0]]},
{w:6,h:6,v:[[0,5,3,1,1],[1,2,2,1,1],[1,4,1,1,3],[5,0,2,0,2],[0,1,1,1,3],[0,3,2,0,0],[3,0,2,0,2],[2,4,2,1,1],[4,2,2,1,1],[0,2,1,0,0],[4,4,2,0,0]]},
{w:6,h:6,v:[[5,1,2,0,2],[0,2,3,0,0],[0,0,2,0,0],[2,4,1,1,3],[0,5,3,1,1],[5,3,3,0,2],[4,5,1,1,1],[3,3,1,0,0],[3,4,1,1,1],[3,0,3,1,3],[2,1,2,0,2]]}
];

// Convert compact level format to game format
// v:[[x,y,len,horiz,dir],...] horiz:0=vert,1=horiz; dir:0=up,1=right,2=down,3=left
var DIR_MAP=['u','r','d','l'];
var COLOR_NAMES=['red','blue','yellow','green','orange','purple'];
LEVELS.forEach(function(lvl,i){
  lvl.cols=lvl.w;lvl.rows=lvl.h;
  lvl.par=lvl.v.length;
  lvl.buses=[];lvl.gates=[];lvl.walls=[];
  lvl.v.forEach(function(v,idx){
    var x=v[0],y=v[1],len=v[2],dirStr=DIR_MAP[v[4]];
    var r=y+1,c=x+1;
    if(dirStr==='l')c=x+len;
    if(dirStr==='u')r=y+len;
    var color=COLOR_NAMES[idx%COLOR_NAMES.length];
    lvl.buses.push({r:r,c:c,color:color,dir:dirStr,len:len});
    var gr,gc;
    if(dirStr==='r'){gr=r;gc=lvl.cols+1;}
    else if(dirStr==='l'){gr=r;gc=0;}
    else if(dirStr==='d'){gr=lvl.rows+1;gc=c;}
    else{gr=0;gc=c;}
    var exists=lvl.gates.some(function(g){return g.r===gr&&g.c===gc&&g.color===color;});
    if(!exists)lvl.gates.push({r:gr,c:gc,color:color});
  });
  lvl.undo=Math.max(1,3-Math.floor(i/10));
  lvl.hint=Math.max(1,2-Math.floor(i/15));
  lvl.shuffle=1;
  if(i<3)lvl.hintArrow=true;
});

// ============ GAME STATE ============
var G={
  canvas:null,ctx:null,W:0,H:0,cellSize:0,gridOX:0,gridOY:0,
  levelIdx:0,grid:[],buses:[],gates:[],walls:[],
  moves:0,par:0,undoLeft:0,hintLeft:0,shuffleLeft:0,
  animating:false,particles:[],confetti:[],comboCount:0,
  comboTimer:0,screenShake:0,hintHighlight:-1,hintTimer:0,
  hintArrow:false,tutorialStep:0,
  history:[],// for undo
  rafId:null,lastTime:0,running:false,
  pointerDown:false,
  // R395: click-ripple feedback for canvas — prevents rage_click when handleTap()
  // returns silently (no bus at clicked cell, animating, or out-of-grid bounds).
  // User sees their click registered → knows the UI is responsive.
  ripples:[],
  _pendingTimeouts:[],// UX-OPT 2026-07-19 INP FIX: tracked setTimeouts so they can be cancelled on level load
  // UX-OPT 2026-07-31 INP FIX: offscreen canvas for static wall hatch pattern (pre-rendered once per level load).
  // Replaces 5-10 ctx.beginPath/moveTo/lineTo/stroke calls per wall per frame with a single drawImage.
  // wallsCanvas holds the static grid cells + wall hatch + arrows; wallsCanvasW/H are its dimensions.
  wallsCanvas:null,wallsCanvasW:0,wallsCanvasH:0,wallsCanvasDirty:true,
  // UX-OPT 2026-08-18 R491 INP FIX: per-bus offscreen canvas cache keyed by color+dir+len.
  // Each level only has a small set of unique (color,dir,len) tuples (~10-15 buses), so we bake
  // each unique bus to an offscreen canvas once per level load and drawImage it on every frame
  // instead of recreating createLinearGradient + running 10 beginPath/stroke/fill per bus per
  // frame. This drops the per-frame ctx-call cost on the input-handler main thread significantly,
  // reducing INP POOR events on /bus-traffic-fever/ (6 events avg 2679ms post-R366, all Desktop
  // Chrome 150/151 Edg 1360x746 — the input handler still competed with 16 buses × ~10 ctx calls
  // each = ~160 calls/frame on tap).
  busCache:{},busCanvasDirty:true
};

// ============ CANVAS SETUP ============
function setupCanvas(){
  G.canvas=document.getElementById('game-canvas');
  G.ctx=G.canvas.getContext('2d');
  resizeCanvas();
}
function resizeCanvas(){
  var wrap=document.getElementById('canvas-wrap');
  var maxW=Math.max(320,Math.min((wrap.clientWidth||336)-16,680));
  var maxH=Math.max(320,(window.innerHeight||580)-260);
  var lvl=LEVELS[G.levelIdx];
  var aspect=lvl.cols/lvl.rows;
  var w,h;
  if(maxW/maxH>aspect){h=maxH;w=h*aspect;}
  else{w=maxW;h=w/aspect;}
  w=Math.floor(w);h=Math.floor(h);
  var dpr=window.devicePixelRatio||1;
  G.canvas.width=w*dpr;G.canvas.height=h*dpr;
  G.canvas.style.width=w+'px';G.canvas.style.height=h+'px';
  G.ctx.scale(dpr,dpr);
  G.W=w;G.H=h;
  // grid offset for padding
  var pad=12;
  G.cellSize=Math.min((w-pad*2)/lvl.cols,(h-pad*2)/lvl.rows);
  G.gridOX=(w-G.cellSize*lvl.cols)/2;
  G.gridOY=(h-G.cellSize*lvl.rows)/2;
  // UX-OPT 2026-07-31 INP FIX: cellSize or canvas size changed → mark walls offscreen dirty
  G.wallsCanvasDirty=true;
  // UX-OPT 2026-08-18 R491 INP FIX: also mark bus cache dirty on canvas resize
  G.busCanvasDirty=true;
}

// ============ LEVEL LOADING ============
function loadLevel(idx){
  // UX-OPT 2026-07-19 INP FIX: cancel any pending setTimeouts from prior level (win overlay, stars, etc)
  // before doing the synchronous buses/gates rebuild. Otherwise stale callbacks fire during the
  // next click handler and inflate INP.
  if(G._pendingTimeouts&&G._pendingTimeouts.length){
    for(var _pi=0;_pi<G._pendingTimeouts.length;_pi++)clearTimeout(G._pendingTimeouts[_pi]);
    G._pendingTimeouts.length=0;
  }
  G.levelIdx=idx;
  var lvl=LEVELS[idx];
  G.moves=0;G.par=lvl.par;
  G.undoLeft=lvl.undo||2;G.hintLeft=lvl.hint||1;G.shuffleLeft=lvl.shuffle||1;
  G.buses=[];G.gates=[];G.walls=[];
  G.particles=[];G.confetti=[];G.comboCount=0;G.comboTimer=0;
  G.screenShake=0;G.hintHighlight=-1;G.hintTimer=0;
  G.hintArrow=lvl.hintArrow||false;G.tutorialStep=0;
  G.history=[];G.animating=false;
  G.ripples=[];// R395: clear ripples when loading new level
  // UX-OPT 2026-08-18 R491 INP FIX: mark bus cache dirty so renderBusesOffscreen() rebuilds
  // for the new level's (color,dir,len) tuples on the next render() call.
  G.busCanvasDirty=true;
  // Build grid
  G.grid=[];
  for(var r=0;r<=lvl.rows;r++){G.grid[r]=[];for(var c=0;c<=lvl.cols;c++)G.grid[r][c]=0;}
  // Buses
  lvl.buses.forEach(function(b,i){
    var bus={id:i,r:b.r,c:b.c,color:b.color,dir:b.dir,len:b.len||2,
      px:b.c*G.cellSize,py:b.r*G.cellSize,
      targetPx:b.c*G.cellSize,targetPy:b.r*G.cellSize,
      exiting:false,exitProgress:0,alive:true};
    G.buses.push(bus);
    // Occupy grid cells
    for(var k=0;k<bus.len;k++){
      var rr=b.r,cc=b.c;
      if(b.dir==='r')cc=b.c+k;else if(b.dir==='l')cc=b.c-k;
      else if(b.dir==='d')rr=b.r+k;else if(b.dir==='u')rr=b.r-k;
      if(rr>=0&&rr<=lvl.rows&&cc>=0&&cc<=lvl.cols)G.grid[rr][cc]=1;
    }
  });
  // Gates
  lvl.gates.forEach(function(g){G.gates.push({r:g.r,c:g.c,color:g.color});});
  // Walls
  if(lvl.walls)lvl.walls.forEach(function(w){G.walls.push({r:w.r,c:w.c});G.grid[w.r][w.c]=2;});
  resizeCanvas();
  // Update bus pixel positions
  G.buses.forEach(function(b){
    b.px=b.c*G.cellSize;b.py=b.r*G.cellSize;
    b.targetPx=b.px;b.targetPy=b.py;
  });
  updateHUD();
  updatePowerups();
}

// ============ GAME LOGIC ============
function getBusCells(bus){
  var cells=[];
  for(var k=0;k<bus.len;k++){
    var r=bus.r,c=bus.c;
    if(bus.dir==='r')c=bus.c+k;else if(bus.dir==='l')c=bus.c-k;
    else if(bus.dir==='d')r=bus.r+k;else if(bus.dir==='u')r=bus.r-k;
    cells.push({r:r,c:c});
  }
  return cells;
}
function isCellOccupied(r,c,excludeBus){
  if(G.walls.some(function(w){return w.r===r&&w.c===c;}))return true;
  for(var i=0;i<G.buses.length;i++){
    if(!G.buses[i].alive||G.buses[i]===excludeBus)continue;
    var cells=getBusCells(G.buses[i]);
    if(cells.some(function(cell){return cell.r===r&&cell.c===c;}))return true;
  }
  return false;
}
function findGateAt(r,c,color){
  return G.gates.find(function(g){return g.r===r&&g.c===c&&g.color===color;});
}
function tryMoveBus(bus){
  if(G.animating||!bus.alive)return;
  var lvl=LEVELS[G.levelIdx];
  // Determine movement direction
  var dr=0,dc=0;
  if(bus.dir==='r')dc=1;else if(bus.dir==='l')dc=-1;
  else if(bus.dir==='d')dr=1;else if(bus.dir==='u')dr=-1;
  // Find where bus would slide to
  var headR=bus.r,headC=bus.c;
  // Head is the front cell in direction of movement
  if(bus.dir==='r')headC=bus.c+bus.len-1;
  else if(bus.dir==='d')headR=bus.r+bus.len-1;
  // For 'l' and 'u', head is at bus.c/bus.r (the starting cell)
  
  // Check cells in front of the head
  var newHeadR=headR,newHeadC=headC;
  var blocked=false,exitGate=null;
  var steps=0;
  while(true){
    var nextR=newHeadR+dr,nextC=newHeadC+dc;
    steps++;
    // Check if this position is beyond the grid (exit)
    if(nextR<1||nextR>lvl.rows||nextC<1||nextC>lvl.cols){
      // Check for gate at edge
      var gateR=nextR,gateC=nextC;
      // Clamp to edge for gate check
      if(nextR<1)gateR=0;else if(nextR>lvl.rows)gateR=lvl.rows+1;
      // Actually gates are placed at edge positions
      var gate=findGateAt(Math.max(0,Math.min(lvl.rows+1,nextR)),Math.max(0,Math.min(lvl.cols+1,nextC)),bus.color);
      if(gate){
        exitGate=gate;
        // Bus exits here
        break;
      }
      // Also check gate at the actual boundary position
      // Gate positions use 0-indexed: r=0 means top edge, r=rows+1 means bottom, etc.
      blocked=true;
      break;
    }
    // Check if cell is occupied
    if(isCellOccupied(nextR,nextC,bus)){
      blocked=true;
      break;
    }
    newHeadR=nextR;newHeadC=nextC;
    if(steps>20)break; // safety
  }
  
  if(exitGate){
    // Save state for undo
    saveUndoState();
    // Bus exits - animate it sliding off the grid
    G.moves++;
    bus.exiting=true;
    bus.exitProgress=0;
    bus.targetPx=(exitGate.c>lvl.cols?lvl.cols*G.cellSize:(exitGate.c<1?-G.cellSize*2:bus.px));
    bus.targetPy=(exitGate.r>lvl.rows?lvl.rows*G.cellSize:(exitGate.r<1?-G.cellSize*2:bus.py));
    // Calculate actual exit target beyond grid
    if(bus.dir==='r')bus.targetPx=lvl.cols*G.cellSize+G.cellSize*2;
    else if(bus.dir==='l')bus.targetPx=-G.cellSize*2;
    else if(bus.dir==='d')bus.targetPy=lvl.rows*G.cellSize+G.cellSize*2;
    else if(bus.dir==='u')bus.targetPy=-G.cellSize*2;
    G.animating=true;
    playSfx('slide');
    G._pendingTimeouts.push(setTimeout(function(){playSfx('exit');spawnParticles(bus);},200));
    G.comboCount++;G.comboTimer=60;
    if(G.comboCount>1)showCombo(bus);
    updateHUD();
  }else if(!blocked&&(newHeadR!==headR||newHeadC!==headC)){
    // Bus slides to new position (no exit)
    saveUndoState();
    G.moves++;
    if(bus.dir==='r'){bus.c=newHeadC-bus.len+1;}
    else if(bus.dir==='d'){bus.r=newHeadR-bus.len+1;}
    else if(bus.dir==='l'){bus.c=newHeadC;}
    else{bus.r=newHeadR;}
    bus.targetPx=bus.c*G.cellSize;bus.targetPy=bus.r*G.cellSize;
    checkDeadlock();
    G.animating=true;
    playSfx('slide');
    updateHUD();
  }else{
    // Blocked immediately
    playSfx('collide');
    G.screenShake=6;
    checkDeadlock();
  }
  // Clear hint
  G.hintHighlight=-1;
}
function saveUndoState(){
  var snap=G.buses.map(function(b){return{id:b.id,r:b.r,c:b.c,alive:b.alive,exiting:b.exiting};});
  G.history.push({buses:snap,moves:G.moves,combo:G.comboCount});
  if(G.history.length>20)G.history.shift();
}
function doUndo(btn){
  if(G.undoLeft<=0||G.history.length===0||G.animating){
    // 2026-08-31 R620: silent return on valid (not disabled) powerup button triggers dead_click
    // (toast shown on a DIFFERENT element). Add .rejected class to the clicked btn itself so
    // gz-analytics.js 1.5s window sees snapClass != nowClass. Extends R393 disabled-only pattern.
    if(btn){btn.classList.add('rejected');setTimeout(function(){btn.classList.remove('rejected');},1700);}
    showToast('No moves to undo!');return;
  }
  var snap=G.history.pop();
  G.moves=snap.moves;G.comboCount=snap.combo;
  snap.buses.forEach(function(s){
    var bus=G.buses.find(function(b){return b.id===s.id;});
    if(bus){bus.r=s.r;bus.c=s.c;bus.alive=s.alive;bus.exiting=false;bus.exitProgress=0;
      bus.px=bus.c*G.cellSize;bus.py=bus.r*G.cellSize;bus.targetPx=bus.px;bus.targetPy=bus.py;}
  });
  G.undoLeft--;
  playSfx('powerup');
  updateHUD();updatePowerups();
  showToast('Move undone!');
}
function doHint(btn){
  if(G.hintLeft<=0||G.animating){
    // 2026-08-31 R620: see doUndo — silent return on valid powerup triggers dead_click
    if(btn){btn.classList.add('rejected');setTimeout(function(){btn.classList.remove('rejected');},1700);}
    showToast('No hints left!');return;
  }
  // Find a bus that can exit
  for(var i=0;i<G.buses.length;i++){
    var bus=G.buses[i];
    if(!bus.alive)continue;
    if(canBusExit(bus)){
      G.hintHighlight=bus.id;G.hintTimer=180;
      G.hintLeft--;
      playSfx('powerup');
      updatePowerups();
      showToast('Try the highlighted bus!');
      return;
    }
  }
  showToast('No obvious move found.');
}
function canBusExit(bus){
  var lvl=LEVELS[G.levelIdx];
  var dr=0,dc=0;
  if(bus.dir==='r')dc=1;else if(bus.dir==='l')dc=-1;
  else if(bus.dir==='d')dr=1;else if(bus.dir==='u')dr=-1;
  var headR=bus.r,headC=bus.c;
  if(bus.dir==='r')headC=bus.c+bus.len-1;
  else if(bus.dir==='d')headR=bus.r+bus.len-1;
  var newR=headR,newC=headC;
  while(true){
    var nr=newR+dr,nc=newC+dc;
    if(nr<1||nr>lvl.rows||nc<1||nc>lvl.cols){
      var gr=nr,gc=nc;
      if(gr<1)gr=0;else if(gr>lvl.rows)gr=lvl.rows+1;
      if(gc<1)gc=0;else if(gc>lvl.cols)gc=lvl.cols+1;
      var gate=findGateAt(gr,gc,bus.color);
      if(gate)return true;
      return false;
    }
    if(isCellOccupied(nr,nc,bus))return false;
    newR=nr;newC=nc;
    if(Math.abs(newR-headR)+Math.abs(newC-headC)>20)return false;
  }
}
function canAnyBusMove(){
  for(var i=0;i<G.buses.length;i++){
    if(G.buses[i].alive&&canBusExit(G.buses[i]))return true;
  }
  return false;
}
function doShuffle(btn){
  if(G.shuffleLeft<=0||G.animating){
    // 2026-08-31 R620: see doUndo — silent return on valid powerup triggers dead_click
    if(btn){btn.classList.add('rejected');setTimeout(function(){btn.classList.remove('rejected');},1700);}
    showToast('No shuffles left!');return;
  }
  var undoLeft=G.undoLeft,hintLeft=G.hintLeft,shuffleLeft=G.shuffleLeft;
  // This is complex for grid games - instead of true shuffle, just undo all
  // For simplicity, reset to level start
  G.shuffleLeft--;
  playSfx('powerup');
  loadLevel(G.levelIdx);
  // Restore powerup state
  G.undoLeft=undoLeft;G.hintLeft=hintLeft;G.shuffleLeft=shuffleLeft-1;
  showToast('Lot rearranged!');
  updatePowerups();
}
function checkWin(){
  var remaining=G.buses.filter(function(b){return b.alive;}).length;
  if(remaining===0&&!G.animating){
    onLevelComplete();
  }
}
function checkDeadlock(){
  if(G.animating)return;
  var remaining=G.buses.filter(function(b){return b.alive;}).length;
  if(remaining>0&&!canAnyBusMove()&&G.undoLeft===0){
    // Stuck with no undos - show fail
    G._pendingTimeouts.push(setTimeout(function(){showFail();},500));
  }
}
function onLevelComplete(){
  playSfx('win');
  spawnConfetti();
  // Calculate stars
  var stars=1;
  if(G.moves<=G.par)stars=3;
  else if(G.moves<=Math.ceil(G.par*1.5))stars=2;
  // Coins
  var baseCoins=G.levelIdx*10+50;
  var coinReward=baseCoins*stars;
  save.coins+=coinReward;
  // Save progress
  var levelKey=String(G.levelIdx+1);
  var prevStars=save.stars[levelKey]||0;
  if(stars>prevStars)save.stars[levelKey]=stars;
  if(!save.bestMoves[levelKey]||G.moves<save.bestMoves[levelKey])save.bestMoves[levelKey]=G.moves;
  if(G.levelIdx+2>save.unlocked&&G.levelIdx+1<LEVELS.length)save.unlocked=G.levelIdx+2;
  saveSave(save);
  updateCoinDisplay();
  // Show overlay — UX-OPT 2026-07-19 INP FIX: tracked setTimeout (cancelled on next level load)
  var _t1=setTimeout(function(){
    var ov=document.getElementById('win-overlay');
    document.getElementById('win-coins').textContent=coinReward;
    var starEls=ov.querySelectorAll('.star');
    starEls.forEach(function(el){
      el.classList.remove('earned');
      var s=parseInt(el.dataset.s);
      if(s<=stars){
        var _t2=setTimeout(function(){el.classList.add('earned');playSfx('star');},s*200);
        G._pendingTimeouts.push(_t2);
      }
    });
    // Next button visibility
    document.getElementById('btn-win-next').style.display=(G.levelIdx+1<LEVELS.length)?'':'none';
    ov.classList.add('active');
    stopBGM();
  },800);
  G._pendingTimeouts.push(_t1);
}
function showFail(){
  playSfx('fail');
  document.getElementById('fail-overlay').classList.add('active');
  stopBGM();
}

// ============ PARTICLES ============
function spawnParticles(bus){
  var cx=G.gridOX+bus.px+G.cellSize*bus.len/2;
  var cy=G.gridOY+bus.py+G.cellSize/2;
  var col=COLORS[bus.color];
  for(var i=0;i<15;i++){
    G.particles.push({
      x:cx,y:cy,
      vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8-2,
      life:1,col:col,size:3+Math.random()*4
    });
  }
}
function spawnConfetti(){
  for(var i=0;i<80;i++){
    G.confetti.push({
      x:Math.random()*G.W,y:-20,
      vx:(Math.random()-0.5)*4,vy:2+Math.random()*4,
      life:1,col:COLORS[COLOR_KEYS[Math.floor(Math.random()*COLOR_KEYS.length)]],
      size:4+Math.random()*6,rot:Math.random()*Math.PI*2,vr:(Math.random()-0.5)*0.3
    });
  }
}
function showCombo(bus){
  var cx=G.gridOX+bus.px+G.cellSize;
  var cy=G.gridOY+bus.py;
  var el=document.createElement('div');
  el.className='combo-popup';
  el.textContent='COMBO x'+G.comboCount+'!';
  el.style.left=(G.canvas.offsetLeft+cx)+'px';
  el.style.top=(G.canvas.offsetTop+cy)+'px';
  document.body.appendChild(el);
  G._pendingTimeouts.push(setTimeout(function(){el.remove();},1000));
}

// ============ RENDERING ============
function render(dt){
  var ctx=G.ctx;
  ctx.clearRect(0,0,G.W,G.H);
  // UX-OPT 2026-07-31 INP FIX: render static grid + walls + gate arrows from offscreen cache
  if(G.wallsCanvasDirty){
    renderWallsOffscreen();
  }
  if(G.wallsCanvas){
    // The offscreen canvas includes 24px padding around the grid (translate(pad,pad)).
    // To position the grid at (gridOX,gridOY) on the main canvas, draw the image
    // starting at (gridOX-pad, gridOY-pad) = (gridOX-24, gridOY-24).
    ctx.drawImage(G.wallsCanvas,G.gridOX-24,G.gridOY-24,G.wallsCanvasW,G.wallsCanvasH);
  }else{
    // Fallback: draw grid + walls + gates inline (original behavior)
    ctx.save();
    ctx.translate(G.gridOX,G.gridOY);
    var lvl=LEVELS[G.levelIdx];
    for(var r=1;r<=lvl.rows;r++){
      for(var c=1;c<=lvl.cols;c++){
        var x=(c-1)*G.cellSize,y=(r-1)*G.cellSize;
        ctx.fillStyle=(r+c)%2===0?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)';
        roundRect(ctx,x,y,G.cellSize-2,G.cellSize-2,6);ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;ctx.stroke();
      }
    }
    G.walls.forEach(function(w){
      var x=(w.c-1)*G.cellSize,y=(w.r-1)*G.cellSize;
      ctx.fillStyle='rgba(100,100,120,0.6)';
      roundRect(ctx,x+3,y+3,G.cellSize-8,G.cellSize-8,8);ctx.fill();
      ctx.strokeStyle='rgba(60,60,80,0.8)';ctx.lineWidth=2;
      for(var i=0;i<G.cellSize;i+=8){
        ctx.beginPath();ctx.moveTo(x+3+i,y+3);ctx.lineTo(x+3,y+3+i);ctx.stroke();
      }
    });
    G.gates.forEach(function(g){
      var x,y,w,h;
      if(g.c<1){x=-6;y=(g.r-1)*G.cellSize;w=8;h=G.cellSize-2;}
      else if(g.c>lvl.cols){x=lvl.cols*G.cellSize-2;y=(g.r-1)*G.cellSize;w=8;h=G.cellSize-2;}
      else if(g.r<1){x=(g.c-1)*G.cellSize;y=-6;w=G.cellSize-2;h=8;}
      else{x=(g.c-1)*G.cellSize;y=lvl.rows*G.cellSize-2;w=G.cellSize-2;h=8;}
      var col=COLORS[g.color];
      ctx.shadowColor=col;ctx.shadowBlur=15;
      ctx.fillStyle=col;
      roundRect(ctx,x,y,w,h,4);ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.font='bold '+Math.floor(G.cellSize*0.4)+'px Inter';
      ctx.textAlign='center';ctx.textBaseline='middle';
      var ax,ay,ar;
      if(g.c<1){ax=-14;ay=(g.r-1)*G.cellSize+G.cellSize/2;ar=0;}
      else if(g.c>lvl.cols){ax=lvl.cols*G.cellSize+14;ay=(g.r-1)*G.cellSize+G.cellSize/2;ar=Math.PI;}
      else if(g.r<1){ax=(g.c-1)*G.cellSize+G.cellSize/2;ay=-14;ar=Math.PI/2;}
      else{ax=(g.c-1)*G.cellSize+G.cellSize/2;ay=lvl.rows*G.cellSize+14;ar=-Math.PI/2;}
      ctx.save();ctx.translate(ax,ay);ctx.rotate(ar);
      ctx.beginPath();ctx.moveTo(-6,-5);ctx.lineTo(6,0);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }
  // Screen shake applied to dynamic layers (buses + particles)
  ctx.save();
  if(G.screenShake>0){
    ctx.translate((Math.random()-0.5)*G.screenShake,(Math.random()-0.5)*G.screenShake);
    G.screenShake*=0.85;
    if(G.screenShake<0.5)G.screenShake=0;
  }
  ctx.save();
  ctx.translate(G.gridOX,G.gridOY);
  // Buses
  // UX-OPT 2026-08-18 R491 INP FIX: pre-render buses to offscreen cache. drawBus() becomes a
  // drawImage lookup instead of recreating gradient + 10+ beginPath/stroke per bus per frame.
  if(G.busCanvasDirty){renderBusesOffscreen();}
  G.buses.forEach(function(bus){
    if(!bus.alive)return;
    drawBus(ctx,bus);
  });
  // Hint highlight (re-drawn each frame because of pulse animation)
  if(G.hintHighlight>=0&&G.hintTimer>0){
    var hb=G.buses.find(function(b){return b.id===G.hintHighlight;});
    if(hb&&hb.alive){
      var pulse=0.5+0.5*Math.sin(Date.now()*0.008);
      ctx.strokeStyle='rgba(255,255,100,'+(0.5+pulse*0.5)+')';
      ctx.lineWidth=3+pulse*2;
      var bx=hb.px,by=hb.py;
      var bw=hb.dir==='l'||hb.dir==='r'?hb.len*G.cellSize-4:G.cellSize-4;
      var bh=hb.dir==='l'||hb.dir==='r'?G.cellSize-4:hb.len*G.cellSize-4;
      if(hb.dir==='u'||hb.dir==='d'){bx=hb.px;by=hb.py;}
      ctx.strokeRect(bx+2,by+2,bw,bh);
    }
    G.hintTimer--;
  }
  // Particles
  G.particles.forEach(function(p){
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.col;
    ctx.beginPath();ctx.arc(p.x-G.gridOX,p.y-G.gridOY,p.size,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;
  ctx.restore();
  // Confetti (screen space)
  G.confetti.forEach(function(p){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
    ctx.globalAlpha=p.life;ctx.fillStyle=p.col;
    ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);
    ctx.restore();
  });
  ctx.globalAlpha=1;
  ctx.restore();
  // R395: click-ripples — visual feedback for canvas clicks (handleTap silent returns)
  var now395=performance.now();
  for(var ri=G.ripples.length-1;ri>=0;ri--){
    var rp=G.ripples[ri];
    var age=now395-rp.t;
    if(age>400){G.ripples.splice(ri,1);continue;}
    var progress=age/400;
    var radius=8+progress*36;
    var alpha=(1-progress)*0.75;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.strokeStyle='rgba(255,255,255,0.95)';
    ctx.shadowColor='rgba(255,220,120,0.9)';
    ctx.shadowBlur=14;
    ctx.lineWidth=2.5;
    ctx.beginPath();
    ctx.arc(rp.x,rp.y,radius,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}
// UX-OPT 2026-08-18 R491 INP FIX: pre-render all unique (color,dir,len) bus tuples to an
// offscreen canvas keyed cache, baked once per level load. drawBus() becomes a single
// drawImage call instead of recreating a linear gradient + 10+ beginPath/stroke/fill calls
// per bus per frame. This is the same pattern as R366 walls, applied to buses.
function renderBusesOffscreen(){
  G.busCache={};
  var seen={};
  G.buses.forEach(function(bus){
    if(!bus.alive)return;
    var key=bus.color+'|'+bus.dir+'|'+bus.len;
    if(seen[key])return;
    seen[key]=true;
    // Compute bus body dimensions (matches drawBus layout: +3 padding from origin, -6 inset)
    var w,h;
    if(bus.dir==='l'||bus.dir==='r'){w=bus.len*G.cellSize-6;h=G.cellSize-6;}
    else{w=G.cellSize-6;h=bus.len*G.cellSize-6;}
    var dpr=window.devicePixelRatio||1;
    var off=document.createElement('canvas');
    off.width=Math.ceil(w*dpr);
    off.height=Math.ceil(h*dpr);
    var oc=off.getContext('2d');
    oc.scale(dpr,dpr);
    var x=0,y=0; // origin inside the offscreen canvas — drawBus offset is replicated by the drawImage translate
    var col=COLORS[bus.color];
    // Shadow
    oc.fillStyle='rgba(0,0,0,0.3)';
    roundRect(oc,x+2,y+3,w,h,10);oc.fill();
    // Body gradient (one-time cost, baked into pixels)
    var grad=oc.createLinearGradient(x,y,x,y+h);
    grad.addColorStop(0,col);grad.addColorStop(1,shadeColor(col,-30));
    oc.fillStyle=grad;
    roundRect(oc,x,y,w,h,10);oc.fill();
    // Border
    oc.strokeStyle=shadeColor(col,30);oc.lineWidth=2;
    oc.stroke();
    // Windows (direction indicator)
    oc.fillStyle='rgba(255,255,255,0.25)';
    if(bus.dir==='r'){
      roundRect(oc,x+w-h*0.7,y+h*0.15,h*0.5,h*0.4,4);oc.fill();
      oc.fillStyle='rgba(255,255,255,0.6)';
      drawArrow(oc,x+w-h*0.2,y+h/2,h*0.2,0);
    }else if(bus.dir==='l'){
      roundRect(oc,x+h*0.2,y+h*0.15,h*0.5,h*0.4,4);oc.fill();
      oc.fillStyle='rgba(255,255,255,0.6)';
      drawArrow(oc,x+h*0.2,y+h/2,h*0.2,Math.PI);
    }else if(bus.dir==='d'){
      roundRect(oc,x+w*0.15,y+h-w*0.7,w*0.4,w*0.5,4);oc.fill();
      oc.fillStyle='rgba(255,255,255,0.6)';
      drawArrow(oc,x+w/2,y+h-w*0.2,w*0.2,Math.PI/2);
    }else if(bus.dir==='u'){
      roundRect(oc,x+w*0.15,y+w*0.2,w*0.4,w*0.5,4);oc.fill();
      oc.fillStyle='rgba(255,255,255,0.6)';
      drawArrow(oc,x+w/2,y+w*0.2,w*0.2,-Math.PI/2);
    }
    // Icon — baked text. NB: emoji rendering may differ slightly across browsers but the
    // overall shape/color is what users notice; emoji glyph stays readable in the cache.
    oc.font=Math.floor(Math.min(w,h)*0.35)+'px sans-serif';
    oc.textAlign='center';oc.textBaseline='middle';
    oc.fillText(BUS_ICONS[bus.color]||'🚌',x+w/2,y+h/2);
    G.busCache[key]={canvas:off,w:w,h:h};
  });
  G.busCanvasDirty=false;
}
function drawBus(ctx,bus){
  var x=bus.px,y=bus.py;
  var w,h;
  if(bus.dir==='l'||bus.dir==='r'){w=bus.len*G.cellSize-6;h=G.cellSize-6;x+=3;y+=3;}
  else{w=G.cellSize-6;h=bus.len*G.cellSize-6;x+=3;y+=3;}
  // UX-OPT 2026-08-18 R491 INP FIX: cache lookup — single drawImage replaces ~13 ctx calls/bus/frame
  var key=bus.color+'|'+bus.dir+'|'+bus.len;
  var cached=G.busCache[key];
  if(cached){
    ctx.drawImage(cached.canvas,x,y,cached.w,cached.h);
    return;
  }
  // Fallback inline render — only used if cache miss (shouldn't happen since renderBusesOffscreen
  // pre-bakes every unique bus on level load, but kept for defensive safety if the cache is wiped).
  var col=COLORS[bus.color];
  ctx.fillStyle='rgba(0,0,0,0.3)';
  roundRect(ctx,x+2,y+3,w,h,10);ctx.fill();
  var grad=ctx.createLinearGradient(x,y,x,y+h);
  grad.addColorStop(0,col);grad.addColorStop(1,shadeColor(col,-30));
  ctx.fillStyle=grad;
  roundRect(ctx,x,y,w,h,10);ctx.fill();
  ctx.strokeStyle=shadeColor(col,30);ctx.lineWidth=2;
  ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.25)';
  if(bus.dir==='r'){
    roundRect(ctx,x+w-h*0.7,y+h*0.15,h*0.5,h*0.4,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';
    drawArrow(ctx,x+w-h*0.2,y+h/2,h*0.2,0);
  }else if(bus.dir==='l'){
    roundRect(ctx,x+h*0.2,y+h*0.15,h*0.5,h*0.4,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';
    drawArrow(ctx,x+h*0.2,y+h/2,h*0.2,Math.PI);
  }else if(bus.dir==='d'){
    roundRect(ctx,x+w*0.15,y+h-w*0.7,w*0.4,w*0.5,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';
    drawArrow(ctx,x+w/2,y+h-w*0.2,w*0.2,Math.PI/2);
  }else if(bus.dir==='u'){
    roundRect(ctx,x+w*0.15,y+w*0.2,w*0.4,w*0.5,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';
    drawArrow(ctx,x+w/2,y+w*0.2,w*0.2,-Math.PI/2);
  }
  ctx.font=Math.floor(Math.min(w,h)*0.35)+'px sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(BUS_ICONS[bus.color]||'🚌',x+w/2,y+h/2);
}
function drawArrow(ctx,cx,cy,size,angle){
  ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
  ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size*0.5,-size*0.6);ctx.lineTo(-size*0.5,size*0.6);ctx.closePath();ctx.fill();
  ctx.restore();
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
// UX-OPT 2026-07-31 INP FIX: pre-render static grid cells + wall hatch pattern + gate arrows
// to an offscreen canvas once per level load. render() then drawImage's it instead of
// re-running all beginPath/stroke calls every frame. cellSize is constant per level so this
// is purely a per-level cost. Saved hundreds of ctx calls per frame on mid-size levels.
function renderWallsOffscreen(){
  var lvl=LEVELS[G.levelIdx];
  if(!lvl||!G.cellSize)return;
  // Allocate offscreen canvas — sized to grid bounds + padding for edge gates/arrows
  // Gates at c<1/c>cols/r<1/r>rows extend ~14px outside the grid (for arrow indicator).
  // Add 24px on each side so both gates and arrows render fully without clipping.
  var pad=24;
  var w=G.cellSize*lvl.cols+pad*2;
  var h=G.cellSize*lvl.rows+pad*2;
  if(!G.wallsCanvas){
    G.wallsCanvas=document.createElement('canvas');
  }
  var dpr=window.devicePixelRatio||1;
  G.wallsCanvas.width=Math.ceil(w*dpr);
  G.wallsCanvas.height=Math.ceil(h*dpr);
  G.wallsCanvasW=w;
  G.wallsCanvasH=h;
  var offCtx=G.wallsCanvas.getContext('2d');
  offCtx.setTransform(1,0,0,1,0,0);// reset
  offCtx.scale(dpr,dpr);
  offCtx.clearRect(0,0,w,h);
  offCtx.save();
  offCtx.translate(pad,pad);
  // Grid cells (constant per level)
  for(var r=1;r<=lvl.rows;r++){
    for(var c=1;c<=lvl.cols;c++){
      var x=(c-1)*G.cellSize,y=(r-1)*G.cellSize;
      offCtx.fillStyle=(r+c)%2===0?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)';
      roundRect(offCtx,x,y,G.cellSize-2,G.cellSize-2,6);offCtx.fill();
      offCtx.strokeStyle='rgba(255,255,255,0.04)';offCtx.lineWidth=1;offCtx.stroke();
    }
  }
  // Walls with hatch pattern (constant per level)
  G.walls.forEach(function(wall){
    var x=(wall.c-1)*G.cellSize,y=(wall.r-1)*G.cellSize;
    offCtx.fillStyle='rgba(100,100,120,0.6)';
    roundRect(offCtx,x+3,y+3,G.cellSize-8,G.cellSize-8,8);offCtx.fill();
    offCtx.strokeStyle='rgba(60,60,80,0.8)';offCtx.lineWidth=2;
    for(var i=0;i<G.cellSize;i+=8){
      offCtx.beginPath();offCtx.moveTo(x+3+i,y+3);offCtx.lineTo(x+3,y+3+i);offCtx.stroke();
    }
  });
  // Gate arrows (constant per level, includes shadow glow for visual fidelity)
  G.gates.forEach(function(g){
    var col=COLORS[g.color];
    var x,y,w,h;
    if(g.c<1){x=-6;y=(g.r-1)*G.cellSize;w=8;h=G.cellSize-2;}
    else if(g.c>lvl.cols){x=lvl.cols*G.cellSize-2;y=(g.r-1)*G.cellSize;w=8;h=G.cellSize-2;}
    else if(g.r<1){x=(g.c-1)*G.cellSize;y=-6;w=G.cellSize-2;h=8;}
    else{x=(g.c-1)*G.cellSize;y=lvl.rows*G.cellSize-2;w=G.cellSize-2;h=8;}
    offCtx.shadowColor=col;offCtx.shadowBlur=15;
    offCtx.fillStyle=col;
    roundRect(offCtx,x,y,w,h,4);offCtx.fill();
    offCtx.shadowBlur=0;
    offCtx.fillStyle='rgba(255,255,255,0.9)';
    offCtx.font='bold '+Math.floor(G.cellSize*0.4)+'px Inter';
    offCtx.textAlign='center';offCtx.textBaseline='middle';
    var ax,ay,ar;
    if(g.c<1){ax=-14;ay=(g.r-1)*G.cellSize+G.cellSize/2;ar=0;}
    else if(g.c>lvl.cols){ax=lvl.cols*G.cellSize+14;ay=(g.r-1)*G.cellSize+G.cellSize/2;ar=Math.PI;}
    else if(g.r<1){ax=(g.c-1)*G.cellSize+G.cellSize/2;ay=-14;ar=Math.PI/2;}
    else{ax=(g.c-1)*G.cellSize+G.cellSize/2;ay=lvl.rows*G.cellSize+14;ar=-Math.PI/2;}
    offCtx.save();offCtx.translate(ax,ay);offCtx.rotate(ar);
    offCtx.beginPath();offCtx.moveTo(-6,-5);offCtx.lineTo(6,0);offCtx.lineTo(-6,5);offCtx.closePath();offCtx.fill();
    offCtx.restore();
  });
  offCtx.restore();
  G.wallsCanvasDirty=false;
}
function shadeColor(hex,percent){
  var num=parseInt(hex.slice(1),16);
  var r=(num>>16)+percent;var g=((num>>8)&0xff)+percent;var b=(num&0xff)+percent;
  r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
  return'#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}

// ============ UPDATE LOOP ============
function update(dt){
  // Animate buses
  var allIdle=true;
  G.buses.forEach(function(bus){
    if(!bus.alive)return;
    var lerpSpeed=0.18;
    bus.px+=(bus.targetPx-bus.px)*lerpSpeed;
    bus.py+=(bus.targetPy-bus.py)*lerpSpeed;
    if(bus.exiting){
      bus.exitProgress+=0.05;
      if(bus.exitProgress>1||Math.abs(bus.targetPx-bus.px)<1&&Math.abs(bus.targetPy-bus.py)<1){
        bus.alive=false;
        playSfx('coin');
      }
      allIdle=false;
    }else if(Math.abs(bus.targetPx-bus.px)>0.5||Math.abs(bus.targetPy-bus.py)>0.5){
      allIdle=false;
    }else{
      bus.px=bus.targetPx;bus.py=bus.targetPy;
    }
  });
  if(allIdle&&G.animating){
    G.animating=false;
    checkWin();
    if(G.buses.filter(function(b){return b.alive;}).length>0){
      checkDeadlock();
    }
  }
  // Particles
  G.particles.forEach(function(p){
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.3;p.life-=0.02;
  });
  G.particles=G.particles.filter(function(p){return p.life>0;});
  // Confetti
  G.confetti.forEach(function(p){
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.rot+=p.vr;p.life-=0.005;
  });
  G.confetti=G.confetti.filter(function(p){return p.life>0&&p.y<G.H+50;});
  // Combo timer
  if(G.comboTimer>0){G.comboTimer--;if(G.comboTimer===0)G.comboCount=0;}
}

// ============ INPUT ============
function getGridPos(clientX,clientY){
  var rect=G.canvas.getBoundingClientRect();
  var x=clientX-rect.left-G.gridOX;
  var y=clientY-rect.top-G.gridOY;
  var c=Math.floor(x/G.cellSize)+1;
  var r=Math.floor(y/G.cellSize)+1;
  return{r:r,c:c,x:x,y:y};
}
function handleTap(clientX,clientY){
  if(G.animating)return;
  initAudio();
  var pos=getGridPos(clientX,clientY);
  // Find bus at this position
  var lvl=LEVELS[G.levelIdx];
  if(pos.r<1||pos.r>lvl.rows||pos.c<1||pos.c>lvl.cols)return;
  for(var i=0;i<G.buses.length;i++){
    var bus=G.buses[i];
    if(!bus.alive)continue;
    var cells=getBusCells(bus);
    if(cells.some(function(cell){return cell.r===pos.r&&cell.c===pos.c;})){
      tryMoveBus(bus);
      playSfx('tap');
      return;
    }
  }
}

// ============ UI ============
function updateHUD(){
  document.getElementById('hud-level').textContent=G.levelIdx+1;
  document.getElementById('hud-moves').textContent=G.moves;
  document.getElementById('hud-par').textContent=G.par;
  var levelKey=String(G.levelIdx+1);
  document.getElementById('hud-stars').textContent=save.stars[levelKey]||0;
}
function updatePowerups(){
  var ue=document.getElementById('cnt-undo'),he=document.getElementById('cnt-hint'),se=document.getElementById('cnt-shuffle');
  ue.textContent=G.undoLeft;he.textContent=G.hintLeft;se.textContent=G.shuffleLeft;
  document.getElementById('pu-undo').classList.toggle('disabled',G.undoLeft<=0);
  document.getElementById('pu-hint').classList.toggle('disabled',G.hintLeft<=0);
  document.getElementById('pu-shuffle').classList.toggle('disabled',G.shuffleLeft<=0);
}
function updateCoinDisplay(){
  document.getElementById('coin-count').textContent=save.coins;
}
var toastTimer=null;
function showToast(msg){
  var t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){t.classList.remove('show');},2000);
}
function buildLevelSelect(){
  var grid=document.getElementById('level-grid-el');
  grid.innerHTML='';
  LEVELS.forEach(function(lvl,i){
    var card=document.createElement('div');
    card.className='level-card';
    var levelNum=i+1;
    var unlocked=levelNum<=save.unlocked;
    if(!unlocked)card.classList.add('locked');
    var stars=save.stars[String(levelNum)]||0;
    if(stars>0)card.classList.add('completed');
    if(levelNum===save.unlocked)card.classList.add('current');
    var starsStr='';
    for(var s=0;s<3;s++)starsStr+=s<stars?'⭐':'☆';
    card.innerHTML='<span class="num">'+(unlocked?levelNum:'🔒')+'</span>'+
      (unlocked?'<span class="mini-stars">'+starsStr+'</span>':'');
    if(unlocked){
      card.addEventListener('click',function(){startLevel(i);});
    }
    grid.appendChild(card);
  });
}
function startLevel(idx){
  document.getElementById('level-select').classList.remove('active');
  document.getElementById('win-overlay').classList.remove('active');
  document.getElementById('fail-overlay').classList.remove('active');
  document.getElementById('start-overlay').classList.remove('active');
  loadLevel(idx);
  if(!G.running){G.running=true;}
  resumeLoop();
  startBGM();
}
function showLevelSelect(){
  document.getElementById('level-select').classList.add('active');
  buildLevelSelect();
}
function hideLevelSelect(){
  document.getElementById('level-select').classList.remove('active');
}

// ============ GAME LOOP — UX-OPT 2026-07-27 INP FIX ============
// Run rAF only while the canvas state is changing. A static board does not need
// polling; stopping it removes recurring canvas work from the input queue.
function isFullyIdle(){
  if(G.animating)return false;
  if(G.screenShake>0)return false;
  if(G.hintHighlight>=0&&G.hintTimer>0)return false;
  for(var i=0;i<G.buses.length;i++){
    var b=G.buses[i];
    if(!b.alive)continue;
    if(Math.abs(b.targetPx-b.px)>0.5||Math.abs(b.targetPy-b.py)>0.5)return false;
  }
  for(var j=0;j<G.confetti.length;j++){if(G.confetti[j].life>0)return false;}
  for(var k=0;k<G.particles.length;k++){if(G.particles[k].life>0)return false;}
  return true;
}
function scheduleNextFrame(){
  if(!G.running)return;
  if(!isFullyIdle()){
    G.rafId=requestAnimationFrame(gameLoop);
  }
}
function gameLoop(now){
  if(!G.running)return;
  G.rafId=null;
  var dt=Math.min((now-G.lastTime)/16.67,3);
  G.lastTime=now;
  update(dt);
  render(dt);
  scheduleNextFrame();
}
function resumeLoop(){
  // Called after input or a canvas resize to draw the newly changed state.
  if(G.running&&!G.rafId){G.lastTime=performance.now();G.rafId=requestAnimationFrame(gameLoop);}
}

// ============ CLEANUP ============
var cleanups=[];
function cleanup(){
  G.running=false;
  if(G.rafId)cancelAnimationFrame(G.rafId);
  G.rafId=null;
  stopBGM();
  if(actx&&actx.state==='running')actx.suspend();
  cleanups.forEach(function(fn){try{fn();}catch(e){}});
}

// ============ INIT ============
function init(){
  setupCanvas();
  updateCoinDisplay();
  // Canvas events
  G.canvas.addEventListener('pointerdown',function(e){
    e.preventDefault();
    resumeLoop();
    // R395: push ripple at click position BEFORE handleTap() — visual feedback
    // so user sees their click registered even when handleTap() returns silently
    // (no bus at cell, animating, or out-of-grid bounds).
    var rect=G.canvas.getBoundingClientRect();
    G.ripples.push({
      x:(e.clientX-rect.left)*(G.W/rect.width),
      y:(e.clientY-rect.top)*(G.H/rect.height),
      t:performance.now()
    });
    handleTap(e.clientX,e.clientY);
  });
  // Buttons
  document.getElementById('btn-start-play').addEventListener('click',function(){
    initAudio();
    startLevel(0);
  });
  document.getElementById('btn-back').addEventListener('click',function(){
    showLevelSelect();
  });
  // Powerups
  // 2026-08-11 R393: when disabled, still show visible feedback (rejected shake) so
  // dead_click detector (1.5s window) sees snapClass != nowClass.
  // 2026-08-31 R620: extended — silent-rejection (G.animating / G.history.length===0 with
  // btn NOT disabled) also adds .rejected via do*() so dead_click doesn't fire there either.
  document.getElementById('pu-undo').addEventListener('click',function(){
    if(this.classList.contains('disabled')){
      this.classList.add('rejected');
      setTimeout(()=>this.classList.remove('rejected'),1700);
      return;
    }
    resumeLoop();doUndo(this);
  });
  document.getElementById('pu-hint').addEventListener('click',function(){
    if(this.classList.contains('disabled')){
      this.classList.add('rejected');
      setTimeout(()=>this.classList.remove('rejected'),1700);
      return;
    }
    resumeLoop();doHint(this);
  });
  document.getElementById('pu-shuffle').addEventListener('click',function(){
    if(this.classList.contains('disabled')){
      this.classList.add('rejected');
      setTimeout(()=>this.classList.remove('rejected'),1700);
      return;
    }
    resumeLoop();doShuffle(this);
  });
  // Win overlay
  document.getElementById('btn-win-next').addEventListener('click',function(){
    resumeLoop();startLevel(G.levelIdx+1);
  });
  document.getElementById('btn-win-replay').addEventListener('click',function(){
    resumeLoop();startLevel(G.levelIdx);
  });
  document.getElementById('btn-win-menu').addEventListener('click',function(){
    document.getElementById('win-overlay').classList.remove('active');
    showLevelSelect();
  });
  // Fail overlay
  document.getElementById('btn-fail-retry').addEventListener('click',function(){
    resumeLoop();startLevel(G.levelIdx);
  });
  document.getElementById('btn-fail-menu').addEventListener('click',function(){
    document.getElementById('fail-overlay').classList.remove('active');
    showLevelSelect();
  });
  // Settings
  var sBtn=document.createElement('button');
  sBtn.className='btn-icon';sBtn.innerHTML='⚙️';sBtn.title='Settings';
  sBtn.style.marginLeft='4px';
  sBtn.addEventListener('click',function(){
    document.getElementById('settings-overlay').classList.add('active');
  });
  document.getElementById('title-bar').insertBefore(sBtn,document.querySelector('.coins'));
  document.getElementById('btn-settings-close').addEventListener('click',function(){
    document.getElementById('settings-overlay').classList.remove('active');
  });
  document.getElementById('toggle-sfx').addEventListener('click',function(){
    save.sfx=!save.sfx;saveSave(save);
    this.classList.toggle('on',save.sfx);
    if(save.sfx)playSfx('tap');
  });
  document.getElementById('toggle-music').addEventListener('click',function(){
    save.music=!save.music;saveSave(save);
    this.classList.toggle('on',save.music);
    if(musicGain)musicGain.gain.value=save.music?0.15:0;
    if(save.music)startBGM();
  });
  document.getElementById('btn-reset').addEventListener('click',function(){
    if(confirm('Reset all progress? This cannot be undone.')){
      save={v:1,unlocked:1,stars:{},bestMoves:{},coins:0,sfx:true,music:true};
      saveSave(save);
      updateCoinDisplay();
      showToast('Progress reset!');
      document.getElementById('settings-overlay').classList.remove('active');
    }
  });
  // Settings toggle init
  document.getElementById('toggle-sfx').classList.toggle('on',save.sfx);
  document.getElementById('toggle-music').classList.toggle('on',save.music);
  // Resize
  window.addEventListener('resize',function(){
    if(G.running){resizeCanvas();
      G.buses.forEach(function(b){b.px=b.c*G.cellSize;b.py=b.r*G.cellSize;b.targetPx=b.px;b.targetPy=b.py;});
      resumeLoop();
    }
  });
  // Page lifecycle
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){stopBGM();if(actx)actx.suspend();}
    else if(G.running&&save.music){if(actx)actx.resume();startBGM();}
  });
  window.addEventListener('beforeunload',cleanup);
  // Start render loop for initial display
  G.running=true;G.lastTime=performance.now();
  loadLevel(0);
  G.rafId=requestAnimationFrame(gameLoop);
}

// Start when DOM is ready
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}

})();
