/**
 * Minesweeper Game Logic
 * Pure JavaScript, Web Audio API, no external dependencies
 */

'use strict';

// ── Difficulty configs ──────────────────────────────────────────────
const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 }
};

// ── State ────────────────────────────────────────────────────────────
let board = [];
let gameState = 'idle';   // idle | playing | won | lost
let difficulty = 'beginner';
let timerInterval = null;
let elapsedSeconds = 0;
let firstClick = true;
let cursorX = 0, cursorY = 0;
let cellSize = 32;
let boardPixelW = 0, boardPixelH = 0;
let particles = [];

// ── DOM refs (initialized after DOMContentLoaded) ──────────────────
let canvas, ctx;

// ── Audio ───────────────────────────────────────────────────────────
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
}

function playClick() {
  try {
    ensureAudio();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(600, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    o.start(); o.stop(audioCtx.currentTime + 0.12);
  } catch(e) {}
}

function playExplosion() {
  try {
    ensureAudio();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
    }
    const src = audioCtx.createBufferSource();
    const g = audioCtx.createGain();
    src.buffer = buf;
    src.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.5, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    src.start();
  } catch(e) {}
}

function playWin() {
  try {
    ensureAudio();
    const notes = [523, 659, 784, 1047];
    notes.forEach(function(freq, i) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = freq;
      const t = audioCtx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.start(t); o.stop(t + 0.35);
    });
  } catch(e) {}
}

// ── Board initialization ────────────────────────────────────────────
function createBoard(rows, cols) {
  const b = [];
  for (let r = 0; r < rows; r++) {
    b[r] = [];
    for (let c = 0; c < cols; c++) {
      b[r][c] = { revealed: false, flagged: false, mine: false, adjacent: 0 };
    }
  }
  return b;
}

function placeMines(excludeRow, excludeCol) {
  const cfg = DIFFICULTIES[difficulty];
  let placed = 0;
  while (placed < cfg.mines) {
    const r = Math.floor(Math.random() * cfg.rows);
    const c = Math.floor(Math.random() * cfg.cols);
    if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }
}

function floodReveal(r, c) {
  const cfg = DIFFICULTIES[difficulty];
  const stack = [[r, c]];
  const visited = {};
  visited[r + ',' + c] = true;
  while (stack.length) {
    const item = stack.pop();
    const cr = item[0], cc = item[1];
    if (board[cr][cc].revealed) continue;
    board[cr][cc].revealed = true;
    if (board[cr][cc].adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = cr + dr, nc = cc + dc;
          const key = nr + ',' + nc;
          if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && !visited[key]) {
            visited[key] = true;
            if (!board[nr][nc].mine && !board[nr][nc].flagged) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }
  }
}

// ── Timer ───────────────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(function() {
    elapsedSeconds++;
    if (elapsedSeconds >= 999) elapsedSeconds = 999;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay() {
  const el = document.getElementById('ms-timer');
  if (el) el.textContent = String(elapsedSeconds).padStart(3, '0');
}

function updateMinesDisplay() {
  const cfg = DIFFICULTIES[difficulty];
  let flagged = 0;
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      if (board[r][c].flagged) flagged++;
    }
  }
  const remaining = cfg.mines - flagged;
  const el = document.getElementById('ms-mines');
  if (el) {
    el.textContent = String(Math.max(-99, Math.min(99, remaining))).padStart(3, '0').replace('-', '\u2212');
  }
}

// ── Game actions ────────────────────────────────────────────────────
function newGame(diff) {
  difficulty = diff;
  const cfg = DIFFICULTIES[difficulty];
  board = createBoard(cfg.rows, cfg.cols);
  gameState = 'idle';
  firstClick = true;
  stopTimer();
  elapsedSeconds = 0;
  particles = [];
  updateTimerDisplay();
  updateMinesDisplay();
  cursorX = Math.floor(cfg.cols / 2);
  cursorY = Math.floor(cfg.rows / 2);
  resizeCanvas();
  draw();
}

function handleCellClick(r, c) {
  if (gameState === 'won' || gameState === 'lost') return;
  if (board[r][c].revealed || board[r][c].flagged) return;

  if (firstClick) {
    firstClick = false;
    placeMines(r, c);
    gameState = 'playing';
    startTimer();
  }

  if (board[r][c].mine) {
    board[r][c].revealed = true;
    revealAllMines();
    gameState = 'lost';
    stopTimer();
    playExplosion();
    draw();
    spawnExplosionParticles(r, c);
    showGameOverOverlay(false);
    return;
  }

  playClick();
  floodReveal(r, c);
  updateMinesDisplay();
  draw();
  checkWin();
}

function toggleFlag(r, c) {
  if (gameState === 'won' || gameState === 'lost') return;
  if (board[r][c].revealed) return;
  if (gameState === 'idle') {
    gameState = 'playing';
    firstClick = false;
    startTimer();
  }
  board[r][c].flagged = !board[r][c].flagged;
  playClick();
  updateMinesDisplay();
  draw();
}

function revealAllMines() {
  const cfg = DIFFICULTIES[difficulty];
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      if (board[r][c].mine) board[r][c].revealed = true;
    }
  }
}

