#!/bin/bash
# Part 1: HTML head through body start
cat > index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Play Sashigane Online Free | GameZipper</title>
<meta name="description" content="Play Sashigane online free! Divide grid into L-shaped trominoes. Each L has exactly one circle - black for corners, white for tips.">
<link rel="canonical" href="https://gamezipper.com/sashigane/">
<meta property="og:title" content="Sashigane - L-Tromino Region Division Puzzle">
<meta property="og:description" content="Divide the grid into L-shaped trominoes. Each L contains exactly one circle.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://gamezipper.com/sashigane/">
<meta property="og:image" content="https://gamezipper.com/sashigane/icon.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ctitle%3ESashigane icon%3C/title%3E%3Cpath d='M8 8h16v48H8z' fill='%2300f0ff'/%3E%3Cpath d='M24 8h16v16H24z' fill='%2300f0ff'/%3E%3C/svg%3E" type="image/svg+xml">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Sashigane - L-Tromino Region Division Puzzle",
  "url": "https://gamezipper.com/sashigane/",
  "description": "Divide the grid into L-shaped trominoes. Each L contains exactly one circle.",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Any"
}
</script>
HTMLEOF

# Part 2: CSS
cat >> index.html << 'CSSEOF'
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0a0a1a;
  --bg-grad:linear-gradient(135deg,#0a0a1a 0%,#1a1a2e 50%,#16213e 100%);
  --neon:#00f0ff;
  --neon-grad:linear-gradient(135deg,#00f0ff 0%,#00c0ff 100%);
  --text:#e0e0e0;
  --text-dim:#889;
  --wall:#ff3366;
  --wall-glow:0 0 10px #ff3366,0 0 20px #ff3366;
  --region-tint:rgba(0,240,255,0.1);
  --cell-bg:rgba(255,255,255,0.05);
  --circle-black:#111;
  --circle-white:#ddd;
}
body{
  background:var(--bg-grad);
  color:var(--text);
  font-family:system-ui,-apple-system,sans-serif;
  font-size:18px;
  overflow-x:hidden;
  user-select:none;
  -webkit-user-select:none;
  touch-action:manipulation;
  min-height:100vh;
  display:flex;
  flex-direction:column
}
h1{font-size:1.8rem;margin:15px 0 5px;color:var(--neon);text-shadow:0 0 10px var(--neon)}
p.subtitle{color:var(--text-dim);margin-bottom:15px;font-size:0.9rem}
#game-container{
  display:flex;
  flex-direction:column;
  align-items:center;
  width:100%;
  max-width:700px;
  margin:0 auto;
  padding:10px
}
#board-wrapper{
  position:relative;
  margin:10px auto;
  touch-action:none
}
#board{
  display:block;
  border-radius:8px;
  box-shadow:0 10px 30px rgba(0,0,0,0.5);
  background:rgba(0,0,0,0.3)
}
#hud{
  display:flex;
  justify-content:space-between;
  align-items:center;
  width:100%;
  margin:10px 0;
  gap:8px
}
.hud-text{font-size:0.9rem;color:var(--text-dim)}
.timer{font-family:monospace;font-size:1rem;color:var(--neon)}
#controls{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  justify-content:center
}
.game-btn{
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  border:1px solid var(--neon);
  border-radius:8px;
  color:var(--neon);
  padding:10px 16px;
  cursor:pointer;
  font-family:inherit;
  font-size:0.9rem;
  transition:all .2s;
  min-width:44px;
  min-height:44px;
  display:flex;
  align-items:center;
  gap:6px
}
.game-btn--primary{
  background:var(--neon-grad);
  border:none;
  color:#000;
  font-weight:600
}
.game-btn--warning{border-color:#ff9800;color:#ff9800}
.game-btn:hover:not(:disabled){
  transform:translateY(-2px);
  box-shadow:0 5px 15px rgba(0,240,255,0.3)
}
.game-btn:active:not(:disabled){transform:translateY(0)}
.game-btn:disabled{opacity:0.5;cursor:not-allowed}
#level-select{
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:6px;
  width:100%;
  margin-top:10px;
  max-height:280px;
  overflow-y:auto
}
.level-btn{
  background:rgba(0,0,0,0.3);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:6px;
  padding:10px 6px;
  cursor:pointer;
  font-size:0.85rem;
  text-align:center;
  transition:all .2s;
  display:flex;
  flex-direction:column;
  gap:4px
}
.level-btn:hover{
  border-color:var(--neon);
  background:rgba(0,240,255,0.1)
}
.level-btn--completed{
  background:rgba(0,240,255,0.15);
  border-color:var(--neon)
}
.level-btn--locked{
  opacity:0.5;
  cursor:not-allowed;
  pointer-events:none
}
.level-number{font-weight:700;font-size:1.1rem}
.level-tier{font-size:0.75rem;color:var(--text-dim)}
#settings-panel,#help-panel{
  position:fixed;
  top:0;
  left:0;
  right:0;
  bottom:0;
  background:rgba(0,0,0,0.9);
  display:none;
  justify-content:center;
  align-items:center;
  z-index:100;
  padding:20px
}
.settings-content,.help-content{
  background:var(--bg-grad);
  border:1px solid var(--neon);
  border-radius:12px;
  padding:20px;
  max-width:500px;
  width:100%;
  max-height:80vh;
  overflow-y:auto
}
.settings-content h2,.help-content h2{
  color:var(--neon);
  margin-bottom:15px
}
.settings-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin:15px 0
}
.setting-label{font-size:1rem}
.toggle-switch{
  position:relative;
  width:50px;
  height:28px;
  background:#444;
  border-radius:14px;
  cursor:pointer;
  transition:background .3s
}
.toggle-switch--active{background:var(--neon)}
.toggle-switch::after{
  content:"";
  position:absolute;
  top:2px;
  left:2px;
  width:24px;
  height:24px;
  background:#fff;
  border-radius:50%;
  transition:left .3s
}
.toggle-switch--active::after{left:26px}
.help-content p{margin:10px 0;line-height:1.5}
.help-content .rule-number{color:var(--neon);font-weight:700;margin-right:8px}
.help-content .example-block{
  background:rgba(0,0,0,0.3);
  border-radius:8px;
  padding:10px;
  margin:10px 0;
  font-size:0.9rem
}
#confirm-overlay{
  position:fixed;
  top:0;
  left:0;
  right:0;
  bottom:0;
  background:rgba(0,0,0,0.8);
  display:none;
  justify-content:center;
  align-items:center;
  z-index:100
}
.confirm-box{
  background:var(--bg-grad);
  border:1px solid var(--neon);
  border-radius:12px;
  padding:20px;
  max-width:400px;
  text-align:center
}
.confirm-box h3{color:var(--neon);margin-bottom:10px}
.confirm-box p{margin:15px 0}
.confirm-buttons{display:flex;gap:10px;justify-content:center;margin-top:15px}
.confirm-btn{
  padding:10px 20px;
  border-radius:8px;
  cursor:pointer;
  font-size:1rem;
  flex:1;
  max-width:140px;
  transition:all .2s
}
.confirm-btn--cancel{
  background:#444;
  border:1px solid #666;
  color:#fff
}
.confirm-btn--yes{
  background:var(--neon-grad);
  border:none;
  color:#000;
  font-weight:600
}
#win-overlay{
  position:fixed;
  top:0;
  left:0;
  right:0;
  bottom:0;
  background:rgba(0,0,0,0.9);
  display:none;
  justify-content:center;
  align-items:center;
  z-index:100;
  padding:20px
}
.win-content{
  background:var(--bg-grad);
  border:2px solid var(--neon);
  border-radius:16px;
  padding:30px;
  text-align:center;
  animation:winPulse .5s
}
@keyframes winPulse{
  0%,100%{transform:scale(1)}
  50%{transform:scale(1.05)}
}
.win-content h2{
  color:var(--neon);
  font-size:2.5rem;
  margin-bottom:10px
}
.win-stats{
  margin:20px 0;
  font-size:1.1rem;
  color:#fff
}
.win-stat-row{margin:8px 0}
.win-time{color:var(--neon);font-weight:700}
.win-buttons{
  display:flex;
  gap:10px;
  justify-content:center;
  margin-top:20px;
  flex-wrap:wrap
}
.win-btn{
  padding:12px 24px;
  border-radius:8px;
  cursor:pointer;
  font-size:1rem;
  font-weight:600;
  transition:all .2s
}
.win-btn--next{
  background:var(--neon-grad);
  border:none;
  color:#000
}
.win-btn--menu{
  background:#444;
  border:1px solid #666;
  color:#fff
}
.win-btn:hover{transform:translateY(-2px)}
.win-btn:active{transform:translateY(0)}
</style>
</head>
CSSEOF

