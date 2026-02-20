(() => {
'use strict';

// === Web Audio ===
let audioCtx, maxTileReached=0;
function getAC(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function playSwipeSound(){
  try{const ac=getAC();const o=ac.createOscillator();const g=ac.createGain();
  o.connect(g);g.connect(ac.destination);o.type='sine';
  o.frequency.setValueAtTime(200,ac.currentTime);o.frequency.linearRampToValueAtTime(150,ac.currentTime+0.06);
  g.gain.setValueAtTime(0.08,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.06);
  o.start(ac.currentTime);o.stop(ac.currentTime+0.06);}catch(e){}
}
function playMergeSound(){
  try{const ac=getAC();const o=ac.createOscillator();const g=ac.createGain();
  o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=520;
  g.gain.setValueAtTime(0.2,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.12);
  o.start(ac.currentTime);o.stop(ac.currentTime+0.12);}catch(e){}
}
function playCheerSound(){
  try{const ac=getAC();
  [523,659,784,1047].forEach((f,i)=>{const o=ac.createOscillator();const g=ac.createGain();
  o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;
  g.gain.setValueAtTime(0.2,ac.currentTime+i*0.1);g.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+i*0.1+0.3);
  o.start(ac.currentTime+i*0.1);o.stop(ac.currentTime+i*0.1+0.3);});}catch(e){}
}

// === Tile Sprite Images ===
const tileImages = {};
const TILE_IMG_MAP = {2:'tile_grey',4:'tile_yellow',8:'tile_orange',16:'tile_red',32:'tile_blue',64:'tile_pink',128:'tile_green',256:'tile_red',512:'tile_pink',1024:'tile_blue',2048:'tile_yellow',4096:'tile_red',8192:'tile_black'};
Object.entries(TILE_IMG_MAP).forEach(([val,name])=>{
  const img=new Image();img.src='images/'+name+'.png';tileImages[val]=img;
});
const bgSpaceImg=new Image();bgSpaceImg.src='images/bg_space.png';
let bgSpacePattern=null;
bgSpaceImg.onload=function(){
  const tmpC=document.createElement('canvas');tmpC.width=256;tmpC.height=256;
  const tmpCtx=tmpC.getContext('2d');tmpCtx.drawImage(bgSpaceImg,0,0);
  bgSpacePattern=ctx.createPattern(tmpC,'repeat');
};
const meteorImg1=new Image();meteorImg1.src='images/meteor1.png';
const meteorImg2=new Image();meteorImg2.src='images/meteor2.png';

// 🌌 Cosmic Galaxy Theme Colors
const TILE_COLORS = {
  2:    {bg:'#7f8c8d',fg:'#f9fafb',glow:'#95a5a6',name:'Asteroid'},
  4:    {bg:'#f1c40f',fg:'#1a1a2e',glow:'#f7dc6f',name:'Moon'},
  8:    {bg:'#e67e22',fg:'#fff',glow:'#f0a04b',name:'Mars'},
  16:   {bg:'#f39c12',fg:'#fff',glow:'#f7c948',name:'Sun'},
  32:   {bg:'#3498db',fg:'#fff',glow:'#5dade2',name:'Blue Giant'},
  64:   {bg:'#9b59b6',fg:'#fff',glow:'#bb8fce',name:'Nebula'},
  128:  {bg:'#ecf0f1',fg:'#1a1a2e',glow:'#f5f7f8',name:'White Dwarf'},
  256:  {bg:'#e74c3c',fg:'#fff',glow:'#f1948a',name:'Supernova'},
  512:  {bg:'#8e44ad',fg:'#fff',glow:'#af7ac5',name:'Black Hole'},
  1024: {bg:'#2980b9',fg:'#fff',glow:'#5499c7',name:'Galaxy'},
  2048: {bg:'#f1c40f',fg:'#fff',glow:'#f7dc6f',name:'Universe'},
  4096: {bg:'#dc2626',fg:'#fff',glow:'#ff6b6b',name:'Multiverse'},
  8192: {bg:'#7c3aed',fg:'#fff',glow:'#c471ed',name:'Infinity'},
};

const SIZE = 4;
const ANIM_DURATION = 120;
const SPAWN_DURATION = 200;
const MERGE_DURATION = 250;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const undoCountEl = document.getElementById('undo-count');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

let grid, score, bestScore, undoLeft, prevState, animations, isAnimating, gameOver;
let cellSize, padding, gridX, gridY, tileSize, cornerR;

// === Particle System ===
const pCanvas = document.createElement('canvas');
pCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;border-radius:12px;z-index:5';
document.getElementById('canvas-wrap').appendChild(pCanvas);
const pCtx = pCanvas.getContext('2d');
let particles = [];
let bgParticles = [];
let shockwaves = [];
let floatingScores = [];
let scoreAnimTime = 0;
let lastMoveDir = null;
let gameOverAnim = null;
let reached2048 = false;
let fireworks = [];
let supernovaRings = []; // For 256+ merge supernova effect
let cometTrails = []; // Comet tail afterimages
let breathePhase = 0; // For tile breathing glow

function resizeParticleCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth;
  const h = wrap.clientHeight || w;
  const dpr = window.devicePixelRatio || 1;
  pCanvas.width = w * dpr;
  pCanvas.height = h * dpr;
  pCanvas.style.width = w + 'px';
  pCanvas.style.height = h + 'px';
  pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initBgParticles() {
  bgParticles = [];
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth;
  for (let i = 0; i < 7; i++) {
    bgParticles.push({
      x: Math.random() * w,
      y: Math.random() * w,
      r: 4 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: 0.06 + Math.random() * 0.08,
      color: ['#a78bfa','#818cf8','#60a5fa','#c084fc','#e879f9','#38bdf8','#fbbf24'][i]
    });
  }
}

function spawnMergeParticles(cx, cy, color, count) {
  // Spawn 25 particles for cosmic explosion
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const speed = 2.5 + Math.random() * 5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      r: 2 + Math.random() * 4,
      life: 1,
      decay: 0.012 + Math.random() * 0.01,
      color: color,
      gravity: 0.1
    });
  }
}

