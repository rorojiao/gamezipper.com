// Fruit Slash - Slice fruits with swift swipes!
// Mobile touch + desktop mouse support

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ── Fruit Types ──────────────────────────────────────────────
const FRUIT_TYPES = [
  { emoji: '🍎', color: '#ff4444', points: 1 },
  { emoji: '🍊', color: '#ff9944', points: 1 },
  { emoji: '🍋', color: '#ffe044', points: 1 },
  { emoji: '🍇', color: '#aa44ff', points: 1 },
  { emoji: '🍉', color: '#ff4466', points: 1 },
  { emoji: '🍓', color: '#ff2244', points: 1 },
  { emoji: '🥝', color: '#44cc66', points: 1 },
  { emoji: '🍑', color: '#ffaa88', points: 1 },
  { emoji: '💀', color: '#222', points: 0 },   // BOMB — game over
];

// ── Game State ───────────────────────────────────────────────
let state = 'menu'; // menu | playing | gameover
let score = 0;
let combo = 1;
let timeLeft = 60;
let fruits = [];
let particles = [];
let bladeTrails = [];
let timerInterval = null;
let spawnTimer = 0;
let spawnInterval = 900; // ms between spawns
let bestScore = parseInt(localStorage.getItem('fruitSlashBest') || '0');
let slashCount = 0; // fruits sliced this swipe

// ── Fruit class ─────────────────────────────────────────────
class Fruit {
  constructor() {
    const typeIdx = Math.random() < 0.12 ? 8 : Math.floor(Math.random() * 8);
    const type = FRUIT_TYPES[typeIdx];
    this.type = type;
    this.isBomb = typeIdx === 8;

    // Spawn from bottom, random x
    this.x = 80 + Math.random() * (W - 160);
    this.y = H + 60;
    this.r = 36 + Math.random() * 14;

    // Launch velocity — upward with slight horizontal
    const speed = 11 + Math.random() * 5;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    this.vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1) * 0.4;
    this.vy = Math.sin(angle) * speed;

    this.gravity = 0.28;
    this.rotation = 0;
    this.rotSpeed = (Math.random() - 0.5) * 0.12;
    this.sliced = false;
    this.alpha = 1;
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;

    // Sliced fruit halves fly apart
    if (this.sliced) {
      this.alpha -= 0.05;
    }

    return this.alpha > 0 && this.y < H + 200;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.font = `${this.r * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.emoji, 0, 0);
    ctx.restore();

    // Glow ring for bombs
    if (this.isBomb && !this.sliced) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,50,50,0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Check if a slash line segment intersects this fruit
  hits(x1, y1, x2, y2) {
    if (this.sliced) return false;
    const dx = x2 - x1, dy = y2 - y1;
    const fx = this.x - x1, fy = this.y - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;
    const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / (len * len)));
    const nearX = x1 + t * dx, nearY = y1 + t * dy;
    const dist = Math.sqrt((nearX - this.x) ** 2 + (nearY - this.y) ** 2);
    return dist < this.r * 0.85;
  }
}

// ── Particle ─────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 2;
    this.r = 3 + Math.random() * 5;
    this.color = color;
    this.alpha = 1;
    this.life = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.life -= 0.025;
    this.alpha = this.life;
    return this.life > 0;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// ── Juice Splash ─────────────────────────────────────────────
class JuiceSplash {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.drops = [];
    for (let i = 0; i < 10; i++) {
      this.drops.push(new Particle(x, y, color));
    }
  }

  update() {
    this.drops = this.drops.filter(d => d.update());
    return this.drops.length > 0;
  }

  draw() {
    this.drops.forEach(d => d.draw());
  }
}

let juiceSplashes = [];

// ── Blade Trail ──────────────────────────────────────────────
class BladeTrail {
  constructor() {
    this.points = [];
    this.age = 0;
    this.maxAge = 18;
  }

  add(x, y) {
    this.points.push({ x, y, age: 0 });
    if (this.points.length > 40) this.points.shift();
  }

  update() {
    this.age++;
    this.points.forEach(p => p.age++);
    this.points = this.points.filter(p => p.age < this.maxAge);
    return this.points.length > 0;
  }

  draw() {
    if (this.points.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];
      const progress = p2.age / this.maxAge;
      const alpha = 1 - progress;
      const width = (1 - progress) * 8 + 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.9})`;
      ctx.lineWidth = width;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.restore();
  }
}

let bladeTrail = null;

// ── Combo Text ───────────────────────────────────────────────
let comboTexts = [];

function spawnComboText(x, y, text, color) {
  comboTexts.push({ x, y, text, color, alpha: 1, vy: -2, scale: 1.5 });
}

function updateComboTexts() {
  comboTexts = comboTexts.filter(c => {
    c.y += c.vy;
    c.alpha -= 0.025;
    c.scale = Math.max(1, c.scale - 0.03);
    return c.alpha > 0;
  });
}