# Part 3: Body
cat >> index.html << 'BODYEOF'
<body>
<div id="game-container">
<h1>Play Sashigane</h1>
<p class="subtitle">L-Tromino Region Division Puzzle</p>
<div id="hud">
<span class="hud-text">Level <span id="levelNum">1</span></span>
<span class="timer" id="timer">00:00</span>
<span class="hud-text"><span id="moveCount">0</span> moves</span>
</div>
<div id="board-wrapper">
<canvas id="board"></canvas>
</div>
<div id="controls">
<button id="btnHelp" class="game-btn" aria-label="Help - view game rules">?</button>
<button id="btnSettings" class="game-btn" aria-label="Settings - audio and display options">⚙</button>
<button id="btnUndo" class="game-btn" aria-label="Undo last move">↶</button>
<button id="btnRedo" class="game-btn" aria-label="Redo move">↷</button>
<button id="btnHint" class="game-btn" aria-label="Hint - reveal one correct wall">💡</button>
<button id="btnReset" class="game-btn game-btn--warning" aria-label="Reset level - confirm required">↻</button>
</div>
<div id="level-select"></div>
</div>
<div id="settings-panel">
<div class="settings-content">
<h2>Settings</h2>
<div class="settings-row">
<span class="setting-label">Sound Effects</span>
<div class="toggle-switch" id="toggleSfx" role="switch" aria-checked="true" tabindex="0"></div>
</div>
<div class="settings-row">
<span class="setting-label">Background Music</span>
<div class="toggle-switch" id="toggleBgm" role="switch" aria-checked="false" tabindex="0"></div>
</div>
<div class="settings-row">
<span class="setting-label">Show Timer</span>
<div class="toggle-switch" id="toggleTimer" role="switch" aria-checked="true" tabindex="0"></div>
</div>
<button id="closeSettings" class="game-btn game-btn--primary" style="width:100%;margin-top:20px">Close</button>
</div>
</div>
<div id="help-panel">
<div class="help-content">
<h2>How to Play Sashigane</h2>
<p><span class="rule-number">1.</span>Divide the grid into L-shaped trominoes (regions of exactly 3 cells)</p>
<p><span class="rule-number">2.</span>Each L-tromino must contain exactly one circle clue</p>
<p><span class="rule-number">3.</span>Black circles show the corner/elbow of the L</p>
<p><span class="rule-number">4.</span>White circles show a tip/end of the L (one of the two arm ends)</p>
<div class="example-block">
<strong>Example:</strong> If you see a black circle at (2,3), that cell is the corner of its L-tromino. The two arms extend from there in perpendicular directions.
</div>
<p><span class="rule-number">5.</span>Tap internal edges to draw walls separating regions</p>
<p><span class="rule-number">6.</span>Each region must be a valid L-shape (3 cells, corner + two arms)</p>
<p><span class="rule-number">7.</span>Win when all regions are correct and every clue is satisfied!</p>
<button id="closeHelp" class="game-btn game-btn--primary" style="width:100%;margin-top:20px">Got it!</button>
</div>
</div>
<div id="confirm-overlay">
<div class="confirm-box">
<h3>Reset Level?</h3>
<p>Your progress on this level will be lost.</p>
<div class="confirm-buttons">
<button id="confirmCancel" class="confirm-btn confirm-btn--cancel" aria-label="Cancel reset">Cancel</button>
<button id="confirmYes" class="confirm-btn confirm-btn--yes" aria-label="Confirm reset">Reset</button>
</div>
</div>
</div>
<div id="win-overlay">
<div class="win-content">
<h2>Level Complete!</h2>
<div class="win-stats">
<div class="win-stat-row">Time: <span class="win-time" id="winTime">00:00</span></div>
<div class="win-stat-row">Moves: <span id="winMoves">0</span></div>
</div>
<div class="win-buttons">
<button id="nextLevel" class="win-btn win-btn--next">Next Level</button>
<button id="backToMenu" class="win-btn win-btn--menu">Level Select</button>
</div>
</div>
</div>
BODYEOF

