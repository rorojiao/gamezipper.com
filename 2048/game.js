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

const TILE_COLORS = {
  2:    {bg:'#eee4da',fg:'#776e65',glow:'#eee4da'},
  4:    {bg:'#ede0c8',fg:'#776e65',glow:'#ede0c8'},
  8:    {bg:'#f2b179',fg:'#f9f6f2',glow:'#f2b179'},
  16:   {bg:'#f59563',fg:'#f9f6f2',glow:'#f59563'},
  32:   {bg:'#f67c5f',fg:'#f9f6f2',glow:'#f67c5f'},
  64:   {bg:'#f65e3b',fg:'#f9f6f2',glow:'#f65e3b'},
  128:  {bg:'#edcf72',fg:'#f9f6f2',glow:'#edcf72'},
  256:  {bg:'#edcc61',fg:'#f9f6f2',glow:'#edcc61'},
  512:  {bg:'#edc850',fg:'#f9f6f2',glow:'#edc850'},
  1024: {bg:'#edc53f',fg:'#f9f6f2',glow:'#edc53f'},
  2048: {bg:'#edc22e',fg:'#f9f6f2',glow:'#ffd700'},
  4096: {bg:'#3c3a32',fg:'#f9f6f2',glow:'#ff6b6b'},
  8192: {bg:'#3c3a32',fg:'#f9f6f2',glow:'#c471ed'},
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
let gameOverAnim = null; // {start, duration}
let reached2048 = false;
let fireworks = [];

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

// Background floating particles
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
      color: ['#ffd700','#e94560','#4ecdc4','#f2b179','#c471ed','#538d4e','#edcf72'][i]
    });
  }
}

function spawnMergeParticles(cx, cy, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      r: 2 + Math.random() * 3,
      life: 1,
      decay: 0.015 + Math.random() * 0.01,
      color: color,
      gravity: 0.12
    });
  }
}

function spawnShockwave(cx, cy) {
  shockwaves.push({ x: cx, y: cy, r: 0, maxR: 250, life: 1, decay: 0.025 });
}

function spawnFloatingScore(cx, cy, value) {
  floatingScores.push({
    x: cx, y: cy, value: '+' + value,
    life: 1, decay: 0.018, vy: -1.5
  });
}

function spawnFirework(cx, cy) {
  const colors = ['#ffd700','#ff6b6b','#4ecdc4','#f2b179','#c471ed','#fff'];
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 1.5 + Math.random() * 2.5,
      life: 1,
      decay: 0.008 + Math.random() * 0.008,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.06
    });
  }
}

function triggerCelebration() {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth;
  // Burst fireworks from multiple points
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      spawnFirework(w * 0.2 + Math.random() * w * 0.6, w * 0.2 + Math.random() * w * 0.4);
    }, i * 300);
  }
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
    pCtx.fill();
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
    pCtx.strokeStyle = 'rgba(255,255,255,' + (s.life * 0.4) + ')';
    pCtx.lineWidth = 3 * s.life;
    pCtx.stroke();
  }

  // Floating scores
  for (let i = floatingScores.length - 1; i >= 0; i--) {
    const f = floatingScores[i];
    f.y += f.vy;
    f.life -= f.decay;
    if (f.life <= 0) { floatingScores.splice(i, 1); continue; }
    pCtx.font = 'bold 18px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillStyle = '#ffd200';
    pCtx.globalAlpha = f.life;
    pCtx.fillText(f.value, f.x, f.y);
  }
  pCtx.globalAlpha = 1;

  // Game over shatter effect
  if (gameOverAnim) {
    const elapsed = now - gameOverAnim.start;
    const totalDuration = gameOverAnim.duration;
    if (elapsed < totalDuration + 500) {
      // Gray overlay fading in
      const overlayAlpha = Math.min(0.7, elapsed / 1000);
      pCtx.fillStyle = 'rgba(30,30,50,' + overlayAlpha + ')';
      pCtx.fillRect(0, 0, w, w);
      
      // Shatter tiles from bottom-right to top-left
      for (let r = SIZE - 1; r >= 0; r--) {
        for (let c = SIZE - 1; c >= 0; c--) {
          const idx = (SIZE - 1 - r) * SIZE + (SIZE - 1 - c);
          const delay = idx * 50;
          const t = Math.max(0, elapsed - delay) / 400;
          if (t > 0 && t < 1) {
            const pos = cellPos(r, c);
            // Shatter: scale down + rotate + fade
            pCtx.save();
            pCtx.translate(pos.x, pos.y);
            pCtx.rotate(t * 0.5);
            pCtx.scale(1 - t, 1 - t);
            pCtx.globalAlpha = 1 - t;
            pCtx.fillStyle = 'rgba(255,255,255,0.15)';
            const s = tileSize / 2;
            pCtx.fillRect(-s, -s, tileSize, tileSize);
            pCtx.restore();
            // Spawn a few particles
            if (t > 0.1 && t < 0.15) {
              for (let p = 0; p < 3; p++) {
                particles.push({
                  x: pos.x + (Math.random()-0.5)*20,
                  y: pos.y + (Math.random()-0.5)*20,
                  vx: (Math.random()-0.5)*3,
                  vy: (Math.random()-0.5)*3 - 1,
                  r: 2 + Math.random()*2,
                  life: 1, decay: 0.03,
                  color: '#aaa', gravity: 0.08
                });
              }
            }
          }
        }
      }
    }
  }

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
  cornerR = cellSize * 0.08;
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
  const [r,c] = empty[Math.floor(Math.random()*empty.length)];
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

  // Spawn merge particles and effects after merge animation starts
  setTimeout(() => {
    for (const ma of mergeAnims) {
      const pos = cellPos(ma.r, ma.c);
      const col = getTileColor(ma.val);
      spawnMergeParticles(pos.x, pos.y, col.bg, 15);
      spawnFloatingScore(pos.x, pos.y - tileSize/2, ma.val);
      
      // Shockwave for 256+
      if (ma.val >= 256) {
        spawnShockwave(pos.x, pos.y);
      }
      
      // 2048 celebration
      if (ma.val === 2048 && !reached2048) {
        reached2048 = true;
        triggerCelebration();
        playCheerSound();
      }
    }
  }, ANIM_DURATION);

  // Score bounce
  scoreAnimTime = now;

  // Check for new max tile
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
  
  // Score bounce animation via CSS
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
  return TILE_COLORS[val] || {bg:'#3c3a32',fg:'#f9f6f2',glow:'#ff6b6b'};
}