function spawnShockwave(cx, cy) {
  shockwaves.push({ x: cx, y: cy, r: 0, maxR: 250, life: 1, decay: 0.02, color: 'rgba(255,255,255,' });
}

// Supernova rings for 256+ merges
function spawnSupernovaRings(cx, cy, val) {
  const colors = val >= 1024 ? ['#74b9ff','#a0d8ff','#ffffff'] :
                 val >= 512 ? ['#ecf0f1','#bdc3c7','#74b9ff'] :
                 ['#e74c3c','#ff6b6b','#ffd700'];
  for (let i = 0; i < 3; i++) {
    supernovaRings.push({
      x: cx, y: cy, r: 5 + i * 8, maxR: 150 + i * 60,
      life: 1, decay: 0.015 - i * 0.003,
      color: colors[i], width: 4 - i
    });
  }
}

// Comet trail afterimages
function spawnCometTrail(fromX, fromY, toX, toY, color) {
  for (let i = 1; i <= 3; i++) {
    const t = i * 0.25;
    cometTrails.push({
      x: fromX + (toX - fromX) * (1 - t),
      y: fromY + (toY - fromY) * (1 - t),
      life: 0.3 + (3 - i) * 0.15,
      decay: 0.04,
      alpha: 0.15 + (3 - i) * 0.1,
      color: color,
      size: tileSize * (0.6 + (3 - i) * 0.1)
    });
  }
}

function spawnFloatingScore(cx, cy, value) {
  floatingScores.push({
    x: cx, y: cy, value: '+' + value,
    life: 1, decay: 0.018, vy: -1.5
  });
}

function spawnFirework(cx, cy) {
  const colors = ['#a78bfa','#818cf8','#60a5fa','#fbbf24','#e879f9','#fff','#38bdf8'];
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 1.5 + Math.random() * 3,
      life: 1,
      decay: 0.007 + Math.random() * 0.008,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.05
    });
  }
}