function checkWin() {
  const cfg = DIFFICULTIES[difficulty];
  const totalCells = cfg.rows * cfg.cols;
  let revealedCount = 0;
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      if (board[r][c].revealed) revealedCount++;
    }
  }
  if (revealedCount === totalCells - cfg.mines) {
    gameState = 'won';
    stopTimer();
    playWin();
    draw();
    showGameOverOverlay(true);
  }
}

function showGameOverOverlay(won) {
  // Trigger Monetag ad on game end
  try {
    if (typeof window.monetagSafe === 'object' && typeof window.monetagSafe.trigger === 'function') {
      window.monetagSafe.trigger();
    }
  } catch(e) {}

  const overlay = document.getElementById('game-over-overlay');
  const title = document.getElementById('go-title');
  const subtitle = document.getElementById('go-subtitle');
  if (!overlay) return;

  if (won) {
    title.textContent = '🎉 YOU WIN!';
    title.style.color = '#00ff88';
    subtitle.textContent = 'Time: ' + elapsedSeconds + 's';
  } else {
    title.textContent = '💥 GAME OVER';
    title.style.color = '#ff4444';
    subtitle.textContent = 'Time: ' + elapsedSeconds + 's';
  }
  overlay.style.display = 'flex';
  window.finalScore = elapsedSeconds;
}

function hideGameOverOverlay() {
  const overlay = document.getElementById('game-over-overlay');
  if (overlay) overlay.style.display = 'none';
  window.finalScore = undefined;
}

function getCurrentDifficulty() {
  return difficulty;
}

// ── Canvas sizing ───────────────────────────────────────────────────
function resizeCanvas() {
  canvas = document.getElementById('ms-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  const cfg = DIFFICULTIES[difficulty];
  const headerH = 140; // roughly ms-header + ms-hud + ms-controls
  const navH = 28;
  const availW = window.innerWidth - 8;
  const availH = window.innerHeight - headerH - navH - 20;

  cellSize = Math.max(20, Math.min(36, Math.floor(Math.min(availW / cfg.cols, availH / cfg.rows))));
  boardPixelW = cfg.cols * cellSize;
  boardPixelH = cfg.rows * cellSize;

  canvas.width = boardPixelW;
  canvas.height = boardPixelH;
  canvas.style.width = boardPixelW + 'px';
  canvas.style.height = boardPixelH + 'px';
}

// ── Drawing ─────────────────────────────────────────────────────────
const NUM_COLORS = ['', '#3498db', '#2ecc71', '#e74c3c', '#2c3e7a', '#8b4513', '#00bcd4', '#111', '#888'];

function draw() {
  if (!ctx) return;
  const cfg = DIFFICULTIES[difficulty];

  ctx.clearRect(0, 0, boardPixelW, boardPixelH);

  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      drawCell(r, c);
    }
  }

  drawCursor();
  updateParticles();
  drawParticles();
}

function drawCell(r, c) {
  const x = c * cellSize, y = r * cellSize;
  const cell = board[r][c];
  const cs = cellSize;

  if (cell.revealed) {
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(x, y, cs, cs);

    if (cell.mine) {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(x + cs / 2, y + cs / 2, cs * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // Spikes
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = Math.max(1.5, cs * 0.08);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + cs / 2 + Math.cos(angle) * cs * 0.18, y + cs / 2 + Math.sin(angle) * cs * 0.18);
        ctx.lineTo(x + cs / 2 + Math.cos(angle) * cs * 0.4, y + cs / 2 + Math.sin(angle) * cs * 0.4);
        ctx.stroke();
      }
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(x + cs / 2, y + cs / 2, cs * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (cell.adjacent > 0) {
      ctx.fillStyle = NUM_COLORS[cell.adjacent] || '#fff';
      ctx.font = 'bold ' + Math.floor(cs * 0.62) + 'px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.adjacent, x + cs / 2, y + cs / 2 + 1);
    }
  } else {
    // 3D raised effect
    ctx.fillStyle = '#2e4155';
    ctx.fillRect(x, y, cs, cs);
    ctx.fillStyle = '#3d5266';
    ctx.fillRect(x, y, cs, 2);
    ctx.fillRect(x, y, 2, cs);
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(x + cs - 2, y, 2, cs);
    ctx.fillRect(x, y + cs - 2, cs, 2);
    ctx.fillStyle = '#4a6075';
    ctx.fillRect(x + 2, y + 2, cs - 4, 1);
    ctx.fillRect(x + 2, y + 2, 1, cs - 4);

    if (cell.flagged) {
      const fx = x + cs / 2, fy = y + cs / 2;
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = Math.max(1.5, cs * 0.09);
      ctx.beginPath();
      ctx.moveTo(fx, fy + cs * 0.28);
      ctx.lineTo(fx, fy - cs * 0.28);
      ctx.stroke();
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(fx, fy - cs * 0.28);
      ctx.lineTo(fx + cs * 0.22, fy - cs * 0.14);
      ctx.lineTo(fx, fy);
      ctx.fill();
    }
  }

  // Grid
  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, cs, cs);
}

