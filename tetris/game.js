'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COLS = 10, ROWS = 20;
const BLOCK_W = 34; // canvas cell size (will be scaled)
const PREVIEW_BLOCK = 18;

// Piece colors (neon cyberpunk palette)
const COLORS = {
  I: '#00f0ff',
  O: '#ffd700',
  T: '#bf00ff',
  S: '#00ff88',
  Z: '#ff2244',
  J: '#0088ff',
  L: '#ff8800'
};

// Piece shapes (each rotation state)
const SHAPES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]]
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]]
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]]
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]]
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]]
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]]
  ]
};

const PIECE_TYPES = ['I','O','T','S','Z','J','L'];
const SCORE_TABLE = [0, 100, 300, 500, 800]; // index = lines cleared

// ─── AUDIO ────────────────────────────────────────────────────────────────────
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, duration, type='square', vol=0.12) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxMove()  { playTone(220, 0.06, 'square', 0.06); }
function sfxRotate() { playTone(330, 0.06, 'square', 0.08); }
function sfxLand()  { playTone(110, 0.12, 'triangle', 0.15); }
function sfxClear() {
  playTone(440, 0.08, 'square', 0.1);
  setTimeout(() => playTone(660, 0.08, 'square', 0.1), 80);
  setTimeout(() => playTone(880, 0.15, 'square', 0.12), 160);
}
function sfxGameOver() {
  playTone(440, 0.2, 'sawtooth', 0.15);
  setTimeout(() => playTone(330, 0.2, 'sawtooth', 0.15), 200);
  setTimeout(() => playTone(220, 0.4, 'sawtooth', 0.12), 400);
}

// ─── GAME STATE ────────────────────────────────────────────────────────────────
let board = [];          // 2D array [row][col], null or color string
let currentPiece = null;
let nextPiece = null;
let score = 0, lines = 0, level = 1;
let gameRunning = false, gamePaused = false;
let lastDropTime = 0;
let animatingLines = []; // rows being cleared (flash animation)
let particles = [];
let soundOn = true;

// ─── CANVAS ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');
let cw, ch, blockW; // canvas px width/height and per-cell size

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  const availW = Math.min(container.clientWidth, 380);
  const availH = container.clientHeight || window.innerHeight * 0.65;
  const aspect = COLS / ROWS;
  if (availH * aspect < availW) {
    ch = availH;
    cw = Math.floor(availH * aspect);
  } else {
    cw = availW;
    ch = Math.floor(availW / aspect);
  }
  canvas.width = cw;
  canvas.height = ch;
  blockW = cw / COLS;
}

// ─── PIECE HELPERS ─────────────────────────────────────────────────────────────
function randomPiece() {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return { type, rot: 0, x: 0, y: 0 };
}

function getShape(type, rot) {
  return SHAPES[type][rot % 4];
}

function getSpawnPos(type) {
  const shape = getShape(type, 0);
  return {
    x: Math.floor((COLS - shape[0].length) / 2),
    y: type === 'I' ? -1 : 0
  };
}

function spawnPiece() {
  if (!nextPiece) nextPiece = randomPiece();
  const p = nextPiece;
  const pos = getSpawnPos(p.type);
  p.x = pos.x;
  p.y = pos.y;
  currentPiece = p;
  nextPiece = randomPiece();
  // Check if spawn is blocked → game over
  if (!validPos(currentPiece, p.x, p.y)) {
    gameOver();
  }
}

// ─── COLLISION ────────────────────────────────────────────────────────────────
// ─── PIECE OPERATIONS ─────────────────────────────────────────────────────────
function moveLeft()  { if (validPos(currentPiece, currentPiece.x - 1, currentPiece.y)) { currentPiece.x--; sfxMove(); } }
function moveRight() { if (validPos(currentPiece, currentPiece.x + 1, currentPiece.y)) { currentPiece.x++; sfxMove(); } }
function moveDown()  {
  if (!gameRunning || gamePaused) return;
  if (validPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++;
    lastDropTime = performance.now();
  } else {
    lockPiece();
  }
}

function rotate() {
  const newRot = (currentPiece.rot + 1) % 4;
  // Try basic rotation
  if (validPos(currentPiece, currentPiece.x, currentPiece.y, newRot)) {
    currentPiece.rot = newRot; sfxRotate(); return;
  }
  // Wall kick (try offsets)
  const kicks = [-1, 1, -2, 2];
  for (const dx of kicks) {
    if (validPos(currentPiece, currentPiece.x + dx, currentPiece.y, newRot)) {
      currentPiece.x += dx; currentPiece.rot = newRot; sfxRotate(); return;
    }
  }
}

function hardDrop() {
  if (!gameRunning || gamePaused) return;
  let dropDist = 0;
  while (validPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++;
    dropDist++;
  }
  score += dropDist * 2;
  updateHUD();
  lockPiece();
}

function validPos(piece, px, py, rotOverride) {
  const rot = rotOverride !== undefined ? rotOverride : piece.rot;
  const shape = getShape(piece.type, rot);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const bx = px + c, by = py + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return false;
      if (by >= 0 && board[by][bx]) return false;
    }
  }
  return true;
}