// 2048 Black hole → Big bang celebration
function trigger2048Celebration() {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth;
  const cx = w / 2, cy = w / 2;

  // Phase 1: Black hole collapse - all tiles attracted to center (visual only)
  // Spawn inward-moving particles
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 150;
    particles.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * (3 + Math.random() * 4),
      vy: -Math.sin(angle) * (3 + Math.random() * 4),
      r: 2 + Math.random() * 3,
      life: 1, decay: 0.025,
      color: ['#a78bfa','#ffd700','#60a5fa','#e879f9'][Math.floor(Math.random()*4)],
      gravity: 0
    });
  }

  // Phase 2: Big bang explosion after 300ms
  setTimeout(() => {
    // 200+ particles
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 10;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1 + Math.random() * 4,
        life: 1, decay: 0.004 + Math.random() * 0.006,
        color: ['#ffd700','#ff6b6b','#a78bfa','#60a5fa','#e879f9','#38bdf8','#fff','#fbbf24'][Math.floor(Math.random()*8)],
        gravity: 0.02
      });
    }
    // 5 waves of fireworks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        spawnFirework(cx * 0.3 + Math.random() * w * 0.4, cy * 0.3 + Math.random() * w * 0.4);
      }, i * 400);
    }
    // Multiple shockwaves
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnShockwave(cx, cy), i * 200);
    }
  }, 300);
}

function triggerCelebration() {
  trigger2048Celebration();
}

