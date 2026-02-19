(() => {
'use strict';

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
const ANIM_DURATION = 120; // ms
const SPAWN_DURATION = 150;
const MERGE_DURATION = 180;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const undoCountEl = document.getElementById('undo-count');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

let grid, score, bestScore, undoLeft, prevState, animations, isAnimating, gameOver;
let cellSize, padding, gridX, gridY, tileSize, cornerR;

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
}

function init() {
  grid = Array.from({length:SIZE}, () => Array(SIZE).fill(0));
  score = 0;
  undoLeft = 3;
  prevState = null;
  animations = [];
  isAnimating = false;
  gameOver = false;
  gameOverEl.style.display = 'none';
  bestScore = parseInt(localStorage.getItem('best2048') || '0');
  spawnTile(); spawnTile();
  updateUI();
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
  let moved = false;
  const moveAnims = [];
  const mergeAnims = [];
  const newGrid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));
  const merged = Array.from({length:SIZE}, ()=>Array(SIZE).fill(false));

  const traverse = (cb) => {
    for (let i=0;i<SIZE;i++) for (let j=0;j<SIZE;j++) cb(i,j);
  };

  // Build ordered tiles based on direction
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
      moveAnims.push({type:'move',fromR:r,fromC:c,toR:nr,toC:nc,val:v,start:0,duration:ANIM_DURATION});
      mergeAnims.push({type:'merge',r:nr,c:nc,val:v*2,start:0,duration:MERGE_DURATION});
    } else {
      newGrid[nr][nc] = v;
      if (nr!==r||nc!==c) {
        moved=true;
        moveAnims.push({type:'move',fromR:r,fromC:c,toR:nr,toC:nc,val:v,start:0,duration:ANIM_DURATION});
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

  setTimeout(() => {
    spawnTile();
    isAnimating = false;
    if (bestScore < score) { bestScore = score; localStorage.setItem('best2048', bestScore); }
    updateUI();
    if (checkGameOver()) {
      gameOver = true;
      gameOverEl.style.display = 'flex';
      finalScoreEl.textContent = 'Final Score: ' + score;
      if(typeof sdk!=='undefined'&&sdk.showBanner)sdk.showBanner();
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

function drawTile(cx, cy, val, scale=1, alpha=1) {
  if (!val) return;
  const col = getTileColor(val);
  const s = tileSize * scale;
  const x = cx - s/2, y = cy - s/2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Shadow
  ctx.shadowColor = col.glow;
  ctx.shadowBlur = 8 * scale;

  // Gradient bg
  const grad = ctx.createLinearGradient(x, y, x+s, y+s);
  grad.addColorStop(0, col.bg);
  grad.addColorStop(1, shadeColor(col.bg, -15));
  ctx.fillStyle = grad;
  drawRoundRect(x, y, s, s, cornerR * scale);
  ctx.fill();

  ctx.shadowBlur = 0;

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
      movingTiles.push({cx, cy, val: a.val, scale: 1, alpha: 1});
    } else if (a.type === 'merge') {
      if (t > 0) {
        animatedCells.add(a.r + ',' + a.c);
        const pos = cellPos(a.r, a.c);
        const scale = t < 0.5 ? 1 + 0.2 * (t/0.5) : 1.2 - 0.2 * ((t-0.5)/0.5);
        movingTiles.push({cx:pos.x, cy:pos.y, val:a.val, scale, alpha:1});
      }
    } else if (a.type === 'spawn') {
      animatedCells.add(a.r + ',' + a.c);
      const pos = cellPos(a.r, a.c);
      const scale = et * 1;
      movingTiles.push({cx:pos.x, cy:pos.y, val:a.val, scale, alpha:et});
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
    drawTile(t.cx, t.cy, t.val, t.scale, t.alpha);
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
    gameOverEl.style.display = 'none';
    updateUI();
  }
};
window.game = game;

window.addEventListener('resize', resize);
resize();
init();
requestAnimationFrame(draw);
})();