function ghostY() {
  let gy = currentPiece.y;
  while (true) {
    let can = true;
    const shape = getShape(currentPiece.type, currentPiece.rot);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = currentPiece.x + c, by = gy + 1 + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) { can = false; break; }
        if (by >= 0 && board[by][bx]) { can = false; break; }
      }
      if (!can) break;
    }
    if (!can) break;
    gy++;
  }
  return gy;
}

// ─── LOCK & CLEAR ─────────────────────────────────────────────────────────────
function lockPiece() {
  const shape = getShape(currentPiece.type, currentPiece.rot);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const by = currentPiece.y + r;
      if (by < 0) { gameOver(); return; }
      board[by][currentPiece.x + c] = COLORS[currentPiece.type];
    }
  }
  sfxLand();
  checkLines();
}

function checkLines() {
  const fullRows = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== null)) fullRows.push(r);
  }
  if (fullRows.length === 0) { spawnPiece(); return; }

  // Spawn particles for cleared rows
  for (const row of fullRows) {
    for (let c = 0; c < COLS; c++) {
      const col = board[row][c];
      if (col) {
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: (c + 0.5) * blockW,
            y: (row + 0.5) * blockW,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            color: col,
            life: 1.0,
            size: blockW * 0.25
          });
        }
      }
    }
  }

  sfxClear();

  // Remove rows
  for (const row of fullRows) {
    board.splice(row, 1);
    board.unshift(Array(COLS).fill(null));
  }

  score += SCORE_TABLE[fullRows.length] * level;
  lines += fullRows.length;
  const newLevel = Math.floor(lines / 10) + 1;
  if (newLevel > level) { level = newLevel; }

  updateHUD();
  spawnPiece();
}

// ─── GAME FLOW ────────────────────────────────────────────────────────────────
function startGame() {
  initAudio();
  board = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  score = 0; lines = 0; level = 1;
  currentPiece = null; nextPiece = null;
  animatingLines = []; particles = [];
  gameRunning = true; gamePaused = false;
  lastDropTime = performance.now();
  spawnPiece();
  updateHUD();
  document.getElementById('overlay').classList.add('hidden');
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameRunning = false;
  sfxGameOver();
  const overlay = document.getElementById('overlay');
  overlay.innerHTML = `
    <h2>GAME OVER</h2>
    <div class="final-score">${score}</div>
    <div class="final-label">Score</div>
    <div style="font-size:13px;color:#888;margin-bottom:16px">Lines: ${lines} · Level: ${level}</div>
    <div class="btn-group">
      <button class="btn" onclick="startGame()">🔄 PLAY AGAIN</button>
    </div>
  `;
  overlay.classList.remove('hidden');
  // Trigger Monetag ad on game over
  if (window.GZMonetagSafe) window.GZMonetagSafe.maybeLoad();
}

function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (!gamePaused) { lastDropTime = performance.now(); requestAnimationFrame(gameLoop); }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('score-disp').textContent = score;
  document.getElementById('lines-disp').textContent = lines;
  document.getElementById('level-disp').textContent = level;
}

// ─── GAME LOOP ───────────────────────────────────────────────────────────────
function dropInterval() {
  return Math.max(100, 1000 - (level - 1) * 90); // faster each level
}

function gameLoop(ts) {
  if (!gameRunning || gamePaused) return;

  // Auto drop
  if (ts - lastDropTime > dropInterval()) {
    if (!validPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      lockPiece();
    } else {
      currentPiece.y++;
      lastDropTime = ts;
    }
  }

  updateParticles(ts);
  render(ts);
  if (gameRunning) requestAnimationFrame(gameLoop);
}

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function updateParticles(ts) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2; // gravity
    p.life -= 0.03;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function render(ts) {
  ctx.clearRect(0, 0, cw, ch);

  // Background grid
  ctx.strokeStyle = 'rgba(0,240,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * blockW);
    ctx.lineTo(cw, r * blockW);
    ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * blockW, 0);
    ctx.lineTo(c * blockW, ch);
    ctx.stroke();
  }

  // Board cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c]) continue;
      drawBlock(c, r, board[r][c], 1.0);
    }
  }

  // Ghost piece
  if (currentPiece && gameRunning) {
    const gy = ghostY();
    const shape = getShape(currentPiece.type, currentPiece.rot);
    ctx.globalAlpha = 0.18;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = currentPiece.x + c, by = gy + r;
        if (by >= 0) drawBlock(bx, by, COLORS[currentPiece.type], 0.4);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  // Current piece
  if (currentPiece && gameRunning) {
    const shape = getShape(currentPiece.type, currentPiece.rot);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = currentPiece.x + c, by = currentPiece.y + r;
        if (by >= 0) drawBlock(bx, by, COLORS[currentPiece.type], 1.0);
      }
    }
  }

  // Particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    const s = p.size * p.life;
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    ctx.restore();
  }

  // Pause overlay
  if (gamePaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#00f0ff';
    ctx.font = `bold ${blockW * 1.2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.fillText('PAUSED', cw / 2, ch / 2);
    ctx.shadowBlur = 0;
  }

  // Next piece preview (top-right corner of canvas)
  if (nextPiece && gameRunning) {
    const shape = getShape(nextPiece.type, 0);
    const ph = shape.length, pw = shape[0].length;
    const previewCell = blockW * 0.55;
    const offX = cw - pw * previewCell - 8;
    const offY = 8;
    ctx.globalAlpha = 0.9;
    for (let r = 0; r < ph; r++) {
      for (let c = 0; c < pw; c++) {
        if (!shape[r][c]) continue;
        const px = offX + c * previewCell;
        const py = offY + r * previewCell;
        ctx.fillStyle = COLORS[nextPiece.type];
        ctx.shadowColor = COLORS[nextPiece.type];
        ctx.shadowBlur = 6;
        ctx.fillRect(px + 1, py + 1, previewCell - 2, previewCell - 2);
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    // Label
    ctx.fillStyle = 'rgba(0,240,255,0.6)';
    ctx.font = `${blockW * 0.32}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('NEXT', cw - 4, offY + ph * previewCell + 4);
  }
}