function animateParticleLayer(now) {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth;
  pCtx.clearRect(0, 0, w, w);

  // Background floating particles
  for (const p of bgParticles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -20) p.x = w + 20;
    if (p.x > w + 20) p.x = -20;
    if (p.y < -20) p.y = w + 20;
    if (p.y > w + 20) p.y = -20;
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = p.color;
    pCtx.globalAlpha = p.alpha;
    pCtx.fill();
  }
  pCtx.globalAlpha = 1;

  // Comet trails
  for (let i = cometTrails.length - 1; i >= 0; i--) {
    const t = cometTrails[i];
    t.life -= t.decay;
    if (t.life <= 0) { cometTrails.splice(i, 1); continue; }
    pCtx.globalAlpha = t.life * t.alpha;
    pCtx.fillStyle = t.color;
    const s = t.size * t.life;
    pCtx.beginPath();
    pCtx.arc(t.x, t.y, s / 2 * 0.5, 0, Math.PI * 2);
    pCtx.fill();
  }
  pCtx.globalAlpha = 1;

  // Merge/firework particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    pCtx.fillStyle = p.color;
    pCtx.globalAlpha = p.life;
    // Add glow to particles
    pCtx.shadowColor = p.color;
    pCtx.shadowBlur = 6;
    pCtx.fill();
    pCtx.shadowBlur = 0;
  }
  pCtx.globalAlpha = 1;

  // Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.r += 6;
    s.life -= s.decay;
    if (s.life <= 0) { shockwaves.splice(i, 1); continue; }
    pCtx.beginPath();
    pCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    pCtx.strokeStyle = 'rgba(255,255,255,' + (s.life * 0.5) + ')';
    pCtx.lineWidth = 3 * s.life;
    pCtx.shadowColor = '#fff';
    pCtx.shadowBlur = 10 * s.life;
    pCtx.stroke();
    pCtx.shadowBlur = 0;
  }

  // Supernova rings
  for (let i = supernovaRings.length - 1; i >= 0; i--) {
    const r = supernovaRings[i];
    r.r += 3;
    r.life -= r.decay;
    if (r.life <= 0) { supernovaRings.splice(i, 1); continue; }
    pCtx.beginPath();
    pCtx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    pCtx.strokeStyle = r.color;
    pCtx.globalAlpha = r.life * 0.6;
    pCtx.lineWidth = r.width * r.life;
    pCtx.shadowColor = r.color;
    pCtx.shadowBlur = 15 * r.life;
    pCtx.stroke();
    pCtx.shadowBlur = 0;
  }
  pCtx.globalAlpha = 1;

  // Floating scores
  for (let i = floatingScores.length - 1; i >= 0; i--) {
    const f = floatingScores[i];
    f.y += f.vy;
    f.life -= f.decay;
    if (f.life <= 0) { floatingScores.splice(i, 1); continue; }
    pCtx.font = 'bold 18px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillStyle = '#c4b5fd';
    pCtx.globalAlpha = f.life;
    pCtx.shadowColor = '#a78bfa';
    pCtx.shadowBlur = 8;
    pCtx.fillText(f.value, f.x, f.y);
    pCtx.shadowBlur = 0;
  }
  pCtx.globalAlpha = 1;

  // Game over shatter effect
  if (gameOverAnim) {
    const elapsed = now - gameOverAnim.start;
    const totalDuration = gameOverAnim.duration;
    if (elapsed < totalDuration + 500) {
      const overlayAlpha = Math.min(0.7, elapsed / 1000);
      pCtx.fillStyle = 'rgba(5,5,20,' + overlayAlpha + ')';
      pCtx.fillRect(0, 0, w, w);
      for (let r = SIZE - 1; r >= 0; r--) {
        for (let c = SIZE - 1; c >= 0; c--) {
          const idx = (SIZE - 1 - r) * SIZE + (SIZE - 1 - c);
          const delay = idx * 50;
          const t = Math.max(0, elapsed - delay) / 400;
          if (t > 0 && t < 1) {
            const pos = cellPos(r, c);
            pCtx.save();
            pCtx.translate(pos.x, pos.y);
            pCtx.rotate(t * 0.5);
            pCtx.scale(1 - t, 1 - t);
            pCtx.globalAlpha = 1 - t;
            pCtx.fillStyle = 'rgba(167,139,250,0.15)';
            const s = tileSize / 2;
            pCtx.fillRect(-s, -s, tileSize, tileSize);
            pCtx.restore();
            if (t > 0.1 && t < 0.15) {
              for (let p = 0; p < 3; p++) {
                particles.push({
                  x: pos.x + (Math.random()-0.5)*20,
                  y: pos.y + (Math.random()-0.5)*20,
                  vx: (Math.random()-0.5)*3,
                  vy: (Math.random()-0.5)*3 - 1,
                  r: 2 + Math.random()*2,
                  life: 1, decay: 0.03,
                  color: '#a78bfa', gravity: 0.08
                });
              }
            }
          }
        }
      }
    }
  }

  // Update breathe phase
  breathePhase = (now % 3000) / 3000;

  requestAnimationFrame(animateParticleLayer);
}

function resize() {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = w * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = w + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  padding = w * 0.03;
  cellSize = (w - padding * 5) / 4;
  tileSize = cellSize - padding * 0.4;
  gridX = 0; gridY = 0;
  cornerR = 16; // Larger corner radius for planets
  resizeParticleCanvas();
}

function init() {
  grid = Array.from({length:SIZE}, () => Array(SIZE).fill(0));
  score = 0;
  undoLeft = 3;
  prevState = null;
  animations = [];
  isAnimating = false;
  gameOver = false;
  maxTileReached = 0;
  gameOverAnim = null;
  reached2048 = false;
  particles = [];
  shockwaves = [];
  floatingScores = [];
  fireworks = [];
  supernovaRings = [];
  cometTrails = [];
  gameOverEl.style.display = 'none';
  bestScore = parseInt(localStorage.getItem('best2048') || '0');
  spawnTile(); spawnTile();
  updateUI();
  initBgParticles();
}

function saveState() {
  prevState = {grid: grid.map(r=>[...r]), score};
}