function drawCursor() {
  const cfg = DIFFICULTIES[difficulty];
  if (cursorX < 0) cursorX = 0;
  if (cursorX >= cfg.cols) cursorX = cfg.cols - 1;
  if (cursorY < 0) cursorY = 0;
  if (cursorY >= cfg.rows) cursorY = cfg.rows - 1;
  const x = cursorX * cellSize, y = cursorY * cellSize;
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3);
}

// ── Particles ───────────────────────────────────────────────────────
function spawnExplosionParticles(r, c) {
  const cx = c * cellSize + cellSize / 2;
  const cy = r * cellSize + cellSize / 2;
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      color: ['#e74c3c', '#f39c12', '#fff'][Math.floor(Math.random() * 3)],
      size: 2 + Math.random() * 4
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 0.03;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Touch handling ──────────────────────────────────────────────────
let touchHoldTimer = null;
let touchStartCell = null;
const LONG_PRESS_MS = 400;

function getCellFromEvent(e) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;
  const cfg = DIFFICULTIES[difficulty];
  const c = Math.floor(x / cellSize);
  const r = Math.floor(y / cellSize);
  if (r >= 0 && r < cfg.rows && c >= 0 && c < cfg.cols) return { r: r, c: c };
  return null;
}

function setupTouchHandlers() {
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;
    touchStartCell = cell;
    touchHoldTimer = setTimeout(function() {
      toggleFlag(cell.r, cell.c);
      touchStartCell = null;
      touchHoldTimer = null;
    }, LONG_PRESS_MS);
  }, { passive: false });

  canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (touchHoldTimer) { clearTimeout(touchHoldTimer); touchHoldTimer = null; }
    if (!touchStartCell) return;
    const cell = getCellFromEvent(e);
    if (cell && cell.r === touchStartCell.r && cell.c === touchStartCell.c) {
      handleCellClick(cell.r, cell.c);
    }
    touchStartCell = null;
  }, { passive: false });

  canvas.addEventListener('touchmove', function(e) {
    if (touchHoldTimer) { clearTimeout(touchHoldTimer); touchHoldTimer = null; }
  }, { passive: true });

  canvas.addEventListener('click', function(e) {
    const cell = getCellFromEvent(e);
    if (cell) handleCellClick(cell.r, cell.c);
  });

  canvas.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (cell) toggleFlag(cell.r, cell.c);
  });
}

// ── Keyboard handling ───────────────────────────────────────────────
function setupKeyboard() {
  document.addEventListener('keydown', function(e) {
    const cfg = DIFFICULTIES[difficulty];
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        cursorY = Math.max(0, cursorY - 1);
        draw();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        cursorY = Math.min(cfg.rows - 1, cursorY + 1);
        draw();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        cursorX = Math.max(0, cursorX - 1);
        draw();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        cursorX = Math.min(cfg.cols - 1, cursorX + 1);
        draw();
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleCellClick(cursorY, cursorX);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        if (gameState === 'idle') {
          gameState = 'playing';
          firstClick = false;
          startTimer();
        }
        toggleFlag(cursorY, cursorX);
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        hideGameOverOverlay();
        newGame(difficulty);
        break;
    }
  });
}

// ── Animation loop ─────────────────────────────────────────────────
let animFrameId = null;

function animLoop() {
  if (particles.length > 0) {
    draw();
  }
  animFrameId = requestAnimationFrame(animLoop);
}

// ── Global API ─────────────────────────────────────────────────────
window.msNewGame = newGame;
window.msGetDifficulty = getCurrentDifficulty;

// ── Init ────────────────────────────────────────────────────────────
function init() {
  canvas = document.getElementById('ms-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  newGame('beginner');
  setupTouchHandlers();
  setupKeyboard();
  animLoop();

  // Difficulty buttons
  var diffBtns = document.querySelectorAll('.ms-diff-btn[data-diff]');
  for (var i = 0; i < diffBtns.length; i++) {
    diffBtns[i].addEventListener('click', (function(btn) {
      return function() {
        var diff = btn.dataset.diff;
        hideGameOverOverlay();
        newGame(diff);
        document.querySelectorAll('.ms-diff-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      };
    })(diffBtns[i]));
  }

  // Restart button (the 🔄 button)
  var restartBtns = document.querySelectorAll('.ms-controls .ms-diff-btn[onclick]');
  for (var j = 0; j < restartBtns.length; j++) {
    if (restartBtns[j].title === 'Restart') {
      restartBtns[j].addEventListener('click', function() {
        hideGameOverOverlay();
        newGame(getCurrentDifficulty());
      });
    }
  }

  // Resize
  window.addEventListener('resize', function() { resizeCanvas(); draw(); });

  // Focus canvas for keyboard
  canvas.setAttribute('tabindex', '0');
  canvas.style.outline = 'none';
  canvas.focus();

  // Refocus canvas after interactions
  document.addEventListener('click', function(e) {
    if (e.target !== canvas && (!canvas || !canvas.contains(e.target)) && e.target.tagName !== 'BUTTON') {
      setTimeout(function() { if (canvas) canvas.focus(); }, 50);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