function drawBlock(bx, by, color, alpha) {
  const x = bx * blockW, y = by * blockW, s = blockW;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Main block
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
  // Inner shine
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x + 3, y + 3, s - 10, s - 10);
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
  ctx.restore();
}

// ─── INPUT: KEYBOARD ──────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!gameRunning) return;
  switch (e.code) {
    case 'ArrowLeft':  e.preventDefault(); moveLeft();  break;
    case 'ArrowRight': e.preventDefault(); moveRight(); break;
    case 'ArrowDown':  e.preventDefault(); moveDown(); break;
    case 'ArrowUp':    e.preventDefault(); rotate();    break;
    case 'Space':      e.preventDefault(); hardDrop();  break;
    case 'KeyP':       togglePause(); break;
  }
  render(performance.now());
});

// ─── INPUT: MOBILE DPAD ───────────────────────────────────────────────────────
const btnLeft  = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnUp    = document.getElementById('btn-up');
const btnDown  = document.getElementById('btn-down');

let dpadInterval = null;
function dpadHold(action, intervalFn) {
  action();
  if (dpadInterval) clearInterval(dpadInterval);
  dpadInterval = setInterval(intervalFn, 80);
}
function dpadRelease() {
  if (dpadInterval) { clearInterval(dpadInterval); dpadInterval = null; }
}

btnLeft.addEventListener('touchstart',  e => { e.preventDefault(); initAudio(); dpadHold(moveLeft, moveLeft); }, {passive:false});
btnLeft.addEventListener('touchend',    e => { e.preventDefault(); dpadRelease(); }, {passive:false});
btnRight.addEventListener('touchstart', e => { e.preventDefault(); initAudio(); dpadHold(moveRight, moveRight); }, {passive:false});
btnRight.addEventListener('touchend',   e => { e.preventDefault(); dpadRelease(); }, {passive:false});
btnUp.addEventListener('touchstart',    e => { e.preventDefault(); initAudio(); rotate(); }, {passive:false});
btnDown.addEventListener('touchstart',  e => { e.preventDefault(); initAudio(); dpadHold(moveDown, moveDown); }, {passive:false});
btnDown.addEventListener('touchend',     e => { e.preventDefault(); dpadRelease(); }, {passive:false});

// Also handle click for desktop dpad buttons
btnLeft.addEventListener('click',  () => { initAudio(); moveLeft(); });
btnRight.addEventListener('click', () => { initAudio(); moveRight(); });
btnUp.addEventListener('click',    () => { initAudio(); rotate(); });
btnDown.addEventListener('click',  () => { initAudio(); moveDown(); });

// ─── INPUT: TOUCH SWIPE ON CANVAS ────────────────────────────────────────────
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  initAudio();
  const t = e.touches[0];
  touchStartX = t.clientX; touchStartY = t.clientY; touchStartTime = Date.now();
}, {passive:false});

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (!gameRunning) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);

  if (absDx < 10 && absDy < 10 && dt < 250) {
    // Tap → rotate
    rotate();
  } else if (absDy > absDx && dy > 30 && dt < 400) {
    // Swipe down → hard drop
    hardDrop();
  } else if (absDx > absDy && absDx > 20) {
    if (dx < 0) moveLeft(); else moveRight();
  }
  render(performance.now());
}, {passive:false});

// ─── SOUND TOGGLE ─────────────────────────────────────────────────────────────
let soundMuted = false;
document.getElementById('sound-toggle').addEventListener('click', () => {
  soundMuted = !soundMuted;
  document.getElementById('sound-toggle').textContent = soundMuted ? '🔇 Sound' : '🔊 Sound';
  // Note: audio mute would need refactoring sfx functions
});

// ─── START BUTTON ─────────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', startGame);

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => { resizeCanvas(); render(performance.now()); });
resizeCanvas();
// Initial idle render
ctx.fillStyle = '#0a0a1a';
ctx.fillRect(0, 0, cw, ch);