function spawnTile() {
  const empty = [];
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (!grid[r][c]) empty.push([r,c]);
  if (!empty.length) return;
  
  // Smart spawn: weight positions away from the max tile for better gameplay
  let maxVal = 0, maxR = 0, maxC = 0;
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    if (grid[r][c] > maxVal) { maxVal = grid[r][c]; maxR = r; maxC = c; }
  }
  
  // Calculate weights: farther from max tile = higher weight
  const weights = empty.map(([r,c]) => {
    const dist = Math.abs(r - maxR) + Math.abs(c - maxC);
    return 1 + dist * 1.5; // Distance-based weighting
  });
  const totalWeight = weights.reduce((a,b) => a+b, 0);
  let rand = Math.random() * totalWeight;
  let chosen = empty[0];
  for (let i = 0; i < empty.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { chosen = empty[i]; break; }
  }
  
  const [r,c] = chosen;
  const val = Math.random() < 0.9 ? 2 : 4;
  grid[r][c] = val;
  animations.push({type:'spawn',r,c,val,start:performance.now(),duration:SPAWN_DURATION});
}

function cellPos(row, col) {
  return {
    x: padding + col * (cellSize + padding) + cellSize/2,
    y: padding + row * (cellSize + padding) + cellSize/2
  };
}

function move(dir) {
  if (isAnimating || gameOver) return;
  saveState();
  lastMoveDir = dir;
  let moved = false;
  const moveAnims = [];
  const mergeAnims = [];
  const newGrid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));
  const merged = Array.from({length:SIZE}, ()=>Array(SIZE).fill(false));

  const tiles = [];
  if (dir === 'up') { for (let c=0;c<SIZE;c++) for (let r=0;r<SIZE;r++) if(grid[r][c]) tiles.push({r,c,v:grid[r][c]}); }
  else if (dir === 'down') { for (let c=0;c<SIZE;c++) for (let r=SIZE-1;r>=0;r--) if(grid[r][c]) tiles.push({r,c,v:grid[r][c]}); }
  else if (dir === 'left') { for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if(grid[r][c]) tiles.push({r,c,v:grid[r][c]}); }
  else { for (let r=0;r<SIZE;r++) for (let c=SIZE-1;c>=0;c--) if(grid[r][c]) tiles.push({r,c,v:grid[r][c]}); }

  for (const t of tiles) {
    let {r,c,v} = t;
    let nr=r, nc=c;
    while (true) {
      let tr=nr,tc=nc;
      if (dir==='up') tr--;
      else if (dir==='down') tr++;
      else if (dir==='left') tc--;
      else tc++;
      if (tr<0||tr>=SIZE||tc<0||tc>=SIZE) break;
      if (newGrid[tr][tc] === 0) { nr=tr; nc=tc; }
      else if (newGrid[tr][tc] === v && !merged[tr][tc]) { nr=tr; nc=tc; break; }
      else break;
    }
    if (newGrid[nr][nc] === v && !merged[nr][nc]) {
      newGrid[nr][nc] = v*2;
      merged[nr][nc] = true;
      score += v*2;
      if (nr!==r||nc!==c) moved=true;
      moveAnims.push({type:'move',fromR:r,fromC:c,toR:nr,toC:nc,val:v,start:0,duration:ANIM_DURATION,dir});
      mergeAnims.push({type:'merge',r:nr,c:nc,val:v*2,start:0,duration:MERGE_DURATION});
    } else {
      newGrid[nr][nc] = v;
      if (nr!==r||nc!==c) {
        moved=true;
        moveAnims.push({type:'move',fromR:r,fromC:c,toR:nr,toC:nc,val:v,start:0,duration:ANIM_DURATION,dir});
      }
    }
  }

  if (!moved) { prevState=null; return; }

  grid = newGrid;
  isAnimating = true;
  const now = performance.now();
  moveAnims.forEach(a => a.start = now);
  mergeAnims.forEach(a => a.start = now + ANIM_DURATION);
  animations = [...moveAnims, ...mergeAnims];

  playSwipeSound();
  if(mergeAnims.length>0) setTimeout(playMergeSound, ANIM_DURATION);

  // Spawn comet trails for moving tiles
  setTimeout(() => {
    for (const ma of moveAnims) {
      const from = cellPos(ma.fromR, ma.fromC);
      const to = cellPos(ma.toR, ma.toC);
      const col = getTileColor(ma.val);
      spawnCometTrail(from.x, from.y, to.x, to.y, col.glow);
    }
  }, 20);

  // Spawn merge particles and effects after merge animation starts
  setTimeout(() => {
    for (const ma of mergeAnims) {
      const pos = cellPos(ma.r, ma.c);
      const col = getTileColor(ma.val);
      spawnMergeParticles(pos.x, pos.y, col.glow, 25);
      spawnShockwave(pos.x, pos.y);
      spawnFloatingScore(pos.x, pos.y - tileSize/2, ma.val);
      
      // Supernova for 256+
      if (ma.val >= 256) {
        spawnSupernovaRings(pos.x, pos.y, ma.val);
        // Full-screen white flash 0.3s
        const flash = document.getElementById('supernova-flash');
        if (flash) { flash.style.opacity = '0.7'; setTimeout(() => { flash.style.opacity = '0'; }, 300); }
      }
      
      // 2048 celebration
      if (ma.val === 2048 && !reached2048) {
        reached2048 = true;
        triggerCelebration();
        playCheerSound();
      }
    }
  }, ANIM_DURATION);

  scoreAnimTime = now;

  let currentMax=0;
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(newGrid[r][c]>currentMax) currentMax=newGrid[r][c];
  if(currentMax>maxTileReached){maxTileReached=currentMax; if(currentMax>=128 && currentMax !== 2048) setTimeout(playCheerSound, ANIM_DURATION+50);}

  setTimeout(() => {
    spawnTile();
    isAnimating = false;
    if (bestScore < score) { bestScore = score; localStorage.setItem('best2048', bestScore); }
    updateUI();
    if (checkGameOver()) {
      gameOver = true;
      gameOverAnim = { start: performance.now(), duration: SIZE * SIZE * 50 + 400 };
      setTimeout(() => {
        gameOverEl.style.display = 'flex';
        finalScoreEl.textContent = 'Final Score: ' + score;
      }, SIZE * SIZE * 50 + 800);
    }
  }, ANIM_DURATION + MERGE_DURATION + 30);
}