function drawComboTexts() {
  comboTexts.forEach(c => {
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.font = `bold ${Math.round(28 * c.scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = c.color;
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 10;
    ctx.fillText(c.text, c.x, c.y);
    ctx.restore();
  });
}

// ── Slash Input ─────────────────────────────────────────────
let isSlashing = false;
let lastX = 0, lastY = 0;
let currentBlade = null;

function startSlash(x, y) {
  isSlashing = true;
  slashCount = 0;
  lastX = x;
  lastY = y;
  currentBlade = new BladeTrail();
  currentBlade.add(x, y);
  bladeTrail = currentBlade;
}

function moveSlash(x, y) {
  if (!isSlashing) return;
  currentBlade.add(x, y);

  // Check hits
  fruits.forEach(f => {
    if (!f.sliced && f.hits(lastX, lastY, x, y)) {
      f.sliced = true;
      slashCount++;
      spawnJuice(f.x, f.y, f.type.color);

      if (f.isBomb) {
        // GAME OVER
        endGame(true);
        return;
      }

      // Score
      score += f.type.points * combo;
      updateHUD();
    }
  });

  // Combo: 3+ in one swipe
  if (slashCount >= 3) {
    combo = 2;
    const midX = (lastX + x) / 2;
    const midY = (lastY + y) / 2;
    spawnComboText(midX, midY, 'COMBO x2!', '#ff6b6b');
    updateHUD();
  } else {
    combo = 1;
    updateHUD();
  }

  lastX = x;
  lastY = y;
}

function endSlash() {
  if (!isSlashing) return;
  isSlashing = false;
  slashCount = 0;
  combo = 1;
  updateHUD();
  setTimeout(() => { bladeTrail = null; }, 500);
}

// ── Mouse Events ─────────────────────────────────────────────
canvas.addEventListener('mousedown', e => {
  if (state !== 'playing') return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  startSlash(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('mousemove', e => {
  if (state !== 'playing' || !isSlashing) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  moveSlash(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('mouseup', endSlash);
canvas.addEventListener('mouseleave', endSlash);

// ── Touch Events ─────────────────────────────────────────────
canvas.addEventListener('touchstart', e => {
  if (state !== 'playing') return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  startSlash(t.clientX - rect.left, t.clientY - rect.top);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  if (state !== 'playing' || !isSlashing) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  moveSlash(t.clientX - rect.left, t.clientY - rect.top);
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  endSlash();
}, { passive: false });

canvas.addEventListener('touchcancel', endSlash);

// ── Juice Helper ─────────────────────────────────────────────
function spawnJuice(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push(new Particle(x, y, color));
  }
}

// ── Spawn ────────────────────────────────────────────────────
function spawnFruit() {
  fruits.push(new Fruit());
}

// ── HUD ─────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('score-val').textContent = score;
  document.getElementById('combo-val').textContent = 'x' + combo;
}

// ── Game Loop ────────────────────────────────────────────────
let lastTime = 0;

function gameLoop(ts) {
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;

  ctx.clearRect(0, 0, W, H);

  if (state === 'playing') {
    // Spawn fruits
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      spawnFruit();
      spawnTimer = 0;
      // Occasionally spawn 2 at once for difficulty
      if (Math.random() < 0.25) spawnFruit();
    }

    // Update fruits
    fruits = fruits.filter(f => f.update());

    // Update particles
    particles = particles.filter(p => p.update());
    juiceSplashes = juiceSplashes.filter(j => j.update());

    // Update blade trail
    if (currentBlade) currentBlade.update();

    // Update combo texts
    updateComboTexts();

    // Draw
    fruits.forEach(f => f.draw());
    particles.forEach(p => p.draw());
    juiceSplashes.forEach(j => j.draw());
    if (currentBlade) currentBlade.draw();
    drawComboTexts();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(gameLoop); });

// ── Start Game ───────────────────────────────────────────────
function startGame() {
  state = 'playing';
  score = 0;
  combo = 1;
  timeLeft = 60;
  fruits = [];
  particles = [];
  juiceSplashes = [];
  comboTexts = [];
  slashCount = 0;
  spawnTimer = 0;
  spawnInterval = 900;

  updateHUD();
  document.getElementById('timer-val').textContent = timeLeft;
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('blade-hint').style.display = 'block';
  setTimeout(() => {
    const hint = document.getElementById('blade-hint');
    if (hint) hint.style.display = 'none';
  }, 3000);

  // Timer
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer-val').textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame(false);
    }
    // Speed up over time
    if (timeLeft % 15 === 0 && spawnInterval > 500) {
      spawnInterval -= 80;
    }
  }, 1000);
}

function endGame(bombHit) {
  state = 'gameover';
  clearInterval(timerInterval);
  endSlash();

  if (bombHit) {
    // Big explosion
    for (let i = 0; i < 40; i++) {
      particles.push(new Particle(W / 2, H / 2, '#ff4444'));
    }
  }

  const isNewBest = score > bestScore;
  if (isNewBest) {
    bestScore = score;
    localStorage.setItem('fruitSlashBest', bestScore);
  }

  setTimeout(() => {
    const overlay = document.getElementById('overlay');
    overlay.querySelector('h2').textContent = bombHit ? '💥 BOOM!' : "⏱️ Time's Up!";
    overlay.querySelector('.sub').textContent = bombHit ? 'You hit a bomb!' : 'Great slicing!';
    document.getElementById('final-display').style.display = 'block';
    document.getElementById('final-score-val').textContent = score;
    document.getElementById('best-display').textContent = isNewBest
      ? '🏆 New Best Score!'
      : `Best: ${bestScore}`;
    document.getElementById('start-btn').textContent = '🔄 Play Again';
    document.getElementById('how-to').style.display = 'none';
    overlay.style.display = 'flex';
  }, bombHit ? 600 : 100);
}

// ── Init ─────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', startGame);

// Show best on menu
if (bestScore > 0) {
  document.getElementById('best-display').textContent = `Best: ${bestScore}`;
}