# Part 4: LEVELS_DATA + JS (now at end of body, not in head)
cat >> index.html << 'JSEOF'
<script>
(function(){
const LEVELS_DATA=
JSEOF

cat /home/msdn/.hermes/kanban/workspaces/t_31b62c7c/levels-with-id.json >> index.html

cat >> index.html << 'JSEOF2';
const TILE=48;const GRID_COLOR='#222';const CLUE_BLACK_RADIUS=10;const CLUE_WHITE_RADIUS=8;const WALL_THICK=4;const HINT_ALPHA=0.3;let audioCtx,bgmGain,sfxGain;function initAudio(){if(audioCtx)return;audioCtx=new(window.AudioContext||window.webkitAudioContext)();sfxGain=audioCtx.createGain();sfxGain.connect(audioCtx.destination);sfxGain.gain.value=0.3;bgmGain=audioCtx.createGain();bgmGain.connect(audioCtx.destination);bgmGain.gain.value=0}function playTone(freq,dur,type='sine'){if(!audioCtx||!settings.sfx)return;const osc=audioCtx.createOscillator();const env=audioCtx.createGain();osc.type=type;osc.frequency.value=freq;env.gain.setValueAtTime(0.3,audioCtx.currentTime);env.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+dur);osc.connect(env);env.connect(sfxGain);osc.start();osc.stop(audioCtx.currentTime+dur)}function playToggle(){playTone(800,0.1,'triangle')}function playError(){playTone(200,0.3,'sawtooth')}function playWin(){[0,0.1,0.2,0.3].forEach((d,i)=>setTimeout(()=>playTone(600+i*150,0.2,'sine'),d*1000))}function startBgm(){if(!audioCtx)return;bgmGain.gain.value=0.1;const seq=[440,523,659,784,659,523,440,392];let idx=0;function nextNote(){if(!settings.bgm)return;const osc=audioCtx.createOscillator();const env=audioCtx.createGain();osc.frequency.value=seq[idx];env.gain.setValueAtTime(0.1,audioCtx.currentTime);env.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.4);osc.connect(env);env.connect(bgmGain);osc.start();osc.stop(audioCtx.currentTime+0.4);idx=(idx+1)%seq.length;bgmTimer=setTimeout(nextNote,500)}nextNote()}function stopBgm(){if(bgmTimer)clearTimeout(bgmTimer);if(bgmGain)bgmGain.gain.value=0}let bgmTimer;const canvas=document.getElementById('board');const ctx=canvas.getContext('2d');let currentLevelIdx=0;let levelState=null;let history=[],redoStack=[];let timerInterval,seconds=0;let settings={sfx:true,bgm:false,timer:true};let completedLevels=new Set();function loadLevel(idx){currentLevelIdx=idx;const l=LEVELS_DATA.levels[idx];levelState={rows:l.rows,cols:l.cols,clues:l.clues.map(c=>({r:c[0],c:c[1],type:c[2]})),hWallsSol:l.hWallsSol,vWallsSol:l.vWallsSol,hWalls:Array(l.rows).fill(null).map(()=>Array(l.cols+1).fill(false)),vWalls:Array(l.rows+1).fill(null).map(()=>Array(l.cols).fill(false)),moves:0};resizeCanvas();history=[];redoStack=[];seconds=0;updateTimerDisplay();if(timerInterval)clearInterval(timerInterval);if(settings.timer){timerInterval=setInterval(()=>{seconds++;updateTimerDisplay()},1000)}render();document.getElementById('levelNum').textContent=idx+1;document.getElementById('moveCount').textContent=0;document.getElementById('win-overlay').style.display='none'}function resizeCanvas(){if(!levelState)return;canvas.width=levelState.cols*TILE;canvas.height=levelState.rows*TILE;render()}function render(){if(!levelState)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=GRID_COLOR;ctx.fillRect(0,0,canvas.width,canvas.height);levelState.clues.forEach(cl=>{const x=cl.c*TILE+TILE/2,y=cl.r*TILE+TILE/2;ctx.beginPath();ctx.arc(x,y,cl.type==='b'?CLUE_BLACK_RADIUS:CLUE_WHITE_RADIUS,0,Math.PI*2);ctx.fillStyle=cl.type==='b'?'var(--circle-black)':'var(--circle-white)';ctx.fill()});ctx.strokeStyle='var(--wall)';ctx.lineWidth=WALL_THICK;ctx.lineCap='round';for(let r=0;r<levelState.rows;r++){for(let c=0;c<=levelState.cols;c++){if(levelState.hWalls[r][c]){ctx.beginPath();ctx.moveTo(c*TILE,r*TILE+TILE/2);ctx.lineTo((c+1)*TILE,r*TILE+TILE/2);ctx.stroke()}}}for(let r=0;r<=levelState.rows;r++){for(let c=0;c<levelState.cols;c++){if(levelState.vWalls[r][c]){ctx.beginPath();ctx.moveTo(c*TILE+TILE/2,r*TILE);ctx.lineTo(c*TILE+TILE/2,(r+1)*TILE);ctx.stroke()}}}ctx.strokeStyle='#333';ctx.lineWidth=2;for(let r=0;r<=levelState.rows;r++){ctx.beginPath();ctx.moveTo(0,r*TILE);ctx.lineTo(levelState.cols*TILE,r*TILE);ctx.stroke()}for(let c=0;c<=levelState.cols;c++){ctx.beginPath();ctx.moveTo(c*TILE,0);ctx.lineTo(c*TILE,levelState.rows*TILE);ctx.stroke()}}function getEdgeFromEvent(e){const rect=canvas.getBoundingClientRect();const scaleX=canvas.width/rect.width;const scaleY=canvas.height/rect.height;let x,y;if(e.touches){x=e.touches[0].clientX;y=e.touches[0].clientY}else{x=e.clientX;y=e.clientY}const gx=(x-rect.left)*scaleX;const gy=(y-rect.top)*scaleY;const c=Math.floor(gx/TILE);const r=Math.floor(gy/TILE);const localX=gx-c*TILE;const localY=gy-r*TILE;const THRESH=10;if(localX<THRESH&&c>0)return{type:'v',r,c:c-1};if(localX>TILE-THRESH&&c<levelState.cols-1)return{type:'v',r,c};if(localY<THRESH&&r>0)return{type:'h',r:r-1,c};if(localY>TILE-THRESH&&r<levelState.rows-1)return{type:'h',r,c};return null}function toggleEdge(edge){if(!edge)return;history.push(JSON.parse(JSON.stringify({hWalls:levelState.hWalls,vWalls:levelState.vWalls})));redoStack=[];if(edge.type==='h')levelState.hWalls[edge.r][edge.c]=!levelState.hWalls[edge.r][edge.c];else levelState.vWalls[edge.r][edge.c]=!levelState.vWalls[edge.r][edge.c];levelState.moves++;document.getElementById('moveCount').textContent=levelState.moves;playToggle();render();checkWin()}function checkWin(){for(let r=0;r<levelState.rows;r++){for(let c=0;c<=levelState.cols;c++){if(levelState.hWalls[r][c]!==levelState.hWallsSol[r][c])return}for(let c=0;c<levelState.cols;c++){if(levelState.vWalls[r][c]!==levelState.vWallsSol[r][c])return}}if(timerInterval)clearInterval(timerInterval);playWin();completedLevels.add(currentLevelIdx);saveProgress();document.getElementById('winTime').textContent=formatTime(seconds);document.getElementById('winMoves').textContent=levelState.moves;document.getElementById('win-overlay').style.display='flex';updateLevelSelect()}function formatTime(s){const m=Math.floor(s/60);const ss=s%60;return\`\${m.toString().padStart(2,'0')}:\${ss.toString().padStart(2,'0')}\`}function updateTimerDisplay(){document.getElementById('timer').textContent=formatTime(seconds)}canvas.addEventListener('click',e=>{initAudio();const edge=getEdgeFromEvent(e);toggleEdge(edge)});canvas.addEventListener('touchend',e=>{e.preventDefault();initAudio();const touch=e.changedTouches[0];const edge=getEdgeFromEvent({clientX:touch.clientX,clientY:touch.clientY,rect:canvas.getBoundingClientRect()});toggleEdge(edge)});document.getElementById('btnUndo').addEventListener('click',()=>{if(history.length>0){redoStack.push(JSON.parse(JSON.stringify({hWalls:levelState.hWalls,vWalls:levelState.vWalls})));const prev=history.pop();levelState.hWalls=prev.hWalls;levelState.vWalls=prev.vWalls;render()}});document.getElementById('btnRedo').addEventListener('click',()=>{if(redoStack.length>0){history.push(JSON.parse(JSON.stringify({hWalls:levelState.hWalls,vWalls:levelState.vWalls})));const next=redoStack.pop();levelState.hWalls=next.hWalls;levelState.vWalls=next.vWalls;render()}});document.getElementById('btnReset').addEventListener('click',()=>{document.getElementById('confirm-overlay').style.display='flex'});document.getElementById('confirmCancel').addEventListener('click',()=>{document.getElementById('confirm-overlay').style.display='none'});document.getElementById('confirmYes').addEventListener('click',()=>{loadLevel(currentLevelIdx);document.getElementById('confirm-overlay').style.display='none'});document.getElementById('nextLevel').addEventListener('click',()=>{if(currentLevelIdx<LEVELS_DATA.levels.length-1)loadLevel(currentLevelIdx+1)});document.getElementById('backToMenu').addEventListener('click',()=>{document.getElementById('win-overlay').style.display='none'});document.getElementById('btnHelp').addEventListener('click',()=>{document.getElementById('help-panel').style.display='flex'});document.getElementById('closeHelp').addEventListener('click',()=>{document.getElementById('help-panel').style.display='none'});document.getElementById('btnSettings').addEventListener('click',()=>{document.getElementById('settings-panel').style.display='flex'});document.getElementById('closeSettings').addEventListener('click',()=>{document.getElementById('settings-panel').style.display='none'});function updateToggleState(id,state){const el=document.getElementById(id);if(state)el.classList.add('toggle-switch--active');else el.classList.remove('toggle-switch--active');el.setAttribute('aria-checked',state)}function setupToggle(id,setting){const el=document.getElementById(id);updateToggleState(id,settings[setting]);el.addEventListener('click',()=>{settings[setting]=!settings[setting];updateToggleState(id,settings[setting]);saveSettings();if(setting==='bgm'){if(settings.bgm){initAudio();startBgm()}else stopBgm()}})}setupToggle('toggleSfx','sfx');setupToggle('toggleBgm','bgm');setupToggle('toggleTimer','timer');document.getElementById('btnHint').addEventListener('click',()=>{initAudio();for(let r=0;r<levelState.rows;r++){for(let c=0;c<=levelState.cols;c++){if(levelState.hWallsSol[r][c]&&!levelState.hWalls[r][c]){levelState.hWalls[r][c]=true;render();return}for(let c=0;c<levelState.cols;c++){if(levelState.vWallsSol[r][c]&&!levelState.vWalls[r][c]){levelState.vWalls[r][c]=true;render();return}}}}});function updateLevelSelect(){const sel=document.getElementById('level-select');sel.innerHTML='';LEVELS_DATA.levels.forEach((l,i)=>{const btn=document.createElement('div');btn.className='level-btn';if(i<currentLevelIdx||completedLevels.has(i))btn.classList.add('level-btn--completed');if(i>currentLevelIdx)btn.classList.add('level-btn--locked');btn.innerHTML=\`<div class="level-number">\${i+1}</div><div class="level-tier">\${l.tier}</div>\`;btn.addEventListener('click',()=>{if(i<=currentLevelIdx+1||completedLevels.has(i))loadLevel(i)});sel.appendChild(btn)})}function saveProgress(){localStorage.setItem('sashigane_progress',JSON.stringify({completedLevels:Array.from(completedLevels)}))}function loadProgress(){const d=localStorage.getItem('sashigane_progress');if(d){const p=JSON.parse(d);completedLevels=new Set(p.completedLevels)}}function saveSettings(){localStorage.setItem('sashigane_settings',JSON.stringify(settings))}function loadSettings(){const d=localStorage.getItem('sashigane_settings');if(d)settings=JSON.parse(d)}function init(){loadSettings();loadProgress();updateToggleState('toggleSfx',settings.sfx);updateToggleState('toggleBgm',settings.bgm);updateToggleState('toggleTimer',settings.timer);updateLevelSelect();loadLevel(0)}init()})();
</script>
</body>
</html>
JSEOF2

echo "HTML file rebuilt with correct structure"