function checkGameOver() {
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    if (!grid[r][c]) return false;
    if (r<SIZE-1 && grid[r][c]===grid[r+1][c]) return false;
    if (c<SIZE-1 && grid[r][c]===grid[r][c+1]) return false;
  }
  return true;
}

function updateUI() {
  scoreEl.textContent = score;
  bestEl.textContent = bestScore;
  undoCountEl.textContent = '(' + undoLeft + ')';
  scoreEl.style.transform = 'scale(1.3)';
  scoreEl.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 100);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function drawRoundRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function getTileColor(val) {
  return TILE_COLORS[val] || {bg:'#3c3a52',fg:'#f9f6f2',glow:'#a78bfa'};
}

function drawTile(cx, cy, val, scale=1, alpha=1, motionBlur=null) {
  if (!val) return;
  const col = getTileColor(val);
  const s = tileSize * scale;
  const x = cx - s/2, y = cy - s/2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Breathing glow effect
  const breathe = Math.sin(breathePhase * Math.PI * 2) * 0.3 + 0.7;
  const glowIntensity = val >= 256 ? 20 : val >= 64 ? 14 : 10;

  // Motion blur / comet tail
  if (motionBlur) {
    ctx.shadowColor = col.glow;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = motionBlur.dx * 10;
    ctx.shadowOffsetY = motionBlur.dy * 10;
  } else {
    ctx.shadowColor = col.glow;
    ctx.shadowBlur = glowIntensity * breathe * scale;
  }

  // Planet-style gradient
  const grad = ctx.createRadialGradient(cx - s*0.2, cy - s*0.2, s*0.1, cx, cy, s*0.6);
  grad.addColorStop(0, lightenColor(col.bg, 30));
  grad.addColorStop(0.7, col.bg);
  grad.addColorStop(1, shadeColor(col.bg, -25));
  ctx.fillStyle = grad;
  drawRoundRect(x, y, s, s, cornerR * scale);
  ctx.fill();

  // Tile sprite texture overlay
  const tImg = tileImages[val];
  if (tImg && tImg.complete) {
    ctx.save();
    drawRoundRect(x, y, s, s, cornerR * scale);
    ctx.clip();
    ctx.globalAlpha = 0.25;
    ctx.drawImage(tImg, x, y, s, s);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Inner glow highlight
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const innerGrad = ctx.createRadialGradient(cx - s*0.15, cy - s*0.15, 0, cx, cy, s*0.5);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
  innerGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = innerGrad;
  drawRoundRect(x, y, s, s, cornerR * scale);
  ctx.fill();

  // Special: 2048 supernova rainbow border
  if (val === 2048) {
    const hue = (performance.now() / 20) % 360;
    ctx.strokeStyle = `hsl(${hue},100%,70%)`;
    ctx.lineWidth = 3;
    ctx.shadowColor = `hsl(${hue},100%,60%)`;
    ctx.shadowBlur = 15;
    drawRoundRect(x, y, s, s, cornerR * scale);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Text
  ctx.fillStyle = col.fg;
  const fontSize = val >= 1024 ? s*0.28 : val >= 128 ? s*0.33 : s*0.4;
  ctx.font = `bold ${fontSize}px 'PingFang SC','Microsoft YaHei',sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Text glow for high values
  if (val >= 128) {
    ctx.shadowColor = col.glow;
    ctx.shadowBlur = 8;
  }
  ctx.fillText(val, cx, cy + 1);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
}

function shadeColor(color, percent) {
  const num = parseInt(color.replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
}

function draw(now) {
  const w = canvas.width / (window.devicePixelRatio||1);
  ctx.clearRect(0,0,w,w);

  // Deep space background with texture
  if(bgSpacePattern){
    ctx.fillStyle=bgSpacePattern;
    drawRoundRect(0,0,w,w,12);
    ctx.fill();
    // Dark overlay for depth
    const bgGrad = ctx.createRadialGradient(w*0.3, w*0.3, 0, w*0.5, w*0.5, w*0.8);
    bgGrad.addColorStop(0, 'rgba(10,22,40,0.7)');
    bgGrad.addColorStop(0.5, 'rgba(6,14,31,0.8)');
    bgGrad.addColorStop(1, 'rgba(2,6,24,0.9)');
    ctx.fillStyle = bgGrad;
    drawRoundRect(0,0,w,w,12);
    ctx.fill();
  }else{
    const bgGrad = ctx.createRadialGradient(w*0.3, w*0.3, 0, w*0.5, w*0.5, w*0.8);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(0.5, '#060e1f');
    bgGrad.addColorStop(1, '#020618');
    ctx.fillStyle = bgGrad;
    drawRoundRect(0,0,w,w,12);
    ctx.fill();
  }

  // Floating meteor decorations
  if(meteorImg1.complete){
    ctx.globalAlpha=0.08;
    ctx.drawImage(meteorImg1,w*0.85,w*0.05,40,33);
    ctx.drawImage(meteorImg2,w*0.1,w*0.9,35,40);
    ctx.globalAlpha=1;
  }

  // Metal space station border
  ctx.strokeStyle = 'rgba(167,139,250,0.15)';
  ctx.lineWidth = 2;
  drawRoundRect(0,0,w,w,12);
  ctx.stroke();

  // Grid cells - space station style
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    const pos = cellPos(r,c);
    ctx.fillStyle = 'rgba(167,139,250,0.04)';
    drawRoundRect(pos.x-tileSize/2, pos.y-tileSize/2, tileSize, tileSize, cornerR);
    ctx.fill();
    ctx.strokeStyle = 'rgba(167,139,250,0.08)';
    ctx.lineWidth = 1;
    drawRoundRect(pos.x-tileSize/2, pos.y-tileSize/2, tileSize, tileSize, cornerR);
    ctx.stroke();
  }

  // Collect animated positions
  const animatedCells = new Set();
  const movingTiles = [];

  for (const a of animations) {
    const t = Math.min(1, (now - a.start) / a.duration);
    if (t < 0) continue;
    const et = easeOut(Math.max(0, t));

    if (a.type === 'move') {
      animatedCells.add(a.toR + ',' + a.toC);
      const from = cellPos(a.fromR, a.fromC);
      const to = cellPos(a.toR, a.toC);
      const cx = from.x + (to.x - from.x) * et;
      const cy = from.y + (to.y - from.y) * et;
      let motionBlur = null;
      if (t < 0.8) {
        const dirMap = {left:{dx:-1,dy:0},right:{dx:1,dy:0},up:{dx:0,dy:-1},down:{dx:0,dy:1}};
        motionBlur = dirMap[a.dir] ? {dx: dirMap[a.dir].dx * (1-t), dy: dirMap[a.dir].dy * (1-t)} : null;
      }
      movingTiles.push({cx, cy, val: a.val, scale: 1, alpha: 1, motionBlur});
    } else if (a.type === 'merge') {
      if (t > 0) {
        animatedCells.add(a.r + ',' + a.c);
        const pos = cellPos(a.r, a.c);
        // Exaggerated cosmic bounce: 0 → 1.6 → 1
        let scale;
        if (t < 0.25) {
          scale = (t / 0.25) * 1.6;
        } else if (t < 0.5) {
          scale = 1.6 - 0.6 * ((t - 0.25) / 0.25);
        } else if (t < 0.75) {
          scale = 1.0 + 0.15 * Math.sin(((t - 0.5) / 0.25) * Math.PI);
        } else {
          scale = 1.0;
        }
        movingTiles.push({cx:pos.x, cy:pos.y, val:a.val, scale, alpha:1});
      }
    } else if (a.type === 'spawn') {
      animatedCells.add(a.r + ',' + a.c);
      const pos = cellPos(a.r, a.c);
      // Star birth: light point → expand → settle
      let scale, alpha;
      if (t < 0.5) {
        scale = (t / 0.5) * 1.3;
        alpha = t / 0.5;
      } else {
        scale = 1.3 - 0.3 * ((t - 0.5) / 0.5);
        alpha = 1;
      }
      movingTiles.push({cx:pos.x, cy:pos.y, val:a.val, scale, alpha});
      // Flash effect at spawn
      if (t < 0.2) {
        ctx.save();
        ctx.globalAlpha = (1 - t / 0.2) * 0.4;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, tileSize * 0.8 * (t / 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Draw static tiles
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    if (grid[r][c] && !animatedCells.has(r+','+c)) {
      const pos = cellPos(r,c);
      drawTile(pos.x, pos.y, grid[r][c]);
    }
  }

  // Draw animated tiles
  for (const t of movingTiles) {
    drawTile(t.cx, t.cy, t.val, t.scale, t.alpha, t.motionBlur);
  }

  // Clean finished animations
  animations = animations.filter(a => (now - a.start) / a.duration < 1);

  requestAnimationFrame(draw);
}

// Input
let touchStartX, touchStartY;
document.addEventListener('keydown', e => {
  const map = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
  if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
});

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, {passive:true});

document.addEventListener('touchend', e => {
  if (touchStartX == null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (Math.max(adx,ady) < 30) return;
  if (adx > ady) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
  touchStartX = null;
});

const game = {
  restart() { init(); },
  undo() {
    if (!prevState || undoLeft <= 0 || isAnimating) return;
    grid = prevState.grid;
    score = prevState.score;
    undoLeft--;
    prevState = null;
    animations = [];
    gameOver = false;
    gameOverAnim = null;
    gameOverEl.style.display = 'none';
    updateUI();
  }
};
window.game = game;

window.addEventListener('resize', () => { resize(); initBgParticles(); });
resize();
init();
requestAnimationFrame(draw);
requestAnimationFrame(animateParticleLayer);
})();