function drawTile(cx, cy, val, scale=1, alpha=1, motionBlur=null) {
  if (!val) return;
  const col = getTileColor(val);
  const s = tileSize * scale;
  const x = cx - s/2, y = cy - s/2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Motion blur effect
  if (motionBlur) {
    ctx.shadowColor = col.glow;
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = motionBlur.dx * 8;
    ctx.shadowOffsetY = motionBlur.dy * 8;
  } else {
    ctx.shadowColor = col.glow;
    ctx.shadowBlur = 8 * scale;
  }

  // Gradient bg
  const grad = ctx.createLinearGradient(x, y, x+s, y+s);
  grad.addColorStop(0, col.bg);
  grad.addColorStop(1, shadeColor(col.bg, -15));
  ctx.fillStyle = grad;
  drawRoundRect(x, y, s, s, cornerR * scale);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Text
  ctx.fillStyle = col.fg;
  const fontSize = val >= 1024 ? s*0.28 : val >= 128 ? s*0.33 : s*0.4;
  ctx.font = `bold ${fontSize}px 'PingFang SC','Microsoft YaHei',sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(val, cx, cy + 1);

  ctx.restore();
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

  // Background
  ctx.fillStyle = '#16213e';
  drawRoundRect(0,0,w,w,12);
  ctx.fill();

  // Grid cells
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    const pos = cellPos(r,c);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    drawRoundRect(pos.x-tileSize/2, pos.y-tileSize/2, tileSize, tileSize, cornerR);
    ctx.fill();
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
      // Motion blur direction
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
        // Exaggerated bounce: scale 0 → 1.5 → 1 with overshoot
        let scale;
        if (t < 0.3) {
          scale = (t / 0.3) * 1.5; // 0 → 1.5
        } else if (t < 0.6) {
          scale = 1.5 - 0.5 * ((t - 0.3) / 0.3); // 1.5 → 1.0
        } else if (t < 0.8) {
          scale = 1.0 + 0.12 * Math.sin(((t - 0.6) / 0.2) * Math.PI); // small bounce
        } else {
          scale = 1.0;
        }
        movingTiles.push({cx:pos.x, cy:pos.y, val:a.val, scale, alpha:1});
      }
    } else if (a.type === 'spawn') {
      animatedCells.add(a.r + ',' + a.c);
      const pos = cellPos(a.r, a.c);
      // Pop: scale 0 → 1.15 → 1, alpha 0 → 1
      let scale, alpha;
      if (t < 0.6) {
        scale = (t / 0.6) * 1.15;
        alpha = t / 0.6;
      } else {
        scale = 1.15 - 0.15 * ((t - 0.6) / 0.4);
        alpha = 1;
      }
      movingTiles.push({cx:pos.x, cy:pos.y, val:a.val, scale, alpha});
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
